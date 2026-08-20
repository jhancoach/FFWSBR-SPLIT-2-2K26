const fs = require('fs');

const errors = fs.readFileSync('errors.txt', 'utf-8').split('\n').filter(l => l.includes("error TS1005: ')' expected."));

const fileFixes = {};

for (const err of errors) {
    const match = err.match(/^(components\/.*?\.tsx)\((\d+),\d+\)/);
    if (match) {
        const file = match[1];
        const line = parseInt(match[2], 10) - 1; // 0-indexed
        if (!fileFixes[file]) fileFixes[file] = [];
        fileFixes[file].push(line);
    }
}

for (const file of Object.keys(fileFixes)) {
    let lines = fs.readFileSync(file, 'utf-8').split('\n');
    // sort descending
    fileFixes[file].sort((a, b) => b - a);
    
    // Deduplicate
    const uniqueLines = [...new Set(fileFixes[file])];
    
    for (const lineIdx of uniqueLines) {
        const originalLine = lines[lineIdx];
        const match = originalLine.match(/^(\s*)/);
        const indent = match ? match[1] : '';
        // Insert `)}` before the line
        lines.splice(lineIdx, 0, indent + ')}');
    }
    
    fs.writeFileSync(file, lines.join('\n'));
}
