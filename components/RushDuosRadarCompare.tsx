import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip,
  Legend
} from 'recharts';
import { 
  Swords, 
  Shield, 
  Target, 
  Flame, 
  Sparkles, 
  Trophy, 
  ArrowRightLeft, 
  Zap, 
  Award, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { RushDuoData } from '../utils/rushDuosUtils';

export interface RushDuosRadarCompareProps {
  duos: RushDuoData[];
  initialDuoAId?: string;
  initialDuoBId?: string;
  onSelectDuo?: (duoId: string) => void;
  className?: string;
}

export const RushDuosRadarCompare: React.FC<RushDuosRadarCompareProps> = ({
  duos,
  initialDuoAId,
  initialDuoBId,
  className = ''
}) => {
  const [selectedDuoAId, setSelectedDuoAId] = useState<string>(initialDuoAId || duos[0]?.id || '');
  const [selectedDuoBId, setSelectedDuoBId] = useState<string>(initialDuoBId || duos[1]?.id || duos[0]?.id || '');
  const [selectedDuoCId, setSelectedDuoCId] = useState<string>(''); // Optional 3rd duo
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  // Sync if duos change or ids become invalid
  const duoA = useMemo(() => duos.find(d => d.id === selectedDuoAId) || duos[0] || null, [duos, selectedDuoAId]);
  const duoB = useMemo(() => duos.find(d => d.id === selectedDuoBId) || duos[1] || duos[0] || null, [duos, selectedDuoBId]);
  const duoC = useMemo(() => selectedDuoCId ? duos.find(d => d.id === selectedDuoCId) || null : null, [duos, selectedDuoCId]);

  // League Averages across all duos for radar normalization
  const leagueAverages = useMemo(() => {
    if (duos.length === 0) {
      return { avgKda: 1.0, avgDamage: 600, avgSurvival: 15, avgKpm: 1.8, avgKnocks: 1.5, avgSynergy: 50 };
    }
    const count = duos.length;
    const avgKda = duos.reduce((acc, d) => acc + d.kda, 0) / count;
    const avgDamage = duos.reduce((acc, d) => acc + d.damagePerMatch, 0) / count;
    const avgSurvival = duos.reduce((acc, d) => acc + d.avgSurvivalRate, 0) / count;
    const avgKpm = duos.reduce((acc, d) => acc + d.killsPerMatch, 0) / count;
    const avgKnocks = duos.reduce((acc, d) => acc + d.knockdownsPerMatch, 0) / count;
    const avgSynergy = duos.reduce((acc, d) => acc + d.synergyScore, 0) / count;

    return {
      avgKda: Math.max(0.1, avgKda),
      avgDamage: Math.max(10, avgDamage),
      avgSurvival: Math.max(1, avgSurvival),
      avgKpm: Math.max(0.1, avgKpm),
      avgKnocks: Math.max(0.1, avgKnocks),
      avgSynergy: Math.max(1, avgSynergy)
    };
  }, [duos]);

  // Max values for normalization
  const maxValues = useMemo(() => {
    return {
      maxKda: Math.max(...duos.map(d => d.kda), 3.0),
      maxDamage: Math.max(...duos.map(d => d.damagePerMatch), 1500),
      maxSurvival: Math.max(...duos.map(d => d.avgSurvivalRate), 40),
      maxKpm: Math.max(...duos.map(d => d.killsPerMatch), 4.0),
      maxKnocks: Math.max(...duos.map(d => d.knockdownsPerMatch), 4.0),
      maxSynergy: 100
    };
  }, [duos]);

  // Radar Data formatted for Recharts
  const radarData = useMemo(() => {
    if (!duoA) return [];

    const norm = (val: number, max: number) => Math.min(100, Math.max(10, Math.round((val / (max || 1)) * 100)));

    const categories = [
      {
        subject: 'KDA',
        fullName: 'KDA Ratio (Abates + Assistências / Mortes)',
        max: maxValues.maxKda,
        aRaw: duoA.kda.toFixed(2),
        bRaw: duoB ? duoB.kda.toFixed(2) : '0.00',
        cRaw: duoC ? duoC.kda.toFixed(2) : undefined,
        leagueRaw: leagueAverages.avgKda.toFixed(2),
        aScore: norm(duoA.kda, maxValues.maxKda),
        bScore: duoB ? norm(duoB.kda, maxValues.maxKda) : 0,
        cScore: duoC ? norm(duoC.kda, maxValues.maxKda) : 0,
        leagueScore: norm(leagueAverages.avgKda, maxValues.maxKda)
      },
      {
        subject: 'Dano Médio',
        fullName: 'Dano Médio por Queda',
        max: maxValues.maxDamage,
        aRaw: `${duoA.damagePerMatch.toLocaleString()} dmg`,
        bRaw: duoB ? `${duoB.damagePerMatch.toLocaleString()} dmg` : '0 dmg',
        cRaw: duoC ? `${duoC.damagePerMatch.toLocaleString()} dmg` : undefined,
        leagueRaw: `${leagueAverages.avgDamage.toFixed(0)} dmg`,
        aScore: norm(duoA.damagePerMatch, maxValues.maxDamage),
        bScore: duoB ? norm(duoB.damagePerMatch, maxValues.maxDamage) : 0,
        cScore: duoC ? norm(duoC.damagePerMatch, maxValues.maxDamage) : 0,
        leagueScore: norm(leagueAverages.avgDamage, maxValues.maxDamage)
      },
      {
        subject: 'Sobrevivência',
        fullName: 'Sobrevivência Média & Booyahs (%)',
        max: maxValues.maxSurvival,
        aRaw: `${duoA.avgSurvivalRate.toFixed(1)}%`,
        bRaw: duoB ? `${duoB.avgSurvivalRate.toFixed(1)}%` : '0%',
        cRaw: duoC ? `${duoC.avgSurvivalRate.toFixed(1)}%` : undefined,
        leagueRaw: `${leagueAverages.avgSurvival.toFixed(1)}%`,
        aScore: norm(duoA.avgSurvivalRate, maxValues.maxSurvival),
        bScore: duoB ? norm(duoB.avgSurvivalRate, maxValues.maxSurvival) : 0,
        cScore: duoC ? norm(duoC.avgSurvivalRate, maxValues.maxSurvival) : 0,
        leagueScore: norm(leagueAverages.avgSurvival, maxValues.maxSurvival)
      },
      {
        subject: 'Abates / Queda',
        fullName: 'Abates Combinados por Queda (KPM)',
        max: maxValues.maxKpm,
        aRaw: `${duoA.killsPerMatch.toFixed(2)} K/Q`,
        bRaw: duoB ? `${duoB.killsPerMatch.toFixed(2)} K/Q` : '0 K/Q',
        cRaw: duoC ? `${duoC.killsPerMatch.toFixed(2)} K/Q` : undefined,
        leagueRaw: `${leagueAverages.avgKpm.toFixed(2)} K/Q`,
        aScore: norm(duoA.killsPerMatch, maxValues.maxKpm),
        bScore: duoB ? norm(duoB.killsPerMatch, maxValues.maxKpm) : 0,
        cScore: duoC ? norm(duoC.killsPerMatch, maxValues.maxKpm) : 0,
        leagueScore: norm(leagueAverages.avgKpm, maxValues.maxKpm)
      },
      {
        subject: 'Entry Knocks',
        fullName: 'Knockdowns de Entrada por Queda',
        max: maxValues.maxKnocks,
        aRaw: `${duoA.knockdownsPerMatch.toFixed(2)}/Q`,
        bRaw: duoB ? `${duoB.knockdownsPerMatch.toFixed(2)}/Q` : '0/Q',
        cRaw: duoC ? `${duoC.knockdownsPerMatch.toFixed(2)}/Q` : undefined,
        leagueRaw: `${leagueAverages.avgKnocks.toFixed(2)}/Q`,
        aScore: norm(duoA.knockdownsPerMatch, maxValues.maxKnocks),
        bScore: duoB ? norm(duoB.knockdownsPerMatch, maxValues.maxKnocks) : 0,
        cScore: duoC ? norm(duoC.knockdownsPerMatch, maxValues.maxKnocks) : 0,
        leagueScore: norm(leagueAverages.avgKnocks, maxValues.maxKnocks)
      },
      {
        subject: 'Sinergia & Share',
        fullName: 'Sinergia Ofensiva e % dos Abates do Time',
        max: maxValues.maxSynergy,
        aRaw: `${duoA.synergyScore}% (${duoA.teamKillShare}% share)`,
        bRaw: duoB ? `${duoB.synergyScore}% (${duoB.teamKillShare}% share)` : '0%',
        cRaw: duoC ? `${duoC.synergyScore}% (${duoC.teamKillShare}% share)` : undefined,
        leagueRaw: `${leagueAverages.avgSynergy.toFixed(0)}%`,
        aScore: norm(duoA.synergyScore, maxValues.maxSynergy),
        bScore: duoB ? norm(duoB.synergyScore, maxValues.maxSynergy) : 0,
        cScore: duoC ? norm(duoC.synergyScore, maxValues.maxSynergy) : 0,
        leagueScore: norm(leagueAverages.avgSynergy, maxValues.maxSynergy)
      }
    ];

    return categories;
  }, [duoA, duoB, duoC, leagueAverages, maxValues]);

  // Calculate relative strengths confrontation between Duo A and Duo B
  const confrontationPoints = useMemo(() => {
    if (!duoA || !duoB) return [];

    const diff = (a: number, b: number) => {
      if (b === 0) return a > 0 ? '+100%' : '0%';
      const pct = ((a - b) / b) * 100;
      return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
    };

    return [
      {
        metric: 'KDA',
        icon: <Zap size={15} className="text-yellow-400" />,
        label: 'KDA Ratio',
        aValue: duoA.kda,
        bValue: duoB.kda,
        aDisplay: duoA.kda.toFixed(2),
        bDisplay: duoB.kda.toFixed(2),
        winner: duoA.kda > duoB.kda ? 'A' : duoB.kda > duoA.kda ? 'B' : 'TIE',
        diffText: duoA.kda >= duoB.kda ? diff(duoA.kda, duoB.kda) : diff(duoB.kda, duoA.kda),
        desc: 'Eficiência de abates e assistências em relação às quedas com eliminações'
      },
      {
        metric: 'DANO',
        icon: <Flame size={15} className="text-red-400" />,
        label: 'Dano Médio / Queda',
        aValue: duoA.damagePerMatch,
        bValue: duoB.damagePerMatch,
        aDisplay: `${duoA.damagePerMatch.toLocaleString()} dmg`,
        bDisplay: `${duoB.damagePerMatch.toLocaleString()} dmg`,
        winner: duoA.damagePerMatch > duoB.damagePerMatch ? 'A' : duoB.damagePerMatch > duoA.damagePerMatch ? 'B' : 'TIE',
        diffText: duoA.damagePerMatch >= duoB.damagePerMatch ? diff(duoA.damagePerMatch, duoB.damagePerMatch) : diff(duoB.damagePerMatch, duoA.damagePerMatch),
        desc: 'Poder de fogo e impacto ofensivo por partida disputada'
      },
      {
        metric: 'SOBREVIVENCIA',
        icon: <Shield size={15} className="text-emerald-400" />,
        label: 'Sobrevivência Média',
        aValue: duoA.avgSurvivalRate,
        bValue: duoB.avgSurvivalRate,
        aDisplay: `${duoA.avgSurvivalRate.toFixed(1)}% (${duoA.booyahsTogether} B)`,
        bDisplay: `${duoB.avgSurvivalRate.toFixed(1)}% (${duoB.booyahsTogether} B)`,
        winner: duoA.avgSurvivalRate > duoB.avgSurvivalRate ? 'A' : duoB.avgSurvivalRate > duoA.avgSurvivalRate ? 'B' : 'TIE',
        diffText: duoA.avgSurvivalRate >= duoB.avgSurvivalRate ? diff(duoA.avgSurvivalRate, duoB.avgSurvivalRate) : diff(duoB.avgSurvivalRate, duoA.avgSurvivalRate),
        desc: 'Taxa de Booyahs e partidas sobrevivendo até o final'
      },
      {
        metric: 'KPM',
        icon: <Target size={15} className="text-amber-400" />,
        label: 'Abates / Queda',
        aValue: duoA.killsPerMatch,
        bValue: duoB.killsPerMatch,
        aDisplay: `${duoA.killsPerMatch.toFixed(2)} K/Q`,
        bDisplay: `${duoB.killsPerMatch.toFixed(2)} K/Q`,
        winner: duoA.killsPerMatch > duoB.killsPerMatch ? 'A' : duoB.killsPerMatch > duoA.killsPerMatch ? 'B' : 'TIE',
        diffText: duoA.killsPerMatch >= duoB.killsPerMatch ? diff(duoA.killsPerMatch, duoB.killsPerMatch) : diff(duoB.killsPerMatch, duoA.killsPerMatch),
        desc: 'Letalidade direta e média de abates somados por queda'
      },
      {
        metric: 'KNOCKS',
        icon: <CrosshairIcon size={15} className="text-cyan-400" />,
        label: 'Deitados de Entrada',
        aValue: duoA.knockdownsPerMatch,
        bValue: duoB.knockdownsPerMatch,
        aDisplay: `${duoA.knockdownsPerMatch.toFixed(2)}/Q`,
        bDisplay: `${duoB.knockdownsPerMatch.toFixed(2)}/Q`,
        winner: duoA.knockdownsPerMatch > duoB.knockdownsPerMatch ? 'A' : duoB.knockdownsPerMatch > duoA.knockdownsPerMatch ? 'B' : 'TIE',
        diffText: duoA.knockdownsPerMatch >= duoB.knockdownsPerMatch ? diff(duoA.knockdownsPerMatch, duoB.knockdownsPerMatch) : diff(duoB.knockdownsPerMatch, duoA.knockdownsPerMatch),
        desc: 'Capacidade de abertura de confrontos com primeiro knockdown'
      },
      {
        metric: 'ASSISTS',
        icon: <Users size={15} className="text-blue-400" />,
        label: 'Assistências Médias',
        aValue: duoA.assistsPerMatch,
        bValue: duoB.assistsPerMatch,
        aDisplay: `${duoA.assistsPerMatch.toFixed(2)}/Q (${duoA.combinedAssists} tot)`,
        bDisplay: `${duoB.assistsPerMatch.toFixed(2)}/Q (${duoB.combinedAssists} tot)`,
        winner: duoA.assistsPerMatch > duoB.assistsPerMatch ? 'A' : duoB.assistsPerMatch > duoA.assistsPerMatch ? 'B' : 'TIE',
        diffText: duoA.assistsPerMatch >= duoB.assistsPerMatch ? diff(duoA.assistsPerMatch, duoB.assistsPerMatch) : diff(duoB.assistsPerMatch, duoA.assistsPerMatch),
        desc: 'Trabalho de suporte e cobertura mutua nas eliminações'
      },
      {
        metric: 'ZERADAS',
        icon: <AlertCircle size={15} className="text-pink-400" />,
        label: 'Quedas Zeradas (0 Abates)',
        aValue: duoA.zeroKillMatches,
        bValue: duoB.zeroKillMatches,
        aDisplay: `${duoA.zeroKillMatches} quedas (${duoA.zeroKillRate}%)`,
        bDisplay: `${duoB.zeroKillMatches} quedas (${duoB.zeroKillRate}%)`,
        // Fewer zero kill matches is better!
        winner: duoA.zeroKillMatches < duoB.zeroKillMatches ? 'A' : duoB.zeroKillMatches < duoA.zeroKillMatches ? 'B' : 'TIE',
        diffText: duoA.zeroKillMatches <= duoB.zeroKillMatches ? diff(duoB.zeroKillMatches, duoA.zeroKillMatches) : diff(duoA.zeroKillMatches, duoB.zeroKillMatches),
        desc: 'Frequência de partidas em que a dupla não conquistou eliminações (menor é melhor)'
      },
      {
        metric: 'SINERGIA',
        icon: <Sparkles size={15} className="text-purple-400" />,
        label: 'Índice de Sinergia',
        aValue: duoA.synergyScore,
        bValue: duoB.synergyScore,
        aDisplay: `${duoA.synergyScore}%`,
        bDisplay: `${duoB.synergyScore}%`,
        winner: duoA.synergyScore > duoB.synergyScore ? 'A' : duoB.synergyScore > duoA.synergyScore ? 'B' : 'TIE',
        diffText: duoA.synergyScore >= duoB.synergyScore ? diff(duoA.synergyScore, duoB.synergyScore) : diff(duoB.synergyScore, duoA.synergyScore),
        desc: 'Coesão tática, complementaridade de rush e peso nas eliminações do time'
      }
    ];
  }, [duoA, duoB]);

  if (!duoA) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-3xl p-8 text-center text-gray-400 text-sm">
        Nenhuma dupla de rush disponível para confronto.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Controls & Selectors Bar */}
      <div className="bg-gradient-to-r from-yellow-950/40 via-black to-blue-950/30 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-yellow-500 text-black shadow-lg shadow-yellow-500/20">
              <Swords size={22} className="fill-black" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                  Radar Comparativo de Duplas
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  KDA • Dano Médio • Sobrevivência
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-1">
                Confronto de Performance & Pontos Fortes
              </h3>
            </div>
          </div>

          {/* Toggle Benchmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBenchmark(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                showBenchmark 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                  : 'bg-black/50 text-gray-400 border-white/10 hover:border-white/20'
              }`}
            >
              <Award size={14} />
              <span>{showBenchmark ? 'Média da Liga Ativa' : 'Exibir Média da Liga'}</span>
            </button>
          </div>
        </div>

        {/* Duo Dropdown Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Duo A Selector */}
          <div className="bg-black/60 border border-yellow-500/40 rounded-2xl p-4 shadow-lg shadow-yellow-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                Dupla A (Destaque Principal)
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {duoA.combinedKills} kills em {duoA.matchesTogether} quedas
              </span>
            </div>
            <select
              value={selectedDuoAId}
              onChange={e => setSelectedDuoAId(e.target.value)}
              className="w-full bg-black/90 border border-yellow-500/30 rounded-xl px-3 py-2.5 text-xs text-yellow-300 font-black focus:outline-none focus:border-yellow-400 cursor-pointer"
            >
              {duos.map(d => (
                <option key={d.id} value={d.id}>
                  {d.teamName}: {d.player1.name} + {d.player2.name} ({d.combinedKills}K | KDA {d.kda.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Duo B Selector */}
          <div className="bg-black/60 border border-cyan-500/40 rounded-2xl p-4 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Dupla B (Confronto)
              </span>
              {duoB && (
                <span className="text-[10px] font-bold text-gray-400">
                  {duoB.combinedKills} kills em {duoB.matchesTogether} quedas
                </span>
              )}
            </div>
            <select
              value={selectedDuoBId}
              onChange={e => setSelectedDuoBId(e.target.value)}
              className="w-full bg-black/90 border border-cyan-500/30 rounded-xl px-3 py-2.5 text-xs text-cyan-300 font-black focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {duos.map(d => (
                <option key={d.id} value={d.id}>
                  {d.teamName}: {d.player1.name} + {d.player2.name} ({d.combinedKills}K | KDA {d.kda.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Duo C Optional Selector */}
          <div className="bg-black/60 border border-purple-500/40 rounded-2xl p-4 shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                Dupla C (Opcional)
              </span>
              {duoC ? (
                <button 
                  onClick={() => setSelectedDuoCId('')}
                  className="text-[9px] text-gray-400 hover:text-white font-bold underline"
                >
                  Remover
                </button>
              ) : (
                <span className="text-[10px] text-gray-500">Comparar 3ª dupla</span>
              )}
            </div>
            <select
              value={selectedDuoCId}
              onChange={e => setSelectedDuoCId(e.target.value)}
              className="w-full bg-black/90 border border-purple-500/30 rounded-xl px-3 py-2.5 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="">Nenhuma (Comparar apenas A vs B)</option>
              {duos.filter(d => d.id !== selectedDuoAId && d.id !== selectedDuoBId).map(d => (
                <option key={d.id} value={d.id}>
                  {d.teamName}: {d.player1.name} + {d.player2.name} ({d.combinedKills}K | KDA {d.kda.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart Visual (Left) + Head-to-Head KPI Comparison (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* RADAR CHART VISUAL */}
        <div className="lg:col-span-6 bg-black/70 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Target size={18} className="text-yellow-400" /> Gráfico de Radar de Competências
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Visualização das forças relativas da dupla em KDA, Dano Médio e Sobrevivência
                </p>
              </div>
            </div>

            {/* Duo Legend Pills */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-black">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/50" />
                <span>{duoA.teamName}: {duoA.player1.name} + {duoA.player2.name}</span>
              </div>
              {duoB && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                  <span>{duoB.teamName}: {duoB.player1.name} + {duoB.player2.name}</span>
                </div>
              )}
              {duoC && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <span className="w-3 h-3 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                  <span>{duoC.teamName}: {duoC.player1.name} + {duoC.player2.name}</span>
                </div>
              )}
              {showBenchmark && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-500/10 border border-gray-500/30 text-gray-400">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Média da Liga</span>
                </div>
              )}
            </div>

            {/* Radar Chart Container */}
            <div className="h-[340px] sm:h-[380px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 9 }} 
                  />
                  
                  {/* Duo A Radar */}
                  <Radar
                    name={`${duoA.teamName}: ${duoA.player1.name}+${duoA.player2.name}`}
                    dataKey="aScore"
                    stroke="#eab308"
                    fill="#eab308"
                    fillOpacity={0.45}
                    strokeWidth={2.5}
                  />

                  {/* Duo B Radar */}
                  {duoB && (
                    <Radar
                      name={`${duoB.teamName}: ${duoB.player1.name}+${duoB.player2.name}`}
                      dataKey="bScore"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.35}
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Duo C Radar */}
                  {duoC && (
                    <Radar
                      name={`${duoC.teamName}: ${duoC.player1.name}+${duoC.player2.name}`}
                      dataKey="cScore"
                      stroke="#c084fc"
                      fill="#c084fc"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  )}

                  {/* Benchmark League Average Radar */}
                  {showBenchmark && (
                    <Radar
                      name="Média da Liga"
                      dataKey="leagueScore"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.15}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-black/95 border border-white/20 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-2 min-w-[220px]">
                            <span className="font-black text-white block uppercase border-b border-white/10 pb-1 text-sm">
                              {item.fullName || item.subject}
                            </span>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-yellow-400 font-bold">
                                <span>{duoA.teamName}:</span>
                                <span>{item.aRaw} ({item.aScore} pts)</span>
                              </div>
                              {duoB && (
                                <div className="flex justify-between items-center text-cyan-400 font-bold">
                                  <span>{duoB.teamName}:</span>
                                  <span>{item.bRaw} ({item.bScore} pts)</span>
                                </div>
                              )}
                              {duoC && (
                                <div className="flex justify-between items-center text-purple-400 font-bold">
                                  <span>{duoC.teamName}:</span>
                                  <span>{item.cRaw} ({item.cScore} pts)</span>
                                </div>
                              )}
                              {showBenchmark && (
                                <div className="flex justify-between items-center text-gray-400 border-t border-white/10 pt-1 text-[11px]">
                                  <span>Média Liga:</span>
                                  <span>{item.leagueRaw}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Interpretation Subtitle */}
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-[11px] text-gray-400 flex items-center gap-2 mt-2">
            <Sparkles size={16} className="text-yellow-400 shrink-0" />
            <span>
              Quanto mais ampla a área preenchida em direção à borda externa, maior o domínio da dupla naquela métrica comparativa.
            </span>
          </div>
        </div>

        {/* HEAD-TO-HEAD STATS & STRENGTHS CONFRONTATION */}
        <div className="lg:col-span-6 space-y-4">
          {/* Dual Duo Cards Header */}
          <div className="grid grid-cols-2 gap-3">
            {/* Duo A Card */}
            <div className="bg-gradient-to-br from-yellow-950/40 via-black to-black border border-yellow-500/30 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                {duoA.teamLogo && (
                  <img src={duoA.teamLogo} alt={duoA.teamName} className="w-5 h-5 object-contain" />
                )}
                <span className="text-xs font-black uppercase text-yellow-400 truncate">{duoA.teamName}</span>
              </div>
              <h5 className="text-sm font-black text-white truncate">
                {duoA.player1.name} & {duoA.player2.name}
              </h5>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-md font-bold border border-yellow-500/20">
                  {duoA.duoTypeLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {duoA.strengths.slice(0, 2).map((s, idx) => (
                  <span key={idx} className="text-[9px] font-black uppercase bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                    ⚡ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Duo B Card */}
            {duoB && (
              <div className="bg-gradient-to-br from-cyan-950/40 via-black to-black border border-cyan-500/30 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  {duoB.teamLogo && (
                    <img src={duoB.teamLogo} alt={duoB.teamName} className="w-5 h-5 object-contain" />
                  )}
                  <span className="text-xs font-black uppercase text-cyan-400 truncate">{duoB.teamName}</span>
                </div>
                <h5 className="text-sm font-black text-white truncate">
                  {duoB.player1.name} & {duoB.player2.name}
                </h5>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                  <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md font-bold border border-cyan-500/20">
                    {duoB.duoTypeLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {duoB.strengths.slice(0, 2).map((s, idx) => (
                    <span key={idx} className="text-[9px] font-black uppercase bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                      ⚡ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Confrontation Rows (KDA, Dano, Sobrevivência, etc.) */}
          <div className="bg-black/70 border border-white/10 rounded-3xl p-4 md:p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Métricas Confrontadas
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                Vantagem Relativa (%)
              </span>
            </div>

            <div className="space-y-2.5">
              {confrontationPoints.map((row) => {
                const isAWin = row.winner === 'A';
                const isBWin = row.winner === 'B';
                const totalVal = row.aValue + row.bValue || 1;
                const aPct = Math.round((row.aValue / totalVal) * 100);
                const bPct = 100 - aPct;

                return (
                  <div 
                    key={row.metric} 
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      {/* Left: Duo A Value */}
                      <div className="flex items-center gap-1.5 w-1/3">
                        <span className={`font-black ${isAWin ? 'text-yellow-400 text-sm' : 'text-gray-400'}`}>
                          {row.aDisplay}
                        </span>
                        {isAWin && (
                          <span className="text-[9px] font-black uppercase bg-yellow-500/20 text-yellow-400 px-1.5 py-0.2 rounded border border-yellow-500/30">
                            + {row.diffText}
                          </span>
                        )}
                      </div>

                      {/* Center: Metric Label */}
                      <div className="flex items-center justify-center gap-1.5 w-1/3 text-center">
                        {row.icon}
                        <span className="font-black uppercase tracking-wider text-gray-300 text-[11px]">
                          {row.label}
                        </span>
                      </div>

                      {/* Right: Duo B Value */}
                      <div className="flex items-center justify-end gap-1.5 w-1/3 text-right">
                        {isBWin && (
                          <span className="text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-500/30">
                            + {row.diffText}
                          </span>
                        )}
                        <span className={`font-black ${isBWin ? 'text-cyan-400 text-sm' : 'text-gray-400'}`}>
                          {row.bDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Dual Proportion Bar */}
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 ${isAWin ? 'bg-yellow-400' : 'bg-yellow-500/50'}`} 
                        style={{ width: `${aPct}%` }}
                      />
                      <div 
                        className={`h-full transition-all duration-500 ${isBWin ? 'bg-cyan-400' : 'bg-cyan-500/50'}`} 
                        style={{ width: `${bPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CrosshairIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </svg>
  );
}
