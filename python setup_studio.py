import os
import subprocess
import webbrowser
import textwrap

# --- Helper Functions ---

def print_instruction(title, message):
    """Prints a formatted instruction box for the user."""
    width = 80
    print("\n" + "=" * width)
    print(f"|| {title.upper().center(width - 6)} ||")
    print("=" * width)
    wrapped_message = textwrap.fill(message, width - 4)
    for line in wrapped_message.split('\n'):
        print(f"| {line.ljust(width - 4)} |")
    print("=" * width)
    input("--> לחץ על Enter לאחר שסיימת את כל השלבים כדי להמשיך...")
    print("\n")

def run_command(command, cwd="."):
    """Runs a shell command and prints its output in real-time."""
    print(f"--- Running command: {' '.join(command)} ---")
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True, # Important for Windows compatibility
            cwd=cwd
        )
        for line in iter(process.stdout.readline, ''):
            print(line, end='')
        process.wait()
        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, command)
        print(f"--- Command finished successfully. ---\n")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"\n!!! ERROR running command: {' '.join(command)} !!!")
        print(f"Error details: {e}")
        exit(1)

def create_file(path, content):
    """Creates a new file with the given content."""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(textwrap.dedent(content))
        print(f"Successfully created file: {path}")
    except Exception as e:
        print(f"!!! ERROR creating file {path}: {e} !!!")
        exit(1)

# --- File Contents (Stored as multiline strings) ---

INDEX_HTML_CONTENT = """
<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vibe Studio - App Publisher</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="login-container" class="login-container">
        <h1>Vibe Studio Publisher</h1>
        <p>Enter your email to get a secure sign-in link.</p>
        <form id="login-form">
            <div class="form-group">
                <input type="email" id="email-input" class="form-input" placeholder="Enter your email" required>
            </div>
            <button type="submit" id="send-link-btn" class="btn btn-primary">Send Sign-In Link</button>
        </form>
        <div id="feedback-message" class="feedback-message"></div>
    </div>
    <div id="studio-container" class="studio-container" style="display: none;">
        <header>
            <h2>Vibe Studio</h2>
            <div>
                <button id="publisher-view-btn" class="btn btn-secondary active">Publisher</button>
                <button id="gallery-view-btn" class="btn btn-secondary">App Gallery</button>
                <button id="logout-btn" class="btn btn-secondary">Logout</button>
            </div>
        </header>
        <main id="publisher-view">
            <div class="form-panel">
                <h3>1. App Details</h3>
                <div class="form-group"><label for="app-name">App Name</label><input type="text" id="app-name" class="form-input" required></div>
                <div class="form-group"><label for="grade-level">Grade Level (K-12)</label><input type="text" id="grade-level" class="form-input" required></div>
                <div class="form-group"><label for="school-code">School Code (Optional)</label><input type="text" id="school-code" class="form-input" placeholder="Leave blank for public (00000)"></div>
                <div class="form-group"><label for="pedagogy">Pedagogical Explanation</label><textarea id="pedagogy" class="form-input" rows="4" required></textarea></div>
                <div class="form-group"><label for="instructions">Instructions (Optional)</label><textarea id="instructions" class="form-input" rows="3"></textarea></div>
            </div>
            <div class="upload-panel">
                <div class="upload-tabs">
                    <button id="paste-tab-btn" class="tab-btn active" data-view="paste-view">Paste HTML Code</button>
                    <button id="folder-tab-btn" class="tab-btn" data-view="folder-view">Upload Folder (ZIP)</button>
                </div>
                <div id="paste-view" class="upload-content">
                    <h3>2. Paste App Code</h3>
                    <button id="paste-btn" class="btn btn-secondary">Paste from Clipboard</button>
                    <textarea id="html-input" placeholder=""></textarea>
                    <button id="publish-html-btn" class="btn btn-primary">Publish Pasted Code</button>
                </div>
                <div id="folder-view" class="upload-content" style="display: none;">
                    <h3>2. Upload App Folder</h3>
                    <p>Zip your project folder and upload the single ZIP file.</p>
                    <input type="file" id="zip-input" accept=".zip">
                    <div id="file-list"></div>
                    <button id="publish-zip-btn" class="btn btn-primary">Publish ZIP File</button>
                </div>
                 <p id="publish-feedback"></p>
            </div>
        </main>
        <main id="gallery-view" style="display: none;">
             <h3>App Gallery</h3>
             <div id="gallery-grid"></div>
        </main>
    </div>
    <div id="results-modal" class="modal-overlay"><div class="modal-content"><div class="modal-header"><h3>App Published Successfully!</h3><button class="modal-close">&times;</button></div><p><strong>Full URL:</strong> <a id="result-long-url" href="#" target="_blank"></a></p><p><strong>Short URL:</strong> <a id="result-short-url" href="#" target="_blank"></a></p><div id="qrcode-container"></div></div></div>
    <div id="preview-modal" class="modal-overlay"><div class="modal-content large"><div class="modal-header"><h3 id="preview-title">Preview</h3><button class="modal-close">&times;</button></div><iframe id="preview-iframe"></iframe></div></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1/build/qrcode.min.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-functions.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script type="module" src="js/studio.js"></script>
</body>
</html>
"""

