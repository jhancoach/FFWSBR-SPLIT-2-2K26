import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  LabelList 
} from 'recharts';
import { 
  TrendingUp, 
  Flame, 
  Crosshair, 
  Swords, 
  Trophy, 
  Award, 
  Sparkles, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { RushDuoData, RushDuoRoundStats } from '../utils/rushDuosUtils';

export interface RushDuosEvolutionChartProps {
  duos: RushDuoData[];
  initialDuoId?: string;
  className?: string;
}

export const RushDuosEvolutionChart: React.FC<RushDuosEvolutionChartProps> = ({
  duos,
  initialDuoId,
  className = ''
}) => {
  const [selectedDuoId, setSelectedDuoId] = useState<string>(initialDuoId || duos[0]?.id || '');
  const [compareDuoId, setCompareDuoId] = useState<string>(''); // Optional 2nd duo for evolution comparison
  const [metricMode, setMetricMode] = useState<'both' | 'kills' | 'damage'>('both');
  const [roundViewLimit, setRoundViewLimit] = useState<'last5' | 'all'>('last5');

  const activeDuo = useMemo(() => {
    return duos.find(d => d.id === selectedDuoId) || duos[0] || null;
  }, [duos, selectedDuoId]);

  const compareDuo = useMemo(() => {
    return compareDuoId ? duos.find(d => d.id === compareDuoId) || null : null;
  }, [duos, compareDuoId]);

  // Extract relevant rounds for the active duo
  const roundsToDisplay = useMemo(() => {
    if (!activeDuo) return [];
    const history = activeDuo.roundHistory || [];
    if (roundViewLimit === 'last5') {
      return history.slice(-5);
    }
    return history;
  }, [activeDuo, roundViewLimit]);

  // Chart data formatted
  const chartData = useMemo(() => {
    if (!activeDuo) return [];

    // All unique rounds between activeDuo and compareDuo
    const roundMap = new Map<string, any>();

    const duo1Rounds = (roundViewLimit === 'last5' ? activeDuo.last5Rounds : activeDuo.roundHistory) || [];
    duo1Rounds.forEach(r => {
      roundMap.set(r.round, {
        round: r.round,
        roundNum: r.roundNumber,
        duo1Kills: r.kills,
        duo1Damage: r.damage,
        duo1Kpm: r.killsPerMatch,
        duo1Dpm: r.damagePerMatch,
        duo1Booyahs: r.booyahs,
        duo1Kda: r.avgKda,
        matchesDuo1: r.matches
      });
    });

    if (compareDuo) {
      const duo2Rounds = (roundViewLimit === 'last5' ? compareDuo.last5Rounds : compareDuo.roundHistory) || [];
      duo2Rounds.forEach(r => {
        if (!roundMap.has(r.round)) {
          roundMap.set(r.round, {
            round: r.round,
            roundNum: r.roundNumber,
            duo2Kills: r.kills,
            duo2Damage: r.damage,
            duo2Kpm: r.killsPerMatch,
            duo2Dpm: r.damagePerMatch,
            duo2Booyahs: r.booyahs,
            duo2Kda: r.avgKda,
            matchesDuo2: r.matches
          });
        } else {
          const existing = roundMap.get(r.round);
          existing.duo2Kills = r.kills;
          existing.duo2Damage = r.damage;
          existing.duo2Kpm = r.killsPerMatch;
          existing.duo2Dpm = r.damagePerMatch;
          existing.duo2Booyahs = r.booyahs;
          existing.duo2Kda = r.avgKda;
          existing.matchesDuo2 = r.matches;
        }
      });
    }

    return Array.from(roundMap.values()).sort((a, b) => a.roundNum - b.roundNum);
  }, [activeDuo, compareDuo, roundViewLimit]);

  // Performance trends and highlights for the active duo
  const trends = useMemo(() => {
    if (!activeDuo || roundsToDisplay.length === 0) {
      return {
        peakKillsRound: null,
        peakDamageRound: null,
        lastRoundDiffKills: 0,
        lastRoundDiffDamage: 0,
        trendDirection: 'neutral' as 'up' | 'down' | 'neutral'
      };
    }

    let peakK = roundsToDisplay[0];
    let peakD = roundsToDisplay[0];

    roundsToDisplay.forEach(r => {
      if (r.kills > peakK.kills) peakK = r;
      if (r.damage > peakD.damage) peakD = r;
    });

    let diffK = 0;
    let diffD = 0;
    if (roundsToDisplay.length >= 2) {
      const last = roundsToDisplay[roundsToDisplay.length - 1];
      const prev = roundsToDisplay[roundsToDisplay.length - 2];
      diffK = last.kills - prev.kills;
      diffD = last.damage - prev.damage;
    }

    const trendDirection = diffK > 0 || diffD > 0 ? 'up' : diffK < 0 ? 'down' : 'neutral';

    return {
      peakKillsRound: peakK,
      peakDamageRound: peakD,
      lastRoundDiffKills: diffK,
      lastRoundDiffDamage: diffD,
      trendDirection
    };
  }, [activeDuo, roundsToDisplay]);

  if (!activeDuo) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-3xl p-8 text-center text-gray-400 text-sm">
        Nenhum dado de evolução por rodada disponível para as duplas.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with duo select & metric view buttons */}
      <div className="bg-gradient-to-r from-amber-950/30 via-black to-yellow-950/30 border border-yellow-500/20 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-yellow-500 text-black shadow-lg shadow-yellow-500/20">
              <TrendingUp size={22} className="fill-black" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                  Evolução Temporal
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  Últimas 5 Rodadas Disputadas
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-1">
                Evolução de Abates & Dano das Duplas
              </h3>
            </div>
          </div>

          {/* Metric View Modes */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-black/70 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setMetricMode('both')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  metricMode === 'both' 
                    ? 'bg-yellow-500 text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔥 Abates & Dano
              </button>
              <button
                onClick={() => setMetricMode('kills')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  metricMode === 'kills' 
                    ? 'bg-yellow-500 text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🎯 Apenas Abates
              </button>
              <button
                onClick={() => setMetricMode('damage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  metricMode === 'damage' 
                    ? 'bg-yellow-500 text-black shadow-md' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                💥 Apenas Dano
              </button>
            </div>

            {/* Limit toggle (Last 5 vs All) */}
            <button
              onClick={() => setRoundViewLimit(prev => prev === 'last5' ? 'all' : 'last5')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-white/10 bg-black/50 text-gray-300 hover:border-yellow-500/40 hover:text-yellow-400 transition-all"
            >
              {roundViewLimit === 'last5' ? '📌 Exibindo Últimas 5 Rodadas' : '🌐 Todas as Rodadas'}
            </button>
          </div>
        </div>

        {/* Duo Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Selected Duo */}
          <div className="bg-black/60 border border-yellow-500/30 rounded-2xl p-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-yellow-400 mb-1.5 block">
              Selecione a Dupla de Rush Principal
            </label>
            <select
              value={selectedDuoId}
              onChange={e => setSelectedDuoId(e.target.value)}
              className="w-full bg-black border border-yellow-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-black focus:outline-none focus:border-yellow-400 cursor-pointer"
            >
              {duos.map(d => (
                <option key={d.id} value={d.id}>
                  {d.teamName}: {d.player1.name} + {d.player2.name} ({d.combinedKills} kills totais)
                </option>
              ))}
            </select>
          </div>

          {/* Optional Compare Duo */}
          <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1.5 block">
              Comparar com 2ª Dupla (Opcional)
            </label>
            <select
              value={compareDuoId}
              onChange={e => setCompareDuoId(e.target.value)}
              className="w-full bg-black border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="">Nenhuma (Exibir apenas a dupla principal)</option>
              {duos.filter(d => d.id !== selectedDuoId).map(d => (
                <option key={d.id} value={d.id}>
                  {d.teamName}: {d.player1.name} + {d.player2.name} ({d.combinedKills} kills totais)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Evolution Chart Card */}
      <div className="bg-black/70 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md space-y-6">
        {/* Title & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            {activeDuo.teamLogo && (
              <img src={activeDuo.teamLogo} alt={activeDuo.teamName} className="w-7 h-7 object-contain" />
            )}
            <div>
              <span className="text-xs font-black uppercase text-yellow-400 block">{activeDuo.teamName}</span>
              <h4 className="text-base font-black text-white">
                {activeDuo.player1.name} & {activeDuo.player2.name}
              </h4>
            </div>
          </div>

          {/* Dynamic Trend Highlights */}
          {trends.peakKillsRound && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1 rounded-xl font-bold">
                👑 Pico de Abates: <strong className="text-white">{trends.peakKillsRound.kills} kills</strong> ({trends.peakKillsRound.round})
              </span>
              <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-xl font-bold">
                💥 Pico de Dano: <strong className="text-white">{trends.peakDamageRound?.damage.toLocaleString()} dmg</strong> ({trends.peakDamageRound?.round})
              </span>
            </div>
          )}
        </div>

        {/* Recharts Line Chart */}
        <div className="h-[360px] sm:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              
              <XAxis 
                dataKey="round" 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                axisLine={{ stroke: '#404040' }}
              />

              {/* Left Y Axis for Kills (or single metric) */}
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#eab308', fontSize: 11, fontWeight: 'bold' }}
                axisLine={{ stroke: '#ca8a04' }}
                domain={[0, 'auto']}
                label={metricMode === 'damage' ? undefined : { value: 'Abates', angle: -90, position: 'insideLeft', fill: '#eab308', fontSize: 11 }}
              />

              {/* Right Y Axis for Damage (when in both mode) */}
              {metricMode === 'both' && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }}
                  axisLine={{ stroke: '#dc2626' }}
                  domain={[0, 'auto']}
                  label={{ value: 'Dano', angle: 90, position: 'insideRight', fill: '#ef4444', fontSize: 11 }}
                />
              )}

              {/* Damage standalone Y-Axis */}
              {metricMode === 'damage' && (
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }}
                  axisLine={{ stroke: '#dc2626' }}
                  domain={[0, 'auto']}
                  label={{ value: 'Dano Médio', angle: -90, position: 'insideLeft', fill: '#ef4444', fontSize: 11 }}
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-black/95 border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-3 min-w-[240px]">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className="font-black text-yellow-400 uppercase text-sm">{label}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{data.matchesDuo1 || 6} quedas</span>
                        </div>

                        {/* Duo 1 Metrics */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 block">
                            {activeDuo.teamName}: {activeDuo.player1.name} & {activeDuo.player2.name}
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                            <span className="text-yellow-400">🔥 {data.duo1Kills ?? 0} abates ({data.duo1Kpm ?? 0} K/Q)</span>
                            <span className="text-red-400">💥 {(data.duo1Damage ?? 0).toLocaleString()} dmg</span>
                            <span className="text-amber-300">⚡ KDA: {data.duo1Kda ?? '0.00'}</span>
                            {data.duo1Booyahs > 0 && (
                              <span className="text-emerald-400">🏆 {data.duo1Booyahs} Booyahs</span>
                            )}
                          </div>
                        </div>

                        {/* Duo 2 Metrics if comparing */}
                        {compareDuo && data.duo2Kills !== undefined && (
                          <div className="space-y-1 border-t border-white/10 pt-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                              {compareDuo.teamName}: {compareDuo.player1.name} & {compareDuo.player2.name}
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                              <span className="text-cyan-400">🔥 {data.duo2Kills ?? 0} abates</span>
                              <span className="text-cyan-300">💥 {(data.duo2Damage ?? 0).toLocaleString()} dmg</span>
                              <span className="text-cyan-200">⚡ KDA: {data.duo2Kda ?? '0.00'}</span>
                              {data.duo2Booyahs > 0 && (
                                <span className="text-emerald-400">🏆 {data.duo2Booyahs} Booyahs</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ paddingBottom: '10px' }}
                formatter={(val) => <span className="text-xs font-bold text-gray-300">{val}</span>}
              />

              {/* DUO 1 KILLS LINE */}
              {(metricMode === 'both' || metricMode === 'kills') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="duo1Kills"
                  name={`${activeDuo.player1.name}+${activeDuo.player2.name} (Abates)`}
                  stroke="#eab308"
                  strokeWidth={3.5}
                  dot={{ r: 6, fill: '#eab308', stroke: '#000', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#facc15', stroke: '#fff', strokeWidth: 2 }}
                >
                  <LabelList 
                    dataKey="duo1Kills" 
                    position="top" 
                    offset={10} 
                    style={{ fill: '#facc15', fontSize: '11px', fontWeight: '900' }} 
                  />
                </Line>
              )}

              {/* DUO 1 DAMAGE LINE */}
              {(metricMode === 'both' || metricMode === 'damage') && (
                <Line
                  yAxisId={metricMode === 'both' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="duo1Damage"
                  name={`${activeDuo.player1.name}+${activeDuo.player2.name} (Dano)`}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  strokeDasharray={metricMode === 'both' ? '5 5' : undefined}
                  dot={{ r: 5, fill: '#ef4444', stroke: '#000', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#f87171', stroke: '#fff', strokeWidth: 2 }}
                >
                  <LabelList 
                    dataKey="duo1Damage" 
                    position="bottom" 
                    offset={10} 
                    style={{ fill: '#f87171', fontSize: '10px', fontWeight: '800' }} 
                    formatter={(val: any) => typeof val === 'number' ? val.toLocaleString() : val}
                  />
                </Line>
              )}

              {/* DUO 2 KILLS LINE (IF COMPARING) */}
              {compareDuo && (metricMode === 'both' || metricMode === 'kills') && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="duo2Kills"
                  name={`${compareDuo.player1.name}+${compareDuo.player2.name} (Abates)`}
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#06b6d4', stroke: '#000', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#22d3ee', stroke: '#fff', strokeWidth: 2 }}
                >
                  <LabelList 
                    dataKey="duo2Kills" 
                    position="top" 
                    offset={10} 
                    style={{ fill: '#22d3ee', fontSize: '10px', fontWeight: '900' }} 
                  />
                </Line>
              )}

              {/* DUO 2 DAMAGE LINE (IF COMPARING) */}
              {compareDuo && (metricMode === 'both' || metricMode === 'damage') && (
                <Line
                  yAxisId={metricMode === 'both' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="duo2Damage"
                  name={`${compareDuo.player1.name}+${compareDuo.player2.name} (Dano)`}
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#a855f7', stroke: '#000', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#c084fc', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Round by Round Mini Cards */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 block">
            Detalhamento por Rodada ({roundsToDisplay.length} rodadas registradas)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {roundsToDisplay.map((r, idx) => {
              const isLast = idx === roundsToDisplay.length - 1;
              return (
                <div 
                  key={r.round} 
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isLast 
                      ? 'bg-yellow-500/10 border-yellow-500/40 shadow-lg shadow-yellow-500/5' 
                      : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-white">{r.round}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{r.matches}Q</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">Abates:</span>
                      <span className="font-black text-yellow-400">{r.kills} ({r.killsPerMatch} K/Q)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">Dano:</span>
                      <span className="font-black text-red-400">{r.damage.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-bold">KDA:</span>
                      <span className="font-black text-amber-300">{r.avgKda.toFixed(2)}</span>
                    </div>
                    {r.booyahs > 0 && (
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                        <span className="text-emerald-400 font-black">🏆 Booyahs:</span>
                        <span className="font-black text-emerald-400">{r.booyahs}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
