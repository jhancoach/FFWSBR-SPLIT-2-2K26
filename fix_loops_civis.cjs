const fs = require('fs');
let content = fs.readFileSync('utils/scheduleData.ts', 'utf8');

// Civis
content = content.replace(/name: 'Civis',\s*rounds: \{([^}]+)\}/g, (match, p1) => {
    let replaced = p1.replace(/15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true/, 
                              '15: false, 16: false, 17: false, 18: false, 19: false, 20: false, 21: false, 22: false');
    return `name: 'Civis',\n    rounds: {${replaced}}`;
});

// Loops
content = content.replace(/name: 'Loops',\s*rounds: \{([^}]+)\}/g, (match, p1) => {
    let replaced = p1.replace(/15: true, 16: true, 17: true, 18: true, 19: true, 20: true, 21: true, 22: true/, 
                              '15: false, 16: false, 17: false, 18: false, 19: false, 20: false, 21: false, 22: false');
    return `name: 'Loops',\n    rounds: {${replaced}}`;
});

fs.writeFileSync('utils/scheduleData.ts', content);
