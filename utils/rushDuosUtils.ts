import { DashboardData, PlayerData, KillFeed, MatchDetails } from '../types';
import { findTeamLogo } from './teamUtils';
import { MASTER_WEAPONS } from './weaponUtils';
import { isSameTeam } from './characterUtils';

export interface RushDuoPlayerStats {
  name: string;
  avatar?: string;
  role1: string;
  role2: string;
  isRush: boolean;
  kills: number;
  damage: number;
  assists: number;
  knockdowns: number;
  mvps: number;
  headshots: number;
  hsRate: number;
  avgKillsPerMatch: number;
  avgDamagePerMatch: number;
}

export interface RushDuoMapStats {
  mapName: string;
  mapId: string;
  matches: number;
  kills: number;
  damage: number;
  killsPerMatch: number;
  damagePerMatch: number;
  booyahs: number;
  teamKills: number;
  killShare: number;
  topSafeName?: string;
}

export interface RushDuoWeaponStats {
  name: string;
  category: string; // 'ESPINGARDA' | 'SMG' | 'AR' | 'SNIPER' | etc.
  img: string;
  kills: number;
  percentage: number;
  isRushWeapon: boolean;
}

export interface RushDuoRoundStats {
  round: string;
  roundNumber: number;
  matches: number;
  kills: number;
  damage: number;
  assists: number;
  knockdowns: number;
  booyahs: number;
  killsPerMatch: number;
  damagePerMatch: number;
  avgKda: number;
}

export interface RushDuoData {
  id: string; // e.g. "FLUXO:Ghost+Mt7"
  teamName: string;
  teamLogo?: string;
  player1: RushDuoPlayerStats;
  player2: RushDuoPlayerStats;
  duoType: 'RUSH_PURO' | 'RUSH_HIBRIDO' | 'DUPLA_GERAL';
  duoTypeLabel: string;
  matchesTogether: number;
  combinedKills: number;
  killsPerMatch: number;
  combinedDamage: number;
  damagePerMatch: number;
  combinedKnockdowns: number;
  knockdownsPerMatch: number;
  combinedAssists: number;
  assistsPerMatch: number;
  combinedMVPs: number;
  combinedDeaths: number;
  kda: number;
  avgSurvivalRate: number; // percentage (0-100)
  avgPlacement: number;
  zeroKillMatches: number; // Partidas em que a dupla fez 0 abates
  zeroKillRate: number; // % de partidas zeradas
  teamTotalKillsInSharedMatches: number;
  teamKillShare: number; // percentage (0-100)
  teamPointsInSharedMatches: number;
  avgTeamPointsPerMatch: number;
  booyahsTogether: number;
  booyahRate: number; // percentage
  
  // Tactical profile
  topWeapons: RushDuoWeaponStats[];
  rushWeaponKills: number;
  rushWeaponRate: number; // % of duo kills made with shotguns or SMGs
  strengths: string[];
  
  // Role dynamics
  entryFragger: string; // Name of player with more knockdowns / first action
  finisher: string; // Name of player with more kills / cleaner
  
  // Breakdown
  mapBreakdown: RushDuoMapStats[];
  bestMap: RushDuoMapStats | null;
  roundHistory: RushDuoRoundStats[];
  last5Rounds: RushDuoRoundStats[];
  
  // Safes timing (Early: Safe 1-2, Mid: Safe 3-4, Late: Safe 5+)
  earlyGameKills: number; // Safe 1, 2
  midGameKills: number;   // Safe 3, 4
  lateGameKills: number;  // Safe 5, 6, 7+
  
  // Composite score (0-100)
  synergyScore: number;
}

// Normalizes player role to check for rush
export const isRushRole = (role?: string): boolean => {
  if (!role) return false;
  const upper = role.toUpperCase().trim();
  return (
    upper.includes('RUSH') ||
    upper.includes('ASSAULT') ||
    upper.includes('FRONT') ||
    upper.includes('ENTRADA') ||
    upper.includes('PONTA')
  );
};

