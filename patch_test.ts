import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');
console.log(content.includes('activeHabFilter'));
