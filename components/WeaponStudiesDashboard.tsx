import React, { useState, useMemo } from 'react';
import { 
  Swords, Crosshair, Search, Filter, Shield, Trophy, Flame, 
  Target, BarChart2, TrendingUp, Layers, User, X, 
  ChevronRight, ArrowUpDown, Sparkles, AlertCircle, Info,
  Percent, Zap, Skull, Award, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { 
  getWeaponInfo, 
  getCategoryConfig, 
  MASTER_WEAPONS, 
  WEAPON_CATEGORY_CONFIG,
  WeaponCategoryConfig,
  EXCLUDED_WEAPON_NAMES,
  WEAPON_IMAGE_OVERRIDES
} from '../utils/weaponUtils';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

interface WeaponStudiesDashboardProps {
  data?: DashboardData;
}

export interface WeaponDetailedStat {
  name: string;
  tipo: string;
  img?: string;
  config: WeaponCategoryConfig;
  totalKills: number;
  shareOfMeta: number;
  shareOfCategory: number;
  rankOverall: number;
  rankInCategory: number;
  earlyKills: number;
  midKills: number;
  lateKills: number;
  earlyPct: number;
  midPct: number;
  latePct: number;
  dominantPhase: 'EARLY' | 'MID' | 'LATE';
  topPlayers: Array<{ name: string; count: number; team?: string; img?: string }>;
  topTeams: Array<{ name: string; count: number; logo?: string }>;
  victimPlayers: Array<{ name: string; count: number; team?: string }>;
  victimTeams: Array<{ name: string; count: number }>;
  killsByMap: Record<string, number>;
  killsByRound: Record<string, number>;
  killsBySafe: Record<string, number>;
}

export interface CategorySummary {
  category: string;
  label: string;
  config: WeaponCategoryConfig;
  totalKills: number;
  shareOfMeta: number;
  totalWeaponsInCatalog: number;
  activeWeaponsCount: number;
  topWeapon?: { name: string; kills: number; img?: string };
  earlyKills: number;
  midKills: number;
  lateKills: number;
  weapons: WeaponDetailedStat[];
}

const getGamePhase = (safeStr: string | undefined): 'EARLY' | 'MID' | 'LATE' => {
  if (!safeStr || safeStr.trim() === '') return 'MID';
  const clean = safeStr.trim().toUpperCase();
  const num = parseInt(clean.replace(/\D/g, ''));
  if (num === 1 || num === 2 || clean.includes('SAFE 1') || clean.includes('SAFE 2') || clean === 'S1' || clean === 'S2') return 'EARLY';
  if (num === 3 || num === 4 || clean.includes('SAFE 3') || clean.includes('SAFE 4') || clean === 'S3' || clean === 'S4') return 'MID';
  if (num >= 5 || clean.includes('SAFE 5') || clean.includes('SAFE 6') || clean.includes('SAFE 7') || clean.includes('SAFE 8') || clean === 'S5' || clean === 'S6' || clean === 'S7') return 'LATE';
  return 'MID';
};

const normalizeName = (name: string): string =>
  name ? name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

export const WeaponStudiesDashboard: React.FC<WeaponStudiesDashboardProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'kills-desc' | 'kills-asc' | 'alpha-asc' | 'late-desc' | 'early-desc'>('kills-desc');
  const [onlyActiveWeapons, setOnlyActiveWeapons] = useState<boolean>(false);
  const [selectedWeaponModal, setSelectedWeaponModal] = useState<WeaponDetailedStat | null>(null);
  const [viewTab, setViewTab] = useState<'gallery' | 'categories' | 'leaders'>('gallery');
  const [recentRoundsFilter, setRecentRoundsFilter] = useState<'last-3' | 'last-1' | 'last-5' | 'all' | string>('last-3');
  const [showRecentChartSection, setShowRecentChartSection] = useState<boolean>(true);

  // Rodadas disponíveis no KillFeed
  const availableRounds = useMemo(() => {
    const roundsSet = new Set<string>();
    (data?.killFeed || []).forEach(k => {
      const rd = (k.RD || '').trim();
      if (rd) roundsSet.add(rd);
    });
    return Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [data?.killFeed]);

  // Mapa de Jogador -> Time
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.players && Array.isArray(data.players)) {
      data.players.forEach(p => {
        const pName = (p.Jogador || (p as any).PLAYER || (p as any).Nome || '').trim();
        const tName = (p.TIME || (p as any).Time || '').trim();
        if (pName && tName) {
          map.set(normalizeName(pName), tName);
        }
      });
    }
    return map;
  }, [data?.players]);

  // Processamento Principal de Estatísticas das Armas
  const { weaponStatsList, categorySummaries, globalStats } = useMemo(() => {
    const killFeed = data?.killFeed || [];
    const totalKillsCount = killFeed.length;

    // Contadores brutos por arma
    interface RawWeaponAgg {
      name: string;
      kills: number;
      earlyKills: number;
      midKills: number;
      lateKills: number;
      playerKills: Map<string, number>;
      teamKills: Map<string, number>;
      victimPlayers: Map<string, number>;
      victimTeams: Map<string, number>;
      mapKills: Map<string, number>;
      roundKills: Map<string, number>;
      safeKills: Map<string, number>;
    }

    const weaponAggMap = new Map<string, RawWeaponAgg>();

    const getOrCreateAgg = (rawName: string): RawWeaponAgg => {
      const cleanKey = normalizeName(rawName);
      if (!weaponAggMap.has(cleanKey)) {
        weaponAggMap.set(cleanKey, {
          name: rawName.trim(),
          kills: 0,
          earlyKills: 0,
          midKills: 0,
          lateKills: 0,
          playerKills: new Map(),
          teamKills: new Map(),
          victimPlayers: new Map(),
          victimTeams: new Map(),
          mapKills: new Map(),
          roundKills: new Map(),
          safeKills: new Map()
        });
      }
      return weaponAggMap.get(cleanKey)!;
    };

    // Percorrer KillFeed e agregar
    killFeed.forEach(k => {
      const weaponRaw = (k.ARMA || '').trim();
      if (!weaponRaw) return;
      const cleanKey = normalizeName(weaponRaw);
      if (EXCLUDED_WEAPON_NAMES.has(cleanKey)) return;

      const agg = getOrCreateAgg(weaponRaw);
      agg.kills += 1;

      // Fase do Jogo
      const phase = getGamePhase(k.SAFE);
      if (phase === 'EARLY') agg.earlyKills += 1;
      else if (phase === 'MID') agg.midKills += 1;
      else if (phase === 'LATE') agg.lateKills += 1;

      // Jogador Assassino
      const killerName = (k.PLAYER || '').trim();
      if (killerName) {
        agg.playerKills.set(killerName, (agg.playerKills.get(killerName) || 0) + 1);

        // Time do Assassino
        const killerTeam = playerToTeamMap.get(normalizeName(killerName)) || (k as any).TIME || '';
        if (killerTeam) {
          agg.teamKills.set(killerTeam, (agg.teamKills.get(killerTeam) || 0) + 1);
        }
      }

      // Vítima
      const victimName = (k.VITIMA || '').trim();
      if (victimName) {
        agg.victimPlayers.set(victimName, (agg.victimPlayers.get(victimName) || 0) + 1);
        const victimTeam = playerToTeamMap.get(normalizeName(victimName)) || (k as any).TIME_VITIMA || '';
        if (victimTeam) {
          agg.victimTeams.set(victimTeam, (agg.victimTeams.get(victimTeam) || 0) + 1);
        }
      }

      // Mapa
      const mapName = (k.MAPA || 'Outro').trim();
      agg.mapKills.set(mapName, (agg.mapKills.get(mapName) || 0) + 1);

      // Rodada
      const roundName = k.RD ? `RD ${k.RD}` : 'Geral';
      agg.roundKills.set(roundName, (agg.roundKills.get(roundName) || 0) + 1);

      // Safe
      const safeName = (k.SAFE || 'S1').trim().toUpperCase();
      agg.safeKills.set(safeName, (agg.safeKills.get(safeName) || 0) + 1);
    });

    // Unir catálogo mestre com o feed de dados para cobrir o arsenal oficial
    const allKnownWeaponsMap = new Map<string, { name: string; tipo: string; img?: string }>();

    // 1. Armas da dimensão do DashboardData (excluindo Orion, Homero, A124, Águia)
    if (data?.weapons && Array.isArray(data.weapons)) {
      data.weapons.forEach(w => {
        if (w.Arma) {
          const key = normalizeName(w.Arma);
          if (EXCLUDED_WEAPON_NAMES.has(key)) return;
          const overrideImg = WEAPON_IMAGE_OVERRIDES[key];
          allKnownWeaponsMap.set(key, {
            name: w.Arma,
            tipo: w.TipoArm || w.tipo || w.categoria || 'OUTROS',
            img: overrideImg || w.IMG || undefined
          });
        }
      });
    }

    // 2. Armas do Master Catalog (garantia de todas as armas oficiais válidas)
    MASTER_WEAPONS.forEach(mw => {
      const key = normalizeName(mw.Arma);
      if (EXCLUDED_WEAPON_NAMES.has(key)) return;
      const overrideImg = WEAPON_IMAGE_OVERRIDES[key];
      if (!allKnownWeaponsMap.has(key)) {
        allKnownWeaponsMap.set(key, {
          name: mw.Arma,
          tipo: mw.TipoArm,
          img: overrideImg || mw.IMG
        });
      }
    });

    // 3. Quaisquer armas que apareceram no killFeed e ainda não estejam no mapa
    weaponAggMap.forEach((_, key) => {
      if (EXCLUDED_WEAPON_NAMES.has(key)) return;
      if (!allKnownWeaponsMap.has(key)) {
        const info = getWeaponInfo(key, data?.weapons);
        const overrideImg = WEAPON_IMAGE_OVERRIDES[key];
        allKnownWeaponsMap.set(key, {
          name: info.name,
          tipo: info.tipo,
          img: overrideImg || info.img
        });
      }
    });

    // Construção dos Objetos WeaponDetailedStat
    const detailedList: WeaponDetailedStat[] = [];

    allKnownWeaponsMap.forEach((base, key) => {
      if (EXCLUDED_WEAPON_NAMES.has(key)) return;
      const agg = weaponAggMap.get(key);
      const totalK = agg ? agg.kills : 0;
      const earlyK = agg ? agg.earlyKills : 0;
      const midK = agg ? agg.midKills : 0;
      const lateK = agg ? agg.lateKills : 0;

      const earlyP = totalK > 0 ? parseFloat(((earlyK / totalK) * 100).toFixed(1)) : 0;
      const midP = totalK > 0 ? parseFloat(((midK / totalK) * 100).toFixed(1)) : 0;
      const lateP = totalK > 0 ? parseFloat(((lateK / totalK) * 100).toFixed(1)) : 0;

      let dominantPhase: 'EARLY' | 'MID' | 'LATE' = 'MID';
      if (earlyK >= midK && earlyK >= lateK && earlyK > 0) dominantPhase = 'EARLY';
      else if (lateK >= midK && lateK >= earlyK && lateK > 0) dominantPhase = 'LATE';

      // Top Players
      const topPlayers = agg
        ? Array.from(agg.playerKills.entries())
            .map(([pName, count]) => ({
              name: pName,
              count,
              team: playerToTeamMap.get(normalizeName(pName)),
              img: findDimImg(data?.playersDimension, pName)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Top Teams
      const topTeams = agg
        ? Array.from(agg.teamKills.entries())
            .map(([tName, count]) => ({
              name: tName,
              count,
              logo: findTeamLogo(tName, data?.teamsReference)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Victim Players
      const victimPlayers = agg
        ? Array.from(agg.victimPlayers.entries())
            .map(([vName, count]) => ({
              name: vName,
              count,
              team: playerToTeamMap.get(normalizeName(vName))
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Victim Teams
      const victimTeams = agg
        ? Array.from(agg.victimTeams.entries())
            .map(([vtName, count]) => ({ name: vtName, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        : [];

      // Kills por Mapa
      const killsByMap: Record<string, number> = {};
      if (agg) {
        agg.mapKills.forEach((v, m) => { killsByMap[m] = v; });
      }

      // Kills por Rodada
      const killsByRound: Record<string, number> = {};
      if (agg) {
        agg.roundKills.forEach((v, r) => { killsByRound[r] = v; });
      }

      // Kills por Safe
      const killsBySafe: Record<string, number> = {};
      if (agg) {
        agg.safeKills.forEach((v, s) => { killsBySafe[s] = v; });
      }

      const wInfo = getWeaponInfo(base.name, data?.weapons);
      const finalImg = WEAPON_IMAGE_OVERRIDES[normalizeName(base.name)] || base.img || wInfo.img;

      detailedList.push({
        name: base.name,
        tipo: base.tipo || wInfo.tipo,
        img: finalImg,
        config: getCategoryConfig(base.tipo || wInfo.tipo),
        totalKills: totalK,
        shareOfMeta: totalKillsCount > 0 ? parseFloat(((totalK / totalKillsCount) * 100).toFixed(1)) : 0,
        shareOfCategory: 0, // calculado a seguir
        rankOverall: 0, // calculado a seguir
        rankInCategory: 0, // calculado a seguir
        earlyKills: earlyK,
        midKills: midK,
        lateKills: lateK,
        earlyPct: earlyP,
        midPct: midP,
        latePct: lateP,
        dominantPhase,
        topPlayers,
        topTeams,
        victimPlayers,
        victimTeams,
        killsByMap,
        killsByRound,
        killsBySafe
      });
    });

    // Ordenar e atribuir rankOverall
    detailedList.sort((a, b) => b.totalKills - a.totalKills || a.name.localeCompare(b.name));
    detailedList.forEach((item, index) => {
      item.rankOverall = index + 1;
    });

    // Agrupamento por Categoria
    const catMap = new Map<string, WeaponDetailedStat[]>();
    detailedList.forEach(w => {
      const catKey = w.tipo;
      if (!catMap.has(catKey)) catMap.set(catKey, []);
      catMap.get(catKey)!.push(w);
    });

    const categorySummariesList: CategorySummary[] = [];

    catMap.forEach((weaponsInCat, catName) => {
      const totalCatKills = weaponsInCat.reduce((acc, curr) => acc + curr.totalKills, 0);
      const activeCount = weaponsInCat.filter(w => w.totalKills > 0).length;

      // Calcular share dentro da categoria e rank dentro da categoria
      weaponsInCat.sort((a, b) => b.totalKills - a.totalKills || a.name.localeCompare(b.name));
      weaponsInCat.forEach((w, idx) => {
        w.rankInCategory = idx + 1;
        w.shareOfCategory = totalCatKills > 0 ? parseFloat(((w.totalKills / totalCatKills) * 100).toFixed(1)) : 0;
      });

      const topW = weaponsInCat.length > 0 && weaponsInCat[0].totalKills > 0
        ? { name: weaponsInCat[0].name, kills: weaponsInCat[0].totalKills, img: weaponsInCat[0].img }
        : undefined;

      const earlyK = weaponsInCat.reduce((acc, curr) => acc + curr.earlyKills, 0);
      const midK = weaponsInCat.reduce((acc, curr) => acc + curr.midKills, 0);
      const lateK = weaponsInCat.reduce((acc, curr) => acc + curr.lateKills, 0);

      categorySummariesList.push({
        category: catName,
        label: getCategoryConfig(catName).label,
        config: getCategoryConfig(catName),
        totalKills: totalCatKills,
        shareOfMeta: totalKillsCount > 0 ? parseFloat(((totalCatKills / totalKillsCount) * 100).toFixed(1)) : 0,
        totalWeaponsInCatalog: weaponsInCat.length,
        activeWeaponsCount: activeCount,
        topWeapon: topW,
        earlyKills: earlyK,
        midKills: midK,
        lateKills: lateK,
        weapons: weaponsInCat
      });
    });

    // Ordenar categorias pelo total de abates
    categorySummariesList.sort((a, b) => b.totalKills - a.totalKills);

    // Métricas Globais
    const activeWeaponsTotal = detailedList.filter(w => w.totalKills > 0).length;
    const topWeaponGlobal = detailedList.length > 0 && detailedList[0].totalKills > 0 ? detailedList[0] : null;
    const topCategoryGlobal = categorySummariesList.length > 0 ? categorySummariesList[0] : null;

    return {
      weaponStatsList: detailedList,
      categorySummaries: categorySummariesList,
      globalStats: {
        totalKillsCount,
        catalogWeaponsCount: detailedList.length,
        activeWeaponsTotal,
        topWeaponGlobal,
        topCategoryGlobal
      }
    };
  }, [data?.killFeed, data?.weapons, data?.players, data?.playersDimension, data?.teamsReference, playerToTeamMap]);

  // Lista de Categorias Únicas para o Filtro
  const filterCategories = useMemo(() => {
    const list: Array<{ id: string; label: string; count: number; kills: number }> = [
      { 
        id: 'ALL', 
        label: 'Todas', 
        count: weaponStatsList.length, 
        kills: globalStats.totalKillsCount 
      }
    ];

    categorySummaries.forEach(cat => {
      list.push({
        id: cat.category,
        label: cat.category,
        count: cat.totalWeaponsInCatalog,
        kills: cat.totalKills
      });
    });

    return list;
  }, [weaponStatsList.length, globalStats.totalKillsCount, categorySummaries]);

  // Filtragem e Ordenação da Galeria
  const filteredWeapons = useMemo(() => {
    let result = [...weaponStatsList];

    // Filtro por Categoria
    if (selectedCategory !== 'ALL') {
      result = result.filter(w => w.tipo.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Apenas Armas com Abates
    if (onlyActiveWeapons) {
      result = result.filter(w => w.totalKills > 0);
    }

    // Busca Textual
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(w => {
        const nameMatch = w.name.toLowerCase().includes(q);
        const tipoMatch = w.tipo.toLowerCase().includes(q);
        const playerMatch = w.topPlayers.some(p => p.name.toLowerCase().includes(q));
        return nameMatch || tipoMatch || playerMatch;
      });
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'kills-desc') return b.totalKills - a.totalKills || a.name.localeCompare(b.name);
      if (sortBy === 'kills-asc') return a.totalKills - b.totalKills || a.name.localeCompare(b.name);
      if (sortBy === 'alpha-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'late-desc') return b.lateKills - a.lateKills || b.totalKills - a.totalKills;
      if (sortBy === 'early-desc') return b.earlyKills - a.earlyKills || b.totalKills - a.totalKills;
      return 0;
    });

    return result;
  }, [weaponStatsList, selectedCategory, onlyActiveWeapons, searchQuery, sortBy]);

  // Top 10 Armas do Meta para Gráficos
  const top10WeaponsChartData = useMemo(() => {
    return weaponStatsList
      .filter(w => w.totalKills > 0)
      .slice(0, 10)
      .map(w => ({
        name: w.name,
        kills: w.totalKills,
        color: w.config.color,
        category: w.tipo,
        early: w.earlyKills,
        mid: w.midKills,
        late: w.lateKills
      }));
  }, [weaponStatsList]);

  // Dados do Gráfico de Categorias
  const categoriesChartData = useMemo(() => {
    return categorySummaries
      .filter(c => c.totalKills > 0)
      .map(c => ({
        name: c.category,
        kills: c.totalKills,
        share: c.shareOfMeta,
        color: c.config.color
      }));
  }, [categorySummaries]);

  // Estatísticas de Categorias e Arma Mais Popular das Últimas Rodadas
  const recentRoundsStats = useMemo(() => {
    const killFeed = data?.killFeed || [];
    if (killFeed.length === 0) {
      return {
        selectedRoundsLabel: 'Nenhuma rodada',
        targetRounds: [] as string[],
        categoriesData: [] as Array<{
          name: string;
          label: string;
          kills: number;
          share: number;
          color: string;
          bg: string;
          border: string;
          text: string;
        }>,
        topWeapon: null,
        totalRecentKills: 0,
        activeWeaponsInRecent: 0
      };
    }

    let targetRounds: string[] = [];
    let label = '';
    if (recentRoundsFilter === 'last-1') {
      targetRounds = availableRounds.slice(-1);
      label = targetRounds.length > 0 ? `Última Rodada (RD ${targetRounds[0]})` : 'Última Rodada';
    } else if (recentRoundsFilter === 'last-3') {
      targetRounds = availableRounds.slice(-3);
      label = targetRounds.length > 0 ? `Últimas 3 Rodadas (RD ${targetRounds.join(', ')})` : 'Últimas 3 Rodadas';
    } else if (recentRoundsFilter === 'last-5') {
      targetRounds = availableRounds.slice(-5);
      label = targetRounds.length > 0 ? `Últimas 5 Rodadas (RD ${targetRounds.join(', ')})` : 'Últimas 5 Rodadas';
    } else if (recentRoundsFilter === 'all') {
      targetRounds = availableRounds;
      label = 'Todas as Rodadas';
    } else {
      targetRounds = [recentRoundsFilter];
      label = `Rodada ${recentRoundsFilter}`;
    }

    const filteredKills = killFeed.filter(k => {
      const rd = (k.RD || '').trim();
      return targetRounds.includes(rd);
    });

    const totalRecentKills = filteredKills.length;
    const catCounts: Record<string, number> = {};
    const weaponCounts: Record<string, number> = {};
    const weaponPlayerCounts: Record<string, Record<string, number>> = {};
    const weaponPhases: Record<string, { early: number; mid: number; late: number }> = {};

    filteredKills.forEach(k => {
      const wRaw = (k.ARMA || '').trim();
      if (!wRaw) return;
      const cleanKey = normalizeName(wRaw);
      if (EXCLUDED_WEAPON_NAMES.has(cleanKey)) return;

      const wInfo = getWeaponInfo(wRaw, data?.weapons);
      const category = wInfo.tipo || 'OUTROS';

      catCounts[category] = (catCounts[category] || 0) + 1;
      weaponCounts[wRaw] = (weaponCounts[wRaw] || 0) + 1;

      if (!weaponPlayerCounts[wRaw]) weaponPlayerCounts[wRaw] = {};
      const killer = (k.PLAYER || '').trim();
      if (killer && killer !== 'GÁS') {
        weaponPlayerCounts[wRaw][killer] = (weaponPlayerCounts[wRaw][killer] || 0) + 1;
      }

      if (!weaponPhases[wRaw]) weaponPhases[wRaw] = { early: 0, mid: 0, late: 0 };
      const ph = getGamePhase(k.SAFE);
      if (ph === 'EARLY') weaponPhases[wRaw].early++;
      else if (ph === 'MID') weaponPhases[wRaw].mid++;
      else if (ph === 'LATE') weaponPhases[wRaw].late++;
    });

    const categoriesData = Object.entries(catCounts)
      .map(([catName, kills]) => {
        const config = getCategoryConfig(catName);
        const share = totalRecentKills > 0 ? parseFloat(((kills / totalRecentKills) * 100).toFixed(1)) : 0;
        return {
          name: catName,
          label: config.label,
          kills,
          share,
          color: config.color,
          bg: config.bg,
          border: config.border,
          text: config.text
        };
      })
      .sort((a, b) => b.kills - a.kills);

    const sortedWeapons = Object.entries(weaponCounts)
      .filter(([name]) => !EXCLUDED_WEAPON_NAMES.has(normalizeName(name)))
      .map(([name, kills]) => ({ name, kills }))
      .sort((a, b) => b.kills - a.kills);

    let topWeapon: {
      name: string;
      tipo: string;
      img?: string;
      config: WeaponCategoryConfig;
      kills: number;
      share: number;
      topPlayer: { name: string; kills: number; team?: string; img?: string } | null;
      phases: { early: number; mid: number; late: number };
      dominantPhase: 'EARLY' | 'MID' | 'LATE';
      detailedStat?: WeaponDetailedStat;
    } | null = null;

    if (sortedWeapons.length > 0 && sortedWeapons[0].kills > 0) {
      const best = sortedWeapons[0];
      const wInfo = getWeaponInfo(best.name, data?.weapons);
      const share = totalRecentKills > 0 ? parseFloat(((best.kills / totalRecentKills) * 100).toFixed(1)) : 0;
      const ph = weaponPhases[best.name] || { early: 0, mid: 0, late: 0 };
      let dominantPhase: 'EARLY' | 'MID' | 'LATE' = 'MID';
      if (ph.early >= ph.mid && ph.early >= ph.late && ph.early > 0) dominantPhase = 'EARLY';
      else if (ph.late >= ph.mid && ph.late >= ph.early && ph.late > 0) dominantPhase = 'LATE';

      const playersForWeapon = weaponPlayerCounts[best.name] || {};
      const topPlayerEntry = Object.entries(playersForWeapon).sort((a, b) => b[1] - a[1])[0];
      const topPlayer = topPlayerEntry ? {
        name: topPlayerEntry[0],
        kills: topPlayerEntry[1],
        team: playerToTeamMap.get(normalizeName(topPlayerEntry[0])),
        img: findDimImg(data?.playersDimension, topPlayerEntry[0])
      } : null;

      const detailed = weaponStatsList.find(w => normalizeName(w.name) === normalizeName(best.name));
      const overrideImg = WEAPON_IMAGE_OVERRIDES[normalizeName(best.name)];

      topWeapon = {
        name: best.name,
        tipo: wInfo.tipo,
        img: overrideImg || wInfo.img,
        config: wInfo.config,
        kills: best.kills,
        share,
        topPlayer,
        phases: ph,
        dominantPhase,
        detailedStat: detailed
      };
    }

    return {
      selectedRoundsLabel: label,
      targetRounds,
      categoriesData,
      topWeapon,
      totalRecentKills,
      activeWeaponsInRecent: Object.keys(weaponCounts).length
    };
  }, [data?.killFeed, data?.weapons, data?.playersDimension, availableRounds, recentRoundsFilter, playerToTeamMap, weaponStatsList]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* 1. HERO & METRICAS GLOBAIS DO ARSENAL */}
      {/* ========================================================================= */}
      <div className="bg-[#121217] rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5">
                <Sparkles size={12} /> Laboratório de Arsenal • FFWSBR 2026
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Catálogo Atualizado de 87 Armas
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
              <Swords className="text-yellow-400" size={32} />
              Dashboard de Eficácia de Armas
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Análise tática aprofundada de letalidade, dominância por fases de safe, especialistas individuais e distribuição do meta competitivo por categorias oficiais.
            </p>
          </div>

          {/* Abas Superiores de Modo de Visão */}
          <div className="flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10 shadow-inner self-stretch lg:self-auto">
            <button
              onClick={() => setViewTab('gallery')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                viewTab === 'gallery'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={14} />
              Galeria de Armas
            </button>
            <button
              onClick={() => setViewTab('categories')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                viewTab === 'categories'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart2 size={14} />
              Comparativo de Categorias
            </button>
            <button
              onClick={() => setViewTab('leaders')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                viewTab === 'leaders'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy size={14} />
              Líderes do Meta
            </button>
          </div>
        </div>

        {/* Grade de 4 Cards de Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          {/* Card 1: Total de Abates */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total de Abates</span>
              <Crosshair size={14} className="text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white italic tracking-tight">
                {globalStats.totalKillsCount}
              </div>
              <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                Registrados no KillFeed
              </span>
            </div>
          </div>

          {/* Card 2: Armas Ativas */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Armas Utilizadas</span>
              <Layers size={14} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-400 italic tracking-tight">
                {globalStats.activeWeaponsTotal}
                <span className="text-xs text-gray-500 font-normal ml-1">
                  / {globalStats.catalogWeaponsCount}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                {((globalStats.activeWeaponsTotal / Math.max(1, globalStats.catalogWeaponsCount)) * 100).toFixed(0)}% do arsenal foi acionado
              </span>
            </div>
          </div>

          {/* Card 3: Arma #1 */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Arma #1 do Meta</span>
              <Award size={14} className="text-yellow-400" />
            </div>
            <div>
              <div className="text-xl font-black text-yellow-400 italic truncate tracking-tight flex items-center gap-2">
                {globalStats.topWeaponGlobal ? (
                  <>
                    <span>{globalStats.topWeaponGlobal.name}</span>
                    <span className="text-xs text-gray-400 font-mono font-bold">
                      ({globalStats.topWeaponGlobal.totalKills} kills)
                    </span>
                  </>
                ) : 'N/A'}
              </div>
              <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                {globalStats.topWeaponGlobal ? `${globalStats.topWeaponGlobal.shareOfMeta}% de todos os abates` : '-'}
              </span>
            </div>
          </div>

          {/* Card 4: Categoria Dominante */}
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Categoria Dominante</span>
              <Flame size={14} className="text-orange-400" />
            </div>
            <div>
              <div className="text-xl font-black text-orange-400 italic truncate tracking-tight flex items-center gap-2">
                {globalStats.topCategoryGlobal ? (
                  <>
                    <span>{globalStats.topCategoryGlobal.category}</span>
                    <span className="text-xs text-gray-400 font-mono font-bold">
                      ({globalStats.topCategoryGlobal.totalKills} kills)
                    </span>
                  </>
                ) : 'N/A'}
              </div>
              <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                {globalStats.topCategoryGlobal ? `${globalStats.topCategoryGlobal.shareOfMeta}% do volume da liga` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NOVO: GRÁFICO DE BARRAS DE CATEGORIAS NAS ÚLTIMAS RODADAS & ARMA MAIS POPULAR */}
      {/* ========================================================================= */}
      <div className="bg-[#121217] rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Glow de fundo dourado/laranja */}
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho da Seção com Controles de Rodadas */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5">
                <Sparkles size={11} /> Meta Atual • Análise Recente
              </span>
              <span className="text-[11px] font-mono text-gray-400 font-bold">
                {recentRoundsStats.selectedRoundsLabel}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2.5">
              <BarChart2 className="text-yellow-400" size={24} />
              Categorias Mais Utilizadas nas Últimas Rodadas
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Visualização de volume e representatividade de cada categoria de arma com destaque para a arma mais popular do momento.
            </p>
          </div>

          {/* Seletores Rápidos de Rodadas */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 self-stretch md:self-auto">
            <button
              onClick={() => setRecentRoundsFilter('last-3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                recentRoundsFilter === 'last-3'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Últimas 3 Rodadas
            </button>
            <button
              onClick={() => setRecentRoundsFilter('last-1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                recentRoundsFilter === 'last-1'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Última Rodada
            </button>
            <button
              onClick={() => setRecentRoundsFilter('last-5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                recentRoundsFilter === 'last-5'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Últimas 5
            </button>
            <button
              onClick={() => setRecentRoundsFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                recentRoundsFilter === 'all'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Geral
            </button>

            {/* Alternar Recolher/Expandir */}
            <button
              onClick={() => setShowRecentChartSection(prev => !prev)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title={showRecentChartSection ? "Recolher Seção" : "Expandir Seção"}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        {showRecentChartSection && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 animate-in fade-in duration-300">
            {/* COLUNA ESQUERDA: GRÁFICO DE BARRAS DE CATEGORIAS (7 colunas) */}
            <div className="lg:col-span-7 bg-black/40 rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between shadow-inner">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-yellow-400" />
                      Uso de Categorias • {recentRoundsStats.selectedRoundsLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {recentRoundsStats.totalRecentKills} abates analisados
                    </span>
                    <span className="text-[10px] text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      {recentRoundsStats.categoriesData.length} categorias acionadas
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  Comparação direta do volume letal por classe de armamento no período selecionado:
                </p>

                {/* Container do Gráfico Recharts */}
                <div className="h-64 sm:h-72 w-full pt-2">
                  {recentRoundsStats.categoriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={recentRoundsStats.categoriesData} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={11} 
                          tickLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#101014] border border-white/20 p-3 rounded-xl shadow-2xl text-xs text-white">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span 
                                      className="w-2.5 h-2.5 rounded-full" 
                                      style={{ backgroundColor: d.color }}
                                    />
                                    <span className="font-black uppercase text-yellow-400">
                                      {d.name} ({d.label})
                                    </span>
                                  </div>
                                  <span className="block font-bold text-white text-sm">
                                    {d.kills} abates registrados
                                  </span>
                                  <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                                    Participação: {d.share}% de todos os abates no período
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="kills" radius={[6, 6, 0, 0]}>
                          {recentRoundsStats.categoriesData.map((entry, index) => (
                            <Cell 
                              key={`cell-recent-${index}`} 
                              fill={entry.color || '#eab308'}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedCategory(entry.name);
                                setViewTab('gallery');
                              }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs italic">
                      Nenhum abate registrado nas rodadas selecionadas.
                    </div>
                  )}
                </div>
              </div>

              {/* Badges Interativas de Categorias Abaixo do Gráfico */}
              <div className="pt-3 mt-2 border-t border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-2">
                  Classes por Volume (Clique para filtrar a galeria):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentRoundsStats.categoriesData.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setViewTab('gallery');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border hover:scale-[1.02] ${cat.bg} ${cat.text} ${cat.border}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}:</span>
                      <span className="font-black font-mono">{cat.kills}</span>
                      <span className="text-[9px] opacity-75">({cat.share}%)</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: DESTAQUE DA ARMA MAIS POPULAR DO MOMENTO (5 colunas) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-yellow-500/10 via-black/60 to-black/80 rounded-2xl border-2 border-yellow-500/40 p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
              {/* Efeito Glow Especial */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Header do Card de Destaque */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-yellow-500 text-black shadow-md shadow-yellow-500/30">
                      <Trophy size={16} />
                    </span>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 block">
                        Destaque em Alta
                      </span>
                      <h4 className="text-xs sm:text-sm font-black uppercase italic tracking-wider text-white">
                        Arma Mais Popular do Momento
                      </h4>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center gap-1">
                    <Flame size={10} /> Meta Líder
                  </span>
                </div>

                {recentRoundsStats.topWeapon ? (
                  <div className="mt-4 space-y-4">
                    {/* Imagem e Identificação da Arma */}
                    <div className="flex flex-col items-center justify-center text-center p-3 bg-black/60 rounded-2xl border border-white/10 relative group">
                      <div className="w-36 h-24 flex items-center justify-center p-2 mb-1">
                        {recentRoundsStats.topWeapon.img ? (
                          <img
                            src={recentRoundsStats.topWeapon.img}
                            alt={recentRoundsStats.topWeapon.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <Swords size={40} className="text-yellow-400/50" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${recentRoundsStats.topWeapon.config.bg} ${recentRoundsStats.topWeapon.config.border} ${recentRoundsStats.topWeapon.config.text}`}>
                          {recentRoundsStats.topWeapon.tipo}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                          #1 Mais Escolhida
                        </span>
                      </div>

                      <h3 className="text-2xl font-black italic uppercase text-white mt-1.5 tracking-tight">
                        {recentRoundsStats.topWeapon.name}
                      </h3>
                    </div>

                    {/* Grade de 3 Métricas Rápidas da Arma */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Abates</span>
                        <span className="text-lg font-black italic text-yellow-400">
                          {recentRoundsStats.topWeapon.kills}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono block">no período</span>
                      </div>

                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Meta Share</span>
                        <span className="text-lg font-black italic text-blue-400">
                          {recentRoundsStats.topWeapon.share}%
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono block">das baixas</span>
                      </div>

                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Fase Ápice</span>
                        <span className="text-xs font-black italic text-orange-400 block mt-1">
                          {recentRoundsStats.topWeapon.dominantPhase === 'EARLY' ? 'Início (S1-2)' : recentRoundsStats.topWeapon.dominantPhase === 'LATE' ? 'Final (S5+)' : 'Meio (S3-4)'}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono block mt-0.5">
                          E: {recentRoundsStats.topWeapon.phases.early} • M: {recentRoundsStats.topWeapon.phases.mid} • L: {recentRoundsStats.topWeapon.phases.late}
                        </span>
                      </div>
                    </div>

                    {/* Atleta Especialista Mais Letal com a Arma no Período */}
                    {recentRoundsStats.topWeapon.topPlayer && (
                      <div className="bg-black/60 rounded-xl p-3 border border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {recentRoundsStats.topWeapon.topPlayer.img ? (
                              <img
                                src={recentRoundsStats.topWeapon.topPlayer.img}
                                alt={recentRoundsStats.topWeapon.topPlayer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={16} className="text-yellow-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">
                              Maior Especialista no Período
                            </span>
                            <span className="text-xs font-black text-white uppercase italic truncate block">
                              {recentRoundsStats.topWeapon.topPlayer.name}
                            </span>
                            {recentRoundsStats.topWeapon.topPlayer.team && (
                              <span className="text-[9px] font-bold text-yellow-400/90 uppercase tracking-wider block">
                                {recentRoundsStats.topWeapon.topPlayer.team}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black italic text-yellow-400 block">
                            {recentRoundsStats.topWeapon.topPlayer.kills} kills
                          </span>
                          <span className="text-[8px] text-gray-500 uppercase font-mono block">
                            com esta arma
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-8">
                    Nenhum dado registrado para o período.
                  </p>
                )}
              </div>

              {/* Botão de Ação para Ver Análise Detalhada */}
              {recentRoundsStats.topWeapon?.detailedStat && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedWeaponModal(recentRoundsStats.topWeapon!.detailedStat!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:scale-[1.02]"
                  >
                    <Target size={14} />
                    Ver Raio-X Completo da {recentRoundsStats.topWeapon.name}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTEÚDO PRINCIPAL: MODO GALERIA */}
      {/* ========================================================================= */}
      {viewTab === 'gallery' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* BARRA DE FILTROS POR CATEGORIA (HORIZONTAL SCROLLÁVEL) */}
          <div className="bg-[#121217] p-3 rounded-2xl border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <Filter size={14} className="text-yellow-400" />
                <span>Filtrar por Categoria:</span>
              </div>

              {/* Toggle de Apenas com Abates vs Todas as 87 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyActiveWeapons(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border ${
                    onlyActiveWeapons
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                  }`}
                >
                  <Crosshair size={12} />
                  {onlyActiveWeapons ? 'Apenas com Abates (Ativas)' : 'Exibindo Arsenal Completo'}
                </button>
              </div>
            </div>

            {/* Segmented Category Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {filterCategories.map(cat => {
                const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                const config = getCategoryConfig(cat.id === 'ALL' ? undefined : cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border flex items-center gap-2 ${
                      isSelected
                        ? cat.id === 'ALL'
                          ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-500/20 scale-[1.02]'
                          : `${config.bg} ${config.text} ${config.border} shadow-md scale-[1.02] ring-1 ring-white/20`
                        : 'bg-black/40 text-gray-400 hover:text-white border-white/5 hover:border-white/10'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isSelected ? 'bg-black/30' : 'bg-white/5 text-gray-500'
                    }`}>
                      {cat.kills > 0 ? `${cat.kills} kills` : `${cat.count} armas`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA DE PESQUISA E ORDENAÇÃO */}
          <div className="bg-[#121217] p-3.5 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Campo de Busca Instantâneo */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome da arma, categoria ou atleta especialista..."
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={12} /> Ordenar:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/60 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500/50 uppercase cursor-pointer"
              >
                <option value="kills-desc">Mais Letais (Abates ↓)</option>
                <option value="kills-asc">Menos Abates (↑)</option>
                <option value="late-desc">Maior Eficácia Late Game (Safe 5+)</option>
                <option value="early-desc">Maior Eficácia Early Game (Safe 1-2)</option>
                <option value="alpha-asc">Ordem Alfabética (A-Z)</option>
              </select>
            </div>
          </div>

          {/* CONTADOR DE RESULTADOS */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Exibindo <strong className="text-white font-black">{filteredWeapons.length}</strong> armas
              {selectedCategory !== 'ALL' && ` na categoria ${selectedCategory}`}
              {searchQuery && ` para "${searchQuery}"`}
            </span>
            <span className="text-[11px] text-gray-500">
              Clique em qualquer arma para abrir o Raio-X Detalhado
            </span>
          </div>

          {/* GRID DA GALERIA DE ARMAS */}
          {filteredWeapons.length === 0 ? (
            <div className="bg-[#121217] rounded-3xl border border-white/10 p-16 text-center text-gray-500 space-y-3">
              <AlertCircle size={36} className="mx-auto text-gray-600" />
              <p className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Nenhuma arma encontrada com os filtros selecionados
              </p>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery(''); setOnlyActiveWeapons(false); }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-yellow-400 transition-colors border border-white/10"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredWeapons.map((weapon) => {
                const hasKills = weapon.totalKills > 0;
                const topP = weapon.topPlayers.length > 0 ? weapon.topPlayers[0] : null;

                return (
                  <div
                    key={weapon.name}
                    onClick={() => setSelectedWeaponModal(weapon)}
                    className="group bg-[#15151c] hover:bg-[#1a1a24] rounded-2xl border border-white/10 hover:border-yellow-500/50 p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden"
                  >
                    {/* Top Bar: Categoria e Rank */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${weapon.config.bg} ${weapon.config.border} ${weapon.config.text} ${weapon.config.glow || ''}`}>
                        {weapon.tipo}
                      </span>

                      {hasKills ? (
                        <span className="text-[10px] font-mono font-black text-gray-400 bg-black/60 px-2 py-0.5 rounded-md border border-white/5">
                          #{weapon.rankOverall} Geral
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-gray-600 bg-black/40 px-1.5 py-0.5 rounded">
                          Sem Abates
                        </span>
                      )}
                    </div>

                    {/* Imagem da Arma com container escuro e reflexo */}
                    <div className="w-full h-28 bg-black/50 rounded-xl p-2.5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all my-2 relative overflow-hidden">
                      {/* Glow suave com a cor da categoria */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-xl pointer-events-none"
                        style={{ backgroundColor: weapon.config.color }}
                      />

                      {weapon.img ? (
                        <img
                          src={weapon.img}
                          alt={weapon.name}
                          className="h-full w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-700">
                          <Swords size={28} />
                          <span className="text-[8px] font-mono mt-1 text-gray-600">Sem Imagem</span>
                        </div>
                      )}
                    </div>

                    {/* Nome da Arma */}
                    <div className="mt-1 text-center">
                      <h3 className="text-base font-black italic uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors truncate">
                        {weapon.name}
                      </h3>
                    </div>

                    {/* Estatísticas de Eficácia */}
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-xs">
                      {/* Volume de Abates */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          Abates Letais:
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black italic text-yellow-400">
                            {weapon.totalKills}
                          </span>
                          {hasKills && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              ({weapon.shareOfMeta}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra Trifásica de Eficácia (Early / Mid / Late) */}
                      {hasKills ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold">
                            <span>S1-2: {weapon.earlyKills}</span>
                            <span>S3-4: {weapon.midKills}</span>
                            <span>S5+: {weapon.lateKills}</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden flex border border-white/5">
                            <div
                              style={{ width: `${weapon.earlyPct}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Early Safe: ${weapon.earlyKills} kills (${weapon.earlyPct}%)`}
                            />
                            <div
                              style={{ width: `${weapon.midPct}%` }}
                              className="bg-yellow-500 h-full"
                              title={`Mid Safe: ${weapon.midKills} kills (${weapon.midPct}%)`}
                            />
                            <div
                              style={{ width: `${weapon.latePct}%` }}
                              className="bg-red-500 h-full"
                              title={`Late Safe: ${weapon.lateKills} kills (${weapon.latePct}%)`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 text-center text-[10px] text-gray-600 font-medium italic">
                          Ainda sem registros no campeonato
                        </div>
                      )}

                      {/* Atleta Especialista #1 */}
                      {topP && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <span className="text-[9px] text-gray-500 uppercase font-bold truncate">
                            Especialista:
                          </span>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-[10px] font-black text-gray-200 uppercase truncate">
                              {topP.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-1 rounded">
                              {topP.count}x
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botão Inferior de Raio-X */}
                    <div className="mt-3 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedWeaponModal(weapon); }}
                        className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-yellow-500 hover:text-black text-gray-300 font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/5 hover:border-yellow-400"
                      >
                        <Crosshair size={12} />
                        Ver Raio-X da Arma
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO PRINCIPAL: MODO COMPARATIVO DE CATEGORIAS */}
      {/* ========================================================================= */}
      {viewTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Gráfico de Barras: Distribuição do Meta por Categoria */}
          <div className="bg-[#121217] rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                  <BarChart2 className="text-yellow-400" size={20} />
                  Distribuição de Abates por Categoria
                </h3>
                <p className="text-xs text-gray-400">
                  Volume de abates gerado por cada classe de armamento no torneio
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 bg-black/60 px-3 py-1 rounded-xl border border-white/5">
                {categorySummaries.length} Categorias no Catálogo
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={11} 
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#101014] border border-white/20 p-3 rounded-xl shadow-2xl text-xs text-white">
                            <span className="font-black uppercase block text-yellow-400">{d.name}</span>
                            <span className="block mt-1">{d.kills} abates registrados</span>
                            <span className="text-[10px] text-gray-400 block font-mono">Participação: {d.share}% do meta</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="kills" radius={[6, 6, 0, 0]}>
                    {categoriesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#eab308'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CARDS DETALHADOS DE CADA CATEGORIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorySummaries.map((cat) => {
              return (
                <div
                  key={cat.category}
                  className="bg-[#15151c] rounded-2xl border border-white/10 p-5 space-y-4 shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${cat.config.bg} ${cat.config.border} ${cat.config.text}`}>
                          {cat.category}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {cat.activeWeaponsCount} de {cat.totalWeaponsInCatalog} armas ativas
                        </span>
                      </div>
                      <h4 className="text-xl font-black italic uppercase text-white mt-1">
                        {cat.label}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black italic text-yellow-400 block">
                        {cat.totalKills}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-mono block">
                        {cat.shareOfMeta}% do torneio
                      </span>
                    </div>
                  </div>

                  {/* Arma Dominante da Categoria */}
                  {cat.topWeapon && (
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 bg-black/60 rounded-lg p-1 border border-white/10 flex items-center justify-center shrink-0">
                          {cat.topWeapon.img ? (
                            <img src={cat.topWeapon.img} alt={cat.topWeapon.name} className="h-full w-full object-contain" />
                          ) : (
                            <Swords size={16} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">
                            Arma Líder da Categoria
                          </span>
                          <span className="text-sm font-black text-white uppercase italic">
                            {cat.topWeapon.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-yellow-400 italic block">
                          {cat.topWeapon.kills} kills
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mini Lista das Principais Armas da Categoria */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Armas Destaque da Classe:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.weapons.slice(0, 6).map(w => (
                        <button
                          key={w.name}
                          onClick={() => setSelectedWeaponModal(w)}
                          className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-yellow-500 hover:text-black border border-white/5 hover:border-yellow-400 text-xs text-gray-300 font-bold transition-all flex items-center gap-1.5"
                        >
                          <span>{w.name}</span>
                          <span className="text-[9px] font-mono opacity-80">
                            ({w.totalKills})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONTEÚDO PRINCIPAL: MODO LÍDERES DO META */}
      {/* ========================================================================= */}
      {viewTab === 'leaders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Gráfico Top 10 Armas Mais Letais */}
          <div className="bg-[#121217] rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                <Trophy className="text-yellow-400" size={20} />
                Top 10 Armas Mais Letais da Competição
              </h3>
              <p className="text-xs text-gray-400">
                Ranking das armas que mais definiram abates no campeonato
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10WeaponsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={11} 
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#101014] border border-white/20 p-3 rounded-xl shadow-2xl text-xs text-white">
                            <span className="font-black uppercase block text-yellow-400">{d.name} ({d.category})</span>
                            <span className="block mt-1">{d.kills} abates no total</span>
                            <div className="text-[10px] text-gray-400 font-mono mt-1 pt-1 border-t border-white/10">
                              <span>S1-2: {d.early}</span> • <span>S3-4: {d.mid}</span> • <span>S5+: {d.late}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="kills" radius={[6, 6, 0, 0]}>
                    {top10WeaponsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#eab308'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABELA DETALHADA DOS LÍDERES DO META */}
          <div className="bg-[#121217] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                Tabela de Eficácia do Arsenal Completo
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Ordenado por Volume de Abates
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-[10px] uppercase font-mono text-gray-400 border-b border-white/10 tracking-widest">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Pos</th>
                    <th className="py-3 px-4">Arma</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Abates</th>
                    <th className="py-3 px-4 w-32">% Meta</th>
                    <th className="py-3 px-4 text-center">Fase Dominante</th>
                    <th className="py-3 px-4">Especialista #1</th>
                    <th className="py-3 px-4 text-center w-24">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {weaponStatsList.slice(0, 20).map((weapon, idx) => {
                    const topP = weapon.topPlayers.length > 0 ? weapon.topPlayers[0] : null;

                    return (
                      <tr
                        key={weapon.name}
                        onClick={() => setSelectedWeaponModal(weapon)}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                            idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                            idx === 1 ? 'bg-slate-300/20 text-slate-200 border-slate-400/40' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-400 border-amber-600/40' :
                            'bg-white/5 text-gray-400 border-white/10'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-8 rounded-lg bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0">
                              {weapon.img ? (
                                <img src={weapon.img} alt={weapon.name} className="w-full h-full object-contain" />
                              ) : (
                                <Swords size={14} className="text-gray-600" />
                              )}
                            </div>
                            <span className="font-black uppercase italic tracking-tight text-white">
                              {weapon.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${weapon.config.bg} ${weapon.config.border} ${weapon.config.text}`}>
                            {weapon.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-black italic text-yellow-400">
                            {weapon.totalKills}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(3, weapon.shareOfMeta))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                              {weapon.shareOfMeta}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            weapon.dominantPhase === 'EARLY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            weapon.dominantPhase === 'LATE' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {weapon.dominantPhase === 'EARLY' ? 'Early (S1-2)' : weapon.dominantPhase === 'LATE' ? 'Late (S5+)' : 'Mid (S3-4)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {topP ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-200 font-bold uppercase">{topP.name}</span>
                              <span className="text-[9px] font-mono text-yellow-400 bg-yellow-500/10 px-1 rounded">
                                {topP.count}x
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedWeaponModal(weapon); }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-yellow-500 hover:text-black text-gray-300 text-[10px] font-black uppercase transition-all border border-white/10"
                          >
                            Raio-X
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE RAIO-X DETALHADO DA ARMA */}
      {/* ========================================================================= */}
      {selectedWeaponModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedWeaponModal(null)}
        >
          <div 
            className="bg-[#111116] border border-white/15 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-black/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-14 bg-black/60 rounded-2xl border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-lg">
                  {selectedWeaponModal.img ? (
                    <img
                      src={selectedWeaponModal.img}
                      alt={selectedWeaponModal.name}
                      className="h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                    />
                  ) : (
                    <Swords size={24} className="text-gray-600" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${selectedWeaponModal.config.bg} ${selectedWeaponModal.config.border} ${selectedWeaponModal.config.text}`}>
                      {selectedWeaponModal.tipo}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      #{selectedWeaponModal.rankOverall} no Ranking Geral • #{selectedWeaponModal.rankInCategory} na Categoria
                    </span>
                  </div>

                  <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mt-0.5">
                    {selectedWeaponModal.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedWeaponModal(null)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                title="Fechar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo Scrollável do Modal */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-black/30">
              {/* KPIs de Eficácia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#16161f] rounded-xl p-3 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Abates Conquistados</span>
                  <span className="text-2xl font-black italic text-yellow-400">{selectedWeaponModal.totalKills}</span>
                  <span className="text-[9px] text-gray-500 block font-mono">Participação: {selectedWeaponModal.shareOfMeta}%</span>
                </div>

                <div className="bg-[#16161f] rounded-xl p-3 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Early Game (S1-2)</span>
                  <span className="text-2xl font-black italic text-emerald-400">{selectedWeaponModal.earlyKills}</span>
                  <span className="text-[9px] text-gray-500 block font-mono">{selectedWeaponModal.earlyPct}% dos seus abates</span>
                </div>

                <div className="bg-[#16161f] rounded-xl p-3 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Mid Game (S3-4)</span>
                  <span className="text-2xl font-black italic text-yellow-400">{selectedWeaponModal.midKills}</span>
                  <span className="text-[9px] text-gray-500 block font-mono">{selectedWeaponModal.midPct}% dos seus abates</span>
                </div>

                <div className="bg-[#16161f] rounded-xl p-3 border border-white/5">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Late Game (S5+)</span>
                  <span className="text-2xl font-black italic text-red-400">{selectedWeaponModal.lateKills}</span>
                  <span className="text-[9px] text-gray-500 block font-mono">{selectedWeaponModal.latePct}% dos seus abates</span>
                </div>
              </div>

              {/* Gráficos: Por Rodada e Por Mapa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Abates por Rodada */}
                <div className="bg-[#16161f] rounded-2xl p-4 border border-white/5 space-y-3">
                  <span className="text-xs font-black uppercase italic tracking-wider text-gray-200 block">
                    Consistência por Rodada
                  </span>

                  {Object.keys(selectedWeaponModal.killsByRound).length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {Object.entries(selectedWeaponModal.killsByRound).map(([rd, count]) => {
                        const countNum = Number(count) || 0;
                        const totalK = selectedWeaponModal.totalKills || 1;
                        return (
                          <div key={rd} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-gray-400 font-bold uppercase w-16">{rd}</span>
                            <div className="flex-1 bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(8, (countNum / totalK) * 100))}%` }}
                              />
                            </div>
                            <span className="text-white font-mono font-bold w-8 text-right">{countNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-4 text-center">Sem dados de rodada</p>
                  )}
                </div>

                {/* Abates por Mapa */}
                <div className="bg-[#16161f] rounded-2xl p-4 border border-white/5 space-y-3">
                  <span className="text-xs font-black uppercase italic tracking-wider text-gray-200 block">
                    Distribuição por Mapa
                  </span>

                  {Object.keys(selectedWeaponModal.killsByMap).length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {Object.entries(selectedWeaponModal.killsByMap).map(([mapName, count]) => {
                        const countNum = Number(count) || 0;
                        const totalK = selectedWeaponModal.totalKills || 1;
                        return (
                          <div key={mapName} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-gray-400 font-bold uppercase w-28 truncate">{mapName}</span>
                            <div className="flex-1 bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(8, (countNum / totalK) * 100))}%` }}
                              />
                            </div>
                            <span className="text-white font-mono font-bold w-8 text-right">{countNum}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-4 text-center">Sem dados de mapa</p>
                  )}
                </div>
              </div>

              {/* Tabelas: Top Atletas e Top Equipes com a Arma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Atletas Especialistas */}
                <div className="bg-[#16161f] rounded-2xl p-4 border border-white/5 space-y-3">
                  <span className="text-xs font-black uppercase italic tracking-wider text-gray-200 flex items-center gap-1.5">
                    <User size={14} className="text-yellow-400" />
                    Top Atletas com {selectedWeaponModal.name}
                  </span>

                  {selectedWeaponModal.topPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWeaponModal.topPlayers.map((player, pIdx) => (
                        <div
                          key={player.name}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-gray-500 w-4">
                              #{pIdx + 1}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-black/80 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                              {player.img ? (
                                <img src={player.img} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={14} className="text-gray-600" />
                              )}
                            </div>
                            <div className="truncate">
                              <span className="font-black uppercase block truncate text-white">{player.name}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase truncate">{player.team || '-'}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-yellow-400 italic block">{player.count}</span>
                            <span className="text-[8px] text-gray-500 uppercase block font-mono">abates</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-4 text-center">Nenhum jogador registrado</p>
                  )}
                </div>

                {/* Top Equipes Mais Letais */}
                <div className="bg-[#16161f] rounded-2xl p-4 border border-white/5 space-y-3">
                  <span className="text-xs font-black uppercase italic tracking-wider text-gray-200 flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-400" />
                    Equipes Mais Letais com a Arma
                  </span>

                  {selectedWeaponModal.topTeams.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWeaponModal.topTeams.map((team, tIdx) => (
                        <div
                          key={team.name}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-mono font-bold text-gray-500 w-4">
                              #{tIdx + 1}
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-black/80 border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                              ) : (
                                <Shield size={14} className="text-gray-600" />
                              )}
                            </div>
                            <span className="font-black uppercase text-white truncate">{team.name}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-blue-400 italic block">{team.count}</span>
                            <span className="text-[8px] text-gray-500 uppercase block font-mono">abates</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-4 text-center">Nenhuma equipe registrada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-black/80 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>{selectedWeaponModal.name} • Categoria {selectedWeaponModal.tipo}</span>
              <button
                onClick={() => setSelectedWeaponModal(null)}
                className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs transition-colors border border-white/10"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const WeaponDashboard = WeaponStudiesDashboard;
export default WeaponStudiesDashboard;
