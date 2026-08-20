const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
const parser = require('@babel/parser');
try {
    parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
} catch(e) { console.log(e.message, e.loc.line, e.loc.column); }
