
import { initializeApp } from "firebase/app";
import {getAuth} from "./firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCp0bkSVxJ9ZwowNuIQYo0PjwzzLru1-_Q",
  authDomain: "avinash-portfolio-abafa.firebaseapp.com",
  projectId: "avinash-portfolio-abafa",
  storageBucket: "avinash-portfolio-abafa.firebasestorage.app",
  messagingSenderId: "161427541167",
  appId: "1:161427541167:web:ff46c7f5a4d417ebff185a",
  measurementId: "G-VB5DM31E6Q"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();

export {app,auth};