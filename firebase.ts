import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const isFirebasePlaceholder = !firebaseConfig.projectId || firebaseConfig.projectId.includes('remixed');

// Test Connection
import { doc, getDoc } from 'firebase/firestore';
async function testConnection() {
  if (isFirebasePlaceholder) return;
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (_error) {
    // Gracefully ignore offline/unavailable connection warnings during initial load
  }
}
testConnection();
