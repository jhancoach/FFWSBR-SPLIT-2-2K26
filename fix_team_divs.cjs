const fs = require('fs');

function checkDivs(file) {
    let code = fs.readFileSync(file, 'utf-8');
    let sections = code.split(/\{\/\* ========================================================================= \*\/\s*\{\/\* SEÇÃO/);
    
    for (let i=0; i<sections.length; i++) {
        let open = (sections[i].match(/<div(\s|>)/g) || []).length;
        let close = (sections[i].match(/<\/div>/g) || []).length;
        console.log(`Section ${i} open: ${open}, close: ${close}, diff: ${open-close}`);
    }
}
checkDivs('components/TeamVsTeamCombatCompare.tsx');
checkDivs('components/PlayerVsPlayerCompare.tsx');
