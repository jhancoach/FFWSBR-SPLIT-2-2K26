import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  Crosshair, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  User, 
  Trophy, 
  Flame, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  X,
  Target,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

interface PlayerHsEvolutionChartProps {
  data: DashboardData;
  selectedPlayer?: string;
  onSelectPlayer?: (playerName: string) => void;
  onViewProfile?: (playerName: string) => void;
  className?: string;
}

const normalize = (val: string | undefined | null) => (val || '').trim().toUpperCase();

const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned, 10) || 0;
};

export interface RoundHsPoint {
  round: string;
  roundRaw: string;
  roundNum: number;
  hs: number;
  matches: number;
  kills: number;
  avgHs: number;
  cumulativeHs: number;
  cumulativeMatches: number;
  cumulativeAvgHs: number;
  deltaPrev: number;
}

export const PlayerHsEvolutionChart: React.FC<PlayerHsEvolutionChartProps> = ({
  data,
  selectedPlayer: controlledPlayer,
  onSelectPlayer,
  onViewProfile,
  className = ''
}) => {
  // Lista de todos os jogadores únicos com seus times e totais
  const allPlayersList = useMemo(() => {
    const map = new Map<string, { name: string; team: string; totalHs: number; totalMatches: number }>();
    
    data.players.forEach(p => {
      if (!p.PLAYER) return;
      const name = p.PLAYER.trim();
      const hs = parseNumber(p.HS);
      
      if (!map.has(name)) {
        map.set(name, {
          name,
          team: p.TIME || '',
          totalHs: 0,
          totalMatches: 0
        });
      }
      
      const item = map.get(name)!;
      if (!item.team && p.TIME) item.team = p.TIME;
      item.totalHs += hs;
      item.totalMatches += 1;
    });

    return Array.from(map.values()).map(p => ({
      ...p,
      avgHs: p.totalMatches > 0 ? p.totalHs / p.totalMatches : 0
    })).sort((a, b) => b.totalHs - a.totalHs);
  }, [data.players]);

  // Estado interno para jogador selecionado se não for controlado externamente
  const [internalPlayer, setInternalPlayer] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<'round' | 'cumulative' | 'both'>('both');

  // Inicializar com o jogador passado ou o #1 jogador de HS
  const activePlayer = controlledPlayer || internalPlayer || (allPlayersList[0]?.name || '');

  useEffect(() => {
    if (controlledPlayer) {
      setInternalPlayer(controlledPlayer);
    }
  }, [controlledPlayer]);

  const handleChoosePlayer = (name: string) => {
    setInternalPlayer(name);
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (onSelectPlayer) {
      onSelectPlayer(name);
    }
  };

  // Filtrar lista de busca de jogadores
  const filteredSearchPlayers = useMemo(() => {
    if (!searchQuery.trim()) return allPlayersList.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return allPlayersList.filter(p => 
      p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [allPlayersList, searchQuery]);

  // 2. Coletar e ordenar todas as rodadas
  const sortedRounds = useMemo(() => {
    const roundsSet = new Set<string>();
    data.players.forEach(p => {
      if (p.RD && p.RD.trim()) roundsSet.add(p.RD.trim());
    });

    return Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.players]);

  // 3. Processar evolução rodada a rodada do jogador selecionado
  const { chartData, playerSummary, bestRound, lastRoundEvolution } = useMemo(() => {
    if (!activePlayer) {
      return { chartData: [], playerSummary: null, bestRound: null, lastRoundEvolution: 0 };
    }

    const playerRecords = data.players.filter(p => 
      normalize(p.PLAYER) === normalize(activePlayer)
    );

    if (playerRecords.length === 0) {
      return { chartData: [], playerSummary: null, bestRound: null, lastRoundEvolution: 0 };
    }

    const team = playerRecords[0]?.TIME || '';
    const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(activePlayer));

    // Agrupar registros por rodada
    const roundMap = new Map<string, { hs: number; matches: number; kills: number }>();
    playerRecords.forEach(p => {
      const rd = (p.RD || '').trim();
      if (!rd) return;
      const hs = parseNumber(p.HS);
      const kills = parseNumber(p.Abates);

      const curr = roundMap.get(rd) || { hs: 0, matches: 0, kills: 0 };
      curr.hs += hs;
      curr.matches += 1;
      curr.kills += kills;
      roundMap.set(rd, curr);
    });

    const points: RoundHsPoint[] = [];
    let cumulativeHs = 0;
    let cumulativeMatches = 0;
    let prevRoundAvg = 0;
    let bestRd: { round: string; avgHs: number; hs: number; matches: number } | null = null;

    sortedRounds.forEach(rd => {
      // Se o jogador disputou essa rodada
      if (roundMap.has(rd)) {
        const item = roundMap.get(rd)!;
        const roundAvg = item.matches > 0 ? item.hs / item.matches : 0;
        
        cumulativeHs += item.hs;
        cumulativeMatches += item.matches;
        const cumAvg = cumulativeMatches > 0 ? cumulativeHs / cumulativeMatches : 0;

        const deltaPrev = points.length > 0 ? roundAvg - prevRoundAvg : 0;
        prevRoundAvg = roundAvg;

        const roundNum = parseInt(rd.replace(/\D/g, ''), 10) || points.length + 1;
        const formattedRound = `RD ${roundNum}`;

        const point: RoundHsPoint = {
          round: formattedRound,
          roundRaw: rd,
          roundNum,
          hs: item.hs,
          matches: item.matches,
          kills: item.kills,
          avgHs: parseFloat(roundAvg.toFixed(2)),
          cumulativeHs,
          cumulativeMatches,
          cumulativeAvgHs: parseFloat(cumAvg.toFixed(2)),
          deltaPrev: parseFloat(deltaPrev.toFixed(2))
        };

        points.push(point);

        if (!bestRd || roundAvg > bestRd.avgHs) {
          bestRd = { round: formattedRound, avgHs: roundAvg, hs: item.hs, matches: item.matches };
        }
      }
    });

    const overallAvgHs = cumulativeMatches > 0 ? cumulativeHs / cumulativeMatches : 0;
    const lastEvolution = points.length >= 2 
      ? points[points.length - 1].avgHs - points[points.length - 2].avgHs 
      : (points.length === 1 ? points[0].avgHs : 0);

    return {
      chartData: points,
      playerSummary: {
        name: activePlayer,
        team,
        playerImg: findDimImg(data.playersDimension, activePlayer),
        teamImg: findTeamLogo(team, data.teamsReference),
        funcao: dim?.Funcao || 'JOGADOR',
        totalHs: cumulativeHs,
        totalMatches: cumulativeMatches,
        overallAvgHs: parseFloat(overallAvgHs.toFixed(2))
      },
      bestRound: bestRd,
      lastRoundEvolution: parseFloat(lastEvolution.toFixed(2))
    };
  }, [data.players, data.playersDimension, data.teamsReference, activePlayer, sortedRounds]);

  // Custom Tooltip para o Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as RoundHsPoint;
      const isPositive = dataPoint.deltaPrev >= 0;

      return (
        <div className="bg-[#121214]/95 backdrop-blur-md border border-gray-700/80 rounded-xl p-4 shadow-2xl min-w-[220px] text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair size={13} /> {label}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">
              {dataPoint.matches} {dataPoint.matches === 1 ? 'Queda' : 'Quedas'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média na Rodada:</span>
              <span className="text-amber-300 font-black text-sm">
                {dataPoint.avgHs.toFixed(2)} <span className="text-[10px] font-normal text-gray-400">HS/Q</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média Acumulada:</span>
              <span className="text-cyan-400 font-bold">
                {dataPoint.cumulativeAvgHs.toFixed(2)} <span className="text-[10px] font-normal text-gray-400">HS/Q</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Headshots Totais:</span>
              <span className="text-white font-bold">{dataPoint.hs} HS</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Abates (Kills):</span>
              <span className="text-red-400 font-bold">{dataPoint.kills} K</span>
            </div>

            {dataPoint.deltaPrev !== 0 && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-gray-400">Evolução vs RD Ant.:</span>
                <span className={`text-[11px] font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {isPositive ? `+${dataPoint.deltaPrev.toFixed(2)}` : dataPoint.deltaPrev.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="player-hs-evolution-section" className={`bg-[#141417] border border-gray-800 rounded-2xl p-5 md:p-6 shadow-xl ${className}`}>
      {/* Header com Título e Seletor Interativo de Jogador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity size={15} />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
              Evolução da Média de HS por Rodada
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Gráfico de linhas oficial com progressão por partida (HS ÷ Quedas) ao longo do campeonato
          </p>
        </div>

        {/* Player Selector Dropdown / Search */}
        <div className="relative min-w-[240px]">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2 px-3 py-2 bg-black/40 hover:bg-black/60 border border-gray-700/80 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              {playerSummary?.playerImg ? (
                <img 
                  src={playerSummary.playerImg} 
                  alt={playerSummary.name}
                  className="w-6 h-6 rounded-full object-cover border border-amber-500/50"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                  <User size={12} />
                </div>
              )}
              <div className="truncate">
                <span className="text-xs font-black text-white uppercase truncate block leading-tight">
                  {playerSummary?.name || 'Selecione um Jogador'}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                  {playerSummary?.team || '-'}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-[#18181c] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-white/5 flex items-center gap-2 bg-black/30">
                <Search size={14} className="text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar jogador ou equipe..."
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredSearchPlayers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    Nenhum jogador encontrado.
                  </div>
                ) : (
                  filteredSearchPlayers.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleChoosePlayer(p.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        normalize(p.name) === normalize(activePlayer)
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold uppercase truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase">({p.team})</span>
                      </div>
                      <span className="text-[11px] font-black text-amber-400 font-mono">
                        {p.avgHs.toFixed(2)} HS/Q
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Player Summary Bar & Metric Badges */}
      {playerSummary && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Jogador Identidade */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2 flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
            {playerSummary.playerImg ? (
              <img 
                src={playerSummary.playerImg} 
                alt={playerSummary.name}
                className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gray-900 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <User size={22} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase italic tracking-tight truncate">
                  {playerSummary.name}
                </span>
                <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase">
                  {playerSummary.funcao}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                {playerSummary.teamImg && (
                  <img src={playerSummary.teamImg} alt={playerSummary.team} className="w-3.5 h-3.5 object-contain" />
                )}
                <span className="truncate">{playerSummary.team}</span>
                <span aria-hidden="true">·</span>
                <span>{playerSummary.totalMatches} Quedas</span>
              </div>
            </div>
            {onViewProfile && (
              <button
                onClick={() => onViewProfile(playerSummary.name)}
                className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 transition-colors"
                title="Ver perfil completo"
              >
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          {/* Média Geral de HS */}
          <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Crosshair size={10} className="text-amber-400" /> Média Geral HS
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-400 font-mono">
                {playerSummary.overallAvgHs.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">HS/Q</span>
            </div>
            <span className="text-[9px] text-gray-500">{playerSummary.totalHs} HS Totais</span>
          </div>

          {/* Melhor Rodada */}
          <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Trophy size={10} className="text-yellow-400" /> Melhor Rodada
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-black text-yellow-400 font-mono">
                {bestRound ? bestRound.avgHs.toFixed(2) : '-'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">HS/Q</span>
            </div>
            <span className="text-[9px] text-gray-500 truncate">
              {bestRound ? `${bestRound.round} (${bestRound.hs} HS)` : '-'}
            </span>
          </div>

          {/* Evolução na Última Rodada */}
          <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-emerald-400" /> Salto Última RD
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono ${lastRoundEvolution >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastRoundEvolution >= 0 ? `+${lastRoundEvolution.toFixed(2)}` : lastRoundEvolution.toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">HS/Q</span>
            </div>
            <span className="text-[9px] text-gray-500">
              {lastRoundEvolution >= 0 ? 'Crescimento de precisão' : 'Oscilação normal'}
            </span>
          </div>
        </div>
      )}

      {/* Toggle de Visualização (Média da Rodada vs Média Acumulada) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setChartMode('both')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              chartMode === 'both'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Visão Completa
          </button>
          <button
            onClick={() => setChartMode('round')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              chartMode === 'round'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Média por Rodada
          </button>
          <button
            onClick={() => setChartMode('cumulative')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              chartMode === 'cumulative'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Média Acumulada
          </button>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-4 text-[11px]">
          {(chartMode === 'both' || chartMode === 'round') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-gray-300 font-bold">Média na Rodada</span>
            </div>
          )}
          {(chartMode === 'both' || chartMode === 'cumulative') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block border-b border-dashed border-cyan-400" />
              <span className="text-cyan-300 font-bold">Média Acumulada</span>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="mt-5 w-full h-[280px] md:h-[320px]">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
            <Crosshair size={32} className="mb-2 text-gray-700" />
            <span className="text-xs font-bold uppercase">Nenhum dado de rodada para este jogador</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid stroke="#26262b" strokeDasharray="3 3" vertical={false} />
              
              <XAxis 
                dataKey="round" 
                stroke="#6b7280" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                dy={8}
              />
              
              <YAxis 
                stroke="#6b7280" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                domain={[0, 'auto']}
                tickFormatter={(val) => Number(val).toFixed(1)}
              />

              {/* Linha de referência da média geral */}
              {playerSummary && (
                <ReferenceLine 
                  y={playerSummary.overallAvgHs} 
                  stroke="#4b5563" 
                  strokeDasharray="4 4"
                  label={{
                    value: `Média Geral: ${playerSummary.overallAvgHs.toFixed(2)}`,
                    fill: '#9ca3af',
                    fontSize: 9,
                    position: 'insideTopRight'
                  }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {/* Linha 1: Média na Rodada */}
              {(chartMode === 'both' || chartMode === 'round') && (
                <Line 
                  type="monotone" 
                  dataKey="avgHs" 
                  name="Média na Rodada" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#fbbf24', stroke: '#18181b', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={800}
                />
              )}

              {/* Linha 2: Média Acumulada */}
              {(chartMode === 'both' || chartMode === 'cumulative') && (
                <Line 
                  type="monotone" 
                  dataKey="cumulativeAvgHs" 
                  name="Média Acumulada" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#22d3ee', stroke: '#18181b', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                  animationDuration={1000}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info & Dica */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
        <span>Fórmula Oficial: Média de HS = Total de Headshots ÷ Partidas Disputadas</span>
        <span>Passe o mouse ou toque nos pontos para ver detalhes de cada rodada</span>
      </div>
    </div>
  );
};

export default PlayerHsEvolutionChart;
