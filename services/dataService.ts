
import { CSV_URLS, DEFAULT_CONFIG } from '../constants';
import { parseCSV } from '../utils/csvParser';
import { DashboardData, PlayerData, KillFeed, MatchDetails, CharacterData, TeamStats, TeamReference, WeaponData, SafeData, GenericDimData, AppConfig } from '../types';
import { findTeamLogo } from '../utils/teamUtils';

export const getActiveUrls = () => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_URLS');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.fDetalhes || parsed.fDetalhes.includes('1aG4Gl14KUL93l_ovqhA_4Dx4P-BBG-eewcy1OAJ_L4M')) {
        parsed.fDetalhes = CSV_URLS.fDetalhes;
        localStorage.setItem('MUNDIAL_DASHBOARD_URLS', JSON.stringify(parsed));
      }
      return { ...CSV_URLS, ...parsed };
    }
  } catch (e) {
    console.error("Error reading custom URLs", e);
  }
  return CSV_URLS;
};

export const getAppConfig = (): AppConfig => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.titlePart1 === 'FFWSBR' && parsed.titlePart2 === '2026') {
        parsed.titlePart1 = 'FFWSBR 2026';
        parsed.titlePart2 = 'SPLIT 2';
        localStorage.setItem('MUNDIAL_DASHBOARD_CONFIG', JSON.stringify(parsed));
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Error reading app config", e);
  }
  return DEFAULT_CONFIG;
};

const cleanKey = (s: string) => 
  s.toString()
   .toLowerCase()
   .normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "") 
   .replace(/[^a-z0-9]/g, "")
   .trim();

const uncorruptKey = (key: string): string => {
  let cleaned = cleanKey(key);
  return cleaned
    .replace(/teamsolid/g, 'ts')
    .replace(/solid/g, 'ts')
    .replace(/fluxow7m/g, 'fx')
    .replace(/fluxo/g, 'fx')
    .replace(/w7m/g, 'fx');
};

const parseNumber = (val: string | number | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  
  let str = val.toString().trim();
  if (!str) return 0;
  
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(str)) {
      str = str.replace(/[.,]/g, '');
  } else {
      str = str.replace(',', '.');
  }

  if (/^-?\d+$/.test(str)) return parseInt(str, 10);
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
};

const getVal = (row: any, aliases: string[]) => {
  if (!row) return '';
  const keys = Object.keys(row);
  
  // 1. Direct cleanKey match
  for (const alias of aliases) {
    const target = cleanKey(alias);
    const foundKey = keys.find(k => cleanKey(k) === target);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
      return row[foundKey].toString().trim();
    }
  }

  // 2. Uncorrupted key match
  for (const alias of aliases) {
    const target = cleanKey(alias);
    const foundKey = keys.find(k => uncorruptKey(k) === target);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
      return row[foundKey].toString().trim();
    }
  }

  // 3. Partial or substring match
  for (const alias of aliases) {
    const target = cleanKey(alias);
    if (target.length < 3) continue;
    const foundKey = keys.find(k => {
      const ck = uncorruptKey(k);
      return ck.includes(target) || target.includes(ck);
    });
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '') {
      return row[foundKey].toString().trim();
    }
  }

  return '';
};

const normalizeDim = (data: any[], keyName: string): GenericDimData[] => {
  return data.map(row => {
    let name = getVal(row, [keyName, keyName.replace(/(\d)/, ' $1'), 'Nome', 'Name', 'NOME', 'PERSONAGEM', 'PLAYER', 'JOGADOR', 'PET', 'ITEM', 'HABILIDADE']);
    let img = getVal(row, ['IMG', 'Img', 'img', 'Imagem', 'URL', 'Url', 'Link', 'IMAGEM', 'FOTO', 'FOTO PLAYER']);
    let funcao = getVal(row, ['FUNÇÃO', 'FUNCAO', 'Função', 'Funcao', 'ROLE', 'Role']);
    let funcao2 = getVal(row, ['FUNÇÃO 2', 'FUNCAO 2', 'Função 2', 'Funcao 2', 'ROLE 2', 'Role 2']);
    return { Name: name || '', IMG: img || '', Funcao: funcao, Funcao2: funcao2 };
  }).filter(r => r.Name && r.Name.trim() !== '');
};

