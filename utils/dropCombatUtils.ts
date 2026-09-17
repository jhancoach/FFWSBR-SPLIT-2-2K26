import { DashboardData, KillFeed } from '../types';
import { PlayerLoadoutDetailed, isSameTeam } from './characterUtils';

export interface PlayerKillEvent {
  victim: string;
  victimTeam?: string;
  weapon: string;
  safe: number;
}

export interface PlayerDeathEvent {
  killer: string;
  killerTeam?: string;
  weapon: string;
  safe: number;
}

export interface PlayerCombatStats {
  player: string;
  killsCount: number;
  deathsCount: number;
  isAlive: boolean;
  lastDeathSafe: number | null;
  aliveAtEndGame: boolean;
  kills: PlayerKillEvent[];
  deaths: PlayerDeathEvent[];
  hab1?: string;
  hab1Img?: string;
  hab2?: string;
  hab2Img?: string;
  hab3?: string;
  hab3Img?: string;
  hab4?: string;
  hab4Img?: string;
  pet?: string;
  petImg?: string;
  item?: string;
  itemImg?: string;
  funcao?: string;
  damage?: number;
}

export interface SafeCombatSummary {
  safe: number;
  phase: 'Early Game' | 'Mid Game' | 'End Game';
  phaseKey: 'early' | 'mid' | 'end';
  killsCount: number;
  deathsCount: number;
  kills: { killer: string; victim: string; victimTeam?: string; weapon: string }[];
  deaths: { victim: string; killer: string; killerTeam?: string; weapon: string }[];
  playersAliveAfterSafe: number;
}

export interface DropCombatAnalysis {
  teamName: string;
  rd: string;
  q: string;
  mapa: string;
  pos: number;
  booyah: boolean;
  totalKills: number;
  totalDeaths: number;
  kdRatio: string;
  killsBySafe: Record<number, number>;
  deathsBySafe: Record<number, number>;
  safesTimeline: SafeCombatSummary[];
  maxSafeReached: number;
  // End Game Analytics (Safes 4+)
  reachedEndGame: boolean;
  playersAliveAtEndGame: number; // 0 a 4
  isFullSquadAtEndGame: boolean;
  endGameBadgeText: string;
  endGameBadgeType: 'booyah' | 'fullSquad' | 'partialSquad' | 'eliminated';
  // Jogadores da squad
  playersCombat: PlayerCombatStats[];
}

const normalize = (val?: string) => (val || '').trim().toUpperCase();

export const checkMatchRd = (filterVal?: string, itemVal?: string | number): boolean => {
  if (itemVal === undefined || itemVal === null) return false;
  const sItem = String(itemVal).trim();
  if (!sItem) return false;
  const normF = normalize(filterVal);
  const normI = normalize(sItem);
  if (normF === normI) return true;
  const numF = normF.replace(/\D/g, '');
  const numI = normI.replace(/\D/g, '');
  if (numF && numI && numF === numI) return true;
  return false;
};

export const checkMatchQ = (filterVal?: string, itemVal?: string | number): boolean => {
  if (itemVal === undefined || itemVal === null) return false;
  const sItem = String(itemVal).trim();
  if (!sItem) return false;
  const normF = normalize(filterVal);
  const normI = normalize(sItem);
  if (normF === normI) return true;
  const numF = normF.replace(/\D/g, '');
  const numI = normI.replace(/\D/g, '');
  if (numF && numI && numF === numI) return true;
  return false;
};

/**
 * Cria mapa de jogadores -> time para consulta rápida
 */
export const buildPlayerToTeamMap = (data: DashboardData): Map<string, string> => {
  const map = new Map<string, string>();
  if (Array.isArray(data.players)) {
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) {
        map.set(normalize(p.PLAYER), p.TIME.trim());
      }
    });
  }
  if (Array.isArray(data.characters)) {
    data.characters.forEach(c => {
      if (c.Player && c.Time && !map.has(normalize(c.Player))) {
        map.set(normalize(c.Player), c.Time.trim());
      }
    });
  }
  return map;
};

/**
 * Constrói índice de alta performance do killfeed agrupado por Rodada e Queda (O(1))
 */
