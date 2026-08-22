const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');

const target = `        if (!isNaN(num) && num >= 1 && num <= 14) {
          const item = stats.get(num)!;
          item.recordsCount += 1;
          item.isStarted = true;
          if (d.Q) {
            const qClean = String(d.Q).trim();
            if (qClean) item.quedas.add(qClean);
          }
        }`;

const replacement = `        if (!isNaN(num) && num >= 1 && num <= 14) {
          const item = stats.get(num)!;
          
          // Only count records that have actual team data (ignoring empty placeholder rows)
          if (d.TIME && String(d.TIME).trim() !== '') {
            item.recordsCount += 1;
            item.isStarted = true;
            
            if (d.Q) {
              const qClean = String(d.Q).trim();
              if (qClean) item.quedas.add(qClean);
            }
          }
        }`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('pages/Schedule.tsx', code);
    console.log("Patched successfully!");
} else {
    console.log("Target not found!");
}
