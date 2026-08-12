import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStr = `
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(p.Abates);
        st.dmg += parseNumber(p.Dano);
        st.knocks += parseNumber(p.Deitados);
        st.assists += parseNumber(p.Assistencias);
      }
    });
`;

const replaceStr = `
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(p.Abates);
        st.dmg += parseNumber(p.Dano);
        st.knocks += parseNumber(p.Deitados);
        st.assists += parseNumber(p.Assistencias);
      }
    });

    // Populate safeKills for activeHabStats
    data.killFeed.forEach(k => {
      const killer = k.PLAYER;
      if (!killer) return;
      const key = \`\${normalize(killer)}|\${normalize(k.RD)}|\${normalize(k.Q)}\`;
      if (habUsage.has(key)) {
        if (playerMap.has(killer)) {
            const st = playerMap.get(killer)!;
            const safeVal = k.SAFE || 'OUT';
            if (!st.safeKills) st.safeKills = {};
            st.safeKills[safeVal] = (st.safeKills[safeVal] || 0) + 1;
        }
      }
    });
`;

if (content.includes(targetStr.trim())) {
    content = content.replace(targetStr.trim(), replaceStr.trim());
    console.log("Patched killFeed loop successfully");
} else {
    console.log("Could not find killFeed target");
}

fs.writeFileSync('pages/Players.tsx', content);
