# Vibe Studio - Version 2.0 🎯

**מערכת ליצירת יישומונים חינוכיים באמצעות AI עם דיאלוג רציף**

## ✨ תכונות חדשות ב-Version 2.0

### 1. **דיאלוग רציף עם AI** 
- המורה יכול להמשיך לשפר את האפליקציה ללא צורך לחזור על הבקשה המקורית
- פשוט כותבים: "שנה צבע לכחול" או "הוסף כפתור איפוס"
- המערכת זוכרת את כל השיחה והקשר

### 2. **מערכת Save & Resume**
- שמירה ידנית של סשן עבודה
- חזרה למחרת והמשך מאותה נקודה
- רשימת סשנים שמורים עם תאריכים

### 3. **Mega-Prompt Architecture** 
- בניית prompt מובנה משלושה רכיבים:
  - **Persona** (סגנון הוראה)
  - **Template** (סוג פעילות) 
  - **Content** (תוכן ספציפי)

### 4. **Teacher Verification עם FireClass**
- אימות מורים ישיר מול מסד הנתונים של FireClass
- גישה מהירה וימינה ללא תלות בAPI חיצוני

## 🚀 איך המערכת עובדת

### **שלב 1: יצירה ראשונית**
```javascript
// הפרונט-אנד שולח:
{
  prompt: {
    persona: "אתה מורה מעודד...",
    template: "צור חידון עם 5 שאלות...", 
    content: "על מחזור המים לכיתה ד"
  },
  language: "he"
}
```

### **שלב 2: שיפור רציף**
```javascript  
// הפרונט-אנד שולח:
{
  prompt: { content: "שנה את הצבע לכחול" },
  currentApp: { htmlCode: "...", metadata: {...} },
  language: "he"
}
```

### **שלב 3: שמירה וחזרה**
```javascript
// שמירה:
saveWorkSession({
  sessionName: "חידון מחזור המים",
  currentApp: {...},
  originalPrompt: {...},
  sessionHistory: ["שיניתי צבע", "הוספתי כפתור"]
})

// טעינה למחרת:
loadWorkSession({ sessionId: "abc123" })
```

## 🔧 Backend Functions

### **askVibeAI** - פונקציה אחת לכל הצרכים
- **יצירה ראשונית**: כאשר אין `currentApp`
- **שיפור**: כאשר יש `currentApp` 
- מחזיר: `{success: true, content: {htmlCode, metadata}, isRefinement: boolean}`

### **Work Session Management**
- **saveWorkSession** - שמירת סשן עבודה
- **loadWorkSession** - טעינת סשן קיים  
- **getUserWorkSessions** - רשימת סשנים של המשתמש

### **publishHtml** - פרסום לגלריה
- אימות מורה מול FireClass
- יצירת קישור קצר ו-QR code
- שמירה ב-`community_apps`

## 📁 מבנה נתונים

### **Firestore Collections:**

#### `work_sessions` - סשנים שמורים
```javascript
{
  uid: "user123",
  sessionName: "חידון מחזור המים",
  currentApp: { htmlCode: "...", metadata: {...} },
  originalPrompt: { persona: "...", template: "...", content: "..." },
  sessionHistory: ["בקשה 1", "בקשה 2"],
  createdAt: timestamp,
  lastUpdated: timestamp,
  status: "active"
}
```

#### `community_apps` - אפליקציות שפורסמו
```javascript
{
  appName: "חידון מחזור המים",
  gradeLevel: "כיתה ד",
  domain: "מדעים", 
  subDomain: "מחזור המים",
  pedagogicalExplanation: "למידה פעילה...",
  app_url: "https://...",
  shortUrl: "https://bit.ly/...",
  qrCodeDataUrl: "data:image/png;base64,...",
  teacher_uid: "user123",
  schoolCode: "123456789"
}
```

#### `generations` - לאנליטיקה
```javascript
{
  uid: "user123",
  prompt: {...},
  currentApp: {...} || null,
  isRefinement: boolean,
  language: "he",
  response: {...},
  model: "gemini-2.5-flash-001"
}
```

## 🎯 User Experience

### **למורה חדש:**
1. נכנס עם Magic Link  
2. בוחר Persona + Template
3. מתאר מה הוא רוצה
4. AI יוצר אפליקציה
5. מקבל אפשרות לשפר: "הוסף טיימר"
6. ממשיך לשפר עד שמרוצה
7. שומר סשן או מפרסם

### **למורה חוזר:**
1. נכנס למערכת
2. לוחץ "טען" 
3. רואה רשימת סשנים שמורים
4. בוחר סשן
5. ממשיך מאותה נקודה
6. "שנה את הפונט לגדול יותר"

## 🔑 Secrets הנדרשים ב-Firebase

```bash
# Firebase CLI commands:
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set BITLY_ACCESS_TOKEN  
firebase functions:secrets:set FIRECLASS_SERVICE_ACCOUNT
```

## 🚀 Deploy

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
firebase deploy --only hosting
```

## ⚡ תכונות טכניות

- **Gemini 2.5 Flash** - המודל החדש והמהיר
- **JSON Schema** - תגובות מובנות מה-AI
- **UTF-8 Encoding** - תמיכה מלאה בעברית
- **Dual Firebase Apps** - FireStudio + FireClass
- **BitlyClient** - קישורים קצרים  
- **QR Code Generation** - קודי QR אוטומטיים

---

**המערכת מוכנה לעבודה!** 🎉

כל הפונקציות מעודכנות לגירסה 2.5 של Gemini ותומכות בדיאלוג רציף עם שמירה וחזרה.
