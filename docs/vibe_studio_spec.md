# Vibe Studio – Version 2.0 Specification

**Last Updated:** December 20, 2024  
**Status:** In Development

---

## 1. Vision & Core Philosophy

**Vibe Studio** is a *No-Code* web platform that empowers teachers to create interactive educational applets through natural dialogue with AI.

The platform supports both AI-guided creation for rapid development and manual code ingestion for maximum flexibility.

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
- **AI Model:** Google Gemini API (`gemini-2.5-flash`) with structured JSON output
- **FireClass Integration:** Direct Firestore access via Service Account

---

## 3. Creation Workflows

Vibe Studio offers two distinct creation paths to accommodate different teacher preferences and needs:

### Workflow A: AI-Guided Creation
The primary workflow is a guided dialogue with the AI in three steps:

#### Step 1: Choose the AI Persona (*The How*)
- Teachers select from a library of **AI Teacher Personas**, each representing a pedagogical style
- Examples: *Socratic Teacher, The Coach, The Demonstrator, The Storyteller, Gamified Teacher*
- Optional refinement: Teachers may add a short sentence (e.g., "...use a friendly and encouraging tone.")

#### Step 2: Choose the Activity Template (*The What*)
- Teachers select from **predefined Activity Templates** (JSON-based)
- Examples: *Quiz/Test, Drag & Drop Game, Puzzle, Simulation*
- Each template provides a structured prompt with placeholders

#### Step 3: Add Specific Content (*The Why*)
- Teachers fill in the template with actual content and context
- Example:  
  *"A quiz for 4th graders on the water cycle, 5 multiple-choice questions on evaporation, condensation, precipitation. Make it funny with animal characters."*

After generation, the teacher can refine via chat-like dialogue:  
*"Make question 3 harder," "Add scoring system," etc.*

### Workflow B: Manual Code Ingestion
For teachers who create applets using external tools (like ChatGPT, Claude, or a code editor), Vibe Studio offers a manual ingestion path.

**Paste Code:** The user pastes a complete, single-page HTML file into a dedicated modal window.

**Preview:** The system renders the pasted code in the live preview iframe.

**Refine (Optional):** The user can then leverage Vibe Studio's integrated Gemini AI to make iterative improvements on the pasted code.

**Publish:** The user manually fills in the applet's metadata (name, grade level, etc.) and uses the standard publishing workflow to save and share the applet.

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

### 5.2 Work Session Management Functions

**saveWorkSession:**
- Saves current app state with metadata and conversation history
- Automatically sets 30-day expiration timestamp
- Returns session ID for future retrieval

**loadWorkSession:**
- Loads saved session by ID with ownership verification
- Restores app content, metadata, and conversation history
- Updates last accessed timestamp

**getUserWorkSessions:**
- Retrieves list of user's saved sessions (limited to 20 most recent)
- Includes session names, app names, and timestamps
- Supports session management workflow

### 5.3 App Management Functions

**deleteApplet:**
- Securely deletes applet with ownership verification
- Removes both Firestore document and Firebase Storage files
- Requires authentication and ownership confirmation

**updateAppDetails:**
- Allows teachers to update app metadata (owner only)
- Restricts updates to specific fields for security
- Maintains audit trail with update timestamps

---

## 5. Cloud Functions & AI Integration

### 5.1 askVibeAI Function

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
- **External Code Ingestion:** Modal window for pasting HTML code from external sources
- **Dynamic Loading Messages:** Real-time progress updates during AI generation
- **Dual Creation Paths:** AI-guided creation and manual code ingestion workflows
- **Secure App Deletion:** Delete button in gallery with ownership verification
- **Work Session Management:** Save/load draft sessions with automatic expiration

---

## 8. App Management & Lifecycle

### 8.1 Secure App Deletion System
Vibe Studio provides teachers with secure deletion capabilities for their own applets:

**Security Features:**
- **Ownership Verification:** Only the app owner can delete their applets
- **Dual Confirmation:** User must confirm deletion with a warning dialog
- **Complete Cleanup:** Removes both Firestore documents and Firebase Storage files
- **Audit Trail:** All deletion operations are logged for security monitoring

**Deletion Process:**
1. Teacher clicks delete button in gallery view
2. System displays confirmation dialog with app name
3. Upon confirmation, `deleteApplet` Cloud Function is called
4. Function verifies ownership and performs complete cleanup
5. Gallery is automatically refreshed to reflect changes

