# מדריך התקנה והגדרה: פרויקט Vibe Studio

**גרסה: 1.2**

מסמך זה מכיל את כל השלבים הנדרשים להקמה מלאה של פרויקט Vibe Studio, מסביבת הענן ועד להרצה מקומית. **עודכן עם פתרונות לכל השגיאות שזוהו במהלך הפיתוח.**

## שלב 1: הגדרת סביבת הענן ב-Firebase

1.  **צור פרויקט חדש** במסוף Firebase (למשל, `fireclassstudio`).
2.  **שדרג את תוכנית החיוב** ל-**Blaze (Pay as you go)**. זה הכרחי להפעלת פונקציות ענן.
3.  **הפעל שירותים:**
    * **Authentication**:
        * עבור ללשונית **Sign-in method**.
        * לחץ על **Email/Password** והפעל את **שני** המתגים: `Email/Password` ו-`Email link (passwordless sign-in)`.
    * **Firestore Database**:
        * צור מסד נתונים חדש במצב **Test mode** ובמיקום הרצוי (למשל, `us-central1`).
    * **Storage**:
        * הפעל את שירות האחסון עם הגדרות ברירת המחדל.
        * **חשוב:** שירות זה יקבל את השם `fireclassstudio.firebasestorage.app` (לא `appspot.com`).
4.  **רשום אפליקציית Web**:
    * לחץ על סמל האינטרנט (`</>`).
    * תן כינוי לאפליקציה (למשל, "Vibe Studio Web").
    * **אל תסמן** את התיבה `Firebase Hosting`.
    * בסיום, העתק את אובייקט ה-`firebaseConfig` המלא ושמור אותו בצד.
5.  **אשר דומיינים (שלב קריטי):**
    * בלשונית **Authentication -> Settings -> Authorized domains**, לחץ על **Add domain**.
    * הוסף את הדומיינים הבאים, אחד אחרי השני:
        * `localhost`
        * `127.0.0.1`

---

## שלב 2: הקמת הפרויקט המקומי

1.  **צור תיקייה חדשה וריקה** במחשב שלך (למשל, `fireclassStudio`).
2.  **פתח טרמינל בתוך התיקייה החדשה** והרץ `firebase init`.
3.  **ענה על השאלות** בתהליך ה-`init` בדיוק לפי הסדר:
    * **Features**: בחר (עם מקש הרווח) את **Firestore**, **Functions**, ו-**Storage**.
    * **Project**: בחר `Use an existing project` ואתר את הפרויקט שיצרת.
    * **Rules files**: לחץ **Enter** בשתי השאלות כדי לקבל את שמות ברירת המחדל.
    * **Language**: בחר **JavaScript**.
    * **ESLint**: בחר **Yes**.
    * **Overwrite package.json?**: הקלד **y** ולחץ Enter.
    * **Install dependencies now?**: בחר **Yes**.
4.  **צור תיקיות בצד הלקוח:** בתוך תיקיית `public`, צור שתי תיקיות: **`css`** ו-**`js`**.

---

## שלב 3: הוספת קוד המקור

1.  **צור את קבצי המקור** (`public/index.html`, `public/css/style.css`, `public/js/studio.js`, ו-`functions/index.js`) והדבק בהם את הקוד המלא מהשיחה שלנו.
2.  **הוסף את פרטי התצורה:** פתח את הקובץ `public/js/firebase-config.js` והדבק בו את אובייקט ה-`firebaseConfig` ששמרת בשלב 1.

---

## שלב 4: התקנת תלויות וקונפיגורציה

1.  **התקן תלויות בשרת:**
    * בטרמינל, נווט לתיקיית `functions` (`cd functions`).
    * הרץ את הפקודה: `npm install jszip axios`.
2.  **הגדר את ESLint:**
    * פתח את הקובץ `functions/.eslintrc.js`.
    * בתוך האובייקט `rules`, הוסף את השורות הבאות:
        ```javascript
        "require-jsdoc": "off",
        "max-len": "off",
        ```
    * חזור לתיקייה הראשית (`cd ..`).

