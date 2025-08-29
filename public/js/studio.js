// --- Initialize Firebase ---
// Assumes firebase-config.js is loaded in HTML
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
        app_details_title: "1. App Details",
        app_name_label: "App Name",
        grade_level_label: "Grade Level",
        domain_label: "Domain",
        sub_domain_label: "Sub-domain",
        pedagogy_label: "Pedagogical Explanation",
        ai_prompt_title: "2. Describe Your Applet",
        ai_prompt_placeholder: "e.g., Create a game for 3rd grade to practice addition and subtraction up to 100...",
        generate_btn: "Generate with AI",
        preview_title: "3. Live Preview",
        preview_placeholder: "The preview of your applet will appear here...",
        generated_code_title: "Generated HTML Code:",
        publish_btn: "Publish to Gallery",
        loading_ai: "Generating... Please wait...",
        publish_success_title: "App Published Successfully!",
        gallery_title: "Community App Gallery",
    },
    he: {
        login_title: "Vibe Studio",
        login_prompt: "הכנס את המייל לקבלת קישור כניסה מאובטח.",
        send_link_btn: "שלח קישור",
        studio_title: "Vibe Studio",
        gallery_btn: "גלריה",
        logout_btn: "התנתק",
        app_details_title: "1. פרטי האפליקציה",
        app_name_label: "שם האפליקציה",
        grade_level_label: "שכבת גיל",
        domain_label: "תחום",
        sub_domain_label: "תת-תחום",
        pedagogy_label: "הסבר פדגוגי",
        ai_prompt_title: "2. תאר את היישומון הרצוי",
        ai_prompt_placeholder: "לדוגמה: צור משחקון לכיתה ג' לתרגול חיבור וחיסור עד 100...",
        generate_btn: "צור עם AI",
        preview_title: "3. תצוגה מקדימה",
        preview_placeholder: "התצוגה המקדימה של היישומון תופיע כאן...",
        generated_code_title: "קוד HTML שנוצר:",
        publish_btn: "פרסם לגלריה",
        loading_ai: "יוצר... אנא המתן...",
        publish_success_title: "האפליקציה פורסמה בהצלחה!",
        gallery_title: "גלריית אפליקציות קהילתית",
    }
};

let currentLanguage = 'he';
let generatedHtmlContent = ''; // Store generated HTML for publishing

// --- DOM Element References ---
const loginContainer = document.getElementById('login-container');
const studioContainer = document.getElementById('studio-container');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const sendLinkBtn = document.getElementById('send-link-btn');
const feedbackMessage = document.getElementById('feedback-message');
const logoutBtn = document.getElementById('logout-btn');
const galleryViewBtn = document.getElementById('gallery-view-btn');
const langEnBtn = document.getElementById('lang-en-btn');
const langHeBtn = document.getElementById('lang-he-btn');

// Creator & Gallery Views
const creatorView = document.getElementById('creator-view');
const galleryView = document.getElementById('gallery-view');
const aiPromptInput = document.getElementById('ai-prompt-input');
const generateAiBtn = document.getElementById('generate-ai-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const generationResultArea = document.getElementById('generation-result-area');
const previewIframe = document.getElementById('preview-iframe');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const htmlCodeOutput = document.getElementById('html-code-output');
const publishBtn = document.getElementById('publish-btn');
const resultsModal = document.getElementById('results-modal');
const closeResultsModalBtn = document.getElementById('close-results-modal');

// --- Language & View Management ---
function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    langEnBtn.classList.toggle('bg-blue-100', lang === 'en');
    langEnBtn.classList.toggle('text-blue-700', lang === 'en');
    langHeBtn.classList.toggle('bg-blue-100', lang === 'he');
    langHeBtn.classList.toggle('text-blue-700', lang === 'he');
}

langEnBtn.addEventListener('click', () => setLanguage('en'));
langHeBtn.addEventListener('click', () => setLanguage('he'));

galleryViewBtn.addEventListener('click', () => {
    creatorView.classList.add('hidden');
    galleryView.classList.remove('hidden');
    // We would load the gallery here. For now, it's a placeholder.
});


