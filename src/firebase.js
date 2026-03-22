import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDXJ8WyGezR8II8ggzoQwVfXP2eZayCJRo',
  authDomain: 'thrivee-new-march-22.firebaseapp.com',
  projectId: 'thrivee-new-march-22',
  storageBucket: 'thrivee-new-march-22.firebasestorage.app',
  messagingSenderId: '904939798617',
  appId: '1:904939798617:web:dbb6bf970566517675f148',
  measurementId: 'G-NGGK6G2R3S',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const analytics = getAnalytics(app)