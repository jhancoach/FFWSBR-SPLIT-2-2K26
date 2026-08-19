import React, { useState, useMemo } from 'react';
import { 
  Crosshair, 
  MapPin, 
  Flame, 
  ShieldAlert, 
  Skull, 
  Swords, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Target,
  Sparkles,
  Zap,
  Shield,
  Layers,
  Map as MapIcon
} from 'lucide-react';

export interface SafeKillPhaseData {
  safeKey: string;
  safeLabel: string;
  phaseGroup: 'early' | 'mid' | 'late' | 'other';
  teamAKills: number;
  teamAPct: number;
  teamADeaths: number;
  teamAKd: string;
  teamBKills: number;
  teamBPct: number;
  teamBDeaths: number;
  teamBKd: string;
  directDuelsA: number;
  directDuelsB: number;
  topKillerA?: { name: string; kills: number; img?: string };
  topKillerB?: { name: string; kills: number; img?: string };
  topWeaponA?: { name: string; count: number };
  topWeaponB?: { name: string; count: number };
}

export interface MapSafeKillData {
  mapName: string;
  mapImg?: string | null;
  teamATotalKills: number;
  teamBTotalKills: number;
  safes: SafeKillPhaseData[];
  peakSafeA?: string;
  peakSafeB?: string;
}

export interface TeamVsTeamSafeKillsCompareProps {
  teamA: string;
  teamB: string;
  safeKillsData: {
    totalKillsA: number;
    totalKillsB: number;
    totalDeathsA: number;
    totalDeathsB: number;
    phases: SafeKillPhaseData[];
    gamePhases: {
      early: { teamAKills: number; teamAPct: number; teamBKills: number; teamBPct: number; duelsA: number; duelsB: number };
      mid: { teamAKills: number; teamAPct: number; teamBKills: number; teamBPct: number; duelsA: number; duelsB: number };
      late: { teamAKills: number; teamAPct: number; teamBKills: number; teamBPct: number; duelsA: number; duelsB: number };
    };
    mapBreakdown: MapSafeKillData[];
    directSafeDuels: Array<{
      player: string;
      victim: string;
      weapon?: string;
      mapa?: string;
      safe: string;
      rd?: string;
      q?: string;
      isTeamAKiller: boolean;
    }>;
  };
  onPlayerClick?: (playerName: string) => void;
  onTeamClick?: (teamName: string) => void;
}

