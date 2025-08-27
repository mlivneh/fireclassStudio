// --- Initialize Firebase ---
// The 'firebaseConfig' object is loaded from 'js/firebase-config.js'
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const functions = firebase.functions();
const firestore = firebase.firestore();

// --- DOM Element References ---
const loginContainer = document.getElementById('login-container');
const studioContainer = document.getElementById('studio-container');
const publisherView = document.getElementById('publisher-view');
const galleryView = document.getElementById('gallery-view');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const sendLinkBtn = document.getElementById('send-link-btn');
const feedbackMessage = document.getElementById('feedback-message');
const logoutBtn = document.getElementById('logout-btn');
const galleryViewBtn = document.getElementById('gallery-view-btn');
const publisherViewBtn = document.getElementById('publisher-view-btn');
const pasteTabBtn = document.getElementById('paste-tab-btn');
const folderTabBtn = document.getElementById('folder-tab-btn');
const pasteView = document.getElementById('paste-view');
const folderView = document.getElementById('folder-view');
const pasteBtn = document.getElementById('paste-btn');
const htmlInput = document.getElementById('html-input');
const zipInput = document.getElementById('zip-input');
const fileList = document.getElementById('file-list');
const publishHtmlBtn = document.getElementById('publish-html-btn');
const publishZipBtn = document.getElementById('publish-zip-btn');
const publishFeedback = document.getElementById('publish-feedback');
const resultsModal = document.getElementById('results-modal');
const previewModal = document.getElementById('preview-modal');
const galleryGrid = document.getElementById('gallery-grid');

// --- 1. Authentication Logic ---
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.style.display = 'none';
        studioContainer.style.display = 'flex';
        showPublisherView();
    } else {
        loginContainer.style.display = 'block';
        studioContainer.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    sendLinkBtn.disabled = true;
    sendLinkBtn.textContent = 'Sending...';
    
    const email = emailInput.value;
    const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true,
    };

    try {
        await auth.sendSignInLinkToEmail(email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        feedbackMessage.textContent = 'Sign-in link sent! Please check your email.';
        feedbackMessage.className = 'feedback-message feedback-success';
        feedbackMessage.style.display = 'block';
    } catch (error) {
        console.error(error);
        feedbackMessage.textContent = 'Error sending link. Please try again.';
        feedbackMessage.className = 'feedback-message feedback-error';
        feedbackMessage.style.display = 'block';
    } finally {
        sendLinkBtn.disabled = false;
        sendLinkBtn.textContent = 'Send Sign-In Link';
    }
});

if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
        email = window.prompt('Please provide your email for confirmation');
    }
    if (email) {
        auth.signInWithEmailLink(email, window.location.href)
            .then(result => window.localStorage.removeItem('emailForSignIn'))
            .catch(error => {
                console.error(error);
                alert("Error: Invalid or expired link.");
            });
    }
}

logoutBtn.addEventListener('click', () => auth.signOut());

// --- 2. Main View Switching Logic (Publisher <-> Gallery) ---
function showPublisherView() {
    publisherView.style.display = 'flex';
    galleryView.style.display = 'none';
    publisherViewBtn.classList.add('active');
    galleryViewBtn.classList.remove('active');
}

function showGalleryView() {
    publisherView.style.display = 'none';
    galleryView.style.display = 'flex';
    publisherViewBtn.classList.remove('active');
    galleryViewBtn.classList.add('active');
    loadGallery();
}

publisherViewBtn.addEventListener('click', showPublisherView);
galleryViewBtn.addEventListener('click', showGalleryView);

// --- 3. Upload Tabs Switching Logic (Paste <-> ZIP) ---
pasteTabBtn.addEventListener('click', () => {
    pasteTabBtn.classList.add('active');
    folderTabBtn.classList.remove('active');
    pasteView.style.display = 'block';
    folderView.style.display = 'none';
});

folderTabBtn.addEventListener('click', () => {
    folderTabBtn.classList.add('active');
    pasteTabBtn.classList.remove('active');
    folderView.style.display = 'block';
    pasteView.style.display = 'none';
});

// --- 4. Publishing Logic ---

// Helper to get common form data
function getFormData() {
    let schoolCode = document.getElementById('school-code').value.trim();
    if (schoolCode === "") schoolCode = "00000";
    
    return {
        appName: document.getElementById('app-name').value.trim(),
        gradeLevel: document.getElementById('grade-level').value.trim(),
        schoolCode: schoolCode,
        pedagogy: document.getElementById('pedagogy').value.trim(),
        instructions: document.getElementById('instructions').value.trim(),
    };
}

// A. Publish Pasted HTML
publishHtmlBtn.addEventListener('click', async () => {
    const appData = getFormData();
    appData.htmlContent = htmlInput.value.trim();

    if (!appData.appName || !appData.htmlContent) {
        alert("App Name and HTML content are required.");
        return;
    }
    await publish('publishHtml', appData);
});

