const fs = require('fs');

function clean(file) {
    let code = fs.readFileSync(file, 'utf-8');
    // replace `</div></div></div>...{/* ====` with `{/* ====`
    code = code.replace(/(<\/div>\s*)+\{\/\*\s*=========================================================================\s*\*\/\}/g, '{/* ========================================================================= */}');
    fs.writeFileSync(file, code);
}
clean('components/TeamVsTeamCombatCompare.tsx');
clean('components/PlayerVsPlayerCompare.tsx');
