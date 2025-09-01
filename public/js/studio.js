// --- Initialize Firebase and DOM elements ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const functions = firebase.functions();
const firestore = firebase.firestore();

// --- I18N Translations ---
const translations = {
    en: { 
        login_title: "Vibe Studio", 
        login_prompt: "Enter your email to get a secure sign-in link.", 
        send_link_btn: "Send Link", 
        studio_title: "Vibe Studio", 
        gallery_btn: "Gallery", 
        logout_btn: "Logout", 
        generate_btn: "Generate with AI", 
        refine_btn: "Refine App",
        loading_ai: "Generating... Please wait...", 
        loading_refine: "Refining... Please wait...",
        paste_external_code: "Paste External Code",
        paste_external_code_title: "Paste External Code",
        paste_external_code_desc: "Paste here complete HTML code (including html, head, body tags) generated from external sources (like Claude or ChatGPT).",
        cancel: "Cancel",
        load_pasted_code: "Load to Preview"
    },
    he: { 
        login_title: "Vibe Studio", 
        login_prompt: "הכנס את המייל לקבלת קישור כניסה מאובטח.", 
        send_link_btn: "שלח קישור", 
        studio_title: "Vibe Studio", 
        gallery_btn: "גלריה", 
        logout_btn: "התנתק", 
        generate_btn: "צור עם AI", 
        refine_btn: "שפר יישומון",
        loading_ai: "יוצר... אנא המתן...", 
        loading_refine: "משפר... אנא המתן...",
        paste_external_code: "הדבק קוד חיצוני",
        paste_external_code_title: "הדבקת קוד חיצוני",
        paste_external_code_desc: "הדבק כאן קוד HTML מלא (כולל תגיות html, head, body) שנוצר ממקור חיצוני (כמו Claude או ChatGPT).",
        cancel: "בטל",
        load_pasted_code: "טען לתצוגה מקדימה"
    }
};

// --- Global State ---
let currentLanguage = 'he';
let generatedHtmlContent = ''; 
let personasData = [];
let promptsData = [];
let selectedPersonaId = null;
let selectedPromptId = null;
let conversationHistory = [];
let generationCount = 0;
let currentSessionId = null;
let originalPromptData = null;

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

// --- NEW: Refinement UI Elements ---
const refinementContainer = document.createElement('div');
const refinementInput = document.createElement('textarea');
const refineBtn = document.createElement('button');
const conversationLog = document.createElement('div');

// --- Text Viewer Modal Elements ---
const textViewerModal = document.getElementById('text-viewer-modal');
const textViewerTitle = document.getElementById('text-viewer-title');
const textViewerContent = document.getElementById('text-viewer-content');
const closeTextViewerModalBtn = document.getElementById('close-text-viewer-modal');

// --- NEW: External Code Paste Modal Elements ---
const pasteCodeModal = document.getElementById('paste-code-modal');
const pasteExternalCodeBtn = document.getElementById('paste-external-code-btn');
const cancelPasteModalBtn = document.getElementById('cancel-paste-modal');
const loadPastedCodeBtn = document.getElementById('load-pasted-code-btn');
const externalCodeTextarea = document.getElementById('external-code-textarea');

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
    setupRefinementUI();
}