STYLE_CSS_CONTENT = """
/* Full CSS content from previous answers */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');:root{--primary-color:#667eea;--secondary-color:#764ba2;--light-gray:#f0f2f5;--dark-gray:#333;--text-color:#555;--border-color:#ddd;--success-color:#28a745;--error-color:#dc3545}body{font-family:'Roboto',sans-serif;margin:0;background-color:var(--light-gray);color:var(--text-color);display:flex;align-items:center;justify-content:center;min-height:100vh}.login-container{background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.1);padding:40px;width:100%;max-width:400px;text-align:center}.login-container h1{color:var(--dark-gray);margin-bottom:10px}.login-container p{margin-bottom:30px}.form-group{margin-bottom:20px;text-align:left}.form-group label{display:block;margin-bottom:5px;font-weight:500}.form-input{width:100%;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-size:16px;box-sizing:border-box}.btn{padding:12px;border:none;border-radius:8px;font-size:16px;font-weight:500;cursor:pointer;transition:all .2s ease}.btn-primary{background:linear-gradient(135deg,var(--primary-color),var(--secondary-color));color:white;width:100%}.btn-primary:hover:not(:disabled){box-shadow:0 5px 15px rgba(102,126,234,.4)}.btn:disabled{opacity:.6;cursor:not-allowed}.btn-secondary{background:#6c757d;color:white;width:auto;padding:8px 15px}.btn-secondary.active{background:var(--primary-color)}.feedback-message{margin-top:20px;padding:12px;border-radius:8px;display:none}.feedback-success{background-color:#d4edda;color:#155724}.feedback-error{background-color:#f8d7da;color:#721c24}.studio-container{width:100vw;height:100vh;display:flex;flex-direction:column;background:white}header{background:var(--dark-gray);color:white;padding:10px 25px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 5px rgba(0,0,0,.2);z-index:10}header h2{margin:0}header div{display:flex;gap:10px}main{flex-grow:1;display:flex;overflow:hidden}.form-panel{width:450px;min-width:450px;padding:25px;border-right:1px solid var(--border-color);overflow-y:auto;background:#fafafa}.upload-panel{flex-grow:1;padding:25px;display:flex;flex-direction:column}.upload-tabs{display:flex;border-bottom:1px solid var(--border-color);margin-bottom:20px}.tab-btn{padding:10px 20px;border:none;background:0 0;cursor:pointer;font-size:16px;border-bottom:3px solid transparent}.tab-btn.active{border-bottom:3px solid var(--primary-color);font-weight:700;color:var(--dark-gray)}.upload-content textarea{height:300px;width:100%;border:1px solid var(--border-color);border-radius:8px;resize:none;font-family:monospace;margin-top:10px;margin-bottom:20px}.upload-content p{margin-top:0}#file-list{margin-top:10px;font-style:italic;color:#666}#publish-feedback{margin-top:15px;font-weight:500}#gallery-view{flex-direction:column;padding:25px;overflow-y:auto;background-color:var(--light-gray)}#gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}.app-card{border:1px solid var(--border-color);border-radius:8px;padding:15px;background:white;box-shadow:0 2px 5px rgba(0,0,0,.05);display:flex;flex-direction:column;justify-content:space-between}.app-card h4{margin:0 0 10px 0}.app-card p{font-size:14px;margin:4px 0;color:#666}.app-card-actions{margin-top:15px;display:flex;gap:10px}.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:1000}.modal-content{background:white;border-radius:12px;padding:25px;max-width:500px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,.2)}.modal-content.large{max-width:90vw;height:80vh;display:flex;flex-direction:column}.modal-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:15px;margin-bottom:20px}.modal-header h3{margin:0}.modal-close{border:none;background:0 0;font-size:24px;cursor:pointer;color:#888}#qrcode-container{margin:20px auto;width:200px;height:200px;display:flex;align-items:center;justify-content:center}#preview-iframe{width:100%;height:100%;border:none;flex-grow:1}
"""

