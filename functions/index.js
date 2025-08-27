/**
 * @file Cloud Functions for Vibe Studio project.
 * @description Handles app publishing and source code downloads,
 * authorized against the main fireClass teacher database.
 */

// V2 Imports
const {onCall} = require("firebase-functions/v2/https");

// Node.js and Third-party Imports
const admin = require("firebase-admin");
const https = require("https");
const jszip = require("jszip");
const axios = require("axios");

admin.initializeApp();
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
    throw new onCall.HttpsError("unauthenticated", "Auth required.");
  }
  const isVerifiedTeacher = await verifyTeacher(request.auth.token.email);
  if (!isVerifiedTeacher) {
    throw new onCall.HttpsError("permission-denied", "You are not a registered teacher.");
  }

  const {htmlContent, ...appData} = request.data;
  if (!htmlContent) {
    throw new onCall.HttpsError("invalid-argument", "HTML content is missing.");
  }

  const bucket = storage.bucket();
  const uniqueId = `${Date.now()}`;
  const filePath = `apps/${request.auth.uid}/${uniqueId}/index.html`;
  const file = bucket.file(filePath);

  await file.save(htmlContent, {metadata: {contentType: "text/html"}});
  await file.makePublic();

  const longUrl = file.publicUrl();
  await saveMetadata(appData, longUrl, request.auth);
  const shortUrl = await getShortUrl(longUrl);

  return {success: true, longUrl, shortUrl};
});

/**
 * Publishes an app from a ZIP file.
 */
exports.publishZip = onCall({secrets: ["INTERNAL_API_KEY"]}, async (request) => {
  if (!request.auth) {
    throw new onCall.HttpsError("unauthenticated", "Auth required.");
  }

  const isVerifiedTeacher = await verifyTeacher(request.auth.token.email);
  if (!isVerifiedTeacher) {
    throw new onCall.HttpsError("permission-denied", "You are not a registered teacher.");
  }

  const {zipFileBase64, ...appData} = request.data;
  if (!zipFileBase64) {
    throw new onCall.HttpsError("invalid-argument", "ZIP file is missing.");
  }

  const bucket = storage.bucket();
  const uniqueId = `${Date.now()}`;
  const baseFolderPath = `apps/${request.auth.uid}/${uniqueId}`;
  const zip = await jszip.loadAsync(zipFileBase64, {base64: true});

  const uploadPromises = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const filePath = `${baseFolderPath}/${relativePath}`;
      const file = bucket.file(filePath);
      const stream = zipEntry.nodeStream();
      const promise = new Promise((resolve, reject) => {
        stream.pipe(file.createWriteStream({public: true, contentType: "auto"}))
            .on("error", reject)
            .on("finish", resolve);
      });
      uploadPromises.push(promise);
    }
  });

  await Promise.all(uploadPromises);

  const longUrl = bucket.file(`${baseFolderPath}/index.html`).publicUrl();
  await saveMetadata(appData, longUrl, request.auth);
  const shortUrl = await getShortUrl(longUrl);

  return {success: true, longUrl, shortUrl};
});

/**
 * Downloads the source code for a given app URL.
 */
exports.downloadCode = onCall(async (request) => {
  if (!request.auth) {
    throw new onCall.HttpsError("unauthenticated", "Auth required.");
  }

  const url = request.data.url;
  if (!url) {
    throw new onCall.HttpsError("invalid-argument", "URL is missing.");
  }

  if (request.data.isZip) {
    const bucketName = "fireclassstudio.appspot.com";
    const filePath = decodeURIComponent(url.split(`${bucketName}/`)[1].split("?")[0]);
    try {
      const content = await storage.bucket(bucketName).file(filePath).download();
      return {content: content[0].toString("base64")};
    } catch (error) {
      console.error("Failed to download ZIP from storage:", error);
      throw new onCall.HttpsError("internal", "File not found in storage.");
    }
  } else {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let content = "";
        res.on("data", (chunk) => (content += chunk));
        res.on("end", () => resolve({content}));
      }).on("error", (err) => reject(new onCall.HttpsError("internal", err.message)));
    });
  }
});