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
        load_pasted_code: "Load to Preview",
        restore_last_link: "Restore Last Link",
        tab_creator: "Step 1: Create",
        tab_preview: "Step 2: Preview",
        tab_publish: "Step 3: Details & Publish",
        creator_step1_title: "Step 1: Choose AI Style",
        creator_step2_title: "Step 2: Choose Activity Type",
        creator_step3_title: "Step 3: Describe Your Applet",
        prompt_placeholder: "Fill in the details from the template and add any other requests, e.g., 'Make it a funny game with animal characters'",
        publish_details_title: "App Details",
        app_name_label: "App Name",
        grade_level_label: "Grade Level",
        domain_label: "Domain",
        sub_domain_label: "Sub-Domain",
        pedagogy_label: "Pedagogical Explanation",
        publish_btn: "Publish to Gallery",
        gallery_title: "Applets Gallery",
        back_to_studio_btn: "Back to Studio",
        gallery_header_name: "Applet Name",
        gallery_header_creator: "Creator",
        gallery_header_institution: "Institution",
        gallery_header_pedagogy: "Pedagogical Explanation",
        gallery_header_actions: "Actions",
        close: "Close",
        app_published_success: "App Published Successfully!",
        short_url_ready: "The short link is ready to share:",
        qr_code_ready: "QR code for quick scanning:",
        link_sent: "Link sent! Check your email.",
        link_error: "Error sending link:",
        email_prompt: "Please enter your email for verification",
        select_all_options_alert: "Please select an AI style, activity type, and fill in the applet description.",
        app_details_missing_alert: "App Name and generated content are required.",
        no_app_to_save_alert: "There is no applet to save",
        session_name_prompt: "Enter a name for the session:",
        session_saved_success: "Session saved successfully!",
        no_saved_sessions: "No saved sessions found",
        load_session_prompt_title: "Choose a session to load:",
        load_session_prompt_instruction: "Type a number:",
        session_loaded_success: "Session loaded successfully!",
        code_loaded_success: "Code loaded successfully! You can now fill in the details and publish, or request improvements from our AI.",
        delete_confirm_prompt: "Are you sure you want to delete the applet",
        app_deleted_success: "Applet deleted successfully!",
        save_btn: "Save",
        load_btn: "Load",
        refinement_dialogue_title: "Continuous AI Dialogue",
        refinement_placeholder: 'Type refinement request, e.g.: "Add a 30-second timer" or "Change color to blue"',
        conversation_history_placeholder: "Conversation history will be displayed here"
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
        load_pasted_code: "טען לתצוגה מקדימה",
        restore_last_link: "שחזר קישור אחרון",
        tab_creator: "שלב 1: יצירה",
        tab_preview: "שלב 2: תצוגה מקדימה",
        tab_publish: "שלב 3: פרטים ופרסום",
        creator_step1_title: "שלב 1: בחר את סגנון ה-AI",
        creator_step2_title: "שלב 2: בחר את סוג הפעילות",
        creator_step3_title: "שלב 3: תאר את היישומון הרצוי",
        prompt_placeholder: "...מלא את הפרטים מהתבנית והוסף כל בקשה נוספת, למשל: 'שיהיה משחק מצחיק עם דמויות של חיות'",
        publish_details_title: "פרטי האפליקציה",
        app_name_label: "שם האפליקציה",
        grade_level_label: "שכבת גיל",
        domain_label: "תחום",
        sub_domain_label: "תת-תחום",
        pedagogy_label: "הסבר פדגוגי",
        publish_btn: "פרסם לגלריה",
        gallery_title: "גלריית היישומונים",
        back_to_studio_btn: "חזור לסטודיו",
        gallery_header_name: "שם היישומון",
        gallery_header_creator: "יוצר",
        gallery_header_institution: "מוסד",
        gallery_header_pedagogy: "הסבר פדגוגי",
        gallery_header_actions: "פעולות",
        close: "סגור",
        app_published_success: "האפליקציה פורסמה בהצלחה!",
        short_url_ready: "הקישור המקוצר מוכן לשיתוף:",
        qr_code_ready: "קוד QR לסריקה מהירה:",
        link_sent: "קישור נשלח! בדוק את המייל.",
        link_error: "שגיאה בשליחת הקישור:",
        email_prompt: "אנא הזן את המייל לאימות",
        select_all_options_alert: "אנא בחר סגנון AI, סוג פעילות, ומלא את תיאור היישומון.",
        app_details_missing_alert: "נדרש שם יישומון ותוכן שנוצר.",
        no_app_to_save_alert: "אין יישומון לשמירה",
        session_name_prompt: "שם לשמירה:",
        session_saved_success: "הסשן נשמר בהצלחה!",
        no_saved_sessions: "לא נמצאו סשנים שמורים",
        load_session_prompt_title: "בחר סשן לטעינה:",
        load_session_prompt_instruction: "הקלד מספר:",
        session_loaded_success: "הסשן נטען בהצלחה!",
        code_loaded_success: "הקוד נטען בהצלחה! באפשרותך למלא את הפרטים ולפרסם, או לבקש שיפורים מה-AI שלנו.",
        delete_confirm_prompt: "האם אתה בטוח שברצונך למחוק את היישומון",
        app_deleted_success: "היישומון נמחק בהצלחה!",
        save_btn: "שמור",
        load_btn: "טען",
        refinement_dialogue_title: "שיח רציף עם AI",
        refinement_placeholder: 'הקלד בקשת שיפור, למשל: "הוסף טיימר של 30 שניות" או "שנה את הצבע לכחול"',
        conversation_history_placeholder: "היסטוריית השיח תוצג כאן"
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
const textViewerModal = document.getElementById('text-viewer-modal');
const textViewerTitle = document.getElementById('text-viewer-title');
const textViewerContent = document.getElementById('text-viewer-content');
const closeTextViewerModalBtn = document.getElementById('close-text-viewer-modal');
const pasteCodeModal = document.getElementById('paste-code-modal');
const pasteExternalCodeBtn = document.getElementById('paste-external-code-btn');
const cancelPasteModalBtn = document.getElementById('cancel-paste-modal');
const loadPastedCodeBtn = document.getElementById('load-pasted-code-btn');
const externalCodeTextarea = document.getElementById('external-code-textarea');

