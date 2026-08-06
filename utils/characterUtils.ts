import { DashboardData, CharacterData, PlayerData } from '../types';
import { findDimImg } from './skillImages';

export interface PlayerLoadoutDetailed {
  player: string;
  time: string;
  hab1: string;
  hab1Img?: string;
  hab2: string;
  hab2Img?: string;
  hab3: string;
  hab3Img?: string;
  hab4: string;
  hab4Img?: string;
  pet: string;
  petImg?: string;
  item: string;
  itemImg?: string;
  rd: string;
  q: string;
  confronto: string;
  mapa: string;
  kills?: number;
  damage?: number;
  funcao?: string;
  funcao2?: string;
}

const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

/**
 * Verificação estrita de correspondência de times (evita que atalhos/substrings soltas como "A" ou "PA" combinem com outros times)
 */
export const isSameTeam = (nameA?: string, nameB?: string, teamsReference: any[] = []): boolean => {
  if (!nameA || !nameB) return false;
  const strA = nameA.trim();
  const strB = nameB.trim();
  if (!strA || !strB) return false;

  const normA = strA.toUpperCase();
  const normB = strB.toUpperCase();

  if (normA === normB) return true;

  if (teamsReference && teamsReference.length > 0) {
    const refA = teamsReference.find(t => t.TIME && t.TIME.trim().toUpperCase() === normA);
    const refB = teamsReference.find(t => t.TIME && t.TIME.trim().toUpperCase() === normB);
    if (refA && refB && refA.TIME && refB.TIME && refA.TIME.trim().toUpperCase() === refB.TIME.trim().toUpperCase()) {
      return true;
    }
  }

  const tokensA = normA.split(/\s+/);
  const tokensB = normB.split(/\s+/);

  if (tokensA.some(t => t === normB) || tokensB.some(t => t === normA)) {
    return true;
  }

  if (tokensA.length === 1 && tokensB.length === 1) {
    if (normA.length >= 4 && normB.startsWith(normA)) return true;
    if (normB.length >= 4 && normA.startsWith(normB)) return true;
  }

  return false;
};

/**
 * Retorna estritamente os registros da aba/coleção characters que pertencem ao time especificado
 */
export const getTeamCharacters = (data: DashboardData, teamName: string): CharacterData[] => {
  if (!data.characters || !teamName || !teamName.trim()) return [];

  const teamsRef = data.teamsReference || [];

  // Mapeia jogadores do time via data.players & data.playersDimension
  const teamPlayerNames = new Set<string>();
  if (data.players) {
    data.players.forEach(p => {
      if (p.PLAYER && isSameTeam(p.TIME, teamName, teamsRef)) {
        teamPlayerNames.add(normalize(p.PLAYER));
      }
    });
  }

  if (data.playersDimension) {
    data.playersDimension.forEach((p: any) => {
      if (p.Name && p.Time && isSameTeam(p.Time, teamName, teamsRef)) {
        teamPlayerNames.add(normalize(p.Name));
      }
    });
  }

  return data.characters.filter(c => {
    if (!c) return false;
    if (c.Time && isSameTeam(c.Time, teamName, teamsRef)) {
      return true;
    }
    if (c.Player && teamPlayerNames.has(normalize(c.Player))) {
      return true;
    }
    return false;
  });
};

/**
 * Retorna o histórico completo de personagens/loadouts de um jogador específico por queda
 */
