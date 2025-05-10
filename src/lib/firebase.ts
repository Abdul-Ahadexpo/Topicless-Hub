import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCXQUizONlf0zPORzFmfM5RaRDvlRdgSfE",
  authDomain: "all-in-one-5a89f.firebaseapp.com",
  projectId: "all-in-one-5a89f",
  storageBucket: "all-in-one-5a89f.firebasestorage.app",
  messagingSenderId: "1065572859408",
  appId: "1:1065572859408:web:8f56efecc3165af81a1495"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export default app;