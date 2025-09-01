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

/**
 * Constructs initial Mega-Prompt from persona, template, and content
 */
function constructMegaPrompt(persona, template, content, language) {
    const baseSystemInstruction = `You are an expert developer specializing in creating interactive, single-file HTML educational applets for teachers. 

Your entire response must be a single JSON object matching the provided schema. All text inside the metadata object must be in ${language === 'en' ? 'English' : 'Hebrew'}.

The applet must:
- Be a complete, self-contained HTML file
- Include TailwindCSS from CDN
- Have all CSS and JavaScript inline within the HTML
- Be mobile-friendly and responsive
- Include clear, commented code
- Be pedagogically sound and engaging for students`;

    const megaPrompt = `${baseSystemInstruction}

--- AI Persona (Teaching Style) ---
${persona || 'Default Teacher: Use a friendly and encouraging tone.'}

--- Teacher's Request (Activity + Content) ---
${template || 'Create an interactive educational activity.'}

--- Specific Content ---
${content || 'Please create appropriate educational content.'}`;

    return megaPrompt;
}

/**
 * Constructs refinement prompt for existing app
 */
function constructRefinementPrompt(currentApp, refinementRequest, language) {
    const systemInstruction = `You are an expert developer specializing in creating interactive, single-file HTML educational applets for teachers.

You are helping a teacher refine an existing educational app. The teacher will describe what changes they want.

Your entire response must be a single JSON object matching the provided schema. All text inside the metadata object must be in ${language === 'en' ? 'English' : 'Hebrew'}.

The refined applet must:
- Be a complete, self-contained HTML file
- Include TailwindCSS from CDN
- Have all CSS and JavaScript inline within the HTML
- Be mobile-friendly and responsive
- Include clear, commented code
- Be pedagogically sound and engaging for students`;

    const refinementPrompt = `${systemInstruction}

--- Current App HTML Code ---
${currentApp.htmlCode}

--- Current App Metadata ---
${JSON.stringify(currentApp.metadata, null, 2)}

--- Teacher's Refinement Request ---
${refinementRequest}

Please modify the app according to the teacher's request and return the updated version.`;

    return refinementPrompt;
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
    
    const promptData = request.data.prompt;
    const currentApp = request.data.currentApp; // NEW: Current app for refinement
    const language = request.data.language === 'en' ? 'English' : 'Hebrew';

    if (!promptData) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'prompt' argument.");
    }

    let megaPrompt;
    let isRefinement = false;

    if (currentApp && currentApp.htmlCode) {
        // REFINEMENT MODE: Modify existing app
        isRefinement = true;
        megaPrompt = constructRefinementPrompt(currentApp, promptData.content || promptData, language);
    } else {
        // INITIAL CREATION MODE: Create new app from scratch
        megaPrompt = constructMegaPrompt(
            promptData.persona,
            promptData.template, 
            promptData.content,
            language
        );
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    
    const jsonSchema = {
        type: "OBJECT",
        properties: {
            htmlCode: { 
                type: "STRING", 
                description: "The complete, single-file HTML code for the educational applet. It must include TailwindCSS from a CDN and all CSS and JavaScript must be inline within the HTML file." 
            },
            metadata: {
                type: "OBJECT",
                properties: {
                    appName: { 
                        type: "STRING", 
                        description: `A short, descriptive name for the app in ${language}.` 
                    },
                    gradeLevel: { 
                        type: "STRING", 
                        description: `The target grade level, e.g., 'כיתה ג' or 'Grade 3', in ${language}.` 
                    },
                    domain: { 
                        type: "STRING", 
                        description: `The main educational subject in ${language}, e.g., 'מתמטיקה' or 'Math'.` 
                    },
                    subDomain: { 
                        type: "STRING", 
                        description: `The specific topic within the domain in ${language}, e.g., 'שברים פשוטים' or 'Fractions'.` 
                    },
                    pedagogicalExplanation: { 
                        type: "STRING", 
                        description: `A brief explanation of the pedagogical goal of the applet in ${language}.` 
                    }
                },
            }
        },
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Updated to Gemini 2.5 (without -001 for @google/generative-ai)
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    });

    try {
        const result = await model.generateContent(megaPrompt);
        const responseText = result.response.text();
        const parsedContent = JSON.parse(responseText);

        // Store the generation in Firestore for analytics
        const generationRef = admin.firestore().collection('generations').doc();
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90); // 90 יום מהיום
        
        await generationRef.set({
            uid: request.auth.uid,
            prompt: promptData,
            currentApp: currentApp || null,
            isRefinement: isRefinement,
            language: language,
            response: parsedContent,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            model: "gemini-2.5-flash",
            expireAt: expiryDate // הוספת שדה התפוגה
        });

        console.log('✅ [ASK_VIBE_AI] AI generation completed successfully');
        
        return {
            success: true,
            content: parsedContent,
            isRefinement: isRefinement,
            generationId: generationRef.id
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new HttpsError("internal", "Failed to get a response from the AI model.");
    }
});

