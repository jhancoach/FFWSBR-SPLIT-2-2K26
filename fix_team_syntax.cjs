const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');

code = code.replace(
    /          <\/div>\n        <\/div>\n      <\/div>/g,
    `          </div>\n        )}\n      </div>`
);

fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', code);