// --- Setup Refinement UI (NEW v2.1) ---
function setupRefinementUI() {
    // Create refinement container
    refinementContainer.className = 'mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg hidden';
    refinementContainer.id = 'refinement-container';
    
    // Title
    const refinementTitle = document.createElement('h3');
    refinementTitle.className = 'text-lg font-bold mb-3 text-blue-800';
    refinementTitle.textContent = currentLanguage === 'he' ? 'שיח רציף עם AI' : 'Continuous AI Dialogue';
    
    // Input field
    refinementInput.className = 'w-full border-gray-300 rounded-md shadow-sm p-3 mb-3';
    refinementInput.rows = 3;
    refinementInput.placeholder = currentLanguage === 'he' 
        ? 'הקלד בקשת שיפור, למשל: "הוסף טיימר של 30 שניות" או "שנה את הצבע לכחול"'
        : 'Type refinement request, e.g.: "Add a 30-second timer" or "Change color to blue"';
    
    // Refine button
    refineBtn.className = 'w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center mb-3';
    refineBtn.innerHTML = `<i class="fas fa-magic mr-2"></i><span data-lang="refine_btn">${translations[currentLanguage].refine_btn}</span>`;
    refineBtn.addEventListener('click', refineApp);
    
    // Save/Load buttons container
    const sessionButtonsContainer = document.createElement('div');
    sessionButtonsContainer.className = 'flex gap-2 mb-3';
    
    // Save session button
    const saveSessionBtn = document.createElement('button');
    saveSessionBtn.className = 'flex-1 bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center justify-center';
    saveSessionBtn.innerHTML = `<i class="fas fa-save mr-1"></i><span>שמור</span>`;
    saveSessionBtn.addEventListener('click', saveCurrentSession);
    
    // Load session button
    const loadSessionBtn = document.createElement('button');
    loadSessionBtn.className = 'flex-1 bg-purple-600 text-white p-2 rounded-md font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center';
    loadSessionBtn.innerHTML = `<i class="fas fa-folder-open mr-1"></i><span>טען</span>`;
    loadSessionBtn.addEventListener('click', showLoadSessionModal);
    
    sessionButtonsContainer.appendChild(saveSessionBtn);
    sessionButtonsContainer.appendChild(loadSessionBtn);
    
    // Conversation log
    conversationLog.className = 'mt-4 max-h-40 overflow-y-auto bg-white p-3 rounded border';
    conversationLog.innerHTML = '<p class="text-gray-500 text-sm">היסטוריית השיח תוצג כאן</p>';
    
    // Assemble refinement UI
    refinementContainer.appendChild(refinementTitle);
    refinementContainer.appendChild(refinementInput);
    refinementContainer.appendChild(refineBtn);
    refinementContainer.appendChild(sessionButtonsContainer);
    refinementContainer.appendChild(conversationLog);
    
    // Insert after the preview iframe
    const previewContainer = document.getElementById('content-preview');
    previewContainer.appendChild(refinementContainer);
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
    
    closeResultsModalBtn.addEventListener('click', () => {
        resultsModal.classList.add('hidden');
        showTab('creator');
        loadGallery();
    });

    closeTextViewerModalBtn.addEventListener('click', () => {
        textViewerModal.classList.add('hidden');
    });
    
    // --- NEW: External Code Paste Modal Event Listeners ---
    pasteExternalCodeBtn.addEventListener('click', () => {
        pasteCodeModal.classList.remove('hidden');
    });

    cancelPasteModalBtn.addEventListener('click', () => {
        pasteCodeModal.classList.add('hidden');
    });

    loadPastedCodeBtn.addEventListener('click', loadPastedCode);
}

