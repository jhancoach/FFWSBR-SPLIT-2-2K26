const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function check(file) {
    let code = fs.readFileSync(file, 'utf-8');
    try {
        parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript']
        });
        console.log(file, "is valid!");
    } catch (e) {
        console.log(file, "error:", e.message, "at line", e.loc.line, "col", e.loc.column);
        // Let's print the few lines around it
        let lines = code.split('\n');
        for(let i=Math.max(0, e.loc.line-3); i<Math.min(lines.length, e.loc.line+3); i++) {
            console.log(`${i+1}: ${lines[i]}`);
        }
    }
}
check('components/TeamVsTeamCombatCompare.tsx');
check('components/PlayerVsPlayerCompare.tsx');
