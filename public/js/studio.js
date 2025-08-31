// --- Initialize Firebase and DOM elements (all references at the top) ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const functions = firebase.functions();
const firestore = firebase.firestore();

// --- I18N Translations ---
const translations = {
    en: { login_title: "Vibe Studio", login_prompt: "Enter your email to get a secure sign-in link.", send_link_btn: "Send Link", studio_title: "Vibe Studio", gallery_btn: "Gallery", logout_btn: "Logout", generate_btn: "Generate with AI", loading_ai: "Generating... Please wait...", },
    he: { login_title: "Vibe Studio", login_prompt: "הכנס את המייל לקבלת קישור כניסה מאובטח.", send_link_btn: "שלח קישור", studio_title: "Vibe Studio", gallery_btn: "גלריה", logout_btn: "התנתק", generate_btn: "צור עם AI", loading_ai: "יוצר... אנא המתן...", }
};

// --- Global State ---
let currentLanguage = 'he';
let generatedHtmlContent = ''; 
let personasData = [];
let promptsData = [];
let selectedPersonaId = null;
let selectedPromptId = null;

// --- DOM Element References ---
const loginContainer = document.getElementById('login-container');
const studioContainer = document.getElementById('studio-container');
const galleryContainer = document.getElementById('gallery-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const sendLinkBtn = document.getElementById('send-link-btn');
const feedbackMessage = document.getElementById('feedback-message');
const logoutBtn = document.getElementById('logout-btn');
const langEnBtn = document.getElementById('lang-en-btn');
const langHeBtn = document.getElementById('lang-he-btn');
const getLastLinkBtn = document.getElementById('get-last-link-btn');
const galleryViewBtn = document.getElementById('gallery-view-btn');
const backToStudioBtn = document.getElementById('back-to-studio-btn');
const tabs = { creator: document.getElementById('tab-creator'), preview: document.getElementById('tab-preview'), publish: document.getElementById('tab-publish') };
const contents = { creator: document.getElementById('content-creator'), preview: document.getElementById('content-preview'), publish: document.getElementById('content-publish') };
const personaLibrary = document.getElementById('persona-library');
const promptLibrary = document.getElementById('prompt-library');
const aiPromptInput = document.getElementById('ai-prompt-input');
const generateAiBtn = document.getElementById('generate-ai-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const previewIframe = document.getElementById('preview-iframe');
const publishBtn = document.getElementById('publish-btn');
const resultsModal = document.getElementById('results-modal');
const closeResultsModalBtn = document.getElementById('close-results-modal');
const resultShortUrl = document.getElementById('result-short-url');
const resultQrCode = document.getElementById('result-qr-code');

// --- NEW: Text Viewer Modal Elements ---
const textViewerModal = document.getElementById('text-viewer-modal');
const textViewerTitle = document.getElementById('text-viewer-title');
const textViewerContent = document.getElementById('text-viewer-content');
const closeTextViewerModalBtn = document.getElementById('close-text-viewer-modal');

// =================================================================
// START: LOGIN & APP INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    auth.onAuthStateChanged(user => {
        if (user) {
            loginContainer.classList.add('hidden');
            studioContainer.classList.remove('hidden');
            galleryContainer.classList.add('hidden');
            initializeStudio();
        } else {
            loginContainer.classList.remove('hidden');
            studioContainer.classList.add('hidden');
            galleryContainer.classList.add('hidden');
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalBtnText = sendLinkBtn.textContent;
            sendLinkBtn.disabled = true;
            sendLinkBtn.textContent = '...';
            try {
                await auth.sendSignInLinkToEmail(emailInput.value, { url: window.location.href, handleCodeInApp: true });
                window.localStorage.setItem('emailForSignIn', emailInput.value);
                feedbackMessage.textContent = 'קישור נשלח! בדוק את המייל.';
                feedbackMessage.className = 'mt-4 text-center text-green-600';
            } catch (error) {
                console.error("Error sending login link:", error);
                feedbackMessage.textContent = `שגיאה בשליחת הקישור: ${error.message}`;
                feedbackMessage.className = 'mt-4 text-center text-red-600';
            } finally {
                sendLinkBtn.disabled = false;
                sendLinkBtn.textContent = originalBtnText;
            }
        });
    }

    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) { email = window.prompt('אנא הזן את המייל לאימות'); }
        if (email) {
            auth.signInWithEmailLink(email, window.location.href)
                .then(() => {
                    window.localStorage.removeItem('emailForSignIn');
                    window.history.replaceState({}, document.title, window.location.pathname);
                })
                .catch(error => { console.error("Error signing in:", error); });
        }
    }
});

