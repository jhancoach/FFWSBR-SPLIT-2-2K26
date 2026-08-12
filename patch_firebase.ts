import fs from 'fs';
let content = fs.readFileSync('firebase.ts', 'utf-8');

const testConnBlock = `
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
`;

if (content.includes(testConnBlock.trim())) {
    content = content.replace(testConnBlock.trim(), '');
    console.log("Patched firebase.ts successfully");
} else {
    // maybe different import or spacing
    content = content.replace(/\/\/ Test Connection[\s\S]*testConnection\(\);/m, '');
    console.log("Patched firebase.ts with regex successfully");
}

fs.writeFileSync('firebase.ts', content);
