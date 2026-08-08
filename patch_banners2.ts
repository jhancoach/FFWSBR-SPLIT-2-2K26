import fs from 'fs';

let content = fs.readFileSync('pages/Banners.tsx', 'utf-8');

const newDataLogic = `
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    data.teamsReference.forEach(t => { if (t.TIME) teams.add(t.TIME); });
    data.details.forEach(d => { if (d.TIME) teams.add(d.TIME); });
    return Array.from(teams).sort((a, b) => a.localeCompare(b));
  }, [data.details, data.teamsReference]);

  useMemo(() => {
    if (!selectedTeam && availableTeams.length > 0) {
      setSelectedTeam(availableTeams[0]);
    }
  }, [availableTeams, selectedTeam]);

  const bannerTeamPerfData = useMemo(() => {
    if (!selectedTeam) return null;
    
    let totalPtsc = 0;
    let totalAbts = 0;
    let totalBooyahs = 0;
    let matches = 0;

    data.details.forEach(d => {
      if (d.TIME?.toLowerCase() !== selectedTeam.toLowerCase()) return;
      if (selectedRd !== 'all' && d.RD?.toString() !== selectedRd) return;
      
      totalPtsc += parseNumber(d.PTSC);
      totalAbts += parseNumber(d.ABTS);
      totalBooyahs += parseNumber(d.B);
      matches++;
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

    const teamImg = findTeamLogo(selectedTeam, data.teamsReference);

    return { teamName: selectedTeam, teamImg, ptsc: totalPtsc, abts: totalAbts, booyahs: totalBooyahs, matches, players };
  }, [data.details, data.players, data.teamsReference, data.playersDimension, selectedTeam, selectedRd]);

  const bannerPlayerData = useMemo(() => {`;

content = content.replace("const bannerPlayerData = useMemo(() => {", newDataLogic);

fs.writeFileSync('pages/Banners.tsx', content);