function initializeStudio() {
    setLanguage('he');
    loadDynamicContent();
    setupEventListeners();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    logoutBtn.addEventListener('click', () => auth.signOut());
    langEnBtn.addEventListener('click', () => setLanguage('en'));
    langHeBtn.addEventListener('click', () => setLanguage('he'));
    getLastLinkBtn.addEventListener('click', getMyLastAppLink);
    galleryViewBtn.addEventListener('click', () => {
        studioContainer.classList.add('hidden');
        galleryContainer.classList.remove('hidden');
        loadGallery();
    });
    backToStudioBtn.addEventListener('click', () => {
        galleryContainer.classList.add('hidden');
        studioContainer.classList.remove('hidden');
    });
    Object.keys(tabs).forEach(tabName => {
        tabs[tabName].addEventListener('click', () => showTab(tabName));
    });
    generateAiBtn.addEventListener('click', generateAiApp);
    publishBtn.addEventListener('click', publishApp);
    
    // FIX: Workflow bug after publishing
    closeResultsModalBtn.addEventListener('click', () => {
        resultsModal.classList.add('hidden');
        showTab('creator'); // Return to the creator tab
        loadGallery(); // Refresh gallery data in the background
    });

    // Add listener for the new modal
    closeTextViewerModalBtn.addEventListener('click', () => {
        textViewerModal.classList.add('hidden');
    });
}
// =================================================================
// END: LOGIN & APP INITIALIZATION
// =================================================================

function showTab(tabName) {
    Object.values(contents).forEach(content => content.classList.add('hidden'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    contents[tabName].classList.remove('hidden');
    tabs[tabName].classList.add('active');
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    renderCards();
    langEnBtn.classList.toggle('bg-blue-100', lang === 'en');
    langHeBtn.classList.toggle('bg-blue-100', lang === 'he');
}

async function loadDynamicContent() {
    try {
        const [personasRes, promptsRes] = await Promise.all([
            fetch('./data/personas.json'),
            fetch('./data/prompts.json')
        ]);
        personasData = (await personasRes.json()).personas;
        promptsData = (await promptsRes.json()).prompts;
        renderCards();
    } catch (error) { console.error("Failed to load dynamic content:", error); }
}

function renderCards() {
    personaLibrary.innerHTML = personasData.map(p => `
        <div class="card-base p-4 bg-white rounded-lg shadow-md text-center cursor-pointer ${selectedPersonaId === p.id ? 'selected' : ''}" data-id="${p.id}">
            <i class="${p.icon} fa-2x text-blue-500 mb-2"></i>
            <h3 class="font-bold">${p.title[currentLanguage]}</h3>
            <p class="text-sm text-gray-600">${p.description[currentLanguage]}</p>
        </div>
    `).join('');
    promptLibrary.innerHTML = promptsData.map(p => `
        <div class="card-base p-4 bg-white rounded-lg shadow-md text-center cursor-pointer ${selectedPromptId === p.id ? 'selected' : ''}" data-id="${p.id}">
            <i class="${p.icon} fa-2x text-green-500 mb-2"></i>
            <h3 class="font-bold">${p.title[currentLanguage]}</h3>
            <p class="text-sm text-gray-600">${p.description[currentLanguage]}</p>
        </div>
    `).join('');
    addCardEventListeners();
}

function addCardEventListeners() {
    personaLibrary.querySelectorAll('.card-base').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('#persona-library .card-base').forEach(c => c.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            selectedPersonaId = e.currentTarget.dataset.id;
        });
    });
    promptLibrary.querySelectorAll('.card-base').forEach(card => {
        card.addEventListener('click', (e) => {
            document.querySelectorAll('#prompt-library .card-base').forEach(c => c.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            selectedPromptId = e.currentTarget.dataset.id;
            const selectedPrompt = promptsData.find(p => p.id === selectedPromptId);
            if (selectedPrompt) { aiPromptInput.value = selectedPrompt.base_prompt[currentLanguage]; }
        });
    });
}

