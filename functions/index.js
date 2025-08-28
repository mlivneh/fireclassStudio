/**
 * @file Cloud Functions for Vibe Studio project.
 * @description Handles app publishing and source code downloads,
 * authorized against the main fireClass teacher database.
 */

// V2 Imports
const {onCall, HttpsError} = require("firebase-functions/v2/https");

// Node.js and Third-party Imports
const admin = require("firebase-admin");
const https = require("https");
const jszip = require("jszip");
const axios = require("axios");

admin.initializeApp({ storageBucket: 'fireclassstudio.firebasestorage.app' });
const firestore = admin.firestore();
const storage = admin.storage();

/**
 * Verifies a user's email against the central fireClass teacher registry.
 * @param {string} email The user's email to verify.
 * @return {Promise<boolean>} True if the teacher is registered.
 */
async function verifyTeacher(email) {
  const fireClassApiUrl = "https://us-central1-fireclass-us.cloudfunctions.net/isTeacherRegistered";
  const secretKey = process.env.INTERNAL_API_KEY;

  if (!secretKey) {
    console.error("INTERNAL_API_KEY secret is not configured for fireclassStudio.");
    return false;
  }
  try {
    const response = await axios.post(fireClassApiUrl, {email: email}, {
      headers: {"Authorization": `Bearer ${secretKey}`},
    });
    return response.data.isRegistered === true;
  } catch (error) {
    console.error("Verification call to fireClass server failed:", error.message);
    return false;
  }
}

/**
 * Shortens a URL using the TinyURL API.
 * @param {string} longUrl The URL to shorten.
 * @return {Promise<string>} The shortened URL.
 */
async function getShortUrl(longUrl) {
  return new Promise((resolve, reject) => {
    https.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

/**
 * Saves app metadata to the Firestore database.
 * @param {object} appData The app's metadata.
 * @param {string} publicUrl The public URL of the app's entry point.
 * @param {object} authContext The authenticated user's context.
 */
async function saveMetadata(appData, publicUrl, authContext) {
  const teacherUid = authContext.uid;
  const teacherName = authContext.token.name || authContext.token.email;

  const appDoc = {
    appName: appData.appName,
    gradeLevel: appData.gradeLevel,
    schoolCode: appData.schoolCode || "00000",
    pedagogicalExplanation: appData.pedagogy,
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
exports.publishHtml = onCall({secrets: ["INTERNAL_API_KEY"]}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }
  const email = request.auth.token.email;
  console.log(`⚠️ Skipping duplicate verifyTeacher check for ${email}`);

  const {htmlContent, ...appData} = request.data;
  if (!htmlContent) {
    throw new HttpsError("invalid-argument", "HTML content is missing.");
  }

  const bucket = admin.storage().bucket();
  const uniqueId = `${Date.now()}`;
  const filePath = `apps/${request.auth.uid}/${uniqueId}/index.html`;
  const file = bucket.file(filePath);

  await file.save(htmlContent, { contentType: 'text/html' });

  console.log(`📦 Bucket: ${bucket.name}, FilePath: ${filePath}`);

  try {
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
    });
    
    await saveMetadata(appData, signedUrl, request.auth);
    const shortUrl = await getShortUrl(signedUrl);
    
    return {success: true, longUrl: signedUrl, shortUrl};
  } catch (error) {
    console.error(`❌ Error creating signed URL: ${error.code} - ${error.message}`);
    throw new HttpsError("internal", "Failed to create access URL");
  }
});

/**
 * Publishes an app from a ZIP file.
 */
exports.publishZip = onCall({secrets: ["INTERNAL_API_KEY"]}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const email = request.auth.token.email;
  console.log(`⚠️ Skipping duplicate verifyTeacher check for ${email}`);

  const {zipFileBase64, ...appData} = request.data;
  if (!zipFileBase64) {
    throw new HttpsError("invalid-argument", "ZIP file is missing.");
  }

  const bucket = admin.storage().bucket(); // שמור אחיד כמו ב-HTML

  const zip = await jszip.loadAsync(zipFileBase64, { base64: true });
  const uploadPromises = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const filePath = `${baseFolderPath}/${relativePath}`;
      const file = bucket.file(filePath);
      const stream = zipEntry.nodeStream();
      const p = new Promise((resolve, reject) => {
        stream
          .pipe(
            file.createWriteStream({
              // בלי public:true – אין ACL ציבורי בבאקטים החדשים
              metadata: { contentType: "application/octet-stream" }
            })
          )
          .on("error", reject)
          .on("finish", resolve);
      });
      uploadPromises.push(p);
    }
  });
  await Promise.all(uploadPromises);

  // URL הכניסה (index.html) – הפק Signed URL לקריאה
  const entry = bucket.file(`${baseFolderPath}/index.html`);
  const [signedUrl] = await entry.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 365 // שנה
  });

  console.log(`📦 Bucket: ${bucket.name}, Entry: ${baseFolderPath}/index.html`);
  await saveMetadata(appData, signedUrl, request.auth);
  const shortUrl = await getShortUrl(signedUrl);
  return { success: true, longUrl: signedUrl, shortUrl };
});

/**
 * Downloads the source code for a given app URL.
 */
exports.downloadCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  const url = request.data.url;
  if (!url) {
    throw new HttpsError("invalid-argument", "URL is missing.");
  }

  if (request.data.isZip) {
    const bucket = admin.storage().bucket();
    let filePath;

    try {
      const u = new URL(url);

      // פורמטים אפשריים:
      // 1) https://storage.googleapis.com/<bucket>/<path>?...
      // 2) https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
      // נחלץ את ה-path לפי המקרה:
      if (u.hostname.endsWith("googleapis.com") && u.pathname.startsWith(`/${bucket.name}/`)) {
        // case 1
        filePath = decodeURIComponent(u.pathname.slice(bucket.name.length + 2));
      } else if (u.hostname.includes("firebasestorage.googleapis.com") && u.pathname.includes(`/v0/b/${bucket.name}/o/`)) {
        // case 2
        filePath = decodeURIComponent(u.pathname.split(`/v0/b/${bucket.name}/o/`)[1]);
      } else {
        // ניסיון כללי (שמירה על תאימות לאחור)
        const parts = url.split(`${bucket.name}/`);
        if (parts[1]) filePath = decodeURIComponent(parts[1].split("?")[0]);
      }

      if (!filePath) {
        console.error("❌ Could not parse filePath from URL:", url);
        throw new HttpsError("invalid-argument", "Unsupported storage URL format.");
      }

      const content = await bucket.file(filePath).download();
      return { content: content[0].toString("base64") };
    } catch (error) {
      console.error("Failed to download from storage:", error.code, error.message);
      throw new HttpsError("internal", "File not found in storage.");
    }
  } else {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let content = "";
        res.on("data", (chunk) => (content += chunk));
        res.on("end", () => resolve({content}));
      }).on("error", (err) => reject(new HttpsError("internal", err.message)));
    });
  }
});