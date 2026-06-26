/* ==========================================================
   RANDOM FITS FIREBASE CONFIG
   ----------------------------------------------------------
   Paste your Firebase web app config here ONE TIME.

   This one file is used by:
   - auth.js       customer Google login
   - admin.js      admin Google login
========================================================== */

export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_API_KEY",
  authDomain: "PASTE_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

/* Put your admin Gmail here.
   Only these emails can open admin.html.
*/
export const ADMIN_EMAILS = [
  "PASTE_YOUR_ADMIN_GMAIL_HERE"
];

export function firebaseIsConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes("PASTE_") &&
    !firebaseConfig.authDomain.includes("PASTE_") &&
    !firebaseConfig.projectId.includes("PASTE_") &&
    !firebaseConfig.appId.includes("PASTE_")
  );
}

export function adminEmailsAreConfigured() {
  return (
    ADMIN_EMAILS.length > 0 &&
    ADMIN_EMAILS.every(email => email && !email.includes("PASTE_"))
  );
}

