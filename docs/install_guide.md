# מדריך התקנה והגדרה: פרויקט Vibe Studio

**גרסה: 1.1**

מסמך זה מכיל את כל השלבים הנדרשים להקמה מלאה של פרויקט Vibe Studio, מסביבת הענן ועד להרצה מקומית.

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