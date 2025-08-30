# Vibe Studio – Version 2.0 Specification

**Last Updated:** August 30, 2025  
**Status:** In Development

---

## 1. Vision & Core Philosophy

**Vibe Studio** is a *No-Code* web platform that empowers teachers to create interactive educational applets through natural dialogue with AI.

The guiding philosophy is that building a high-quality educational tool is not a single step, but a **multi-layered process**.

Version 2.0 introduces:
- **Pedagogical Personas** (the *How*)
- **Activity Templates** (the *What*)
- **Specific Content Definition** (the *Why*)

This layered workflow enables teachers to control pedagogy, structure, and content, while the AI handles technical implementation.

The system is fully **bilingual (Hebrew & English)**, including the interface and AI generation.

---

## 2. Core Technologies

- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript (Azure Static Web Apps)
- **Backend:** Firebase (US-Central1)
- **Authentication:** Firebase Authentication (Email Magic Link)
- **Database:** Firestore
- **Serverless Logic:** Firebase Cloud Functions
- **File Storage:** Firebase Cloud Storage (HTML applets with secure download tokens)
- **AI Model:** Google Gemini API (`gemini-1.5-flash`) with structured JSON output

---

## 3. Pedagogical Workflow (3 Steps)

The user experience is structured as a **guided dialogue** with the AI:

### Step 1: Choose the AI Persona (*The How*)
- Teachers select from a library of **AI Teacher Personas**, each representing a pedagogical style
- Examples: *Socratic Teacher, The Coach, The Demonstrator, The Storyteller, Gamified Teacher*
- Optional refinement: Teachers may add a short sentence (e.g., "...use a friendly and encouraging tone.")

### Step 2: Choose the Activity Template (*The What*)
- Teachers select from **predefined Activity Templates** (JSON-based)
- Examples: *Quiz/Test, Drag & Drop Game, Puzzle, Simulation*
- Each template provides a structured prompt with placeholders

### Step 3: Add Specific Content (*The Why*)
- Teachers fill in the template with actual content and context
- Example:  
  *"A quiz for 4th graders on the water cycle, 5 multiple-choice questions on evaporation, condensation, precipitation. Make it funny with animal characters."*

After generation, the teacher can refine via chat-like dialogue:  
*"Make question 3 harder," "Add scoring system," etc.*

---

## 4. Mega-Prompt Construction

The system builds a **Mega-Prompt** that combines all teacher selections into one structured request.

**Structure:**
```
--- Base System Instruction ---
You are an expert developer of single-file HTML educational applets.
Always respond with JSON matching the schema.

--- AI Persona (Teaching Style) ---
{Selected Persona Prompt}
{Optional teacher refinement}

--- Teacher's Request (Activity + Content) ---
{Completed Activity Template with filled-in content}
```

This **Mega-Prompt** is passed to the `askVibeAI` Cloud Function.

---

## 5. AI & Cloud Function: askVibeAI

- **Input:**
  - `prompt`: Mega-Prompt object (persona + template + content)
  - `language`: `"en"` or `"he"`

- **Logic:**
  - Combines system instructions with teacher input
  - Defines a rigid **JSON schema** for output
  - Calls Gemini API (`responseMimeType=application/json`)

- **Output (Schema):**
```json
{
  "htmlCode": "string (complete single-file HTML)",
  "metadata": {
    "appName": "string",
    "gradeLevel": "string",
    "domain": "string",
    "subDomain": "string",
    "pedagogicalExplanation": "string"
  }
}
```

---

## 6. Data Files

Two static JSON files define the libraries used in the UI:

- `public/data/personas.json` → AI Teacher Personas
- `public/data/prompts.json` → Activity Templates

Both support bilingual content (English/Hebrew).

---

## 7. User Interface

### 7.1 Views
- **Login Screen:** Email Magic Link authentication
- **Studio View:** Persona + Activity + Prompt + Live Preview
- **Gallery View:** Placeholder for community apps (to be expanded)

### 7.2 Features
- Language toggle (en/he), with full UI i18n
- Prompt box for dialogue
- Live Preview via `iframe.srcdoc`
- Auto-filled metadata form from AI JSON
- Publish button → triggers save to Firebase

---

## 8. Publishing Workflow

### 8.1 Publish Function (publishHtml)
- Saves applet HTML to Firebase Storage at: `apps/{uid}/{timestamp}/index.html`
- Generates secure public URL with download token
- Calls TinyURL API for short link
- Returns `{longUrl, shortUrl}`

### 8.2 Metadata Storage
**Firestore Collection:** `community_apps`

**Fields:**
- `appName`, `gradeLevel`, `domain`, `subDomain`
- `schoolCode` (default "00000")
- `pedagogicalExplanation`, `instructions`
- `app_url`, `teacher_uid`, `teacher_name`, `createdAt`

### 8.3 Update Function (updateAppDetails)
Teachers may update app details (only owner can edit).

---

## 9. Security & Permissions

- All Cloud Functions require authenticated users
- Firestore rules enforce: only the owner (`teacher_uid`) can update their apps
- Published apps are accessible only via secure download token URLs

---

## 10. Non-Functional Requirements

- **Responsiveness:** Generated applets must be mobile-friendly
- **Performance:** Applet preview injected in under ~3 seconds
- **Accessibility:** Clear labels, loading spinners, bilingual support
- **Reliability:** AI responses validated against schema
- **Code Quality:** Generated HTML must be single-file, Tailwind-based, readable, and commented

---

## 11. Future Roadmap

### Version 3.0 (FireClass Integration)
- Auto-sync published apps to teacher's personal FireClass library
- Suggest apps to public library pending admin approval

### Version 4.0 (Advanced Users)
- Manual .zip upload option
- Deployment to Netlify for complex multi-file projects
- Hybrid model: simple AI apps → Firebase, advanced apps → Netlify

---

*End of Specification*