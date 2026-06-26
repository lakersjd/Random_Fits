/* ==========================================================
   RANDOM FITS FIREBASE CONFIG
   ----------------------------------------------------------
   Paste your Firebase web app config here ONE TIME.

   This one file is used by:
   - auth.js       customer Google login
   - admin.js      admin Google login
========================================================== */

export const firebaseConfig = {
  apiKey: "AIzaSyAHU1SxhEKG7nLq1yyzT5BM5UPeTGZrhTs",
  authDomain: "random-fits.firebaseapp.com",
  projectId: "random-fits",
  storageBucket: "random-fits.firebasestorage.app",
  messagingSenderId: "502249070215",
  appId: "1:502249070215:web:d68c1455bd3e6c75c22222",
  measurementId: "G-FFJCHBKWMW"
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