STUDIO_JS_CONTENT = """
// Full studio.js content from previous answers
firebase.initializeApp(firebaseConfig);const auth=firebase.auth(),functions=firebase.functions(),firestore=firebase.firestore(),loginContainer=document.getElementById("login-container"),studioContainer=document.getElementById("studio-container"),publisherView=document.getElementById("publisher-view"),galleryView=document.getElementById("gallery-view"),loginForm=document.getElementById("login-form"),emailInput=document.getElementById("email-input"),sendLinkBtn=document.getElementById("send-link-btn"),feedbackMessage=document.getElementById("feedback-message"),logoutBtn=document.getElementById("logout-btn"),galleryViewBtn=document.getElementById("gallery-view-btn"),publisherViewBtn=document.getElementById("publisher-view-btn"),pasteTabBtn=document.getElementById("paste-tab-btn"),folderTabBtn=document.getElementById("folder-tab-btn"),pasteView=document.getElementById("paste-view"),folderView=document.getElementById("folder-view"),pasteBtn=document.getElementById("paste-btn"),htmlInput=document.getElementById("html-input"),zipInput=document.getElementById("zip-input"),fileList=document.getElementById("file-list"),publishHtmlBtn=document.getElementById("publish-html-btn"),publishZipBtn=document.getElementById("publish-zip-btn"),publishFeedback=document.getElementById("publish-feedback"),resultsModal=document.getElementById("results-modal"),previewModal=document.getElementById("preview-modal"),galleryGrid=document.getElementById("gallery-grid");auth.onAuthStateChanged(e=>{e?(loginContainer.style.display="none",studioContainer.style.display="flex",showPublisherView()):(loginContainer.style.display="block",studioContainer.style.display="none")}),loginForm.addEventListener("submit",async e=>{e.preventDefault(),sendLinkBtn.disabled=!0,sendLinkBtn.textContent="Sending...";const t=emailInput.value,o={url:window.location.href,handleCodeInApp:!0};try{await auth.sendSignInLinkToEmail(t,o),window.localStorage.setItem("emailForSignIn",t),feedbackMessage.textContent="Sign-in link sent! Please check your email.",feedbackMessage.className="feedback-message feedback-success",feedbackMessage.style.display="block"}catch(e){console.error(e),feedbackMessage.textContent="Error sending link. Please try again.",feedbackMessage.className="feedback-message feedback-error",feedbackMessage.style.display="block"}finally{sendLinkBtn.disabled=!1,sendLinkBtn.textContent="Send Sign-In Link"}}),auth.isSignInWithEmailLink(window.location.href)&&(email=window.localStorage.getItem("emailForSignIn"),email||(email=window.prompt("Please provide your email for confirmation")),email&&auth.signInWithEmailLink(email,window.location.href).then(e=>window.localStorage.removeItem("emailForSignIn")).catch(e=>{console.error(e),alert("Error: Invalid or expired link.")})),logoutBtn.addEventListener("click",()=>auth.signOut());function showPublisherView(){publisherView.style.display="flex",galleryView.style.display="none",publisherViewBtn.classList.add("active"),galleryViewBtn.classList.remove("active")}function showGalleryView(){publisherView.style.display="none",galleryView.style.display="flex",publisherViewBtn.classList.remove("active"),galleryViewBtn.classList.add("active"),loadGallery()}publisherViewBtn.addEventListener("click",showPublisherView),galleryViewBtn.addEventListener("click",showGalleryView),pasteTabBtn.addEventListener("click",()=>{pasteTabBtn.classList.add("active"),folderTabBtn.classList.remove("active"),pasteView.style.display="block",folderView.style.display="none"}),folderTabBtn.addEventListener("click",()=>{folderTabBtn.classList.add("active"),pasteTabBtn.classList.remove("active"),folderView.style.display="block",pasteView.style.display="none"});function getFormData(){let e=document.getElementById("school-code").value.trim();return""===e&&(e="00000"),{appName:document.getElementById("app-name").value.trim(),gradeLevel:document.getElementById("grade-level").value.trim(),schoolCode:e,pedagogy:document.getElementById("pedagogy").value.trim(),instructions:document.getElementById("instructions").value.trim()}}publishHtmlBtn.addEventListener("click",async()=>{const e=getFormData();e.htmlContent=htmlInput.value.trim(),e.appName&&e.htmlContent?await publish("publishHtml",e):alert("App Name and HTML content are required.")});let selectedZipFile=null;zipInput.addEventListener("change",e=>selectedZipFile=e.target.files[0]),publishZipBtn.addEventListener("click",()=>{if(!selectedZipFile)return alert("Please select a ZIP file.");const e=getFormData();if(!e.appName)return alert("App Name is required.");const t=new FileReader;t.readAsDataURL(selectedZipFile),t.onloadend=async()=>{e.zipFileBase64=t.result.split(",")[1],await publish("publishZip",e)}});async function publish(e,t){publishFeedback.textContent="Publishing... Please wait...",publishFeedback.style.color="var(--text-color)";try{const o=functions.httpsCallable(e),n=await o(t);if(n.data.success)showResultsModal(n.data),publishFeedback.textContent="";else throw new Error(n.data.error||"Unknown error occurred.")}catch(e){console.error("Error publishing: ",e),publishFeedback.textContent=`Error: ${e.message}`,publishFeedback.style.color="var(--error-color)"}}function showResultsModal({longUrl:e,shortUrl:t}){document.getElementById("result-long-url").href=e,document.getElementById("result-long-url").textContent=e,document.getElementById("result-short-url").href=t,document.getElementById("result-short-url").textContent=t;const o=document.getElementById("qrcode-container");o.innerHTML="",QRCode.toCanvas(e,{width:200},(e,t)=>{e&&console.error(e),o.appendChild(t)}),resultsModal.style.display="flex"}resultsModal.querySelector(".modal-close").addEventListener("click",()=>resultsModal.style.display="none"),previewModal.querySelector(".modal-close").addEventListener("click",()=>{previewModal.style.display="none",document.getElementById("preview-iframe").src="about:blank"});async function loadGallery(){galleryGrid.innerHTML="Loading apps...";try{const e=await firestore.collection("community_apps").orderBy("createdAt","desc").limit(20).get();if(galleryGrid.innerHTML="",e.empty)return void(galleryGrid.innerHTML="No apps found in the gallery yet.");e.forEach(e=>{const t=e.data(),o=document.createElement("div");o.className="app-card",o.innerHTML=`\n                <h4>${t.appName}</h4>\n                <p><strong>Grade:</strong> ${t.gradeLevel}</p>\n                <p><strong>By:</strong> ${t.teacher_name}</p>\n                <div class="app-card-actions">\n                    <button class="btn btn-secondary preview-btn" data-url="${t.app_url}" data-name="${t.appName}">Preview</button>\n                    <button class="btn btn-secondary download-btn" data-url="${t.app_url}" data-name="${t.appName}">Download</button>\n                </div>\n            `,galleryGrid.appendChild(o)})}catch(e){console.error("Error loading gallery:",e),galleryGrid.innerHTML="Failed to load apps."}}galleryGrid.addEventListener("click",async e=>{const t=e.target,o=t.dataset.url,n=t.dataset.name;if(t.classList.contains("preview-btn"))document.getElementById("preview-title").textContent=`Preview: ${n}`,document.getElementById("preview-iframe").src=o,previewModal.style.display="flex";if(t.classList.contains("download-btn")){t.textContent="Downloading...",t.disabled=!0;try{const e=o.includes(".zip"),n=functions.httpsCallable("downloadSource"),a=await n({url:o,isZip:e}),s=new Blob([a.data.content],{type:e?"application/zip":"text/html"}),i=document.createElement("a");i.href=URL.createObjectURL(s),i.download=e?`${n}.zip`:`${n}.html`,i.click(),URL.revokeObjectURL(i.href)}catch(e){console.error("Download failed:",e),alert("Could not download the file.")}finally{t.textContent="Download",t.disabled=!1}}}),pasteBtn.addEventListener("click",async()=>{try{htmlInput.value=await navigator.clipboard.readText()}catch(e){alert("Could not paste from clipboard. Please paste manually.")}});
"""

