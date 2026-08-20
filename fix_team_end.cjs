const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
code = code.replace(/              \}\)\n                \) : \(\n                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado<\/div>\n              \}\)\n              <\/div>\n            <\/div>\n          <\/div>\n        <\/div>\n      <\/div>\n  \)\}\n  <\/div>\n<\/div>\n  \);\n\};\n/g,
`              })\n                ) : (\n                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado</div>\n              )}\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n};\n`);
fs.writeFileSync('components/TeamVsTeamCombatCompare.tsx', code);
