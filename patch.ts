import fs from 'fs';

let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const newDataLogic = `  const bannerTeamPerfData = useMemo(() => {
    if (!selectedTeam) return null;
    
    let totalPtsc = 0;
    let totalAbts = 0;
    let totalBooyahs = 0;
    let matches = 0;

    const mapStatsMap = new Map<string, { mapName: string, matches: number, ptsc: number, abts: number, booyahs: number }>();

    data.details.forEach(d => {
      if (d.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && d.RD?.toString() !== selectedRd) return;
      
      const ptsc = parseNumber(d.PTSC);
      const abts = parseNumber(d.ABTS);
      const booyahs = parseNumber(d.B);

      totalPtsc += ptsc;
      totalAbts += abts;
      totalBooyahs += booyahs;
      matches++;
      
      const mapName = d.MAPA || 'Desconhecido';
      if (!mapStatsMap.has(mapName)) {
        mapStatsMap.set(mapName, { mapName, matches: 0, ptsc: 0, abts: 0, booyahs: 0 });
      }
      
      const mStat = mapStatsMap.get(mapName)!;
      mStat.matches++;
      mStat.ptsc += ptsc;
      mStat.abts += abts;
      mStat.booyahs += booyahs;
    });

    const playerStats = new Map<string, { name: string, img: string, kills: number, dmg: number, hs: number, knocks: number, matches: number }>();
    data.players.forEach(p => {
      if (p.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && p.RD?.toString() !== selectedRd) return;

      const pName = p.PLAYER;
      if (!pName) return;

      if (!playerStats.has(pName)) {
        const playerRef = data.playersDimension.find(d => d.Name.toLowerCase().trim() === pName.toLowerCase().trim());
        playerStats.set(pName, { name: pName, img: playerRef?.IMG || '', kills: 0, dmg: 0, hs: 0, knocks: 0, matches: 0 });
      }

      const stats = playerStats.get(pName)!;
      stats.kills += parseNumber(p.Abates);
      stats.dmg += parseNumber(p.Dano);
      stats.hs += parseNumber(p.HS);
      stats.knocks += parseNumber(p.Deitados);
      stats.matches++;
    });

    const players = Array.from(playerStats.values()).sort((a, b) => b.kills - a.kills).map(p => ({
      ...p,
      avgKills: p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00',
      avgDmg: p.matches > 0 ? (p.dmg / p.matches).toFixed(0) : '0',
      avgHs: p.matches > 0 ? (p.hs / p.matches).toFixed(2) : '0.00',
      avgKnocks: p.matches > 0 ? (p.knocks / p.matches).toFixed(2) : '0.00'
    }));
    
    const maps = Array.from(mapStatsMap.values()).sort((a, b) => b.ptsc - a.ptsc);

    const teamImg = findTeamLogo(selectedTeam, data.teamsReference);

    return { teamName: selectedTeam, teamImg, ptsc: totalPtsc, abts: totalAbts, booyahs: totalBooyahs, matches, players, maps };
  }, [data.details, data.players, data.teamsReference, data.playersDimension, selectedTeam, selectedRd]);`;

content = content.replace(/const bannerTeamPerfData = useMemo\(\(\) => \{[\s\S]*?return \{ teamName.*?\}\;\n  \}, \[data\.details, data\.players, data\.teamsReference, data\.playersDimension, selectedTeam, selectedRd\]\);/, newDataLogic);

fs.writeFileSync('pages/Banners.tsx', content);

