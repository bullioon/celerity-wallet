import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAjLFEptq_2-xsADOHfHPcgOvRZvOOmeY8",
  authDomain: "celerity-2a4ed.firebaseapp.com",
  projectId: "celerity-2a4ed",
  storageBucket: "celerity-2a4ed.firebasestorage.app",
  messagingSenderId: "886181992122",
  appId: "1:886181992122:web:672addd0f9f42ab5011483"
}

// Inicializa Firebase solo si no hay apps previas
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)