export const buildDropKillFeedIndex = (data: DashboardData): Map<string, any[]> => {
  const map = new Map<string, any[]>();
  if (Array.isArray(data.killFeed)) {
    data.killFeed.forEach(k => {
      if (!k) return;
      const rd = (k.RD || '').toString().replace(/\D/g, '');
      const q = (k.Q || '').toString().replace(/\D/g, '');
      const key = `${rd}_${q}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(k);
    });
  }
  return map;
};

/**
 * Processa as mortes, abates, safes e status de End Game de uma equipe numa queda específica
 */
export const analyzeDropCombat = (
  data: DashboardData,
  teamName: string,
  rd: string,
  q: string,
  pos: number,
  booyah: boolean,
  playersLoadout: PlayerLoadoutDetailed[],
  playerToTeamMap?: Map<string, string>,
  dropKillFeedIndex?: Map<string, any[]>
): DropCombatAnalysis => {
  const pTeamMap = playerToTeamMap || buildPlayerToTeamMap(data);
  const normTeam = normalize(teamName);

  // Jogadores da equipe nesta partida
  const squadPlayerNames = playersLoadout.map(p => normalize(p.player)).filter(Boolean);
  
  // Fallback: se playersLoadout estiver vazio, buscar em data.players
  if (squadPlayerNames.length === 0 && Array.isArray(data.players)) {
    data.players.forEach(p => {
      if (checkMatchRd(rd, p.RD) && checkMatchQ(q, p.Q) && isSameTeam(p.TIME, teamName, data.teamsReference)) {
        if (p.PLAYER) squadPlayerNames.push(normalize(p.PLAYER));
      }
    });
  }

  const squadPlayerNamesSet = new Set<string>(squadPlayerNames);

  // Obter eventos do killfeed de forma instantânea através do índice
  const rdClean = rd.toString().replace(/\D/g, '');
  const qClean = q.toString().replace(/\D/g, '');
  const dropKey = `${rdClean}_${qClean}`;

  const feedEvents = dropKillFeedIndex 
    ? (dropKillFeedIndex.get(dropKey) || [])
    : (Array.isArray(data.killFeed)
        ? data.killFeed.filter(k => checkMatchRd(rd, k.RD) && checkMatchQ(q, k.Q))
        : []);

  const killsBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  const deathsBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

  const allTeamKills: { killer: string; victim: string; victimTeam?: string; weapon: string; safe: number }[] = [];
  const allTeamDeaths: { victim: string; killer: string; killerTeam?: string; weapon: string; safe: number }[] = [];

  // Mapear abates e mortes por atleta
  const playerCombatStatsMap = new Map<string, PlayerCombatStats>();

  // Inicializar atletas conhecidos
  playersLoadout.forEach(p => {
    const key = normalize(p.player);
    playerCombatStatsMap.set(key, {
      player: p.player,
      killsCount: 0,
      deathsCount: 0,
      isAlive: true,
      lastDeathSafe: null,
      aliveAtEndGame: false,
      kills: [],
      deaths: [],
      hab1: p.hab1,
      hab1Img: p.hab1Img,
      hab2: p.hab2,
      hab2Img: p.hab2Img,
      hab3: p.hab3,
      hab3Img: p.hab3Img,
      hab4: p.hab4,
      hab4Img: p.hab4Img,
      pet: p.pet,
      petImg: p.petImg,
      item: p.item,
      itemImg: p.itemImg,
      funcao: p.funcao,
      damage: p.damage
    });
  });

  // Se algum jogador estava no feed mas não no loadout
  squadPlayerNames.forEach(pName => {
    if (!playerCombatStatsMap.has(pName)) {
      playerCombatStatsMap.set(pName, {
        player: pName,
        killsCount: 0,
        deathsCount: 0,
        isAlive: true,
        lastDeathSafe: null,
        aliveAtEndGame: false,
        kills: [],
        deaths: []
      });
    }
  });

  // Processar eventos de KillFeed
  feedEvents.forEach(k => {
    const killer = (k.PLAYER || '').trim();
    const victim = (k.VITIMA || '').trim();
    const normKiller = normalize(killer);
    const normVictim = normalize(victim);
    const weapon = (k.ARMA || 'Arma').trim();
    const rawSafe = parseInt((k.SAFE || '1').replace(/\D/g, '')) || 1;
    const safeNum = Math.min(Math.max(rawSafe, 1), 7);

    const killerTeam = pTeamMap.get(normKiller) || '';
    const victimTeam = pTeamMap.get(normVictim) || '';

    const isOurKiller = isSameTeam(killerTeam, teamName, data.teamsReference) || 
      squadPlayerNamesSet.has(normKiller) || 
      normKiller === normTeam;

    const isOurVictim = isSameTeam(victimTeam, teamName, data.teamsReference) || 
      squadPlayerNamesSet.has(normVictim) || 
      normVictim === normTeam;

    // Se o time fez o abate
    if (isOurKiller) {
      killsBySafe[safeNum] = (killsBySafe[safeNum] || 0) + 1;
      const killEv: PlayerKillEvent = {
        victim: victim || 'Inimigo',
        victimTeam: victimTeam || undefined,
        weapon,
        safe: safeNum
      };
      allTeamKills.push({ killer, victim, victimTeam, weapon, safe: safeNum });

      let pStats = playerCombatStatsMap.get(normKiller);
      if (!pStats) {
        pStats = {
          player: killer,
          killsCount: 0,
          deathsCount: 0,
          isAlive: true,
          lastDeathSafe: null,
          aliveAtEndGame: false,
          kills: [],
          deaths: []
        };
        playerCombatStatsMap.set(normKiller, pStats);
      }
      pStats.killsCount += 1;
      pStats.kills.push(killEv);
    }

    // Se o time sofreu a morte
    if (isOurVictim) {
      deathsBySafe[safeNum] = (deathsBySafe[safeNum] || 0) + 1;
      const deathEv: PlayerDeathEvent = {
        killer: killer || 'Inimigo',
        killerTeam: killerTeam || undefined,
        weapon,
        safe: safeNum
      };
      allTeamDeaths.push({ victim, killer, killerTeam, weapon, safe: safeNum });

      let pStats = playerCombatStatsMap.get(normVictim);
      if (!pStats) {
        pStats = {
          player: victim,
          killsCount: 0,
          deathsCount: 0,
          isAlive: true,
          lastDeathSafe: null,
          aliveAtEndGame: false,
          kills: [],
          deaths: []
        };
        playerCombatStatsMap.set(normVictim, pStats);
      }
      pStats.deathsCount += 1;
      pStats.deaths.push(deathEv);
      pStats.isAlive = false;
      if (pStats.lastDeathSafe === null || safeNum > pStats.lastDeathSafe) {
        pStats.lastDeathSafe = safeNum;
      }
    }
  });

  // Para times que deram Booyah, os que não sofreram mortes na última fase venceram vivos
  const playersList = Array.from(playerCombatStatsMap.values());

  // Calcular sobrevivência dos jogadores até o início da Safe 4 (End Game)
  playersList.forEach(p => {
    if (booyah) {
      // No booyah, se o jogador nunca morreu ou sua última morte foi revivida
      if (p.deathsCount === 0 || p.lastDeathSafe === null) {
        p.isAlive = true;
        p.aliveAtEndGame = true;
      } else {
        p.aliveAtEndGame = p.lastDeathSafe >= 4;
      }
    } else {
      if (p.deathsCount === 0) {
        p.isAlive = true;
        p.aliveAtEndGame = true;
      } else {
        // Se a última morte ocorreu na Safe 4 ou mais, ele chegou vivo ao End Game (a partir da Safe 4)
        p.aliveAtEndGame = p.lastDeathSafe !== null && p.lastDeathSafe >= 4;
      }
    }
  });

  // End Game Analytics (Safes 4+)
  const allSafes = [
    ...allTeamKills.map(k => k.safe),
    ...allTeamDeaths.map(d => d.safe),
    booyah ? 6 : 1
  ];
  const maxSafeReached = Math.max(...allSafes, 1);

  // Teve ação no End Game? (Booyah, kills na Safe 4+, mortes na Safe 4+, ou alcançou Safe 4+)
  const hasEndGameAction = booyah || pos === 1 || maxSafeReached >= 4 || allSafes.some(s => s >= 4) || playersList.some(p => p.aliveAtEndGame);

  let reachedEndGame = false;
  let playersAliveAtEndGame = 0;

  if (hasEndGameAction) {
    reachedEndGame = true;
    const aliveCount = playersList.filter(p => p.aliveAtEndGame).length;
    // Se booyah ou ação no end game, pelo menos 1 vivo, até 4
    playersAliveAtEndGame = Math.min(4, Math.max(1, aliveCount || (booyah ? 4 : 1)));
  } else {
    reachedEndGame = false;
    playersAliveAtEndGame = 0;
  }

  const isFullSquadAtEndGame = reachedEndGame && playersAliveAtEndGame === 4;

  let endGameBadgeText = '';
  let endGameBadgeType: 'booyah' | 'fullSquad' | 'partialSquad' | 'eliminated' = 'eliminated';

  if (booyah || pos === 1) {
    endGameBadgeText = `👑 Booyah! (${playersAliveAtEndGame} Vivos no End)`;
    endGameBadgeType = 'booyah';
  } else if (isFullSquadAtEndGame) {
    endGameBadgeText = `🛡️ Full Squad no End Game (4 Vivos)`;
    endGameBadgeType = 'fullSquad';
  } else if (reachedEndGame) {
    endGameBadgeText = `⚔️ End Game (${playersAliveAtEndGame} ${playersAliveAtEndGame === 1 ? 'Vivo' : 'Vivos'})`;
    endGameBadgeType = 'partialSquad';
  } else {
    const stage = maxSafeReached <= 2 ? 'Early Game (S1-S2)' : 'Mid Game (S3)';
    endGameBadgeText = `❌ Eliminado Safe ${maxSafeReached} (${stage})`;
    endGameBadgeType = 'eliminated';
  }

  // Linha do tempo de Safes (1 a 7)
  const safesTimeline: SafeCombatSummary[] = [1, 2, 3, 4, 5, 6, 7].map(s => {
    const sKills = allTeamKills.filter(k => k.safe === s);
    const sDeaths = allTeamDeaths.filter(d => d.safe === s);
    
    let phase: 'Early Game' | 'Mid Game' | 'End Game' = 'Early Game';
    let phaseKey: 'early' | 'mid' | 'end' = 'early';
    if (s <= 2) {
      phase = 'Early Game';
      phaseKey = 'early';
    } else if (s === 3) {
      phase = 'Mid Game';
      phaseKey = 'mid';
    } else {
      phase = 'End Game';
      phaseKey = 'end';
    }

    // Calcular quantos jogadores estavam vivos após essa safe
    let aliveAfter = 4;
    if (reachedEndGame) {
      if (s < 4) {
        // Antes do end game (Safe 1 a 3), quem teve última morte nessa safe ou antes está fora
        const deadBeforeOrAt = playersList.filter(p => p.lastDeathSafe !== null && p.lastDeathSafe <= s && !p.aliveAtEndGame).length;
        aliveAfter = Math.max(playersAliveAtEndGame, 4 - deadBeforeOrAt);
      } else {
        // No end game (Safe 4+)
        if (booyah) {
          aliveAfter = Math.max(1, 4 - sDeaths.length);
        } else {
          const deadAtOrAfter = playersList.filter(p => p.lastDeathSafe !== null && p.lastDeathSafe <= s).length;
          aliveAfter = Math.max(0, 4 - deadAtOrAfter);
        }
      }
    } else {
      // Se não chegou ao end game e a safe é maior que a máxima alcançada
      if (s > maxSafeReached) {
        aliveAfter = 0;
      } else if (s === maxSafeReached) {
        aliveAfter = 0;
      } else {
        const deadAtOrBefore = playersList.filter(p => p.lastDeathSafe !== null && p.lastDeathSafe <= s).length;
        aliveAfter = Math.max(1, 4 - deadAtOrBefore);
      }
    }

    return {
      safe: s,
      phase,
      phaseKey,
      killsCount: sKills.length,
      deathsCount: sDeaths.length,
      kills: sKills.map(k => ({ killer: k.killer, victim: k.victim, victimTeam: k.victimTeam, weapon: k.weapon })),
      deaths: sDeaths.map(d => ({ victim: d.victim, killer: d.killer, killerTeam: d.killerTeam, weapon: d.weapon })),
      playersAliveAfterSafe: aliveAfter
    };
  });

  const totalKills = allTeamKills.length;
  const totalDeaths = allTeamDeaths.length;
  const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills > 0 ? `${totalKills}.00` : '0.00';

  return {
    teamName,
    rd,
    q,
    mapa: '',
    pos,
    booyah,
    totalKills,
    totalDeaths,
    kdRatio,
    killsBySafe,
    deathsBySafe,
    safesTimeline,
    maxSafeReached,
    reachedEndGame,
    playersAliveAtEndGame,
    isFullSquadAtEndGame,
    endGameBadgeText,
    endGameBadgeType,
    playersCombat: playersList
  };
};

/**
 * Métricas agregadas de End Game para um conjunto de quedas
 */
export interface TournamentEndGameSummary {
  totalDrops: number;
  endGameReachedCount: number;
  endGameReachedPct: number;
  fullSquadCount: number;
  fullSquadPct: number;
  booyahCount: number;
  booyahConversionPct: number;
  eliminatedEarlyCount: number;
  eliminatedEarlyPct: number;
  avgAliveAtEndGame: string;
}

export const calculateEndGameSummary = (dropsCombat: DropCombatAnalysis[]): TournamentEndGameSummary => {
  const totalDrops = dropsCombat.length;
  if (totalDrops === 0) {
    return {
      totalDrops: 0,
      endGameReachedCount: 0,
      endGameReachedPct: 0,
      fullSquadCount: 0,
      fullSquadPct: 0,
      booyahCount: 0,
      booyahConversionPct: 0,
      eliminatedEarlyCount: 0,
      eliminatedEarlyPct: 0,
      avgAliveAtEndGame: '0.0'
    };
  }

  const endGameReached = dropsCombat.filter(d => d.reachedEndGame);
  const endGameReachedCount = endGameReached.length;
  const fullSquadCount = dropsCombat.filter(d => d.isFullSquadAtEndGame).length;
  const booyahCount = dropsCombat.filter(d => d.booyah).length;
  const eliminatedEarlyCount = dropsCombat.filter(d => !d.reachedEndGame).length;

  const sumAlive = endGameReached.reduce((acc, d) => acc + d.playersAliveAtEndGame, 0);
  const avgAlive = endGameReachedCount > 0 ? (sumAlive / endGameReachedCount).toFixed(1) : '0.0';

  return {
    totalDrops,
    endGameReachedCount,
    endGameReachedPct: Math.round((endGameReachedCount / totalDrops) * 100),
    fullSquadCount,
    fullSquadPct: Math.round((fullSquadCount / totalDrops) * 100),
    booyahCount,
    booyahConversionPct: endGameReachedCount > 0 ? Math.round((booyahCount / endGameReachedCount) * 100) : 0,
    eliminatedEarlyCount,
    eliminatedEarlyPct: Math.round((eliminatedEarlyCount / totalDrops) * 100),
    avgAliveAtEndGame: avgAlive
  };
};

/**
 * Ranking de quantas vezes cada time chegou vivo no End Game (a partir da Safe 4)
 */
export interface TeamEndGameRanking {
  team: string;
  teamLogo?: string;
  totalDrops: number;
  endGameReachedCount: number;
  endGameReachedPct: number;
  fullSquadCount: number;
  fullSquadPct: number;
  threeAliveCount: number;
  lowAliveCount: number; // 1 ou 2 vivos
  avgAliveAtEndGame: string;
  eliminatedBeforeSafe4: number;
  eliminatedBeforeSafe4Pct: number;
  booyahCount: number;
  booyahConversionPct: number;
}

export const calculateTeamEndGameRankings = (
  drops: { team: string; teamLogo?: string; combatAnalysis: DropCombatAnalysis }[]
): TeamEndGameRanking[] => {
  const teamMap = new Map<string, { team: string; teamLogo?: string; analyses: DropCombatAnalysis[] }>();

  drops.forEach(d => {
    const k = d.team.trim();
    if (!teamMap.has(k)) {
      teamMap.set(k, { team: k, teamLogo: d.teamLogo, analyses: [] });
    }
    teamMap.get(k)!.analyses.push(d.combatAnalysis);
  });

  const rankings: TeamEndGameRanking[] = [];

  teamMap.forEach(({ team, teamLogo, analyses }) => {
    const totalDrops = analyses.length;
    if (totalDrops === 0) return;

    const reached = analyses.filter(a => a.reachedEndGame);
    const reachedCount = reached.length;
    const fullSquadCount = analyses.filter(a => a.isFullSquadAtEndGame).length;
    const threeAliveCount = analyses.filter(a => a.reachedEndGame && a.playersAliveAtEndGame === 3).length;
    const lowAliveCount = analyses.filter(a => a.reachedEndGame && a.playersAliveAtEndGame <= 2).length;
    const booyahCount = analyses.filter(a => a.booyah).length;
    const eliminatedBeforeSafe4 = analyses.filter(a => !a.reachedEndGame).length;

    const sumAlive = reached.reduce((acc, a) => acc + a.playersAliveAtEndGame, 0);
    const avgAlive = reachedCount > 0 ? (sumAlive / reachedCount).toFixed(1) : '0.0';

    rankings.push({
      team,
      teamLogo,
      totalDrops,
      endGameReachedCount: reachedCount,
      endGameReachedPct: Math.round((reachedCount / totalDrops) * 100),
      fullSquadCount,
      fullSquadPct: Math.round((fullSquadCount / totalDrops) * 100),
      threeAliveCount,
      lowAliveCount,
      avgAliveAtEndGame: avgAlive,
      eliminatedBeforeSafe4,
      eliminatedBeforeSafe4Pct: Math.round((eliminatedBeforeSafe4 / totalDrops) * 100),
      booyahCount,
      booyahConversionPct: reachedCount > 0 ? Math.round((booyahCount / reachedCount) * 100) : 0
    });
  });

  return rankings.sort((a, b) => {
    if (b.endGameReachedCount !== a.endGameReachedCount) {
      return b.endGameReachedCount - a.endGameReachedCount;
    }
    if (b.endGameReachedPct !== a.endGameReachedPct) {
      return b.endGameReachedPct - a.endGameReachedPct;
    }
    return b.fullSquadCount - a.fullSquadCount;
  });
};
