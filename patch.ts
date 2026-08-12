import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

const newCode = `
  const activeHabStats = useMemo(() => {
    if (activeHabFilter === 'All') return [];
    
    // Primeiro pegamos um Set de chaves "Player|Rd|Q" que usaram a habilidade
    const habUsage = new Set<string>();
    data.characters.forEach(c => {
      if (normalize(c.Hab1) === normalize(activeHabFilter)) {
        habUsage.add(\`\${normalize(c.Player)}|\${normalize(c.Rd)}|\${normalize(c.Q)}\`);
      }
    });

    const playerMap = new Map<string, {
      name: string;
      img: string;
      team: string;
      teamImg: string;
      matches: number;
      kills: number;
      dmg: number;
      knocks: number;
      assists: number;
    }>();

    data.details.forEach(d => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(d.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(d.Q));
      const matchMap = filters.map.length === 0 || filters.map.some(m => normalize(m) === normalize(d.Mapa));
      const matchTeam = filters.team.length === 0 || filters.team.some(t => normalize(t) === normalize(d.TIME));
      
      if (!matchRD || !matchQ || !matchMap || !matchTeam) return;

      const pName = d.JOGADOR;
      const key = \`\${normalize(pName)}|\${normalize(d.RD)}|\${normalize(d.Q)}\`;
      if (habUsage.has(key)) {
        if (!playerMap.has(pName)) {
           playerMap.set(pName, {
             name: pName,
             img: findPlayerImage(pName, data.teamsReference),
             team: d.TIME,
             teamImg: findTeamLogo(d.TIME, data.teamsReference),
             matches: 0,
             kills: 0,
             dmg: 0,
             knocks: 0,
             assists: 0
           });
        }
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(d.ABTS);
        st.dmg += parseNumber(d.DANO);
        st.knocks += parseNumber(d.DEIT);
        st.assists += parseNumber(d.ASST);
      }
    });

    return Array.from(playerMap.values()).sort((a,b) => b.kills - a.kills || b.dmg - a.dmg);
  }, [data.characters, data.details, activeHabFilter, filters, data.teamsReference]);

`;

content = content.replace('  const charactersData = useMemo(() => {', newCode + '  const charactersData = useMemo(() => {');
fs.writeFileSync('pages/Players.tsx', content);