### 8.2 Automatic Data Expiration (TTL)
The system implements automatic data cleanup to maintain efficiency and reduce costs:

**Work Sessions (Drafts):**
- **Collection:** `work_sessions`
- **Expiration:** 30 days from creation
- **Purpose:** Clean up unused teacher drafts and work-in-progress
- **Field:** `expireAt` timestamp

**AI Generation Logs:**
- **Collection:** `generations`
- **Expiration:** 90 days from creation
- **Purpose:** Maintain AI analytics while preventing data accumulation
- **Field:** `expireAt` timestamp

**TTL Configuration:**
- Requires manual setup in Firebase Console
- Two separate policies for different collections
- Automatic deletion handled by Firebase infrastructure

---

## 9. Publishing Workflow

### 8.1 Publish Function (publishHtml)
- **Teacher Verification:** Direct Firestore query to FireClass database via Service Account
- **File Storage:** Saves applet HTML to Firebase Storage at: `apps/{uid}/{timestamp}/index.html`
- **URL Generation:** Creates secure public URL with download token
- **Bit.ly Integration:** Generates short link for sharing
- **Returns:** `{longUrl, shortUrl, qrCodeDataUrl}`

This function handles both applets generated by the internal AI and those ingested via the manual code pasting workflow. For manually pasted applets, all metadata is provided by the user directly in the publish tab.

### 8.2 Teacher Verification System
**New Architecture (v2.0):**
- **Primary App:** Vibe Studio (admin.initializeApp())
- **Secondary App:** FireClass (admin.initializeApp({credential: serviceAccount}, 'fireClassApp'))
- **Direct Access:** Queries FireClass Firestore directly via `teachers` collection
- **Query Field:** `profile.email` for exact teacher matching
- **Security:** Uses `FIRECLASS_SERVICE_ACCOUNT` secret for authentication

**Benefits:**
- No external API dependencies
- Faster response times
- More reliable verification
- Direct database access

### 8.3 Metadata Storage
**Firestore Collection:** `community_apps`

**Fields:**
- `appName`, `gradeLevel`, `domain`, `subDomain`
- `schoolCode` (default "00000")
- `pedagogicalExplanation`, `instructions`
- `app_url`, `teacher_uid`, `teacher_name`, `createdAt`

### 8.4 Update Function (updateAppDetails)
Teachers may update app details (only owner can edit).

---

## 9. Security & Permissions

- All Cloud Functions require authenticated users
- **Teacher Verification:** Direct Firestore access to FireClass database via Service Account
- **Service Account:** `FIRECLASS_SERVICE_ACCOUNT` secret contains full JSON credentials
- **Dual App Architecture:** Separate Firebase Admin instances for Studio and FireClass
- Firestore rules enforce: only the owner (`teacher_uid`) can update their apps
- Published apps are accessible only via secure download token URLs

---

## 10. Non-Functional Requirements

- **Responsiveness:** Generated applets must be mobile-friendly
- **Performance:** Applet preview injected in under ~3 seconds
- **Accessibility:** Clear labels, loading spinners, bilingual support
- **Reliability:** AI responses validated against schema
- **Code Quality:** Generated HTML must be single-file, Tailwind-based, readable, and commented
- **Teacher Verification:** Sub-second response time for database queries
- **User Experience:** Dynamic loading messages provide real-time feedback during AI generation
- **Flexibility:** Support for both AI-generated and manually pasted code with seamless workflow integration
- **Data Management:** Automatic cleanup of expired drafts and AI logs to maintain system efficiency
- **Security:** Secure deletion system with ownership verification and complete data cleanup

---

## 11. Future Roadmap

### Version 3.0 (Enhanced FireClass Integration)
- Real-time sync of published apps to teacher's personal FireClass library
- Suggest apps to public library pending admin approval
- Advanced teacher analytics and usage tracking

### Version 4.0 (Hybrid Deployment Model)
To support teachers with multi-file projects (containing separate JS/CSS/image files) and to shift hosting costs, a hybrid deployment model will be introduced.

**Netlify Integration:** Teachers will be able to connect their personal Netlify account to Vibe Studio via a secure OAuth2 flow.

**Automated Deployment:** Vibe Studio will provide an interface for teachers to upload a .zip file of their project. The backend will then use the Netlify API to programmatically deploy the zipped project directly to the teacher's own Netlify account.

**Benefit:** This empowers advanced users and transitions the hosting responsibility for complex projects from the central platform to the individual teacher, creating a sustainable cost model.

---

*End of Specification*