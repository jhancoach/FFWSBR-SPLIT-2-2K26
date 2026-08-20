const fs = require('fs');
const parser = require('@babel/parser');

function fixFile(file) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 100) {
        attempts++;
        let code = fs.readFileSync(file, 'utf-8');
        try {
            parser.parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });
            console.log(file, "is valid after", attempts, "attempts!");
            success = true;
        } catch (e) {
            if (e.message.includes('Adjacent JSX elements')) {
                let lines = code.split('\n');
                let errLine = e.loc.line - 1;
                // find the first line above that has something
                let insertLine = errLine;
                let indent = lines[errLine].match(/^\s*/)[0];
                if (lines[errLine].trim() === '') {
                   indent = lines[errLine-1].match(/^\s*/)[0];
                }
                
                // If it's complaining about `</div>`, we need `)}` before it.
                // It might also be `) : (` missing `)}` etc.
                // I'll just insert `)}` at the line above.
                let space = indent;
                
                // Let's adjust space. The error line is typically the closing div
                // The missing `)}` should have a bit more indentation or same.
                
                lines.splice(insertLine, 0, space + ')}');
                fs.writeFileSync(file, lines.join('\n'));
            } else if (e.message.includes("Unexpected token, expected ")) {
                 // Might be missing `)}` or something else
                 console.log("Unhandled error:", e.message, "at line", e.loc.line);
                 break;
            } else {
                 console.log("Unhandled error:", e.message, "at line", e.loc.line);
                 break;
            }
        }
    }
}
fixFile('components/TeamVsTeamCombatCompare.tsx');
fixFile('components/PlayerVsPlayerCompare.tsx');
