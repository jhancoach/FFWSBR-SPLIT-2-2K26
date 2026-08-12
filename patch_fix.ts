import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

content = content.replace('img: findPlayerImage(pName, data.teamsReference)', 'img: findDimImg(data.playersDimension, pName)');

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched successfully");
