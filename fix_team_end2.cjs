const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
const lines = code.split('\n');

// Find the last "}) : ("
let lastIndex = -1;
for(let i=lines.length-1; i>=0; i--) {
  if (lines[i].includes('Nenhum dado</div>')) {
    lastIndex = i;
    break;
  }
}

if (lastIndex !== -1) {
    let replaced = lines.slice(0, lastIndex + 1);
    replaced.push('              )}');
    replaced.push('              </div>');
    replaced.push('            </div>');
    replaced.push('          </div>');
    replaced.push('        </div>');
    replaced.push('      </div>');
    replaced.push('    </div>');
    replaced.push('  );');
    replaced.push('};');
    fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', replaced.join('\n') + '\n');
}