// --- Dynamic UI Elements (created once) ---
let refinementContainer, refinementInput, refineBtn, conversationLog, saveSessionBtn, loadSessionBtn;

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
                feedbackMessage.textContent = translations.he.link_sent; // Default to Hebrew before lang is set
                feedbackMessage.className = 'mt-4 text-center text-green-600';
            } catch (error) {
                console.error("Error sending login link:", error);
                feedbackMessage.textContent = `${translations.he.link_error} ${error.message}`;
                feedbackMessage.className = 'mt-4 text-center text-red-600';
            } finally {
                sendLinkBtn.disabled = false;
                sendLinkBtn.textContent = originalBtnText;
            }
        });
    }

    if (auth.isSignInWithEmailLink(window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) { email = window.prompt(translations.he.email_prompt); }
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
    setupRefinementUI();
    setupEventListeners();
    setLanguage('he'); // Set language after UI is built
    loadDynamicContent();
}

function setupRefinementUI() {
    refinementContainer = document.createElement('div');
    refinementContainer.className = 'mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg hidden';
    refinementContainer.id = 'refinement-container';

    const refinementTitle = document.createElement('h3');
    refinementTitle.className = 'text-lg font-bold mb-3 text-blue-800';
    refinementTitle.dataset.lang = 'refinement_dialogue_title';

    refinementInput = document.createElement('textarea');
    refinementInput.className = 'w-full border-gray-300 rounded-md shadow-sm p-3 mb-3';
    refinementInput.rows = 3;
    refinementInput.dataset.langPlaceholder = 'refinement_placeholder';

    refineBtn = document.createElement('button');
    refineBtn.className = 'w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center mb-3';
    refineBtn.innerHTML = `<i class="fas fa-magic ltr:mr-2 rtl:ml-2"></i><span data-lang="refine_btn"></span>`;

    const sessionButtonsContainer = document.createElement('div');
    sessionButtonsContainer.className = 'flex gap-2 mb-3';

    saveSessionBtn = document.createElement('button');
    saveSessionBtn.className = 'flex-1 bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center justify-center';
    saveSessionBtn.innerHTML = `<i class="fas fa-save ltr:mr-1 rtl:ml-1"></i><span data-lang="save_btn"></span>`;

    loadSessionBtn = document.createElement('button');
    loadSessionBtn.className = 'flex-1 bg-purple-600 text-white p-2 rounded-md font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center';
    loadSessionBtn.innerHTML = `<i class="fas fa-folder-open ltr:mr-1 rtl:ml-1"></i><span data-lang="load_btn"></span>`;

    sessionButtonsContainer.append(saveSessionBtn, loadSessionBtn);

    conversationLog = document.createElement('div');
    conversationLog.className = 'mt-4 max-h-40 overflow-y-auto bg-white p-3 rounded border';

    refinementContainer.append(refinementTitle, refinementInput, refineBtn, sessionButtonsContainer, conversationLog);
    document.getElementById('content-preview').appendChild(refinementContainer);
}