export const TeamVsTeamSafeKillsCompare: React.FC<TeamVsTeamSafeKillsCompareProps> = ({
  teamA,
  teamB,
  safeKillsData,
  onPlayerClick,
  onTeamClick
}) => {
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('ALL');
  const [selectedSafeFilter, setSelectedSafeFilter] = useState<string>('ALL');
  const [expandedSafe, setExpandedSafe] = useState<string | null>(null);
  const [showAllDuels, setShowAllDuels] = useState<boolean>(false);

  const { totalKillsA, totalKillsB, totalDeathsA, totalDeathsB, phases, gamePhases, mapBreakdown, directSafeDuels } = safeKillsData;

  // Filtered direct duels by safe
  const filteredDuels = useMemo(() => {
    return directSafeDuels.filter(d => {
      if (selectedSafeFilter !== 'ALL' && d.safe !== selectedSafeFilter) return false;
      if (selectedMapFilter !== 'ALL' && d.mapa?.toUpperCase() !== selectedMapFilter.toUpperCase()) return false;
      return true;
    });
  }, [directSafeDuels, selectedSafeFilter, selectedMapFilter]);

  // Determine peak lethality phase
  const peakPhaseA = useMemo(() => {
    return [...phases].sort((a, b) => b.teamAKills - a.teamAKills)[0];
  }, [phases]);

  const peakPhaseB = useMemo(() => {
    return [...phases].sort((a, b) => b.teamBKills - a.teamBKills)[0];
  }, [phases]);

  // Overall Direct Duels in Safes count
  const totalDirectDuelsInSafes = directSafeDuels.length;
  const directWinsA = directSafeDuels.filter(d => d.isTeamAKiller).length;
  const directWinsB = directSafeDuels.filter(d => !d.isTeamAKiller).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: ABATES POR SAFE DO KILL FEED */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
              <Crosshair size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em] flex items-center gap-2">
                Abates por Safe do Kill Feed
                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-black border border-red-500/30">
                  EVENTOS DO FEED
                </span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Distribuição de abates, letalidade por fase e duelos diretos em cada safe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-black/60 rounded-full border border-white/10 text-gray-300">
              {totalKillsA + totalKillsB} abates combinados
            </span>
          </div>
        </div>

        {/* Top KPI Cards Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Team A Card */}
          <div className="bg-black/50 p-5 rounded-2xl border border-yellow-500/20 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest block mb-1">
                  EQUIPE A
                </span>
                <span className="text-xl font-black text-white uppercase italic truncate block max-w-[170px]">
                  {teamA}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">
                  K/D Geral no Feed: <strong className="text-yellow-400">{totalDeathsA > 0 ? (totalKillsA / totalDeathsA).toFixed(2) : totalKillsA}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-yellow-500 italic block leading-none">
                  {totalKillsA}
                </span>
                <span className="text-[8px] text-gray-500 font-bold uppercase">abates totais</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Flame size={12} className="text-yellow-500" /> Safe Mais Letal:
              </span>
              <span className="text-yellow-400 font-black uppercase">
                {peakPhaseA ? `${peakPhaseA.safeLabel} (${peakPhaseA.teamAKills} k / ${peakPhaseA.teamAPct}%)` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Center Duel Progress Card */}
          <div className="bg-black/60 p-5 rounded-2xl border border-white/10 flex flex-col justify-center space-y-3 text-center">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider px-1">
              <span className="text-yellow-500 font-black">{totalKillsA} KILLS ({totalKillsA + totalKillsB > 0 ? ((totalKillsA / (totalKillsA + totalKillsB)) * 100).toFixed(0) : 50}%)</span>
              <span className="text-gray-400 font-black italic flex items-center gap-1"><Zap size={11} className="text-orange-400" /> LETALIDADE TOTAL</span>
              <span className="text-blue-400 font-black">{totalKillsB} KILLS ({totalKillsA + totalKillsB > 0 ? ((totalKillsB / (totalKillsA + totalKillsB)) * 100).toFixed(0) : 50}%)</span>
            </div>
            
            <div className="h-3 w-full bg-black rounded-full overflow-hidden flex border border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                style={{ width: `${totalKillsA + totalKillsB > 0 ? (totalKillsA / (totalKillsA + totalKillsB)) * 100 : 50}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                style={{ width: `${totalKillsA + totalKillsB > 0 ? (totalKillsB / (totalKillsA + totalKillsB)) * 100 : 50}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 pt-1">
              <span>Duelos no Feed: <strong className="text-white">{totalDirectDuelsInSafes}</strong></span>
              <span className="text-yellow-400 font-black">{teamA} {directWinsA} x {directWinsB} {teamB}</span>
            </div>
          </div>

          {/* Team B Card */}
          <div className="bg-black/50 p-5 rounded-2xl border border-blue-500/20 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest block mb-1">
                  EQUIPE B
                </span>
                <span className="text-xl font-black text-white uppercase italic truncate block max-w-[170px]">
                  {teamB}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">
                  K/D Geral no Feed: <strong className="text-blue-400">{totalDeathsB > 0 ? (totalKillsB / totalDeathsB).toFixed(2) : totalKillsB}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-blue-400 italic block leading-none">
                  {totalKillsB}
                </span>
                <span className="text-[8px] text-gray-500 font-bold uppercase">abates totais</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Flame size={12} className="text-blue-400" /> Safe Mais Letal:
              </span>
              <span className="text-blue-400 font-black uppercase">
                {peakPhaseB ? `${peakPhaseB.safeLabel} (${peakPhaseB.teamBKills} k / ${peakPhaseB.teamBPct}%)` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GAME PHASES: EARLY vs MID vs LATE GAME AGGRESSION PROFILING */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
              Ritmo de Jogo: Early, Mid & Late Game
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Análise temporal de agressão e abates por estágio da partida
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Early Game (Safe 1 - 2) */}
          <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <h4 className="text-xs font-black text-white uppercase italic tracking-wider">Early Game</h4>
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase">Safes 1 e 2</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="text-left">
                  <span className="text-[9px] text-yellow-500 font-bold block">{teamA}</span>
                  <span className="text-lg font-black text-yellow-400">{gamePhases.early.teamAKills} <small className="text-[10px] text-gray-400">({gamePhases.early.teamAPct}%)</small></span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-blue-400 font-bold block">{teamB}</span>
                  <span className="text-lg font-black text-blue-400">{gamePhases.early.teamBKills} <small className="text-[10px] text-gray-400">({gamePhases.early.teamBPct}%)</small></span>
                </div>
              </div>

              <div className="h-2 w-full bg-black rounded-full overflow-hidden flex border border-white/5">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.early.teamAKills + gamePhases.early.teamBKills) > 0 ? (gamePhases.early.teamAKills / (gamePhases.early.teamAKills + gamePhases.early.teamBKills)) * 100 : 50}%` }}
                />
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.early.teamAKills + gamePhases.early.teamBKills) > 0 ? (gamePhases.early.teamBKills / (gamePhases.early.teamAKills + gamePhases.early.teamBKills)) * 100 : 50}%` }}
                />
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[9px] text-gray-400 font-bold flex justify-between">
                <span>Duelo no Early Game:</span>
                <span className="text-white font-black">{gamePhases.early.duelsA} x {gamePhases.early.duelsB}</span>
              </div>
            </div>
          </div>

          {/* Mid Game (Safe 3 - 4) */}
          <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                <h4 className="text-xs font-black text-white uppercase italic tracking-wider">Mid Game</h4>
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase">Safes 3 e 4</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="text-left">
                  <span className="text-[9px] text-yellow-500 font-bold block">{teamA}</span>
                  <span className="text-lg font-black text-yellow-400">{gamePhases.mid.teamAKills} <small className="text-[10px] text-gray-400">({gamePhases.mid.teamAPct}%)</small></span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-blue-400 font-bold block">{teamB}</span>
                  <span className="text-lg font-black text-blue-400">{gamePhases.mid.teamBKills} <small className="text-[10px] text-gray-400">({gamePhases.mid.teamBPct}%)</small></span>
                </div>
              </div>

              <div className="h-2 w-full bg-black rounded-full overflow-hidden flex border border-white/5">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.mid.teamAKills + gamePhases.mid.teamBKills) > 0 ? (gamePhases.mid.teamAKills / (gamePhases.mid.teamAKills + gamePhases.mid.teamBKills)) * 100 : 50}%` }}
                />
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.mid.teamAKills + gamePhases.mid.teamBKills) > 0 ? (gamePhases.mid.teamBKills / (gamePhases.mid.teamAKills + gamePhases.mid.teamBKills)) * 100 : 50}%` }}
                />
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[9px] text-gray-400 font-bold flex justify-between">
                <span>Duelo no Mid Game:</span>
                <span className="text-white font-black">{gamePhases.mid.duelsA} x {gamePhases.mid.duelsB}</span>
              </div>
            </div>
          </div>

          {/* Late Game (Safe 5 - 7+) */}
          <div className="bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <h4 className="text-xs font-black text-white uppercase italic tracking-wider">Late Game / Endgame</h4>
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase">Safes 5, 6, 7+</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <div className="text-left">
                  <span className="text-[9px] text-yellow-500 font-bold block">{teamA}</span>
                  <span className="text-lg font-black text-yellow-400">{gamePhases.late.teamAKills} <small className="text-[10px] text-gray-400">({gamePhases.late.teamAPct}%)</small></span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-blue-400 font-bold block">{teamB}</span>
                  <span className="text-lg font-black text-blue-400">{gamePhases.late.teamBKills} <small className="text-[10px] text-gray-400">({gamePhases.late.teamBPct}%)</small></span>
                </div>
              </div>

              <div className="h-2 w-full bg-black rounded-full overflow-hidden flex border border-white/5">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.late.teamAKills + gamePhases.late.teamBKills) > 0 ? (gamePhases.late.teamAKills / (gamePhases.late.teamAKills + gamePhases.late.teamBKills)) * 100 : 50}%` }}
                />
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${(gamePhases.late.teamAKills + gamePhases.late.teamBKills) > 0 ? (gamePhases.late.teamBKills / (gamePhases.late.teamAKills + gamePhases.late.teamBKills)) * 100 : 50}%` }}
                />
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[9px] text-gray-400 font-bold flex justify-between">
                <span>Duelo no Late Game:</span>
                <span className="text-white font-black">{gamePhases.late.duelsA} x {gamePhases.late.duelsB}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DETALHAMENTO FASE A FASE (SAFE 1 A SAFE 7) COM COMPARATIVO HEAD-TO-HEAD */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-red-500/10 via-black/40 to-blue-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Comparativo Fase a Fase (Safe 1 a Safe 7)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Abates, mortes, K/D, MVPs e duelos diretos em cada safe
              </p>
            </div>
          </div>

          <span className="text-[10px] text-gray-400 font-bold uppercase bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            {phases.length} fases registradas
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-4">
          {phases.map((p) => {
            const isExpanded = expandedSafe === p.safeKey;
            const totalPhKills = p.teamAKills + p.teamBKills;
            const isDominantA = p.teamAKills > p.teamBKills;
            const isDominantB = p.teamBKills > p.teamAKills;

            return (
              <div 
                key={p.safeKey} 
                className={`bg-black/40 rounded-2xl border transition-all ${
                  isExpanded ? 'border-yellow-500/40 bg-black/60 shadow-xl' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Main Row */}
                <div 
                  onClick={() => setExpandedSafe(isExpanded ? null : p.safeKey)}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer"
                >
                  {/* Left: Team A Stats */}
                  <div className="flex items-center gap-4 w-full lg:w-5/12 justify-between lg:justify-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 font-black text-xs shrink-0">
                        {p.teamAKills}
                      </div>
                      <div>
                        <span className="text-xs font-black text-white uppercase italic block truncate max-w-[130px]">
                          {teamA}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold">
                          <span>{p.teamAPct}% do time</span>
                          <span>•</span>
                          <span>K/D: <strong className="text-yellow-400">{p.teamAKd}</strong></span>
                        </div>
                      </div>
                    </div>

                    {p.topKillerA && (
                      <div className="hidden sm:flex items-center gap-2 bg-yellow-500/5 px-2.5 py-1 rounded-xl border border-yellow-500/10">
                        <User size={12} className="text-yellow-500" />
                        <span className="text-[10px] font-bold text-gray-300 truncate max-w-[90px]">{p.topKillerA.name}</span>
                        <span className="text-[10px] font-black text-yellow-400">({p.topKillerA.kills}k)</span>
                      </div>
                    )}
                  </div>

                  {/* Center: Safe Badge & Ratio Bar */}
                  <div className="w-full lg:w-2/12 flex flex-col items-center justify-center space-y-1.5 py-2 lg:py-0 border-y lg:border-y-0 border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-white tracking-wider border border-white/10">
                        {p.safeLabel}
                      </span>
                    </div>

                    <div className="w-full max-w-[140px] h-2 bg-black rounded-full overflow-hidden flex border border-white/10">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${totalPhKills > 0 ? (p.teamAKills / totalPhKills) * 100 : 50}%` }}
                      />
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${totalPhKills > 0 ? (p.teamBKills / totalPhKills) * 100 : 50}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[8px] text-gray-500 font-bold uppercase">
                      <span className={isDominantA ? 'text-yellow-500 font-black' : ''}>{p.teamAKills}</span>
                      <span>vs</span>
                      <span className={isDominantB ? 'text-blue-400 font-black' : ''}>{p.teamBKills}</span>
                    </div>
                  </div>

                  {/* Right: Team B Stats */}
                  <div className="flex items-center gap-4 w-full lg:w-5/12 justify-between lg:justify-end">
                    {p.topKillerB && (
                      <div className="hidden sm:flex items-center gap-2 bg-blue-500/5 px-2.5 py-1 rounded-xl border border-blue-500/10">
                        <User size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-gray-300 truncate max-w-[90px]">{p.topKillerB.name}</span>
                        <span className="text-[10px] font-black text-blue-400">({p.topKillerB.kills}k)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-xs font-black text-white uppercase italic block truncate max-w-[130px]">
                          {teamB}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold justify-end">
                          <span>K/D: <strong className="text-blue-400">{p.teamBKd}</strong></span>
                          <span>•</span>
                          <span>{p.teamBPct}% do time</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                        {p.teamBKills}
                      </div>
                    </div>

                    <div className="text-gray-600 pl-2">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in fade-in duration-200">
                    {/* Team A Deep Dive */}
                    <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10 space-y-2">
                      <span className="text-[9px] text-yellow-500 font-black uppercase tracking-wider block">
                        Destaques em {p.safeLabel} ({teamA})
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Abates Conquistados:</span>
                          <span className="text-white font-black">{p.teamAKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mortes Sofridas:</span>
                          <span className="text-red-400 font-black">{p.teamADeaths}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Arma Favorita:</span>
                          <span className="text-yellow-400 font-black">{p.topWeaponA ? `${p.topWeaponA.name} (${p.topWeaponA.count}x)` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MVP da Safe:</span>
                          <span className="text-yellow-400 font-black">{p.topKillerA ? `${p.topKillerA.name} (${p.topKillerA.kills}k)` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Duel in this safe */}
                    <div className="bg-black/60 p-4 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center space-y-2">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                        Duelo Direto em {p.safeLabel}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-yellow-500">{p.directDuelsA}</span>
                        <span className="text-xs text-gray-500 font-black">VS</span>
                        <span className="text-xl font-black text-blue-400">{p.directDuelsB}</span>
                      </div>
                      <span className="text-[9px] text-gray-400">
                        {p.directDuelsA > p.directDuelsB 
                          ? `🔥 ${teamA} levou vantagem nesta safe (+${p.directDuelsA - p.directDuelsB})`
                          : p.directDuelsB > p.directDuelsA
                          ? `🔥 ${teamB} levou vantagem nesta safe (+${p.directDuelsB - p.directDuelsA})`
                          : p.directDuelsA > 0 ? '⚖️ Empate nos confrontos desta safe' : 'Nenhum combate direto registrado nesta safe'}
                      </span>
                    </div>

                    {/* Team B Deep Dive */}
                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 space-y-2">
                      <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider block">
                        Destaques em {p.safeLabel} ({teamB})
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Abates Conquistados:</span>
                          <span className="text-white font-black">{p.teamBKills}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mortes Sofridas:</span>
                          <span className="text-red-400 font-black">{p.teamBDeaths}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Arma Favorita:</span>
                          <span className="text-blue-400 font-black">{p.topWeaponB ? `${p.topWeaponB.name} (${p.topWeaponB.count}x)` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MVP da Safe:</span>
                          <span className="text-blue-400 font-black">{p.topKillerB ? `${p.topKillerB.name} (${p.topKillerB.kills}k)` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAP-BY-MAP SAFE KILL PROGRESSION */}
      {/* ========================================================================= */}
      {mapBreakdown.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500">
                <MapIcon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                  Abates por Safe em Cada Território (Mapa)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Comparativo de letalidade nas safes mapa por mapa
                </p>
              </div>
            </div>

            {/* Map Filter Selector */}
            <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setSelectedMapFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  selectedMapFilter === 'ALL' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Todos os Mapas
              </button>
              {mapBreakdown.map(m => (
                <button
                  key={m.mapName}
                  onClick={() => setSelectedMapFilter(m.mapName)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    selectedMapFilter.toUpperCase() === m.mapName.toUpperCase() ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m.mapName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mapBreakdown
              .filter(m => selectedMapFilter === 'ALL' || m.mapName.toUpperCase() === selectedMapFilter.toUpperCase())
              .map((m) => (
                <div key={m.mapName} className="bg-black/40 rounded-2xl border border-white/5 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <MapPin size={16} className="text-orange-400" />
                      <h4 className="text-sm font-black text-white uppercase italic tracking-wider">{m.mapName}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-yellow-400 font-black">{m.teamATotalKills} k</span>
                      <span className="text-gray-600 font-bold">vs</span>
                      <span className="text-blue-400 font-black">{m.teamBTotalKills} k</span>
                    </div>
                  </div>

                  {/* Safes Breakdown on this map */}
                  <div className="space-y-2.5">
                    {m.safes.map(s => {
                      const tot = s.teamAKills + s.teamBKills;
                      return (
                        <div key={s.safeKey} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="text-yellow-400">{s.teamAKills} k ({teamA})</span>
                            <span className="text-gray-400 font-bold">{s.safeLabel}</span>
                            <span className="text-blue-400">{s.teamBKills} k ({teamB})</span>
                          </div>
                          <div className="h-1.5 bg-black rounded-full overflow-hidden flex border border-white/5">
                            <div 
                              className="h-full bg-yellow-500" 
                              style={{ width: `${tot > 0 ? (s.teamAKills / tot) * 100 : 50}%` }}
                            />
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${tot > 0 ? (s.teamBKills / tot) * 100 : 50}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DIRECT SAFE DUELS LOG (HEAD-TO-HEAD NO FEED) */}
      {/* ========================================================================= */}
      {directSafeDuels.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                <Swords size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                  Feed de Duelos Diretos por Safe ({filteredDuels.length} confrontos)
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Eliminações mútuas diretas entre {teamA} e {teamB} filtradas por safe
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAllDuels(prev => !prev)}
              className="text-[10px] font-black text-yellow-500 hover:text-yellow-400 flex items-center gap-1 uppercase transition-colors"
            >
              {showAllDuels ? 'Exibir Menos' : 'Ver Todos os Duelos'}
              {showAllDuels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(showAllDuels ? filteredDuels : filteredDuels.slice(0, 9)).map((ev, idx) => {
              const isAKiller = ev.isTeamAKiller;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                    isAKiller
                      ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                      : 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-black truncate">
                      <span 
                        onClick={() => onPlayerClick && onPlayerClick(ev.player)}
                        className={`cursor-pointer hover:underline ${isAKiller ? 'text-yellow-400' : 'text-blue-400'}`}
                      >
                        {ev.player}
                      </span>
                      <span className="text-gray-500 font-normal text-[10px]">⚔️</span>
                      <span 
                        onClick={() => onPlayerClick && onPlayerClick(ev.victim)}
                        className={`cursor-pointer hover:underline ${isAKiller ? 'text-blue-400' : 'text-yellow-400'}`}
                      >
                        {ev.victim}
                      </span>
                    </div>
                    <span className="text-[8px] text-gray-500 font-bold block mt-0.5">
                      RD {ev.rd || '-'} • Q{ev.q || '-'} • {ev.mapa || 'Mapa'}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-black text-yellow-500 border border-yellow-500/30 font-black uppercase">
                      {ev.safe}
                    </span>
                    {ev.weapon && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400 font-bold uppercase border border-white/5">
                        {ev.weapon}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
