const fs = require('fs');

function fixFile(file) {
    let code = fs.readFileSync(file, 'utf-8');
    let sections = code.split(/\{\/\*\s*=========================================================================\s*\*\/\}/);
    
    for (let i=0; i<sections.length; i++) {
        let open = (sections[i].match(/<div(\s|>)/g) || []).length;
        let close = (sections[i].match(/<\/div>/g) || []).length;
        let diff = open - close;
        
        if (diff > 0 && i < sections.length - 1) {
            sections[i] += '</div>\n'.repeat(diff);
        } else if (diff > 0 && i === sections.length - 1) {
            // we will close it before the last `);`
            // Wait, we can't easily do it here. Let's just add at the end of section text.
            let idx = sections[i].lastIndexOf(');');
            if(idx !== -1) {
                sections[i] = sections[i].slice(0, idx) + '</div>\n'.repeat(diff) + sections[i].slice(idx);
            }
        }
    }
    fs.writeFileSync(file, sections.join('{/* ========================================================================= */}'));
}
fixFile('components/TeamVsTeamCombatCompare.tsx');
fixFile('components/PlayerVsPlayerCompare.tsx');