export const getPlayerCharacterHistory = (data: DashboardData, playerName: string): PlayerLoadoutDetailed[] => {
  if (!data.characters || !playerName) return [];
  const normPlayer = normalize(playerName);

  const playerRecords = data.characters.filter(c => normalize(c.Player) === normPlayer);

  return playerRecords.map(c => {
    const rdNum = (c.Rd || c.RD || '').toString().replace(/\D/g, '');
    const qNum = (c.Q || c.S || '').toString().replace(/\D/g, '');

    // Busca abates e dano desse jogador na queda correspondente
    const pStat = data.players.find(p => 
      normalize(p.PLAYER) === normPlayer &&
      (p.RD || '').toString().replace(/\D/g, '') === rdNum &&
      (p.Q || '').toString().replace(/\D/g, '') === qNum
    );

    const dim = data.playersDimension.find(d => normalize(d.Name) === normPlayer);

    return {
      player: c.Player,
      time: c.Time,
      hab1: c.Hab1,
      hab1Img: findDimImg(data.hab1, c.Hab1),
      hab2: c.Hab2,
      hab2Img: findDimImg(data.hab2, c.Hab2),
      hab3: c.Hab3,
      hab3Img: findDimImg(data.hab3, c.Hab3),
      hab4: c.Hab4,
      hab4Img: findDimImg(data.hab4, c.Hab4),
      pet: c.Pet,
      petImg: findDimImg(data.pets, c.Pet),
      item: c.Item,
      itemImg: findDimImg(data.items, c.Item),
      rd: c.Rd || c.RD || '1',
      q: c.Q || c.S || '1',
      confronto: c.Confronto || 'N/A',
      mapa: c.Mapa || 'N/A',
      kills: pStat ? parseInt(pStat.Abates) || 0 : undefined,
      damage: pStat ? parseInt(pStat.Dano || '0') || 0 : undefined,
      funcao: dim?.Funcao,
      funcao2: dim?.Funcao2
    };
  }).sort((a, b) => {
    const rdA = parseInt(a.rd.replace(/\D/g, '')) || 0;
    const rdB = parseInt(b.rd.replace(/\D/g, '')) || 0;
    if (rdA !== rdB) return rdA - rdB;
    const qA = parseInt(a.q.replace(/\D/g, '')) || 0;
    const qB = parseInt(b.q.replace(/\D/g, '')) || 0;
    return qA - qB;
  });
};

/**
 * Retorna a composição dos 4 jogadores de um time para uma queda específica (Rodada e Queda/Mapa)
 */
export const getTeamDropComposition = (
  data: DashboardData,
  teamName: string,
  rd: string,
  q: string,
  confronto?: string,
  mapa?: string
): PlayerLoadoutDetailed[] => {
  if (!data.characters || !teamName) return [];

  const teamChars = getTeamCharacters(data, teamName);
  if (teamChars.length === 0) return [];

  const rdNum = rd.toString().replace(/\D/g, '');
  const qNum = q.toString().replace(/\D/g, '');
  const normMap = normalize(mapa);

  // Filtrar por rodada, queda e mapa
  const dropChars = teamChars.filter(c => {
    const cRdNum = (c.Rd || c.RD || '').toString().replace(/\D/g, '');
    if (rdNum && cRdNum && cRdNum !== rdNum) return false;

    const cQNum = (c.Q || c.S || '').toString().replace(/\D/g, '');
    if (qNum && cQNum && cQNum !== qNum) return false;

    if (normMap && c.Mapa && normalize(c.Mapa) !== normMap) {
      if (!normalize(c.Mapa).includes(normMap) && !normMap.includes(normalize(c.Mapa))) {
        return false;
      }
    }

    return true;
  });

  // Se houver duplicatas de um mesmo jogador na mesma queda, manter o primeiro
  const seenPlayers = new Set<string>();
  const uniqueChars: CharacterData[] = [];
  dropChars.forEach(c => {
    const pKey = normalize(c.Player);
    if (pKey && !seenPlayers.has(pKey)) {
      seenPlayers.add(pKey);
      uniqueChars.push(c);
    }
  });

  return uniqueChars.map(c => {
    const pStat = data.players.find(p => 
      normalize(p.PLAYER) === normalize(c.Player) &&
      (p.RD || '').toString().replace(/\D/g, '') === rdNum &&
      (p.Q || '').toString().replace(/\D/g, '') === qNum
    );

    const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(c.Player));

    return {
      player: c.Player,
      time: c.Time || teamName,
      hab1: c.Hab1,
      hab1Img: findDimImg(data.hab1, c.Hab1),
      hab2: c.Hab2,
      hab2Img: findDimImg(data.hab2, c.Hab2),
      hab3: c.Hab3,
      hab3Img: findDimImg(data.hab3, c.Hab3),
      hab4: c.Hab4,
      hab4Img: findDimImg(data.hab4, c.Hab4),
      pet: c.Pet,
      petImg: findDimImg(data.pets, c.Pet),
      item: c.Item,
      itemImg: findDimImg(data.items, c.Item),
      rd: c.Rd || c.RD || rd,
      q: c.Q || c.S || q,
      confronto: c.Confronto || confronto || 'N/A',
      mapa: c.Mapa || mapa || 'N/A',
      kills: pStat ? parseInt(pStat.Abates) || 0 : undefined,
      damage: pStat ? parseInt(pStat.Dano || '0') || 0 : undefined,
      funcao: dim?.Funcao,
      funcao2: dim?.Funcao2
    };
  });
};

