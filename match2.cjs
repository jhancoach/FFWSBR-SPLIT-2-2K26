const fs = require('fs');
let code = fs.readFileSync('components/TeamVsTeamCombatCompare.tsx', 'utf-8');
let open = 0;
for(let i=0; i<code.length; i++) {
  if(code[i] === '{') open++;
  if(code[i] === '}') open--;
}
console.log('Braces:', open);
let parens = 0;
for(let i=0; i<code.length; i++) {
  if(code[i] === '(') parens++;
  if(code[i] === ')') parens--;
}
console.log('Parens:', parens);

let tags = [];
let i = 0;
// very simple jsx parser
// ... actually let's just use tsc error to see what's wrong.
