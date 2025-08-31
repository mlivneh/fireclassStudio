

/**
 * @file Cloud Functions for Vibe Studio.
 * @description Handles AI app generation by directly accessing the FireClass DB for verification.
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { BitlyClient } = require('bitly');
const qrcode = require('qrcode');

// Define secrets
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const bitlyAccessToken = defineSecret("BITLY_ACCESS_TOKEN");
const fireclassServiceAccount = defineSecret("FIRECLASS_SERVICE_ACCOUNT");

// --- Initialize Primary App (fireStudio) ---
admin.initializeApp();
const firestore = admin.firestore();

// --- Lazily Initialize Secondary App (fireClass) ---
let fireClassAdminApp = null;
function getFireClassDb() {
    if (!fireClassAdminApp) {
        try {
            const serviceAccount = JSON.parse(fireclassServiceAccount.value());
            fireClassAdminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            }, 'fireClassApp');
        } catch (e) {
            console.error("CRITICAL: Failed to parse FIRECLASS_SERVICE_ACCOUNT secret.", e);
            return null;
        }
    }
    return fireClassAdminApp.firestore();
}

/**
 * Verifies teacher registration by directly querying the FireClass Firestore database.
 */
async function verifyTeacherRegistration(email) {
    const fireClassDb = getFireClassDb();
    if (!fireClassDb) return false;
    try {
        const teachersRef = fireClassDb.collection("teachers");
        const snapshot = await teachersRef.where("profile.email", "==", email.toLowerCase()).limit(1).get();
        return !snapshot.empty;
    } catch (error) {
        console.error("Error querying FireClass database:", error);
        return false;
    }
}

/**
 * Gets teacher details (like schoolCode) from the FireClass database.
 */
async function getTeacherDetails(email) {
    const fireClassDb = getFireClassDb();
    if (!fireClassDb) return null;
    try {
        const snapshot = await fireClassDb.collection("teachers").where("profile.email", "==", email.toLowerCase()).limit(1).get();
        if (!snapshot.empty) {
            return snapshot.docs[0].data().profile;
        }
        return null;
    } catch (error) {
        console.error("Error getting teacher details:", error);
        return null;
    }
}

/**
 * Saves app metadata to Firestore.
 */
async function saveMetadata(appData, urls, authContext, teacherDetails) {
    const docData = {
        appName: appData.appName,
        gradeLevel: appData.gradeLevel,
        domain: appData.domain,
        subDomain: appData.subDomain,
        pedagogicalExplanation: appData.pedagogy,
        app_url: urls.longUrl,
        teacher_uid: authContext.uid,
        teacher_name: authContext.token.name || authContext.token.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        schoolCode: teacherDetails ? teacherDetails.schoolCode || '000000000' : '000000000'
    };
    const docRef = await firestore.collection("community_apps").add(docData);
    return docRef;
}

exports.publishHtml = onCall({ 
    secrets: [bitlyAccessToken, fireclassServiceAccount]
}, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    
    const email = request.auth.token.email;
    if (!email) throw new HttpsError("invalid-argument", "User email is not available.");

    const [isTeacher, teacherDetails] = await Promise.all([
        verifyTeacherRegistration(email),
        getTeacherDetails(email)
    ]);

    if (!isTeacher) {
        throw new HttpsError("permission-denied", "This action is restricted to registered teachers only.");
    }

    const {htmlContent, ...appData} = request.data;
    if (!htmlContent) throw new HttpsError("invalid-argument", "HTML content is missing.");

    const bucket = admin.storage().bucket();
    const filePath = `apps/${request.auth.uid}/${Date.now()}/index.html`;
    const file = bucket.file(filePath);
    const downloadToken = require('crypto').randomUUID();

    // FIX: Ensure UTF-8 encoding for Hebrew characters
    await file.save(htmlContent, { 
        contentType: 'text/html; charset=utf-8', 
        metadata: { firebaseStorageDownloadTokens: downloadToken } 
    });

    const encodedPath = encodeURIComponent(filePath);
    const longUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
    
    const docRef = await saveMetadata(appData, { longUrl }, request.auth, teacherDetails);

    try {
        const bitly = new BitlyClient(bitlyAccessToken.value());
        const shortUrl = (await bitly.shorten(longUrl)).link;
        const qrCodeDataUrl = await qrcode.toDataURL(longUrl);

        await docRef.update({ shortUrl: shortUrl, qrCodeDataUrl: qrCodeDataUrl });

        return {success: true, longUrl, shortUrl, qrCodeDataUrl};
    } catch (error) {
        console.error("Error with Bit.ly or QR Code:", error);
        return {success: true, longUrl, shortUrl: longUrl, qrCodeDataUrl: null};
    }
});

exports.askVibeAI = onCall({ secrets: [geminiApiKey] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }
    const userPrompt = request.data.prompt;
    const language = request.data.language === 'en' ? 'English' : 'Hebrew';

    if (!userPrompt) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'prompt' argument.");
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const jsonSchema = {
        type: "OBJECT",
        properties: {
            htmlCode: { type: "STRING", description: "The complete, single-file HTML code for the educational applet. It must include TailwindCSS from a CDN and all CSS and JavaScript must be inline within the HTML file." },
            metadata: {
                type: "OBJECT",
                properties: {
                    appName: { type: "STRING", description: `A short, descriptive name for the app in ${language}.` },
                    gradeLevel: { type: "STRING", description: `The target grade level, e.g., 'כיתה ג' or 'Grade 3', in ${language}.` },
                    domain: { type: "STRING", description: `The main educational subject in ${language}, e.g., 'מתמטיקה' or 'Math'.` },
                    subDomain: { type: "STRING", description: `The specific topic within the domain in ${language}, e.g., 'שברים פשוטים' or 'Fractions'.` },
                    pedagogicalExplanation: { type: "STRING", description: `A brief explanation of the pedagogical goal of the applet in ${language}.` }
                },
            }
        },
    };
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    });
    const systemInstruction = `You are an expert developer specializing in creating interactive, single-file HTML educational applets for teachers... Your entire response must be a single JSON object matching the provided schema. All text inside the metadata object must be in ${language}.`;
    const fullPrompt = `${systemInstruction}\n\nTeacher's Request: "${userPrompt}"`;

    try {
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new HttpsError("internal", "Failed to get a response from the AI model.");
    }
});