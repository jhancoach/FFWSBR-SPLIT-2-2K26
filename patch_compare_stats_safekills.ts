import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStrGetStats1 = `
            zeroKills: 0,
            withKills: 0,
            mapKills: {} as Record<string, number>,
        };
`;
const replaceStrGetStats1 = `
            zeroKills: 0,
            withKills: 0,
            mapKills: {} as Record<string, number>,
            safeKills: {} as Record<string, number>,
        };
`;

const targetStrGetStats2 = `
            const m = normalize(p.MAPA) || 'N/A';
            stats.mapKills[m] = (stats.mapKills[m] || 0) + pKills;
        });
`;
const replaceStrGetStats2 = `
            const m = normalize(p.MAPA) || 'N/A';
            stats.mapKills[m] = (stats.mapKills[m] || 0) + pKills;
        });
        
        data.killFeed.forEach(k => {
            if (normalize(k.PLAYER) === normalize(pName)) {
                if (habFilter !== 'All') {
                    const key = \`\${normalize(pName)}|\${normalize(k.RD)}|\${normalize(k.Q)}\`;
                    if (!validMatchKeys.has(key)) return;
                }
                const safeVal = k.SAFE || 'OUT';
                stats.safeKills[safeVal] = (stats.safeKills[safeVal] || 0) + 1;
            }
        });
`;

if (content.includes(targetStrGetStats1.trim()) && content.includes(targetStrGetStats2.trim())) {
    content = content.replace(targetStrGetStats1.trim(), replaceStrGetStats1.trim());
    content = content.replace(targetStrGetStats2.trim(), replaceStrGetStats2.trim());
    console.log("Patched getStats for safeKills successfully.");
} else {
    console.log("Could not find getStats targets");
}

const targetStrUI = `
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(safeNum => {
                                      const key = \`safe\${safeNum}\`;
                                      const val1 = compareData.p1!.safeKills[key] || 0;
                                      const val2 = compareData.p2!.safeKills[key] || 0;
                                      const isP1Better = val1 > val2;
                                      const isP2Better = val2 > val1;

                                      return (
                                          <div key={key} className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                  <span className={isP1Better ? 'text-yellow-500' : ''}>{val1}</span>
                                                  <span className="text-white">Safe {safeNum}</span>
                                                  <span className={isP2Better ? 'text-blue-500' : ''}>{val2}</span>
                                              </div>
`;

const replaceStrUI = `
                                  {allSafeNames.map(safeName => {
                                      const val1 = compareData.p1!.safeKills[safeName] || 0;
                                      const val2 = compareData.p2!.safeKills[safeName] || 0;
                                      const isP1Better = val1 > val2;
                                      const isP2Better = val2 > val1;

                                      return (
                                          <div key={safeName} className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                  <span className={isP1Better ? 'text-yellow-500' : ''}>{val1}</span>
                                                  <span className="text-white">{safeName === 'OUT' ? 'OUT' : \`Safe \${safeName}\`}</span>
                                                  <span className={isP2Better ? 'text-blue-500' : ''}>{val2}</span>
                                              </div>
`;

if (content.includes(targetStrUI.trim())) {
    content = content.replace(targetStrUI.trim(), replaceStrUI.trim());
    console.log("Patched UI for safeKills successfully.");
} else {
    console.log("Could not find UI targets");
}

fs.writeFileSync('pages/Players.tsx', content);
