const fs = require('fs');

function clean(file) {
    let code = fs.readFileSync(file, 'utf-8');
    // strip the inserted </div>
    code = code.replace(/<\/div>\n\{\/\* ========================================================================= \*\/\}/g, '{/* ========================================================================= */}');
    fs.writeFileSync(file, code);
}
// wait, the easiest way is to rebuild from the start.

function fix(file) {
    let code = fs.readFileSync(file, 'utf-8');
    // First, let's remove any consecutive </div> that were added on their own lines right before a comment.
    // Actually, I can just count the exact number needed PER SECTION.
    let sections = code.split(/\{\/\* ========================================================================= \*\/\}/);
    
    // The root div is opened in section 0.
    // For each section, we want the running depth to be exactly 1 at the end of the section (because of the root div).
    let currentDepth = 0;
    
    for (let i = 0; i < sections.length; i++) {
        let open = (sections[i].match(/<div(\s|>)/g) || []).length;
        let close = (sections[i].match(/<\/div>/g) || []).length;
        currentDepth += (open - close);
        
        if (i < sections.length - 1) {
            let targetDepth = 1;
            if (currentDepth > targetDepth) {
                let diff = currentDepth - targetDepth;
                sections[i] += '\n' + '</div>\n'.repeat(diff);
                currentDepth = targetDepth;
            }
        } else {
            let targetDepth = 0;
            if (currentDepth > targetDepth) {
                let diff = currentDepth - targetDepth;
                // insert before `);`
                let idx = sections[i].lastIndexOf(');');
                if (idx !== -1) {
                    sections[i] = sections[i].slice(0, idx) + '\n' + '</div>\n'.repeat(diff) + sections[i].slice(idx);
                }
            }
        }
    }
    
    fs.writeFileSync(file, sections.join('{/* ========================================================================= */}'));
}

// Let's first restore from git... oh wait we don't have git.
