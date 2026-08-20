const fs = require('fs');

let code = fs.readFileSync('components/PlayerVsPlayerCompare.tsx', 'utf-8');
code = code.replace(/              \}\)\}\n            <\/div>\n          <\/div>\n        <\/div>\n    \)\}\n    <\/div>\n  \);\n\};\n?/s,
`              })}\n            </div>\n            )}\n          </div>\n      )}\n    </div>\n  );\n};\n`);
fs.writeFileSync('components/PlayerVsPlayerCompare.tsx', code);
