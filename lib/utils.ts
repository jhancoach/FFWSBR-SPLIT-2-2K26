export const normalize = (str: any): string => {
  if (str === undefined || str === null) return '';
  return String(str).trim().toLowerCase();
};

export const parseNumber = (v: string | number | undefined | null): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (!v) return 0;
  const p = parseFloat(String(v).replace(',', '.'));
  return isNaN(p) ? 0 : p;
};

export const calculateTeamStats = ({ details }: { details?: any[] }): any[] => {
  if (!details || details.length === 0) return [];
  const kills = details.reduce((acc, d) => acc + parseNumber(d.ABTS || d.Abates || d.Kills || d.abts || 0), 0);
  const positionPoints = details.reduce((acc, d) => acc + parseNumber(d.PTSC || d.PTS_COLOCACAO || d.ptsc || 0), 0);
  const totalPoints = details.reduce((acc, d) => acc + parseNumber(d.PTS || d.PONTOS || d.pts || 0), 0) || (kills + positionPoints);
  const booyahs = details.reduce((acc, d) => acc + parseNumber(d.B || d.BOOYAH || d.b || 0), 0);
  
  const matchKeys = new Set(details.map(d => `${d.RD || ''}_${d.Q || ''}_${d.MAPA || ''}_${d.CONFRONTO || ''}`));
  const matches = matchKeys.size || details.length || 1;

  return [{
    pts: totalPoints,
    ptsc: positionPoints,
    abts: kills,
    b: booyahs,
    s: matches,
    avgPts: (totalPoints / matches).toFixed(2),
    avgAbts: (kills / matches).toFixed(2),
    avgPtsc: (positionPoints / matches).toFixed(2),
    playerDetails: details
  }];
};

export const calculatePlayerStats = ({ details, players }: { details?: any[]; players?: any[] }): any[] => {
  const source = (players && players.length > 0) ? players : (details || []);
  if (!source || source.length === 0) return [];

  const playerMap: Record<string, any> = {};

  for (const d of source) {
    const player = d.PLAYER || d.Player || d.JOGADOR || d.Jogador || d.J || d.ATLETA || d.Atleta || '';
    if (!player || normalize(player) === 'desconhecido') continue;

    if (!playerMap[player]) {
      playerMap[player] = {
        name: player,
        j: player,
        abts: 0,
        kills: 0,
        dmg: 0,
        dano: 0,
        hs: 0,
        deitados: 0,
        assists: 0,
        mvp: 0,
        matches: new Set<string>()
      };
    }

    const killsCount = parseNumber(d.Abates || d.ABATES || d.abts || d.ABTS || d.Kills || d.KILL || 0);
    const dmgCount = parseNumber(d.Dano || d.DANO || d.Damage || d.DMG || d.dmg || 0);
    const hsCount = parseNumber(d.HS || d.hs || d.Headshots || 0);
    const deitadosCount = parseNumber(d.Deitados || d.DEITADOS || d.Knockdowns || 0);
    const assistCount = parseNumber(d.Assistencias || d.ASSISTENCIAS || d.Assists || 0);
    const mvpVal = parseNumber(d.MVP || d.mvp || 0);

    playerMap[player].abts += killsCount;
    playerMap[player].kills += killsCount;
    playerMap[player].dmg += dmgCount;
    playerMap[player].dano += dmgCount;
    playerMap[player].hs += hsCount;
    playerMap[player].deitados += deitadosCount;
    playerMap[player].assists += assistCount;
    if (mvpVal > 0) playerMap[player].mvp += mvpVal;

    const matchKey = `${d.RD || d.Rd || ''}_${d.Q || d.Queda || ''}_${d.MAPA || d.Mapa || ''}_${d.CONFRONTO || d.Confronto || ''}`;
    playerMap[player].matches.add(matchKey);
  }

  return Object.values(playerMap).map(p => {
    const matchCount = p.matches.size || 1;
    return {
      ...p,
      matchesCount: matchCount,
      matches: matchCount,
      avgAbts: (p.abts / matchCount).toFixed(2),
      avgKills: (p.abts / matchCount).toFixed(2),
      avgDmg: (p.dmg / matchCount).toFixed(0),
      avgDano: (p.dmg / matchCount).toFixed(0),
      hsPercent: p.abts > 0 ? Math.round((p.hs / p.abts) * 100) : 0
    };
  });
};
