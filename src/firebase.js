import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDzP7xACD-WgyxA8vy3-7xaXi805RCASIw",
  authDomain: "caffeineandcases-ed004.firebaseapp.com",
  projectId: "caffeineandcases-ed004",
  storageBucket: "caffeineandcases-ed004.firebasestorage.app",
  messagingSenderId: "128703060816",
  appId: "1:128703060816:web:0bafb32cb55d6a518faa55"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export default app;