// Formats map name uniformly
export const normalizeMap = (mapStr?: string): { name: string; id: string } => {
  if (!mapStr) return { name: 'BERMUDA', id: 'BER' };
  const upper = mapStr.toUpperCase().trim();
  if (upper.includes('BER')) return { name: 'BERMUDA', id: 'BER' };
  if (upper.includes('PUR')) return { name: 'PURGATÓRIO', id: 'PUR' };
  if (upper.includes('KAL')) return { name: 'KALAHARI', id: 'KAL' };
  if (upper.includes('NOV') || upper.includes('TER') || upper.includes('NT') || upper.includes('NEX')) return { name: 'NOVA TERRA', id: 'NT' };
  if (upper.includes('SOL')) return { name: 'SOLARA', id: 'SOL' };
  if (upper.includes('ALP')) return { name: 'ALPINE', id: 'ALP' };
  return { name: upper, id: upper.substring(0, 3) };
};

// Weapon master lookup helper
export const getWeaponInfo = (weaponName: string) => {
  if (!weaponName) return { name: 'DESCONHECIDO', category: 'OUTRO', img: '', isRush: false };
  const clean = weaponName.trim().toUpperCase();
  const found = MASTER_WEAPONS.find(w => w.Arma.toUpperCase() === clean);
  const cat = found?.TipoArm?.toUpperCase() || 'OUTRO';
  const isRush = cat === 'ESPINGARDA' || cat === 'SMG' || clean.includes('M1014') || clean.includes('BAUBAU') || clean.includes('MP40') || clean.includes('TROGON') || clean.includes('UMP') || clean.includes('MAG-7') || clean.includes('CARGA');
  return {
    name: found?.Arma || clean,
    category: cat,
    img: found?.IMG || 'https://i.ibb.co/TLg0jQd/KILL-FF-removebg-preview.png',
    isRush
  };
};

/**
 * Calculates comprehensive rush duo and pairing statistics across matches
 */
