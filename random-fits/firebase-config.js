/* ==========================================================
   RANDOM FITS FIREBASE CONFIG
   This file is used by auth.js and admin.js.
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

/* Only this email can open admin.html */
export const ADMIN_EMAILS = [
  "josedia1219@gmail.com"
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