export interface TeamCharacterSummary {
  totalDrops: number;
  activeSkills: { name: string; count: number; pct: number; img?: string }[];
  passives: { name: string; count: number; pct: number; img?: string }[];
  pets: { name: string; count: number; pct: number; img?: string }[];
  items: { name: string; count: number; pct: number; img?: string }[];
  players: {
    name: string;
    totalDrops: number;
    funcao?: string;
    activeSkills: { name: string; count: number; pct: number; img?: string }[];
    passives: { name: string; count: number; pct: number; img?: string }[];
    topPet?: { name: string; img?: string };
    topItem?: { name: string; img?: string };
  }[];
}

/**
 * Retorna o resumo consolidado de uso de personagens, ativas e loadouts de um time no campeonato
 */
export const getTeamCharacterSummary = (data: DashboardData, teamName: string): TeamCharacterSummary => {
  if (!data.characters || !teamName) {
    return { totalDrops: 0, activeSkills: [], pets: [], items: [], players: [] };
  }

  const teamChars = getTeamCharacters(data, teamName);
  if (teamChars.length === 0) {
    return { totalDrops: 0, activeSkills: [], pets: [], items: [], players: [] };
  }

  const dropSet = new Set<string>();
  teamChars.forEach(c => {
    const rdNum = (c.Rd || c.RD || '').toString().replace(/\D/g, '');
    const qNum = (c.Q || c.S || '').toString().replace(/\D/g, '');
    if (rdNum || qNum) {
      dropSet.add(`${rdNum}-${qNum}`);
    }
  });
  const totalDrops = dropSet.size || 1;

  const hab1Map: Record<string, number> = {};
  const passiveMap: Record<string, number> = {};
  const petMap: Record<string, number> = {};
  const itemMap: Record<string, number> = {};

  const playerMap: Record<string, {
    name: string;
    totalDrops: number;
    hab1: Record<string, number>;
    passives: Record<string, number>;
    pets: Record<string, number>;
    items: Record<string, number>;
  }> = {};

  teamChars.forEach(c => {
    if (c.Hab1) hab1Map[c.Hab1] = (hab1Map[c.Hab1] || 0) + 1;
    if (c.Hab2) passiveMap[c.Hab2] = (passiveMap[c.Hab2] || 0) + 1;
    if (c.Hab3) passiveMap[c.Hab3] = (passiveMap[c.Hab3] || 0) + 1;
    if (c.Hab4) passiveMap[c.Hab4] = (passiveMap[c.Hab4] || 0) + 1;
    if (c.Pet) petMap[c.Pet] = (petMap[c.Pet] || 0) + 1;
    if (c.Item) itemMap[c.Item] = (itemMap[c.Item] || 0) + 1;

    if (c.Player) {
      const pKey = normalize(c.Player);
      if (!playerMap[pKey]) {
        playerMap[pKey] = {
          name: c.Player,
          totalDrops: 0,
          hab1: {},
          passives: {},
          pets: {},
          items: {}
        };
      }
      playerMap[pKey].totalDrops += 1;
      if (c.Hab1) playerMap[pKey].hab1[c.Hab1] = (playerMap[pKey].hab1[c.Hab1] || 0) + 1;
      if (c.Hab2) playerMap[pKey].passives[c.Hab2] = (playerMap[pKey].passives[c.Hab2] || 0) + 1;
      if (c.Hab3) playerMap[pKey].passives[c.Hab3] = (playerMap[pKey].passives[c.Hab3] || 0) + 1;
      if (c.Hab4) playerMap[pKey].passives[c.Hab4] = (playerMap[pKey].passives[c.Hab4] || 0) + 1;
      if (c.Pet) playerMap[pKey].pets[c.Pet] = (playerMap[pKey].pets[c.Pet] || 0) + 1;
      if (c.Item) playerMap[pKey].items[c.Item] = (playerMap[pKey].items[c.Item] || 0) + 1;
    }
  });

  const totalCharsCount = teamChars.length || 1;

  const activeSkills = Object.entries(hab1Map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalCharsCount) * 100),
      img: findDimImg(data.hab1, name)
    }));

  const passives = Object.entries(passiveMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / (totalCharsCount * 3)) * 100),
      img: findDimImg([...(data.hab2 || []), ...(data.hab3 || []), ...(data.hab4 || [])], name)
    }));

  const pets = Object.entries(petMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalCharsCount) * 100),
      img: findDimImg(data.pets, name)
    }));

  const items = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalCharsCount) * 100),
      img: findDimImg(data.items, name)
    }));

  const players = Object.values(playerMap).map(p => {
    const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(p.name));
    const pTotal = p.totalDrops || 1;

    const pActives = Object.entries(p.hab1)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / pTotal) * 100),
        img: findDimImg(data.hab1, name)
      }));

    const pPassives = Object.entries(p.passives)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (pTotal * 3)) * 100),
        img: findDimImg([...(data.hab2 || []), ...(data.hab3 || []), ...(data.hab4 || [])], name)
      }));

    const topPetEntry = Object.entries(p.pets).sort((a, b) => b[1] - a[1])[0];
    const topItemEntry = Object.entries(p.items).sort((a, b) => b[1] - a[1])[0];

    return {
      name: p.name,
      totalDrops: p.totalDrops,
      funcao: dim?.Funcao,
      activeSkills: pActives,
      passives: pPassives,
      topPet: topPetEntry ? { name: topPetEntry[0], img: findDimImg(data.pets, topPetEntry[0]) } : undefined,
      topItem: topItemEntry ? { name: topItemEntry[0], img: findDimImg(data.items, topItemEntry[0]) } : undefined,
    };
  }).sort((a, b) => b.totalDrops - a.totalDrops);

  return {
    totalDrops,
    activeSkills,
    passives,
    pets,
    items,
    players
  };
};

