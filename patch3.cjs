const fs = require('fs');
let code = fs.readFileSync('pages/Schedule.tsx', 'utf8');

const target = `  const nextRound = forcedNextRound !== null ? forcedNextRound : detectedNextRound;`;

const replacement = `  const nextRound = forcedNextRound !== null ? forcedNextRound : detectedNextRound;

  React.useEffect(() => {
    if (selectedRound === null) {
      setSelectedRound(nextRound);
    }
  }, [nextRound]);
`;

code = code.replace(target, replacement);
fs.writeFileSync('pages/Schedule.tsx', code);
console.log("Patched successfully!");
