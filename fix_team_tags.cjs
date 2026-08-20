const fs = require('fs');
const parser = require('@babel/parser');

function fix(file) {
    let code = fs.readFileSync(file, 'utf-8');
    let lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('{/* ========================================================================= */}')) {
            // we will find how many open/close divs are in this chunk
            let chunk = lines.slice(0, i).join('\n');
            let open = (chunk.match(/<div(\s|>)/g) || []).length;
            let close = (chunk.match(/<\/div>/g) || []).length;
            let missing = open - close;
            if (missing > 0) {
                // insert before the separator, maybe above the comment
                let inserts = [];
                for(let j=0; j<missing - 1; j++) { // -1 because the root div is still open
                   inserts.push('</div>');
                }
                if (inserts.length > 0) {
                   lines.splice(i, 0, ...inserts);
                   i += inserts.length;
                }
            }
        }
    }
    
    // Now for the very end
    let chunk = lines.join('\n');
    let open = (chunk.match(/<div(\s|>)/g) || []).length;
    let close = (chunk.match(/<\/div>/g) || []).length;
    let missing = open - close;
    let inserts = [];
    for(let j=0; j<missing; j++) {
       inserts.push('</div>');
    }
    lines.splice(lines.length - 2, 0, ...inserts);
    
    fs.writeFileSync(file, lines.join('\n'));
}
fix('components/TeamVsTeamCombatCompare.tsx');
fix('components/PlayerVsPlayerCompare.tsx');
