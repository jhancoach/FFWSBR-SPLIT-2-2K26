const fs = require('fs');
let code = fs.readFileSync('components/PlayerVsPlayerCompare.tsx', 'utf-8');
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
