import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const targetStrType = `
      assists: number;
      safeKills?: Record<string, number>;
    }>();
`;

const replaceStrType = `
      assists: number;
      safeKills?: Record<string, number>;
      teamTotalKills: number;
    }>();

    const teamKillsByMatch = new Map<string, number>();
    data.players.forEach(p => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
      const matchMap = filters.map.length === 0 || filters.map.some(m => normalize(m) === normalize(p.MAPA));
      const matchTeam = filters.team.length === 0 || filters.team.some(t => normalize(t) === normalize(p.TIME));
      
      if (!matchRD || !matchQ || !matchMap || !matchTeam) return;

      const teamKey = \`\${normalize(p.TIME)}|\${normalize(p.RD)}|\${normalize(p.Q)}\`;
      teamKillsByMatch.set(teamKey, (teamKillsByMatch.get(teamKey) || 0) + parseNumber(p.Abates));
    });
`;

const targetStrLoop = `
             img: findDimImg(data.playersDimension, pName),
             team: p.TIME,
             teamImg: findTeamLogo(p.TIME, data.teamsReference),
             matches: 0,
             kills: 0,
             dmg: 0,
             knocks: 0,
             assists: 0
           });
        }
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(p.Abates);
        st.dmg += parseNumber(p.Dano);
        st.knocks += parseNumber(p.Deitados);
        st.assists += parseNumber(p.Assistencias);
      }
    });
`;

const replaceStrLoop = `
             img: findDimImg(data.playersDimension, pName),
             team: p.TIME,
             teamImg: findTeamLogo(p.TIME, data.teamsReference),
             matches: 0,
             kills: 0,
             dmg: 0,
             knocks: 0,
             assists: 0,
             teamTotalKills: 0
           });
        }
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(p.Abates);
        st.dmg += parseNumber(p.Dano);
        st.knocks += parseNumber(p.Deitados);
        st.assists += parseNumber(p.Assistencias);
        st.teamTotalKills += teamKillsByMatch.get(\`\${normalize(p.TIME)}|\${normalize(p.RD)}|\${normalize(p.Q)}\`) || 0;
      }
    });
`;

if (content.includes(targetStrType.trim()) && content.includes(targetStrLoop.trim())) {
    content = content.replace(targetStrType.trim(), replaceStrType.trim());
    content = content.replace(targetStrLoop.trim(), replaceStrLoop.trim());
    console.log("Patched logic successfully");
} else {
    console.log("Could not find logic targets");
}

fs.writeFileSync('pages/Players.tsx', content);