const safeFetch = async (url: string): Promise<string> => {
  if (!url || typeof url !== 'string') return "";

  // Helper to validate if returned text looks like valid CSV rather than HTML error page
  const isValidCsv = (text: string): boolean => {
    if (!text || !text.trim()) return false;
    const trimmed = text.trim();
    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<HTML') ||
      trimmed.includes('Google Drive - Error') ||
      trimmed.includes('Service Login')
    ) {
      return false;
    }
    return true;
  };

  // Generate candidate URLs to try
  const urlsToTry: string[] = [url];

  // If it's a Google Sheets export URL, add gviz endpoint alternative
  if (url.includes('/export?format=csv')) {
    urlsToTry.push(url.replace('/export?format=csv', '/gviz/tq?tqx=out:csv'));
  } else if (url.includes('/pub?') && !url.includes('/gviz/tq')) {
    // If it's a published sheet URL, can also try converting to gviz if pub fails
    urlsToTry.push(url.replace('/pub?', '/gviz/tq?tqx=out:csv&'));
  }

  for (const targetUrl of urlsToTry) {
    // Strategy 1: Direct fetch with follow redirect
    try {
      const res = await fetch(targetUrl, { redirect: 'follow' });
      if (res.ok) {
        const text = await res.text();
        if (isValidCsv(text)) return text;
      }
    } catch (e) {
      // Direct fetch failed (e.g. CORS)
    }

    // Strategy 2: AllOrigins proxy
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (isValidCsv(text)) return text;
      }
    } catch (e) {
      // Proxy failed
    }

    // Strategy 3: CorsProxy.io
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (isValidCsv(text)) return text;
      }
    } catch (e) {
      // Proxy failed
    }
  }

  console.warn(`Aviso: Não foi possível carregar os dados da URL (${url}). Usando dados padrão.`);
  return "";
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const activeUrls = getActiveUrls();
    const urls = [
      activeUrls.fPlayersDados, activeUrls.fKillFeed, activeUrls.fDetalhes, activeUrls.fPersonagens,
      activeUrls.dTime, activeUrls.dPlayer, activeUrls.dArma, activeUrls.dSafe, activeUrls.dHab1, 
      activeUrls.dHab2, activeUrls.dHab3, activeUrls.dHab4, activeUrls.dPets, activeUrls.dItem,
      activeUrls.dVitima, activeUrls.dConfronto
    ];

    const responses = await Promise.all(urls.map(url => safeFetch(url)));
    
    // Parse players (Fonte Fato: fPlayersDados)
    const players: PlayerData[] = parseCSV<any>(responses[0]).map(row => ({
        PLAYER: getVal(row, ['PLAYER', 'Player', 'Jogador', 'JOGADOR', 'NOME', 'COMPETIDOR']),
        TIME: getVal(row, ['TIME', 'Time', 'Equipe', 'EQUIPE', 'TAG', 'NOME DO TIME', 'TEAM']),
        S: getVal(row, ['S', 'Partida', 'Quedas', 'Q', 'QUEDAS']),
        CONFRONTO: getVal(row, ['CONFRONTO', 'Confronto', 'CF', 'CONFRONTO ', 'CONFRONTO_', 'CONFRONTOS', 'Confrontos', 'NOME', 'NAME']),
        Abates: getVal(row, ['ABATES', 'Abates', 'Kills', 'KILLS', 'ABTS', 'KILL']) || '0',
        Dano: getVal(row, ['DANO', 'Damage', 'DMG']),
        HS: getVal(row, ['HS', 'Headshot', 'HEADSHOTS', 'CAPA']),
        Deitados: getVal(row, ['DEITADOS', 'Knockdowns', 'KNOCKS', 'DEITOU']),
        Assistencias: getVal(row, ['ASSISTENCIAS', 'Assists', 'ASSIST']),
        Gelos: getVal(row, ['GELOS', 'Walls', 'GELO']),
        GelosDestruidos: getVal(row, ['GELOS DESTRUIDOS', 'Walls Destroyed', 'GELO DESTRUIDO']),
        Reviveu: getVal(row, ['REVIVEU', 'Revived']),
        AliadosRevividos: getVal(row, ['ALIADOS REVIVIDOS', 'Allies Revived']),
        MVP: getVal(row, ['MVP', 'Mvp', 'M.V.P']),
        MAPA: getVal(row, ['MAPA', 'Mapa', 'Map']),
        RD: getVal(row, ['RD', 'Rd', 'Rodada', 'Round']),
        Q: getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA']) || getVal(row, ['S', 'Partida'])
    })).filter(p => p.PLAYER);

    // Parse KillFeed (Fonte Fato)
    const killFeed: KillFeed[] = parseCSV<any>(responses[1]).map(row => ({
        PLAYER: getVal(row, ['PLAYER', 'Player', 'Killer', 'Matador']),
        VITIMA: getVal(row, ['VITIMA', 'Vitima', 'Victim', 'QUEM MORREU']),
        ARMA: getVal(row, ['ARMA', 'Arma', 'Weapon']),
        CONFRONTO: getVal(row, ['CONFRONTO', 'Confronto', 'CF', 'CONFRONTO ', 'CONFRONTO_', 'CONFRONTOS', 'Confrontos', 'NOME', 'NAME']),
        MAPA: getVal(row, ['MAPA', 'Mapa', 'Map']),
        RD: getVal(row, ['RD', 'Rd', 'Rodada']),
        Q: getVal(row, ['Q', 'QUEDA', 'Queda']),
        SAFE: getVal(row, ['SAFE', 'Safe'])
    })).filter(k => k.PLAYER);

    // Parse Detalhes (Fonte Fato)
    const details: MatchDetails[] = parseCSV<any>(responses[2]).map(row => {
        const timeVal = getVal(row, ['TIME', 'Time', 'Equipe', 'EQUIPE', 'TAG', 'NOME DO TIME', 'TEAM', 'TIMES', 'EQUIPES', 'NOME', 'NAME', 'CLUBE', 'CLUB']);
        const ptsVal = getVal(row, ['PTS', 'PONTOS', 'PONTOS TOTAL', 'PTS TOTAL', 'TOTAL PTS', 'TOTAL PONTOS', 'TOTAL', 'PT', 'PTS_TOTAL', 'PONTOS_TOTAL', 'PONTUAÇÃO', 'PONTUACAO']);
        const ptscVal = getVal(row, ['PTSC', 'PTS/C', 'PTS C', 'COLOCACAO', 'PONTOS COLOCACAO', 'PONTOS DE COLOCACAO', 'PTS COLOCACAO', 'PTSC.', 'PTS_COLOCACAO', 'COLOCAÇÃO', 'PONTOS COLOCAÇÃO', 'PONTOS DE COLOCAÇÃO', 'PTS COLOCAÇÃO', 'PTS_COLOCAÇÃO', 'PTS_POS', 'PONTOS POSICAO', 'PONTOS POSIÇÃO']);
        const posVal = getVal(row, ['POS', 'POSICAO', 'POSIÇÃO', 'COLOCACAO', 'COLOCAÇÃO', 'RANK', 'LUGAR', 'COLOC', 'COL']);
        const abtsVal = getVal(row, ['ABTS', 'ABATES', 'KILLS', 'ABT', 'KILL', 'ABATE', 'PONTOS ABATES', 'PTS ABATES', 'PTS ABT', 'PONTOS DE ABATES']);
        const bVal = getVal(row, ['B', 'BOOYAH', 'BOOYAHS', 'VITORIA', 'VITÓRIA', 'BOOYA', 'V', 'BY']);
        const sVal = getVal(row, ['S', 'PARTIDA', 'PARTIDAS', 'QUEDAS', 'QUEDA', 'JOGOS', 'QTD', 'S_']);
        const qVal = getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA', 'FALL', 'ROUND']);
        const mapaVal = getVal(row, ['MAPA', 'Mapa', 'Map', 'MAP']);
        const rdVal = getVal(row, ['RD', 'Rd', 'Rodada', 'RODADA', 'ROUND', 'ROD']);
        const confrontoVal = getVal(row, ['CONFRONTO', 'Confronto', 'CF', 'CONFRONTO ', 'CONFRONTO_', 'CONFRONTOS', 'Confrontos', 'NOME', 'NAME', 'FASE', 'PHASE']);
        const ondeFechouVal = getVal(row, ['ONDE FECHOU', 'Onde Fechou', 'ONDEFECHOU', 'LOCAL FECHAMENTO', 'SAFE FECHOU', 'FECHAMENTO']);

        return {
            TIME: timeVal,
            MAPA: mapaVal,
            RD: rdVal,
            CONFRONTO: confrontoVal,
            PTS: ptsVal || '0',
            PTSC: ptscVal || '0',
            POS: posVal || '0',
            ABTS: abtsVal || '0',
            B: bVal || '0',
            S: sVal || '1',
            Q: qVal || '1',
            ONDE_FECHOU: ondeFechouVal
        };
    }).filter(d => d.TIME);
    
    // Parse Loadouts (Fonte Fato)
    const characters: CharacterData[] = parseCSV<any>(responses[3]).map(row => ({
        Player: getVal(row, ['Player', 'Jogador', 'PLAYER', 'NOME']),
        Time: getVal(row, ['Time', 'Equipe', 'TIME', 'TAG', 'NOME DO TIME', 'TEAM']),
        Hab1: getVal(row, ['Hab1', 'Hab 1', 'Ativa']),
        Hab2: getVal(row, ['Hab2', 'Hab 2', 'Passiva 1']),
        Hab3: getVal(row, ['Hab3', 'Hab 3', 'Passiva 2']),
        Hab4: getVal(row, ['Hab4', 'Hab 4', 'Passiva 3']),
        Pet: getVal(row, ['Pet', 'PET']),
        Item: getVal(row, ['Item', 'ITEM']),
        Rd: getVal(row, ['Rd', 'RD', 'Rodada']),
        Confronto: getVal(row, ['Confronto', 'CONFRONTO', 'CF', 'CONFRONTO ', 'CONFRONTO_', 'CONFRONTOS', 'Confrontos', 'NOME', 'NAME']),
        Mapa: getVal(row, ['Mapa', 'MAPA', 'Map']),
        S: getVal(row, ['S', 'Partida', 'Quedas', 'Q', 'QUEDA']),
        Q: getVal(row, ['Q', 'QUEDA', 'Queda', 'PARTIDA']) || getVal(row, ['S', 'Partida'])
    })).filter(c => c.Player);

    return {
      players, killFeed, details, characters,
      teamsReference: parseCSV<any>(responses[4]).map(row => ({
        TIME: getVal(row, ['TIME', 'Time', 'Equipe', 'EQUIPE', 'TAG', 'NOME', 'NAME', 'NOME DO TIME', 'TEAM']),
        IMG: getVal(row, ['IMG', 'Img', 'Imagem', 'URL', 'LOGO', 'ESCUDO']),
        GRUPO: getVal(row, ['GRUPO', 'Grupo', 'Group', 'GROUP', 'G'])
      })),
      playersDimension: normalizeDim(parseCSV<any>(responses[5]), 'Player'),
      weapons: parseCSV<any>(responses[6]).map(r => ({ Arma: getVal(r, ['Arma', 'ARMA']), IMG: getVal(r, ['IMG', 'Img']) })),
      safes: parseCSV<any>(responses[7]).map(r => ({ Safe: getVal(r, ['Safe', 'SAFE']), IMG: getVal(r, ['IMG', 'Img']) })),
      hab1: normalizeDim(parseCSV<any>(responses[8]), 'Hab1'),
      hab2: normalizeDim(parseCSV<any>(responses[9]), 'Hab2'),
      hab3: normalizeDim(parseCSV<any>(responses[10]), 'Hab3'),
      hab4: normalizeDim(parseCSV<any>(responses[11]), 'Hab4'),
      pets: normalizeDim(parseCSV<any>(responses[12]), 'Pet'),
      items: normalizeDim(parseCSV<any>(responses[13]), 'Item'),
      victimsDimension: normalizeDim(parseCSV<any>(responses[14]), 'Vitima'),
      confrontationsDimension: parseCSV<any>(responses[15]).map(row => ({
        CONFRONTO: getVal(row, ['CONFRONTO', 'Confronto', 'CF', 'NOME', 'NAME', 'CONFRONTOS', 'Confrontos']),
        IMG: getVal(row, ['IMG', 'Img', 'Imagem', 'URL'])
      })).filter(c => c.CONFRONTO),
      loading: false, lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Erro crítico ao buscar dados:", error);
    return { players: [], killFeed: [], details: [], characters: [], teamsReference: [], playersDimension: [], victimsDimension: [], weapons: [], safes: [], hab1: [], hab2: [], hab3: [], hab4: [], pets: [], items: [], confrontationsDimension: [], loading: false, lastUpdated: null };
  }
};

