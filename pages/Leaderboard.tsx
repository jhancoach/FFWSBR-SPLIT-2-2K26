
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Trophy, Crosshair, Crown, Layers, Star, ChevronRight, Shield, CheckCircle2, TrendingUp, Medal, Settings2, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, BookOpen, Globe, Info } from 'lucide-react';
import FilterBar from '../components/FilterBar';
import RulesModal from '../components/RulesModal';
import { formatTeamName } from '../utils/teamUtils';

interface LeaderboardProps {
  data: DashboardData;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [generalTop12, setGeneralTop12] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'ALL' | 'QUALIFIERS' | 'RUMO_AO_MUNDIAL' | 'FINALS'>('ALL');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof TeamStats; direction: 'asc' | 'desc' }>({
    key: 'pts',
    direction: 'desc'
  });

  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    team: true,
    pts: true,
    ptsc: true,
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
    rounds: Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.details.map(d => d.Q))).filter(Boolean).sort(),
    confrontations: Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[],
  }), [data.details, data.teamsReference, data.confrontationsDimension, data.killFeed, data.characters, data.players]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  useEffect(() => {
    if (!data.loading) {
      // 1. Calcular Top 12 Geral (sem filtros de rodada/mapa) para a tag FINALISTA
      const generalStats = calculateTeamStats(data);
      setGeneralTop12(new Set(generalStats.slice(0, 12).map(s => s.name)));

      // 2. Calcular estatísticas filtradas para a exibição
      const filteredDetails = data.details.filter(d => {
        if (filters.team.length > 0 && !filters.team.includes(d.TIME)) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
        if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
        if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
        if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;

        const confrontoNorm = normalize(d.CONFRONTO);
        const rdNorm = normalize(d.RD);
        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;

        if (phase === 'QUALIFIERS') {
          const isQualiText = confrontoNorm.includes('CLASSIF') || confrontoNorm.includes('QUALI') || rdNorm.includes('CLASSIF') || rdNorm.includes('FASE 1') || rdNorm.includes('1A FASE') || rdNorm.includes('1ª FASE');
          const isQualiRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('FINAL'))) && (roundNum === 0 || (roundNum >= 1 && roundNum <= 20));
          if (!isQualiText && !isQualiRound) return false;
        } else if (phase === 'RUMO_AO_MUNDIAL') {
          const isRumoText = confrontoNorm.includes('RUMO') || confrontoNorm.includes('MUNDIAL') || confrontoNorm.includes('FASE 2') || confrontoNorm.includes('2A FASE') || confrontoNorm.includes('2ª FASE') || rdNorm.includes('RUMO') || rdNorm.includes('MUNDIAL');
          const isRumoRound = (!confrontoNorm || (!confrontoNorm.includes('CLASSIF') && !confrontoNorm.includes('FINAL'))) && (roundNum >= 21 && roundNum <= 26);
          if (!isRumoText && !isRumoRound) return false;
        } else if (phase === 'FINALS') {
          const isFinalText = confrontoNorm.includes('FINAL') || confrontoNorm.includes('CHAMPION') || confrontoNorm.includes('FASE 3') || confrontoNorm.includes('3A FASE') || confrontoNorm.includes('3ª FASE') || rdNorm.includes('FINAL');
          const isFinalRound = (!confrontoNorm || (!confrontoNorm.includes('MUNDIAL') && !confrontoNorm.includes('CLASSIF'))) && (roundNum > 26 || (roundNum > 20 && !confrontoNorm.includes('RUMO') && !confrontoNorm.includes('MUNDIAL')));
          if (!isFinalText && !isFinalRound) return false;
        }

        return true;
      });

      const filteredData = { ...data, details: filteredDetails };
      let calculatedStats = calculateTeamStats(filteredData);
      
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

  const sortedStats = useMemo(() => {
    const sortableItems = [...stats];
    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || bVal === undefined) return 0;

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [stats, sortConfig]);

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

  const topBooyahs = [...stats].sort((a, b) => b.b - a.b || b.pts - a.pts).slice(0, 3);
  const topPtsc = [...stats].sort((a, b) => b.ptsc - a.ptsc || b.pts - a.pts).slice(0, 3);
  const topAbts = [...stats].sort((a, b) => b.abts - a.abts || b.pts - a.pts).slice(0, 3);

  const Top3Card = ({ title, icon, teams, metricKey, metricLabel, colorClass }: any) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-all shadow-lg">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase italic text-gray-200 mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="space-y-4">
        {teams.map((team: any, idx: number) => {
          const isLoud = team.name.toLowerCase().includes('loud');
          return (
            <div 
              key={team.name} 
              onClick={() => handleTeamClick(team.name)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                isLoud 
                  ? 'bg-gradient-to-r from-yellow-500/25 via-amber-500/15 to-yellow-500/10 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]' 
                  : 'bg-[#0f0f0f] border-gray-800 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-sm skew-x-[-10deg] flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>
                  {idx + 1}
                </div>
                <div className="flex items-center gap-2">
                   {team.image && <img src={team.image} alt={team.name} className={`w-8 h-8 rounded-full object-cover bg-black border ${isLoud ? 'border-yellow-400 shadow-[0_0_8px_#facc15]' : 'border-gray-700'}`} />}
                   <div className="flex flex-col">
                     <span className={`font-black text-sm uppercase tracking-tight flex items-center gap-1 ${isLoud ? 'text-yellow-400 font-display' : 'text-gray-200 hover:text-yellow-400'}`}>
                       {formatTeamName(team.name)}
                       {isLoud && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
                     </span>
                     {isLoud && <span className="text-[8px] text-yellow-400 font-bold uppercase tracking-widest">★ TIME DESTAQUE</span>}
                   </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`block font-black text-xl italic ${colorClass}`}>{team[metricKey]}</span>
                <span className="text-[9px] text-gray-500 uppercase font-bold">{metricLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TableHeader = () => {
    const SortIcon = ({ column }: { column: keyof TeamStats }) => {
      if (sortConfig.key !== column) return <ArrowUpDown size={10} className="opacity-20 group-hover:opacity-50" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={10} className="text-yellow-500" /> : <ArrowDown size={10} className="text-yellow-500" />;
    };

    return (
      <thead className="bg-[#0f0f0f] text-gray-400 text-[9px] sm:text-[10px] uppercase font-bold tracking-tight border-b border-gray-800">
        <tr>
          {visibleColumns.rank && <th className="px-1.5 py-2.5 text-center w-6 sm:w-8">#</th>}
          {visibleColumns.team && <th className="px-1.5 sm:px-2 py-2.5 text-left">Equipe</th>}
          {visibleColumns.pts && (
            <th 
              className="px-1 sm:px-2 py-2.5 text-center bg-yellow-900/10 text-yellow-500 font-black cursor-pointer group hover:bg-yellow-900/20"
              onClick={() => requestSort('pts')}
              title="Pontos Totais"
            >
              <div className="flex items-center justify-center gap-0.5">PTS <SortIcon column="pts" /></div>
            </th>
          )}
          {visibleColumns.ptsc && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center text-orange-400/80 cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('ptsc')}
              title="Pontos de Colocação"
            >
              <div className="flex items-center justify-center gap-0.5">PTS/C <SortIcon column="ptsc" /></div>
            </th>
          )}
          {visibleColumns.avgPts && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center text-yellow-600/80 cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('avgPts')}
              title="Média de Pontos por Queda"
            >
              <div className="flex items-center justify-center gap-0.5">M.PTS <SortIcon column="avgPts" /></div>
            </th>
          )}
          {visibleColumns.abts && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('abts')}
              title="Abates Totais"
            >
              <div className="flex items-center justify-center gap-0.5">ABTS <SortIcon column="abts" /></div>
            </th>
          )}
          {visibleColumns.avgAbts && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center text-red-500/80 cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('avgAbts')}
              title="Média de Abates por Queda"
            >
              <div className="flex items-center justify-center gap-0.5">M.ABTS <SortIcon column="avgAbts" /></div>
            </th>
          )}
          {visibleColumns.b && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('b')}
              title="Booyahs (Vitórias)"
            >
              <div className="flex items-center justify-center gap-0.5">B <SortIcon column="b" /></div>
            </th>
          )}
          {visibleColumns.s && (
            <th 
              className="px-1 sm:px-1.5 py-2.5 text-center cursor-pointer group hover:bg-white/5"
              onClick={() => requestSort('s')}
              title="Quedas Jogadas"
            >
              <div className="flex items-center justify-center gap-0.5">S <SortIcon column="s" /></div>
            </th>
          )}
        </tr>
      </thead>
    );
  };

  const TableRow = ({ team, index }: { team: TeamStats, index: number, key?: React.Key }) => {
    const isTop12 = index < 12;
    const isGeneralFinalist = generalTop12.has(team.name);
    const isLoud = team.name.toLowerCase().includes('loud');
    
    return (
      <tr 
        onClick={() => handleTeamClick(team.name)} 
        className={`transition-all group cursor-pointer border-b ${
          isLoud 
            ? 'bg-gradient-to-r from-yellow-500/25 via-amber-500/15 to-yellow-500/10 border-y-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.25)] font-bold hover:from-yellow-500/35' 
            : `hover:bg-yellow-900/10 border-gray-800/50 ${isTop12 ? 'relative overflow-hidden bg-yellow-500/5' : ''}`
        }`}
      >
        {visibleColumns.rank && (
          <td className="px-1 sm:px-1.5 py-2 text-center font-mono text-[10px] sm:text-[11px] relative">
              {(isTop12 || isLoud) && <div className={`absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 ${isLoud ? 'bg-yellow-400 shadow-[0_0_12px_#facc15]' : 'bg-yellow-500 shadow-[0_0_10px_#facc15]'}`}></div>}
              <span className={isLoud ? 'text-yellow-400 font-black text-[11px] sm:text-xs flex items-center justify-center gap-0.5' : isTop12 ? 'text-yellow-500 font-black' : 'text-gray-500'}>
                {index + 1} {isLoud && <Star size={9} className="fill-yellow-400 text-yellow-400" />}
              </span>
          </td>
        )}
        {visibleColumns.team && (
          <td className="px-1.5 sm:px-2 py-2 font-bold text-white flex items-center gap-1.5 min-w-0">
            {team.image && <img src={team.image} className={`w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 ${isLoud ? 'border border-yellow-400 rounded-full bg-black p-0.5 shadow-[0_0_8px_#facc15]' : ''}`} alt={team.name}/>}
            <div className="flex flex-col min-w-0">
              <span className={`uppercase italic text-[10px] sm:text-[11px] truncate flex items-center gap-1 ${isLoud ? 'text-yellow-400 font-black font-display drop-shadow' : isTop12 ? 'text-yellow-400' : ''}`}>
                  {formatTeamName(team.name)}
                  {isLoud && <Star size={10} className="fill-yellow-400 text-yellow-400 shrink-0" />}
              </span>
              {isLoud ? (
                <span className="text-[7px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1 truncate">
                  ★ LOUD
                </span>
              ) : isGeneralFinalist ? (
                  <span className="text-[7px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1 truncate">
                      <CheckCircle2 size={7} /> FINALISTA
                  </span>
              ) : null}
            </div>
          </td>
        )}
        {visibleColumns.pts && <td className={`px-1 sm:px-1.5 py-2 text-center font-black text-xs sm:text-sm ${isLoud ? 'text-yellow-300 bg-yellow-500/25 font-display' : isTop12 ? 'text-white bg-yellow-600/20' : 'text-yellow-500 bg-yellow-900/5'}`}>{team.pts}</td>}
        {visibleColumns.ptsc && <td className={`px-1 sm:px-1.5 py-2 text-center font-bold text-[10px] sm:text-[11px] ${isLoud ? 'text-orange-300 font-black' : 'text-orange-400/70'}`}>{team.ptsc}</td>}
        {visibleColumns.avgPts && <td className={`px-1 sm:px-1.5 py-2 text-center font-mono text-[9px] sm:text-[10px] ${isLoud ? 'text-yellow-300 font-bold' : 'text-yellow-600/60'}`}>{team.avgPts}</td>}
        {visibleColumns.abts && <td className={`px-1 sm:px-1.5 py-2 text-center font-bold text-[10px] sm:text-[11px] ${isLoud ? 'text-red-300 font-black' : 'text-red-400'}`}>{team.abts}</td>}
        {visibleColumns.avgAbts && <td className={`px-1 sm:px-1.5 py-2 text-center font-mono text-[9px] sm:text-[10px] ${isLoud ? 'text-red-300 font-bold' : 'text-red-600/60'}`}>{team.avgAbts}</td>}
        {visibleColumns.b && <td className={`px-1 sm:px-1.5 py-2 text-center font-bold text-[10px] sm:text-[11px] ${isLoud ? 'text-yellow-300 font-black' : 'text-yellow-600'}`}>{team.b}</td>}
        {visibleColumns.s && <td className={`px-1 sm:px-1.5 py-2 text-center text-[10px] sm:text-[11px] ${isLoud ? 'text-gray-200 font-bold' : 'text-gray-400'}`}>{team.s}</td>}
      </tr>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800 gap-1">
            <button 
              onClick={() => setPhase('ALL')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'ALL' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Layers size={14}/> Geral
            </button>
            <button 
              onClick={() => setPhase('QUALIFIERS')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'QUALIFIERS' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Crosshair size={14}/> Classificatórias
            </button>
            <button 
              onClick={() => setPhase('RUMO_AO_MUNDIAL')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'RUMO_AO_MUNDIAL' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Globe size={14}/> Rumo ao Mundial
            </button>
            <button 
              onClick={() => setPhase('FINALS')} 
              className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${phase === 'FINALS' ? 'bg-yellow-500 text-black shadow font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              <Trophy size={14}/> Grande Final
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="bg-[#1a1a1a] border border-gray-800 p-2.5 rounded-xl text-gray-400 hover:text-yellow-500 hover:border-yellow-500/50 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
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
                      pts: 'PTS',
                      ptsc: 'PTS/C',
                      avgPts: 'M.PTS',
                      abts: 'ABTS',
                      avgAbts: 'M.ABTS',
                      b: 'B',
                      s: 'S'
                    }).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase italic transition-colors ${visibleColumns[key as keyof typeof visibleColumns] ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-500 hover:bg-white/5'}`}
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

            <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
               <Crown size={18} className="text-yellow-500" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Critério: Pontos &gt; Booyahs &gt; Abates</span>
            </div>
          </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      {phase === 'QUALIFIERS' && (
        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl text-xs text-blue-300 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black px-2 py-0.5 bg-blue-500/20 rounded text-blue-400 uppercase text-[10px] tracking-wider">1ª Fase</span>
            <span><strong>Fase Classificatória:</strong> 14 equipes em disputa. O Top 12 avança para a próxima fase com pontos bônus e os 2 últimos são rebaixados.</span>
          </div>
        </div>
      )}

      {phase === 'RUMO_AO_MUNDIAL' && (
        <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-3 rounded-xl text-xs text-purple-300 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <span className="font-black px-2 py-0.5 bg-purple-500/20 rounded text-purple-400 uppercase text-[10px] tracking-wider">2ª Fase</span>
            <span><strong>Rumo ao Mundial:</strong> As 12 equipes classificadas disputam 6 rodadas. Os 2 primeiros colocados garantem vaga no FFWS Grand Finals.</span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Top3Card title="Top 3 Booyahs" icon={<Trophy size={24} />} teams={topBooyahs} metricKey="b" metricLabel="Vitórias" colorClass="text-yellow-500" />
        <Top3Card title="Top 3 PTS/C" icon={<Medal size={24} />} teams={topPtsc} metricKey="ptsc" metricLabel="Pts Colocação" colorClass="text-orange-400" />
        <Top3Card title="Top 3 Abates" icon={<Crosshair size={24} />} teams={topAbts} metricKey="abts" metricLabel="Abates" colorClass="text-red-500" />
      </div>

      {/* Legenda da Tabela de Classificação */}
      <div className="bg-[#141418] border border-gray-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
          <Info size={16} className="text-yellow-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-display">
            Legenda da Tabela de Classificação
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 text-[10px]">
          <div className="bg-black/60 p-2 rounded-xl border border-gray-800">
            <span className="font-bold text-gray-400 block uppercase"># / POS</span>
            <span className="text-gray-300 font-mono">Posição Geral</span>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-yellow-500/40">
            <span className="font-black text-yellow-400 block uppercase">PTS</span>
            <span className="text-yellow-200 font-mono">Pontos Totais</span>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-orange-500/30">
            <span className="font-bold text-orange-400 block uppercase">PTS/C</span>
            <span className="text-gray-300 font-mono">Pts Colocação</span>
          </div>
          <div className="bg-black/60 p-2 rounded-xl border border-yellow-600/30">
            <span className="font-bold text-yellow-500 block uppercase">M.PTS</span>
            <span className="text-gray-300 font-mono">Média Pts/Queda</span>
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
      </div>

      <div className={`grid grid-cols-1 ${isSingleColumn ? '' : 'lg:grid-cols-2'} gap-6`}>
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
          <div className="bg-[#0a0a0a] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">
              {isSingleColumn ? 'Classificação da Rodada' : `Tier 1 • Top 1-${leftStats.length}`}
            </span>
            <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-yellow-500/50" />
                <span className="text-[9px] text-gray-600 uppercase font-bold">Resumo Competitivo</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <TableHeader />
              <tbody className="divide-y divide-gray-800 text-sm font-medium">
                {leftStats.map((team, index) => (
                  <TableRow key={team.name} team={team} index={index} />
                ))}
                {leftStats.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-600 italic uppercase text-[10px]">Sem dados para esta filtragem</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!isSingleColumn && (
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="bg-[#0a0a0a] px-4 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                Tier 2 • Top {leftStats.length + 1}-{stats.length}
              </span>
              <Shield size={14} className="text-gray-600 opacity-50" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <TableHeader />
                <tbody className="divide-y divide-gray-800 text-sm font-medium">
                  {rightStats.map((team, index) => (
                    <TableRow key={team.name} team={team} index={index + leftStats.length} />
                  ))}
                  {rightStats.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-600 italic uppercase text-[10px]">Nenhuma equipe nesta faixa</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  );
};

export default Leaderboard;