export const calculateRushDuosData = (
  data: DashboardData,
  filters?: {
    teamFilter?: string;
    mapFilter?: string;
    roundFilter?: string;
    onlyRushDuo?: boolean;
    minMatches?: number;
  }
): RushDuoData[] => {
  if (!data || !data.players || data.players.length === 0) return [];

  const teamFilter = filters?.teamFilter?.trim();
  const mapFilter = filters?.mapFilter?.trim().toUpperCase();
  const roundFilter = filters?.roundFilter?.trim();
  const onlyRush = filters?.onlyRushDuo ?? false;
  const minMatches = filters?.minMatches ?? 1;

  // 1. Group player records by match (key: TEAM + '|' + RD + '|' + Q + '|' + MAPA)
  // Inside each match, identify participating players
  interface MatchPlayerEntry {
    player: string;
    team: string;
    rd: string;
    q: string;
    map: string;
    kills: number;
    damage: number;
    hs: number;
    knockdowns: number;
    assists: number;
    mvp: number;
  }

  const matchGroups = new Map<string, {
    team: string;
    rd: string;
    q: string;
    map: string;
    players: MatchPlayerEntry[];
    totalTeamKills: number;
  }>();

  data.players.forEach(p => {
    if (!p.PLAYER || !p.TIME) return;
    if (teamFilter && !isSameTeam(p.TIME, teamFilter)) return;

    const rd = (p.RD || '').trim();
    if (roundFilter && roundFilter !== 'ALL' && rd !== roundFilter) return;

    const rawMap = p.MAPA || '';
    const normMap = normalizeMap(rawMap);
    if (mapFilter && mapFilter !== 'ALL' && normMap.name !== mapFilter && normMap.id !== mapFilter) return;

    const q = (p.Q || '1').trim();
    const matchKey = `${p.TIME.trim()}___${rd}___${q}___${normMap.name}`;

    const kills = parseInt(p.Abates || '0', 10) || 0;
    const damage = parseFloat((p.Dano || '0').replace(',', '.')) || 0;
    const hs = parseInt(p.HS || '0', 10) || 0;
    const knockdowns = parseInt(p.Deitados || '0', 10) || 0;
    const assists = parseInt(p.Assistencias || '0', 10) || 0;
    const mvp = parseInt(p.MVP || '0', 10) || 0;

    if (!matchGroups.has(matchKey)) {
      matchGroups.set(matchKey, {
        team: p.TIME.trim(),
        rd,
        q,
        map: normMap.name,
        players: [],
        totalTeamKills: 0
      });
    }

    const group = matchGroups.get(matchKey)!;
    group.players.push({
      player: p.PLAYER.trim(),
      team: p.TIME.trim(),
      rd,
      q,
      map: normMap.name,
      kills,
      damage,
      hs,
      knockdowns,
      assists,
      mvp
    });
    group.totalTeamKills += kills;
  });

  // 2. Map of Match Details for Booyahs, Placements and Team Points lookup
  // Match key: TIME + '___' + RD + '___' + Q + '___' + MAPA
  const matchDetailsLookup = new Map<string, { pts: number; isBooyah: boolean; totalKills: number; pos: number }>();
  (data.details || []).forEach(d => {
    if (!d.TIME) return;
    const normMap = normalizeMap(d.MAPA);
    const key = `${d.TIME.trim()}___${(d.RD || '').trim()}___${(d.Q || '1').trim()}___${normMap.name}`;
    const pts = parseFloat((d.PTS || '0').replace(',', '.')) || 0;
    const pos = parseInt((d.POS || '0').replace(/\D/g, ''), 10) || 0;
    const isBooyah = (d.POS || '').trim() === '1' || (d.B || '').trim() === '1' || pos === 1;
    const totalKills = parseInt(d.ABTS || '0', 10) || 0;
    matchDetailsLookup.set(key, { pts, isBooyah, totalKills, pos });
  });

  // 3. Players dimension cache for roles and avatars
  const playerDimMap = new Map<string, { avatar?: string; role1: string; role2: string; isRush: boolean }>();
  (data.playersDimension || []).forEach(dim => {
    if (!dim.Name) return;
    const key = dim.Name.trim().toUpperCase();
    const r1 = (dim.Funcao || '').trim();
    const r2 = (dim.Funcao2 || '').trim();
    const isRush = isRushRole(r1) || isRushRole(r2);
    playerDimMap.set(key, {
      avatar: dim.IMG,
      role1: r1 || 'JOGADOR',
      role2: r2 || '',
      isRush
    });
  });

  // 4. KillFeed index by Player + RD + Q + MAPA for weapons and safe timing
  interface KillFeedEntry {
    weapon: string;
    safe: string;
    time?: string;
  }
  const playerKillFeed = new Map<string, KillFeedEntry[]>();
  (data.killFeed || []).forEach(kf => {
    if (!kf.PLAYER) return;
    const pKey = kf.PLAYER.trim().toUpperCase();
    if (!playerKillFeed.has(pKey)) {
      playerKillFeed.set(pKey, []);
    }
    playerKillFeed.get(pKey)!.push({
      weapon: kf.ARMA || 'DESCONHECIDO',
      safe: kf.SAFE || '',
      time: kf.Tempo
    });
  });

  // 5. Aggregate all Pairings (Duos) from the matches
  // Pair key: TEAM + '::' + sorted(PlayerA, PlayerB)
  interface DuoAccumulator {
    team: string;
    p1Name: string;
    p2Name: string;
    matches: Set<string>;
    matchList: Array<{
      matchKey: string;
      rd: string;
      q: string;
      mapName: string;
      p1Kills: number;
      p1Damage: number;
      p1Hs: number;
      p1Knock: number;
      p1Assists: number;
      p1Mvp: number;
      p2Kills: number;
      p2Damage: number;
      p2Hs: number;
      p2Knock: number;
      p2Assists: number;
      p2Mvp: number;
      teamKills: number;
      teamPoints: number;
      isBooyah: boolean;
      pos: number;
    }>;
  }

  const duoAccumulators = new Map<string, DuoAccumulator>();

  matchGroups.forEach((group, matchKey) => {
    const players = group.players;
    if (players.length < 2) return;

    // Lookup match details if available
    const details = matchDetailsLookup.get(matchKey);
    const teamKills = details?.totalKills ?? group.totalTeamKills;
    const teamPoints = details?.pts ?? 0;
    const isBooyah = details?.isBooyah ?? false;
    const pos = details?.pos ?? 0;

    // Generate all pairs in this match
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        const [nameA, nameB] = [p1.player, p2.player].sort((a, b) => a.localeCompare(b));
        const p1Data = p1.player === nameA ? p1 : p2;
        const p2Data = p1.player === nameA ? p2 : p1;

        const duoKey = `${group.team}::${nameA}+${nameB}`;

        if (!duoAccumulators.has(duoKey)) {
          duoAccumulators.set(duoKey, {
            team: group.team,
            p1Name: nameA,
            p2Name: nameB,
            matches: new Set(),
            matchList: []
          });
        }

        const acc = duoAccumulators.get(duoKey)!;
        if (!acc.matches.has(matchKey)) {
          acc.matches.add(matchKey);
          acc.matchList.push({
            matchKey,
            rd: group.rd,
            q: group.q,
            mapName: group.map,
            p1Kills: p1Data.kills,
            p1Damage: p1Data.damage,
            p1Hs: p1Data.hs,
            p1Knock: p1Data.knockdowns,
            p1Assists: p1Data.assists,
            p1Mvp: p1Data.mvp,
            p2Kills: p2Data.kills,
            p2Damage: p2Data.damage,
            p2Hs: p2Data.hs,
            p2Knock: p2Data.knockdowns,
            p2Assists: p2Data.assists,
            p2Mvp: p2Data.mvp,
            teamKills: Math.max(teamKills, p1Data.kills + p2Data.kills),
            teamPoints,
            isBooyah,
            pos
          });
        }
      }
    }
  });

  // 6. Process accumulators into RushDuoData
  const results: RushDuoData[] = [];

  duoAccumulators.forEach(acc => {
    const matchesCount = acc.matchList.length;
    if (matchesCount < minMatches) return;

    const p1Dim = playerDimMap.get(acc.p1Name.toUpperCase());
    const p2Dim = playerDimMap.get(acc.p2Name.toUpperCase());

    const isP1Rush = p1Dim?.isRush || false;
    const isP2Rush = p2Dim?.isRush || false;

    let duoType: 'RUSH_PURO' | 'RUSH_HIBRIDO' | 'DUPLA_GERAL' = 'DUPLA_GERAL';
    let duoTypeLabel = 'Dupla Geral';

    if (isP1Rush && isP2Rush) {
      duoType = 'RUSH_PURO';
      duoTypeLabel = 'Dupla de Rush Pura (Rush 1 + Rush 2)';
    } else if (isP1Rush || isP2Rush) {
      duoType = 'RUSH_HIBRIDO';
      duoTypeLabel = 'Dupla Híbrida (Rush + Suporte / IGL)';
    }

    if (onlyRush && duoType === 'DUPLA_GERAL') {
      return;
    }

    // Accumulate player metrics
    let p1Kills = 0;
    let p1Damage = 0;
    let p1Hs = 0;
    let p1Knock = 0;
    let p1Assists = 0;
    let p1Mvp = 0;

    let p2Kills = 0;
    let p2Damage = 0;
    let p2Hs = 0;
    let p2Knock = 0;
    let p2Assists = 0;
    let p2Mvp = 0;

    let teamKillsSum = 0;
    let teamPointsSum = 0;
    let booyahsSum = 0;
    let posSum = 0;
    let combinedDeaths = 0;
    let zeroKillMatches = 0;

    // Map breakdown map
    const mapMap = new Map<string, {
      mapName: string;
      mapId: string;
      matches: number;
      kills: number;
      damage: number;
      booyahs: number;
      teamKills: number;
    }>();

    // Round breakdown map
    const roundMap = new Map<string, {
      round: string;
      roundNumber: number;
      matches: number;
      kills: number;
      damage: number;
      assists: number;
      knockdowns: number;
      booyahs: number;
      deaths: number;
    }>();

    acc.matchList.forEach(m => {
      p1Kills += m.p1Kills;
      p1Damage += m.p1Damage;
      p1Hs += m.p1Hs;
      p1Knock += m.p1Knock;
      p1Assists += m.p1Assists;
      p1Mvp += m.p1Mvp;

      p2Kills += m.p2Kills;
      p2Damage += m.p2Damage;
      p2Hs += m.p2Hs;
      p2Knock += m.p2Knock;
      p2Assists += m.p2Assists;
      p2Mvp += m.p2Mvp;

      if (m.p1Kills + m.p2Kills === 0) {
        zeroKillMatches += 1;
      }

      teamKillsSum += m.teamKills;
      teamPointsSum += m.teamPoints;
      if (m.isBooyah) {
        booyahsSum += 1;
      } else {
        combinedDeaths += 2; // In battle royale, when not winning, 2 players die
      }
      if (m.pos > 0) {
        posSum += m.pos;
      }

      // Map aggregation
      const norm = normalizeMap(m.mapName);
      if (!mapMap.has(norm.name)) {
        mapMap.set(norm.name, {
          mapName: norm.name,
          mapId: norm.id,
          matches: 0,
          kills: 0,
          damage: 0,
          booyahs: 0,
          teamKills: 0
        });
      }

      const mapEntry = mapMap.get(norm.name)!;
      mapEntry.matches += 1;
      mapEntry.kills += (m.p1Kills + m.p2Kills);
      mapEntry.damage += (m.p1Damage + m.p2Damage);
      mapEntry.teamKills += m.teamKills;
      if (m.isBooyah) mapEntry.booyahs += 1;

      // Round aggregation
      const rdClean = (m.rd || '1').trim();
      const rdNum = parseInt(rdClean.replace(/\D/g, '') || '0', 10) || 1;
      const rdKey = `RD ${rdNum}`;

      if (!roundMap.has(rdKey)) {
        roundMap.set(rdKey, {
          round: rdKey,
          roundNumber: rdNum,
          matches: 0,
          kills: 0,
          damage: 0,
          assists: 0,
          knockdowns: 0,
          booyahs: 0,
          deaths: 0
        });
      }

      const rdEntry = roundMap.get(rdKey)!;
      rdEntry.matches += 1;
      rdEntry.kills += (m.p1Kills + m.p2Kills);
      rdEntry.damage += (m.p1Damage + m.p2Damage);
      rdEntry.assists += (m.p1Assists + m.p2Assists);
      rdEntry.knockdowns += (m.p1Knock + m.p2Knock);
      if (m.isBooyah) {
        rdEntry.booyahs += 1;
      } else {
        rdEntry.deaths += 2;
      }
    });

    const combinedKills = p1Kills + p2Kills;
    const combinedDamage = p1Damage + p2Damage;
    const combinedKnockdowns = p1Knock + p2Knock;
    const combinedAssists = p1Assists + p2Assists;
    const combinedMVPs = p1Mvp + p2Mvp;

    const killsPerMatch = matchesCount > 0 ? Number((combinedKills / matchesCount).toFixed(2)) : 0;
    const damagePerMatch = matchesCount > 0 ? Number((combinedDamage / matchesCount).toFixed(0)) : 0;
    const knockdownsPerMatch = matchesCount > 0 ? Number((combinedKnockdowns / matchesCount).toFixed(2)) : 0;
    const assistsPerMatch = matchesCount > 0 ? Number((combinedAssists / matchesCount).toFixed(2)) : 0;
    const avgTeamPointsPerMatch = matchesCount > 0 ? Number((teamPointsSum / matchesCount).toFixed(1)) : 0;
    const booyahRate = matchesCount > 0 ? Number(((booyahsSum / matchesCount) * 100).toFixed(1)) : 0;
    const avgSurvivalRate = booyahRate;
    const avgPlacement = matchesCount > 0 && posSum > 0 ? Number((posSum / matchesCount).toFixed(1)) : 0;
    const zeroKillRate = matchesCount > 0 ? Number(((zeroKillMatches / matchesCount) * 100).toFixed(1)) : 0;

    const effectiveDeaths = Math.max(1, combinedDeaths);
    const kda = Number(((combinedKills + combinedAssists) / effectiveDeaths).toFixed(2));

    const effectiveTeamKills = Math.max(teamKillsSum, combinedKills, 1);
    const teamKillShare = Number(((combinedKills / effectiveTeamKills) * 100).toFixed(1));

    // Player stats objects
    const player1Stats: RushDuoPlayerStats = {
      name: acc.p1Name,
      avatar: p1Dim?.avatar,
      role1: p1Dim?.role1 || 'JOGADOR',
      role2: p1Dim?.role2 || '',
      isRush: isP1Rush,
      kills: p1Kills,
      damage: p1Damage,
      assists: p1Assists,
      knockdowns: p1Knock,
      mvps: p1Mvp,
      headshots: p1Hs,
      hsRate: p1Kills > 0 ? Number(((p1Hs / p1Kills) * 100).toFixed(1)) : 0,
      avgKillsPerMatch: matchesCount > 0 ? Number((p1Kills / matchesCount).toFixed(2)) : 0,
      avgDamagePerMatch: matchesCount > 0 ? Number((p1Damage / matchesCount).toFixed(0)) : 0
    };

    const player2Stats: RushDuoPlayerStats = {
      name: acc.p2Name,
      avatar: p2Dim?.avatar,
      role1: p2Dim?.role1 || 'JOGADOR',
      role2: p2Dim?.role2 || '',
      isRush: isP2Rush,
      kills: p2Kills,
      damage: p2Damage,
      assists: p2Assists,
      knockdowns: p2Knock,
      mvps: p2Mvp,
      headshots: p2Hs,
      hsRate: p2Kills > 0 ? Number(((p2Hs / p2Kills) * 100).toFixed(1)) : 0,
      avgKillsPerMatch: matchesCount > 0 ? Number((p2Kills / matchesCount).toFixed(2)) : 0,
      avgDamagePerMatch: matchesCount > 0 ? Number((p2Damage / matchesCount).toFixed(0)) : 0
    };

    // Entry fragger determination (who opens combat / more knockdowns / damage)
    const entryFragger = p1Knock >= p2Knock ? acc.p1Name : acc.p2Name;
    const finisher = p1Kills >= p2Kills ? acc.p1Name : acc.p2Name;

    // Weapons analysis for duo
    const weaponCounts = new Map<string, number>();
    let rushWeaponKills = 0;
    let earlyGameKills = 0;
    let midGameKills = 0;
    let lateGameKills = 0;

    const duoKillsList = [
      ...(playerKillFeed.get(acc.p1Name.toUpperCase()) || []),
      ...(playerKillFeed.get(acc.p2Name.toUpperCase()) || [])
    ];

    duoKillsList.forEach(k => {
      const wInfo = getWeaponInfo(k.weapon);
      weaponCounts.set(wInfo.name, (weaponCounts.get(wInfo.name) || 0) + 1);
      if (wInfo.isRush) {
        rushWeaponKills += 1;
      }

      const safeNum = parseInt((k.safe || '').replace(/\D/g, ''), 10);
      if (safeNum <= 2) {
        earlyGameKills += 1;
      } else if (safeNum <= 4) {
        midGameKills += 1;
      } else {
        lateGameKills += 1;
      }
    });

    const totalFeedKills = duoKillsList.length || combinedKills || 1;
    const topWeapons: RushDuoWeaponStats[] = Array.from(weaponCounts.entries())
      .map(([wName, count]) => {
        const info = getWeaponInfo(wName);
        return {
          name: wName,
          category: info.category,
          img: info.img,
          kills: count,
          percentage: Number(((count / totalFeedKills) * 100).toFixed(1)),
          isRushWeapon: info.isRush
        };
      })
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 6);

    const rushWeaponRate = totalFeedKills > 0 ? Number(((rushWeaponKills / totalFeedKills) * 100).toFixed(1)) : 0;

    // Map breakdown list
    const mapBreakdown: RushDuoMapStats[] = Array.from(mapMap.values()).map(m => ({
      mapName: m.mapName,
      mapId: m.mapId,
      matches: m.matches,
      kills: m.kills,
      damage: m.damage,
      killsPerMatch: m.matches > 0 ? Number((m.kills / m.matches).toFixed(2)) : 0,
      damagePerMatch: m.matches > 0 ? Number((m.damage / m.matches).toFixed(0)) : 0,
      booyahs: m.booyahs,
      teamKills: m.teamKills,
      killShare: m.teamKills > 0 ? Number(((m.kills / m.teamKills) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.kills - a.kills);

    const bestMap = mapBreakdown.length > 0 ? mapBreakdown[0] : null;

    // Round history list sorted by roundNumber
    const roundHistory: RushDuoRoundStats[] = Array.from(roundMap.values())
      .map(r => ({
        round: r.round,
        roundNumber: r.roundNumber,
        matches: r.matches,
        kills: r.kills,
        damage: r.damage,
        assists: r.assists,
        knockdowns: r.knockdowns,
        booyahs: r.booyahs,
        killsPerMatch: r.matches > 0 ? Number((r.kills / r.matches).toFixed(2)) : 0,
        damagePerMatch: r.matches > 0 ? Number((r.damage / r.matches).toFixed(0)) : 0,
        avgKda: Number(((r.kills + r.assists) / Math.max(1, r.deaths)).toFixed(2))
      }))
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const last5Rounds = roundHistory.slice(-5);

    // Strengths calculation
    const strengths: string[] = [];
    if (kda >= 1.8) strengths.push('KDA de Alto Impacto');
    if (damagePerMatch >= 750) strengths.push('Dano Médio Massivo');
    if (avgSurvivalRate >= 20 || booyahsSum >= 2) strengths.push('Alta Sobrevivência & Booyahs');
    if (teamKillShare >= 40) strengths.push('Alta Sinergia & Kill Share');
    if (knockdownsPerMatch >= 1.5) strengths.push('Entry Fragger Letal');
    if (rushWeaponRate >= 50) strengths.push('Mestres em Armas de Rush');
    if (strengths.length === 0) {
      if (killsPerMatch >= 1.5) strengths.push('Boa Agressividade');
      else strengths.push('Dupla Versátil');
    }

    // Synergy Score Calculation (0-100)
    const kFactor = Math.min(killsPerMatch / 4.0, 1.0) * 35;
    const dFactor = Math.min(damagePerMatch / 1500, 1.0) * 25;
    const sFactor = Math.min(teamKillShare / 60, 1.0) * 20;
    const knFactor = Math.min(knockdownsPerMatch / 4.0, 1.0) * 10;
    const bFactor = Math.min(booyahRate / 35, 1.0) * 10;
    const synergyScore = Math.min(Math.round(kFactor + dFactor + sFactor + knFactor + bFactor), 99);

    const teamLogo = findTeamLogo(acc.team, data.teamsReference);

    results.push({
      id: `${acc.team}:${acc.p1Name}+${acc.p2Name}`,
      teamName: acc.team,
      teamLogo,
      player1: player1Stats,
      player2: player2Stats,
      duoType,
      duoTypeLabel,
      matchesTogether: matchesCount,
      combinedKills,
      killsPerMatch,
      combinedDamage,
      damagePerMatch,
      combinedKnockdowns,
      knockdownsPerMatch,
      combinedAssists,
      assistsPerMatch,
      combinedMVPs,
      combinedDeaths,
      kda,
      avgSurvivalRate,
      avgPlacement,
      zeroKillMatches,
      zeroKillRate,
      teamTotalKillsInSharedMatches: effectiveTeamKills,
      teamKillShare,
      teamPointsInSharedMatches: teamPointsSum,
      avgTeamPointsPerMatch,
      booyahsTogether: booyahsSum,
      booyahRate,
      topWeapons,
      rushWeaponKills,
      rushWeaponRate,
      strengths,
      entryFragger,
      finisher,
      mapBreakdown,
      bestMap,
      roundHistory,
      last5Rounds,
      earlyGameKills,
      midGameKills,
      lateGameKills,
      synergyScore
    });
  });

  // Sort by combined kills descending by default
  return results.sort((a, b) => b.combinedKills - a.combinedKills);
};
