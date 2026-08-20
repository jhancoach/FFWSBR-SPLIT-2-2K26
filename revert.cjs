const fs = require('fs');

function revertFile(file) {
    let code = fs.readFileSync(file, 'utf-8');
    
    // Remove the states
    code = code.replace(/const \[showSection\d, setShowSection\d\] = useState\(true\);\s*/g, '');
    
    // Remove the buttons
    code = code.replace(/<button\s*onClick=\{\(\) => setShowSection\d\(prev => !prev\)\}[^>]+>\{showSection\d[^}]+\}\{showSection\d[^}]+\}<\/button>/g, '');
    code = code.replace(/<button\s*onClick=\{\(\) => setShowSection\d\(prev => !prev\)\}[^>]+>\{showSection\d[^}]+\}<\/button>/g, '');
    
    // Remove the {showSectionX && (
    code = code.replace(/\{showSection\d && \(/g, '');
    
    // The `)}\` that was closing it.
    // We added `)}\n      </div>` replacing `</div>\n      </div>`
    // Actually, I'll just write a script to re-balance React tags by removing orphaned `)}`
    
    // Wait, the regex `)}` on its own line:
    code = code.replace(/^\s*\)\}\s*$/gm, '');
    
    fs.writeFileSync(file, code);
}
revertFile('components/TeamVsTeamCombatCompare.tsx');
revertFile('components/PlayerVsPlayerCompare.tsx');
