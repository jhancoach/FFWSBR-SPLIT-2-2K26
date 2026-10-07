import React, { useState, useMemo } from 'react';
import { 
  Flame, Swords, Shield, Target, Award, Crown, Zap, 
  TrendingUp, Users, ChevronDown, ChevronUp, Search, Filter,
  BarChart3, Crosshair, Trophy, Sparkles, MapPin, ArrowUpRight,
  Layers, CheckCircle2, Split, ArrowRightLeft, Activity, Compass
} from 'lucide-react';
import { DashboardData } from '../types';
import { 
  RushDuoData, 
  calculateRushDuosData 
} from '../utils/rushDuosUtils';
import { RushDuosRadarCompare } from './RushDuosRadarCompare';
import { RushDuosEvolutionChart } from './RushDuosEvolutionChart';

interface RushDuosAnalysisProps {
  data: DashboardData;
  initialTeamFilter?: string;
  hideTeamFilter?: boolean; // When rendered inside a team page
  title?: string;
}

export const RushDuosAnalysis: React.FC<RushDuosAnalysisProps> = ({
  data,
  initialTeamFilter = '',
  hideTeamFilter = false,
  title = 'Análise Estatística de Duplas de Rush & Sinergia'
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeamFilter);
  const [selectedMap, setSelectedMap] = useState<string>('ALL');
  const [selectedRound, setSelectedRound] = useState<string>('ALL');
  const [duoTypeFilter, setDuoTypeFilter] = useState<'ALL' | 'RUSH_ONLY' | 'RUSH_PURE'>('RUSH_PURE');
  const [sortBy, setSortBy] = useState<'kills' | 'kpm' | 'damage' | 'synergy' | 'knockdowns' | 'booyahs' | 'kda'>('kills');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDuoId, setExpandedDuoId] = useState<string | null>(null);
  const [compareDuoAId, setCompareDuoAId] = useState<string>('');
  const [compareDuoBId, setCompareDuoBId] = useState<string>('');
  const [selectedDuoForEvolution, setSelectedDuoForEvolution] = useState<string>('');
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [viewSection, setViewSection] = useState<'ranking' | 'radar' | 'evolution'>('ranking');

  // Extract unique teams and rounds for filters
  const uniqueTeams = useMemo(() => {
    const set = new Set<string>();
    (data.players || []).forEach(p => {
      if (p.TIME && p.TIME.trim()) set.add(p.TIME.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data.players]);

  const uniqueRounds = useMemo(() => {
    const set = new Set<string>();
    (data.players || []).forEach(p => {
      if (p.RD && p.RD.trim()) set.add(p.RD.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data.players]);

  // Calculate duos with applied filters
  const duos = useMemo(() => {
    const rawDuos = calculateRushDuosData(data, {
      teamFilter: hideTeamFilter ? initialTeamFilter : (selectedTeam || undefined),
      mapFilter: selectedMap !== 'ALL' ? selectedMap : undefined,
      roundFilter: selectedRound !== 'ALL' ? selectedRound : undefined,
      onlyRushDuo: false,
      minMatches: 1
    });

    let filtered = rawDuos;

    if (duoTypeFilter === 'RUSH_ONLY') {
      filtered = filtered.filter(d => d.duoType === 'RUSH_PURO' || d.duoType === 'RUSH_HIBRIDO');
    } else if (duoTypeFilter === 'RUSH_PURE') {
      filtered = filtered.filter(d => d.duoType === 'RUSH_PURO');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(d => 
        d.player1.name.toLowerCase().includes(q) ||
        d.player2.name.toLowerCase().includes(q) ||
        d.teamName.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'kills') return b.combinedKills - a.combinedKills;
      if (sortBy === 'kpm') return b.killsPerMatch - a.killsPerMatch;
      if (sortBy === 'damage') return b.combinedDamage - a.combinedDamage;
      if (sortBy === 'kda') return b.kda - a.kda;
      if (sortBy === 'synergy') return b.synergyScore - a.synergyScore;
      if (sortBy === 'knockdowns') return b.combinedKnockdowns - a.combinedKnockdowns;
      if (sortBy === 'booyahs') return b.booyahsTogether - a.booyahsTogether;
      return b.combinedKills - a.combinedKills;
    });
  }, [data, selectedTeam, initialTeamFilter, hideTeamFilter, selectedMap, selectedRound, duoTypeFilter, searchQuery, sortBy]);

  // Top 3 for podium
  const topThree = duos.slice(0, 3);

  // Stats summary for the view
  const overallStats = useMemo(() => {
    if (duos.length === 0) return { totalDuos: 0, totalKills: 0, avgKills: 0, topSynergy: 0, avgKda: 0 };
    const totalKills = duos.reduce((acc, d) => acc + d.combinedKills, 0);
    const avgKills = Number((totalKills / duos.length).toFixed(1));
    const topSynergy = Math.max(...duos.map(d => d.synergyScore));
    const avgKda = Number((duos.reduce((acc, d) => acc + d.kda, 0) / duos.length).toFixed(2));
    return {
      totalDuos: duos.length,
      totalKills,
      avgKills,
      topSynergy,
      avgKda
    };
  }, [duos]);

  // Duo A and Duo B for Head-to-Head compare
  const duoA = useMemo(() => duos.find(d => d.id === compareDuoAId) || duos[0], [duos, compareDuoAId]);
  const duoB = useMemo(() => duos.find(d => d.id === compareDuoBId) || duos[1] || duos[0], [duos, compareDuoBId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/40 via-yellow-950/30 to-black border border-yellow-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-black shadow-lg shadow-yellow-500/30">
                <Flame size={24} className="fill-black" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/30">
                Táticas de Combate & Linha de Frente
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              {title}
            </h2>
            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
              Análise dos jogadores com função <span className="text-yellow-400 font-bold">Rush</span> de cada equipe atuando juntos nas quedas: KDA confrontado, dano médio por queda, sobrevivência média, gráfico de radar comparativo e evolução nas últimas 5 rodadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (duos.length >= 2) {
                  setCompareDuoAId(duos[0].id);
                  setCompareDuoBId(duos[1].id);
                }
                setViewSection('radar');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/30 transition-all shadow-lg hover:scale-[1.02]"
            >
              <Target size={15} />
              Radar de Duplas
            </button>
            <button
              onClick={() => {
                if (duos.length >= 2) {
                  setCompareDuoAId(duos[0].id);
                  setCompareDuoBId(duos[1].id);
                  setShowCompareModal(true);
                }
              }}
              disabled={duos.length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              <ArrowRightLeft size={16} />
              Comparar Duplas
            </button>
          </div>
        </div>

        {/* Quick Highlights Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Duplas Rastreadas</span>
            <span className="text-2xl font-black text-white">{overallStats.totalDuos}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 block">Abates Totais</span>
            <span className="text-2xl font-black text-yellow-400">{overallStats.totalKills}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Média Kills / Dupla</span>
            <span className="text-2xl font-black text-amber-300">{overallStats.avgKills}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">KDA Médio da Liga</span>
            <span className="text-2xl font-black text-cyan-300">{overallStats.avgKda}</span>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">Pico de Sinergia</span>
            <span className="text-2xl font-black text-emerald-400">{overallStats.topSynergy}%</span>
          </div>
        </div>
      </div>

      {/* VIEW SECTION NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => setViewSection('ranking')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            viewSection === 'ranking'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy size={16} />
          <span>Ranking & Tabela de Duplas</span>
        </button>

        <button
          onClick={() => setViewSection('radar')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            viewSection === 'radar'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Target size={16} />
          <span>Comparativo Radar (KDA, Dano & Sobrevivência)</span>
        </button>

        <button
          onClick={() => setViewSection('evolution')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            viewSection === 'evolution'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp size={16} />
          <span>Evolução nas Últimas 5 Rodadas (Abates & Dano)</span>
        </button>
      </div>

      {/* CONDITIONAL RENDER: RADAR COMPARISON TAB */}
      {viewSection === 'radar' && (
        <div className="animate-in fade-in duration-300">
          <RushDuosRadarCompare
            duos={duos}
            initialDuoAId={compareDuoAId || duos[0]?.id}
            initialDuoBId={compareDuoBId || duos[1]?.id}
          />
        </div>
      )}

      {/* CONDITIONAL RENDER: EVOLUTION 5 ROUNDS TAB */}
      {viewSection === 'evolution' && (
        <div className="animate-in fade-in duration-300">
          <RushDuosEvolutionChart
            duos={duos}
            initialDuoId={selectedDuoForEvolution || duos[0]?.id}
          />
        </div>
      )}

      {/* CONDITIONAL RENDER: RANKING & PODIUM VIEW */}
      {viewSection === 'ranking' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filter Control Bar */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Team filter (if not hidden) */}
              {!hideTeamFilter && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Time</label>
                  <select
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-bold"
                  >
                    <option value="">Todos os Times</option>
                    {uniqueTeams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Map filter */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Mapa</label>
                <select
                  value={selectedMap}
                  onChange={e => setSelectedMap(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-bold"
                >
                  <option value="ALL">Todos os Mapas</option>
                  <option value="BERMUDA">Bermuda</option>
                  <option value="PURGATÓRIO">Purgatório</option>
                  <option value="KALAHARI">Kalahari</option>
                  <option value="NOVA TERRA">Nova Terra</option>
                  <option value="SOLARA">Solara</option>
                </select>
              </div>

              {/* Round filter */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Rodada</label>
                <select
                  value={selectedRound}
                  onChange={e => setSelectedRound(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-bold"
                >
                  <option value="ALL">Todas as Rodadas</option>
                  {uniqueRounds.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Duo Type Filter */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Tipo de Dupla</label>
                <select
                  value={duoTypeFilter}
                  onChange={e => setDuoTypeFilter(e.target.value as any)}
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 font-bold"
                >
                  <option value="RUSH_ONLY">Duplas de Rush (Puras + Híbridas)</option>
                  <option value="RUSH_PURE">Apenas Rush Puro (Rush 1 + Rush 2)</option>
                  <option value="ALL">Todas as Combinações de Dupla</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 block">Ordenar Por</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full bg-black/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-yellow-400 font-black focus:outline-none focus:border-yellow-500"
                >
                  <option value="kills">🔥 Mais Abates Combinados</option>
                  <option value="kda">⚡ Maior KDA</option>
                  <option value="kpm">⚡ Maior Média Kills / Queda</option>
                  <option value="damage">💥 Maior Dano Combinado</option>
                  <option value="synergy">✨ Maior Índice de Sinergia</option>
                  <option value="knockdowns">🎯 Mais Deitados (First Knocks)</option>
                  <option value="booyahs">🏆 Mais Booyahs Juntos</option>
                </select>
              </div>
            </div>

            {/* Search inside duos */}
            <div className="relative pt-1">
              <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por jogador ou time na lista de duplas..."
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white text-xs font-bold"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* TOP 3 PODIUM - REIS DO RUSH */}
          {topThree.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Crown size={20} className="text-yellow-400 fill-yellow-400" />
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Podium dos Reis do Rush
                </h3>
                <span className="text-xs text-gray-400 font-bold">
                  (Duplas mais letais do campeonato)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((duo, idx) => {
                  const medals = [
                    { border: 'border-yellow-500/50', bg: 'from-yellow-950/40 via-black to-black', tag: 'bg-yellow-500 text-black', icon: '👑 1º LUGAR' },
                    { border: 'border-gray-400/40', bg: 'from-gray-900/40 via-black to-black', tag: 'bg-gray-300 text-black', icon: '🥈 2º LUGAR' },
                    { border: 'border-amber-700/40', bg: 'from-amber-950/30 via-black to-black', tag: 'bg-amber-600 text-white', icon: '🥉 3º LUGAR' }
                  ];
                  const m = medals[idx] || medals[2];

                  return (
                    <div 
                      key={duo.id}
                      className={`relative rounded-3xl bg-gradient-to-b ${m.bg} border ${m.border} p-5 shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${m.tag} shadow-md`}>
                          {m.icon}
                        </span>
                        <div className="flex items-center gap-2">
                          {duo.teamLogo && (
                            <img src={duo.teamLogo} alt={duo.teamName} className="w-6 h-6 object-contain" />
                          )}
                          <span className="text-xs font-black uppercase text-gray-300">{duo.teamName}</span>
                        </div>
                      </div>

                      {/* Dual Players Visual */}
                      <div className="flex items-center justify-around py-3 bg-black/40 rounded-2xl border border-white/5 mb-4">
                        {/* Player 1 */}
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-black border border-yellow-500/30 overflow-hidden flex items-center justify-center relative shadow-lg mb-2">
                            {duo.player1.avatar ? (
                              <img src={duo.player1.avatar} alt={duo.player1.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={24} className="text-gray-400" />
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-yellow-400 py-0.5 uppercase truncate">
                              {duo.player1.role1}
                            </span>
                          </div>
                          <span className="text-xs font-black text-white truncate max-w-[100px]">{duo.player1.name}</span>
                          <span className="text-[10px] font-bold text-yellow-400">{duo.player1.kills} kills</span>
                        </div>

                        <div className="flex flex-col items-center justify-center px-2">
                          <span className="p-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                            <Swords size={16} />
                          </span>
                          <span className="text-[9px] font-black uppercase text-gray-500 mt-1">DUPLA</span>
                        </div>

                        {/* Player 2 */}
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-black border border-yellow-500/30 overflow-hidden flex items-center justify-center relative shadow-lg mb-2">
                            {duo.player2.avatar ? (
                              <img src={duo.player2.avatar} alt={duo.player2.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={24} className="text-gray-400" />
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-black text-yellow-400 py-0.5 uppercase truncate">
                              {duo.player2.role1}
                            </span>
                          </div>
                          <span className="text-xs font-black text-white truncate max-w-[100px]">{duo.player2.name}</span>
                          <span className="text-[10px] font-bold text-yellow-400">{duo.player2.kills} kills</span>
                        </div>
                      </div>

                      {/* Key Duo Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Abates</span>
                          <span className="text-lg font-black text-yellow-400">{duo.combinedKills}</span>
                        </div>
                        <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">KDA Ratio</span>
                          <span className="text-lg font-black text-cyan-300">{duo.kda.toFixed(2)}</span>
                        </div>
                        <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Dano / Queda</span>
                          <span className="text-lg font-black text-white">{duo.damagePerMatch.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Synergy Bar */}
                      <div className="bg-black/60 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                            <Sparkles size={12} className="text-yellow-400" /> Sinergia Ofensiva
                          </span>
                          <span className="font-black text-yellow-400">{duo.synergyScore}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(duo.synergyScore, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 font-bold mt-1.5">
                          <span>{duo.teamKillShare}% dos abates do time</span>
                          <span>{duo.matchesTogether} quedas juntos</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMPLETE DUOS LIST & DETAILED CARDS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <Swords size={20} className="text-yellow-400" />
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Tabela Completa de Desempenho em Dupla ({duos.length})
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-bold">
                Clique em qualquer dupla para expandir a análise tática avançada
              </span>
            </div>

            {duos.length === 0 ? (
              <div className="bg-black/40 border border-white/10 rounded-3xl p-12 text-center">
                <Users size={48} className="mx-auto text-gray-600 mb-3" />
                <h4 className="text-lg font-black uppercase text-white">Nenhuma dupla encontrada</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                  Tente alterar os filtros de time, mapa ou tipo de dupla acima para visualizar os dados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {duos.map((duo, index) => {
                  const isExpanded = expandedDuoId === duo.id;

                  return (
                    <div
                      key={duo.id}
                      className={`bg-black/70 border rounded-3xl transition-all duration-200 overflow-hidden ${
                        isExpanded ? 'border-yellow-500/50 shadow-2xl shadow-yellow-500/10' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Collapsed Duo Summary Bar */}
                      <div
                        onClick={() => setExpandedDuoId(isExpanded ? null : duo.id)}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                      >
                        {/* Left: Rank & Duo Identification */}
                        <div className="flex items-center gap-4 min-w-[280px]">
                          <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-gray-400 flex items-center justify-center shrink-0">
                            #{index + 1}
                          </span>

                          {duo.teamLogo && (
                            <img src={duo.teamLogo} alt={duo.teamName} className="w-9 h-9 object-contain shrink-0" />
                          )}

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base font-black text-white tracking-tight">
                                {duo.player1.name} & {duo.player2.name}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                duo.duoType === 'RUSH_PURO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                duo.duoType === 'RUSH_HIBRIDO' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                              }`}>
                                {duo.duoType === 'RUSH_PURO' ? 'Rush Puro' : duo.duoType === 'RUSH_HIBRIDO' ? 'Rush Híbrido' : 'Dupla Geral'}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                              {duo.teamName} • {duo.matchesTogether} quedas juntos
                            </span>
                          </div>
                        </div>

                        {/* Middle: Key Numeric Badges */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full lg:w-auto">
                          <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] font-black uppercase text-gray-400 block">Abates</span>
                            <span className="text-sm sm:text-base font-black text-yellow-400">{duo.combinedKills}</span>
                          </div>
                          <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] font-black uppercase text-gray-400 block">KDA Ratio</span>
                            <span className="text-sm sm:text-base font-black text-cyan-300">{duo.kda.toFixed(2)}</span>
                          </div>
                          <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] font-black uppercase text-gray-400 block">Dano Médio</span>
                            <span className="text-sm sm:text-base font-black text-white">{duo.damagePerMatch.toLocaleString()}</span>
                          </div>
                          <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center hidden sm:block">
                            <span className="text-[9px] font-black uppercase text-gray-400 block">Sobrevivência</span>
                            <span className="text-sm sm:text-base font-black text-emerald-400">{duo.avgSurvivalRate.toFixed(1)}%</span>
                          </div>
                          <div className="bg-black/50 px-3 py-2 rounded-xl border border-white/5 text-center hidden sm:block">
                            <span className="text-[9px] font-black uppercase text-gray-400 block">Impacto Time</span>
                            <span className="text-sm sm:text-base font-black text-purple-400">{duo.teamKillShare}%</span>
                          </div>
                        </div>

                        {/* Right: Synergy Indicator & Chevron */}
                        <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-gray-500 block">Sinergia</span>
                            <span className="text-sm font-black text-yellow-400">{duo.synergyScore}%</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Duo Tactical Details */}
                      {isExpanded && (
                        <div className="p-5 sm:p-6 border-t border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent space-y-6">
                          {/* Quick Interactive Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-yellow-400" />
                              <span className="text-xs font-bold text-gray-300">
                                Destaques: {duo.strengths.join(' • ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCompareDuoAId(duo.id);
                                  setViewSection('radar');
                                  window.scrollTo({ top: 400, behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/30 transition-all flex items-center gap-1.5"
                              >
                                <Target size={14} />
                                Comparar no Radar
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDuoForEvolution(duo.id);
                                  setViewSection('evolution');
                                  window.scrollTo({ top: 400, behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/30 transition-all flex items-center gap-1.5"
                              >
                                <TrendingUp size={14} />
                                Ver Evolução (5 Rodadas)
                              </button>
                            </div>
                          </div>

                          {/* Complete Duo Totals & Per Match Averages Panel */}
                          <div className="bg-gradient-to-r from-yellow-950/30 via-black to-red-950/20 border border-yellow-500/20 rounded-2xl p-4.5 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-xs font-black uppercase tracking-wider text-yellow-400 flex items-center gap-2">
                                <Activity size={16} /> Totais & Médias da Dupla em {duo.matchesTogether} Partidas Juntos
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                duo.zeroKillMatches === 0 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }`}>
                                {duo.zeroKillMatches} Quedas Zeradas ({duo.zeroKillRate}%)
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                              {/* Abates */}
                              <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Abates Combinados</span>
                                <span className="text-base font-black text-yellow-400 block">{duo.combinedKills}</span>
                                <span className="text-[10px] font-bold text-amber-300 block mt-0.5">
                                  Média: {duo.killsPerMatch} / partida
                                </span>
                              </div>

                              {/* Dano */}
                              <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Dano Total</span>
                                <span className="text-base font-black text-white block">{duo.combinedDamage.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-red-400 block mt-0.5">
                                  Média: {duo.damagePerMatch.toLocaleString()} dmg / partida
                                </span>
                              </div>

                              {/* Deitados */}
                              <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Deitados (Knocks)</span>
                                <span className="text-base font-black text-emerald-400 block">{duo.combinedKnockdowns}</span>
                                <span className="text-[10px] font-bold text-emerald-300 block mt-0.5">
                                  Média: {duo.knockdownsPerMatch} / partida
                                </span>
                              </div>

                              {/* Assistências */}
                              <div className="bg-black/60 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Assistências</span>
                                <span className="text-base font-black text-blue-400 block">{duo.combinedAssists}</span>
                                <span className="text-[10px] font-bold text-blue-300 block mt-0.5">
                                  Média: {duo.assistsPerMatch} / partida
                                </span>
                              </div>

                              {/* Quedas Zeradas */}
                              <div className="bg-black/60 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-black uppercase text-gray-400 block mb-0.5">Quedas Zeradas (0 Kills)</span>
                                <span className="text-base font-black text-purple-400 block">{duo.zeroKillMatches} quedas</span>
                                <span className="text-[10px] font-bold text-purple-300 block mt-0.5">
                                  Taxa: {duo.zeroKillRate}% dos jogos
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Player 1 vs Player 2 Side-by-Side Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Player 1 Box */}
                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 overflow-hidden flex items-center justify-center shrink-0">
                                  {duo.player1.avatar ? (
                                    <img src={duo.player1.avatar} alt={duo.player1.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users size={20} className="text-yellow-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">{duo.player1.name}</h4>
                                    {duo.entryFragger === duo.player1.name && (
                                      <span className="text-[9px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">
                                        🎯 Entry Fragger
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {duo.player1.role1} {duo.player1.role2 ? `• ${duo.player1.role2}` : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Abates</span>
                                  <span className="font-black text-yellow-400">{duo.player1.kills}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Dano</span>
                                  <span className="font-black text-white">{duo.player1.damage.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Deitados</span>
                                  <span className="font-black text-emerald-400">{duo.player1.knockdowns}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Assist.</span>
                                  <span className="font-black text-blue-400">{duo.player1.assists}</span>
                                </div>
                              </div>
                            </div>

                            {/* Player 2 Box */}
                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 overflow-hidden flex items-center justify-center shrink-0">
                                  {duo.player2.avatar ? (
                                    <img src={duo.player2.avatar} alt={duo.player2.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users size={20} className="text-yellow-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">{duo.player2.name}</h4>
                                    {duo.entryFragger === duo.player2.name && (
                                      <span className="text-[9px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">
                                        🎯 Entry Fragger
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {duo.player2.role1} {duo.player2.role2 ? `• ${duo.player2.role2}` : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Abates</span>
                                  <span className="font-black text-yellow-400">{duo.player2.kills}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Dano</span>
                                  <span className="font-black text-white">{duo.player2.damage.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Deitados</span>
                                  <span className="font-black text-emerald-400">{duo.player2.knockdowns}</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                  <span className="text-[9px] text-gray-500 block">Assist.</span>
                                  <span className="font-black text-blue-400">{duo.player2.assists}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tactical Grid: Map Breakdown & Weapons Profile */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Map Performance Breakdown */}
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                  <MapPin size={14} className="text-yellow-400" /> Desempenho da Dupla por Mapa
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">Kills & Média / Queda</span>
                              </div>

                              <div className="space-y-2">
                                {duo.mapBreakdown.map(mapStat => (
                                  <div key={mapStat.mapName} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-white uppercase">{mapStat.mapName}</span>
                                      <span className="text-[10px] text-gray-400">({mapStat.matches} quedas)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-yellow-400">{mapStat.kills} kills</span>
                                      <span className="text-[10px] font-bold text-gray-400 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                                        {mapStat.killsPerMatch} K/Q
                                      </span>
                                      {mapStat.booyahs > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                          🏆 {mapStat.booyahs} B
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Rush Weapons Loadout Profile */}
                            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                                  <Crosshair size={14} className="text-yellow-400" /> Arsenal de Rush mais Letal
                                </span>
                                <span className="text-[10px] text-yellow-400 font-bold">
                                  {duo.rushWeaponRate}% armas de rush (SG/SMG)
                                </span>
                              </div>

                              {duo.topWeapons.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {duo.topWeapons.map(w => (
                                    <div key={w.name} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                                      {w.img && (
                                        <img src={w.img} alt={w.name} className="w-8 h-8 object-contain shrink-0" />
                                      )}
                                      <div className="overflow-hidden">
                                        <span className="text-[11px] font-black text-white block truncate uppercase">{w.name}</span>
                                        <span className="text-[10px] font-bold text-yellow-400">
                                          {w.kills} abates ({w.percentage}%)
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-gray-500 text-xs font-bold">
                                  Sem dados detalhados de killfeed para esta dupla.
                                </div>
                              )}

                              {/* Safe phase timing */}
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400 font-bold px-1">
                                <span>Early (Safe 1-2): <strong className="text-white">{duo.earlyGameKills}</strong></span>
                                <span>Mid (Safe 3-4): <strong className="text-white">{duo.midGameKills}</strong></span>
                                <span>Late (Safe 5+): <strong className="text-white">{duo.lateGameKills}</strong></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEAD TO HEAD COMPARE MODAL WITH RADAR CHART INTEGRATION */}
      {showCompareModal && duoA && duoB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-yellow-500/30 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-white rounded-xl bg-white/5 z-20"
            >
              ✕
            </button>

            <div className="mb-6">
              <RushDuosRadarCompare
                duos={duos}
                initialDuoAId={compareDuoAId}
                initialDuoBId={compareDuoBId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
