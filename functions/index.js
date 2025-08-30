/**
 * @file Cloud Functions for Vibe Studio project.
 * @description Handles AI-powered app generation, publishing, and management.
 */

// V2 Imports
const {onCall, HttpsError} = require("firebase-functions/v2/https");

// Node.js and Third-party Imports
const admin = require("firebase-admin");
const https = require("https");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Gemini SDK

// Initialize Firebase
admin.initializeApp();
const firestore = admin.firestore();

// --- Main New Function for Gemini Integration ---

/**
 * Generates an HTML applet and its metadata using the Gemini API with structured output.
 */
exports.askVibeAI = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const userPrompt = request.data.prompt;
    const language = request.data.language === 'en' ? 'English' : 'Hebrew'; // Sanitize language input

    if (!userPrompt) {
        throw new HttpsError("invalid-argument", "The function must be called with a 'prompt' argument.");
    }

    // Initialize the Gemini client with the API key from secrets
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Define the JSON schema for the model's response, based on the spec
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
                    appName: { type: "STRING", description: `A short, descriptive name for the app in ${language}.` },
                    gradeLevel: { type: "STRING", description: `The target grade level, e.g., 'כיתה ג' or 'Grade 3', in ${language}.` },
                    domain: { type: "STRING", description: `The main educational subject in ${language}, e.g., 'מתמטיקה' or 'Math'.` },
                    subDomain: { type: "STRING", description: `The specific topic within the domain in ${language}, e.g., 'שברים פשוטים' or 'Fractions'.` },
                    pedagogicalExplanation: { type: "STRING", description: `A brief explanation of the pedagogical goal of the applet in ${language}.` }
                },
                required: ["appName", "gradeLevel", "domain", "subDomain", "pedagogicalExplanation"]
            }
        },
        required: ["htmlCode", "metadata"]
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Use a modern, capable model
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        },
    });

    // Construct the detailed prompt with system instructions
    const systemInstruction = `You are an expert developer specializing in creating interactive, single-file HTML educational applets for teachers.
    Follow these rules strictly:
    1. All code (HTML, CSS, JS) must be in a single HTML file.
    2. Use Tailwind CSS for styling by including '<script src="https://cdn.tailwindcss.com"></script>'.
    3. Ensure the applet is fully responsive and looks great on mobile devices.
    4. The code must be clean, well-commented, and functional.
    5. Your entire response must be a single JSON object matching the provided schema.
    6. All text inside the metadata object must be in ${language}.`;

    const fullPrompt = `${systemInstruction}\n\nTeacher's Request: "${userPrompt}"`;

    try {
        console.log("Sending prompt to Gemini API...");
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();
        console.log("Received response from Gemini API.");
        
        // The API guarantees a JSON string, so we parse it.
        const parsedJson = JSON.parse(responseText);
        return parsedJson;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new HttpsError("internal", "Failed to get a response from the AI model. The model may have been unable to generate content based on the prompt.");
    }
});


// --- Existing Functions (Updated to include new metadata fields) ---

/**
 * Saves app metadata to the Firestore database.
 * This function is now updated to accept the new fields from Gemini.
 */
async function saveMetadata(appData, publicUrl, authContext) {
    const teacherUid = authContext.uid;
    const teacherName = authContext.token.name || authContext.token.email;

    const appDoc = {
        appName: appData.appName,
        gradeLevel: appData.gradeLevel,
        domain: appData.domain, // New field
        subDomain: appData.subDomain, // New field
        schoolCode: appData.schoolCode || "00000",
        pedagogicalExplanation: appData.pedagogy, // 'pedagogy' from client form
        instructions: appData.instructions,
        app_url: publicUrl,
        teacher_uid: teacherUid,
        teacher_name: teacherName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await firestore.collection("community_apps").add(appDoc);
}

/**
 * Publishes an app from a single HTML string.
 */
exports.publishHtml = onCall(async (request) => {
    // This function remains largely the same but the data it receives is richer.
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
    const {htmlContent, ...appData} = request.data;
    if (!htmlContent) throw new HttpsError("invalid-argument", "HTML content is missing.");

    const bucket = admin.storage().bucket();
    const uniqueId = `${Date.now()}`;
    const filePath = `apps/${request.auth.uid}/${uniqueId}/index.html`;
    const file = bucket.file(filePath);
    const downloadToken = require('crypto').randomUUID();
    
    await file.save(htmlContent, {
        contentType: 'text/html',
        metadata: { firebaseStorageDownloadTokens: downloadToken }
    });

    const encodedPath = encodeURIComponent(filePath);
    const longUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
    
    await saveMetadata(appData, longUrl, request.auth);
    const shortUrl = await getShortUrl(longUrl); // Assuming getShortUrl exists
    
    return {success: true, longUrl, shortUrl};
});

/**
 * Updates the details of an existing application.
 */
exports.updateAppDetails = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in to edit an app.");
    }

    const { id, ...updatedData } = request.data;
    if (!id) {
        throw new HttpsError("invalid-argument", "The document ID is missing.");
    }

    const appRef = firestore.collection("community_apps").doc(id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
        throw new HttpsError("not-found", "The specified app does not exist.");
    }

    // Security check: Only the owner can edit the app.
    if (appDoc.data().teacher_uid !== request.auth.uid) {
        throw new HttpsError("permission-denied", "You do not have permission to edit this app.");
    }

    // Update the document with the new data from the form
    await appRef.update({
        ...updatedData, // Spreads all fields from updatedData
        appName: updatedData.appName,
        gradeLevel: updatedData.gradeLevel,
        domain: updatedData.domain,
        subDomain: updatedData.subDomain,
        schoolCode: updatedData.schoolCode,
        pedagogicalExplanation: updatedData.pedagogy,
        instructions: updatedData.instructions,
    });

    return { success: true, message: "App updated successfully." };
});


// Helper function for URL shortening (assuming it's needed)
async function getShortUrl(longUrl) {
    return new Promise((resolve, reject) => {
        https.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => resolve(body));
        }).on("error", reject);
    });
}

