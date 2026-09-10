import React, { useState, useMemo } from 'react';
import { DashboardData, MatchDetails } from '../types';
import { getTeamDropComposition, PlayerLoadoutDetailed } from '../utils/characterUtils';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';
import { 
  Zap, 
  Shield, 
  Trophy, 
  Swords, 
  Search, 
  Filter, 
  User, 
  LayoutList, 
  LayoutGrid, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  MapPin, 
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Info,
  Award,
  Target
} from 'lucide-react';

interface TeamDropItem {
  id: string;
  team: string;
  teamLogo?: string;
  grupo?: string;
  rd: string;
  q: string;
  rdNum: number;
  qNum: number;
  mapa: string;
  confronto: string;
  pts: number;
  ptsc: number;
  kills: number;
  pos: number;
  booyah: boolean;
  ondeFechou?: string;
  playersLoadout: PlayerLoadoutDetailed[];
  activeSkillsSummary: { name: string; count: number; img?: string }[];
  activeSkillNames: string[];
}

interface TeamDropCompositionsListProps {
  data: DashboardData;
  initialTeam?: string;
  onSelectPlayer?: (playerName: string) => void;
  onSelectTeam?: (teamName: string) => void;
}

export const TeamDropCompositionsList: React.FC<TeamDropCompositionsListProps> = ({
  data,
  initialTeam,
  onSelectPlayer,
  onSelectTeam,
}) => {
  // Filtros internos
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeam || 'ALL');
  const [selectedRound, setSelectedRound] = useState<string>('ALL');
  const [selectedDrop, setSelectedDrop] = useState<string>('ALL');
  const [selectedMap, setSelectedMap] = useState<string>('ALL');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedPtsRange, setSelectedPtsRange] = useState<string>('ALL');
  const [selectedKillsRange, setSelectedKillsRange] = useState<string>('ALL');
  const [selectedActiveSkill, setSelectedActiveSkill] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'chronological' | 'recent' | 'points' | 'kills' | 'position'>('chronological');
  const [tableSort, setTableSort] = useState<{
    field: 'rd' | 'team' | 'mapa' | 'pos' | 'pts' | 'kills';
    direction: 'asc' | 'desc';
  }>({
    field: 'rd',
    direction: 'asc'
  });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedDrops, setExpandedDrops] = useState<Record<string, boolean>>({});

  // 1. Processar todas as quedas da competição
  const allDropItems: TeamDropItem[] = useMemo(() => {
    if (!data?.details || !Array.isArray(data.details)) return [];

    return data.details.map((d, index) => {
      const rdClean = (d.RD || '1').toString().replace(/\D/g, '');
      const qClean = (d.Q || d.S || '1').toString().replace(/\D/g, '');
      const pts = parseInt(d.PTS) || 0;
      const ptsc = parseInt(d.PTSC) || 0;
      const kills = parseInt(d.ABTS) || 0;
      const pos = parseInt(d.POS) || 0;
      const booyah = pos === 1 || parseInt(d.B) === 1;
      const team = (d.TIME || '').trim();

      const teamRef = data.teamsReference?.find(t => t.TIME && t.TIME.trim().toUpperCase() === team.toUpperCase());
      const teamLogo = findTeamLogo(team, data.teamsReference);

      // Obter os 4 jogadores e seus loadouts nesta queda
      const playersLoadout = getTeamDropComposition(
        data,
        team,
        d.RD,
        d.Q || d.S,
        d.CONFRONTO,
        d.MAPA
      );

      // Contagem e síntese das habilidades ativas
      const activeCounts: Record<string, { count: number; img?: string }> = {};
      const activeNames: string[] = [];

      playersLoadout.forEach(p => {
        if (p.hab1 && p.hab1.trim()) {
          const actName = p.hab1.trim();
          activeNames.push(actName);
          if (!activeCounts[actName]) {
            activeCounts[actName] = { 
              count: 0, 
              img: p.hab1Img || findDimImg(data.hab1, actName) 
            };
          }
          activeCounts[actName].count += 1;
        }
      });

      const activeSkillsSummary = Object.entries(activeCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, item]) => ({
          name,
          count: item.count,
          img: item.img
        }));

      return {
        id: `${team}_RD${rdClean}_Q${qClean}_${index}`,
        team,
        teamLogo,
        grupo: teamRef?.GRUPO,
        rd: d.RD || '1',
        q: d.Q || d.S || '1',
        rdNum: parseInt(rdClean) || 1,
        qNum: parseInt(qClean) || 1,
        mapa: d.MAPA || 'N/A',
        confronto: d.CONFRONTO || 'N/A',
        pts,
        ptsc,
        kills,
        pos,
        booyah,
        ondeFechou: d.ONDE_FECHOU,
        playersLoadout,
        activeSkillsSummary,
        activeSkillNames: activeNames
      };
    });
  }, [data]);

  // Contagem de habilidades ativas pelo time selecionado
  const skillUsageByTeam = useMemo(() => {
    const teamCounts: Record<string, number> = {};
    if (selectedTeam === 'ALL') return teamCounts;

    const targetTeamNorm = selectedTeam.trim().toUpperCase();
    allDropItems.forEach(d => {
      if (d.team.toUpperCase() === targetTeamNorm) {
        d.activeSkillNames.forEach(sk => {
          const k = sk.trim().toUpperCase();
          teamCounts[k] = (teamCounts[k] || 0) + 1;
        });
      }
    });
    return teamCounts;
  }, [allDropItems, selectedTeam]);

  // Lista única de opções para os filtros
  const filterOptions = useMemo(() => {
    const teamsSet = new Set<string>();
    const roundsSet = new Set<string>();
    const dropsSet = new Set<string>();
    const mapsSet = new Set<string>();
    const skillsMap = new Map<string, { name: string; count: number; teamCount: number; img?: string }>();

    allDropItems.forEach(item => {
      if (item.team) teamsSet.add(item.team);
      if (item.rd) roundsSet.add(item.rd);
      if (item.q) dropsSet.add(item.q);
      if (item.mapa && item.mapa !== 'N/A') mapsSet.add(item.mapa);

      item.activeSkillNames.forEach(sk => {
        const key = sk.trim().toUpperCase();
        if (!skillsMap.has(key)) {
          skillsMap.set(key, { 
            name: sk.trim(), 
            count: 0, 
            teamCount: 0,
            img: findDimImg(data.hab1, sk.trim()) 
          });
        }
        skillsMap.get(key)!.count += 1;
      });
    });

    // Se tiver time selecionado, popula teamCount
    if (selectedTeam !== 'ALL') {
      skillsMap.forEach((val, key) => {
        val.teamCount = skillUsageByTeam[key] || 0;
      });
    }

    const teams = Array.from(teamsSet).sort((a, b) => a.localeCompare(b));
    const rounds = Array.from(roundsSet).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
    const drops = Array.from(dropsSet).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
    const maps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));
    
    // Se tiver time selecionado, ordena colocando no topo as habilidades mais usadas pelo time
    const skills = Array.from(skillsMap.values()).sort((a, b) => {
      if (selectedTeam !== 'ALL') {
        if (b.teamCount !== a.teamCount) return b.teamCount - a.teamCount;
      }
      return b.count - a.count;
    });

    return { teams, rounds, drops, maps, skills };
  }, [allDropItems, data.hab1, selectedTeam, skillUsageByTeam]);

  // Estatísticas aprofundadas da Habilidade Ativa Selecionada (incluindo pelo Time Filtrado)
  const activeSkillStats = useMemo(() => {
    if (selectedActiveSkill === 'ALL') return null;

    const targetSkillNorm = selectedActiveSkill.trim().toUpperCase();
    const isTeamFiltered = selectedTeam !== 'ALL';

    // Quedas do time filtrado (ou de todos se ALL)
    const targetScopeDrops = isTeamFiltered
      ? allDropItems.filter(d => d.team.toUpperCase() === selectedTeam.toUpperCase())
      : allDropItems;

    const totalScopeDrops = targetScopeDrops.length;
    const totalScopeSlots = totalScopeDrops * 4;

    let countInSelection = 0;
    let dropsWithSkillInSelection = 0;
    const playerUsageMap: Record<string, number> = {};
    const matchingDrops: TeamDropItem[] = [];

    targetScopeDrops.forEach(d => {
      let usedInDrop = false;
      d.playersLoadout.forEach(p => {
        if (p.hab1 && p.hab1.trim().toUpperCase() === targetSkillNorm) {
          countInSelection += 1;
          usedInDrop = true;
          playerUsageMap[p.player] = (playerUsageMap[p.player] || 0) + 1;
        }
      });
      if (usedInDrop) {
        dropsWithSkillInSelection += 1;
        matchingDrops.push(d);
      }
    });

    const ptsSum = matchingDrops.reduce((acc, d) => acc + d.pts, 0);
    const killsSum = matchingDrops.reduce((acc, d) => acc + d.kills, 0);
    const booyahs = matchingDrops.filter(d => d.booyah).length;
    const avgPts = matchingDrops.length > 0 ? (ptsSum / matchingDrops.length).toFixed(1) : '0.0';
    const avgKills = matchingDrops.length > 0 ? (killsSum / matchingDrops.length).toFixed(1) : '0.0';
    const winRate = matchingDrops.length > 0 ? Math.round((booyahs / matchingDrops.length) * 100) : 0;

    // Ranking geral de todas as equipes no campeonato com essa ativa
    const teamRankingMap: Record<string, { team: string; logo?: string; count: number; drops: number }> = {};
    let totalTournamentCount = 0;
    let totalTournamentDrops = 0;

    allDropItems.forEach(d => {
      let usedInDrop = false;
      d.playersLoadout.forEach(p => {
        if (p.hab1 && p.hab1.trim().toUpperCase() === targetSkillNorm) {
          totalTournamentCount += 1;
          usedInDrop = true;
          if (!teamRankingMap[d.team]) {
            teamRankingMap[d.team] = { team: d.team, logo: d.teamLogo, count: 0, drops: 0 };
          }
          teamRankingMap[d.team].count += 1;
        }
      });
      if (usedInDrop) {
        totalTournamentDrops += 1;
        if (teamRankingMap[d.team]) {
          teamRankingMap[d.team].drops += 1;
        }
      }
    });

    const teamRanking = Object.values(teamRankingMap).sort((a, b) => b.count - a.count);

    const playerUsage = Object.entries(playerUsageMap)
      .sort((a, b) => b[1] - a[1])
      .map(([player, count]) => ({ player, count }));

    const skillImg = findDimImg(data.hab1, selectedActiveSkill);

    return {
      skillName: selectedActiveSkill,
      skillImg,
      isTeamFiltered,
      selectedTeam,
      countInSelection,
      totalScopeDrops,
      dropsWithSkillInSelection,
      slotPct: totalScopeSlots > 0 ? Math.round((countInSelection / totalScopeSlots) * 100) : 0,
      dropPct: totalScopeDrops > 0 ? Math.round((dropsWithSkillInSelection / totalScopeDrops) * 100) : 0,
      playerUsage,
      avgPts,
      avgKills,
      booyahs,
      winRate,
      matchingDropsCount: matchingDrops.length,
      totalTournamentCount,
      totalTournamentDrops,
      teamRanking
    };
  }, [allDropItems, selectedActiveSkill, selectedTeam, data.hab1]);

  // 2. Filtragem e Ordenação
  const filteredDrops = useMemo(() => {
    const normSearch = searchQuery.trim().toUpperCase();

    return allDropItems.filter(item => {
      // Filtro de time
      if (selectedTeam !== 'ALL' && item.team.toUpperCase() !== selectedTeam.toUpperCase()) {
        return false;
      }

      // Filtro de rodada
      if (selectedRound !== 'ALL') {
        const itemRdClean = item.rd.replace(/\D/g, '');
        const selRdClean = selectedRound.replace(/\D/g, '');
        if (itemRdClean !== selRdClean) return false;
      }

      // Filtro de queda
      if (selectedDrop !== 'ALL') {
        const itemQClean = item.q.replace(/\D/g, '');
        const selQClean = selectedDrop.replace(/\D/g, '');
        if (itemQClean !== selQClean) return false;
      }

      // Filtro de mapa
      if (selectedMap !== 'ALL') {
        const normItemMap = item.mapa.toUpperCase();
        const normSelMap = selectedMap.toUpperCase();
        if (!normItemMap.includes(normSelMap) && !normSelMap.includes(normItemMap)) {
          return false;
        }
      }

      // Filtro de posição / colocação
      if (selectedPosition !== 'ALL') {
        if (selectedPosition === '1') {
          if (!item.booyah && item.pos !== 1) return false;
        } else if (selectedPosition === 'top3') {
          if (item.pos < 1 || item.pos > 3) return false;
        } else if (selectedPosition === 'top5') {
          if (item.pos < 1 || item.pos > 5) return false;
        } else if (selectedPosition === 'bottom') {
          if (item.pos < 6) return false;
        } else {
          const parsedPos = parseInt(selectedPosition);
          if (!isNaN(parsedPos) && item.pos !== parsedPos) return false;
        }
      }

      // Filtro de pontos
      if (selectedPtsRange !== 'ALL') {
        if (selectedPtsRange === '20+' && item.pts < 20) return false;
        if (selectedPtsRange === '15+' && item.pts < 15) return false;
        if (selectedPtsRange === '10+' && item.pts < 10) return false;
        if (selectedPtsRange === '5+' && item.pts < 5) return false;
        if (selectedPtsRange === 'under5' && item.pts >= 5) return false;
      }

      // Filtro de abates
      if (selectedKillsRange !== 'ALL') {
        if (selectedKillsRange === '10+' && item.kills < 10) return false;
        if (selectedKillsRange === '7+' && item.kills < 7) return false;
        if (selectedKillsRange === '4+' && item.kills < 4) return false;
        if (selectedKillsRange === '1+' && item.kills < 1) return false;
        if (selectedKillsRange === '0' && item.kills !== 0) return false;
      }

      // Filtro de habilidade ativa
      if (selectedActiveSkill !== 'ALL') {
        const normSkill = selectedActiveSkill.toUpperCase();
        const hasSkill = item.activeSkillNames.some(sk => sk.toUpperCase() === normSkill);
        if (!hasSkill) return false;
      }

      // Busca por texto livre (time, jogador, ativa, mapa)
      if (normSearch) {
        const inTeam = item.team.toUpperCase().includes(normSearch);
        const inMap = item.mapa.toUpperCase().includes(normSearch);
        const inConfronto = item.confronto.toUpperCase().includes(normSearch);
        const inPlayers = item.playersLoadout.some(p => p.player.toUpperCase().includes(normSearch));
        const inSkills = item.activeSkillNames.some(s => s.toUpperCase().includes(normSearch));
        if (!inTeam && !inMap && !inConfronto && !inPlayers && !inSkills) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Ordenação customizada pelas colunas
      if (tableSort.field === 'pos') {
        return tableSort.direction === 'asc' ? a.pos - b.pos : b.pos - a.pos;
      }
      if (tableSort.field === 'pts') {
        return tableSort.direction === 'desc' ? b.pts - a.pts : a.pts - b.pts;
      }
      if (tableSort.field === 'kills') {
        return tableSort.direction === 'desc' ? b.kills - a.kills : a.kills - b.kills;
      }
      if (tableSort.field === 'mapa') {
        return tableSort.direction === 'asc' ? a.mapa.localeCompare(b.mapa) : b.mapa.localeCompare(a.mapa);
      }
      if (tableSort.field === 'team') {
        return tableSort.direction === 'asc' ? a.team.localeCompare(b.team) : b.team.localeCompare(a.team);
      }
      if (tableSort.field === 'rd') {
        const diffRd = tableSort.direction === 'asc' ? a.rdNum - b.rdNum : b.rdNum - a.rdNum;
        if (diffRd !== 0) return diffRd;
        return tableSort.direction === 'asc' ? a.qNum - b.qNum : b.qNum - a.qNum;
      }

      // Fallback para sortBy geral
      if (sortBy === 'chronological') {
        if (a.rdNum !== b.rdNum) return a.rdNum - b.rdNum;
        if (a.qNum !== b.qNum) return a.qNum - b.qNum;
        return a.team.localeCompare(b.team);
      }
      if (sortBy === 'recent') {
        if (a.rdNum !== b.rdNum) return b.rdNum - a.rdNum;
        if (a.qNum !== b.qNum) return b.qNum - a.qNum;
        return a.team.localeCompare(b.team);
      }
      if (sortBy === 'points') {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.kills !== a.kills) return b.kills - a.kills;
        return a.pos - b.pos;
      }
      if (sortBy === 'kills') {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return b.pts - a.pts;
      }
      if (sortBy === 'position') {
        if (a.pos !== b.pos) return a.pos - b.pos;
        return b.pts - a.pts;
      }
      return 0;
    });
  }, [allDropItems, selectedTeam, selectedRound, selectedDrop, selectedMap, selectedPosition, selectedPtsRange, selectedKillsRange, selectedActiveSkill, searchQuery, sortBy, tableSort]);

  // Estatísticas rápidas do recorte
  const metrics = useMemo(() => {
    const total = filteredDrops.length;
    if (total === 0) {
      return { total: 0, avgPts: '0.0', avgKills: '0.0', booyahs: 0, topActive: null };
    }

    const sumPts = filteredDrops.reduce((acc, d) => acc + d.pts, 0);
    const sumKills = filteredDrops.reduce((acc, d) => acc + d.kills, 0);
    const booyahs = filteredDrops.filter(d => d.booyah).length;

    // Ativa mais usada no recorte
    const actMap: Record<string, number> = {};
    filteredDrops.forEach(d => {
      d.activeSkillNames.forEach(sk => {
        actMap[sk] = (actMap[sk] || 0) + 1;
      });
    });

    const topActiveEntry = Object.entries(actMap).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      avgPts: (sumPts / total).toFixed(1),
      avgKills: (sumKills / total).toFixed(1),
      booyahs,
      topActive: topActiveEntry ? { 
        name: topActiveEntry[0], 
        count: topActiveEntry[1], 
        pct: Math.round((topActiveEntry[1] / (total * 4 || 1)) * 100),
        img: findDimImg(data.hab1, topActiveEntry[0]) 
      } : null
    };
  }, [filteredDrops, data.hab1]);

  const toggleExpand = (id: string) => {
    setExpandedDrops(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    filteredDrops.forEach(d => { next[d.id] = true; });
    setExpandedDrops(next);
  };

  const collapseAll = () => {
    setExpandedDrops({});
  };

  const handleTableSort = (field: 'rd' | 'team' | 'mapa' | 'pos' | 'pts' | 'kills') => {
    setTableSort(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: field === 'pts' || field === 'kills' ? 'desc' : 'asc' };
    });
  };

  const renderSortIndicator = (field: 'rd' | 'team' | 'mapa' | 'pos' | 'pts' | 'kills') => {
    if (tableSort.field !== field) {
      return <ArrowUpDown size={11} className="text-gray-600 opacity-50" />;
    }
    return tableSort.direction === 'asc' ? (
      <ArrowUp size={11} className="text-yellow-400" />
    ) : (
      <ArrowDown size={11} className="text-yellow-400" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-yellow-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30 shadow-inner">
            <Zap size={26} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 tracking-widest">
                Composições por Queda
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">
                • 4 Ativas por Time
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-wider text-white mt-1">
              Habilidades Ativas, Pontos & Abates por Queda
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Consulte a composição das 4 habilidades ativas utilizadas por cada time em cada rodada e queda disputada, com os pontos, abates e colocação de cada partida.
            </p>
          </div>
        </div>

        {/* Alternador de Visualização (Cards vs Tabela) */}
        <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards' 
                  ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutList size={14} /> Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas e KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#151518] p-4 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">
            Quedas Listadas
          </span>
          <h3 className="text-2xl font-black italic text-white mt-1">
            {metrics.total}
          </h3>
          <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
            Partidas registradas
          </span>
        </div>

        <div className="bg-[#151518] p-4 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
          <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 block">
            Média de Pontos
          </span>
          <h3 className="text-2xl font-black italic text-yellow-400 mt-1">
            {metrics.avgPts} <span className="text-xs font-normal text-gray-400">PTS</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
            Por queda do recorte
          </span>
        </div>

        <div className="bg-[#151518] p-4 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
          <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block">
            Média de Abates
          </span>
          <h3 className="text-2xl font-black italic text-red-400 mt-1">
            {metrics.avgKills} <span className="text-xs font-normal text-gray-400">KILLS</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
            Por queda do recorte
          </span>
        </div>

        <div className="bg-[#151518] p-4 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg">
          <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 block">
            Booyahs
          </span>
          <h3 className="text-2xl font-black italic text-orange-400 mt-1">
            {metrics.booyahs} <span className="text-xs font-normal text-gray-400">🏆</span>
          </h3>
          <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
            {metrics.total > 0 ? `${Math.round((metrics.booyahs / metrics.total) * 100)}% das partidas` : '0%'}
          </span>
        </div>

        <div className="bg-[#151518] p-4 rounded-2xl border border-white/5 relative overflow-hidden shadow-lg col-span-2 sm:col-span-2 lg:col-span-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 block">
            Ativa Mais Usada
          </span>
          <div className="flex items-center gap-2 mt-1">
            {metrics.topActive?.img ? (
              <img src={metrics.topActive.img} alt={metrics.topActive.name} className="w-7 h-7 object-contain rounded-lg bg-black p-0.5 border border-purple-500/30 shrink-0" />
            ) : (
              <Zap size={18} className="text-purple-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-black italic text-white truncate uppercase">
                {metrics.topActive?.name || 'N/A'}
              </h3>
              <span className="text-[10px] text-purple-400 font-bold block">
                {metrics.topActive?.count || 0}x no recorte
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Completa com Colunas (Mapa, Posição, Pontos, Abates, Ativa) */}
      <div className="bg-[#121215] p-5 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-black uppercase tracking-wider">
            <Filter size={15} /> Filtros de Composição e Quedas
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold">
            Mostrando <span className="text-white font-black">{filteredDrops.length}</span> de <span className="text-white font-black">{allDropItems.length}</span> quedas
          </div>
        </div>

        {/* Linha 1: Busca e Filtros de Contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {/* Busca Texto */}
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar time, jogador, mapa ou ativa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-white placeholder-gray-600 outline-none focus:border-yellow-500/50 transition-all"
            />
          </div>

          {/* Filtro de Time */}
          <div>
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedTeam !== 'ALL' ? 'border-yellow-500/50 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todos os Times ({filterOptions.teams.length})</option>
              {filterOptions.teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro de Habilidade Ativa */}
          <div>
            <select
              value={selectedActiveSkill}
              onChange={e => setSelectedActiveSkill(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-yellow-500 uppercase cursor-pointer shadow-sm ${
                selectedActiveSkill !== 'ALL' 
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/40' 
                  : 'border-yellow-500/40 text-yellow-400'
              }`}
            >
              <option value="ALL">Todas as Ativas ({filterOptions.skills.length})</option>
              {filterOptions.skills.map(s => {
                const teamLabel = selectedTeam !== 'ALL' ? ` • ${s.teamCount}x pelo ${selectedTeam}` : '';
                return (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.count}x geral{teamLabel})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Linha 2: Filtros pelas Colunas (Mapa, Posição, Pontos, Abates, Rodada, Queda) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2 border-t border-white/5">
          {/* Coluna: Mapa */}
          <div>
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
              Mapa
            </label>
            <select
              value={selectedMap}
              onChange={e => setSelectedMap(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedMap !== 'ALL' ? 'border-yellow-500/50 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todos os Mapas</option>
              {filterOptions.maps.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Coluna: Posição */}
          <div>
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
              Posição / Booyah
            </label>
            <select
              value={selectedPosition}
              onChange={e => setSelectedPosition(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedPosition !== 'ALL' ? 'border-yellow-500/50 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todas as Posições</option>
              <option value="1">🏆 Apenas Booyah (1º)</option>
              <option value="top3">🥇 Top 3 (1º ao 3º)</option>
              <option value="top5">🎖️ Top 5 (1º ao 5º)</option>
              <option value="bottom">6º ao 12º Lugar</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p => (
                <option key={p} value={String(p)}>{p}º Lugar</option>
              ))}
            </select>
          </div>

          {/* Coluna: Pontos */}
          <div>
            <label className="text-[9px] font-black uppercase text-yellow-500 tracking-wider block mb-1">
              Pontos (PTS)
            </label>
            <select
              value={selectedPtsRange}
              onChange={e => setSelectedPtsRange(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedPtsRange !== 'ALL' ? 'border-yellow-500 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todos os Pontos</option>
              <option value="20+">20+ PTS (Excelente)</option>
              <option value="15+">15+ PTS (Alto)</option>
              <option value="10+">10+ PTS (Médio/Bom)</option>
              <option value="5+">5+ PTS</option>
              <option value="under5">Menos de 5 PTS</option>
            </select>
          </div>

          {/* Coluna: Abates */}
          <div>
            <label className="text-[9px] font-black uppercase text-red-500 tracking-wider block mb-1">
              Abates (Kills)
            </label>
            <select
              value={selectedKillsRange}
              onChange={e => setSelectedKillsRange(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedKillsRange !== 'ALL' ? 'border-red-500 text-red-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todos os Abates</option>
              <option value="10+">10+ Kills (Massacre)</option>
              <option value="7+">7+ Kills (Muito Alto)</option>
              <option value="4+">4+ Kills (Médio)</option>
              <option value="1+">1+ Kills (Com Abate)</option>
              <option value="0">0 Kills (Zerado)</option>
            </select>
          </div>

          {/* Rodada */}
          <div>
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
              Rodada
            </label>
            <select
              value={selectedRound}
              onChange={e => setSelectedRound(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedRound !== 'ALL' ? 'border-yellow-500/50 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todas Rodadas</option>
              {filterOptions.rounds.map(r => (
                <option key={r} value={r}>Rodada {r}</option>
              ))}
            </select>
          </div>

          {/* Queda */}
          <div>
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1">
              Queda
            </label>
            <select
              value={selectedDrop}
              onChange={e => setSelectedDrop(e.target.value)}
              className={`w-full bg-black/60 border rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-yellow-500/50 uppercase cursor-pointer ${
                selectedDrop !== 'ALL' ? 'border-yellow-500/50 text-yellow-400 font-black' : 'border-white/10 text-white'
              }`}
            >
              <option value="ALL">Todas Quedas</option>
              {filterOptions.drops.map(q => (
                <option key={q} value={q}>Queda {q}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 3: Ordenação, Ações e Badges de Filtros Ativos */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Ordenação Geral */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                <ArrowUpDown size={12} className="text-gray-400" /> Ordenar Por:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-yellow-500/50 uppercase cursor-pointer"
              >
                <option value="chronological">Cronológica (RD 1 Q1 →)</option>
                <option value="recent">Mais Recentes Primeiro</option>
                <option value="points">Mais Pontos (Maior PTS)</option>
                <option value="kills">Mais Abates (Maior Kills)</option>
                <option value="position">Melhor Colocação (Booyah →)</option>
              </select>
            </div>

            {/* Badges de Filtros Ativos */}
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedTeam !== 'ALL' && (
                <button
                  onClick={() => setSelectedTeam('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-yellow-500/20"
                >
                  Time: {selectedTeam} ✕
                </button>
              )}
              {selectedActiveSkill !== 'ALL' && (
                <button
                  onClick={() => setSelectedActiveSkill('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500 text-black font-black text-[10px] uppercase flex items-center gap-1 hover:bg-yellow-400 shadow-sm"
                >
                  <Zap size={10} /> Ativa: {selectedActiveSkill} ✕
                </button>
              )}
              {selectedMap !== 'ALL' && (
                <button
                  onClick={() => setSelectedMap('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-white/20"
                >
                  Mapa: {selectedMap} ✕
                </button>
              )}
              {selectedPosition !== 'ALL' && (
                <button
                  onClick={() => setSelectedPosition('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-white/20"
                >
                  Pos: {selectedPosition === '1' ? 'Booyah' : selectedPosition} ✕
                </button>
              )}
              {selectedPtsRange !== 'ALL' && (
                <button
                  onClick={() => setSelectedPtsRange('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-yellow-500/20"
                >
                  PTS: {selectedPtsRange} ✕
                </button>
              )}
              {selectedKillsRange !== 'ALL' && (
                <button
                  onClick={() => setSelectedKillsRange('ALL')}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-red-500/20"
                >
                  Kills: {selectedKillsRange} ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Expandir / Recolher Tudo */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={expandAll}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-white/5 cursor-pointer"
                >
                  Expandir Todos
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-white/5 cursor-pointer"
                >
                  Recolher Todos
                </button>
              </div>
            )}

            {/* Resetar Todos os Filtros */}
            {(selectedTeam !== 'ALL' || selectedRound !== 'ALL' || selectedDrop !== 'ALL' || selectedMap !== 'ALL' || selectedPosition !== 'ALL' || selectedPtsRange !== 'ALL' || selectedKillsRange !== 'ALL' || selectedActiveSkill !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTeam('ALL');
                  setSelectedRound('ALL');
                  setSelectedDrop('ALL');
                  setSelectedMap('ALL');
                  setSelectedPosition('ALL');
                  setSelectedPtsRange('ALL');
                  setSelectedKillsRange('ALL');
                  setSelectedActiveSkill('ALL');
                  setSearchQuery('');
                }}
                className="text-[10px] font-black text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 uppercase tracking-wider transition-colors cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Painel Especial de Análise da Habilidade Ativa Selecionada */}
      {selectedActiveSkill !== 'ALL' && activeSkillStats && (
        <div className="bg-gradient-to-r from-yellow-500/10 via-[#15151a] to-[#121215] p-5 rounded-3xl border border-yellow-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-yellow-500/20 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-black border-2 border-yellow-500/50 p-2 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/10">
                {activeSkillStats.skillImg ? (
                  <img src={activeSkillStats.skillImg} alt={activeSkillStats.skillName} className="w-full h-full object-contain" />
                ) : (
                  <Zap size={28} className="text-yellow-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-yellow-500 text-black font-black text-[9px] uppercase tracking-wider">
                    Habilidade Ativa Selecionada
                  </span>
                  {activeSkillStats.isTeamFiltered ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-black text-[9px] uppercase tracking-wider">
                      Uso pela Equipe: {activeSkillStats.selectedTeam}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-gray-300 font-bold text-[9px] uppercase tracking-wider">
                      Visão de Todas as Equipes
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black italic uppercase text-white flex items-center gap-2">
                  {activeSkillStats.skillName}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setSelectedActiveSkill('ALL')}
              className="text-xs font-bold text-gray-400 hover:text-white bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/30 transition-all flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              Remover Filtro de Ativa ✕
            </button>
          </div>

          {/* Estatísticas e Métricas da Ativa Selecionada */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
            {/* Quantidade de Vezes Utilizada */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-yellow-500/20">
              <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500 block">
                {activeSkillStats.isTeamFiltered ? `Usos pelo ${activeSkillStats.selectedTeam}` : 'Usos no Campeonato'}
              </span>
              <div className="text-2xl font-black italic text-white mt-1">
                {activeSkillStats.countInSelection}x
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
                Em {activeSkillStats.dropsWithSkillInSelection} de {activeSkillStats.totalScopeDrops} quedas ({activeSkillStats.dropPct}% pres.)
              </span>
            </div>

            {/* % de Slots do Squad */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">
                Participação nos Slots
              </span>
              <div className="text-2xl font-black italic text-yellow-400 mt-1">
                {activeSkillStats.slotPct}%
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
                De 4 slots ativos por queda
              </span>
            </div>

            {/* Média de Pontos */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500 block">
                Média de PTS com {activeSkillStats.skillName}
              </span>
              <div className="text-2xl font-black italic text-yellow-400 mt-1">
                {activeSkillStats.avgPts} <span className="text-xs font-normal text-gray-400">PTS</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
                Nas quedas em que esteve equipada
              </span>
            </div>

            {/* Média de Abates */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-red-500 block">
                Média de Kills
              </span>
              <div className="text-2xl font-black italic text-red-400 mt-1">
                {activeSkillStats.avgKills} <span className="text-xs font-normal text-gray-400">KILLS</span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
                Por partida equipada
              </span>
            </div>

            {/* Booyahs */}
            <div className="bg-black/50 p-3.5 rounded-2xl border border-white/5 col-span-2 sm:col-span-4 lg:col-span-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-orange-400 block">
                Vitórias / Booyahs
              </span>
              <div className="text-2xl font-black italic text-orange-400 mt-1">
                {activeSkillStats.booyahs} 🏆
              </div>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">
                {activeSkillStats.winRate}% de taxa de vitória
              </span>
            </div>
          </div>

          {/* Jogadores do Time Selecionado que mais utilizaram */}
          {activeSkillStats.isTeamFiltered && activeSkillStats.playerUsage.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Atletas do {activeSkillStats.selectedTeam} que equiparam {activeSkillStats.skillName}:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeSkillStats.playerUsage.map(p => (
                  <div
                    key={p.player}
                    className="bg-black/70 border border-yellow-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2"
                  >
                    <User size={13} className="text-yellow-500" />
                    <span className="text-xs font-black italic uppercase text-white">{p.player}</span>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-black">
                      {p.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranking das Equipes que mais usaram essa ativa no campeonato (quando visão geral ou comparativo) */}
          {!activeSkillStats.isTeamFiltered && activeSkillStats.teamRanking.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                Equipes que mais utilizaram {activeSkillStats.skillName} no campeonato (clique para filtrar):
              </span>
              <div className="flex flex-wrap gap-2">
                {activeSkillStats.teamRanking.slice(0, 10).map(t => (
                  <button
                    key={t.team}
                    onClick={() => setSelectedTeam(t.team)}
                    className="bg-black/70 hover:bg-yellow-500/10 border border-white/10 hover:border-yellow-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer group"
                    title={`Filtrar para ver quedas do ${t.team} com ${activeSkillStats.skillName}`}
                  >
                    {t.logo ? (
                      <img src={t.logo} alt={t.team} className="w-4 h-4 object-contain" />
                    ) : (
                      <Shield size={12} className="text-yellow-500" />
                    )}
                    <span className="text-xs font-black italic uppercase text-white group-hover:text-yellow-400">
                      {t.team}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400 text-[9px] font-black">
                      {t.count}x
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de Quedas (Modo Cards) */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredDrops.length > 0 ? (
            filteredDrops.map(drop => {
              const isExpanded = !!expandedDrops[drop.id];

              return (
                <div
                  key={drop.id}
                  className={`bg-[#121215] rounded-3xl border transition-all overflow-hidden shadow-xl ${
                    drop.booyah 
                      ? 'border-yellow-500/40 shadow-yellow-500/5' 
                      : 'border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  {/* Topo do Card da Queda */}
                  <div className={`p-4 sm:p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
                    drop.booyah ? 'bg-gradient-to-r from-yellow-500/15 via-black/40 to-transparent' : 'bg-black/40'
                  }`}>
                    {/* Time & Identificação da Queda */}
                    <div className="flex items-center gap-4">
                      {/* Logo do Time */}
                      <div 
                        onClick={() => onSelectTeam && onSelectTeam(drop.team)}
                        className="w-12 h-12 rounded-2xl bg-black border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:border-yellow-500/50 transition-colors"
                      >
                        {drop.teamLogo ? (
                          <img src={drop.teamLogo} alt={drop.team} className="w-full h-full object-contain" />
                        ) : (
                          <Shield size={22} className="text-yellow-500" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {/* Badge de Rodada e Queda */}
                          <span className="px-2.5 py-0.5 rounded-lg bg-yellow-500 text-black font-black text-[10px] uppercase tracking-wider">
                            RD {drop.rd} • QUEDA {drop.q}
                          </span>

                          {/* Badge de Mapa Clicável */}
                          <button
                            onClick={() => setSelectedMap(selectedMap === drop.mapa ? 'ALL' : drop.mapa)}
                            className={`px-2.5 py-0.5 rounded-lg border text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer ${
                              selectedMap === drop.mapa
                                ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                                : 'bg-white/5 border-white/10 text-gray-300 font-bold hover:border-yellow-500/40 hover:text-white'
                            }`}
                            title={`Clique para filtrar pelo mapa ${drop.mapa}`}
                          >
                            <MapPin size={10} className={selectedMap === drop.mapa ? "text-black" : "text-yellow-500"} /> {drop.mapa}
                          </button>

                          {/* Confronto */}
                          {drop.confronto && drop.confronto !== 'N/A' && (
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 font-bold text-[9px] uppercase hidden sm:inline">
                              {drop.confronto}
                            </span>
                          )}
                        </div>

                        {/* Nome do Time */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectTeam && onSelectTeam(drop.team)}
                            className="text-base sm:text-lg font-black italic uppercase text-white hover:text-yellow-400 transition-colors flex items-center gap-1.5"
                          >
                            {drop.team}
                          </button>
                          {drop.grupo && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                              {drop.grupo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resultados da Partida: Posição, Pontos, Abates (Filtros Rápidos) */}
                    <div className="flex items-center gap-3 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                      {/* Posição / Booyah Clicável */}
                      <button
                        onClick={() => {
                          if (drop.booyah) {
                            setSelectedPosition(selectedPosition === '1' ? 'ALL' : '1');
                          } else {
                            setSelectedPosition(selectedPosition === String(drop.pos) ? 'ALL' : String(drop.pos));
                          }
                        }}
                        className="text-center cursor-pointer group"
                        title={`Clique para filtrar por ${drop.booyah ? 'Booyah' : `${drop.pos}º lugar`}`}
                      >
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-0.5 group-hover:text-yellow-400">
                          POSIÇÃO
                        </span>
                        {drop.booyah ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-black text-xs uppercase tracking-tighter shadow-md shadow-yellow-500/20 transition-all ${
                            selectedPosition === '1' ? 'bg-yellow-400 text-black ring-2 ring-yellow-300' : 'bg-yellow-500 text-black hover:bg-yellow-400'
                          }`}>
                            🏆 BOOYAH!
                          </span>
                        ) : (
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl border font-black italic text-xs transition-colors ${
                            selectedPosition === String(drop.pos)
                              ? 'bg-yellow-500 text-black border-yellow-400'
                              : 'bg-black border-white/10 text-gray-300 hover:border-yellow-500/40 hover:text-white'
                          }`}>
                            {drop.pos}º LUGAR
                          </span>
                        )}
                      </button>

                      {/* Pontos Totais Clicável */}
                      <button
                        onClick={() => {
                          if (drop.pts >= 20) setSelectedPtsRange(selectedPtsRange === '20+' ? 'ALL' : '20+');
                          else if (drop.pts >= 15) setSelectedPtsRange(selectedPtsRange === '15+' ? 'ALL' : '15+');
                          else if (drop.pts >= 10) setSelectedPtsRange(selectedPtsRange === '10+' ? 'ALL' : '10+');
                          else if (drop.pts >= 5) setSelectedPtsRange(selectedPtsRange === '5+' ? 'ALL' : '5+');
                          else setSelectedPtsRange(selectedPtsRange === 'under5' ? 'ALL' : 'under5');
                        }}
                        className={`text-center px-3.5 py-1.5 rounded-xl border min-w-[70px] cursor-pointer transition-all ${
                          selectedPtsRange !== 'ALL'
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                            : 'bg-black/60 hover:bg-black/90 border-yellow-500/20 hover:border-yellow-500/50'
                        }`}
                        title="Clique para filtrar por faixa de pontos"
                      >
                        <span className="text-[7px] text-yellow-500 font-black uppercase tracking-widest block">
                          PONTOS
                        </span>
                        <span className="text-lg font-black italic text-yellow-400 leading-none mt-0.5 inline-block">
                          {drop.pts}
                        </span>
                      </button>

                      {/* Abates Clicável */}
                      <button
                        onClick={() => {
                          if (drop.kills >= 10) setSelectedKillsRange(selectedKillsRange === '10+' ? 'ALL' : '10+');
                          else if (drop.kills >= 7) setSelectedKillsRange(selectedKillsRange === '7+' ? 'ALL' : '7+');
                          else if (drop.kills >= 4) setSelectedKillsRange(selectedKillsRange === '4+' ? 'ALL' : '4+');
                          else if (drop.kills >= 1) setSelectedKillsRange(selectedKillsRange === '1+' ? 'ALL' : '1+');
                          else setSelectedKillsRange(selectedKillsRange === '0' ? 'ALL' : '0');
                        }}
                        className={`text-center px-3.5 py-1.5 rounded-xl border min-w-[70px] cursor-pointer transition-all ${
                          selectedKillsRange !== 'ALL'
                            ? 'bg-red-500/20 border-red-500 text-red-300'
                            : 'bg-black/60 hover:bg-black/90 border-red-500/20 hover:border-red-500/50'
                        }`}
                        title="Clique para filtrar por faixa de abates"
                      >
                        <span className="text-[7px] text-red-500 font-black uppercase tracking-widest block">
                          ABATES
                        </span>
                        <span className="text-lg font-black italic text-red-400 leading-none mt-0.5 inline-block">
                          {drop.kills}
                        </span>
                      </button>

                      {/* Botão de Expandir Loadout Completo */}
                      <button
                        onClick={() => toggleExpand(drop.id)}
                        className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                          isExpanded
                            ? 'bg-yellow-500 text-black border-yellow-400 shadow-md shadow-yellow-500/20'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                        }`}
                        title={isExpanded ? 'Recolher detalhes' : 'Ver loadout completo dos 4 jogadores'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Corpo: As 4 Habilidades Ativas da Squad */}
                  <div className="p-4 sm:p-5 border-t border-white/5 bg-[#0e0e11]/70">
                    {/* Barra de Síntese das Ativas */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <Zap size={13} className="text-yellow-500" />
                        COMPOSIÇÃO DE HABILIDADES ATIVAS (4 JOGADORES):
                      </span>
                      {drop.activeSkillsSummary.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {drop.activeSkillsSummary.map(sk => {
                            const isSelected = selectedActiveSkill !== 'ALL' && sk.name.toUpperCase() === selectedActiveSkill.toUpperCase();
                            return (
                              <button
                                key={sk.name}
                                onClick={() => setSelectedActiveSkill(isSelected ? 'ALL' : sk.name)}
                                className={`px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm text-[9px] font-black uppercase transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-yellow-500 text-black border border-yellow-300 ring-2 ring-yellow-400' 
                                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                                }`}
                                title={`Clique para filtrar e analisar: ${sk.name}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-yellow-400'}`}></span>
                                {sk.count}x {sk.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Grid dos 4 Atletas e suas Habilidades Ativas */}
                    {drop.playersLoadout.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {drop.playersLoadout.map((p, idx) => {
                          const isSkillActive = selectedActiveSkill !== 'ALL' && p.hab1?.trim().toUpperCase() === selectedActiveSkill.trim().toUpperCase();

                          return (
                            <div
                              key={idx}
                              className={`bg-black/50 rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative group ${
                                isSkillActive ? 'border-yellow-500/60 ring-1 ring-yellow-500/40 bg-yellow-500/[0.03]' : 'border-white/5 hover:border-yellow-500/30'
                              }`}
                            >
                              <div>
                                {/* Identificação do Jogador */}
                                <div className="flex items-center justify-between mb-2">
                                  <button
                                    onClick={() => onSelectPlayer && onSelectPlayer(p.player)}
                                    className="flex items-center gap-2 text-left hover:text-yellow-400 transition-colors"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-gray-900 border border-yellow-500/30 flex items-center justify-center text-[10px] text-yellow-500 shrink-0">
                                      <User size={12} />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs font-black italic uppercase text-white truncate block leading-none group-hover:text-yellow-400">
                                        {p.player}
                                      </span>
                                      {p.funcao && (
                                        <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest block mt-0.5">
                                          {p.funcao}
                                        </span>
                                      )}
                                    </div>
                                  </button>

                                  {(p.kills !== undefined || p.damage !== undefined) && (
                                    <div className="text-right">
                                      {p.kills !== undefined && (
                                        <span className="text-[11px] font-black italic text-red-400 block leading-none">
                                          {p.kills} K
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Habilidade Ativa Clicável para Filtrar */}
                                <button
                                  onClick={() => {
                                    if (p.hab1) {
                                      setSelectedActiveSkill(selectedActiveSkill === p.hab1.trim() ? 'ALL' : p.hab1.trim());
                                    }
                                  }}
                                  className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                                    isSkillActive
                                      ? 'bg-yellow-500 text-black border-yellow-300 shadow-md shadow-yellow-500/20'
                                      : 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent hover:from-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/40 text-white'
                                  }`}
                                  title={`Clique para filtrar e ver uso de ${p.hab1}`}
                                >
                                  {p.hab1Img ? (
                                    <img 
                                      src={p.hab1Img} 
                                      alt={p.hab1} 
                                      className={`w-8 h-8 object-contain rounded-lg p-0.5 shrink-0 ${
                                        isSkillActive ? 'bg-black/20 border border-black/30' : 'bg-black border border-yellow-500/40'
                                      }`}
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSkillActive ? 'bg-black/20 text-black' : 'bg-black border border-yellow-500/30 text-yellow-500'
                                    }`}>
                                      <Zap size={16} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className={`text-[7px] font-black uppercase tracking-widest block leading-none ${
                                      isSkillActive ? 'text-black/80' : 'text-yellow-500'
                                    }`}>
                                      HABILIDADE ATIVA
                                    </span>
                                    <span className={`text-xs font-black italic uppercase truncate block mt-0.5 ${
                                      isSkillActive ? 'text-black' : 'text-white'
                                    }`}>
                                      {p.hab1 || 'Sem Ativa'}
                                    </span>
                                  </div>
                                </button>
                              </div>

                            {/* Se expandido: Mostra Passivas, Pet e Item */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-in fade-in duration-200">
                                <span className="text-[7px] text-gray-500 font-black uppercase tracking-widest block">
                                  PASSIVAS & PET / ITEM
                                </span>
                                {/* Passivas */}
                                <div className="grid grid-cols-3 gap-1">
                                  {[
                                    { name: p.hab2, img: p.hab2Img, label: 'H2' },
                                    { name: p.hab3, img: p.hab3Img, label: 'H3' },
                                    { name: p.hab4, img: p.hab4Img, label: 'H4' },
                                  ].map((pass, passIdx) => (
                                    <div
                                      key={passIdx}
                                      className="bg-black/60 p-1 rounded border border-white/5 flex flex-col items-center text-center"
                                      title={pass.name}
                                    >
                                      {pass.img ? (
                                        <img src={pass.img} className="w-4 h-4 object-contain mb-0.5" alt={pass.name} />
                                      ) : (
                                        <div className="w-4 h-4 rounded bg-gray-900 mb-0.5 text-[7px] text-gray-600 flex items-center justify-center font-mono">
                                          {pass.label}
                                        </div>
                                      )}
                                      <span className="text-[7px] font-bold text-gray-300 uppercase truncate max-w-[45px] leading-tight">
                                        {pass.name || '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Pet & Item */}
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  <div className="bg-black/40 p-1 rounded border border-white/5 flex items-center gap-1.5" title={`Pet: ${p.pet}`}>
                                    {p.petImg ? (
                                      <img src={p.petImg} className="w-4 h-4 object-contain" alt={p.pet} />
                                    ) : (
                                      <div className="w-4 h-4 rounded bg-gray-900 text-[6px] text-gray-600 flex items-center justify-center">P</div>
                                    )}
                                    <span className="text-[8px] font-bold text-gray-400 uppercase truncate">{p.pet || '-'}</span>
                                  </div>
                                  <div className="bg-black/40 p-1 rounded border border-white/5 flex items-center gap-1.5" title={`Item: ${p.item}`}>
                                    {p.itemImg ? (
                                      <img src={p.itemImg} className="w-4 h-4 object-contain" alt={p.item} />
                                    ) : (
                                      <div className="w-4 h-4 rounded bg-gray-900 text-[6px] text-gray-600 flex items-center justify-center">I</div>
                                    )}
                                    <span className="text-[8px] font-bold text-gray-400 uppercase truncate">{p.item || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    ) : (
                      <div className="py-4 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-black/20 rounded-xl border border-dashed border-gray-800">
                        Nenhum registro de personagem detalhado encontrado nesta queda.
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center bg-[#121215] rounded-3xl border border-dashed border-gray-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto border border-yellow-500/20">
                <Search size={22} />
              </div>
              <h4 className="text-base font-black uppercase text-white italic">
                Nenhuma queda encontrada para os filtros selecionados
              </h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Tente alterar ou limpar os filtros de equipe, rodada, queda, mapa ou habilidade ativa para visualizar as partidas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lista de Quedas (Modo Tabela Compacta) */}
      {viewMode === 'table' && (
        <div className="bg-[#121215] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
              <thead className="bg-black/60 text-gray-500 text-[8px] uppercase font-black tracking-widest border-b border-gray-800">
                <tr>
                  <th 
                    onClick={() => handleTableSort('rd')} 
                    className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors select-none"
                    title="Ordenar por Rodada/Queda"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Queda / Rodada</span>
                      {renderSortIndicator('rd')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleTableSort('team')} 
                    className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors select-none"
                    title="Ordenar por Equipe"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Equipe</span>
                      {renderSortIndicator('team')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleTableSort('mapa')} 
                    className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors select-none"
                    title="Ordenar por Mapa"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Mapa</span>
                      {renderSortIndicator('mapa')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleTableSort('pos')} 
                    className="px-4 py-3.5 text-center cursor-pointer hover:text-white transition-colors select-none"
                    title="Ordenar por Posição"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Posição</span>
                      {renderSortIndicator('pos')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleTableSort('pts')} 
                    className="px-4 py-3.5 text-center text-yellow-500 cursor-pointer hover:text-yellow-300 transition-colors select-none"
                    title="Ordenar por Pontos"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Pontos</span>
                      {renderSortIndicator('pts')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleTableSort('kills')} 
                    className="px-4 py-3.5 text-center text-red-500 cursor-pointer hover:text-red-300 transition-colors select-none"
                    title="Ordenar por Abates"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Abates</span>
                      {renderSortIndicator('kills')}
                    </div>
                  </th>
                  <th className="px-4 py-3.5">4 Habilidades Ativas da Line-up</th>
                  <th className="px-4 py-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {filteredDrops.length > 0 ? (
                  filteredDrops.map(drop => {
                    const isExpanded = !!expandedDrops[drop.id];

                    return (
                      <React.Fragment key={drop.id}>
                        <tr className={`hover:bg-white/[0.02] transition-colors ${drop.booyah ? 'bg-yellow-500/5' : ''}`}>
                          {/* Queda / Rodada */}
                          <td className="px-4 py-3 font-bold text-gray-300">
                            <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase">
                              RD {drop.rd} • Q{drop.q}
                            </span>
                          </td>

                          {/* Equipe */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onSelectTeam && onSelectTeam(drop.team)}
                              className="flex items-center gap-2.5 text-left hover:text-yellow-400 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-black border border-white/10 p-1 flex items-center justify-center shrink-0">
                                {drop.teamLogo ? (
                                  <img src={drop.teamLogo} alt={drop.team} className="w-full h-full object-contain" />
                                ) : (
                                  <Shield size={14} className="text-yellow-500" />
                                )}
                              </div>
                              <span className="font-black italic uppercase text-white">
                                {drop.team}
                              </span>
                            </button>
                          </td>

                          {/* Mapa (Filtro Clicável) */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedMap(selectedMap === drop.mapa ? 'ALL' : drop.mapa)}
                              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                selectedMap === drop.mapa
                                  ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                                  : 'text-gray-300 hover:text-white border-white/5 hover:border-white/20 bg-white/[0.02]'
                              }`}
                              title={`Filtrar por ${drop.mapa}`}
                            >
                              {drop.mapa}
                            </button>
                          </td>

                          {/* Posição (Filtro Clicável) */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (drop.booyah) setSelectedPosition(selectedPosition === '1' ? 'ALL' : '1');
                                else setSelectedPosition(selectedPosition === String(drop.pos) ? 'ALL' : String(drop.pos));
                              }}
                              className="cursor-pointer transition-transform hover:scale-105"
                              title={`Filtrar por ${drop.booyah ? 'Booyah' : `${drop.pos}º lugar`}`}
                            >
                              {drop.booyah ? (
                                <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                                  selectedPosition === '1' ? 'bg-yellow-400 text-black ring-2 ring-yellow-300' : 'bg-yellow-500 text-black'
                                }`}>
                                  BOOYAH
                                </span>
                              ) : (
                                <span className={`font-black italic px-2 py-0.5 rounded border transition-colors ${
                                  selectedPosition === String(drop.pos)
                                    ? 'bg-yellow-500 text-black border-yellow-400'
                                    : 'text-gray-400 hover:text-white border-transparent'
                                }`}>
                                  {drop.pos}º
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Pontos (Filtro Clicável) */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (drop.pts >= 20) setSelectedPtsRange(selectedPtsRange === '20+' ? 'ALL' : '20+');
                                else if (drop.pts >= 15) setSelectedPtsRange(selectedPtsRange === '15+' ? 'ALL' : '15+');
                                else if (drop.pts >= 10) setSelectedPtsRange(selectedPtsRange === '10+' ? 'ALL' : '10+');
                                else if (drop.pts >= 5) setSelectedPtsRange(selectedPtsRange === '5+' ? 'ALL' : '5+');
                                else setSelectedPtsRange(selectedPtsRange === 'under5' ? 'ALL' : 'under5');
                              }}
                              className={`font-black text-sm px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                selectedPtsRange !== 'ALL'
                                  ? 'bg-yellow-500 text-black border-yellow-400'
                                  : 'text-yellow-500 hover:text-yellow-300 border-transparent hover:border-yellow-500/30'
                              }`}
                              title="Filtrar por faixa de pontos"
                            >
                              {drop.pts}
                            </button>
                          </td>

                          {/* Abates (Filtro Clicável) */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (drop.kills >= 10) setSelectedKillsRange(selectedKillsRange === '10+' ? 'ALL' : '10+');
                                else if (drop.kills >= 7) setSelectedKillsRange(selectedKillsRange === '7+' ? 'ALL' : '7+');
                                else if (drop.kills >= 4) setSelectedKillsRange(selectedKillsRange === '4+' ? 'ALL' : '4+');
                                else if (drop.kills >= 1) setSelectedKillsRange(selectedKillsRange === '1+' ? 'ALL' : '1+');
                                else setSelectedKillsRange(selectedKillsRange === '0' ? 'ALL' : '0');
                              }}
                              className={`font-black text-sm px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                selectedKillsRange !== 'ALL'
                                  ? 'bg-red-500 text-black border-red-400'
                                  : 'text-red-500 hover:text-red-300 border-transparent hover:border-red-500/30'
                              }`}
                              title="Filtrar por faixa de abates"
                            >
                              {drop.kills}
                            </button>
                          </td>

                          {/* As 4 Habilidades Ativas Clicáveis para Filtro & Análise */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {drop.playersLoadout.map((p, pIdx) => {
                                const isSkillActive = selectedActiveSkill !== 'ALL' && p.hab1?.trim().toUpperCase() === selectedActiveSkill.trim().toUpperCase();

                                return (
                                  <button
                                    key={pIdx}
                                    onClick={() => {
                                      if (p.hab1) {
                                        setSelectedActiveSkill(selectedActiveSkill === p.hab1.trim() ? 'ALL' : p.hab1.trim());
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                      isSkillActive
                                        ? 'bg-yellow-500 text-black border-yellow-300 shadow-md shadow-yellow-500/20 font-black'
                                        : 'bg-black/60 hover:bg-black/90 border-yellow-500/20 hover:border-yellow-500/40 text-white'
                                    }`}
                                    title={`${p.player}: Clique para filtrar e analisar ${p.hab1 || 'Sem Ativa'}`}
                                  >
                                    {p.hab1Img ? (
                                      <img 
                                        src={p.hab1Img} 
                                        alt={p.hab1} 
                                        className={`w-4 h-4 object-contain rounded ${isSkillActive ? 'bg-black/20' : ''}`} 
                                      />
                                    ) : (
                                      <Zap size={12} className={isSkillActive ? 'text-black' : 'text-yellow-500'} />
                                    )}
                                    <span className="text-[10px] italic uppercase truncate max-w-[80px]">
                                      {p.hab1 || '-'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(drop.id)}
                              className={`p-1.5 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer ${
                                isExpanded 
                                  ? 'bg-yellow-500 text-black border-yellow-400' 
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                              }`}
                              title={isExpanded ? 'Recolher' : 'Ver Loadout Completo'}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                            </button>
                          </td>
                        </tr>

                        {/* Linha Expandida em Tabela */}
                        {isExpanded && (
                          <tr className="bg-black/80 border-y border-yellow-500/20">
                            <td colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {drop.playersLoadout.map((p, idx) => (
                                  <div key={idx} className="bg-[#141417] p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-1.5">
                                      <span className="text-xs font-black italic uppercase text-white">{p.player}</span>
                                      {p.funcao && <span className="text-[7px] font-bold text-gray-500 uppercase">{p.funcao}</span>}
                                    </div>
                                    <div className="text-[10px] font-bold text-yellow-400 mb-1 flex items-center gap-1">
                                      <Zap size={10} /> Ativa: {p.hab1}
                                    </div>
                                    <div className="text-[8px] text-gray-400 flex flex-wrap gap-1">
                                      <span>H2: {p.hab2 || '-'}</span> •
                                      <span>H3: {p.hab3 || '-'}</span> •
                                      <span>H4: {p.hab4 || '-'}</span>
                                    </div>
                                    <div className="text-[8px] text-gray-500 mt-1 flex gap-2">
                                      <span>Pet: {p.pet || '-'}</span>
                                      <span>Item: {p.item || '-'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 font-bold uppercase text-xs">
                      Nenhuma queda encontrada para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
