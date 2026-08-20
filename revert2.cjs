const fs = require('fs');

function cleanDivs(file) {
    // Actually, I can't easily undo fix_divs2 because it added `</div>\n` multiple times.
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/(<\/div>\n)+      \{\/\* ========================================================================= \*\/\}/g, '      {/* ========================================================================= */}');
    code = code.replace(/(<\/div>\n)+  \);\n};\n/g, '  );\n};\n');
    fs.writeFileSync(file, code);
}
cleanDivs('components/TeamVsTeamCombatCompare.tsx');
cleanDivs('components/PlayerVsPlayerCompare.tsx');
