# מדריך התקנה והגדרה: פרויקט Vibe Studio

**גרסה: 2.1 - עם מנגנון FireClass Integration, מחיקה מאובטחת ו-TTL אוטומטי**

מסמך זה מכיל את כל השלבים הנדרשים להקמה מלאה של פרויקט Vibe Studio, כולל האינטגרציה החדשה עם FireClass באמצעות Service Account. **עודכן עם המנגנון החדש והבטוח יותר.**

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
5.  **אשר דומיינים (שלב קריטי)**:
    * בלשונית **Authentication -> Settings -> Authorized domains**, לחץ על **Add domain**.
    * הוסף את הדומיינים הבאים, אחד אחרי השני:
        * `localhost`
        * `127.0.0.1`

---

## שלב 2: הגדרת FireClass Service Account (חדש!)

**שלב זה הכרחי למנגנון החדש - גישה ישירה לפיירסטור של FireClass:**

1.  **היכנס לפרויקט FireClass** במסוף Firebase (לא הסטודיו!).
2.  **לך ל-Project Settings** (הגלגל שיניים) → **Service accounts**.
3.  **לחץ על "Generate new private key"**.
4.  **בחר את החשבון:** `firebase-adminsdk-xxxxx@fireclass.iam.gserviceaccount.com`.
5.  **הורד את קובץ ה-JSON** - זהו ה-Service Account שלך.
6.  **שמור את הקובץ** במקום בטוח (אל תעלה אותו לגיט!).

---

## שלב 3: הגדרת Secrets ב-Vibe Studio

1.  **היכנס לפרויקט Vibe Studio** במסוף Firebase.
2.  **לך ל-Functions → Secrets** (אם לא רואה, השתמש ב-CLI).
3.  **הגדר את הסודות הבאים:**

    ```bash
    # הגדר את Service Account של FireClass
    firebase functions:secrets:set FIRECLASS_SERVICE_ACCOUNT
    
    # הגדר את שאר הסודות
    firebase functions:secrets:set GEMINI_API_KEY
    firebase functions:secrets:set BITLY_ACCESS_TOKEN
    ```

4.  **עבור FIRECLASS_SERVICE_ACCOUNT:**
    - פתח את קובץ ה-JSON שהורדת בשלב 2
    - העתק את **כל התוכן** (כולל הסוגריים המסולסלות)
    - הדבק אותו כערך של הסוד

---

## שלב 4: הקמת הפרויקט המקומי

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

## שלב 5: הוספת קוד המקור

1.  **צור את קבצי המקור** (`public/index.html`, `public/css/style.css`, `public/js/studio.js`, ו-`functions/index.js`) והדבק בהם את הקוד המלא מהשיחה שלנו.
2.  **הוסף את פרטי התצורה:** פתח את הקובץ `public/js/firebase-config.js` והדבק בו את אובייקט ה-`firebaseConfig` ששמרת בשלב 1.

---

## שלב 6: התקנת תלויות וקונפיגורציה

1.  **התקן תלויות בשרת**:
    * בטרמינל, נווט לתיקיית `functions` (`cd functions`).
    * הרץ את הפקודה: `npm install bitly qrcode`.
