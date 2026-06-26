// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHU1SxhEKG7nLq1yyzT5BM5UPeTGZrhTs",
  authDomain: "random-fits.firebaseapp.com",
  projectId: "random-fits",
  storageBucket: "random-fits.firebasestorage.app",
  messagingSenderId: "502249070215",
  appId: "1:502249070215:web:d68c1455bd3e6c75c22222",
  measurementId: "G-FFJCHBKWMW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);