# Vibe Studio - מפרט טכני

**גרסה:** 1.1  
**תאריך:** 26 באוגוסט 2025

## 1. סקירה כללית ומטרות

"Vibe Studio" היא פלטפורמת "No-Code" מבוססת web, המאפשרת למורים ליצור אפליקציות אינטראקטיביות וכלים לימודיים באמצעות שיחה בשפה טבעית עם מגוון מודלי בינה מלאכותית. המערכת נועדה להסיר את המחסום הטכני של פיתוח קוד ולאפשר למורים להתמקד באופן מלא ביצירת תוכן פדגוגי עשיר. האפליקציות שייווצרו ישותפו בגלריה קהילתית לשימוש כלל המורים במערכת.

## 2. ארכיטקטורה וטכנולוגיות

המערכת תתבסס על ארכיטקטורה היברידית מודרנית, המפרידה באופן ברור בין צד הלקוח לצד השרת, בדומה לארכיטקטורה המוכחת של fireClass בגרסתה העדכנית.

### רכיבי המערכת

- **Frontend (צד לקוח):** אפליקציית Web מבוססת HTML, CSS ו-JavaScript. תאוחסן ב-**Azure Static Web Apps**.

- **Backend (צד שרת):** פרויקט **Firebase** ייעודי שירוץ בשרתים בארה"ב (**us-central1**).

### שירותי Backend

- **אימות:** Firebase Authentication (מנגנון Magic Link).
- **לוגיקה:** Firebase Cloud Functions.
- **מסד נתונים (קטלוג):** Firestore.
- **אחסון קבצים:** Firebase Cloud Storage עם מנגנון Download Tokens.

### פלטפורמות נוספות

- **פלטפורמת פריסה (Deployment):** האפליקציות שהמורים ייצרו יפורסמו באופן אוטומטי ומיידי באמצעות ה-API של **Netlify**.

- **מודלי AI:** המערכת תתמוך ב-API הסטנדרטי ("ונילה") של **Claude, Gemini, ו-ChatGPT**.

### דיאגרמת ארכיטקטורה

```
graph TD
    subgraph "Teacher's Browser"
        A[Vibe Studio UI on Azure]
    end
    
    subgraph "Google Cloud / Firebase (us-central1)"
        B(Firebase Auth - Magic Link)
        C[Cloud Function: askVibeAI]
        D[Cloud Function: uploadVibeApp]
        E[(Firestore: Apps Catalog)]
        F[(Cloud Storage: Apps Files)]
    end
    
    subgraph "3rd Party APIs"
        G[AI APIs: Gemini, Claude, etc.]
        H[Netlify API]
    end
    
    A -- 1. Login --> B
    A -- 2. Send Prompt --> C
    C -- 3. Query AI --> G
    G -- 4. Return Code --> C
    C -- 5. Return Code to UI --> A
    A -- 6. Send Final Code + Metadata --> D
    D -- 7. Save to Storage + Generate Download Token --> F
    D -- 8. Deploy to Netlify --> H
    H -- 9. Return Live URL --> D
    D -- 10. Save Metadata + URLs --> E
```

## 3. קהל יעד ותרחישי שימוש

### קהל יעד
מורים בטווח כיתות K-12, ללא צורך בידע קודם בפיתוח.

### תרחיש מרכזי (יצירת אפליקציה)

1. מורה נכנס ל-Studio, בוחר מודל AI (למשל, Claude).
2. כותב הנחיה: "בנה לי חידון על ערי בירה באירופה".
3. החידון מופיע וניתן למשחק בחלון תצוגה מקדימה חיה.
4. המורה ממשיך את השיחה כדי לשפר את החידון ("הוסף ניקוד").
5. כשהוא מרוצה, לוחץ על "פרסם".
6. בטופס שנפתח, הוא ממלא: שם ("חידון בירות"), כיתה ("כיתה ו'"), והסבר פדגוגי.
7. לאחר אישור, האפליקציה נשמרת ב-Cloud Storage עם Download Token ומופיעה בגלריה הקהילתית.

## 4. דרישות פונקציונליות

### 4.1. סביבת היצירה (Vibe Studio)

- ממשק מפוצל של צ'אט ותצוגה מקדימה חיה (iframe srcdoc).
- תפריט לבחירת מודל AI (Claude, Gemini, ChatGPT).
- כפתור "שמור ופרסם" שיפתח טופס לאיסוף מטא-דאטה.
- הטופס יכלול שדות חובה עבור: שם האפליקציה, שכבת גיל (K-12), והסבר פדגוגי, ושדה אופציונלי להוראות הפעלה.

### 4.2. גלריית האפליקציות (Vibe Gallery)

- תצוגת כל האפליקציות שנוצרו מה"קטלוג" ב-Firestore.
- יכולת סינון לפי שכבת גיל.
- עמוד פרטים לכל אפליקציה שיציג את ההסבר הפדגוגי והוראות ההפעלה.

