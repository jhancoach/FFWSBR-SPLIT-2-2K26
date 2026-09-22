
import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { 
  Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX, Shield, 
  History, Clock, MapPin, Target, Skull, BarChart3, TrendingUp, Zap, 
  Flame, Sparkles, Eye, EyeOff, Maximize2, Minimize2, ChevronDown, 
  ChevronUp, ChevronsUpDown, LayoutGrid
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import { FullListModal } from '../components/FullListModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { findTeamLogo } from '../utils/teamUtils';

interface KillFeedPageProps {
  data: DashboardData;
}

export type GamePhase = 'ALL' | 'EARLY' | 'MID' | 'LATE';

export const getGamePhase = (safeStr: string | undefined): 'EARLY' | 'MID' | 'LATE' | 'OTHER' => {
  if (!safeStr || safeStr.trim() === '') return 'OTHER';
  const clean = safeStr.trim().toUpperCase();
  const num = parseInt(clean.replace(/\D/g, ''));
  if (num === 1 || num === 2 || clean.includes('SAFE 1') || clean.includes('SAFE 2') || clean === 'S1' || clean === 'S2') return 'EARLY';
  if (num === 3 || num === 4 || clean.includes('SAFE 3') || clean.includes('SAFE 4') || clean === 'S3' || clean === 'S4') return 'MID';
  if (num >= 5 || clean.includes('SAFE 5') || clean.includes('SAFE 6') || clean.includes('SAFE 7') || clean.includes('SAFE 8') || clean === 'S5' || clean === 'S6' || clean === 'S7') return 'LATE';
  return 'OTHER';
};

const KillFeedPage: React.FC<KillFeedPageProps> = ({ data }) => {
  const [tab, setTab] = useState<'kills' | 'deaths' | 'comparativo' | 'fases'>('kills');
  const [gamePhaseFilter, setGamePhaseFilter] = useState<GamePhase>('ALL');
  const [compareType, setCompareType] = useState<'RD' | 'CONFRONTO'>('RD');
  const [compareItem1, setCompareItem1] = useState<string>('');
  const [compareItem2, setCompareItem2] = useState<string>('');

  // Controle de visibilidade de seções da página
  const [sectionVisibility, setSectionVisibility] = useState({
    phaseFilter: true,
    phaseHighlights: true,
    rankingsGrid: true,
    killLog: true,
  });

  // Estado para expandir todas as 6 listas na página
  const [expandAllLists, setExpandAllLists] = useState(false);

  // Configuração do modal de lista inteira em tela cheia
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    items: Array<{ name: string; count: number }>;
    totalCount: number;
    type: 'weapon' | 'team' | 'player' | 'safe';
    isVictimList?: boolean;
    color?: string;
    onSelect?: (name: string) => void;
    activeValues?: string[];
  } | null>(null);
  
  const [filters, setFilters] = useState({
    team: [] as string[], 
    players: [] as string[], 
    weapon: [] as string[], 
    safe: [] as string[], 
    map: [] as string[], 
    rodada: [] as string[], 
    queda: [] as string[],
    confrontation: [] as string[],
    grupo: [] as string[],
    funcao: [] as string[]
  });

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  const checkMatchRd = (filterVal: string, itemVal: string | number | undefined | null): boolean => {
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

  const checkMatchQ = (filterVal: string, itemVal: string | number | undefined | null): boolean => {
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

  // Mapeamento de Jogador para Time
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) map.set(normalize(p.PLAYER), p.TIME);
    });
    return map;
  }, [data.players]);

  // Mapeamento de Funções / Roles dos Jogadores
  const playerRolesMap = useMemo(() => {
    const map = new Map<string, { role1: string; role2: string }>();
    (data.playersDimension || []).forEach(d => {
      if (d.Name) {
        map.set(normalize(d.Name), {
          role1: normalize(d.Funcao),
          role2: normalize(d.Funcao2)
        });
      }
    });
    return map;
  }, [data.playersDimension]);

  const filterOptions = useMemo(() => {
    const rolesSet = new Set<string>();
    (data.playersDimension || []).forEach(d => {
      const r1 = (d.Funcao || '').trim().toUpperCase();
      const r2 = (d.Funcao2 || '').trim().toUpperCase();
      if (r1 && r1 !== 'N/A' && r1 !== '-') rolesSet.add(r1);
      if (r2 && r2 !== 'N/A' && r2 !== '-') rolesSet.add(r2);
    });

    const rounds = Array.from(new Set(data.killFeed.map(k => k.RD)))
      .filter(Boolean)
      .map(String)
      .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));

    // Se houver rodada selecionada, filtrar as opções de quedas para refletir as quedas daquela rodada
    const baseFeedForDrops = data.killFeed.filter(k => 
      filters.rodada.length === 0 || filters.rodada.some(r => checkMatchRd(r, k.RD))
    );

    const quedas = Array.from(new Set(baseFeedForDrops.map(k => k.Q)))
      .filter(Boolean)
      .map(String)
      .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));

    return {
      teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
      players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
      weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
      safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
      maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
      rounds,
      confrontations: Array.from(new Set([
        ...data.confrontationsDimension.map(c => c.CONFRONTO),
        ...data.killFeed.map(k => k.CONFRONTO),
        ...data.details.map(d => d.CONFRONTO),
        ...data.characters.map(c => c.Confronto),
        ...data.players.map(p => p.CONFRONTO)
      ].filter(Boolean))).sort(),
      quedas,
      grupos: Array.from(new Set((Array.isArray(data?.teamsReference) ? data.teamsReference : []).map(t => t.GRUPO))).filter(Boolean).sort() as string[],
      funcoes: Array.from(rolesSet).sort(),
    };
  }, [data.killFeed, data.players, data.teamsReference, data.confrontationsDimension, data.details, data.characters, data.playersDimension, filters.rodada]);

  const handleToggleFilter = (key: keyof typeof filters, value: string) => {
      setFilters(prev => {
          const current = (prev[key] || []) as string[];
          const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [key]: next };
      });
  };

  const filteredFeed = useMemo(() => {
    const teamGroupMap = new Map<string, string>();
    (Array.isArray(data?.teamsReference) ? data.teamsReference : []).forEach(t => {
        if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    return data.killFeed.filter(k => {
      // Filtro de Fase de Jogo (Early / Mid / Late)
      if (gamePhaseFilter !== 'ALL') {
        const ph = getGamePhase(k.SAFE);
        if (ph !== gamePhaseFilter) return false;
      }

      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      
      const isRdMatch = filters.rodada.length === 0 || filters.rodada.some(r => checkMatchRd(r, k.RD));
      const isQMatch = filters.queda.length === 0 || filters.queda.some(q => checkMatchQ(q, k.Q));
      if (!isRdMatch || !isQMatch) return false;

      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(k.CONFRONTO))) return false;
      if (filters.weapon.length > 0 && !filters.weapon.includes(k.ARMA)) return false;
      if (filters.safe.length > 0 && !filters.safe.includes(k.SAFE)) return false;

      // Filtro de Grupo
      if (filters.grupo.length > 0) {
          const kTeam = playerToTeamMap.get(normalize(k.PLAYER));
          const vTeam = playerToTeamMap.get(normalize(k.VITIMA));
          
          if (tab === 'kills') {
              const kGroup = kTeam ? teamGroupMap.get(normalize(kTeam)) : null;
              if (!kGroup || !filters.grupo.some(g => normalize(g) === kGroup)) return false;
          } else {
              const vGroup = vTeam ? teamGroupMap.get(normalize(vTeam)) : null;
              if (!vGroup || !filters.grupo.some(g => normalize(g) === vGroup)) return false;
          }
      }

      // Filtro de Função / Role
      if (filters.funcao && filters.funcao.length > 0) {
        const targetPlayer = tab === 'deaths' ? k.VITIMA : k.PLAYER;
        const pRoles = playerRolesMap.get(normalize(targetPlayer));
        if (!pRoles) return false;
        const hasRole = filters.funcao.some(f => {
          const normF = normalize(f);
          return normF === pRoles.role1 || normF === pRoles.role2;
        });
        if (!hasRole) return false;
      }

      // Lógica de filtragem direcionada por Aba
      if (filters.team.length > 0) {
        const kTeam = playerToTeamMap.get(normalize(k.PLAYER));
        const vTeam = playerToTeamMap.get(normalize(k.VITIMA));
        
        // Se estamos na aba de Letais, o filtro de equipe foca em quem MATOU para ver quem ela matou na lista lateral
        if (tab === 'kills') {
            if (!kTeam || !filters.team.includes(kTeam)) return false;
        } else {
            // Se estamos na aba de Vítimas, o filtro foca em quem MORREU para ver quem a matou na lista lateral
            if (!vTeam || !filters.team.includes(vTeam)) return false;
        }
      }

      if (filters.players.length > 0) {
          if (tab === 'kills') {
              if (!filters.players.some(p => normalize(p) === normalize(k.PLAYER))) return false;
          } else {
              if (!filters.players.some(p => normalize(p) === normalize(k.VITIMA))) return false;
          }
      }
      return true;
    });
  }, [data.killFeed, filters, playerToTeamMap, playerRolesMap, tab, gamePhaseFilter]);

  // Overall Unfiltered Phase Stats (for KPI cards context)
  const basePhaseStats = useMemo(() => {
    let earlyCount = 0;
    let midCount = 0;
    let lateCount = 0;
    let otherCount = 0;

    data.killFeed.forEach(k => {
      const ph = getGamePhase(k.SAFE);
      if (ph === 'EARLY') earlyCount++;
      else if (ph === 'MID') midCount++;
      else if (ph === 'LATE') lateCount++;
      else otherCount++;
    });

    const total = data.killFeed.length || 1;
    return {
      total: data.killFeed.length,
      early: { count: earlyCount, pct: ((earlyCount / total) * 100).toFixed(1) },
      mid: { count: midCount, pct: ((midCount / total) * 100).toFixed(1) },
      late: { count: lateCount, pct: ((lateCount / total) * 100).toFixed(1) },
      other: { count: otherCount, pct: ((otherCount / total) * 100).toFixed(1) },
    };
  }, [data.killFeed]);

  const allTeamsPhaseStats = useMemo(() => {
        const teamPhaseMap = new Map<string, { earlyKills: number, midKills: number, lateKills: number, totalPhaseKills: number }>();
        
        filteredFeed.forEach(row => {
            const team = playerToTeamMap.get(normalize(row.PLAYER));
            if (!team) return;
            const ph = getGamePhase(row.SAFE);
            if (ph === 'OTHER') return;

            if (!teamPhaseMap.has(team)) {
                teamPhaseMap.set(team, { earlyKills: 0, midKills: 0, lateKills: 0, totalPhaseKills: 0 });
            }
            const st = teamPhaseMap.get(team)!;
            
            if (ph === 'EARLY') st.earlyKills++;
            else if (ph === 'MID') st.midKills++;
            else if (ph === 'LATE') st.lateKills++;
            
            st.totalPhaseKills++;
        });

        return Array.from(teamPhaseMap.entries()).map(([name, st]) => {
            const { earlyKills, midKills, lateKills, totalPhaseKills } = st;
            return {
                name,
                earlyKills, midKills, lateKills, totalPhaseKills,
                earlyPct: totalPhaseKills > 0 ? ((earlyKills / totalPhaseKills) * 100).toFixed(1) : '0.0',
                midPct: totalPhaseKills > 0 ? ((midKills / totalPhaseKills) * 100).toFixed(1) : '0.0',
                latePct: totalPhaseKills > 0 ? ((lateKills / totalPhaseKills) * 100).toFixed(1) : '0.0',
            };
        }).sort((a, b) => b.totalPhaseKills - a.totalPhaseKills);
  }, [filteredFeed, playerToTeamMap]);

  const stats = useMemo(() => {
    const weaponCounts: Record<string, number> = {};
    const safeCounts: Record<string, number> = {};
    const killerPlayerCounts: Record<string, number> = {}; 
    const victimPlayerCounts: Record<string, number> = {}; 
    const killerTeamCounts: Record<string, number> = {};
    const victimTeamCounts: Record<string, number> = {};

    // Segmented by Phase
    const phaseKills: Record<'EARLY' | 'MID' | 'LATE' | 'OTHER', number> = { EARLY: 0, MID: 0, LATE: 0, OTHER: 0 };
    const phaseKillerTeams: Record<'EARLY' | 'MID' | 'LATE', Record<string, number>> = { EARLY: {}, MID: {}, LATE: {} };
    const phaseVictimTeams: Record<'EARLY' | 'MID' | 'LATE', Record<string, number>> = { EARLY: {}, MID: {}, LATE: {} };
    const phaseKillerPlayers: Record<'EARLY' | 'MID' | 'LATE', Record<string, number>> = { EARLY: {}, MID: {}, LATE: {} };

    filteredFeed.forEach(row => {
        const ph = getGamePhase(row.SAFE);
        phaseKills[ph] = (phaseKills[ph] || 0) + 1;

        if (row.ARMA && row.ARMA.trim() !== '') {
            weaponCounts[row.ARMA] = (weaponCounts[row.ARMA] || 0) + 1;
        }
        if (row.SAFE && row.SAFE.trim() !== '') {
            safeCounts[row.SAFE] = (safeCounts[row.SAFE] || 0) + 1;
        }
        
        // Jogadores
        if (row.PLAYER && row.PLAYER.trim() !== '') {
            killerPlayerCounts[row.PLAYER] = (killerPlayerCounts[row.PLAYER] || 0) + 1;
            if (ph === 'EARLY' || ph === 'MID' || ph === 'LATE') {
              phaseKillerPlayers[ph][row.PLAYER] = (phaseKillerPlayers[ph][row.PLAYER] || 0) + 1;
            }
        }
        if (row.VITIMA && row.VITIMA.trim() !== '') {
            victimPlayerCounts[row.VITIMA] = (victimPlayerCounts[row.VITIMA] || 0) + 1;
        }

        // Equipes (Sempre calculamos ambas para alimentar as listas laterais)
        const kTeam = playerToTeamMap.get(normalize(row.PLAYER));
        if (kTeam) {
          killerTeamCounts[kTeam] = (killerTeamCounts[kTeam] || 0) + 1;
          if (ph === 'EARLY' || ph === 'MID' || ph === 'LATE') {
            phaseKillerTeams[ph][kTeam] = (phaseKillerTeams[ph][kTeam] || 0) + 1;
          }
        }

        const vTeam = playerToTeamMap.get(normalize(row.VITIMA));
        if (vTeam) {
          victimTeamCounts[vTeam] = (victimTeamCounts[vTeam] || 0) + 1;
          if (ph === 'EARLY' || ph === 'MID' || ph === 'LATE') {
            phaseVictimTeams[ph][vTeam] = (phaseVictimTeams[ph][vTeam] || 0) + 1;
          }
        }
    });

    const totalFiltered = filteredFeed.length || 1;
    const phaseBreakdown = {
      early: {
        count: phaseKills.EARLY,
        pct: ((phaseKills.EARLY / totalFiltered) * 100).toFixed(1),
        topTeams: Object.entries(phaseKillerTeams.EARLY).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topVictims: Object.entries(phaseVictimTeams.EARLY).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topPlayers: Object.entries(phaseKillerPlayers.EARLY).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      },
      mid: {
        count: phaseKills.MID,
        pct: ((phaseKills.MID / totalFiltered) * 100).toFixed(1),
        topTeams: Object.entries(phaseKillerTeams.MID).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topVictims: Object.entries(phaseVictimTeams.MID).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topPlayers: Object.entries(phaseKillerPlayers.MID).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      },
      late: {
        count: phaseKills.LATE,
        pct: ((phaseKills.LATE / totalFiltered) * 100).toFixed(1),
        topTeams: Object.entries(phaseKillerTeams.LATE).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topVictims: Object.entries(phaseVictimTeams.LATE).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
        topPlayers: Object.entries(phaseKillerPlayers.LATE).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      }
    };

    return { 
      weaponCounts, 
      safeCounts, 
      killerPlayerCounts, 
      victimPlayerCounts, 
      killerTeamCounts, 
      victimTeamCounts,
      phaseBreakdown 
    };
  }, [filteredFeed, playerToTeamMap]);

  const comparativeData = useMemo(() => {
    if (tab !== 'comparativo') return null;

    const killsBySafe: Record<string, number> = {};
    const killsByTeam: Record<string, number> = {};
    const deathsByTeam: Record<string, number> = {};
    const killsByRound: Record<string, number> = {};
    const killsByMap: Record<string, number> = {};

    filteredFeed.forEach(row => {
        // Kills by Safe
        if (row.SAFE) {
            killsBySafe[row.SAFE] = (killsBySafe[row.SAFE] || 0) + 1;
        }
        
        // Kills by Round
        if (row.RD) {
            killsByRound[row.RD] = (killsByRound[row.RD] || 0) + 1;
        }

        // Kills by Map
        if (row.MAPA) {
            killsByMap[row.MAPA] = (killsByMap[row.MAPA] || 0) + 1;
        }

        // Kills by Team
        const kTeam = playerToTeamMap.get(normalize(row.PLAYER));
        if (kTeam) killsByTeam[kTeam] = (killsByTeam[kTeam] || 0) + 1;

        // Deaths by Team
        const vTeam = playerToTeamMap.get(normalize(row.VITIMA));
        if (vTeam) deathsByTeam[vTeam] = (deathsByTeam[vTeam] || 0) + 1;
    });

    const safeChart = Object.entries(killsBySafe)
        .map(([name, count]) => ({ name: `Safe ${name}`, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const teamKillsChart = Object.entries(killsByTeam)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const teamDeathsChart = Object.entries(deathsByTeam)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const roundChart = Object.entries(killsByRound)
        .map(([name, count]) => ({ name: `Rd ${name}`, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const mapChart = Object.entries(killsByMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Comparison Logic
    let comp1: any = null;
    let comp2: any = null;
    
    if (compareItem1 && compareItem2) {
        const stats1: any = { kills: {}, deaths: {}, safes: {}, maps: {}, phases: { early: 0, mid: 0, late: 0 } };
        const stats2: any = { kills: {}, deaths: {}, safes: {}, maps: {}, phases: { early: 0, mid: 0, late: 0 } };
        
        data.killFeed.forEach(k => {
            const val = compareType === 'RD' ? k.RD : k.CONFRONTO;
            const kTeam = playerToTeamMap.get(normalize(k.PLAYER));
            const vTeam = playerToTeamMap.get(normalize(k.VITIMA));
            const ph = getGamePhase(k.SAFE);

            if (normalize(val) === normalize(compareItem1)) {
                if (kTeam) stats1.kills[kTeam] = (stats1.kills[kTeam] || 0) + 1;
                if (vTeam) stats1.deaths[vTeam] = (stats1.deaths[vTeam] || 0) + 1;
                if (k.SAFE) stats1.safes[k.SAFE] = (stats1.safes[k.SAFE] || 0) + 1;
                if (k.MAPA) stats1.maps[k.MAPA] = (stats1.maps[k.MAPA] || 0) + 1;
                if (ph === 'EARLY') stats1.phases.early++;
                else if (ph === 'MID') stats1.phases.mid++;
                else if (ph === 'LATE') stats1.phases.late++;
            } else if (normalize(val) === normalize(compareItem2)) {
                if (kTeam) stats2.kills[kTeam] = (stats2.kills[kTeam] || 0) + 1;
                if (vTeam) stats2.deaths[vTeam] = (stats2.deaths[vTeam] || 0) + 1;
                if (k.SAFE) stats2.safes[k.SAFE] = (stats2.safes[k.SAFE] || 0) + 1;
                if (k.MAPA) stats2.maps[k.MAPA] = (stats2.maps[k.MAPA] || 0) + 1;
                if (ph === 'EARLY') stats2.phases.early++;
                else if (ph === 'MID') stats2.phases.mid++;
                else if (ph === 'LATE') stats2.phases.late++;
            }
        });

        const totKills1 = Object.values(stats1.kills).reduce((acc: any, curr: any) => acc + curr, 0) as number;
        const totKills2 = Object.values(stats2.kills).reduce((acc: any, curr: any) => acc + curr, 0) as number;

        comp1 = {
            killsByTeam: Object.entries(stats1.kills).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
            deathsByTeam: Object.entries(stats1.deaths).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
            killsBySafe: Object.entries(stats1.safes).map(([name, count]) => ({ name: `Safe ${name}`, count })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            killsByMap: Object.entries(stats1.maps).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count),
            phases: {
              early: { count: stats1.phases.early, pct: totKills1 > 0 ? ((stats1.phases.early / totKills1) * 100).toFixed(1) : '0.0' },
              mid: { count: stats1.phases.mid, pct: totKills1 > 0 ? ((stats1.phases.mid / totKills1) * 100).toFixed(1) : '0.0' },
              late: { count: stats1.phases.late, pct: totKills1 > 0 ? ((stats1.phases.late / totKills1) * 100).toFixed(1) : '0.0' },
            },
            totalKills: totKills1,
            totalDeaths: Object.values(stats1.deaths).reduce((acc: any, curr: any) => acc + curr, 0) as number
        };

        comp2 = {
            killsByTeam: Object.entries(stats2.kills).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
            deathsByTeam: Object.entries(stats2.deaths).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count).slice(0, 10),
            killsBySafe: Object.entries(stats2.safes).map(([name, count]) => ({ name: `Safe ${name}`, count })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
            killsByMap: Object.entries(stats2.maps).map(([name, count]) => ({ name, count })).sort((a: any, b: any) => b.count - a.count),
            phases: {
              early: { count: stats2.phases.early, pct: totKills2 > 0 ? ((stats2.phases.early / totKills2) * 100).toFixed(1) : '0.0' },
              mid: { count: stats2.phases.mid, pct: totKills2 > 0 ? ((stats2.phases.mid / totKills2) * 100).toFixed(1) : '0.0' },
              late: { count: stats2.phases.late, pct: totKills2 > 0 ? ((stats2.phases.late / totKills2) * 100).toFixed(1) : '0.0' },
            },
            totalKills: totKills2,
            totalDeaths: Object.values(stats2.deaths).reduce((acc: any, curr: any) => acc + curr, 0) as number
        };
    }

    return { safeChart, teamKillsChart, teamDeathsChart, roundChart, mapChart, comp1, comp2 };
  }, [filteredFeed, playerToTeamMap, tab, compareType, compareItem1, compareItem2, data.killFeed]);

  const getWeaponImg = (name: string) => {
      if (!name) return undefined;
      const w = data.weapons.find(w => w.Arma.trim().toLowerCase() === name.trim().toLowerCase());
      return w?.IMG;
  };

  const getSafeImg = (name: string) => {
      if (!name) return undefined;
      const cleanName = name.replace(/^Safe\s+/i, '').trim().toLowerCase();
      const s = data.safes.find(s => s.Safe.trim().toLowerCase() === cleanName);
      return s?.IMG;
  };

  const getTeamImg = (name: string) => {
    if (!name) return undefined;
    return findTeamLogo(name, data.teamsReference) || undefined;
  };

  const getPlayerImg = (name: string, isVictim: boolean = false) => {
      if (!name) return undefined;
      const cleanName = normalize(name);
      if (isVictim) {
          return data.victimsDimension.find(p => normalize(p.Name) === cleanName)?.IMG;
      } else {
          return data.playersDimension.find(p => normalize(p.Name) === cleanName)?.IMG;
      }
  };

  const getPlayerRole = (name: string) => {
      if (!name) return null;
      const pRoles = playerRolesMap.get(normalize(name));
      if (!pRoles) return null;
      const r1 = pRoles.role1;
      const r2 = pRoles.role2;
      if (r1 && r1 !== 'N/A' && r1 !== '-') return r1;
      if (r2 && r2 !== 'N/A' && r2 !== '-') return r2;
      return null;
  };

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const killerPlayerList = Object.entries(stats.killerPlayerCounts).map(([name, count]) => ({name, count: count as number}));
  const victimPlayerList = Object.entries(stats.victimPlayerCounts).map(([name, count]) => ({name, count: count as number}));
  const killerTeamList = Object.entries(stats.killerTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const victimTeamList = Object.entries(stats.victimTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const totalEvents = filteredFeed.length;

  const openFullListModal = (
    title: string,
    items: Array<{ name: string; count: number }>,
    type: 'weapon' | 'team' | 'player' | 'safe',
    isVictimList?: boolean,
    onSelect?: (name: string) => void,
    activeValues?: string[]
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      items,
      totalCount: totalEvents,
      type,
      isVictimList,
      onSelect,
      activeValues,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic text-white flex items-center gap-2 uppercase tracking-wide">
                {tab === 'kills' ? <Crosshair className="text-green-500" size={28}/> : <ShieldAlert className="text-red-600" size={28}/>}
                {tab === 'kills' ? 'MUNDIAL 2025 • Central de Abates' : 'MUNDIAL 2025 • Análise de Baixas'}
            </h2>
            <div className="flex bg-black p-1.5 rounded-xl border border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={() => { setTab('kills'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'kills' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <Crosshair size={14} /> LETAIS
                </button>
                <button 
                    onClick={() => { setTab('deaths'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'deaths' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <ShieldAlert size={14} /> VÍTIMAS
                </button>
                <button 
                    onClick={() => { setTab('fases'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'fases' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <Flame size={14} /> FASES DO JOGO
                </button>
                <button 
                    onClick={() => { setTab('comparativo'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 uppercase tracking-widest ${tab === 'comparativo' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <BarChart3 size={14} /> COMPARATIVO
                </button>
            </div>
        </div>
        
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} defaultOpen={false} />

        {/* BARRA DE GESTÃO DE SEÇÕES & VISUALIZAÇÃO COMPLETA */}
        <div className="bg-[#121217] p-3.5 rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mr-1">
                    <Eye size={14} className="text-yellow-400" /> Exibir Seções:
                </span>

                <button
                    onClick={() => setSectionVisibility(prev => ({ ...prev, phaseFilter: !prev.phaseFilter }))}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                        sectionVisibility.phaseFilter 
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                            : 'bg-black/40 text-gray-500 border-white/5 line-through opacity-60'
                    }`}
                >
                    {sectionVisibility.phaseFilter ? <Eye size={12} className="text-blue-400" /> : <EyeOff size={12} />}
                    Filtro por Fase
                </button>

                <button
                    onClick={() => setSectionVisibility(prev => ({ ...prev, phaseHighlights: !prev.phaseHighlights }))}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                        sectionVisibility.phaseHighlights 
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                            : 'bg-black/40 text-gray-500 border-white/5 line-through opacity-60'
                    }`}
                >
                    {sectionVisibility.phaseHighlights ? <Eye size={12} className="text-amber-400" /> : <EyeOff size={12} />}
                    Destaques de Ritmo
                </button>

                <button
                    onClick={() => setSectionVisibility(prev => ({ ...prev, rankingsGrid: !prev.rankingsGrid }))}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                        sectionVisibility.rankingsGrid 
                            ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' 
                            : 'bg-black/40 text-gray-500 border-white/5 line-through opacity-60'
                    }`}
                >
                    {sectionVisibility.rankingsGrid ? <Eye size={12} className="text-yellow-400" /> : <EyeOff size={12} />}
                    Arsenal & Rankings
                </button>

                <button
                    onClick={() => setSectionVisibility(prev => ({ ...prev, killLog: !prev.killLog }))}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                        sectionVisibility.killLog 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                            : 'bg-black/40 text-gray-500 border-white/5 line-through opacity-60'
                    }`}
                >
                    {sectionVisibility.killLog ? <Eye size={12} className="text-emerald-400" /> : <EyeOff size={12} />}
                    Live Kill Log
                </button>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setExpandAllLists(prev => !prev)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border shadow-sm ${
                        expandAllLists
                            ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                            : 'bg-black/60 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/10'
                    }`}
                    title="Alternar entre modo compacto com barra de rolagem ou expandir todas as 6 listas completas na tela"
                >
                    <ChevronsUpDown size={13} />
                    {expandAllLists ? 'Recolher Todas as Listas' : 'Expandir Todas as Listas (Ver Inteiras)'}
                </button>

                <button
                    onClick={() => {
                        const anyVisible = Object.values(sectionVisibility).some(Boolean);
                        setSectionVisibility({
                            phaseFilter: !anyVisible,
                            phaseHighlights: !anyVisible,
                            rankingsGrid: !anyVisible,
                            killLog: !anyVisible,
                        });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase transition-all"
                >
                    {Object.values(sectionVisibility).some(Boolean) ? 'Ocultar Todas' : 'Mostrar Todas'}
                </button>
            </div>
        </div>

        {/* BARRA DE FILTRO RÁPIDO POR FASE DE JOGO (EARLY, MID & LATE GAME) */}
        {sectionVisibility.phaseFilter ? (
          <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <Flame size={18} className="text-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-white uppercase italic tracking-wider">
                        Filtro por Fase de Jogo (Ritmo & Agressividade)
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:inline">
                        Early (S1-S2) • Mid (S3-S4) • Late / End (S5+)
                    </span>
                    <button
                        onClick={() => setSectionVisibility(prev => ({ ...prev, phaseFilter: false }))}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Ocultar esta seção"
                    >
                        <ChevronUp size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* TODAS */}
                <button
                    onClick={() => setGamePhaseFilter('ALL')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gamePhaseFilter === 'ALL'
                            ? 'bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                            : 'bg-black/60 border-white/10 hover:border-white/20'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Todas as Fases</span>
                        <Zap size={14} className={gamePhaseFilter === 'ALL' ? 'text-yellow-400' : 'text-gray-600'} />
                    </div>
                    <div className="mt-2">
                        <span className="text-lg font-black text-white italic">{basePhaseStats.total}</span>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase mt-0.5">100% dos Confrontos</span>
                    </div>
                </button>

                {/* EARLY GAME */}
                <button
                    onClick={() => setGamePhaseFilter(gamePhaseFilter === 'EARLY' ? 'ALL' : 'EARLY')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gamePhaseFilter === 'EARLY'
                            ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'bg-black/60 border-white/10 hover:border-blue-500/40'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Early Game (S1-S2)</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">Início</span>
                    </div>
                    <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-blue-400 italic">{basePhaseStats.early.count}</span>
                            <span className="text-xs font-black text-gray-400">({basePhaseStats.early.pct}%)</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase mt-0.5">Drops & Primeiras Trocas</span>
                    </div>
                </button>

                {/* MID GAME */}
                <button
                    onClick={() => setGamePhaseFilter(gamePhaseFilter === 'MID' ? 'ALL' : 'MID')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gamePhaseFilter === 'MID'
                            ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                            : 'bg-black/60 border-white/10 hover:border-orange-500/40'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Mid Game (S3-S4)</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">Meio</span>
                    </div>
                    <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-orange-400 italic">{basePhaseStats.mid.count}</span>
                            <span className="text-xs font-black text-gray-400">({basePhaseStats.mid.pct}%)</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase mt-0.5">Rotações & Emboscadas</span>
                    </div>
                </button>

                {/* LATE GAME / ENDGAME */}
                <button
                    onClick={() => setGamePhaseFilter(gamePhaseFilter === 'LATE' ? 'ALL' : 'LATE')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        gamePhaseFilter === 'LATE'
                            ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                            : 'bg-black/60 border-white/10 hover:border-rose-500/40'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Late Game / End (S5+)</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">Final</span>
                    </div>
                    <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-rose-400 italic">{basePhaseStats.late.count}</span>
                            <span className="text-xs font-black text-gray-400">({basePhaseStats.late.pct}%)</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold block uppercase mt-0.5">Fechamentos & Booyah</span>
                    </div>
                </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setSectionVisibility(prev => ({ ...prev, phaseFilter: true }))}
            className="p-3 rounded-xl bg-[#121217] border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Flame size={14} className="text-amber-500 opacity-70" />
              <span className="text-[11px] font-black uppercase italic text-gray-400">
                Filtro por Fase de Jogo (Seção Oculta)
              </span>
            </div>
            <span className="text-[9px] font-black uppercase text-yellow-400 flex items-center gap-1">
              <Eye size={11} /> Clique para Mostrar
            </span>
          </div>
        )}

        {/* DESTAQUES DE AGRESSIVIDADE POR FASE */}
        {sectionVisibility.phaseHighlights ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase italic text-gray-400 flex items-center gap-1.5">
                <Zap size={13} className="text-yellow-400" /> Destaques de Agressividade por Momento de Partida
              </span>
              <button
                onClick={() => setSectionVisibility(prev => ({ ...prev, phaseHighlights: false }))}
                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                title="Ocultar destaques de ritmo"
              >
                <ChevronUp size={12} /> Ocultar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Early Game Profile */}
                <div className="bg-[#151515] p-4 rounded-xl border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                        <span className="text-xs font-black text-blue-400 uppercase italic flex items-center gap-1.5">
                            <Sparkles size={14} /> Early Game (Safes 1-2)
                        </span>
                        <span className="text-[10px] font-black text-white bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                            {stats.phaseBreakdown.early.count} Abates ({stats.phaseBreakdown.early.pct}%)
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Top Equipes Letais</span>
                        {stats.phaseBreakdown.early.topTeams.slice(0, 3).map((t, idx) => (
                            <div key={t.name} className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-400">#{idx + 1}</span>
                                    <span className="font-bold text-white uppercase italic">{t.name}</span>
                                </div>
                                <span className="font-black text-blue-400">{t.count} K</span>
                            </div>
                        ))}
                        {stats.phaseBreakdown.early.topTeams.length === 0 && (
                            <span className="text-[10px] text-gray-500 italic">Sem abates registrados nesta fase.</span>
                        )}
                    </div>
                </div>

                {/* Mid Game Profile */}
                <div className="bg-[#151515] p-4 rounded-xl border border-orange-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                        <span className="text-xs font-black text-orange-400 uppercase italic flex items-center gap-1.5">
                            <Zap size={14} /> Mid Game (Safes 3-4)
                        </span>
                        <span className="text-[10px] font-black text-white bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">
                            {stats.phaseBreakdown.mid.count} Abates ({stats.phaseBreakdown.mid.pct}%)
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Top Equipes Letais</span>
                        {stats.phaseBreakdown.mid.topTeams.slice(0, 3).map((t, idx) => (
                            <div key={t.name} className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-orange-400">#{idx + 1}</span>
                                    <span className="font-bold text-white uppercase italic">{t.name}</span>
                                </div>
                                <span className="font-black text-orange-400">{t.count} K</span>
                            </div>
                        ))}
                        {stats.phaseBreakdown.mid.topTeams.length === 0 && (
                            <span className="text-[10px] text-gray-500 italic">Sem abates registrados nesta fase.</span>
                        )}
                    </div>
                </div>

                {/* Late Game Profile */}
                <div className="bg-[#151515] p-4 rounded-xl border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                        <span className="text-xs font-black text-rose-400 uppercase italic flex items-center gap-1.5">
                            <Flame size={14} /> Late Game / End (Safes 5+)
                        </span>
                        <span className="text-[10px] font-black text-white bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                            {stats.phaseBreakdown.late.count} Abates ({stats.phaseBreakdown.late.pct}%)
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Top Equipes Letais</span>
                        {stats.phaseBreakdown.late.topTeams.slice(0, 3).map((t, idx) => (
                            <div key={t.name} className="flex justify-between items-center bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-rose-400">#{idx + 1}</span>
                                    <span className="font-bold text-white uppercase italic">{t.name}</span>
                                </div>
                                <span className="font-black text-rose-400">{t.count} K</span>
                            </div>
                        ))}
                        {stats.phaseBreakdown.late.topTeams.length === 0 && (
                            <span className="text-[10px] text-gray-500 italic">Sem abates registrados nesta fase.</span>
                        )}
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setSectionVisibility(prev => ({ ...prev, phaseHighlights: true }))}
            className="p-3 rounded-xl bg-[#121217] border border-white/5 flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-yellow-400 opacity-70" />
              <span className="text-[11px] font-black uppercase italic text-gray-400">
                Destaques de Agressividade por Momento (Seção Oculta)
              </span>
            </div>
            <span className="text-[9px] font-black uppercase text-yellow-400 flex items-center gap-1">
              <Eye size={11} /> Clique para Mostrar
            </span>
          </div>
        )}

        {tab === 'fases' ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                <Flame size={20} className="text-orange-500"/> AGRESSIVIDADE POR FASE DO JOGO (TODAS AS EQUIPES)
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Ranking completo de kills: Early, Mid e Late Game</p>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto w-full rounded-2xl border border-gray-800/60 shadow-inner">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0f0f0f] border-b border-gray-800 text-gray-400 text-[10px] uppercase font-black tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-center w-16">#</th>
                                    <th className="px-6 py-4">Equipe</th>
                                    <th className="px-6 py-4 text-center text-blue-400">Early (S1-S2)</th>
                                    <th className="px-6 py-4 text-center text-orange-400">Mid (S3-S4)</th>
                                    <th className="px-6 py-4 text-center text-rose-400">Late (S5+)</th>
                                    <th className="px-6 py-4 text-center text-emerald-400">Total Fases</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {allTeamsPhaseStats.map((team, idx) => (
                                    <tr key={team.name} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-center text-gray-500 font-black">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-black rounded-lg border border-gray-800 p-1 flex items-center justify-center">
                                                    {getTeamImg(team.name) ? <img src={getTeamImg(team.name)} alt={team.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-600" size={14} />}
                                                </div>
                                                <span className="font-black text-white uppercase italic tracking-wider">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-black text-blue-400 text-lg">{team.earlyKills}</span>
                                                <span className="text-[10px] text-gray-500 font-bold">{team.earlyPct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-black text-orange-400 text-lg">{team.midKills}</span>
                                                <span className="text-[10px] text-gray-500 font-bold">{team.midPct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-black text-rose-400 text-lg">{team.lateKills}</span>
                                                <span className="text-[10px] text-gray-500 font-bold">{team.latePct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-black text-emerald-400 text-xl italic">{team.totalPhaseKills}</span>
                                        </td>
                                    </tr>
                                ))}
                                {allTeamsPhaseStats.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic text-sm">
                                            Nenhum dado encontrado para os filtros atuais.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : tab === 'comparativo' ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Seletor de Comparação */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-yellow-500/30 p-6 shadow-2xl bg-gradient-to-br from-[#1a1a1a] to-black">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <Swords className="text-yellow-500" size={24} />
                                Comparador de Performance
                            </h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Compare métricas entre rodadas ou confrontos</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-black rounded-lg border border-gray-800 p-1">
                                <button 
                                    onClick={() => { setCompareType('RD'); setCompareItem1(''); setCompareItem2(''); }}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all uppercase ${compareType === 'RD' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Rodada
                                </button>
                                <button 
                                    onClick={() => { setCompareType('CONFRONTO'); setCompareItem1(''); setCompareItem2(''); }}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all uppercase ${compareType === 'CONFRONTO' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Confronto
                                </button>
                            </div>

                            <select 
                                value={compareItem1}
                                onChange={(e) => setCompareItem1(e.target.value)}
                                className="bg-black border border-gray-800 text-white text-[11px] font-bold px-4 py-2 rounded-lg focus:border-yellow-500 outline-none min-w-[140px] uppercase"
                            >
                                <option value="">Selecionar 1</option>
                                {(compareType === 'RD' ? filterOptions.rounds : filterOptions.confrontations).map(opt => (
                                    <option key={opt} value={opt}>{compareType === 'RD' ? `Rodada ${opt}` : opt}</option>
                                ))}
                            </select>

                            <div className="text-yellow-500 font-black italic text-sm px-2">VS</div>

                            <select 
                                value={compareItem2}
                                onChange={(e) => setCompareItem2(e.target.value)}
                                className="bg-black border border-gray-800 text-white text-[11px] font-bold px-4 py-2 rounded-lg focus:border-yellow-500 outline-none min-w-[140px] uppercase"
                            >
                                <option value="">Selecionar 2</option>
                                {(compareType === 'RD' ? filterOptions.rounds : filterOptions.confrontations).map(opt => (
                                    <option key={opt} value={opt}>{compareType === 'RD' ? `Rodada ${opt}` : opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {compareItem1 && compareItem2 && comparativeData?.comp1 && comparativeData?.comp2 ? (
                    <div className="space-y-12">
                        {/* Ritmo de Jogo: Comparativo Early, Mid e Late Game */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-500/30"></div>
                                <h4 className="text-amber-400 font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                                    <Flame size={14} className="text-amber-500" /> Ritmo de Jogo & Fases (Early / Mid / Late)
                                </h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-500/30"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Comp 1 Phase Stats */}
                                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-black text-white uppercase italic tracking-wider">
                                            {compareType} {compareItem1}
                                        </span>
                                        <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                            {comparativeData.comp1.totalKills} Abates Totais
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Early */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-blue-400 flex items-center gap-1">
                                                    <Sparkles size={12} /> Early Game (S1-S2)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp1.phases.early.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp1.phases.early.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${comparativeData.comp1.phases.early.pct}%` }} />
                                            </div>
                                        </div>
                                        {/* Mid */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-orange-400 flex items-center gap-1">
                                                    <Zap size={12} /> Mid Game (S3-S4)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp1.phases.mid.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp1.phases.mid.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${comparativeData.comp1.phases.mid.pct}%` }} />
                                            </div>
                                        </div>
                                        {/* Late */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-rose-400 flex items-center gap-1">
                                                    <Flame size={12} /> Late Game / End (S5+)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp1.phases.late.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp1.phases.late.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${comparativeData.comp1.phases.late.pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comp 2 Phase Stats */}
                                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-black text-white uppercase italic tracking-wider">
                                            {compareType} {compareItem2}
                                        </span>
                                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                            {comparativeData.comp2.totalKills} Abates Totais
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Early */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-blue-400 flex items-center gap-1">
                                                    <Sparkles size={12} /> Early Game (S1-S2)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp2.phases.early.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp2.phases.early.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${comparativeData.comp2.phases.early.pct}%` }} />
                                            </div>
                                        </div>
                                        {/* Mid */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-orange-400 flex items-center gap-1">
                                                    <Zap size={12} /> Mid Game (S3-S4)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp2.phases.mid.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp2.phases.mid.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${comparativeData.comp2.phases.mid.pct}%` }} />
                                            </div>
                                        </div>
                                        {/* Late */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-rose-400 flex items-center gap-1">
                                                    <Flame size={12} /> Late Game / End (S5+)
                                                </span>
                                                <span className="text-white font-black">
                                                    {comparativeData.comp2.phases.late.count} K <span className="text-gray-400 text-[10px]">({comparativeData.comp2.phases.late.pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${comparativeData.comp2.phases.late.pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Times com Mais Abates */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/30"></div>
                                <h4 className="text-yellow-500 font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                                    <Target size={14} /> Times com Mais Abates
                                </h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/30"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <RenderList 
                                    title={`${compareType} ${compareItem1}`} 
                                    items={comparativeData.comp1.killsByTeam} 
                                    icon={<Shield size={16} className="text-yellow-500"/>} 
                                    totalCount={comparativeData.comp1.totalKills} 
                                    getImage={getTeamImg}
                                    isTeam
                                />
                                <RenderList 
                                    title={`${compareType} ${compareItem2}`} 
                                    items={comparativeData.comp2.killsByTeam} 
                                    icon={<Shield size={16} className="text-blue-500"/>} 
                                    totalCount={comparativeData.comp2.totalKills} 
                                    getImage={getTeamImg}
                                    isTeam
                                />
                            </div>
                        </div>

                        {/* Times que Mais Morrem */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/30"></div>
                                <h4 className="text-red-500 font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                                    <Skull size={14} /> Times que Mais Morrem
                                </h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-500/30"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <RenderList 
                                    title={`${compareType} ${compareItem1}`} 
                                    items={comparativeData.comp1.deathsByTeam} 
                                    icon={<Skull size={16} className="text-red-500"/>} 
                                    totalCount={comparativeData.comp1.totalDeaths} 
                                    getImage={getTeamImg}
                                    isTeam
                                    isVictimList
                                />
                                <RenderList 
                                    title={`${compareType} ${compareItem2}`} 
                                    items={comparativeData.comp2.deathsByTeam} 
                                    icon={<Skull size={16} className="text-red-500"/>} 
                                    totalCount={comparativeData.comp2.totalDeaths} 
                                    getImage={getTeamImg}
                                    isTeam
                                    isVictimList
                                />
                            </div>
                        </div>

                        {/* Abates por Safe */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-blue-500/30"></div>
                                <h4 className="text-blue-500 font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                                    <Disc size={14} /> Abates por Safe Zone
                                </h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-blue-500/30"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <RenderList 
                                    title={`${compareType} ${compareItem1}`} 
                                    items={comparativeData.comp1.killsBySafe} 
                                    icon={<Disc size={16} className="text-blue-500"/>} 
                                    totalCount={comparativeData.comp1.totalKills} 
                                    getImage={getSafeImg}
                                />
                                <RenderList 
                                    title={`${compareType} ${compareItem2}`} 
                                    items={comparativeData.comp2.killsBySafe} 
                                    icon={<Disc size={16} className="text-blue-500"/>} 
                                    totalCount={comparativeData.comp2.totalKills} 
                                    getImage={getSafeImg}
                                />
                            </div>
                        </div>

                        {/* Abates por Mapa */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500/30"></div>
                                <h4 className="text-green-500 font-black uppercase italic tracking-widest text-xs flex items-center gap-2">
                                    <MapPin size={14} /> Abates por Mapa
                                </h4>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500/30"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <RenderList 
                                    title={`${compareType} ${compareItem1}`} 
                                    items={comparativeData.comp1.killsByMap} 
                                    icon={<MapPin size={16} className="text-green-500"/>} 
                                    totalCount={comparativeData.comp1.totalKills} 
                                />
                                <RenderList 
                                    title={`${compareType} ${compareItem2}`} 
                                    items={comparativeData.comp2.killsByMap} 
                                    icon={<MapPin size={16} className="text-green-500"/>} 
                                    totalCount={comparativeData.comp2.totalKills} 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RenderList 
                            title="Abates por Safe Zone" 
                            items={comparativeData?.safeChart || []} 
                            icon={<Disc size={16} className="text-blue-500"/>} 
                            totalCount={totalEvents} 
                            getImage={getSafeImg}
                            forceExpanded={expandAllLists}
                            onOpenModal={() => openFullListModal(
                                "Abates por Safe Zone • Lista Comparativa",
                                comparativeData?.safeChart || [],
                                'safe'
                            )}
                        />

                        <RenderList 
                            title="Abates por Mapa" 
                            items={comparativeData?.mapChart || []} 
                            icon={<MapPin size={16} className="text-green-500"/>} 
                            totalCount={totalEvents} 
                            forceExpanded={expandAllLists}
                            onOpenModal={() => openFullListModal(
                                "Abates por Mapa • Lista Comparativa",
                                comparativeData?.mapChart || [],
                                'safe'
                            )}
                        />

                        <RenderList 
                            title="Top 10 Times com Mais Abates" 
                            items={comparativeData?.teamKillsChart || []} 
                            icon={<Target size={16} className="text-yellow-500"/>} 
                            totalCount={totalEvents} 
                            getImage={getTeamImg}
                            isTeam
                            forceExpanded={expandAllLists}
                            onOpenModal={() => openFullListModal(
                                "Times com Mais Abates • Comparativo",
                                comparativeData?.teamKillsChart || [],
                                'team',
                                false
                            )}
                        />

                        <RenderList 
                            title="Top 10 Times que Mais Morrem" 
                            items={comparativeData?.teamDeathsChart || []} 
                            icon={<Skull size={16} className="text-red-500"/>} 
                            totalCount={totalEvents} 
                            getImage={getTeamImg}
                            isTeam
                            isVictimList
                            forceExpanded={expandAllLists}
                            onOpenModal={() => openFullListModal(
                                "Times que Mais Morrem • Comparativo",
                                comparativeData?.teamDeathsChart || [],
                                'team',
                                true
                            )}
                        />
                    </div>
                )}
            </div>
        ) : (
            <>
              {sectionVisibility.rankingsGrid ? (
                <div className="space-y-4">
                  <div className="bg-[#121217] px-4 py-3 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <Swords size={18} className={tab === 'kills' ? "text-yellow-400" : "text-red-400"} />
                      <div>
                        <h3 className="text-xs sm:text-sm font-black italic uppercase text-white tracking-wider">
                          {tab === 'kills' ? "Arsenal Fatal & Rankings de Combate" : "Armas Eliminadoras & Vulnerabilidades"}
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          {tab === 'kills' 
                            ? "Armas mais letais, zonas de confronto, times dominantes e top atiradores" 
                            : "Armas que causaram eliminações, safes de risco, times mais eliminados e baixas"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandAllLists(prev => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border ${
                          expandAllLists
                            ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                            : 'bg-black/50 text-gray-300 hover:text-white border-white/10 hover:border-yellow-500/40'
                        }`}
                        title="Alternar entre visualização completa (todas as linhas) ou compacta"
                      >
                        <ChevronsUpDown size={12} />
                        {expandAllLists ? 'Modo Compacto' : 'Ver Listas Inteiras'}
                      </button>

                      <button
                        onClick={() => setSectionVisibility(prev => ({ ...prev, rankingsGrid: false }))}
                        className="p-1.5 rounded-xl bg-black/50 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                        title="Ocultar esta seção de rankings"
                      >
                        <ChevronUp size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* LISTA 1: ARSENAL FATAL */}
                    <StatGrid 
                      title={tab === 'kills' ? "Arsenal Fatal" : "Armas Eliminadoras"} 
                      items={weaponList} 
                      getImage={getWeaponImg} 
                      icon={<Swords size={16}/>} 
                      color="text-orange-500" 
                      onSelect={(val: string) => handleToggleFilter('weapon', val)} 
                      activeValues={filters.weapon} 
                      totalCount={totalEvents}
                      type="weapon"
                      forceExpanded={expandAllLists}
                      onOpenModal={() => openFullListModal(
                        tab === 'kills' ? "Arsenal Fatal • Todas as Armas Utilizadas" : "Armas Eliminadoras • Todas as Armas",
                        weaponList,
                        'weapon',
                        tab === 'deaths',
                        (val) => handleToggleFilter('weapon', val),
                        filters.weapon
                      )}
                    />
                    
                    {/* LISTA 2: CONFRONTOS POR SAFE */}
                    <StatGrid 
                      title="Confrontos por Safe" 
                      items={safeList} 
                      getImage={getSafeImg} 
                      icon={<Disc size={16}/>} 
                      color="text-blue-500" 
                      onSelect={(val: string) => handleToggleFilter('safe', val)} 
                      activeValues={filters.safe} 
                      totalCount={totalEvents}
                      type="safe"
                      forceExpanded={expandAllLists}
                      onOpenModal={() => openFullListModal(
                        "Confrontos por Safe Zone • Todas as Fases",
                        safeList,
                        'safe',
                        false,
                        (val) => handleToggleFilter('safe', val),
                        filters.safe
                      )}
                    />

                    {/* LISTA 3: MAIS LETAIS / MAIS VULNERÁVEIS */}
                    <RenderList 
                      title={tab === 'kills' ? "Mais Letais (Abates)" : "Mais Vulneráveis (Mortes)"} 
                      items={tab === 'kills' ? killerTeamList : victimTeamList} 
                      icon={<Shield size={16} className="text-yellow-500"/>} 
                      totalCount={totalEvents} 
                      getImage={getTeamImg}
                      isTeam
                      onSelect={(name: string) => handleToggleFilter('team', name)}
                      activeValues={filters.team}
                      forceExpanded={expandAllLists}
                      tab={tab}
                      onOpenModal={() => openFullListModal(
                        tab === 'kills' ? "Mais Letais (Abates) • Lista Completa de Equipes" : "Mais Vulneráveis (Mortes) • Lista Completa de Equipes",
                        tab === 'kills' ? killerTeamList : victimTeamList,
                        'team',
                        tab === 'deaths',
                        (name) => handleToggleFilter('team', name),
                        filters.team
                      )}
                    />

                    {/* LISTA 4: EQUIPES QUE MAIS MORREM / MAIS ABATEM */}
                    <RenderList 
                      title={tab === 'kills' ? "Equipes que mais Morrem" : "Equipes que mais Abatem"} 
                      items={tab === 'kills' ? victimTeamList : killerTeamList} 
                      icon={<Skull size={16} className={tab === 'kills' ? "text-red-500" : "text-green-500"}/>} 
                      totalCount={totalEvents} 
                      getImage={getTeamImg}
                      isTeam
                      isVictimList={tab === 'kills'}
                      forceExpanded={expandAllLists}
                      tab={tab}
                      onOpenModal={() => openFullListModal(
                        tab === 'kills' ? "Equipes que mais Morrem • Lista Completa" : "Equipes que mais Abatem • Lista Completa",
                        tab === 'kills' ? victimTeamList : killerTeamList,
                        'team',
                        tab === 'kills'
                      )}
                    />

                    {/* LISTA 5: TOP ATIRADORES / PERFIL DE BAIXAS */}
                    <RenderList 
                      title={tab === 'kills' ? "Top Atiradores" : "Perfil de Baixas"} 
                      items={tab === 'kills' ? killerPlayerList : victimPlayerList} 
                      icon={<User size={16} className="text-yellow-500"/>} 
                      totalCount={totalEvents} 
                      getImage={(name: string) => getPlayerImg(name, tab === 'deaths')}
                      getRole={getPlayerRole}
                      getPlayerTeam={(pName: string) => playerToTeamMap.get(normalize(pName))}
                      getTeamLogo={getTeamImg}
                      isPlayer
                      onSelect={(name: string) => handleToggleFilter('players', name)}
                      activeValues={filters.players}
                      forceExpanded={expandAllLists}
                      tab={tab}
                      onOpenModal={() => openFullListModal(
                        tab === 'kills' ? "Top Atiradores • Lista Completa de Jogadores" : "Perfil de Baixas • Lista Completa de Jogadores",
                        tab === 'kills' ? killerPlayerList : victimPlayerList,
                        'player',
                        tab === 'deaths',
                        (name) => handleToggleFilter('players', name),
                        filters.players
                      )}
                    />

                    {/* LISTA 6: JOGADORES QUE MAIS MORREM / JOGADORES QUE MAIS MATAM */}
                    <RenderList 
                      title={tab === 'kills' ? "Jogadores que mais Morrem" : "Jogadores que mais Matam"} 
                      items={tab === 'kills' ? victimPlayerList : killerPlayerList} 
                      icon={<Skull size={16} className={tab === 'kills' ? "text-red-500" : "text-green-500"}/>} 
                      totalCount={totalEvents} 
                      getImage={(name: string) => getPlayerImg(name, tab === 'kills')}
                      getRole={getPlayerRole}
                      getPlayerTeam={(pName: string) => playerToTeamMap.get(normalize(pName))}
                      getTeamLogo={getTeamImg}
                      isPlayer
                      isVictimList={tab === 'kills'}
                      forceExpanded={expandAllLists}
                      tab={tab}
                      onOpenModal={() => openFullListModal(
                        tab === 'kills' ? "Jogadores que mais Morrem • Lista Completa de Atletas" : "Jogadores que mais Matam • Lista Completa de Atletas",
                        tab === 'kills' ? victimPlayerList : killerPlayerList,
                        'player',
                        tab === 'kills'
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setSectionVisibility(prev => ({ ...prev, rankingsGrid: true }))}
                  className="p-4 rounded-2xl bg-[#121217] border border-white/10 flex items-center justify-between cursor-pointer hover:border-yellow-500/40 transition-colors shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <Swords size={18} className="text-yellow-400 opacity-60" />
                    <div>
                      <span className="text-xs font-black uppercase italic text-gray-200 block">
                        Arsenal & Rankings de Combate (Seção Oculta)
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {weaponList.length} Armas • {safeList.length} Safes • {killerTeamList.length} Times • {killerPlayerList.length} Atletas
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5">
                    <Eye size={12} /> Clique para Mostrar Seção
                  </span>
                </div>
              )}
            </>
        )}

        {/* LIVE KILL LOG */}
        {sectionVisibility.killLog ? (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-black/60 p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-black italic text-white flex items-center gap-3 uppercase tracking-tighter">
                    <History className="text-yellow-500" size={20} />
                    Live Kill Log - {tab === 'kills' ? 'ABATES' : 'MORTES'}
                </h3>
                <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{totalEvents} Eventos Filtrados</span>
                    <button
                        onClick={() => setSectionVisibility(prev => ({ ...prev, killLog: false }))}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                        title="Ocultar tabela Live Kill Log"
                    >
                        <ChevronUp size={16} />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#050505] text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">
                        <tr>
                            <th className="px-6 py-4">Confronto</th>
                            <th className="px-6 py-4">Arma Utilizada</th>
                            <th className="px-6 py-4">Zona / Safe</th>
                            <th className="px-6 py-4">Ambiente / Rodada</th>
                            <th className="px-6 py-4 text-center">Tag</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {filteredFeed.length > 0 ? filteredFeed.map((k, i) => {
                            const killerTeam = playerToTeamMap.get(normalize(k.PLAYER));
                            const victimTeam = playerToTeamMap.get(normalize(k.VITIMA));
                            const killerRole = getPlayerRole(k.PLAYER);
                            const victimRole = getPlayerRole(k.VITIMA);
                            const isKillerSelected = killerTeam && filters.team.includes(killerTeam);
                            const isVictimSelected = victimTeam && filters.team.includes(victimTeam);

                            return (
                                <tr key={i} className={`hover:bg-white/5 transition-colors group ${isKillerSelected || isVictimSelected ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-sm font-black italic uppercase ${isKillerSelected ? 'text-yellow-500 underline' : tab === 'kills' ? 'text-green-500' : 'text-gray-400'}`}>
                                                            {k.PLAYER}
                                                        </span>
                                                        {killerRole && (
                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                {killerRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Swords size={12} className="text-gray-700" />
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-sm font-black italic uppercase ${isVictimSelected ? 'text-yellow-500 underline' : tab === 'deaths' ? 'text-red-500' : 'text-gray-400'}`}>
                                                            {k.VITIMA}
                                                        </span>
                                                        {victimRole && (
                                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                                {victimRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isKillerSelected ? 'text-yellow-500/80' : 'text-gray-600'}`}>
                                                        {killerTeam || 'N/A'}
                                                    </span>
                                                    <span className="text-gray-800">•</span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isVictimSelected ? 'text-yellow-500/80' : 'text-gray-600'}`}>
                                                        {victimTeam || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-black rounded border border-gray-800 p-1 flex items-center justify-center shadow-inner">
                                                {getWeaponImg(k.ARMA) ? <img src={getWeaponImg(k.ARMA)} alt={k.ARMA} className="w-full h-full object-contain" /> : <Swords size={14} className="opacity-20 text-gray-400" />}
                                            </div>
                                            <span className="text-[11px] font-black text-white uppercase italic tracking-tighter">{k.ARMA}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const ph = getGamePhase(k.SAFE);
                                            let badgeCls = "bg-gray-800 text-gray-400 border-gray-700";
                                            let phaseLabel = "Safe " + (k.SAFE || "-");
                                            if (ph === 'EARLY') {
                                                badgeCls = "bg-blue-500/10 text-blue-400 border-blue-500/30";
                                            } else if (ph === 'MID') {
                                                badgeCls = "bg-orange-500/10 text-orange-400 border-orange-500/30";
                                            } else if (ph === 'LATE') {
                                                badgeCls = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                                            }

                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Disc size={13} className={ph === 'EARLY' ? 'text-blue-400' : ph === 'MID' ? 'text-orange-400' : ph === 'LATE' ? 'text-rose-400' : 'text-gray-400'} />
                                                        <span className="text-[11px] font-black text-white uppercase italic">{phaseLabel}</span>
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block w-fit ${badgeCls}`}>
                                                        {ph === 'EARLY' ? 'Early Game' : ph === 'MID' ? 'Mid Game' : ph === 'LATE' ? 'Late / Endgame' : 'Safe'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-yellow-500 opacity-50" />
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{k.MAPA}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-600 font-bold mt-1">Rd {k.RD} • Q{k.Q}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 text-[9px] font-mono text-gray-500 group-hover:text-yellow-500 transition-colors">
                                            <Target size={10} /> {k.CONFRONTO}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-gray-700 font-black italic uppercase tracking-widest opacity-20">
                                    Nenhum log disponível para os filtros atuais
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setSectionVisibility(prev => ({ ...prev, killLog: true }))}
            className="p-4 rounded-2xl bg-[#1a1a1a] border border-gray-800 flex items-center justify-between cursor-pointer hover:border-gray-700 transition-colors shadow-lg"
          >
            <div className="flex items-center gap-3">
              <History size={18} className="text-yellow-500 opacity-60" />
              <div>
                <span className="text-xs font-black uppercase italic text-gray-200 block">
                  Live Kill Log ({tab === 'kills' ? 'ABATES' : 'MORTES'}) - Seção Oculta
                </span>
                <span className="text-[10px] font-mono text-gray-500">{totalEvents} Eventos Filtrados</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-yellow-400 flex items-center gap-1.5">
              <Eye size={12} /> Clique para Mostrar Log
            </span>
          </div>
        )}

      {/* MODAL DE LISTA COMPLETA EM TELA CHEIA */}
      {modalConfig && (
        <FullListModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          title={modalConfig.title}
          items={modalConfig.items}
          totalCount={modalConfig.totalCount}
          type={modalConfig.type}
          getImage={(name) => {
            if (modalConfig.type === 'weapon') return getWeaponImg(name);
            if (modalConfig.type === 'team') return getTeamImg(name);
            if (modalConfig.type === 'safe') return getSafeImg(name);
            return getPlayerImg(name, modalConfig.isVictimList);
          }}
          getRole={getPlayerRole}
          getPlayerTeam={(pName) => playerToTeamMap.get(normalize(pName))}
          getTeamLogo={getTeamImg}
          isVictimList={modalConfig.isVictimList}
          activeValues={modalConfig.activeValues}
          onSelect={modalConfig.onSelect}
          tab={tab === 'deaths' ? 'deaths' : 'kills'}
        />
      )}
    </div>
  );
};

const RenderList = ({ 
  title, 
  items, 
  icon, 
  totalCount, 
  getImage, 
  getRole, 
  getPlayerTeam,
  getTeamLogo,
  isTeam, 
  isPlayer, 
  onSelect, 
  activeValues = [], 
  isVictimList,
  forceExpanded = false,
  onOpenModal,
  tab = 'kills'
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const effectiveExpanded = forceExpanded || isExpanded;

  const sortedItems = useMemo(() => {
    return [...items].sort((a: any, b: any) => b.count - a.count);
  }, [items]);

  const displayItems = effectiveExpanded ? sortedItems : sortedItems.slice(0, 8);

  const getRankBadgeClass = (idx: number) => {
    if (idx === 0) return 'text-yellow-400 font-bold bg-yellow-500/10 border-yellow-500/30';
    if (idx === 1) return 'text-slate-300 font-bold bg-slate-400/10 border-slate-400/30';
    if (idx === 2) return 'text-amber-500 font-bold bg-amber-600/10 border-amber-600/30';
    return 'text-gray-500 bg-white/5 border-white/5';
  };

  return (
    <div className={`bg-[#16161b] rounded-2xl border ${isVictimList ? 'border-red-500/20' : 'border-white/10'} overflow-hidden flex flex-col h-full shadow-xl transition-all`}>
      {/* HEADER DO CARD */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-black/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <h3 className={`font-black uppercase text-[11px] sm:text-xs tracking-wider truncate ${isVictimList ? 'text-red-400' : 'text-white'}`}>
            {title}
          </h3>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 shrink-0">
            {items.length} {isTeam ? 'Times' : isPlayer ? 'Atletas' : 'Itens'}
          </span>
        </div>

        {/* AÇÕES NO TOPO DO CARD */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 border border-white/5 transition-colors"
              title="Abrir lista completa em tela cheia"
            >
              <Maximize2 size={13} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              effectiveExpanded 
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
            }`}
            title={effectiveExpanded ? 'Recolher para modo compacto' : 'Expandir lista inteira no card'}
          >
            <ChevronsUpDown size={13} />
          </button>

          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
            title={isMinimized ? 'Expandir conteúdo do card' : 'Minimizar card'}
          >
            {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* CORPO DO CARD */}
      {!isMinimized && (
        <>
          <div className={`p-2 space-y-1.5 custom-scrollbar bg-black/20 ${
            effectiveExpanded ? 'max-h-none overflow-visible' : 'overflow-y-auto max-h-[380px]'
          }`}>
            {displayItems.map((item: any, i: number) => {
              const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
              const img = getImage && getImage(item.name);
              const role = getRole && getRole(item.name);
              const playerTeam = getPlayerTeam && getPlayerTeam(item.name);
              const teamLogo = playerTeam && getTeamLogo && getTeamLogo(playerTeam);
              const isActive = activeValues.includes(item.name);

              return (
                <div 
                  key={item.name} 
                  onClick={() => onSelect && onSelect(item.name)}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                    onSelect ? 'cursor-pointer hover:bg-white/5 hover:border-gray-700' : 'cursor-default border-transparent'
                  } group ${
                    isActive 
                      ? 'bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.01]' 
                      : 'border-white/5 bg-[#121217]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border text-center min-w-6 ${getRankBadgeClass(i)}`}>
                      #{i + 1}
                    </span>

                    {(isTeam || isPlayer) && (
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-lg border p-1 flex items-center justify-center transition-colors bg-black ${
                          isActive ? 'border-yellow-500' : 'border-white/10'
                        }`}>
                          {img ? (
                            <img 
                              src={img} 
                              className={`w-full h-full ${isPlayer ? 'object-cover rounded-full' : 'object-contain'}`} 
                              alt={item.name}
                            />
                          ) : isTeam ? (
                            <Shield size={14} className="opacity-20 text-gray-400" />
                          ) : (
                            <User size={14} className="opacity-20 text-gray-400" />
                          )}
                        </div>
                        {isPlayer && teamLogo && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-white/20 p-0.5 shadow">
                            <img src={teamLogo} alt={playerTeam} className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-black truncate block uppercase italic leading-tight ${
                          isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-gray-200 group-hover:text-white'
                        }`}>
                          {item.name}
                        </span>
                        {isPlayer && playerTeam && (
                          <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                            • {playerTeam}
                          </span>
                        )}
                        {role && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400 shrink-0">
                            {role}
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-black/60 h-1.5 mt-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            isVictimList ? 'bg-red-500' : isActive ? 'bg-yellow-400' : 'bg-yellow-500/50 group-hover:bg-yellow-400'
                          }`} 
                          style={{ width: `${Math.min(100, Math.max(3, parseFloat(percent)))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end pl-2 shrink-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md shadow-sm transition-all ${
                      isVictimList 
                        ? 'bg-red-950/60 text-red-400 border border-red-500/30' 
                        : isActive 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-white/5 text-gray-300 border border-white/5 group-hover:bg-yellow-500 group-hover:text-black'
                    }`}>
                      {item.count}
                    </span>
                    <span className="text-[8px] font-mono text-gray-500 mt-0.5">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="p-8 text-center text-gray-600 font-black italic uppercase text-[10px]">
                Nenhum registro encontrado
              </div>
            )}
          </div>

          {/* RODAPÉ DO CARD COM BOTÕES DE EXPANSÃO */}
          <div className="p-2.5 bg-black/50 border-t border-white/5 flex items-center justify-between text-xs gap-2">
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              {effectiveExpanded ? (
                <>
                  <ChevronUp size={12} /> Recolher ({items.length} itens)
                </>
              ) : (
                <>
                  <ChevronDown size={12} /> Ver Lista Inteira ({items.length} itens)
                </>
              )}
            </button>

            {onOpenModal && (
              <button
                onClick={onOpenModal}
                className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-yellow-400 border border-white/10 hover:border-yellow-500/40 flex items-center gap-1 transition-all"
              >
                <Maximize2 size={11} /> Tela Cheia
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatGrid = ({ 
  title, 
  items, 
  getImage, 
  icon, 
  color, 
  onSelect, 
  activeValues = [],
  totalCount,
  forceExpanded = false,
  onOpenModal,
  type = 'weapon'
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const effectiveExpanded = forceExpanded || isExpanded;

  const sortedItems = useMemo(() => {
    return [...items].sort((a: any, b: any) => b.count - a.count);
  }, [items]);

  const displayItems = effectiveExpanded ? sortedItems : sortedItems.slice(0, 8);

  return (
    <div className={`bg-[#16161b] rounded-2xl border ${
      activeValues.length > 0 ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-white/10'
    } flex flex-col h-full shadow-xl overflow-hidden transition-all duration-300`}>
      {/* HEADER DO CARD */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 bg-black/60 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{icon}</span>
          <h3 className={`font-black uppercase text-[11px] sm:text-xs tracking-wider truncate ${color}`}>
            {title}
          </h3>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 shrink-0">
            {items.length} {type === 'safe' ? 'Safes' : 'Armas'}
          </span>
        </div>

        {/* AÇÕES NO TOPO DO CARD */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 border border-white/5 transition-colors"
              title="Abrir arsenal completo em tela cheia com busca e imagens"
            >
              <Maximize2 size={13} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              effectiveExpanded 
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' 
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
            }`}
            title={effectiveExpanded ? 'Recolher para modo compacto' : 'Expandir lista inteira no card'}
          >
            <ChevronsUpDown size={13} />
          </button>

          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-colors"
            title={isMinimized ? 'Expandir conteúdo do card' : 'Minimizar card'}
          >
            {isMinimized ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* CORPO DO CARD */}
      {!isMinimized && (
        <>
          <div className={`p-3.5 bg-black/15 custom-scrollbar ${
            effectiveExpanded ? 'max-h-none overflow-visible' : 'overflow-y-auto max-h-[380px]'
          }`}>
            <div className="grid grid-cols-2 gap-3">
              {displayItems.map((item: any, i: number) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : '0.0';
                const img = getImage && getImage(item.name);
                const isActive = activeValues.includes(item.name);

                return (
                  <div 
                    key={item.name} 
                    onClick={() => onSelect && onSelect(item.name)} 
                    className={`rounded-xl border p-3 flex flex-col items-center justify-between relative group cursor-pointer transition-all shadow-md ${
                      isActive 
                        ? 'bg-yellow-900/20 border-yellow-500 ring-2 ring-yellow-500/30 scale-[1.03] z-10' 
                        : 'bg-[#101014] border-white/5 hover:border-yellow-500/50 hover:bg-[#181820]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        i === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-white/5 text-gray-500 border-white/5'
                      }`}>
                        #{i + 1}
                      </span>
                      <span className="font-bold text-white text-[10px] bg-black/60 px-2 py-0.5 rounded-md border border-white/10 font-mono">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-14 w-full flex items-center justify-center my-1.5 p-1 bg-black/30 rounded-lg border border-white/5">
                      {img ? (
                        <img 
                          src={img} 
                          className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow" 
                          alt={item.name}
                        />
                      ) : (
                        <Swords size={22} className="text-gray-700" />
                      )}
                    </div>

                    <div className="w-full text-center mt-1">
                      <span className={`text-[10px] font-black truncate block uppercase italic tracking-tight ${
                        isActive ? 'text-yellow-400' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        {item.name || "N/A"}
                      </span>
                      
                      <div className="w-full bg-black/60 h-1 mt-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-orange-500 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(4, parseFloat(percent)))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="col-span-2 py-10 text-center text-gray-600 font-black italic uppercase text-[10px]">
                  Sem registros
                </div>
              )}
            </div>
          </div>

          {/* RODAPÉ DO CARD */}
          <div className="p-2.5 bg-black/50 border-t border-white/5 flex items-center justify-between text-xs gap-2">
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              {effectiveExpanded ? (
                <>
                  <ChevronUp size={12} /> Recolher ({items.length} itens)
                </>
              ) : (
                <>
                  <ChevronDown size={12} /> Ver Lista Inteira ({items.length} itens)
                </>
              )}
            </button>

            {onOpenModal && (
              <button
                onClick={onOpenModal}
                className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-yellow-400 border border-white/10 hover:border-yellow-500/40 flex items-center gap-1 transition-all"
              >
                <Maximize2 size={11} /> Tela Cheia
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KillFeedPage;
