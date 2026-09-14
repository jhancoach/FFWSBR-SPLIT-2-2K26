const fs = require('fs');

const path = 'utils/scheduleData.ts';
let content = fs.readFileSync(path, 'utf8');

// Using regex to extract, remove and append is tricky because of the complex objects.
// Let's parse it as JS, wait, it's TS.
// I can just find the objects using regex.

const civisRegex = /\{\s*name:\s*'Civis',[\s\S]*?rounds:\s*\{[\s\S]*?\}\s*\},?/;
const loopsRegex = /\{\s*name:\s*'Loops',[\s\S]*?rounds:\s*\{[\s\S]*?\}\s*\},?/;

let civisMatch = content.match(civisRegex);
let loopsMatch = content.match(loopsRegex);

if (civisMatch && loopsMatch) {
    let newContent = content.replace(civisRegex, '');
    newContent = newContent.replace(loopsRegex, '');
    
    // Both were removed. Now insert them before `];`
    
    // Clean up trailing commas from the regex matches if any
    let civisStr = civisMatch[0].replace(/,$/, '');
    let loopsStr = loopsMatch[0].replace(/,$/, '');
    
    newContent = newContent.replace(/];/, `,  ${civisStr},  ${loopsStr}\n];`);
    
    // Fix multiple commas if they happened
    newContent = newContent.replace(/,\s*,/g, ',');
    
    fs.writeFileSync(path, newContent);
    console.log("Moved successfully.");
} else {
    console.log("Failed to match regex.");
}