---

## שלב 5: פריסה ובדיקה

1.  **פרוס את קוד השרת לענן:**
    ```bash
    firebase deploy --only functions
    ```
2.  **הרץ את האפליקציה מקומית:**
    * התקן `live-server` (אם לא מותקן): `npm install -g live-server`.
    * נווט לתיקיית `public` (`cd public`).
    * הרץ את הפקודה: `live-server`.

---

## שלב 6: הגדרות לסביבת ייצור (Production)

**חשוב:** כאשר תפרוס את האתר לסביבת הייצור שלך ב-Azure, תצטרך לבצע את הפעולה הבאה כדי שההתחברות תעבוד:

1.  לאחר הפריסה, Azure יספק לך כתובת ברירת מחדל לאתר (לדוגמה: `something.azurestaticapps.net`).
2.  לך למסוף Firebase של פרויקט **`fireclassstudio`**.
3.  עבור אל **Authentication -> Settings -> Authorized domains**.
4.  לחץ **Add domain** והוסף את **הכתובת המלאה שקיבלת מ-Azure**.
5.  אם חיברת דומיין אישי (כמו `studio.fireclass.online`), הוסף גם אותו לרשימה.

פעולה זו הכרחית כדי לאשר ל-Firebase לקבל בקשות התחברות מהאתר החי שלך.

---

## שלב 7: מנגנון Download Tokens - הפתרון הסופי

**עדכון חשוב:** לאחר ניסיונות רבים עם מנגנונים שונים, המערכת עברה לשימוש ב-**Download Tokens** של Firebase Storage. זהו הפתרון היציב והבטוח ביותר.

### מה זה Download Tokens?

Download Tokens הם מנגנון של Firebase Storage שמאפשר גישה לקבצים ללא צורך בהרשאות IAM מורכבות:

- **איך זה עובד:** כל קובץ מקבל UUID ייחודי שנשמר במטא-דאטה שלו.
- **URL גישה:** נבנה בפורמט: `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<uuid>`.
- **יתרונות:** עוקף בעיות הרשאות, עובד מיידית, ומספק גישה בטוחה.

### יישום ב-Code

המערכת מיישמת Download Tokens ב-3 מקומות:

1. **`publishHtml`:** יוצר token לכל קובץ HTML.
2. **`publishZip`:** יוצר token ל-index.html בתוך ה-ZIP.
3. **`downloadCode`:** מפענח URLs עם tokens להורדת קבצים.

### למה זה עובד?

- **ללא IAM:** לא צריך להגדיר הרשאות מורכבות לחשבון השירות.
- **ללא ACL ציבורי:** הקבצים נשארים פרטיים עם גישה מוגבלת.
- **תאימות מלאה:** עובד עם כל הגרסאות של Firebase Storage.

---

## שלב 8 (פתרון תקלות): היסטוריה מלאה של השגיאות והפתרונות

### 8.1. שגיאת HttpsError (500 Internal Server Error)

**הבעיה:** שימוש לא נכון בסינטקס של Firebase Functions v2.

**הסימפטומים:**
- שגיאה 500 בכל הפונקציות
- הודעות שגיאה לא ברורות בצד הלקוח

**הפתרון:**
```javascript
// לפני (שגוי):
const {onCall} = require("firebase-functions/v2/https");
throw new onCall.HttpsError("unauthenticated", "Auth required.");

// אחרי (נכון):
const {onCall, HttpsError} = require("firebase-functions/v2/https");
throw new HttpsError("unauthenticated", "Auth required.");
```

### 8.2. בדיקת verifyTeacher כפולה

**הבעיה:** בדיקה מיותרת של הרשאות מורה בפונקציות publish.

**הסימפטומים:**
- לוגים כפולים
- ביצועים מיותרים