// B. Publish Zipped Folder
let selectedZipFile = null;
zipInput.addEventListener('change', (e) => {
    selectedZipFile = e.target.files[0];
    if(selectedZipFile) {
        fileList.textContent = `File selected: ${selectedZipFile.name}`;
    }
});

publishZipBtn.addEventListener('click', () => {
    if (!selectedZipFile) {
        alert("Please select a ZIP file.");
        return;
    }
    const appData = getFormData();
    if (!appData.appName) {
        alert("App Name is required.");
        return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(selectedZipFile);
    reader.onloadend = async () => {
        appData.zipFileBase64 = reader.result.split(',')[1];
        await publish('publishZip', appData);
    };
});

// C. Generic Publish Function
async function publish(functionName, appData) {
    publishFeedback.textContent = 'Publishing... Please wait...';
    publishFeedback.style.color = 'var(--text-color)';
    
    try {
        const callableFunction = functions.httpsCallable(functionName);
        const result = await callableFunction(appData);

        if (result.data.success) {
            showResultsModal(result.data);
            publishFeedback.textContent = '';
        } else {
            throw new Error(result.data.error || 'Unknown error occurred.');
        }
    } catch (error) {
        console.error("Error publishing: ", error);
        publishFeedback.textContent = `Error: ${error.message}`;
        publishFeedback.style.color = 'var(--error-color)';
    }
}

// --- 5. Modal and Gallery Logic ---

// Show results after publishing
function showResultsModal({ longUrl, shortUrl }) {
    document.getElementById('result-long-url').href = longUrl;
    document.getElementById('result-long-url').textContent = longUrl;
    document.getElementById('result-short-url').href = shortUrl;
    document.getElementById('result-short-url').textContent = shortUrl;
    
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = '';
    QRCode.toCanvas(longUrl, { width: 200 }, (err, canvas) => {
        if (err) console.error(err);
        qrContainer.appendChild(canvas);
    });
    
    resultsModal.style.display = 'flex';
}

// Close modals
resultsModal.querySelector('.modal-close').addEventListener('click', () => resultsModal.style.display = 'none');
previewModal.querySelector('.modal-close').addEventListener('click', () => {
    previewModal.style.display = 'none';
    document.getElementById('preview-iframe').src = 'about:blank'; // Stop content
});

// Load apps into the gallery
async function loadGallery() {
    galleryGrid.innerHTML = 'Loading apps...';
    try {
        const querySnapshot = await firestore.collection("community_apps").orderBy("createdAt", "desc").limit(20).get();
        galleryGrid.innerHTML = '';
        if (querySnapshot.empty) {
            galleryGrid.innerHTML = 'No apps found in the gallery yet.';
            return;
        }
        querySnapshot.forEach(doc => {
            const app = doc.data();
            const card = document.createElement('div');
            card.className = 'app-card';
            card.innerHTML = `
                <h4>${app.appName}</h4>
                <p><strong>Grade:</strong> ${app.gradeLevel}</p>
                <p><strong>By:</strong> ${app.teacher_name}</p>
                <div class="app-card-actions">
                    <button class="btn btn-secondary preview-btn" data-url="${app.app_url}" data-name="${app.appName}">Preview</button>
                    <button class="btn btn-secondary download-btn" data-url="${app.app_url}" data-name="${app.appName}">Download</button>
                </div>
            `;
            galleryGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading gallery:", error);
        galleryGrid.innerHTML = 'Failed to load apps.';
    }
}

// Handle clicks on gallery buttons (Preview/Download)
galleryGrid.addEventListener('click', async (e) => {
    const button = e.target;
    const url = button.dataset.url;
    const name = button.dataset.name;

    if (button.classList.contains('preview-btn')) {
        document.getElementById('preview-title').textContent = `Preview: ${name}`;
        document.getElementById('preview-iframe').src = url;
        previewModal.style.display = 'flex';
    }
    
    if (button.classList.contains('download-btn')) {
        button.textContent = 'Downloading...';
        button.disabled = true;
        try {
            const isZip = url.includes('.zip'); // Simple check if the source was a zip
            // We need a proxy function to download content to bypass browser security (CORS)
            const downloadProxy = functions.httpsCallable('downloadSource');
            const result = await downloadProxy({ url: url, isZip: isZip });
            
            const blob = new Blob([result.data.content], { type: isZip ? 'application/zip' : 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = isZip ? `${name}.zip` : `${name}.html`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch(error) {
            console.error("Download failed:", error);
            alert("Could not download the file.");
        } finally {
            button.textContent = 'Download';
            button.disabled = false;
        }
    }
});

// Paste from clipboard helper
pasteBtn.addEventListener('click', async () => {
    try {
        htmlInput.value = await navigator.clipboard.readText();
    } catch (err) {
        alert('Could not paste from clipboard. Please paste manually.');
    }
});