function showTab(tabName) {
    Object.values(contents).forEach(content => content.classList.add('hidden'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    contents[tabName].classList.remove('hidden');
    tabs[tabName].classList.add('active');
    
    // Show/hide refinement UI based on tab
    if (tabName === 'preview' && generatedHtmlContent) {
        refinementContainer.classList.remove('hidden');
    } else {
        refinementContainer.classList.add('hidden');
    }
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
    
    // Update refinement UI language
    if (refinementInput) {
        refinementInput.placeholder = lang === 'he' 
            ? 'הקלד בקשת שיפור, למשל: "הוסף טיימר של 30 שניות" או "שנה את הצבע לכחול"'
            : 'Type refinement request, e.g.: "Add a 30-second timer" or "Change color to blue"';
    }
    
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

// --- NEW: Conversation Management Functions ---
function addToConversationLog(type, message, timestamp = Date.now()) {
    conversationHistory.push({ type, message, timestamp });
    updateConversationDisplay();
}

function updateConversationDisplay() {
    if (conversationHistory.length === 0) {
        conversationLog.innerHTML = '<p class="text-gray-500 text-sm">היסטוריית השיח תוצג כאן</p>';
        return;
    }
    
    conversationLog.innerHTML = conversationHistory.map((entry, index) => `
        <div class="mb-2 pb-2 ${index < conversationHistory.length - 1 ? 'border-b border-gray-100' : ''}">
            <div class="flex items-center gap-2 mb-1">
                <i class="fas ${entry.type === 'user' ? 'fa-user text-blue-600' : 'fa-robot text-green-600'} text-sm"></i>
                <span class="text-xs text-gray-500">${new Date(entry.timestamp).toLocaleTimeString()}</span>
            </div>
            <p class="text-sm ${entry.type === 'user' ? 'text-blue-800' : 'text-green-800'}">${entry.message}</p>
        </div>
    `).join('');
    
    // Scroll to bottom
    conversationLog.scrollTop = conversationLog.scrollHeight;
}

async function generateAiApp() {
    if (!selectedPersonaId || !selectedPromptId || !aiPromptInput.value.trim()) {
        alert("אנא בחר סגנון AI, סוג פעילות, ומלא את תיאור היישומון.");
        return;
    }
    
    const persona = personasData.find(p => p.id === selectedPersonaId);
    const promptTemplate = promptsData.find(p => p.id === selectedPromptId);
    
    const promptData = {
        persona: persona.system_prompt[currentLanguage],
        template: promptTemplate.base_prompt[currentLanguage], 
        content: aiPromptInput.value.trim()
    };
    
    // --- שינוי מתחיל כאן ---
    const loadingMessage = document.querySelector('#loading-spinner p');
    loadingSpinner.classList.remove('hidden');
    generateAiBtn.disabled = true;

    try {
        loadingMessage.textContent = 'יוצר קשר עם ה-AI...';
        const askVibeAI = functions.httpsCallable('askVibeAI');

        loadingMessage.textContent = 'ה-AI בונה את היישומון שלך (זה לוקח מספר שניות)...';
        const result = await askVibeAI({ 
            prompt: promptData, 
            language: currentLanguage === 'he' ? 'he' : 'en'
        });

        loadingMessage.textContent = 'מקבל את הנתונים ומסיים את ההכנות...';
        // --- סוף השינוי ---
        
        if (!result.data.success || !result.data.content) {
             throw new Error("Invalid response structure from AI function.");
        }
        
        const { htmlCode, metadata } = result.data.content;
        document.getElementById('app-name').value = metadata.appName || '';
        document.getElementById('grade-level').value = metadata.gradeLevel || '';
        document.getElementById('domain-input').value = metadata.domain || '';
        document.getElementById('sub-domain-input').value = metadata.subDomain || '';
        document.getElementById('pedagogy').value = metadata.pedagogicalExplanation || '';
        generatedHtmlContent = htmlCode || ''; 
        previewIframe.srcdoc = generatedHtmlContent;
        
        // Reset conversation for new generation
        conversationHistory = [];
        generationCount = 1;
        currentSessionId = null; // New session
        originalPromptData = promptData; // Store original prompt for saving
        addToConversationLog('user', aiPromptInput.value.trim());
        addToConversationLog('ai', `יצרתי ${metadata.appName || 'יישומון חדש'} בהצלחה!`);
        
        showTab('preview');
    } catch (error) {
        console.error("Error calling AI function:", error);
        alert(`Error generating app: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('hidden');
        generateAiBtn.disabled = false;
        // שחזור ההודעה המקורית לפעם הבאה
        loadingMessage.textContent = translations[currentLanguage].loading_ai;
    }
}

// --- NEW: App Refinement Function ---
async function refineApp() {
    const refinementRequest = refinementInput.value.trim();
    if (!refinementRequest || !generatedHtmlContent) {
        alert("אנא הכנס בקשת שיפור ווודא שיש יישומון קיים לשיפור.");
        return;
    }
    
    // Update UI state
    refineBtn.disabled = true;
    const originalBtnText = refineBtn.querySelector('span').textContent;
    refineBtn.querySelector('span').textContent = translations[currentLanguage].loading_refine;
    
    // Add user message to conversation
    addToConversationLog('user', refinementRequest);
    
    try {
        // Use the simplified askVibeAI with currentApp parameter
        const askVibeAI = functions.httpsCallable('askVibeAI');
        
        const currentAppData = {
            htmlCode: generatedHtmlContent,
            metadata: {
                appName: document.getElementById('app-name').value,
                gradeLevel: document.getElementById('grade-level').value,
                domain: document.getElementById('domain-input').value,
                subDomain: document.getElementById('sub-domain-input').value,
                pedagogicalExplanation: document.getElementById('pedagogy').value
            }
        };
        
        const result = await askVibeAI({
            prompt: { content: refinementRequest },
            currentApp: currentAppData,
            language: currentLanguage === 'he' ? 'he' : 'en'
        });
        
        if (!result.data.success || !result.data.content) {
            throw new Error("Invalid refinement response from AI function.");
        }
        
        const { htmlCode, metadata } = result.data.content;
        
        // Update the app
        generatedHtmlContent = htmlCode;
        previewIframe.srcdoc = generatedHtmlContent;
        
        // Update metadata if provided
        if (metadata) {
            if (metadata.appName) document.getElementById('app-name').value = metadata.appName;
            if (metadata.gradeLevel) document.getElementById('grade-level').value = metadata.gradeLevel;
            if (metadata.domain) document.getElementById('domain-input').value = metadata.domain;
            if (metadata.subDomain) document.getElementById('sub-domain-input').value = metadata.subDomain;
            if (metadata.pedagogicalExplanation) document.getElementById('pedagogy').value = metadata.pedagogicalExplanation;
        }
        
        // Add AI response to conversation
        const aiMessage = 'השיפור בוצע בהצלחה!';
        addToConversationLog('ai', aiMessage);
        
        // Clear refinement input
        refinementInput.value = '';
        generationCount++;
        
        console.log(`✅ App refined successfully (generation ${generationCount})`);
        
    } catch (error) {
        console.error("Error refining app:", error);
        alert(`שגיאה בשיפור היישומון: ${error.message}`);
        addToConversationLog('ai', `שגיאה: ${error.message}`);
    } finally {
        refineBtn.disabled = false;
        refineBtn.querySelector('span').textContent = originalBtnText;
    }
}

async function publishApp() {
    const appData = {
        appName: document.getElementById('app-name').value.trim(),
        gradeLevel: document.getElementById('grade-level').value.trim(),
        domain: document.getElementById('domain-input').value.trim(),
        subDomain: document.getElementById('sub-domain-input').value.trim(),
        pedagogy: document.getElementById('pedagogy').value.trim(),
        htmlContent: generatedHtmlContent,
        conversationLog: conversationHistory, // NEW: Include conversation history
        generationCount: generationCount // NEW: Include generation count
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

// --- Helper functions for the gallery ---
function truncateText(text = '', maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
}

function showFullText(title, content) {
    textViewerTitle.textContent = title;
    textViewerContent.textContent = content;
    textViewerModal.classList.remove('hidden');
}

// --- Gallery Logic ---
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
            const generationInfo = app.generationCount ? ` (${app.generationCount} גרסאות)` : '';

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${app.appName || ''}${generationInfo}</td>
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
                         <button onclick="deleteApp('${doc.id}', '${app.appName}')" class="text-red-600 hover:text-red-800 ml-4" title="מחק יישומון">
                            <i class="fas fa-trash"></i>
                         </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners for the clickable text spans
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

// --- Work Session Management ---
async function saveCurrentSession() {
    if (!generatedHtmlContent) {
        alert('אין יישומון לשמירה');
        return;
    }
    
    const sessionName = prompt('שם לשמירה:', document.getElementById('app-name').value || 'סשן עבודה');
    if (!sessionName) return;
    
    const currentAppData = {
        htmlCode: generatedHtmlContent,
        metadata: {
            appName: document.getElementById('app-name').value,
            gradeLevel: document.getElementById('grade-level').value,
            domain: document.getElementById('domain-input').value,
            subDomain: document.getElementById('sub-domain-input').value,
            pedagogicalExplanation: document.getElementById('pedagogy').value
        }
    };
    
    try {
        const saveWorkSession = functions.httpsCallable('saveWorkSession');
        const result = await saveWorkSession({
            sessionName: sessionName,
            currentApp: currentAppData,
            originalPrompt: originalPromptData,
            sessionHistory: conversationHistory.map(entry => entry.message)
        });
        
        if (result.data.success) {
            currentSessionId = result.data.sessionId;
            alert('הסשן נשמר בהצלחה!');
        } else {
            throw new Error(result.data.message || 'שגיאה בשמירה');
        }
    } catch (error) {
        console.error('Error saving session:', error);
        alert(`שגיאה בשמירת הסשן: ${error.message}`);
    }
}

async function showLoadSessionModal() {
    try {
        const getUserWorkSessions = functions.httpsCallable('getUserWorkSessions');
        const result = await getUserWorkSessions();
        
        if (!result.data.success || !result.data.sessions.length) {
            alert('לא נמצאו סשנים שמורים');
            return;
        }
        
        const sessions = result.data.sessions;
        const sessionList = sessions.map((session, index) => 
            `${index + 1}. ${session.sessionName} (${session.appName}) - ${new Date(session.lastUpdated?.toDate?.() || session.lastUpdated).toLocaleDateString()}`
        ).join('\n');
        
        const choice = prompt(`בחר סשן לטעינה:\n\n${sessionList}\n\nהקלד מספר:`);
        
        if (choice && !isNaN(choice)) {
            const sessionIndex = parseInt(choice) - 1;
            if (sessionIndex >= 0 && sessionIndex < sessions.length) {
                await loadWorkSession(sessions[sessionIndex].id);
            }
        }
        
    } catch (error) {
        console.error('Error loading sessions list:', error);
        alert(`שגיאה בטעינת רשימת הסשנים: ${error.message}`);
    }
}

async function loadWorkSession(sessionId) {
    try {
        const loadWorkSessionFn = functions.httpsCallable('loadWorkSession');
        const result = await loadWorkSessionFn({ sessionId });
        
        if (!result.data.success) {
            throw new Error(result.data.message || 'שגיאה בטעינה');
        }
        
        const session = result.data.session;
        
        // Restore app content
        generatedHtmlContent = session.currentApp.htmlCode;
        previewIframe.srcdoc = generatedHtmlContent;
        
        // Restore metadata
        if (session.currentApp.metadata) {
            document.getElementById('app-name').value = session.currentApp.metadata.appName || '';
            document.getElementById('grade-level').value = session.currentApp.metadata.gradeLevel || '';
            document.getElementById('domain-input').value = session.currentApp.metadata.domain || '';
            document.getElementById('sub-domain-input').value = session.currentApp.metadata.subDomain || '';
            document.getElementById('pedagogy').value = session.currentApp.metadata.pedagogicalExplanation || '';
        }
        
        // Restore session state
        currentSessionId = sessionId;
        originalPromptData = session.originalPrompt;
        
        // Restore conversation history
        conversationHistory = [];
        if (session.sessionHistory && Array.isArray(session.sessionHistory)) {
            session.sessionHistory.forEach((message, index) => {
                const type = index % 2 === 0 ? 'user' : 'ai';
                conversationHistory.push({
                    type: type,
                    message: message,
                    timestamp: Date.now() - (session.sessionHistory.length - index) * 60000 // Mock timestamps
                });
            });
        }
        updateConversationDisplay();
        
        // Show preview tab
        showTab('preview');
        
        alert(`הסשן "${session.sessionName}" נטען בהצלחה!`);
        
    } catch (error) {
        console.error('Error loading work session:', error);
        alert(`שגיאה בטעינת הסשן: ${error.message}`);
    }
}

// --- NEW: Function to load pasted external code ---
function loadPastedCode() {
    const pastedHtml = externalCodeTextarea.value.trim();
    if (!pastedHtml) {
        alert('תיבת הטקסט ריקה. אנא הדבק קוד HTML.');
        return;
    }

    // הגדרת התוכן הגלובלי והצגתו בתצוגה המקדימה
    generatedHtmlContent = pastedHtml;
    previewIframe.srcdoc = generatedHtmlContent;

    // איפוס שדות המטא-דאטה (כדי שהמשתמש ימלא אותם ידנית)
    document.getElementById('app-name').value = '';
    document.getElementById('grade-level').value = '';
    document.getElementById('domain-input').value = '';
    document.getElementById('sub-domain-input').value = '';
    document.getElementById('pedagogy').value = 'התוכן הוזן ידנית ממקור חיצוני.';

    // איפוס היסטוריית השיחה
    conversationHistory = [];
    updateConversationDisplay();

    // סגירת החלון והעברה לטאב תצוגה מקדימה
    pasteCodeModal.classList.add('hidden');
    showTab('preview');

    alert('הקוד נטען בהצלחה! באפשרותך למלא את הפרטים ולפרסם, או לבקש שיפורים מה-AI שלנו.');
}

// --- NEW: App Deletion Function ---
async function deleteApp(appId, appName) {
    // וידוא לפני מחיקה - שלב קריטי למניעת טעויות!
    if (!confirm(`האם אתה בטוח שברצונך למחוק את היישומון "${appName}"? לא ניתן לשחזר פעולה זו.`)) {
        return;
    }

    try {
        // קריאה לפונקציית הענן החדשה שתטפל במחיקה
        const deleteApplet = functions.httpsCallable('deleteApplet');
        const result = await deleteApplet({ id: appId });

        if (result.data.success) {
            alert("היישומון נמחק בהצלחה!");
            loadGallery(); // רענון הגלריה כדי להציג את השינוי
        } else {
            throw new Error(result.data.error || 'שגיאה לא ידועה');
        }
    } catch (error) {
        console.error("Error deleting applet:", error);
        alert(`שגיאה במחיקת היישומון: ${error.message}`);
    }
}

// הוסף את השורה הבאה כדי לחשוף את הפונקציה לחלון הגלובלי, כך שכפתורי ה-onclick יוכלו למצוא אותה
window.deleteApp = deleteApp;
