const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');

let divOpen = (code.match(/<div(\s|>)/g) || []).length;
let divClose = (code.match(/<\/div>/g) || []).length;

console.log('div open:', divOpen);
console.log('div close:', divClose);