async function generateAiApp() {
    if (!selectedPersonaId || !selectedPromptId || !aiPromptInput.value.trim()) {
        alert("אנא בחר סגנון AI, סוג פעילות, ומלא את תיאור היישומון.");
        return;
    }
    const persona = personasData.find(p => p.id === selectedPersonaId);
    const finalPrompt = `${persona.system_prompt[currentLanguage]}\n\nTeacher's Request:\n${aiPromptInput.value.trim()}`;
    loadingSpinner.classList.remove('hidden');
    generateAiBtn.disabled = true;
    try {
        const askVibeAI = functions.httpsCallable('askVibeAI');
        const result = await askVibeAI({ prompt: finalPrompt, language: currentLanguage });
        if (!result.data || !result.data.htmlCode || !result.data.metadata) {
             throw new Error("Invalid response structure from AI function.");
        }
        const { htmlCode, metadata } = result.data;
        document.getElementById('app-name').value = metadata.appName || '';
        document.getElementById('grade-level').value = metadata.gradeLevel || '';
        document.getElementById('domain-input').value = metadata.domain || '';
        document.getElementById('sub-domain-input').value = metadata.subDomain || '';
        document.getElementById('pedagogy').value = metadata.pedagogicalExplanation || '';
        generatedHtmlContent = htmlCode || ''; 
        previewIframe.srcdoc = generatedHtmlContent; 
        showTab('preview');
    } catch (error) {
        console.error("Error calling AI function:", error);
        alert(`Error generating app: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('hidden');
        generateAiBtn.disabled = false;
    }
}

async function publishApp() {
    const appData = {
        appName: document.getElementById('app-name').value.trim(),
        gradeLevel: document.getElementById('grade-level').value.trim(),
        domain: document.getElementById('domain-input').value.trim(),
        subDomain: document.getElementById('sub-domain-input').value.trim(),
        pedagogy: document.getElementById('pedagogy').value.trim(),
        htmlContent: generatedHtmlContent
    };
    if (!appData.appName || !generatedHtmlContent) {
        alert('App Name and generated content are required.');
        return;
    }
    const originalBtnSpan = publishBtn.querySelector('span');
    const originalBtnText = originalBtnSpan ? originalBtnSpan.textContent : 'פרסם לגלריה';
    publishBtn.disabled = true;
    if (originalBtnSpan) originalBtnSpan.textContent = '...';
    try {
        const publishHtml = functions.httpsCallable('publishHtml');
        const result = await publishHtml(appData);
        if (result.data.success) {
            resultShortUrl.value = result.data.shortUrl;
            resultQrCode.src = result.data.qrCodeDataUrl || '';
            resultQrCode.classList.toggle('hidden', !result.data.qrCodeDataUrl);
            resultsModal.classList.remove('hidden');
        } else {
            throw new Error(result.data.error || 'Unknown publishing error.');
        }
    } catch (error) {
        console.error("Error publishing:", error);
        alert(`Failed to publish: ${error.message}`);
    } finally {
        publishBtn.disabled = false;
        if (originalBtnSpan) originalBtnSpan.textContent = originalBtnText;
    }
}

async function getMyLastAppLink() {
    if (!auth.currentUser) { alert("You must be logged in."); return; }
    try {
        const querySnapshot = await firestore.collection("community_apps")
            .where("teacher_uid", "==", auth.currentUser.uid)
            .orderBy("createdAt", "desc").limit(1).get();
        if (querySnapshot.empty) { alert("לא נמצאו יישומונים שפרסמת."); return; }
        const lastApp = querySnapshot.docs[0].data();
        resultShortUrl.value = lastApp.shortUrl || lastApp.app_url;
        if (lastApp.qrCodeDataUrl) {
            resultQrCode.src = lastApp.qrCodeDataUrl;
            resultQrCode.classList.remove('hidden');
        } else {
             resultQrCode.classList.add('hidden');
        }
        resultsModal.classList.remove('hidden');
    } catch (error) {
        console.error("Error getting last link:", error);
        alert("שגיאה בשליפת הקישור האחרון.");
    }
}

// --- NEW Helper functions for the gallery ---
function truncateText(text = '', maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
}

function showFullText(title, content) {
    textViewerTitle.textContent = title;
    textViewerContent.textContent = content;
    textViewerModal.classList.remove('hidden');
}

// --- UPDATED Gallery Logic ---
async function loadGallery() {
    const galleryTableBody = document.getElementById('gallery-table-body');
    galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8">טוען...</td></tr>`;

    try {
        const querySnapshot = await firestore.collection("community_apps").orderBy("createdAt", "desc").get();
        if (querySnapshot.empty) {
            galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8">הגלריה ריקה.</td></tr>`;
            return;
        }

        galleryTableBody.innerHTML = querySnapshot.docs.map(doc => {
            const app = doc.data();
            const pedagogy = app.pedagogicalExplanation || '';
            const truncatedPedagogy = truncateText(pedagogy, 30);

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${app.appName || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">${app.teacher_name || ''}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-gray-500">${app.schoolCode || ''}</td>
                    <td class="px-6 py-4 text-gray-500">
                        <span class="cursor-pointer hover:text-blue-600 hover:underline" data-fulltext="${pedagogy}">
                            ${truncatedPedagogy}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                         <button onclick="navigator.clipboard.writeText('${app.shortUrl || app.app_url}')" class="text-blue-600 hover:text-blue-800" title="העתק קישור">
                            <i class="fas fa-copy"></i>
                         </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners for the new clickable text spans
        galleryTableBody.querySelectorAll('[data-fulltext]').forEach(span => {
            span.addEventListener('click', (e) => {
                const fullText = e.target.dataset.fulltext;
                showFullText('הסבר פדגוגי מלא', fullText);
            });
        });
    } catch (error) {
        console.error("Error loading gallery:", error);
        galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-500">שגיאה בטעינת הגלריה.</td></tr>`;
    }
}