function setupEventListeners() {
    logoutBtn.addEventListener('click', () => auth.signOut());
    langEnBtn.addEventListener('click', () => {
        setLanguage('en');
        renderCards(); // הוספנו את הקריאה כאן
    });
    langHeBtn.addEventListener('click', () => {
        setLanguage('he');
        renderCards(); // והוספנו את הקריאה גם כאן
    });
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
    refineBtn.addEventListener('click', refineApp);
    saveSessionBtn.addEventListener('click', saveCurrentSession);
    loadSessionBtn.addEventListener('click', showLoadSessionModal);
    closeResultsModalBtn.addEventListener('click', () => {
        resultsModal.classList.add('hidden');
        showTab('creator');
        loadGallery();
    });
    closeTextViewerModalBtn.addEventListener('click', () => textViewerModal.classList.add('hidden'));
    pasteExternalCodeBtn.addEventListener('click', () => pasteCodeModal.classList.remove('hidden'));
    cancelPasteModalBtn.addEventListener('click', () => pasteCodeModal.classList.add('hidden'));
    loadPastedCodeBtn.addEventListener('click', loadPastedCode);
}

function showTab(tabName) {
    Object.values(contents).forEach(content => content.classList.add('hidden'));
    Object.values(tabs).forEach(tab => tab.classList.remove('active'));
    contents[tabName].classList.remove('hidden');
    tabs[tabName].classList.add('active');
    
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

    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    if (feedbackMessage.textContent.includes('Link sent') || feedbackMessage.textContent.includes('קישור נשלח')) {
        feedbackMessage.textContent = translations[lang].link_sent;
    }


    
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

function addToConversationLog(type, message, timestamp = Date.now()) {
    conversationHistory.push({ type, message, timestamp });
    updateConversationDisplay();
}

function updateConversationDisplay() {
    if (conversationHistory.length === 0) {
        conversationLog.innerHTML = `<p class="text-gray-500 text-sm">${translations[currentLanguage].conversation_history_placeholder}</p>`;
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
    
    conversationLog.scrollTop = conversationLog.scrollHeight;
}

async function generateAiApp() {
    if (!selectedPersonaId || !selectedPromptId || !aiPromptInput.value.trim()) {
        alert(translations[currentLanguage].select_all_options_alert);
        return;
    }
    
    const persona = personasData.find(p => p.id === selectedPersonaId);
    const promptTemplate = promptsData.find(p => p.id === selectedPromptId);
    
    const promptData = {
        persona: persona.system_prompt[currentLanguage],
        template: promptTemplate.base_prompt[currentLanguage], 
        content: aiPromptInput.value.trim()
    };
    
    const loadingMessage = document.querySelector('#loading-spinner p');
    loadingSpinner.classList.remove('hidden');
    generateAiBtn.disabled = true;

    try {
        const askVibeAI = functions.httpsCallable('askVibeAI');
        const result = await askVibeAI({ 
            prompt: promptData, 
            language: currentLanguage
        });
        
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
        
        conversationHistory = [];
        generationCount = 1;
        currentSessionId = null;
        originalPromptData = promptData;
        addToConversationLog('user', aiPromptInput.value.trim());
        addToConversationLog('ai', `${metadata.appName || 'App'} created successfully!`);
        
        showTab('preview');
    } catch (error) {
        console.error("Error calling AI function:", error);
        alert(`Error: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('hidden');
        generateAiBtn.disabled = false;
    }
}

async function refineApp() {
    const refinementRequest = refinementInput.value.trim();
    if (!refinementRequest || !generatedHtmlContent) return;
    
    refineBtn.disabled = true;
    const originalBtnSpan = refineBtn.querySelector('span');
    originalBtnSpan.textContent = translations[currentLanguage].loading_refine;
    
    addToConversationLog('user', refinementRequest);
    
    try {
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
            language: currentLanguage
        });
        
        if (!result.data.success || !result.data.content) {
            throw new Error("Invalid refinement response from AI function.");
        }
        
        const { htmlCode, metadata } = result.data.content;
        generatedHtmlContent = htmlCode;
        previewIframe.srcdoc = generatedHtmlContent;
        
        if (metadata) {
            if (metadata.appName) document.getElementById('app-name').value = metadata.appName;
            if (metadata.gradeLevel) document.getElementById('grade-level').value = metadata.gradeLevel;
            if (metadata.domain) document.getElementById('domain-input').value = metadata.domain;
            if (metadata.subDomain) document.getElementById('sub-domain-input').value = metadata.subDomain;
            if (metadata.pedagogicalExplanation) document.getElementById('pedagogy').value = metadata.pedagogicalExplanation;
        }
        
        addToConversationLog('ai', 'Refinement successful!');
        refinementInput.value = '';
        generationCount++;
        
    } catch (error) {
        console.error("Error refining app:", error);
        alert(`Error: ${error.message}`);
    } finally {
        refineBtn.disabled = false;
        originalBtnSpan.textContent = translations[currentLanguage].refine_btn;
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
        conversationLog: conversationHistory,
        generationCount: generationCount
    };
    if (!appData.appName || !generatedHtmlContent) {
        alert(translations[currentLanguage].app_details_missing_alert);
        return;
    }
    
    publishBtn.disabled = true;
    publishBtn.querySelector('span').textContent = '...';

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
        alert(`Error: ${error.message}`);
    } finally {
        publishBtn.disabled = false;
        publishBtn.querySelector('span').textContent = translations[currentLanguage].publish_btn;
    }
}

async function getMyLastAppLink() {
    if (!auth.currentUser) { 
        alert(translations[currentLanguage].link_error);
        return; 
    }
    try {
        const querySnapshot = await firestore.collection("community_apps")
            .where("teacher_uid", "==", auth.currentUser.uid)
            .orderBy("createdAt", "desc").limit(1).get();
        if (querySnapshot.empty) { 
            alert(translations[currentLanguage].no_saved_sessions);
            return; 
        }
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
        alert(translations[currentLanguage].link_error);
    }
}

function truncateText(text = '', maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
}

function showFullText(title, content) {
    textViewerTitle.textContent = title;
    textViewerContent.textContent = content;
    textViewerModal.classList.remove('hidden');
}

async function loadGallery() {
    const galleryTableBody = document.getElementById('gallery-table-body');
    const loadingMessage = currentLanguage === 'he' ? 'טוען...' : 'Loading...';
    galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8">${loadingMessage}</td></tr>`;

    try {
        const querySnapshot = await firestore.collection("community_apps").orderBy("createdAt", "desc").get();
        if (querySnapshot.empty) {
            const emptyMessage = currentLanguage === 'he' ? 'הגלריה ריקה.' : 'Gallery is empty.';
            galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8">${emptyMessage}</td></tr>`;
            return;
        }

        galleryTableBody.innerHTML = querySnapshot.docs.map(doc => {
            const app = doc.data();
            const pedagogy = app.pedagogicalExplanation || '';
            const truncatedPedagogy = truncateText(pedagogy, 30);
            const generationInfo = app.generationCount ? ` (${currentLanguage === 'he' ? app.generationCount + ' גרסאות' : app.generationCount + ' versions'})` : '';

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
                          <button onclick="navigator.clipboard.writeText('${app.shortUrl || app.app_url}')" class="text-blue-600 hover:text-blue-800" title="${currentLanguage === 'he' ? 'העתק קישור' : 'Copy link'}">
                             <i class="fas fa-copy"></i>
                          </button>
                          <button onclick="deleteApp('${doc.id}', '${app.appName}')" class="text-red-600 hover:text-red-800 ml-4" title="${currentLanguage === 'he' ? 'מחק יישומון' : 'Delete applet'}">
                             <i class="fas fa-trash"></i>
                          </button>
                    </td>
                </tr>
            `;
        }).join('');

        galleryTableBody.querySelectorAll('[data-fulltext]').forEach(span => {
            span.addEventListener('click', (e) => {
                const fullText = e.target.dataset.fulltext;
                const title = currentLanguage === 'he' ? 'הסבר פדגוגי מלא' : 'Full Pedagogical Explanation';
                showFullText(title, fullText);
            });
        });
    } catch (error) {
        console.error("Error loading gallery:", error);
        const errorMessage = currentLanguage === 'he' ? 'שגיאה בטעינת הגלריה.' : 'Error loading gallery.';
        galleryTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-red-500">${errorMessage}</td></tr>`;
    }
}

async function saveCurrentSession() {
    if (!generatedHtmlContent) {
        alert(translations[currentLanguage].no_app_to_save_alert);
        return;
    }
    
    const sessionName = prompt(translations[currentLanguage].session_name_prompt, document.getElementById('app-name').value || '');
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
            alert(translations[currentLanguage].session_saved_success);
        } else {
            throw new Error(result.data.message || 'שגיאה בשמירה');
        }
    } catch (error) {
        console.error('Error saving session:', error);
        alert(`Error: ${error.message}`);
    }
}

async function showLoadSessionModal() {
    try {
        const getUserWorkSessions = functions.httpsCallable('getUserWorkSessions');
        const result = await getUserWorkSessions();
        
        if (!result.data.success || !result.data.sessions.length) {
            alert(translations[currentLanguage].no_saved_sessions);
            return;
        }
        
        const sessions = result.data.sessions;
        const sessionList = sessions.map((session, index) => 
            `${index + 1}. ${session.sessionName} (${session.appName}) - ${new Date(session.lastUpdated?.toDate?.() || session.lastUpdated).toLocaleDateString()}`
        ).join('\n');
        
        const promptMessage = currentLanguage === 'he'
            ? `בחר סשן לטעינה:\n\n${sessionList}\n\nהקלד מספר:`
            : `Choose session to load:\n\n${sessionList}\n\nEnter number:`;
        const choice = prompt(promptMessage);
        
        if (choice && !isNaN(choice)) {
            const sessionIndex = parseInt(choice) - 1;
            if (sessionIndex >= 0 && sessionIndex < sessions.length) {
                await loadWorkSession(sessions[sessionIndex].id);
            }
        }
        
    } catch (error) {
        console.error('Error loading sessions list:', error);
        alert(`Error: ${error.message}`);
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
        
        generatedHtmlContent = session.currentApp.htmlCode;
        previewIframe.srcdoc = generatedHtmlContent;
        
        if (session.currentApp.metadata) {
            document.getElementById('app-name').value = session.currentApp.metadata.appName || '';
            document.getElementById('grade-level').value = session.currentApp.metadata.gradeLevel || '';
            document.getElementById('domain-input').value = session.currentApp.metadata.domain || '';
            document.getElementById('sub-domain-input').value = session.currentApp.metadata.subDomain || '';
            document.getElementById('pedagogy').value = session.currentApp.metadata.pedagogicalExplanation || '';
        }
        
        currentSessionId = sessionId;
        originalPromptData = session.originalPrompt;
        
        conversationHistory = [];
        if (session.sessionHistory && Array.isArray(session.sessionHistory)) {
            session.sessionHistory.forEach((message, index) => {
                const type = index % 2 === 0 ? 'user' : 'ai';
                conversationHistory.push({
                    type: type,
                    message: message,
                    timestamp: Date.now() - (session.sessionHistory.length - index) * 60000
                });
            });
        }
        updateConversationDisplay();
        
        showTab('preview');
        
        alert(`${translations[currentLanguage].session_loaded_success}`);
        
    } catch (error) {
        console.error('Error loading work session:', error);
        alert(`Error: ${error.message}`);
    }
}

function loadPastedCode() {
    const pastedHtml = externalCodeTextarea.value.trim();
    if (!pastedHtml) return;

    generatedHtmlContent = pastedHtml;
    previewIframe.srcdoc = generatedHtmlContent;

    document.getElementById('app-name').value = '';
    document.getElementById('grade-level').value = '';
    document.getElementById('domain-input').value = '';
    document.getElementById('sub-domain-input').value = '';
    document.getElementById('pedagogy').value = '';

    conversationHistory = [];
    updateConversationDisplay();

    pasteCodeModal.classList.add('hidden');
    showTab('preview');

    alert(translations[currentLanguage].code_loaded_success);
}

async function deleteApp(appId, appName) {
    if (!confirm(`${translations[currentLanguage].delete_confirm_prompt} "${appName}"?`)) {
        return;
    }

    try {
        const deleteApplet = functions.httpsCallable('deleteApplet');
        const result = await deleteApplet({ id: appId });

        if (result.data.success) {
            alert(translations[currentLanguage].app_deleted_success);
            loadGallery();
        } else {
            throw new Error(result.data.error || 'Unknown error');
        }
    } catch (error) {
        console.error("Error deleting applet:", error);
        alert(`Error: ${error.message}`);
    }
}

window.deleteApp = deleteApp;