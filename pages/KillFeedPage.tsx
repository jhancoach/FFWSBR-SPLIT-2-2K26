
import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX, Shield, History, Clock, MapPin, Target, Skull, BarChart3, TrendingUp, Zap, Flame, Sparkles } from 'lucide-react';
import FilterBar from '../components/FilterBar';
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
  
  const [filters, setFilters] = useState({
    team: [] as string[], 
    players: [] as string[], 
    weapon: [] as string[], 
    safe: [] as string[], 
    map: [] as string[], 
    rodada: [] as string[], 
    queda: [] as string[],
    confrontation: [] as string[],
    grupo: [] as string[]
  });

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Mapeamento de Jogador para Time
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) map.set(normalize(p.PLAYER), p.TIME);
    });
    return map;
  }, [data.players]);

  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
    weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
    safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
    maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.killFeed.map(k => k.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort(),
    quedas: Array.from(new Set(data.killFeed.map(k => k.Q))).filter(Boolean).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[],
  }), [data.killFeed, data.players, data.teamsReference, data.confrontationsDimension, data.details, data.characters]);

  const handleToggleFilter = (key: keyof typeof filters, value: string) => {
      setFilters(prev => {
          const current = prev[key] as string[];
          const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [key]: next };
      });
  };

  const filteredFeed = useMemo(() => {
    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
        if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    return data.killFeed.filter(k => {
      // Filtro de Fase de Jogo (Early / Mid / Late)
      if (gamePhaseFilter !== 'ALL') {
        const ph = getGamePhase(k.SAFE);
        if (ph !== gamePhaseFilter) return false;
      }

      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!(matchRD && matchQ)) return false;

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
  }, [data.killFeed, filters, playerToTeamMap, tab, gamePhaseFilter]);

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

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const killerPlayerList = Object.entries(stats.killerPlayerCounts).map(([name, count]) => ({name, count: count as number}));
  const victimPlayerList = Object.entries(stats.victimPlayerCounts).map(([name, count]) => ({name, count: count as number}));
  const killerTeamList = Object.entries(stats.killerTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const victimTeamList = Object.entries(stats.victimTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const totalEvents = filteredFeed.length;

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
        
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

        {/* BARRA DE FILTRO RÁPIDO POR FASE DE JOGO (EARLY, MID & LATE GAME) */}
        <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                    <Flame size={18} className="text-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-white uppercase italic tracking-wider">
                        Filtro por Fase de Jogo (Ritmo & Agressividade)
                    </span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Early (S1-S2) • Mid (S3-S4) • Late / End (S5+)
                </span>
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

        {/* DESTAQUES DE AGRESSIVIDADE POR FASE */}
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
                        />

                        <RenderList 
                            title="Abates por Mapa" 
                            items={comparativeData?.mapChart || []} 
                            icon={<MapPin size={16} className="text-green-500"/>} 
                            totalCount={totalEvents} 
                        />

                        <RenderList 
                            title="Top 10 Times com Mais Abates" 
                            items={comparativeData?.teamKillsChart || []} 
                            icon={<Target size={16} className="text-yellow-500"/>} 
                            totalCount={totalEvents} 
                            getImage={getTeamImg}
                            isTeam
                        />

                        <RenderList 
                            title="Top 10 Times que Mais Morrem" 
                            items={comparativeData?.teamDeathsChart || []} 
                            icon={<Skull size={16} className="text-red-500"/>} 
                            totalCount={totalEvents} 
                            getImage={getTeamImg}
                            isTeam
                            isVictimList
                        />
                    </div>
                )}
            </div>
        ) : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatGrid 
                title={tab === 'kills' ? "Arsenal Fatal" : "Armas Eliminadoras"} 
                items={weaponList} 
                getImage={getWeaponImg} 
                icon={<Swords size={16}/>} 
                color="text-orange-500" 
                onSelect={(val) => handleToggleFilter('weapon', val)} 
                activeValues={filters.weapon} 
            />
            
            <StatGrid 
                title="Confrontos por Safe" 
                items={safeList} 
                getImage={getSafeImg} 
                icon={<Disc size={16}/>} 
                color="text-blue-500" 
                onSelect={(val) => handleToggleFilter('safe', val)} 
                activeValues={filters.safe} 
            />

            {/* LISTA 3: Clicável para filtrar a lateral */}
            <RenderList 
                title={tab === 'kills' ? "Mais Letais (Abates)" : "Mais Vulneráveis (Mortes)"} 
                items={tab === 'kills' ? killerTeamList : victimTeamList} 
                icon={<Shield size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                onSelect={(name) => handleToggleFilter('team', name)}
                activeValues={filters.team}
            />

            {/* LISTA 4 (RESULTADO): Não clicável, reflete o filtro da Lista 3 */}
            <RenderList 
                title={tab === 'kills' ? "Equipes que mais Morrem" : "Equipes que mais Abatem"} 
                items={tab === 'kills' ? victimTeamList : killerTeamList} 
                icon={<Skull size={16} className={tab === 'kills' ? "text-red-500" : "text-green-500"}/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                isVictimList
                /* onSelect omitido para manter não clicável */
            />

            {/* LISTA 5: Clicável para filtrar a lateral */}
            <RenderList 
                title={tab === 'kills' ? "Top Atiradores" : "Perfil de Baixas"} 
                items={tab === 'kills' ? killerPlayerList : victimPlayerList} 
                icon={<User size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                getImage={(name: string) => getPlayerImg(name, tab === 'deaths')}
                isPlayer
                onSelect={(name: string) => handleToggleFilter('players', name)}
                activeValues={filters.players}
            />

            {/* LISTA 6 (NOVA): Jogadores que mais morrem (na aba letais) ou que mais matam (na aba vítimas) */}
            <RenderList 
                title={tab === 'kills' ? "Jogadores que mais Morrem" : "Jogadores que mais Matam"} 
                items={tab === 'kills' ? victimPlayerList : killerPlayerList} 
                icon={<Skull size={16} className={tab === 'kills' ? "text-red-500" : "text-green-500"}/>} 
                totalCount={totalEvents} 
                getImage={(name: string) => getPlayerImg(name, tab === 'kills')}
                isPlayer
                isVictimList={tab === 'kills'}
                /* onSelect omitido para manter não clicável ou opcional */
            />
        </div>
        </>
        )}

        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-black/60 p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-black italic text-white flex items-center gap-3 uppercase tracking-tighter">
                    <History className="text-yellow-500" size={20} />
                    Live Kill Log - {tab === 'kills' ? 'ABATES' : 'MORTES'}
                </h3>
                <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{totalEvents} Eventos Filtrados</span>
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
                            const isKillerSelected = killerTeam && filters.team.includes(killerTeam);
                            const isVictimSelected = victimTeam && filters.team.includes(victimTeam);

                            return (
                                <tr key={i} className={`hover:bg-white/5 transition-colors group ${isKillerSelected || isVictimSelected ? 'bg-yellow-500/5' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black italic uppercase ${isKillerSelected ? 'text-yellow-500 underline' : tab === 'kills' ? 'text-green-500' : 'text-gray-400'}`}>
                                                        {k.PLAYER}
                                                    </span>
                                                    <Swords size={12} className="text-gray-700" />
                                                    <span className={`text-sm font-black italic uppercase ${isVictimSelected ? 'text-yellow-500 underline' : tab === 'deaths' ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {k.VITIMA}
                                                    </span>
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
    </div>
  );
};

const RenderList = ({ title, items, icon, totalCount, getImage, isTeam, isPlayer, onSelect, activeValues = [], isVictimList }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${isVictimList ? 'border-red-500/20' : 'border-gray-800'} overflow-hidden flex flex-col h-full shadow-lg transition-all ${onSelect ? 'hover:border-yellow-600/30' : ''}`}>
        <div className="p-4 border-b border-gray-800 bg-black/80">
            <h3 className={`font-black uppercase text-[11px] tracking-widest flex items-center gap-2 ${isVictimList ? 'text-red-500' : 'text-white'}`}>
                {icon}{title}
            </h3>
        </div>
        <div className="overflow-y-auto max-h-[400px] p-2 space-y-1 custom-scrollbar bg-black/20">
            {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
                const img = getImage && getImage(item.name);
                const isActive = activeValues.includes(item.name);
                
                return (
                <div 
                    key={i} 
                    onClick={() => onSelect && onSelect(item.name)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all border ${onSelect ? 'cursor-pointer hover:bg-white/5 hover:border-gray-800' : 'cursor-default border-transparent'} group ${isActive ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] scale-[1.02]' : ''}`}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-[10px] font-mono font-bold w-4 ${isActive ? 'text-yellow-500' : 'text-gray-600'}`}>#{i+1}</span>
                        {(isTeam || isPlayer) && (
                            <div className={`w-8 h-8 rounded border p-1 flex items-center justify-center shrink-0 transition-colors bg-black ${isActive ? 'border-yellow-500' : 'border-gray-800'}`}>
                                {img ? <img src={img} className={`w-full h-full ${isPlayer ? 'object-cover rounded-full' : 'object-contain'}`} alt={item.name}/> : isTeam ? <Shield size={12} className="opacity-20" /> : <User size={12} className="opacity-20" />}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 pr-2">
                            <span className={`text-[11px] font-black truncate block group-hover:text-white uppercase italic leading-none ${isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-gray-300'}`}>
                                {item.name}
                            </span>
                            <div className="w-full bg-gray-950 h-1 mt-2 rounded-full overflow-hidden border border-white/5">
                                <div className={`h-full rounded-full transition-all duration-700 ${isVictimList ? 'bg-red-600/40' : isActive ? 'bg-yellow-400' : 'bg-yellow-600/40'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded shadow-sm transition-all ${isVictimList ? 'bg-red-900/40 text-red-500 border border-red-500/30' : isActive ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-400 group-hover:bg-yellow-500 group-hover:text-black'}`}>
                            {item.count}
                        </span>
                    </div>
                </div>
            )})}
            {items.length === 0 && <div className="p-8 text-center text-gray-800 font-black italic uppercase text-[9px]">Sem dados</div>}
        </div>
    </div>
);

const StatGrid = ({ title, items, getImage, icon, color, onSelect, activeValues }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${activeValues.length > 0 ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-gray-800'} flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300`}>
       <div className="p-4 border-b border-gray-800 bg-black/80 flex justify-between items-center">
            <h3 className={`font-black uppercase text-[11px] tracking-widest flex items-center gap-2 ${color}`}>{icon} {title}</h3>
       </div>
       <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar bg-black/10">
            <div className="grid grid-cols-2 gap-3">
                {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => (
                    <div key={i} onClick={() => onSelect && onSelect(item.name)} className={`rounded-xl border p-3 flex flex-col items-center relative group cursor-pointer transition-all shadow-md ${activeValues.includes(item.name) ? 'bg-yellow-900/20 border-yellow-500 scale-[1.05] z-10' : 'bg-[#0f0f0f] border-gray-800 hover:border-yellow-500/50 hover:bg-[#252525]'}`}>
                        <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-600 font-bold">#{i+1}</div>
                        <div className="absolute top-2 right-2 font-bold text-white text-[9px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 shadow-inner">{item.count}</div>
                        <div className="h-10 w-full flex items-center justify-center my-2 mt-4">
                            {getImage && getImage(item.name) ? (
                                <img src={getImage(item.name)} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" alt={item.name}/>
                            ) : (
                                <Swords size={18} className="text-gray-800 opacity-20" />
                            )}
                        </div>
                        <div className={`text-[9px] font-black text-center truncate w-full mt-2 px-1 rounded py-1 border uppercase italic tracking-tighter transition-colors ${activeValues.includes(item.name) ? 'text-black bg-yellow-500 border-yellow-600' : 'text-gray-400 bg-[#151515] border-gray-800/50'}`}>
                            {item.name || "N/A"}
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="col-span-2 py-10 text-center text-gray-800 font-black italic uppercase text-[9px]">Sem registros</div>}
            </div>
       </div>
    </div>
);

export default KillFeedPage;