const POSITION_POINTS: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1
};

const getCanonicalTeamName = (teamName: string, teamsRef: TeamReference[]): string => {
  if (!teamName || !teamName.trim()) return '';
  const clean = teamName.trim().toLowerCase();
  const ref = teamsRef.find(t => t.TIME && t.TIME.trim().toLowerCase() === clean);
  return ref && ref.TIME ? ref.TIME.trim() : teamName.trim();
};

export const calculateTeamStats = (data: DashboardData): TeamStats[] => {
  const teamMap = new Map<string, TeamStats>();
  const lastMatchTracker = new Map<string, { rd: number, q: number, pos: number }>();
  const teamImages = new Map<string, string>();
  const teamGroups = new Map<string, string>();
  
  data.teamsReference.forEach(t => { 
    if (t.TIME && t.IMG) teamImages.set(t.TIME.trim(), t.IMG); 
    if (t.TIME && t.GRUPO) teamGroups.set(t.TIME.trim(), t.GRUPO);
  });

  const getGrupo = (teamName: string) => {
    if (teamGroups.has(teamName)) return teamGroups.get(teamName);
    const ref = data.teamsReference.find(t => t.TIME && t.TIME.toLowerCase().trim() === teamName.toLowerCase().trim());
    return ref ? ref.GRUPO : undefined;
  };

  // 1. Process from data.details if present
  if (data.details && data.details.length > 0) {
    data.details.forEach(row => {
      const rawTeamName = row.TIME;
      if (!rawTeamName) return;

      const teamName = getCanonicalTeamName(rawTeamName, data.teamsReference);
      if (!teamName) return;
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, { 
          name: teamName, 
          image: findTeamLogo(teamName, data.teamsReference), 
          grupo: getGrupo(teamName),
          s: 0, b: 0, ptsc: 0, abts: 0, pts: 0, 
          avgAbts: 0, avgPts: 0, avgPtsc: 0, 
          percentPos: 0, percentAbts: 0, 
          lastPos: 99
        });
      }
      
      const stats = teamMap.get(teamName)!;
      let rowPts = parseNumber(row.PTS);
      let rowPtsc = parseNumber(row.PTSC);
      let rowAbts = parseNumber(row.ABTS);
      let rowB = parseNumber(row.B);
      let rowPos = parseNumber(row.POS);
      let rowS = parseNumber(row.S);

      // Skip empty placeholder rows from spreadsheet
      if (rowS === 0 && rowPts === 0 && rowPtsc === 0 && rowAbts === 0 && rowPos === 0 && rowB === 0) {
        return;
      }

      if (rowS === 0) rowS = 1;

      // Derived Booyah
      if (rowB === 0 && rowPos === 1) {
        rowB = 1;
      }

      // Derived PTSC from Position
      if (rowPtsc === 0 && rowPos >= 1 && rowPos <= 10) {
        rowPtsc = POSITION_POINTS[rowPos] || 0;
      }

      // Derived PTS / PTSC / ABTS
      if (rowPts > 0) {
        if (rowPtsc === 0 && rowAbts > 0 && rowPts >= rowAbts) {
          rowPtsc = rowPts - rowAbts;
        }
        if (rowAbts === 0 && rowPtsc > 0 && rowPts >= rowPtsc) {
          rowAbts = rowPts - rowPtsc;
        }
      } else {
        rowPts = rowPtsc + rowAbts;
      }

      stats.pts += rowPts;
      stats.ptsc += rowPtsc;
      stats.abts += rowAbts;
      stats.b += rowB;
      stats.s += rowS;

      // Lógica para rastrear a posição na última queda real
      const currentRD = parseNumber(row.RD);
      const currentQ = parseNumber(row.Q);
      const currentPos = rowPos || 99;

      const last = lastMatchTracker.get(teamName);
      if (!last || (currentRD > last.rd) || (currentRD === last.rd && currentQ > last.q)) {
          lastMatchTracker.set(teamName, { rd: currentRD, q: currentQ, pos: currentPos });
          stats.lastPos = currentPos;
      }
    });
  }

  // 2. Fallback to data.players if details produced no team stats
  if (teamMap.size === 0 && data.players && data.players.length > 0) {
    data.players.forEach(p => {
      const rawTeamName = p.TIME;
      if (!rawTeamName) return;

      const teamName = getCanonicalTeamName(rawTeamName, data.teamsReference);
      if (!teamName) return;

      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          name: teamName,
          image: findTeamLogo(teamName, data.teamsReference),
          grupo: getGrupo(teamName),
          s: 0, b: 0, ptsc: 0, abts: 0, pts: 0,
          avgAbts: 0, avgPts: 0, avgPtsc: 0,
          percentPos: 0, percentAbts: 0,
          lastPos: 99
        });
      }

      const stats = teamMap.get(teamName)!;
      const kills = parseNumber(p.Abates);
      stats.abts += kills;
      stats.pts += kills; // 1 kill = 1 pt in Free Fire
    });
  }

  // 3. Ensure all reference teams are present in the map
  data.teamsReference.forEach(t => {
    if (t.TIME) {
      const canonicalName = getCanonicalTeamName(t.TIME, data.teamsReference);
      if (canonicalName && !teamMap.has(canonicalName)) {
        teamMap.set(canonicalName, {
          name: canonicalName,
          image: findTeamLogo(canonicalName, data.teamsReference),
          grupo: t.GRUPO,
          s: 0, b: 0, ptsc: 0, abts: 0, pts: 0,
          avgAbts: 0, avgPts: 0, avgPtsc: 0,
          percentPos: 0, percentAbts: 0,
          lastPos: 99
        });
      }
    }
  });

  return Array.from(teamMap.values())
    .filter(stats => stats.s > 0 || stats.pts > 0 || stats.abts > 0)
    .map(stats => {
      if (stats.s > 0) {
        stats.avgAbts = parseFloat((stats.abts / stats.s).toFixed(2));
        stats.avgPts = parseFloat((stats.pts / stats.s).toFixed(2));
        stats.avgPtsc = parseFloat((stats.ptsc / stats.s).toFixed(2));
      }
      if (stats.pts > 0) {
        stats.percentPos = parseFloat(((stats.ptsc / stats.pts) * 100).toFixed(1));
        stats.percentAbts = parseFloat(((stats.abts / stats.pts) * 100).toFixed(1));
      }
      return stats;
    }).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.b !== a.b) return b.b - a.b;
      if (b.abts !== a.abts) return b.abts - a.abts;
      return a.lastPos - b.lastPos;
    });
};
