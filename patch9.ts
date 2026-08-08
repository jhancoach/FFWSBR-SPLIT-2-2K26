import fs from 'fs';
let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

content = content.replace(
  'const topBooyahs = [...allTeams].sort((a, b) => b.booyahs - a.booyahs).slice(0, 3);',
  'const topBooyahs = [...allTeams].filter(t => t.booyahs > 0).sort((a, b) => b.booyahs - a.booyahs).slice(0, 3);'
);

fs.writeFileSync('pages/Banners.tsx', content);