FUNCTIONS_INDEX_JS_CONTENT = """
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");
const jszip = require("jszip");

admin.initializeApp();
const storage = admin.storage();
const firestore = admin.firestore();

async function getShortUrl(longUrl) {
    return new Promise((resolve, reject) => {
        https.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, res => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => resolve(body));
        }).on("error", reject);
    });
}

async function saveMetadata(appData, publicUrl, context) {
    const teacherUid = context.auth.uid;
    const teacherName = context.auth.token.name || context.auth.token.email;
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

exports.publishHtml = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { htmlContent, ...appData } = data;
    if (!htmlContent) throw new functions.https.HttpsError("invalid-argument", "HTML content is missing.");
    const bucket = storage.bucket();
    const uniqueId = `${Date.now()}`;
    const filePath = `apps/${context.auth.uid}/${uniqueId}/index.html`;
    const file = bucket.file(filePath);
    await file.save(htmlContent, { metadata: { contentType: "text/html" } });
    await file.makePublic();
    const longUrl = file.publicUrl();
    await saveMetadata(appData, longUrl, context);
    const shortUrl = await getShortUrl(longUrl);
    return { success: true, longUrl, shortUrl };
});

exports.publishZip = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const { zipFileBase64, ...appData } = data;
    if (!zipFileBase64) throw new functions.https.HttpsError("invalid-argument", "ZIP file is missing.");
    const bucket = storage.bucket();
    const uniqueId = `${Date.now()}`;
    const baseFolderPath = `apps/${context.auth.uid}/${uniqueId}`;
    const zip = await jszip.loadAsync(zipFileBase64, { base64: true });
    const uploadPromises = [];
    zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
            const filePath = `${baseFolderPath}/${relativePath}`;
            const file = bucket.file(filePath);
            const stream = zipEntry.nodeStream();
            const promise = new Promise((resolve, reject) => {
                stream.pipe(file.createWriteStream({ public: true, contentType: "auto" }))
                    .on('error', reject)
                    .on('finish', resolve);
            });
            uploadPromises.push(promise);
        }
    });
    await Promise.all(uploadPromises);
    const longUrl = bucket.file(`${baseFolderPath}/index.html`).publicUrl();
    await saveMetadata(appData, longUrl, context);
    const shortUrl = await getShortUrl(longUrl);
    return { success: true, longUrl, shortUrl };
});

exports.downloadSource = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required.");
    const url = data.url;
    if (!url) throw new functions.https.HttpsError("invalid-argument", "URL is missing.");
    if (data.isZip) {
        const bucketName = "fireclassstudio.appspot.com"; // User must change this
        const filePath = decodeURIComponent(url.split(`${bucketName}/`)[1].split('?')[0]);
        try {
            const content = await admin.storage().bucket(bucketName).file(filePath).download();
            return { content: content[0].toString('base64') };
        } catch (error) {
            console.error("Failed to download ZIP from storage:", error);
            throw new functions.https.HttpsError("internal", "File not found in storage.");
        }
    } else {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let content = "";
                res.on('data', (chunk) => content += chunk);
                res.on('end', () => resolve({ content }));
            }).on('error', (err) => reject(new functions.https.HttpsError("internal", err.message)));
        });
    }
});
"""

