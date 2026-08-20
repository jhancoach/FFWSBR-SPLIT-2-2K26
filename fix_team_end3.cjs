const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
const parser = require('@babel/parser');
let lines = code.split('\n');
// We know lines are corrupted at the end
lines.splice(1113, 10);
// Let's manually reconstruct the end
lines.push('      </div>');
lines.push('    </div>');
lines.push('  );');
lines.push('};');
fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', lines.join('\n'));
try {
    parser.parse(fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8'), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    console.log("Team fixed");
} catch(e) { console.log(e.message, e.loc); }