// --- Authentication Logic ---
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.add('hidden');
        studioContainer.classList.remove('hidden');
    } else {
        loginContainer.classList.remove('hidden');
        studioContainer.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalBtnText = sendLinkBtn.textContent;
    sendLinkBtn.disabled = true;
    sendLinkBtn.textContent = '...';
    
    try {
        await auth.sendSignInLinkToEmail(emailInput.value, {
            url: window.location.href,
            handleCodeInApp: true,
        });
        window.localStorage.setItem('emailForSignIn', emailInput.value);
        feedbackMessage.textContent = 'קישור נשלח! בדוק את המייל.';
        feedbackMessage.className = 'text-green-600';
    } catch (error) {
        console.error(error);
        feedbackMessage.textContent = 'שגיאה בשליחת הקישור.';
        feedbackMessage.className = 'text-red-600';
    } finally {
        sendLinkBtn.disabled = false;
        sendLinkBtn.textContent = originalBtnText;
    }
});

if (auth.isSignInWithEmailLink(window.location.href)) {
    let email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
        email = window.prompt('אנא הזן את המייל לאימות');
    }
    if (email) {
        auth.signInWithEmailLink(email, window.location.href)
            .then(() => window.localStorage.removeItem('emailForSignIn'))
            .catch(error => console.error(error));
    }
}

logoutBtn.addEventListener('click', () => auth.signOut());


// --- AI Generation Logic ---
generateAiBtn.addEventListener('click', async () => {
    const prompt = aiPromptInput.value.trim();
    if (!prompt) {
        alert('Please enter a description for the applet.');
        return;
    }

    loadingSpinner.classList.remove('hidden');
    generationResultArea.classList.add('hidden');
    generateAiBtn.disabled = true;

    try {
        const askVibeAI = functions.httpsCallable('askVibeAI');
        const result = await askVibeAI({ prompt: prompt, language: currentLanguage });
        
        if (!result.data || !result.data.htmlCode || !result.data.metadata) {
             throw new Error("Invalid response structure from AI function.");
        }
        const { htmlCode, metadata } = result.data;
        
        // Populate form and preview
        document.getElementById('app-name').value = metadata.appName || '';
        document.getElementById('grade-level').value = metadata.gradeLevel || '';
        document.getElementById('domain-input').value = metadata.domain || '';
        document.getElementById('sub-domain-input').value = metadata.subDomain || '';
        document.getElementById('pedagogy').value = metadata.pedagogicalExplanation || '';
        
        htmlCodeOutput.value = htmlCode || '';
        generatedHtmlContent = htmlCode || ''; // Store for publishing

        previewIframe.srcdoc = generatedHtmlContent; 
        previewPlaceholder.classList.add('hidden');
        previewIframe.classList.remove('hidden');
        
        generationResultArea.classList.remove('hidden');

    } catch (error) {
        console.error("Error calling askVibeAI function:", error);
        alert(`Error generating app: ${error.message}`);
    } finally {
        loadingSpinner.classList.add('hidden');
        generateAiBtn.disabled = false;
    }
});


// --- Publishing Logic ---
publishBtn.addEventListener('click', async () => {
    const appData = {
        appName: document.getElementById('app-name').value.trim(),
        gradeLevel: document.getElementById('grade-level').value.trim(),
        domain: document.getElementById('domain-input').value.trim(),
        subDomain: document.getElementById('sub-domain-input').value.trim(),
        pedagogy: document.getElementById('pedagogy').value.trim(),
        htmlContent: generatedHtmlContent,
        // Add other fields if necessary, e.g., school code, instructions
        schoolCode: "00000", // Default or from a form field
        instructions: "" // Default or from a form field
    };

    if (!appData.appName || !generatedHtmlContent) {
        alert('App Name and generated content are required.');
        return;
    }
    const originalBtnText = publishBtn.querySelector('span').textContent;
    publishBtn.disabled = true;
    publishBtn.querySelector('span').textContent = '...';

    try {
        // Reusing the existing publishHtml cloud function
        const publishHtml = functions.httpsCallable('publishHtml');
        const result = await publishHtml(appData);

        if (result.data.success) {
            document.getElementById('result-long-url').href = result.data.longUrl;
            document.getElementById('result-long-url').textContent = result.data.longUrl;
            resultsModal.classList.remove('hidden');
            resultsModal.classList.add('flex');
        } else {
            throw new Error(result.data.error || 'Unknown publishing error.');
        }

    } catch (error) {
        console.error("Error publishing:", error);
        alert(`Failed to publish: ${error.message}`);
    } finally {
        publishBtn.disabled = false;
        publishBtn.querySelector('span').textContent = originalBtnText;
    }
});

closeResultsModalBtn.addEventListener('click', () => {
    resultsModal.classList.add('hidden');
    resultsModal.classList.remove('flex');
});


// --- Initial Setup ---
setLanguage('he'); // Set default language to Hebrew