# --- Main Script Execution ---

def main():
    """Main function to run the setup script."""
    project_name = "fireClassStudio"
    
    print("==============================================")
    print(" Vibe Studio Project Setup Script ")
    print("==============================================")
    
    # --- Step 1: Firebase Console Setup (Manual) ---
    webbrowser.open("https://console.firebase.google.com")
    prompt_instruction(
        "שלב 1: הגדרת פרויקט ב-Firebase",
        "הסקריפט פתח לך את מסוף Firebase. בצע את הפעולות הבאות:\n"
        "1. צור פרויקט חדש.\n"
        "2. שדרג אותו לתוכנית Blaze (Pay as you go).\n"
        "3. הפעל את השירותים: Authentication (עם Email Link), Firestore, Storage.\n"
        "4. רשום אפליקציית Web חדשה (אל תסמן Firebase Hosting).\n"
        "5. עבור ל-Authentication -> Settings -> Authorized domains והוסף את 'localhost'.\n"
        "6. העתק את אובייקט `firebaseConfig` המלא. תזדקק לו בשלב הבא."
    )

    # --- Step 2: Local Project Setup (Automated & Manual) ---
    print(f"יוצר תיקיית פרויקט בשם '{project_name}'...")
    os.makedirs(project_name, exist_ok=True)
    
    create_file(os.path.join(project_name, "public", "js", "placeholder.txt"), "")
    create_file(os.path.join(project_name, "public", "css", "placeholder.txt"), "")

    prompt_instruction(
        "שלב 2: יצירת קובץ ההגדרות",
        f"פתח את התיקייה '{project_name}' שיצרנו.\n"
        f"בתוכה, נווט אל 'public/js'.\n"
        f"צור קובץ חדש בשם `firebase-config.js` והדבק בתוכו את אובייקט ה-`firebaseConfig` שהעתקת מהשלב הקודם.\n"
        f"הקובץ צריך להיראות כך:\n\nconst firebaseConfig = {{\n  apiKey: \"...\",\n  // ... etc\n}};"
    )

    # --- Step 3: Firebase Init (Semi-Automated) ---
    print_instruction(
        "שלב 3: הפעלת `firebase init`",
        "בשלב הבא, הסקריפט יריץ את פקודת `firebase init`.\n"
        "עליך לענות על השאלות בטרמינל בדיוק כך:\n"
        "1. Are you ready to proceed? -> Y\n"
        "2. Which features? -> בחר Firestore, Functions, Storage (עם מקש הרווח).\n"
        "3. Select an option -> Use an existing project, ובחר את הפרויקט שלך.\n"
        "4. Default file for Firestore Rules? -> Enter\n"
        "5. Default file for Storage Rules? -> Enter\n"
        "6. Language for Functions? -> JavaScript\n"
        "7. Use ESLint? -> Y\n"
        "8. Overwrite package.json? -> y\n"
        "9. Install dependencies now? -> Y"
    )
    run_command(["firebase", "init"], cwd=project_name)

    # --- Step 4: Create Project Files (Automated) ---
    print("\nיוצר את קבצי המקור של האפליקציה...")
    create_file(os.path.join(project_name, "public", "index.html"), INDEX_HTML_CONTENT)
    create_file(os.path.join(project_name, "public", "css", "style.css"), STYLE_CSS_CONTENT)
    create_file(os.path.join(project_name, "public", "js", "studio.js"), STUDIO_JS_CONTENT)
    create_file(os.path.join(project_name, "functions", "index.js"), FUNCTIONS_INDEX_JS_CONTENT)

    # --- Step 5: Install Dependencies & Configure (Automated) ---
    print("\nמתקין תלויות נוספות בצד השרת...")
    run_command(["npm", "install", "jszip"], cwd=os.path.join(project_name, "functions"))

    print("\nמגדיר את ESLint כדי למנוע שגיאות פריסה...")
    eslintrc_path = os.path.join(project_name, "functions", ".eslintrc.js")
    with open(eslintrc_path, "r") as f:
        content = f.read()
    
    # A simple way to inject rules without complex parsing
    if '"rules": {' in content:
        content = content.replace(
            '"rules": {',
            '"rules": {\n    "require-jsdoc": "off",\n    "max-len": "off",'
        )
    else:
        # Fallback if rules object doesn't exist
        content = content.replace(
            '};',
            '  "rules": {\n    "require-jsdoc": "off",\n    "max-len": "off"\n  }\n};'
        )
    create_file(eslintrc_path, content)

    # --- Step 6: Deploy & Test (Automated) ---
    print_instruction(
        "שלב 4: פריסת השרת",
        "ההגדרה כמעט הושלמה. השלב הבא יפרוס את קוד השרת (פונקציות הענן) ל-Firebase. התהליך עשוי לקחת מספר דקות."
    )
    run_command(["firebase", "deploy", "--only", "functions"], cwd=project_name)

    print_instruction(
        "שלב 5: הרצת האפליקציה",
        "הפריסה הושלמה! כעת נתקין ונריץ שרת מקומי כדי לבדוק את האפליקציה. חלון דפדפן חדש ייפתח אוטומטית."
    )
    run_command(["npm", "install", "-g", "live-server"])
    print("\n--- הכל מוכן! מריץ את השרת המקומי. לחץ Ctrl+C כדי לעצור. ---")
    run_command(["live-server"], cwd=os.path.join(project_name, "public"))

if __name__ == "__main__":
    main()