2.  **הגדר את ESLint**:
    * פתח את הקובץ `functions/.eslintrc.js`.
    * בתוך האובייקט `rules`, הוסף את השורות הבאות:
        ```javascript
        "require-jsdoc": "off",

1.  **התקן תלויות בשרת**:
    * בטרמינל, נווט לתיקיית `functions` (`cd functions`).
    * הרץ את הפקודה: `npm install bitly qrcode`.
2.  **הגדר את ESLint**:
    * פתח את הקובץ `functions/.eslintrc.js`.
    * בתוך האובייקט `rules`, הוסף את השורות הבאות:
        ```javascript
        "require-jsdoc": "off",
        "max-len": "off",
        ```
    * חזור לתיקייה הראשית (`cd ..`).

---

## שלב 7: פריסה ובדיקה

1.  **פרוס את קוד השרת לענן**:
    ```bash
    firebase deploy --only functions
    ```
2.  **הרץ את האפליקציה מקומית**:
    * התקן `live-server` (אם לא מותקן): `npm install -g live-server`.
    * נווט לתיקיית `public` (`cd public`).
    * הרץ את הפקודה: `live-server`.

---

## שלב 8: הגדרות לסביבת ייצור (Production)

**חשוב:** כאשר תפרוס את האתר לסביבת הייצור שלך ב-Azure, תצטרך לבצע את הפעולה הבאה כדי שההתחברות תעבוד:

1.  לאחר הפריסה, Azure יספק לך כתובת ברירת מחדל לאתר (לדוגמה: `something.azurestaticapps.net`).
2.  לך למסוף Firebase של פרויקט **`fireclassstudio`**.
3.  עבור אל **Authentication -> Settings -> Authorized domains**.
4.  לחץ **Add domain** והוסף את **הכתובת המלאה שקיבלת מ-Azure**.
5.  אם חיברת דומיין אישי (כמו `studio.fireclass.online`), הוסף גם אותו לרשימה.

פעולה זו הכרחית כדי לאשר ל-Firebase לקבל בקשות התחברות מהאתר החי שלך.

---

## שלב 9: מנגנון Download Tokens - הפתרון הסופי

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

## שלב 10: מנגנון אימות המורה החדש (FireClass Integration)

**המנגנון החדש והבטוח יותר:**

### איך זה עובד:

1. **אפליקציה כפולה:** סטודיו יוצר שתי אפליקציות Firebase Admin:
   - **אפליקציה ראשית:** לגישה לפיירסטור של סטודיו
   - **אפליקציה שנייה:** לגישה לפיירסטור של קלאס

2. **Service Account:** משתמש ב-`FIRECLASS_SERVICE_ACCOUNT` לגישה ישירה לפיירסטור של קלאס

3. **בדיקה ישירה:** שואל ישירות ב-`teachers` collection עם `profile.email`

### יתרונות המנגנון החדש:

- **מהיר יותר:** גישה ישירה לפיירסטור
- **יציב יותר:** לא תלוי ב-API חיצוני
- **בטוח יותר:** הרשאות מוגדרות היטב
- **פשוט יותר:** פחות נקודות כשל

### בדיקת המנגנון:

לאחר פריסה, תראה בלוגים:
```
🔍 [DB-VERIFY] Starting teacher verification for: teacher@example.com
🎯 [DB-VERIFY] Verification result for teacher@example.com: Found
```

---

## שלב 11 (פתרון תקלות): היסטוריה מלאה של השגיאות והפתרונות

### 11.1. שגיאת HttpsError (500 Internal Server Error)

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

### 11.2. בעיות Service Account

**הבעיה:** שגיאות בעת ניסיון לגשת לפיירסטור של קלאס.

**הסימפטומים:**
- שגיאה "CRITICAL: Failed to parse FIRECLASS_SERVICE_ACCOUNT secret"
- שגיאות הרשאה בעת בדיקת מורה

**הפתרון:**
1. וודא שה-`FIRECLASS_SERVICE_ACCOUNT` מוגדר נכון
2. וודא שהערך הוא JSON מלא (כולל סוגריים מסולסלות)
3. וודא שה-Service Account יש לו הרשאות לקרוא לפיירסטור של קלאס

### 11.3. בעיות הרשאות Cloud Storage (הבעיה המרכזית)

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

### 11.4. אתחול Firebase Admin SDK

**הבעיה:** אי-ודאות לגבי הגדרת storageBucket באתחול.

**הפתרון:** אתחול מפורש עם storageBucket:
```javascript
admin.initializeApp({ storageBucket: 'fireclassstudio.firebasestorage.app' });
const bucket = admin.storage().bucket();
console.log(`🚀 Firebase Admin initialized with bucket: ${bucket.name}`);
```

### 11.5. URL Parsing ב-downloadCode

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

## שלב 12: בדיקה וניטור

### בדיקת הפונקציות

לאחר פריסה, בדוק את הלוגים ב-Firebase Console:

1. **פונקציות ענן > Logs**
2. **חפש הודעות:**
   - `🚀 Firebase Admin initialized with bucket: fireclassstudio.firebasestorage.app`
   - `📦 Bucket: fireclassstudio.firebasestorage.app, FilePath: apps/...`
   - `🔍 [DB-VERIFY] Starting teacher verification for...`
   - `🎯 [DB-VERIFY] Verification result for...: Found`

### בדיקת Storage

1. **Firebase Console > Storage > Files**
2. **חפש תיקיות:** `apps/<uid>/<timestamp>/`
3. **וודא שיש:** `index.html` עם מטא-דאטה

### בדיקת URLs

ה-URLs שנוצרים צריכים להיות בפורמט:
```
https://firebasestorage.googleapis.com/v0/b/fireclassstudio.firebasestorage.app/o/apps%2Fuid%2Ftimestamp%2Findex.html?alt=media&token=uuid
```

### בדיקת אימות המורה

1. **נסה להיכנס עם מורה רשום בקלאס**
2. **בדוק בלוגים:** `🎯 [DB-VERIFY] Verification result for...: Found`
3. **אם יש שגיאה:** בדוק את ה-`FIRECLASS_SERVICE_ACCOUNT`

---

## סיכום הפתרונות

**המערכת עברה מהפך מלא:**
- ❌ **makePublic()** → ✅ **Download Tokens**
- ❌ **publicUrl()** → ✅ **Firebase Storage v0 URLs**
- ❌ **Signed URLs** → ✅ **Download Tokens**
- ❌ **HttpsError שגוי** → ✅ **HttpsError נכון**
- ❌ **אתחול לא ברור** → ✅ **אתחול מפורש**
- ❌ **API חיצוני** → ✅ **גישה ישירה לפיירסטור של קלאס**

**התוצאה:** מערכת יציבה, מהירה, ובטוחה עם אינטגרציה מלאה של FireClass! 🚀

---

## שלב 13: הגדרת TTL (Time-to-Live) למחיקה אוטומטית

**שלב זה הכרחי להפעלת מנגנון הניקוי האוטומטי!**

### הגדרת מדיניות TTL למסמכים

לאחר פריסת הקוד, יש להגדיר שתי מדיניות TTL במסוף Firebase:

1. **כנס למסוף Firebase > Firestore Database > TTL**
2. **צור מדיניות ראשונה - טיוטות:**
   - Collection group: `work_sessions`
   - Timestamp field: `expireAt`
   - לחץ Save

3. **צור מדיניות שנייה - תיעוד AI:**
   - לחץ Create Policy
   - Collection group: `generations`
   - Timestamp field: `expireAt`
   - לחץ Save

### מה קורה עם TTL?

- **טיוטות (work_sessions):** נמחקות אוטומטית אחרי 30 יום
- **תיעוד AI (generations):** נמחק אוטומטית אחרי 90 יום
- **חיסכון בעלויות:** מסד נתונים נקי ויעיל
- **ביצועים משופרים:** פחות נתונים לשאילתות

---

## הערות חשובות

1. **אל תעלה את קובץ ה-Service Account לגיט!** הוא מכיל מפתחות פרטיים.
2. **וודא שה-Service Account יש לו הרשאות לקרוא לפיירסטור של קלאס.**
3. **אחרי כל שינוי בקוד, תצטרך לפרוס מחדש את הפונקציות.**
4. **המנגנון החדש עובד רק עם מורים רשומים בקלאס.**
5. **הגדרת TTL היא שלב הכרחי - ללא זה לא יהיה ניקוי אוטומטי!**