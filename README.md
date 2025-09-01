# 🎨 Vibe Studio - AI-Powered Educational App Creator

**גרסה 2.1 - עם שיח רציף ופריסה לGoogle Cloud**

מערכת ליצירת יישומונים חינוכיים באמצעות בינה מלאכותית, המיועדת למורים ללא ידע טכני.

## ✨ תכונות עיקריות

- **🤖 שיח רציף עם AI** - שיפור יישומונים באמצעות דיאלוג טבעי
- **🎭 פרסונות פדגוגיות** - 4 סגנונות הוראה שונים
- **📝 תבניות פעילות** - חידונים, משחקי גרירה, סיפורים ועוד
- **🔒 אימות מורים** - אינטגרציה ישירה עם מערכת FireClass
- **📱 תצוגה מקדימה** - בדיקת היישומון לפני פרסום
- **🌐 פרסום מיידי** - קישורים קצרים וקודי QR אוטומטיים
- **🗂️ גלריית קהילה** - שיתוף יישומונים עם מורים אחרים

## 🏗️ אדריכלות המערכת

```
Frontend (Public)           Backend (Functions)
├── HTML/CSS/JS             ├── askVibeAI (יצירה)
├── Firebase Auth           ├── refineApp (שיפור) ✨ חדש
├── Realtime Preview        ├── publishHtml (פרסום)
└── Bilingual UI (he/en)    └── Teacher Verification
```

## 🚀 התקנה מהירה

```bash
# 1. שכפל את הפרויקט
git clone <repository-url>
cd fireclassStudio

# 2. התקן Firebase CLI
npm install -g firebase-tools
firebase login

# 3. אתחל Firebase
firebase init

# 4. הגדר סודות
./setup-secrets.sh

# 5. פרוס לענן
firebase deploy
```

## 📋 דרישות מוקדמות

### שירותי Cloud נדרשים:
- **Firebase Project** - עם Blaze plan
- **Gemini API Key** - לבינה מלאכותית
- **Bitly Access Token** - לקישורים קצרים
- **FireClass Service Account** - לאימות מורים

### משתני סביבה:
```env
GEMINI_API_KEY=your_gemini_key
BITLY_ACCESS_TOKEN=your_bitly_token
FIRECLASS_PROJECT_ID=fireclass-project
FIRECLASS_CLIENT_EMAIL=firebase-adminsdk-xxx@fireclass.iam.gserviceaccount.com
FIRECLASS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIRECLASS_CLIENT_ID=your_client_id
```

## 👩‍🏫 זרימת עבודה למורה

### שלב 1: בחירת סגנון הוראה
```
🔵 המורה הסוקרטי - שאלות מנחות
🔵 המאמן - רמזים הדרגתיים  
🔵 המדגים - הדגמה צעד אחר צעד
🔵 המספר - למידה דרך נרטיב
```

### שלב 2: בחירת סוג פעילות
```
📝 חידון/מבחן - שאלות רב-ברירתיות
🖱️ משחק גרירה - התאמות והתאמות
📚 סיפור אינטראקטיבי - נקודות החלטה
🧪 סימולציה פשוטה - בקרות אינטראקטיביות
```

### שלב 3: הגדרת תוכן + שיח רציף ✨
```
1. כתיבת בקשה מפורטת
2. יצירת יישומון ראשוני
3. שיפורים איטרטיביים:
   "הוסף טיימר של 30 שניות"
   "שנה את הצבע לכחול"
   "הוסף ציונים עם הודעות מעודדות"
```

## 🔧 מפתחים - מבנה הקוד

### Frontend Structure:
```
public/
├── index.html              # דף ראשי
├── js/
│   ├── firebase-config.js  # הגדרות Firebase
│   └── studio.js          # לוגיקה עיקרית + שיח רציף
├── data/
│   ├── personas.json      # פרסונות AI
│   └── prompts.json       # תבניות פעילות
└── css/
    └── style.css          # עיצוב
```

### Backend Functions:
```
functions/
├── index.js               # כל הפונקציות
├── package.json          # תלויות
└── .eslintrc.js          # הגדרות ESLint
```

### שיח רציף - API חדש:
```javascript
// יצירה ראשונית
exports.askVibeAI = onCall(async (request) => {
  // מקבל: prompt, language
  // מחזיר: htmlCode, metadata
});

// שיפור איטרטיבי ✨
exports.refineApp = onCall(async (request) => {
  // מקבל: refinementRequest, currentContent, conversationHistory
  // מחזיר: htmlCode מעודכן, changesSummary
});
```

## 🔒 אבטחה

### מנגנון אימות מורים:
1. **כניסה** - Firebase Email Magic Link
2. **אימות** - בדיקה ישירה במסד נתונים של FireClass
3. **הרשאות** - רק מורים רשומים יכולים לפרסם

### הגנת מידע רגיש:
- **Service Account** - שמור ב-Firebase Secrets
- **API Keys** - לא חשופים בקליינט
- **Private Keys** - עם הצפנה מלאה

## 📊 אנליטיקה

המערכת מתעדת:
- **היסטוריית שיח** - כל בקשת שיפור ותגובה
- **מספר גרסאות** - כמה איטרציות בוצעו
- **נתוני שימוש** - זמני יצירה ופרסום
- **מטאדאטה חינוכית** - נושא, שכבת גיל, הסבר פדגוגי

## 🐛 פתרון בעיות נפוצות

### שגיאות אימות:
```bash
# בדיקת סודות
firebase functions:secrets:access

# בדיקת הרשאות
firebase auth:import --help
```

### שגיאות פריסה:
```bash
# ניקוי מטמון
firebase functions:delete askVibeAI
firebase deploy --only functions

# צפייה בלוגים
firebase functions:log
```

### שגיאות שיח רציף:
- **וודא שיש תוכן קיים** לפני בקשת שיפור
- **בדוק שפונקציית refineApp** פרוס בהצלחה
- **היסטוריית שיח** נשמרת בזיכרון (לא persistent)

## 🎯 תוכנית פיתוח

### גרסה 2.2 (הבאה):
- [ ] עריכת קוד ידנית
- [ ] היסטוריית גרסאות עם השוואה
- [ ] תבניות מותאמות אישית

### גרסה 3.0 (עתידית):
- [ ] מערכת דירוגים וביקורות
- [ ] ייצוא ל-SCORM ו-PDF
- [ ] אנליטיקה מתקדמת למורים
- [ ] שיתוף פעולה רב-משתמשים

## 🤝 תרומה לפרויקט

1. **Fork** את הפרויקט
2. **צור branch** לתכונה החדשה
3. **Commit** את השינויים
4. **Push** ל-branch
5. **צור Pull Request**

### הנחיות תרומה:
- **ESLint** - עבור על כל הקוד
- **Testing** - בדוק בסביבת emulators
- **Documentation** - עדכן README ומסמכים
- **Security** - אל תחשוף מפתחות או סודות

## 📞 תמיכה

- **GitHub Issues** - לבאגים ובקשות תכונות
- **Documentation** - `docs/` תיקיה
- **Firebase Console** - לוגים ומעקב

## 📄 רישיון

MIT License - ראה `LICENSE` לפרטים

---

**🎓 Vibe Studio - Making AI-Powered Education Accessible to All Teachers**
