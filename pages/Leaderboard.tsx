
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Trophy, Crosshair, Crown, Layers, Star, ChevronRight, Shield, CheckCircle2, TrendingUp, Medal, Settings2, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, BookOpen, Globe, Info, LayoutGrid, ChevronDown, ChevronUp, SlidersHorizontal, Search, X, Target } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import RulesModal from '../components/RulesModal';
import MundialProjectionView from '../components/MundialProjectionView';
import { formatTeamName } from '../utils/teamUtils';

interface LeaderboardProps {
  data: DashboardData;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [generalTop12, setGeneralTop12] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'ALL' | 'QUALIFIERS' | 'RUMO_AO_MUNDIAL' | 'FINALS'>('RUMO_AO_MUNDIAL');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showProjectionModal, setShowProjectionModal] = useState(false);
  const [showProjectionView, setShowProjectionView] = useState(true);
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Section visibility states
  const [visibleSections, setVisibleSections] = useState({
    filters: false,
    top3: true,
    legend: true,
    table: true
  });

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const setAllSections = (show: boolean) => {
    setVisibleSections({
      filters: show,
      top3: show,
      legend: show,
      table: show
    });
  };
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof TeamStats; direction: 'asc' | 'desc' }>({
    key: 'pts',
    direction: 'desc'
  });

  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    team: true,
    bonus: true,
    rawPts: true,
    pts: true,
    ptsc: true,
    avgPtsc: true,
    avgPts: true,
    abts: true,
    avgAbts: true,
    b: true,
    s: true
  });
  
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

  // Filtros baseados estritamente na fDetalhes (data.details)
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.details.map(d => d.TIME))).filter(Boolean).sort(),
    players: [],
    weapons: [],
    safes: [],
    maps: Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean).map(String).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)),
    quedas: Array.from(new Set(data.details.map(d => d.Q))).filter(Boolean).map(String).sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)),
    confrontations: Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort(),
    grupos: Array.from(new Set((Array.isArray(data?.teamsReference) ? data.teamsReference : []).map(t => t.GRUPO))).filter(Boolean).sort() as string[],
  }), [data.details, data.teamsReference, data.confrontationsDimension, data.killFeed, data.characters, data.players]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  const matchRd = (filterVal: string, itemVal: string | undefined | null): boolean => {
    if (!itemVal) return false;
    const normF = normalize(filterVal);
    const normI = normalize(itemVal);
    if (normF === normI) return true;
    const numF = normF.replace(/\D/g, '');
    const numI = normI.replace(/\D/g, '');
    if (numF && numI && numF === numI) return true;
    return false;
  };

  const matchQ = (filterVal: string, itemVal: string | undefined | null): boolean => {
    if (!itemVal) return false;
    const normF = normalize(filterVal);
    const normI = normalize(itemVal);
    if (normF === normI) return true;
    const numF = normF.replace(/\D/g, '');
    const numI = normI.replace(/\D/g, '');
    if (numF && numI && numF === numI) return true;
    return false;
  };

  useEffect(() => {
    if (!data.loading) {
      // 1. Obter os classificados da 1ª Fase (Classificatória - Rodadas 1 a 14)
      const qualiDetails = data.details.filter(d => {
        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;
        const confrontoNorm = normalize(d.CONFRONTO);
        const rdNorm = normalize(d.RD);
        const isQualiText = confrontoNorm.includes('CLASSIF') || confrontoNorm.includes('QUALI') || rdNorm.includes('CLASSIF') || rdNorm.includes('FASE 1') || rdNorm.includes('1A FASE') || rdNorm.includes('1ª FASE');
        const isQualiRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('FINAL'))) && (roundNum === 0 || (roundNum >= 1 && roundNum <= 14));
        return isQualiText || isQualiRound;
      });
      const qualiStats = calculateTeamStats({ ...data, details: qualiDetails });
      const top12QualiList = qualiStats.slice(0, 12);
      setGeneralTop12(new Set(top12QualiList.map(s => s.name)));

      // 2. Lógica Especial para a 2ª Fase: Rumo ao Mundial
      if (phase === 'RUMO_AO_MUNDIAL') {
        const BONUS_POINTS_TABLE = [50, 42, 35, 29, 24, 19, 15, 11, 8, 5, 2, 0];
        const bonusMap = new Map<string, number>();
        top12QualiList.forEach((team, idx) => {
          bonusMap.set(team.name, BONUS_POINTS_TABLE[idx] ?? 0);
        });

        // Filtrar partidas da 2ª Fase (Rodadas 15 a 20 ou confronto RUMO AO MUNDIAL)
        const rumoDetails = data.details.filter(d => {
          if (filters.team.length > 0 && !filters.team.some(t => normalize(t) === normalize(d.TIME))) return false;
          if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
          if (filters.rodada.length > 0 && !filters.rodada.some(r => matchRd(r, d.RD))) return false;
          if (filters.queda.length > 0 && !filters.queda.some(q => matchQ(q, d.Q))) return false;
          if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;

          const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;
          const confrontoNorm = normalize(d.CONFRONTO);
          const rdNorm = normalize(d.RD);
          const isRumoText = confrontoNorm.includes('RUMO') || confrontoNorm.includes('MUNDIAL') || confrontoNorm.includes('FASE 2') || confrontoNorm.includes('2A FASE') || confrontoNorm.includes('2ª FASE') || rdNorm.includes('RUMO') || rdNorm.includes('MUNDIAL');
          const isRumoRound = (!confrontoNorm || (!confrontoNorm.includes('CLASSIF') && !confrontoNorm.includes('FINAL'))) && (roundNum >= 15 && roundNum <= 20);
          return isRumoText || isRumoRound;
        });

        // Partidas jogadas da 2ª Fase
        const rumoPlayedStats = calculateTeamStats({ ...data, details: rumoDetails });
        const rumoPlayedMap = new Map<string, TeamStats>();
        rumoPlayedStats.forEach(s => rumoPlayedMap.set(s.name, s));

        // Construir as 12 equipes da 2ª Fase, inicializando cada uma com seus pontos extras
        let rumoStatsList: TeamStats[] = top12QualiList.map((qualiTeam, idx) => {
          const bonus = bonusMap.get(qualiTeam.name) ?? 0;
          const played = rumoPlayedMap.get(qualiTeam.name);

          const s = played?.s || 0;
          const b = played?.b || 0;
          const abts = played?.abts || 0;
          const matchPtsc = played?.ptsc || 0;
          const rawPts = abts + matchPtsc; // Pontos obtidos nas quedas (sem bônus)
          const ptsc = matchPtsc; // Pontos de colocação não incluem bônus
          const pts = rawPts + bonus; // Pontos totais = quedas + bônus

          const avgPts = s > 0 ? parseFloat((rawPts / s).toFixed(2)) : 0; // Média de pontos sem bônus / quedas
          const avgPtsc = s > 0 ? parseFloat((ptsc / s).toFixed(2)) : 0; // Média de pontos de colocação por queda
          const avgAbts = s > 0 ? parseFloat((abts / s).toFixed(2)) : 0;
          const percentPos = rawPts > 0 ? parseFloat(((ptsc / rawPts) * 100).toFixed(1)) : 0;
          const percentAbts = rawPts > 0 ? parseFloat(((abts / rawPts) * 100).toFixed(1)) : 0;
          const lastPos = played?.lastPos && played.lastPos < 99 ? played.lastPos : (idx + 1);

          return {
            name: qualiTeam.name,
            image: qualiTeam.image,
            grupo: qualiTeam.grupo,
            s,
            b,
            ptsc,
            abts,
            pts,
            rawPts,
            avgAbts,
            avgPts,
            avgPtsc,
            percentPos,
            percentAbts,
            lastPos,
            bonusPts: bonus
          };
        });

        // Filtro por equipe
        if (filters.team.length > 0) {
          rumoStatsList = rumoStatsList.filter(t => filters.team.some(ft => normalize(ft) === normalize(t.name)));
        }

        // Filtro por grupo
        if (filters.grupo.length > 0) {
          rumoStatsList = rumoStatsList.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
        }

        // Ordenação oficial da 2ª Fase: Rumo ao Mundial
        // Critérios oficiais:
        // 1º Pontos Totais
        // 2º Soma de Booyahs (Vitórias)
        // 3º Soma de abates
        // 4º Pontuação bônus / classificação da 1ª Fase quando nenhuma partida foi jogada
        // 5º Colocação na última queda
        rumoStatsList.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          if (b.b !== a.b) return b.b - a.b;
          if (b.abts !== a.abts) return b.abts - a.abts;
          if (a.s === 0 && b.s === 0) return (b.bonusPts || 0) - (a.bonusPts || 0);
          return a.lastPos - b.lastPos;
        });

        setStats(rumoStatsList);
        return;
      }

      // 3. Demais Fases (Classificatórias, Grande Final, Todas)
      let filteredDetails = data.details.filter(d => {
        if (filters.team.length > 0 && !filters.team.some(t => normalize(t) === normalize(d.TIME))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
        if (filters.rodada.length > 0 && !filters.rodada.some(r => matchRd(r, d.RD))) return false;
        if (filters.queda.length > 0 && !filters.queda.some(q => matchQ(q, d.Q))) return false;
        if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;

        const confrontoNorm = normalize(d.CONFRONTO);
        const rdNorm = normalize(d.RD);
        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;

        if (phase === 'QUALIFIERS') {
          const isQualiText = confrontoNorm.includes('CLASSIF') || confrontoNorm.includes('QUALI') || rdNorm.includes('CLASSIF') || rdNorm.includes('FASE 1') || rdNorm.includes('1A FASE') || rdNorm.includes('1ª FASE');
          const isQualiRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('FINAL'))) && (roundNum === 0 || (roundNum >= 1 && roundNum <= 14));
          if (!isQualiText && !isQualiRound) return false;
        } else if (phase === 'FINALS') {
          const isFinalText = confrontoNorm.includes('FINAL') || confrontoNorm.includes('CHAMPION') || confrontoNorm.includes('FASE 3') || confrontoNorm.includes('3A FASE') || confrontoNorm.includes('3ª FASE') || rdNorm.includes('FINAL');
          const isFinalRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('CLASSIF'))) && (roundNum >= 21);
          if (!isFinalText && !isFinalRound) return false;
        }

        return true;
      });

      // Fallback: se a fase filtrar tudo por ausência de tags de fase E NÃO houver filtros ativos do usuário
      const hasUserFilters = filters.rodada.length > 0 || filters.queda.length > 0 || filters.team.length > 0 || filters.map.length > 0 || filters.confrontation.length > 0;
      if (filteredDetails.length === 0 && phase !== 'ALL' && data.details.length > 0 && !hasUserFilters) {
        filteredDetails = data.details;
      }

      const filteredData = { ...data, details: filteredDetails };
      let calculatedStats = calculateTeamStats(filteredData).map(s => {
        const rawPts = s.pts - (s.bonusPts || 0);
        return {
          ...s,
          rawPts,
          avgPts: s.s > 0 ? parseFloat((rawPts / s.s).toFixed(2)) : 0,
          avgPtsc: s.s > 0 ? parseFloat((s.ptsc / s.s).toFixed(2)) : 0
        };
      });

      // Filtro de Grupo
      if (filters.grupo.length > 0) {
        calculatedStats = calculatedStats.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
      }
      
      setStats(calculatedStats);
    }
  }, [data, filters, phase]);

  const handleTeamClick = (teamName: string) => {
      navigate('/teams', { state: { team: teamName } });
  };

  const filteredStats = useMemo(() => {
    if (!searchTerm.trim()) return stats;
    const term = normalize(searchTerm);
    return stats.filter(s => normalize(s.name).includes(term) || (s.grupo && normalize(s.grupo).includes(term)));
  }, [stats, searchTerm]);

  const sortedStats = useMemo(() => {
    const sortableItems = [...filteredStats];
    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'pts') {
        if (b.pts !== a.pts) return sortConfig.direction === 'desc' ? b.pts - a.pts : a.pts - b.pts;
        if (b.b !== a.b) return sortConfig.direction === 'desc' ? b.b - a.b : a.b - b.b;
        if (b.abts !== a.abts) return sortConfig.direction === 'desc' ? b.abts - a.abts : a.abts - b.abts;
        if (a.s === 0 && b.s === 0) return sortConfig.direction === 'desc' ? (b.bonusPts || 0) - (a.bonusPts || 0) : (a.bonusPts || 0) - (b.bonusPts || 0);
        return sortConfig.direction === 'desc' ? a.lastPos - b.lastPos : b.lastPos - a.lastPos;
      }
      
      if (sortConfig.key === 'rawPts') {
        const rawA = a.rawPts !== undefined ? a.rawPts : (a.pts - (a.bonusPts || 0));
        const rawB = b.rawPts !== undefined ? b.rawPts : (b.pts - (b.bonusPts || 0));
        if (rawB !== rawA) return sortConfig.direction === 'desc' ? rawB - rawA : rawA - rawB;
        if (b.b !== a.b) return sortConfig.direction === 'desc' ? b.b - a.b : a.b - b.b;
        if (b.abts !== a.abts) return sortConfig.direction === 'desc' ? b.abts - a.abts : a.abts - b.abts;
        if (b.ptsc !== a.ptsc) return sortConfig.direction === 'desc' ? b.ptsc - a.ptsc : a.ptsc - b.ptsc;
        return sortConfig.direction === 'desc' ? a.lastPos - b.lastPos : b.lastPos - a.lastPos;
      }

      if (sortConfig.key === 'bonusPts') {
        const bonA = a.bonusPts || 0;
        const bonB = b.bonusPts || 0;
        if (bonB !== bonA) return sortConfig.direction === 'desc' ? bonB - bonA : bonA - bonB;
        if (b.pts !== a.pts) return sortConfig.direction === 'desc' ? b.pts - a.pts : a.pts - b.pts;
        if (b.b !== a.b) return sortConfig.direction === 'desc' ? b.b - a.b : a.b - b.b;
        return sortConfig.direction === 'desc' ? a.lastPos - b.lastPos : b.lastPos - a.lastPos;
      }

      if (sortConfig.key === 'b') {
        if (b.b !== a.b) return sortConfig.direction === 'desc' ? b.b - a.b : a.b - b.b;
        if (b.pts !== a.pts) return sortConfig.direction === 'desc' ? b.pts - a.pts : a.pts - b.pts;
        if (b.abts !== a.abts) return sortConfig.direction === 'desc' ? b.abts - a.abts : a.abts - b.abts;
        return sortConfig.direction === 'desc' ? a.lastPos - b.lastPos : b.lastPos - a.lastPos;
      }

      if (sortConfig.key === 'abts') {
        if (b.abts !== a.abts) return sortConfig.direction === 'desc' ? b.abts - a.abts : a.abts - b.abts;
        if (b.pts !== a.pts) return sortConfig.direction === 'desc' ? b.pts - a.pts : a.pts - b.pts;
        if (b.b !== a.b) return sortConfig.direction === 'desc' ? b.b - a.b : a.b - b.b;
        return sortConfig.direction === 'desc' ? a.lastPos - b.lastPos : b.lastPos - a.lastPos;
      }

      const aVal = (a[sortConfig.key] !== undefined ? a[sortConfig.key] : 0) as number;
      const bVal = (b[sortConfig.key] !== undefined ? b[sortConfig.key] : 0) as number;

      if (aVal !== bVal) {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (b.pts !== a.pts) return b.pts - a.pts;
      return a.lastPos - b.lastPos;
    });
    return sortableItems;
  }, [filteredStats, sortConfig]);

  const isSingleColumn = useMemo(() => sortedStats.length <= 12, [sortedStats]);
  
  const { leftStats, rightStats } = useMemo(() => {
    if (isSingleColumn) {
      return { leftStats: sortedStats, rightStats: [] as TeamStats[] };
    } else {
      const half = Math.ceil(sortedStats.length / 2);
      return {
        leftStats: sortedStats.slice(0, half),
        rightStats: sortedStats.slice(half)
      };
    }
  }, [sortedStats, isSingleColumn]);

  const requestSort = (key: keyof TeamStats) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  if (data.loading) return <div className="text-center py-20 text-yellow-500 animate-pulse font-bold uppercase tracking-widest italic">CARREGANDO CLASSIFICAÇÃO...</div>;

  const topBooyahs = [...stats].sort((a, b) => b.b - a.b || (b.rawPts ?? b.pts) - (a.rawPts ?? a.pts)).slice(0, 3);
  const topPtsc = [...stats].sort((a, b) => b.ptsc - a.ptsc || (b.rawPts ?? b.pts) - (a.rawPts ?? a.pts)).slice(0, 3);
  const topAbts = [...stats].sort((a, b) => b.abts - a.abts || (b.rawPts ?? b.pts) - (a.rawPts ?? a.pts)).slice(0, 3);
  const topPts = [...stats].sort((a, b) => {
    const ptsA = a.rawPts !== undefined ? a.rawPts : a.pts;
    const ptsB = b.rawPts !== undefined ? b.rawPts : b.pts;
    if (ptsB !== ptsA) return ptsB - ptsA;
    if (b.b !== a.b) return b.b - a.b;
    if (b.abts !== a.abts) return b.abts - a.abts;
    return a.lastPos - b.lastPos;
  }).slice(0, 3);

  const Top3Card = ({ title, icon, teams, metricKey, metricLabel, colorClass }: any) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-5 sm:p-6 border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-all shadow-lg">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-black uppercase italic text-gray-200 mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="space-y-3">
        {teams.map((team: any, idx: number) => {
          const isLoud = team.name.toLowerCase().includes('loud');
          return (
            <div 
              key={team.name} 
              onClick={() => handleTeamClick(team.name)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                isLoud 
                  ? 'bg-gradient-to-r from-yellow-500/30 via-amber-500/20 to-yellow-500/10 border-yellow-400 shadow-[0_0_18px_rgba(234,179,8,0.35)] ring-1 ring-yellow-400/40' 
                  : 'bg-[#0f0f0f] border-gray-800 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-sm skew-x-[-10deg] flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="flex items-center gap-2.5">
                   {team.image && (
                     <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${isLoud ? 'bg-black p-0.5 border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-black/40 p-0.5 border border-gray-700'}`}>
                       <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                     </div>
                   )}
                   <div className="flex flex-col min-w-0">
                     <span className={`font-black text-sm uppercase tracking-tight flex items-center gap-1 ${isLoud ? 'text-yellow-300 font-display' : 'text-gray-200 hover:text-yellow-400'}`}>
                       {formatTeamName(team.name)}
                       {isLoud && <Star size={13} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                     </span>
                     {isLoud && <span className="text-[8px] text-yellow-300 font-black uppercase tracking-widest">★ TIME DESTAQUE</span>}
                   </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`block font-black text-xl sm:text-2xl italic ${isLoud ? 'text-yellow-300 drop-shadow' : colorClass}`}>
                  {team[metricKey] !== undefined ? team[metricKey] : team.pts}
                </span>
                <span className="text-[9px] text-gray-500 uppercase font-bold">{metricLabel}</span>
                {metricKey === 'rawPts' && Boolean(team.bonusPts && team.bonusPts > 0) && (
                  <span className="block text-[8px] text-yellow-500/80 font-mono">
                    +{team.bonusPts} bônus (Total: {team.pts})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TableHeader = () => {
    const SortIcon = ({ column }: { column: keyof TeamStats }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={10} className="opacity-25 group-hover:opacity-60" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={11} className="text-yellow-400 font-bold" /> : <ArrowDown size={11} className="text-yellow-400 font-bold" />;
    };

    return (
      <thead className="bg-[#0c0c0e] text-gray-400 text-[9px] sm:text-[10px] uppercase font-black tracking-tight border-b border-gray-800">
        <tr>
          {visibleColumns.rank && (
            <th className="sticky left-0 z-30 bg-[#0c0c0e] px-1 sm:px-2 py-3 text-center w-8 sm:w-10 border-r border-gray-800">
              #
            </th>
          )}
          {visibleColumns.team && (
            <th className="sticky left-8 sm:left-10 z-30 bg-[#0c0c0e] px-2.5 sm:px-3 py-3 text-left min-w-[145px] sm:min-w-[190px] border-r border-gray-800 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
              Equipe
            </th>
          )}
          {phase === 'RUMO_AO_MUNDIAL' && visibleColumns.bonus && (
            <th 
              className={`px-2 py-3 text-center cursor-pointer group w-14 sm:w-16 border-r border-purple-500/20 transition-all ${
                sortConfig.key === 'bonusPts' 
                  ? 'bg-purple-900/60 text-purple-200 font-black ring-1 ring-purple-400/50' 
                  : 'bg-purple-950/30 text-purple-300 font-bold hover:bg-purple-900/40'
              }`}
              onClick={() => requestSort('bonusPts' as any)}
              title="Pontos Bônus de Largada (1ª Fase) - Clique para ordenar/filtrar"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>BÔNUS</span> <SortIcon column={'bonusPts' as any} />
              </div>
            </th>
          )}
          {phase === 'RUMO_AO_MUNDIAL' && visibleColumns.rawPts && (
            <th 
              className={`px-2 py-3 text-center cursor-pointer group min-w-[85px] sm:w-24 border-r border-cyan-500/30 transition-all ${
                sortConfig.key === 'rawPts' 
                  ? 'bg-cyan-900/70 text-cyan-200 font-black ring-1 ring-cyan-400/60 shadow-inner' 
                  : 'bg-cyan-950/35 text-cyan-300 font-bold hover:bg-cyan-900/40'
              }`}
              onClick={() => requestSort('rawPts' as any)}
              title="Pontos conquistados exclusivamente nas quedas (sem bônus) - Clique para ordenar/filtrar"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>PTS S/ BÔNUS</span> <SortIcon column={'rawPts' as any} />
              </div>
            </th>
          )}
          {visibleColumns.pts && (
            <th 
              className={`px-2 py-3 text-center cursor-pointer group w-14 sm:w-16 transition-all ${
                sortConfig.key === 'pts' 
                  ? 'bg-yellow-500/20 text-yellow-300 font-black ring-1 ring-yellow-400/50' 
                  : 'bg-yellow-900/15 text-yellow-500 font-bold hover:bg-yellow-900/30'
              }`}
              onClick={() => requestSort('pts')}
              title={phase === 'RUMO_AO_MUNDIAL' ? "Pontos Totais (Pontos em Jogo + Bônus) - Clique para ordenar" : "Pontos Totais"}
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                <span>{phase === 'RUMO_AO_MUNDIAL' ? 'PTS TOTAL' : 'PTS'}</span> <SortIcon column="pts" />
              </div>
            </th>
          )}
          {visibleColumns.ptsc && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-12 sm:w-14 transition-all ${
                sortConfig.key === 'ptsc' ? 'bg-orange-500/20 text-orange-300 font-black' : 'text-orange-400/80 hover:bg-white/5'
              }`}
              onClick={() => requestSort('ptsc')}
              title="Pontos de Colocação (conquistados em quedas, sem bônus)"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">PTS/C <SortIcon column="ptsc" /></div>
            </th>
          )}
          {visibleColumns.avgPtsc && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-14 sm:w-16 transition-all ${
                sortConfig.key === 'avgPtsc' ? 'bg-orange-500/20 text-orange-300 font-black' : 'text-orange-500/80 hover:bg-white/5'
              }`}
              onClick={() => requestSort('avgPtsc')}
              title="Média de Pontos de Colocação por Queda (PTS/C ÷ Quedas)"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">M.PTS/C <SortIcon column="avgPtsc" /></div>
            </th>
          )}
          {visibleColumns.avgPts && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-14 sm:w-16 transition-all ${
                sortConfig.key === 'avgPts' ? 'bg-yellow-500/20 text-yellow-300 font-black' : 'text-yellow-600/80 hover:bg-white/5'
              }`}
              onClick={() => requestSort('avgPts')}
              title="Média de Pontos por Queda (Pontos sem bônus ÷ Quedas)"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">M.PTS <SortIcon column="avgPts" /></div>
            </th>
          )}
          {visibleColumns.abts && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-12 sm:w-14 transition-all ${
                sortConfig.key === 'abts' ? 'bg-red-500/20 text-red-300 font-black' : 'text-red-400/90 hover:bg-white/5'
              }`}
              onClick={() => requestSort('abts')}
              title="Abates Totais"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">ABTS <SortIcon column="abts" /></div>
            </th>
          )}
          {visibleColumns.avgAbts && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-14 sm:w-16 transition-all ${
                sortConfig.key === 'avgAbts' ? 'bg-red-500/20 text-red-300 font-black' : 'text-red-500/80 hover:bg-white/5'
              }`}
              onClick={() => requestSort('avgAbts')}
              title="Média de Abates por Queda"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">M.ABTS <SortIcon column="avgAbts" /></div>
            </th>
          )}
          {visibleColumns.b && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-10 sm:w-12 transition-all ${
                sortConfig.key === 'b' ? 'bg-yellow-500/20 text-yellow-300 font-black' : 'text-yellow-500/90 hover:bg-white/5'
              }`}
              onClick={() => requestSort('b')}
              title="Booyahs (Vitórias)"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">B <SortIcon column="b" /></div>
            </th>
          )}
          {visibleColumns.s && (
            <th 
              className={`px-1.5 sm:px-2 py-3 text-center cursor-pointer group w-10 sm:w-12 transition-all ${
                sortConfig.key === 's' ? 'bg-white/15 text-white font-black' : 'text-gray-400 hover:bg-white/5'
              }`}
              onClick={() => requestSort('s')}
              title="Quedas Jogadas"
            >
              <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">S <SortIcon column="s" /></div>
            </th>
          )}
        </tr>
      </thead>
    );
  };

  const TableRow = ({ team, index }: { team: TeamStats, index: number, key?: React.Key }) => {
    const isTop2Rumo = phase === 'RUMO_AO_MUNDIAL' && index < 2;
    const isTop12 = index < 12;
    const isGeneralFinalist = generalTop12.has(team.name);
    const isLoud = team.name.toLowerCase().includes('loud');
    const rawPoints = team.rawPts !== undefined ? team.rawPts : (team.pts - (team.bonusPts || 0));
    
    return (
      <tr 
        onClick={() => handleTeamClick(team.name)} 
        className={`transition-all group cursor-pointer border-b ${
          isLoud 
            ? 'bg-gradient-to-r from-yellow-500/30 via-yellow-400/15 to-transparent border-y-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)] font-bold hover:from-yellow-500/40' 
            : isTop2Rumo
              ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 hover:bg-emerald-500/20'
              : `hover:bg-yellow-900/10 border-gray-800/50 ${isTop12 ? 'relative overflow-hidden bg-yellow-500/5' : ''}`
        }`}
      >
        {visibleColumns.rank && (
          <td className={`sticky left-0 z-20 px-1 sm:px-2 py-3 text-center font-mono text-[11px] sm:text-xs border-r border-gray-800 transition-colors ${
            isLoud 
              ? 'bg-[#1a1708] group-hover:bg-[#24200b]' 
              : isTop2Rumo 
                ? 'bg-[#091510] group-hover:bg-[#0f221a]' 
                : 'bg-[#101014] group-hover:bg-[#181820]'
          }`}>
              {(isTop2Rumo || isTop12 || isLoud) && (
                <div className={`absolute left-0 top-0 bottom-0 ${
                  isLoud 
                    ? 'w-1 sm:w-1.5 bg-yellow-400 shadow-[0_0_12px_#facc15]' 
                    : isTop2Rumo
                      ? 'w-1 sm:w-1.5 bg-emerald-400 shadow-[0_0_12px_#34d399]'
                      : 'w-0.5 sm:w-1 bg-yellow-500 shadow-[0_0_10px_#facc15]'
                }`}></div>
              )}
              <span className={
                isLoud 
                  ? 'text-yellow-300 font-black text-xs sm:text-sm flex items-center justify-center gap-0.5' 
                  : isTop2Rumo
                    ? 'text-emerald-400 font-black text-xs sm:text-sm'
                    : isTop12 
                      ? 'text-yellow-500 font-black' 
                      : 'text-gray-500'
              }>
                {index + 1} {isLoud && <Star size={11} className="fill-yellow-400 text-yellow-400 shrink-0 inline" />}
              </span>
          </td>
        )}
        {visibleColumns.team && (
          <td className={`sticky left-8 sm:left-10 z-20 px-2 sm:px-3 py-2.5 font-bold text-white min-w-[145px] sm:min-w-[190px] border-r border-gray-800 shadow-[4px_0_10px_rgba(0,0,0,0.5)] transition-colors ${
            isLoud 
              ? 'bg-[#1a1708] group-hover:bg-[#24200b]' 
              : isTop2Rumo 
                ? 'bg-[#091510] group-hover:bg-[#0f221a]' 
                : 'bg-[#101014] group-hover:bg-[#181820]'
          }`}>
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full">
              {team.image && (
                <div className={`rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${
                  isLoud 
                    ? 'w-8 h-8 sm:w-10 sm:h-10 bg-black p-0.5 sm:p-1 border-2 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)] ring-1 ring-yellow-300' 
                    : isTop2Rumo
                      ? 'w-7 h-7 sm:w-9 sm:h-9 bg-black/60 p-0.5 border border-emerald-500/60 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                      : 'w-7 h-7 sm:w-8 sm:h-8 bg-black/40 p-0.5 border border-gray-700/60'
                }`}>
                  <img src={team.image} className="w-full h-full object-contain" alt={team.name}/>
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
                <span className={`uppercase italic font-black truncate flex items-center gap-1 ${
                  isLoud 
                    ? 'text-xs sm:text-base text-yellow-300 drop-shadow-sm tracking-wide' 
                    : isTop2Rumo
                      ? 'text-xs sm:text-sm text-emerald-300 font-display'
                      : isTop12 
                        ? 'text-xs sm:text-sm text-yellow-400' 
                        : 'text-xs sm:text-sm text-gray-200'
                }`}>
                    <span className="truncate">{formatTeamName(team.name)}</span>
                    {isLoud && <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                </span>
                {isLoud ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-0.5 truncate">
                      ★ LOUD
                    </span>
                    {phase === 'RUMO_AO_MUNDIAL' && isTop2Rumo && (
                      <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 rounded uppercase tracking-wider flex items-center gap-0.5">
                        <Globe size={7} /> VAGA MUNDIAL
                      </span>
                    )}
                  </div>
                ) : phase === 'RUMO_AO_MUNDIAL' ? (
                  isTop2Rumo ? (
                    <span className="text-[7.5px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 w-fit whitespace-nowrap">
                      <Globe size={8} className="shrink-0 text-emerald-400" /> VAGA MUNDIAL
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 w-fit whitespace-nowrap">
                      <CheckCircle2 size={8} className="shrink-0 text-purple-400" /> FINALISTA
                    </span>
                  )
                ) : isGeneralFinalist ? (
                    <span className="text-[7px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1 truncate">
                        <CheckCircle2 size={7} className="shrink-0" /> FINALISTA
                    </span>
                ) : null}
              </div>
            </div>
          </td>
        )}
        {phase === 'RUMO_AO_MUNDIAL' && visibleColumns.bonus && (
          <td className="px-1 sm:px-2 py-3 text-center border-r border-gray-800/40">
            <span className={`inline-flex items-center justify-center font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-lg border ${
              (team.bonusPts || 0) > 0 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]' 
                : 'bg-gray-800/40 text-gray-500 border-gray-800'
            }`}>
              +{team.bonusPts ?? 0}
            </span>
          </td>
        )}
        {phase === 'RUMO_AO_MUNDIAL' && visibleColumns.rawPts && (
          <td className={`px-1 sm:px-2 py-3 text-center border-r border-gray-800/40 ${sortConfig.key === 'rawPts' ? 'bg-cyan-950/20' : ''}`}>
            <span className={`inline-flex items-center justify-center font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded-lg border ${
              rawPoints > 0 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]' 
                : 'bg-gray-800/40 text-gray-400 border-gray-800'
            }`}>
              {rawPoints}
            </span>
          </td>
        )}
        {visibleColumns.pts && (
          <td className={`px-1.5 sm:px-2 py-3 text-center ${sortConfig.key === 'pts' ? 'bg-yellow-950/15' : ''}`}>
            <span className={`inline-flex items-center justify-center min-w-[2.5rem] font-mono font-black ${
              isLoud 
                ? 'bg-yellow-400 text-black text-sm sm:text-base px-2.5 py-1 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.6)] ring-2 ring-yellow-200 font-extrabold' 
                : isTop2Rumo
                  ? 'text-emerald-200 bg-emerald-500/20 border border-emerald-500/40 text-xs sm:text-sm px-2 py-0.5 rounded-lg font-extrabold'
                  : isTop12 
                    ? 'text-white bg-yellow-600/25 border border-yellow-500/30 text-xs sm:text-sm px-2 py-0.5 rounded-lg' 
                    : 'text-yellow-400 bg-yellow-900/20 text-xs sm:text-sm px-2 py-0.5 rounded-lg'
            }`}>
              {team.pts}
            </span>
          </td>
        )}
        {visibleColumns.ptsc && <td className={`px-1.5 sm:px-2 py-3 text-center ${isLoud ? 'text-orange-300 font-black text-xs sm:text-sm' : 'text-orange-400/80 font-bold text-[10px] sm:text-[11px]'}`}>{team.ptsc}</td>}
        {visibleColumns.avgPtsc && <td className={`px-1.5 sm:px-2 py-3 text-center font-mono ${isLoud ? 'text-orange-200 font-black text-xs sm:text-sm' : 'text-orange-500/80 text-[9px] sm:text-[10px]'}`}>{team.avgPtsc}</td>}
        {visibleColumns.avgPts && <td className={`px-1.5 sm:px-2 py-3 text-center font-mono ${isLoud ? 'text-yellow-200 font-black text-xs sm:text-sm' : 'text-yellow-600/70 text-[9px] sm:text-[10px]'}`}>{team.avgPts}</td>}
        {visibleColumns.abts && <td className={`px-1.5 sm:px-2 py-3 text-center ${isLoud ? 'text-red-300 font-black text-xs sm:text-sm' : 'text-red-400 font-bold text-[10px] sm:text-[11px]'}`}>{team.abts}</td>}
        {visibleColumns.avgAbts && <td className={`px-1.5 sm:px-2 py-3 text-center font-mono ${isLoud ? 'text-red-200 font-black text-xs sm:text-sm' : 'text-red-600/70 text-[9px] sm:text-[10px]'}`}>{team.avgAbts}</td>}
        {visibleColumns.b && <td className={`px-1.5 sm:px-2 py-3 text-center ${isLoud ? 'text-yellow-300 font-black text-xs sm:text-sm' : 'text-yellow-500 font-bold text-[10px] sm:text-[11px]'}`}>{team.b}</td>}
        {visibleColumns.s && <td className={`px-1.5 sm:px-2 py-3 text-center ${isLoud ? 'text-gray-100 font-black text-xs sm:text-sm' : 'text-gray-400 text-[10px] sm:text-[11px]'}`}>{team.s}</td>}
      </tr>
    );
  };

  const TeamCardMobile = ({ team, index }: { team: TeamStats, index: number, key?: React.Key }) => {
    const isTop2Rumo = phase === 'RUMO_AO_MUNDIAL' && index < 2;
    const isTop12 = index < 12;
    const isLoud = team.name.toLowerCase().includes('loud');
    const rawPoints = team.rawPts !== undefined ? team.rawPts : (team.pts - (team.bonusPts || 0));

    return (
      <div 
        onClick={() => handleTeamClick(team.name)}
        className={`rounded-2xl p-4 transition-all cursor-pointer border relative overflow-hidden active:scale-[0.99] ${
          isLoud
            ? 'bg-gradient-to-r from-yellow-500/25 via-[#1a1708] to-[#121215] border-yellow-400/80 shadow-[0_0_20px_rgba(234,179,8,0.25)] ring-1 ring-yellow-400/40'
            : isTop2Rumo
              ? 'bg-gradient-to-r from-emerald-500/20 via-[#0a1812] to-[#121215] border-emerald-500/60 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
              : isTop12
                ? 'bg-[#18181c] border-gray-800 hover:border-yellow-600/50 hover:bg-[#1f1f25]'
                : 'bg-[#141416] border-gray-900 opacity-90'
        }`}
      >
        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 ${
          isLoud
            ? 'w-1.5 bg-yellow-400 shadow-[0_0_10px_#facc15]'
            : isTop2Rumo
              ? 'w-1.5 bg-emerald-400 shadow-[0_0_10px_#34d399]'
              : isTop12
                ? 'w-1 bg-yellow-500/80'
                : 'w-1 bg-gray-700'
        }`} />

        <div className="pl-2">
          {/* Top Row: Rank, Logo, Team Name and Badges */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Rank Badge */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                isLoud
                  ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.6)] font-black'
                  : index === 0
                    ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-black'
                    : index === 1
                      ? 'bg-gradient-to-br from-emerald-300 to-teal-600 text-black'
                      : index === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black'
                        : isTop12
                          ? 'bg-purple-900/60 border border-purple-500/40 text-purple-200'
                          : 'bg-black/60 border border-gray-800 text-gray-400'
              }`}>
                #{index + 1}
              </div>

              {/* Logo */}
              {team.image && (
                <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 ${
                  isLoud
                    ? 'bg-black border-2 border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                    : isTop2Rumo
                      ? 'bg-black/80 border border-emerald-400/60'
                      : 'bg-black/50 border border-gray-700'
                }`}>
                  <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                </div>
              )}

              {/* Team Name and Phase Tag */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className={`font-black text-sm uppercase tracking-tight truncate ${
                    isLoud ? 'text-yellow-300 font-display text-base' : 'text-white'
                  }`}>
                    {formatTeamName(team.name)}
                  </h3>
                  {isLoud && <Star size={14} className="fill-yellow-400 text-yellow-400 shrink-0" />}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  {team.grupo && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase bg-black/40 px-1.5 py-0.2 rounded border border-gray-800">
                      {team.grupo}
                    </span>
                  )}
                  {phase === 'RUMO_AO_MUNDIAL' ? (
                    isTop2Rumo ? (
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                        <Globe size={10} /> VAGA MUNDIAL
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} /> FINALISTA
                      </span>
                    )
                  ) : isLoud ? (
                    <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">
                      ★ TIME DESTAQUE
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Total Points Main Pill */}
            <div className="text-right shrink-0">
              <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center min-w-[72px] ${
                isLoud
                  ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                  : isTop2Rumo
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}>
                <span className="text-[8px] font-black uppercase tracking-wider opacity-80">
                  {phase === 'RUMO_AO_MUNDIAL' ? 'PTS TOTAL' : 'PONTOS'}
                </span>
                <span className="font-mono font-black text-lg leading-none mt-0.5">
                  {team.pts}
                </span>
              </div>
            </div>
          </div>

          {/* Points Breakdown for Rumo ao Mundial */}
          {phase === 'RUMO_AO_MUNDIAL' && (
            <div className="grid grid-cols-2 gap-2 mb-3 bg-black/40 p-2.5 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between px-2 py-1 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                <span className="text-[10px] font-bold text-purple-300 uppercase">Bônus (1ª Fase):</span>
                <span className="font-mono font-black text-xs text-purple-200">+{team.bonusPts ?? 0} pts</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Pts s/ Bônus:</span>
                <span className="font-mono font-black text-xs text-cyan-200">{rawPoints} pts</span>
              </div>
            </div>
          )}

          {/* Secondary Stats Strip */}
          <div className="grid grid-cols-5 gap-1.5 text-center bg-[#0d0d0f] p-2 rounded-xl border border-gray-800/60">
            <div className="p-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">Booyahs</span>
              <span className="text-xs font-black text-yellow-400 font-mono flex items-center justify-center gap-0.5">
                <Trophy size={10} /> {team.b}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">Abates</span>
              <span className="text-xs font-black text-red-400 font-mono flex items-center justify-center gap-0.5">
                <Crosshair size={10} /> {team.abts}
              </span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">PTS/C</span>
              <span className="text-xs font-black text-orange-400 font-mono">{team.ptsc}</span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">M.Pts</span>
              <span className="text-xs font-black text-gray-300 font-mono">{team.avgPts}</span>
            </div>
            <div className="p-1">
              <span className="text-[8px] text-gray-500 font-bold uppercase block">Quedas</span>
              <span className="text-xs font-black text-gray-400 font-mono">{team.s}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800 gap-1">
            <button 
              onClick={() => setPhase('RUMO_AO_MUNDIAL')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'RUMO_AO_MUNDIAL' ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400/50' : 'text-gray-400 hover:text-white'}`}
            >
              <Globe size={14}/> Rumo ao Mundial
            </button>
            <button 
              onClick={() => setPhase('QUALIFIERS')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'QUALIFIERS' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Crosshair size={14}/> Classificatórias
            </button>
            <button 
              onClick={() => setPhase('FINALS')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'FINALS' ? 'bg-yellow-500 text-black shadow font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              <Trophy size={14}/> Grande Final
            </button>
            <button 
              onClick={() => setPhase('ALL')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'ALL' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Layers size={14}/> Geral
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Menu de Gerenciamento de Seções */}
            <div className="relative">
              <button 
                onClick={() => { setShowSectionMenu(!showSectionMenu); setShowColumnMenu(false); }}
                className="bg-[#1a1a1a] border border-gray-800 p-2.5 rounded-xl text-gray-400 hover:text-yellow-500 hover:border-yellow-500/50 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                title="Mostrar ou Ocultar Seções do Dashboard"
              >
                <LayoutGrid size={16} /> Seções ({Object.values(visibleSections).filter(Boolean).length}/4)
              </button>
              
              {showSectionMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#121215] border border-gray-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.7)] z-[100] p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800 mb-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gerenciar Seções</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setAllSections(true)} className="text-[9px] font-black text-yellow-500 hover:underline px-1 py-0.5 cursor-pointer">Todas</button>
                      <span className="text-gray-600">•</span>
                      <button onClick={() => setAllSections(false)} className="text-[9px] font-black text-gray-400 hover:underline px-1 py-0.5 cursor-pointer">Nenhuma</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection('filters')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors cursor-pointer ${visibleSections.filters ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-1.5"><SlidersHorizontal size={12} /> Filtros Avançados</span>
                      {visibleSections.filters ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => toggleSection('top3')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors cursor-pointer ${visibleSections.top3 ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-1.5"><Trophy size={12} /> Top 3 Destaques</span>
                      {visibleSections.top3 ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => toggleSection('legend')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors cursor-pointer ${visibleSections.legend ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-1.5"><Info size={12} /> Legenda da Tabela</span>
                      {visibleSections.legend ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => toggleSection('table')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors cursor-pointer ${visibleSections.table ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-1.5"><Crown size={12} /> Tabela de Classificação</span>
                      {visibleSections.table ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu de Colunas */}
            <div className="relative">
              <button 
                onClick={() => { setShowColumnMenu(!showColumnMenu); setShowSectionMenu(false); }}
                className="bg-[#1a1a1a] border border-gray-800 p-2.5 rounded-xl text-gray-400 hover:text-yellow-500 hover:border-yellow-500/50 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                <Settings2 size={16} /> Colunas
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#121215] border border-gray-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-gray-800 mb-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Exibir Colunas</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries({
                      rank: '#',
                      team: 'Equipe',
                      ...(phase === 'RUMO_AO_MUNDIAL' ? { 
                        bonus: 'BÔNUS',
                        rawPts: 'PTS S/ BÔNUS'
                      } : {}),
                      pts: phase === 'RUMO_AO_MUNDIAL' ? 'PTS TOTAL' : 'PTS',
                      ptsc: 'PTS/C',
                      avgPtsc: 'M.PTS/C',
                      avgPts: 'M.PTS',
                      abts: 'ABTS',
                      avgAbts: 'M.ABTS',
                      b: 'B',
                      s: 'S'
                    }).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors cursor-pointer ${visibleColumns[key as keyof typeof visibleColumns] ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
                      >
                        {label}
                        {visibleColumns[key as keyof typeof visibleColumns] ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowRulesModal(true)}
              className="bg-yellow-500/10 border border-yellow-500/30 px-3.5 py-2.5 rounded-xl text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer"
            >
              <BookOpen size={16} /> Regulamento
            </button>

            {phase === 'RUMO_AO_MUNDIAL' && (
              <button 
                onClick={() => setShowProjectionModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2.5 rounded-xl border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all"
                title="Abrir Simulador de Projeções do Rumo ao Mundial"
              >
                <Target size={16} /> Projeção Mundial
              </button>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
               <Crown size={18} className="text-yellow-500" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Critério: Pontos &gt; Booyahs &gt; Abates</span>
            </div>
          </div>
      </div>

      {/* SEÇÃO 1: FILTROS AVANÇADOS */}
      {visibleSections.filters ? (
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />
      ) : (
        <div className="bg-[#1a1a1a]/60 border border-gray-800/80 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 text-gray-400 text-xs font-bold uppercase">
            <SlidersHorizontal size={15} className="text-yellow-500" />
            <span>Seção de Filtros Oculta</span>
          </div>
          <button
            onClick={() => toggleSection('filters')}
            className="px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye size={13} /> Mostrar Filtros
          </button>
        </div>
      )}

      {phase === 'QUALIFIERS' && (
        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl text-xs text-blue-300 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black px-2 py-0.5 bg-blue-500/20 rounded text-blue-400 uppercase text-[10px] tracking-wider">1ª Fase</span>
            <span><strong>Fase Classificatória:</strong> 14 equipes em disputa. O Top 12 avança para a próxima fase com pontos bônus e os 2 últimos são rebaixados.</span>
          </div>
        </div>
      )}

      {phase === 'RUMO_AO_MUNDIAL' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/30 px-4 py-3.5 rounded-2xl text-xs text-purple-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="font-black px-2.5 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                <Globe size={13} className="text-purple-400" /> 2ª Fase • Rumo ao Mundial
              </span>
              <span>
                As <strong>12 equipes classificadas</strong> disputam 6 rodadas (RD 15 a 20) iniciando com a <strong>pontuação bônus</strong> da 1ª Fase. Os <strong>Top 2</strong> garantem vaga no <strong>FFWS Grand Finals</strong>!
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Globe size={11} /> Top 2: Vaga Mundial
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Trophy size={11} /> Top 12: Grande Final
              </span>
            </div>
          </div>

          {/* Bar / Teaser de Projeção Interativa para a LOUD e demais equipes */}
          <div className="bg-gradient-to-r from-[#181226] via-[#121216] to-[#121215] border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(168,85,247,0.12)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-400 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <Target size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300">
                      🎯 Projeção Oficial • 24 Quedas Restantes (R17 a R20)
                    </span>
                    <span className="text-xs font-black text-white">
                      Meta LOUD SNICKERS no Rumo ao Mundial
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      🥇 <strong>Top 1 (Líder LOS):</strong> precisa de <strong className="text-yellow-400 font-mono text-sm">18,42 pts/queda</strong> (+2,46 pts a mais que a LOS por queda)
                    </span>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span>
                      🌍 <strong>Top 2 (Vaga Mundial):</strong> precisa de <strong className="text-purple-300 font-mono text-sm">16,79 pts/queda</strong> (+1,33 pts a mais que a INTZ)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowProjectionView(!showProjectionView)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>{showProjectionView ? 'Ocultar Simulador' : 'Abrir Simulador'}</span>
                  {showProjectionView ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Simulador Interativo Embutido */}
            {showProjectionView && (
              <div className="mt-5 pt-5 border-t border-purple-500/20 animate-in fade-in duration-300">
                <MundialProjectionView data={data} initialTeam="LOUD SNICKERS" />
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'FINALS' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 rounded-xl text-xs text-yellow-300 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400 uppercase text-[10px] tracking-wider">3ª Fase</span>
            <span><strong>Grande Final (Champions Rush):</strong> Equipes iniciam zeradas. A primeira equipe a iniciar uma queda com 160+ pts e dar o Booyah é a Campeã!</span>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: TOP 3 DESTAQUES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-[#141418] border border-gray-800 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white font-display">
              {phase === 'RUMO_AO_MUNDIAL' ? 'Destaques • Rumo ao Mundial' : 'Destaques da Rodada (Top 3)'}
            </h2>
          </div>
          <button
            onClick={() => toggleSection('top3')}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-gray-800 text-gray-300 hover:text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {visibleSections.top3 ? (
              <><EyeOff size={12} /> Ocultar Destaques</>
            ) : (
              <><Eye size={12} /> Mostrar Destaques</>
            )}
          </button>
        </div>

        {visibleSections.top3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {phase === 'RUMO_AO_MUNDIAL' ? (
              <>
                <Top3Card title="Top 3 Pontos Gerais" icon={<Crown size={24} />} teams={topPts} metricKey="rawPts" metricLabel="Pts s/ Bônus" colorClass="text-yellow-400" />
                <Top3Card title="Top 3 Booyahs" icon={<Trophy size={24} />} teams={topBooyahs} metricKey="b" metricLabel="Vitórias" colorClass="text-yellow-500" />
                <Top3Card title="Top 3 Abates" icon={<Crosshair size={24} />} teams={topAbts} metricKey="abts" metricLabel="Abates" colorClass="text-red-500" />
              </>
            ) : (
              <>
                <Top3Card title="Top 3 Booyahs" icon={<Trophy size={24} />} teams={topBooyahs} metricKey="b" metricLabel="Vitórias" colorClass="text-yellow-500" />
                <Top3Card title="Top 3 PTS/C" icon={<Medal size={24} />} teams={topPtsc} metricKey="ptsc" metricLabel="Pts Colocação" colorClass="text-orange-400" />
                <Top3Card title="Top 3 Abates" icon={<Crosshair size={24} />} teams={topAbts} metricKey="abts" metricLabel="Abates" colorClass="text-red-500" />
              </>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO 3: LEGENDA DA TABELA DE CLASSIFICAÇÃO */}
      <div className="bg-[#141418] border border-gray-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-yellow-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
              Legenda da Tabela de Classificação
            </h3>
          </div>
          <button
            onClick={() => toggleSection('legend')}
            className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-gray-800 text-gray-300 hover:text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {visibleSections.legend ? (
              <><EyeOff size={12} /> Ocultar Legenda</>
            ) : (
              <><Eye size={12} /> Mostrar Legenda</>
            )}
          </button>
        </div>
        {visibleSections.legend && (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${phase === 'RUMO_AO_MUNDIAL' ? 'lg:grid-cols-6 xl:grid-cols-12' : 'lg:grid-cols-5 xl:grid-cols-10'} gap-2 text-[10px] animate-in fade-in duration-200`}>
            <div className="bg-black/60 p-2 rounded-xl border border-gray-800">
              <span className="font-bold text-gray-400 block uppercase"># / POS</span>
              <span className="text-gray-300 font-mono">Posição Geral</span>
            </div>
            {phase === 'RUMO_AO_MUNDIAL' && (
              <div className="bg-black/60 p-2 rounded-xl border border-purple-500/40">
                <span className="font-black text-purple-400 block uppercase">BÔNUS</span>
                <span className="text-purple-200 font-mono">Pts Extras (1ª Fase)</span>
              </div>
            )}
            {phase === 'RUMO_AO_MUNDIAL' && (
              <div className="bg-black/60 p-2 rounded-xl border border-cyan-500/40">
                <span className="font-black text-cyan-400 block uppercase">PTS S/ BÔNUS</span>
                <span className="text-cyan-200 font-mono">Pts em Quedas</span>
              </div>
            )}
            <div className="bg-black/60 p-2 rounded-xl border border-yellow-500/40">
              <span className="font-black text-yellow-400 block uppercase">{phase === 'RUMO_AO_MUNDIAL' ? 'PTS TOTAL' : 'PTS'}</span>
              <span className="text-yellow-200 font-mono">{phase === 'RUMO_AO_MUNDIAL' ? 'Total (Quedas + Bônus)' : 'Pontos Totais'}</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-orange-500/30">
              <span className="font-bold text-orange-400 block uppercase">PTS/C</span>
              <span className="text-gray-300 font-mono">Pts Colocação (s/ Bônus)</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-orange-500/30">
              <span className="font-bold text-orange-400 block uppercase">M.PTS/C</span>
              <span className="text-gray-300 font-mono">Média Pts/C por Queda</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-yellow-600/30">
              <span className="font-bold text-yellow-500 block uppercase">M.PTS</span>
              <span className="text-gray-300 font-mono">Média Pts/Queda (s/ Bônus)</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-red-500/30">
              <span className="font-bold text-red-400 block uppercase">ABTS</span>
              <span className="text-gray-300 font-mono">Abates Totais</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-red-600/30">
              <span className="font-bold text-red-500 block uppercase">M.ABTS</span>
              <span className="text-gray-300 font-mono">Média Abates/Queda</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-yellow-500/30">
              <span className="font-bold text-yellow-500 block uppercase">B</span>
              <span className="text-gray-300 font-mono">Booyahs (Vitórias)</span>
            </div>
            <div className="bg-black/60 p-2 rounded-xl border border-gray-800">
              <span className="font-bold text-gray-400 block uppercase">S</span>
              <span className="text-gray-300 font-mono">Quedas Jogadas</span>
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-xl border border-yellow-400/60 shadow-[0_0_10px_rgba(234,179,8,0.15)] col-span-2 sm:col-span-1">
              <span className="font-black text-yellow-400 block uppercase flex items-center gap-1">
                <Star size={10} className="fill-yellow-400" /> ★ LOUD
              </span>
              <span className="text-yellow-200 font-mono">Time Destaque</span>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 4: TABELA / CARDS DE CLASSIFICAÇÃO */}
      <div className="space-y-4">
        {/* Header da Seção de Classificação */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#141418] border border-gray-800 rounded-2xl p-3 sm:p-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0">
              <Crown size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white font-display">
                Classificação {phase === 'ALL' ? 'Geral' : phase === 'QUALIFIERS' ? '• Classificatórias' : phase === 'RUMO_AO_MUNDIAL' ? '• Rumo ao Mundial (12 Equipes)' : '• Grande Final'}
              </h2>
              <p className="text-[10px] text-gray-400">
                {filteredStats.length} equipe{filteredStats.length === 1 ? '' : 's'} listada{filteredStats.length === 1 ? '' : 's'}
                {searchTerm && <span className="text-yellow-400 font-bold ml-1">• Filtrado por "{searchTerm}"</span>}
                {sortConfig.key === 'rawPts' && <span className="text-cyan-400 font-bold ml-1">• Ordenado por Pontos s/ Bônus</span>}
              </p>
            </div>
          </div>

          {/* Controles: Busca, Modo de Visualização (Tabela/Cards) e Ocultar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Campo de Busca Rápida de Equipe */}
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar time..."
                className="w-full bg-[#0a0a0c] border border-gray-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  title="Limpar busca"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Alternador de Visualização: Tabela vs Cards */}
            <div className="flex items-center bg-[#0a0a0c] border border-gray-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Tabela detalhada"
              >
                <SlidersHorizontal size={12} />
                <span>Tabela</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-yellow-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visualização em Cards (Ideal para Celular)"
              >
                <LayoutGrid size={12} />
                <span>Cards</span>
              </button>
            </div>

            {/* Ocultar/Mostrar Seção */}
            <button
              onClick={() => toggleSection('table')}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-gray-800 text-gray-300 hover:text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {visibleSections.table ? (
                <><EyeOff size={12} /> <span className="hidden sm:inline">Ocultar</span></>
              ) : (
                <><Eye size={12} /> <span className="hidden sm:inline">Mostrar</span></>
              )}
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos de Ordenação */}
        {visibleSections.table && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
            <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0 flex items-center gap-1 mr-1">
              <ArrowUpDown size={12} /> Ordenar por:
            </span>

            {/* Botão Pontos Totais */}
            <button
              onClick={() => requestSort('pts')}
              className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                sortConfig.key === 'pts'
                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)] font-black'
                  : 'bg-[#141418] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span>{phase === 'RUMO_AO_MUNDIAL' ? 'Pts Total' : 'Pontos Totais'}</span>
              {sortConfig.key === 'pts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>

            {/* Botão Filtrar/Ordenar Pontos sem Bônus */}
            {phase === 'RUMO_AO_MUNDIAL' && (
              <button
                onClick={() => requestSort('rawPts' as any)}
                className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                  sortConfig.key === 'rawPts'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] font-black'
                    : 'bg-cyan-950/30 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/40 hover:text-cyan-100'
                }`}
                title="Filtrar e ordenar por Pontos conquistados em quedas sem bônus"
              >
                <span>Pts s/ Bônus</span>
                {sortConfig.key === 'rawPts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
              </button>
            )}

            {/* Botão Bônus */}
            {phase === 'RUMO_AO_MUNDIAL' && (
              <button
                onClick={() => requestSort('bonusPts' as any)}
                className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                  sortConfig.key === 'bonusPts'
                    ? 'bg-purple-500 text-black border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] font-black'
                    : 'bg-purple-950/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/40 hover:text-purple-100'
                }`}
              >
                <span>Bônus</span>
                {sortConfig.key === 'bonusPts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
              </button>
            )}

            {/* Botão Booyahs */}
            <button
              onClick={() => requestSort('b')}
              className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                sortConfig.key === 'b'
                  ? 'bg-yellow-500 text-black border-yellow-400 font-black'
                  : 'bg-[#141418] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span>Booyahs (B)</span>
              {sortConfig.key === 'b' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>

            {/* Botão Abates */}
            <button
              onClick={() => requestSort('abts')}
              className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                sortConfig.key === 'abts'
                  ? 'bg-red-500 text-white border-red-400 font-black'
                  : 'bg-[#141418] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span>Abates (ABTS)</span>
              {sortConfig.key === 'abts' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>

            {/* Botão PTS/C */}
            <button
              onClick={() => requestSort('ptsc')}
              className={`px-3 py-1 rounded-xl font-bold uppercase transition-all shrink-0 cursor-pointer border flex items-center gap-1 text-[10px] ${
                sortConfig.key === 'ptsc'
                  ? 'bg-orange-500 text-black border-orange-400 font-black'
                  : 'bg-[#141418] text-gray-300 border-gray-800 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span>Pts Colocação (PTS/C)</span>
              {sortConfig.key === 'ptsc' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        )}

        {visibleSections.table && (() => {
          const activeColumnCount = [
            visibleColumns.rank,
            visibleColumns.team,
            phase === 'RUMO_AO_MUNDIAL' && visibleColumns.bonus,
            phase === 'RUMO_AO_MUNDIAL' && visibleColumns.rawPts,
            visibleColumns.pts,
            visibleColumns.ptsc,
            visibleColumns.avgPtsc,
            visibleColumns.avgPts,
            visibleColumns.abts,
            visibleColumns.avgAbts,
            visibleColumns.b,
            visibleColumns.s,
          ].filter(Boolean).length;

          // Se o modo for Cards (ou tela mobile em modo Cards), renderizar grid de cards
          if (viewMode === 'cards') {
            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedStats.map((team, index) => (
                    <TeamCardMobile key={team.name} team={team} index={index} />
                  ))}
                  {sortedStats.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-[#141418] rounded-2xl border border-gray-800">
                      Nenhuma equipe encontrada para os filtros aplicados.
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Modo Tabela com scroll horizontal responsivo e colunas fixas (# e Equipe)
          return (
            <div className={`grid grid-cols-1 ${isSingleColumn ? '' : 'lg:grid-cols-2'} gap-6 animate-in fade-in duration-200`}>
              <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                <div className="bg-[#0a0a0a] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Trophy size={12} />
                    {phase === 'RUMO_AO_MUNDIAL' ? 'Classificação • 12 Equipes Rumo ao Mundial' : isSingleColumn ? 'Classificação da Rodada' : `Tier 1 • Top 1-${leftStats.length}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={12} className="text-yellow-500/50" />
                    <span className="text-[9px] text-gray-500 uppercase font-bold">
                      {sortConfig.key === 'rawPts' ? 'Classificado por Pts s/ Bônus' : 'Resumo Competitivo'}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[550px] sm:min-w-[620px]">
                    <TableHeader />
                    <tbody className="divide-y divide-gray-800/80 text-sm font-medium">
                      {leftStats.map((team, index) => (
                        <TableRow key={team.name} team={team} index={index} />
                      ))}
                      {leftStats.length === 0 && (
                        <tr>
                          <td colSpan={activeColumnCount} className="py-10 text-center text-gray-500 italic uppercase text-[10px]">
                            Sem dados para esta filtragem
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isSingleColumn && (
                <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                  <div className="bg-[#0a0a0a] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Shield size={12} className="text-gray-500" />
                      Tier 2 • Top {leftStats.length + 1}-{sortedStats.length}
                    </span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Resumo Competitivo</span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[550px] sm:min-w-[620px]">
                      <TableHeader />
                      <tbody className="divide-y divide-gray-800/80 text-sm font-medium">
                        {rightStats.map((team, index) => (
                          <TableRow key={team.name} team={team} index={index + leftStats.length} />
                        ))}
                        {rightStats.length === 0 && (
                          <tr>
                            <td colSpan={activeColumnCount} className="py-10 text-center text-gray-500 italic uppercase text-[10px]">
                              Nenhuma equipe nesta faixa
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
        })()}
      </div>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {showProjectionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <MundialProjectionView 
            data={data} 
            initialTeam="LOUD SNICKERS" 
            isModal={true} 
            onClose={() => setShowProjectionModal(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