### 4.3. פונקציות ענן (Backend)

#### askVibeAI
פונקציה המקבלת הנחיה ושם מודל, מוסיפה הנחיית-מערכת לייצר קוד HTML בקובץ יחיד, ופונה ל-API המתאים.

#### uploadVibeApp
פונקציה המקבלת את קוד ה-HTML הסופי והמטא-דאטה מהטופס. היא תבצע את הפעולות הבאות:

1. תאמת את זהות המורה.
2. תשמור את קוד ה-HTML ב-Cloud Storage עם Download Token ייחודי.
3. תבנה URL גישה בטוח באמצעות Firebase Storage v0 API.
4. תיצור דוקומנט חדש ב-Firestore עם כל המטא-דאטה וכתובת הגישה לקבצים.

### 4.4. מנגנון גישה לקבצים (Download Tokens)

המערכת משתמשת במנגנון **Download Tokens** של Firebase Storage כדי לאפשר גישה בטוחה לקבצים ללא צורך בהרשאות IAM מורכבות:

- **יצירת Token:** כל קובץ מקבל UUID ייחודי שנשמר במטא-דאטה שלו.
- **URL גישה:** נבנה בפורמט Firebase Storage v0: `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<token>`.
- **יתרונות:** עוקף בעיות הרשאות IAM, עובד מיידית, ומספק גישה בטוחה לקבצים.

## 5. מודל נתונים (Firestore)

אוסף מרכזי בשם `community_apps`. כל דוקומנט ייצג אפליקציה אחת:

```json
{
  "appName": "חידון בירות אירופה",
  "pedagogicalExplanation": "תרגול ושינון של ערי בירה באירופה בצורה אינטראקטיבית.",
  "gradeLevel": "כיתה ו'",
  "instructions": "יש לגרור את שם הבירה למדינה הנכונה.",
  "teacher_uid": "uid_of_teacher",
  "teacher_name": "שם המורה",
  "app_url": "https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=uuid",
  "createdAt": "Timestamp",
  "createdByModel": "claude"
}
```

## 6. דרישות לא-פונקציונליות

### אבטחה
הזדהות מאובטחת למורים. קוד האפליקציות ירוץ תמיד ב-iframe מבודד. מפתחות ה-API יישמרו בבטחה ב-Firebase Secrets. גישה לקבצים מתבצעת באמצעות Download Tokens ייחודיים.

### שימושיות
חווית משתמש פשוטה וזורמת המיועדת לקהל יעד לא טכני.

### תמיכה בריבוי שפות
המערכת תפותח מראש לתמוך בריבוי שפות, בדומה למנגנון הקיים ב-fireClass. כל הטקסטים בממשק ינוהלו בקבצי שפה חיצוניים.

### ביצועים ואמינות
- **Cloud Storage:** שימוש ב-Download Tokens מבטיח גישה מהירה ועקבית לקבצים.
- **Firebase Functions:** שימוש בגרסה v2 עם טיפול שגיאות מתקדם.
- **לוגים מפורטים:** מעקב אחר פעולות המערכת עם לוגים ממוקדים לפתרון תקלות.

## 7. היסטוריית פיתוח ופתרון בעיות

### בעיות שזוהו וטופלו

#### 7.1. שגיאת HttpsError (500 Internal Server Error)
- **בעיה:** שימוש לא נכון בסינטקס של Firebase Functions v2.
- **פתרון:** עדכון ל-`const {onCall, HttpsError} = require("firebase-functions/v2/https")`.

#### 7.2. בדיקת verifyTeacher כפולה
- **בעיה:** בדיקה מיותרת של הרשאות מורה בפונקציות publish.
- **פתרון:** הסרת הבדיקה הכפולה והשארת לוג בלבד.

#### 7.3. בעיות הרשאות Cloud Storage
- **בעיה:** שגיאות 500 עקב בעיות IAM עם makePublic() ו-publicUrl().
- **פתרון:** מעבר למנגנון Download Tokens של Firebase Storage.

#### 7.4. אתחול Firebase Admin SDK
- **בעיה:** אי-ודאות לגבי הגדרת storageBucket באתחול.
- **פתרון:** אתחול מפורש עם `admin.initializeApp({ storageBucket: 'fireclassstudio.firebasestorage.app' })`.

### לקחים ועקרונות פיתוח

- **הימנעות מ-ACL ציבורי:** שימוש ב-Download Tokens במקום makePublic().
- **טיפול שגיאות מפורט:** לוגים עם error.code ו-error.message.
- **אתחול מפורש:** הגדרה ברורה של storageBucket באתחול Admin SDK.
- **תאימות לאחור:** תמיכה בפורמטים שונים של URLs ב-downloadCode.