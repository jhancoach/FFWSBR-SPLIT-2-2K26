import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');
const lines = content.split('\n');
let insertIndex = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('const charactersData = useMemo(() => {')) {
    insertIndex = i;
    break;
  }
}
console.log(insertIndex);