// Function to save current work session
exports.saveWorkSession = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const {sessionName, currentApp, originalPrompt, sessionHistory} = request.data;
    
    if (!currentApp || !sessionName) {
        throw new HttpsError("invalid-argument", "Session name and current app are required.");
    }

    try {
        const sessionRef = admin.firestore().collection('work_sessions').doc();

        // --- הוספת לוגיקת תפוגה ---
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 יום מהיום
        // --------------------------
        
        await sessionRef.set({
            uid: request.auth.uid,
            sessionName: sessionName,
            currentApp: currentApp,
            originalPrompt: originalPrompt || null,
            sessionHistory: sessionHistory || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            expireAt: expiryDate // הוספת שדה התפוגה
        });

        console.log('✅ [SAVE_WORK_SESSION] Work session saved successfully');
        
        return {
            success: true,
            sessionId: sessionRef.id,
            message: "Work session saved successfully"
        };

    } catch (error) {
        console.error('❌ [SAVE_WORK_SESSION] Save failed:', error);
        throw new HttpsError('internal', `Failed to save work session: ${error.message}`);
    }
});

// Function to load work session
exports.loadWorkSession = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const {sessionId} = request.data;
    
    if (!sessionId) {
        throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    try {
        const sessionRef = admin.firestore().collection('work_sessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
            throw new HttpsError("not-found", "Work session not found.");
        }

        const sessionData = sessionDoc.data();
        
        // Verify ownership
        if (sessionData.uid !== request.auth.uid) {
            throw new HttpsError("permission-denied", "Access denied to this work session.");
        }

        // Update last accessed timestamp
        await sessionRef.update({
            lastAccessed: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ [LOAD_WORK_SESSION] Work session loaded successfully');
        
        return {
            success: true,
            session: sessionData
        };

    } catch (error) {
        console.error('❌ [LOAD_WORK_SESSION] Load failed:', error);
        throw new HttpsError('internal', `Failed to load work session: ${error.message}`);
    }
});

// Function to get user's work sessions list
exports.getUserWorkSessions = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    try {
        const sessionsRef = admin.firestore().collection('work_sessions')
            .where('uid', '==', request.auth.uid)
            .orderBy('lastUpdated', 'desc')
            .limit(20); // Limit to 20 most recent sessions

        const snapshot = await sessionsRef.get();
        const sessions = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                sessionName: data.sessionName,
                appName: data.currentApp?.metadata?.appName || 'Untitled App',
                createdAt: data.createdAt,
                lastUpdated: data.lastUpdated,
                status: data.status || 'active'
            });
        });

        console.log('✅ [GET_USER_WORK_SESSIONS] User work sessions retrieved successfully');
        
        return {
            success: true,
            sessions: sessions
        };

    } catch (error) {
        console.error('❌ [GET_USER_WORK_SESSIONS] Retrieval failed:', error);
        throw new HttpsError('internal', `Failed to retrieve work sessions: ${error.message}`);
    }
});

// Function to update app details (owner only)
exports.updateAppDetails = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const {appId, updatedDetails} = request.data;
    
    if (!appId || !updatedDetails) {
        throw new HttpsError("invalid-argument", "App ID and updated details are required.");
    }

    try {
        const appRef = admin.firestore().collection('community_apps').doc(appId);
        const appDoc = await appRef.get();

        if (!appDoc.exists) {
            throw new HttpsError("not-found", "App not found.");
        }

        const appData = appDoc.data();
        
        // Verify ownership
        if (appData.teacher_uid !== request.auth.uid) {
            throw new HttpsError("permission-denied", "Only the app owner can update details.");
        }

        // Update allowed fields only
        const allowedFields = ['appName', 'gradeLevel', 'domain', 'subDomain', 'pedagogicalExplanation'];
        const updateData = {};
        
        for (const field of allowedFields) {
            if (updatedDetails[field] !== undefined) {
                updateData[field] = updatedDetails[field];
            }
        }

        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await appRef.update(updateData);

        console.log('✅ [UPDATE_APP_DETAILS] App details updated successfully');
        
        return {
            success: true,
            message: "App details updated successfully"
        };

    } catch (error) {
        console.error('❌ [UPDATE_APP_DETAILS] Update failed:', error);
        throw new HttpsError('internal', `Update failed: ${error.message}`);
    }
});

// Function to delete applet (owner only)
exports.deleteApplet = onCall({ secrets: [fireclassServiceAccount] }, async (request) => {
    // שלב 1: וידוא שהמשתמש מחובר
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to delete an applet.');
    }

    const appId = request.data.id;
    const requesterId = request.auth.uid;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const appRef = db.collection('community_apps').doc(appId);

    try {
        const doc = await appRef.get();
        if (!doc.exists) {
            throw new HttpsError('not-found', 'Applet not found.');
        }

        const appData = doc.data();
        const ownerId = appData.teacher_uid;

        // שלב 2: וידוא בעלות (השלב הקריטי)
        if (ownerId !== requesterId) {
            throw new HttpsError('permission-denied', 'You can only delete your own applets.');
        }

        // שלב 3: מחיקת קבצים מהאחסון (Storage)
        if (appData.app_url) {
            const url = new URL(appData.app_url);
            const encodedPath = url.pathname.split('/o/')[1];
            if (encodedPath) {
                const decodedPath = decodeURIComponent(encodedPath);
                const folderPath = require('path').dirname(decodedPath) + '/';
                await bucket.deleteFiles({ prefix: folderPath });
            }
        }

        // שלב 4: מחיקת המסמך מ-Firestore
        await appRef.delete();

        console.log('✅ [DELETE_APPLET] Applet deleted successfully');
        
        return { success: true };

    } catch (error) {
        console.error("❌ [DELETE_APPLET] Deletion failed:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An error occurred while deleting the applet.');
    }
});