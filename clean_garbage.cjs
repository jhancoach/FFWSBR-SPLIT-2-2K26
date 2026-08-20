const fs = require('fs');

function clean(file) {
    let lines = fs.readFileSync(file, 'utf-8').split('\n');
    lines = lines.filter(l => {
        let trimmed = l.trim();
        if (trimmed.match(/^(<\/div>)+$/)) return false;
        if (trimmed.match(/^(<\/div>)+\)\}(<\/div>)+$/)) return false;
        if (trimmed === ')}') return false;
        if (trimmed === '') return false;
        return true;
    });
    fs.writeFileSync(file, lines.join('\n'));
}
clean('components/TeamVsTeamCombatCompare.tsx');
clean('components/PlayerVsPlayerCompare.tsx');