**הפתרון:** הסרת הבדיקה הכפולה והשארת לוג בלבד:
```javascript
console.log(`⚠️ Skipping duplicate verifyTeacher check for ${email}`);
```

### 8.3. בעיות הרשאות Cloud Storage (הבעיה המרכזית)

**הבעיה:** שגיאות 500 עקב בעיות IAM עם makePublic() ו-publicUrl().

**הסימפטומים:**
- שגיאה "Failed to create access URL"
- שגיאות 500 בעת ניסיון לפרסם אפליקציה
- בעיות הרשאות ב-Cloud Storage

**הפתרונות שנוסו:**

#### ניסיון 1: Signed URLs
```javascript
const [signedUrl] = await file.getSignedUrl({
  action: "read",
  expires: Date.now() + 1000 * 60 * 60 * 24 * 365
});
```
**תוצאה:** עדיין בעיות IAM.

#### ניסיון 2: Download Tokens (הפתרון הסופי)
```javascript
const downloadToken = require('crypto').randomUUID();
await file.save(htmlContent, {
  contentType: 'text/html',
  metadata: {
    firebaseStorageDownloadTokens: downloadToken
  }
});

const longUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
```

### 8.4. אתחול Firebase Admin SDK

**הבעיה:** אי-ודאות לגבי הגדרת storageBucket באתחול.

**הפתרון:** אתחול מפורש עם storageBucket:
```javascript
admin.initializeApp({ storageBucket: 'fireclassstudio.firebasestorage.app' });
const bucket = admin.storage().bucket();
console.log(`🚀 Firebase Admin initialized with bucket: ${bucket.name}`);
```

### 8.5. URL Parsing ב-downloadCode

**הבעיה:** תמיכה בפורמטים שונים של URLs.

**הפתרון:** פענוח חכם של URLs:
```javascript
// תמיכה ב-Firebase Storage v0
if (u.hostname.includes("firebasestorage.googleapis.com") && u.pathname.includes(`/v0/b/${bucket.name}/o/`)) {
  filePath = decodeURIComponent(u.pathname.split(`/v0/b/${bucket.name}/o/`)[1]);
}
// תמיכה ב-Google Cloud Storage
else if (u.hostname.endsWith("googleapis.com") && u.pathname.startsWith(`/${bucket.name}/`)) {
  filePath = decodeURIComponent(u.pathname.slice(bucket.name.length + 2));
}
```

---

## שלב 9: בדיקה וניטור

### בדיקת הפונקציות

לאחר פריסה, בדוק את הלוגים ב-Firebase Console:

1. **פונקציות ענן > Logs**
2. **חפש הודעות:**
   - `🚀 Firebase Admin initialized with bucket: fireclassstudio.firebasestorage.app`
   - `📦 Bucket: fireclassstudio.firebasestorage.app, FilePath: apps/...`
   - `⚠️ Skipping duplicate verifyTeacher check for...`

### בדיקת Storage

1. **Firebase Console > Storage > Files**
2. **חפש תיקיות:** `apps/<uid>/<timestamp>/`
3. **וודא שיש:** `index.html` עם מטא-דאטה

### בדיקת URLs

ה-URLs שנוצרים צריכים להיות בפורמט:
```
https://firebasestorage.googleapis.com/v0/b/fireclassstudio.firebasestorage.app/o/apps%2Fuid%2Ftimestamp%2Findex.html?alt=media&token=uuid
```

---

## סיכום הפתרונות

**המערכת עברה מהפך מלא:**
- ❌ **makePublic()** → ✅ **Download Tokens**
- ❌ **publicUrl()** → ✅ **Firebase Storage v0 URLs**
- ❌ **Signed URLs** → ✅ **Download Tokens**
- ❌ **HttpsError שגוי** → ✅ **HttpsError נכון**
- ❌ **אתחול לא ברור** → ✅ **אתחול מפורש**

**התוצאה:** מערכת יציבה, מהירה, ובטוחה ללא בעיות הרשאות! 🚀