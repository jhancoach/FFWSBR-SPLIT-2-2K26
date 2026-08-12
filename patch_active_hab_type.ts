import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStrType = `
      dmg: number;
      knocks: number;
      assists: number;
    }>();
`;

const replaceStrType = `
      dmg: number;
      knocks: number;
      assists: number;
      safeKills?: Record<string, number>;
    }>();
`;

if (content.includes(targetStrType.trim())) {
    content = content.replace(targetStrType.trim(), replaceStrType.trim());
    console.log("Patched type successfully");
} else {
    console.log("Could not find type target");
}

fs.writeFileSync('pages/Players.tsx', content);
