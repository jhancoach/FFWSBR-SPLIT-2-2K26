import fs from 'fs';
let content = fs.readFileSync('pages/Players.tsx', 'utf-8');

content = content.replace("useState<{p1: string, p2: string}>({p1: '', p2: ''});", "useState<{p1: string, p1Hab: string, p2: string, p2Hab: string}>({p1: '', p1Hab: 'All', p2: '', p2Hab: 'All'});");

const newCompareData = `
  const compareData = useMemo(() => {
    if (activeTab !== 'compare') return { p1: null, p2: null };
    
    const getStats = (pName: string, habFilter: string) => {
        if (!pName) return null;
        
        let validMatchKeys = new Set<string>();
        if (habFilter !== 'All') {
            data.characters.forEach(c => {
                if (normalize(c.Player) === normalize(pName) && normalize(c.Hab1) === normalize(habFilter)) {
                    validMatchKeys.add(\`\${normalize(pName)}|\${normalize(c.Rd)}|\${normalize(c.Q)}\`);
                }
            });
        }
        
        const stats = {
            name: pName,
            team: '',
            kills: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            gelos: 0,
            gelosDestruidos: 0,
            reviveu: 0,
            aliadosRevividos: 0,
            mvp: 0,
            matches: 0,
            zeroKills: 0,
            withKills: 0,
        };
        
        const filtered = data.players.filter(p => {
             if (normalize(p.PLAYER) !== normalize(pName)) return false;
             if (habFilter !== 'All') {
                 const key = \`\${normalize(pName)}|\${normalize(p.RD)}|\${normalize(p.Q)}\`;
                 if (!validMatchKeys.has(key)) return false;
             }
             if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
             if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
             const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
             const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
             return matchRD && matchQ;
        });
        
        if (filtered.length === 0 && habFilter !== 'All') return null;
        
        filtered.forEach(p => {
            stats.team = p.TIME;
            stats.matches++;
            stats.kills += parseNumber(p.Abates);
            stats.damage += parseNumber(p.Dano);
            stats.hs += parseNumber(p.HS);
            stats.knocks += parseNumber(p.Deitados);
            stats.assists += parseNumber(p.Assistencias);
            stats.gelos += parseNumber(p.Gelos);
            stats.gelosDestruidos += parseNumber(p.GelosDestruidos);
            stats.reviveu += parseNumber(p.Reviveu);
            stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
            stats.mvp += parseNumber(p.MVP);
        });
        
        // Use rankingData fallback if habFilter is 'All' so we get exactly the same baseline as before for global
        if (habFilter === 'All' && stats.matches === 0) {
            const rankP = rankingData.find(r => normalize(r.name) === normalize(pName));
            if (rankP) return rankP;
        }
        
        const playerDim = data.playersDimension.find(d => normalize(d.Name) === normalize(pName));
        const teamDim = data.teamsReference.find(t => normalize(t.TIME) === normalize(stats.team));

        return {
            ...stats,
            avg: stats.matches > 0 ? (stats.kills / stats.matches).toFixed(2) : '0.00',
            avgDmg: stats.matches > 0 ? (stats.damage / stats.matches).toFixed(0) : '0',
            playerImg: playerDim?.IMG,
            teamImg: teamDim?.IMG
        };
    };

    const p1 = getStats(comparePlayers.p1, comparePlayers.p1Hab);
    const p2 = getStats(comparePlayers.p2, comparePlayers.p2Hab);
    
    return { p1, p2 };
  }, [rankingData, data.players, data.characters, data.playersDimension, data.teamsReference, comparePlayers, activeTab, filters]);
`;

const oldCompareDataRegex = /const compareData = useMemo\(\(\) => \{[\s\S]*?return \{ p1, p2 \};\n  \}, \[rankingData, comparePlayers, activeTab\]\);/m;

if (oldCompareDataRegex.test(content)) {
   content = content.replace(oldCompareDataRegex, newCompareData.trim());
} else {
   console.log("Could not find compareData hook");
}

fs.writeFileSync('pages/Players.tsx', content);
console.log("Patched compareData");
