const fs = require('fs');
let content = fs.readFileSync('pages/Schedule.tsx', 'utf8');

// Replace 14 with 22 for iteration and logic
content = content.replace(/\{ length: 14 \}/g, "{ length: 22 }");
content = content.replace(/r <= 14/g, "r <= 22");
content = content.replace(/return 14; \/\/ If all 14 rounds/g, "return 22; // If all 22 rounds");
content = content.replace(/14 - completedCount/g, "22 - completedCount");
content = content.replace(/14 Rodadas/g, "22 Rodadas");
content = content.replace(/14 No Total/g, "22 No Total");
content = content.replace(/Todas as 14 rodadas/g, "Todas as 22 rodadas");
content = content.replace(/14\)/g, "22)");
content = content.replace(/1 A 14/g, "1 A 22");
content = content.replace(/lg:grid-cols-14/g, "lg:grid-cols-11 xl:grid-cols-11"); // Need to adjust grid if 22 rounds. Maybe grid-cols-11 with 2 rows. Wait, grid-cols-11 is better. Or just flex wrap.

fs.writeFileSync('pages/Schedule.tsx', content);
