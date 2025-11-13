// src/services/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpPmT27IGaHoStwVP5_152sMCFLm5uxys",
  authDomain: "dilio-39ba5.firebaseapp.com",
  projectId: "dilio-39ba5",
  storageBucket: "dilio-39ba5.firebasestorage.app",
  messagingSenderId: "1009603725165",
  appId: "1:1009603725165:web:f1269916054a598054fc64",
  measurementId: "G-M3CZR74CTW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app)
export default app;