const fs = require('fs');
let code = fs.readFileSync('components/PlayerVsPlayerCompare.tsx', 'utf-8');
code = code.replace(/<button onClick=\{\(\) => setShowSection\d\(prev => !prev\)\}.*?<\/button>/g, '');
fs.writeFileSync('components/PlayerVsPlayerCompare.tsx', code);
