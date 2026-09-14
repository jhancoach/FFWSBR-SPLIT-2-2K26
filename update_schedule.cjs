const fs = require('fs');
let content = fs.readFileSync('utils/scheduleData.ts', 'utf8');

content = content.replace(/14: (true|false) \}/g, (match, p1) => {
    return `14: ${p1}, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true }`;
});

content = content.replace(/num <= 14/g, "num <= 22");

fs.writeFileSync('utils/scheduleData.ts', content);
