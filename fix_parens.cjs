const fs = require('fs');
function fix(file) {
    let lines = fs.readFileSync(file, 'utf-8').split('\n');
    lines = lines.filter(l => !l.match(/^\s*\)\}\s*$/));
    fs.writeFileSync(file, lines.join('\n'));
}
fix('components/TeamVsTeamCombatCompare.tsx');
fix('components/PlayerVsPlayerCompare.tsx');