export interface TeamMapPlayerDetail {
  name: string;
  funcao?: string;
  totalDropsOnMap: number;
  activeSkills: { name: string; count: number; pct: number; img?: string }[];
  passives: { name: string; count: number; pct: number; img?: string }[];
  topPet?: { name: string; img?: string };
  topItem?: { name: string; img?: string };
}

export interface TeamMapSummaryDetail {
  mapName: string;
  dropCount: number;
  topActives: { name: string; count: number; pct: number; img?: string }[];
  players: TeamMapPlayerDetail[];
  drops: {
    rd: string;
    q: string;
    mapa: string;
    confronto: string;
    playersLoadout: PlayerLoadoutDetailed[];
  }[];
}

/**
 * Retorna detalhadamente os 4 jogadores e suas quedas em um mapa específico
 */
export const getTeamMapSummaryDetail = (data: DashboardData, teamName: string, mapName: string): TeamMapSummaryDetail => {
  if (!data.characters || !teamName || !mapName) {
    return { mapName, dropCount: 0, topActives: [], players: [], drops: [] };
  }

  const teamChars = getTeamCharacters(data, teamName);
  const normMap = normalize(mapName);

  const mapChars = teamChars.filter(c => {
    if (!c.Mapa) return false;
    const cMap = normalize(c.Mapa);
    return cMap === normMap || cMap.includes(normMap) || normMap.includes(cMap);
  });

  if (mapChars.length === 0) {
    return { mapName, dropCount: 0, topActives: [], players: [], drops: [] };
  }

  // Agrupa quedas únicas (rd - q)
  const dropMap = new Map<string, { rd: string; q: string; mapa: string; confronto: string }>();
  mapChars.forEach(c => {
    const rd = (c.Rd || c.RD || '1').toString().replace(/\D/g, '');
    const q = (c.Q || c.S || '1').toString().replace(/\D/g, '');
    const key = `${rd}-${q}`;
    if (!dropMap.has(key)) {
      dropMap.set(key, {
        rd: c.Rd || c.RD || '1',
        q: c.Q || c.S || '1',
        mapa: c.Mapa || mapName,
        confronto: c.Confronto || 'N/A'
      });
    }
  });

  const drops = Array.from(dropMap.values()).map(d => {
    const playersLoadout = getTeamDropComposition(data, teamName, d.rd, d.q, d.confronto, d.mapa);
    return {
      rd: d.rd,
      q: d.q,
      mapa: d.mapa,
      confronto: d.confronto,
      playersLoadout
    };
  }).sort((a, b) => {
    const rdA = parseInt(a.rd.replace(/\D/g, '')) || 0;
    const rdB = parseInt(b.rd.replace(/\D/g, '')) || 0;
    if (rdA !== rdB) return rdA - rdB;
    const qA = parseInt(a.q.replace(/\D/g, '')) || 0;
    const qB = parseInt(b.q.replace(/\D/g, '')) || 0;
    return qA - qB;
  });

  // Top ativas no mapa
  const hab1Count: Record<string, number> = {};
  mapChars.forEach(c => {
    if (c.Hab1) hab1Count[c.Hab1] = (hab1Count[c.Hab1] || 0) + 1;
  });
  const totalCount = mapChars.length || 1;
  const topActives = Object.entries(hab1Count)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalCount) * 100),
      img: findDimImg(data.hab1, name)
    }));

  // Jogadores e suas habilidades mais usadas no mapa
  const playerStats: Record<string, {
    name: string;
    drops: number;
    hab1: Record<string, number>;
    passives: Record<string, number>;
    pet: Record<string, number>;
    item: Record<string, number>;
  }> = {};

  mapChars.forEach(c => {
    if (!c.Player) return;
    const pKey = normalize(c.Player);
    if (!playerStats[pKey]) {
      playerStats[pKey] = {
        name: c.Player,
        drops: 0,
        hab1: {},
        passives: {},
        pet: {},
        item: {}
      };
    }
    playerStats[pKey].drops += 1;
    if (c.Hab1) playerStats[pKey].hab1[c.Hab1] = (playerStats[pKey].hab1[c.Hab1] || 0) + 1;
    if (c.Hab2) playerStats[pKey].passives[c.Hab2] = (playerStats[pKey].passives[c.Hab2] || 0) + 1;
    if (c.Hab3) playerStats[pKey].passives[c.Hab3] = (playerStats[pKey].passives[c.Hab3] || 0) + 1;
    if (c.Hab4) playerStats[pKey].passives[c.Hab4] = (playerStats[pKey].passives[c.Hab4] || 0) + 1;
    if (c.Pet) playerStats[pKey].pet[c.Pet] = (playerStats[pKey].pet[c.Pet] || 0) + 1;
    if (c.Item) playerStats[pKey].item[c.Item] = (playerStats[pKey].item[c.Item] || 0) + 1;
  });

  const players: TeamMapPlayerDetail[] = Object.values(playerStats).map(p => {
    const dim = data.playersDimension.find((d: any) => normalize(d.Name) === normalize(p.name));
    const pTotal = p.drops || 1;
    
    const pActives = Object.entries(p.hab1)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / pTotal) * 100),
        img: findDimImg(data.hab1, name)
      }));

    const pPassives = Object.entries(p.passives)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.round((count / (pTotal * 3)) * 100),
        img: findDimImg([...(data.hab2 || []), ...(data.hab3 || []), ...(data.hab4 || [])], name)
      }));

    const topPetEntry = Object.entries(p.pet).sort((a, b) => b[1] - a[1])[0];
    const topItemEntry = Object.entries(p.item).sort((a, b) => b[1] - a[1])[0];

    return {
      name: p.name,
      funcao: dim?.Funcao,
      totalDropsOnMap: p.drops,
      activeSkills: pActives,
      passives: pPassives,
      topPet: topPetEntry ? { name: topPetEntry[0], img: findDimImg(data.pets, topPetEntry[0]) } : undefined,
      topItem: topItemEntry ? { name: topItemEntry[0], img: findDimImg(data.items, topItemEntry[0]) } : undefined
    };
  }).sort((a, b) => b.totalDropsOnMap - a.totalDropsOnMap);

  return {
    mapName,
    dropCount: drops.length,
    topActives,
    players,
    drops
  };
};
