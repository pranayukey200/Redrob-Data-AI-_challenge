import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAycrSa_i6os7d0-eL4PsqUzVXpwSMHoQs",
  authDomain: "intellisense-2253d.firebaseapp.com",
  projectId: "intellisense-2253d",
  storageBucket: "intellisense-2253d.firebasestorage.app",
  messagingSenderId: "438911352461",
  appId: "1:438911352461:web:8c5582c8fae04f58ce6cc4",
  measurementId: "G-12NCR9E3BP"
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
