import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC3bJrv_j4gW7u6H9IYR4GdTLxGyK4lJz4",
  authDomain: "edu-cat-f91c0.firebaseapp.com",
  projectId: "edu-cat-f91c0",
  storageBucket: "edu-cat-f91c0.firebasestorage.app",
  messagingSenderId: "284162569066",
  appId: "1:284162569066:web:269e66d53f6c7d2cd06b13"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
