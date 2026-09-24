import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  Crosshair, 
  Sparkles, 
  ChevronRight, 
  User, 
  Flame, 
  Award, 
  Activity,
  ArrowUpRight,
  LineChart as LineChartIcon,
  EyeOff
} from 'lucide-react';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

interface PlayerHsHighlightCardProps {
  data: DashboardData;
  onSelectPlayerForChart: (playerName: string) => void;
  onViewPlayerProfile: (playerName: string) => void;
  onHide?: () => void;
  className?: string;
}

const normalize = (val: string | undefined | null) => (val || '').trim().toUpperCase();

const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned, 10) || 0;
};

export interface PlayerHsEvolutionSummary {
  name: string;
  team: string;
  playerImg?: string;
  teamImg?: string;
  funcao?: string;
  latestRound: string;
  prevRound: string | null;
  latestHs: number;
  latestMatches: number;
  latestAvgHs: number;
  prevHs: number;
  prevMatches: number;
  prevAvgHs: number;
  evolution: number; // latestAvgHs - prevAvgHs
  pctChange: number;
  totalHs: number;
  totalMatches: number;
  overallAvgHs: number;
}

export const PlayerHsHighlightCard: React.FC<PlayerHsHighlightCardProps> = ({
  data,
  onSelectPlayerForChart,
  onViewPlayerProfile,
  onHide,
  className = ''
}) => {
  // 1. Identificar todas as rodadas disponíveis em ordem cronológica
  const { allRounds, topEvolvers, latestRoundName, prevRoundName } = useMemo(() => {
    const roundsSet = new Set<string>();
    data.players.forEach(p => {
      if (p.RD && p.RD.trim()) roundsSet.add(p.RD.trim());
    });

    const sortedRounds = Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    if (sortedRounds.length === 0) {
      return { allRounds: [], topEvolvers: [], latestRoundName: '', prevRoundName: null };
    }

    const latestRound = sortedRounds[sortedRounds.length - 1];
    const prevRound = sortedRounds.length >= 2 ? sortedRounds[sortedRounds.length - 2] : null;

    // Agrupar estatísticas de cada jogador por rodada
    const playerStatsMap = new Map<string, {
      team: string;
      rounds: Map<string, { hs: number; matches: number; kills: number }>;
      totalHs: number;
      totalMatches: number;
    }>();

    data.players.forEach(p => {
      if (!p.PLAYER) return;
      const pName = p.PLAYER.trim();
      const rd = (p.RD || '').trim();
      const hs = parseNumber(p.HS);
      const kills = parseNumber(p.Abates);

      if (!playerStatsMap.has(pName)) {
        playerStatsMap.set(pName, {
          team: p.TIME || '',
          rounds: new Map(),
          totalHs: 0,
          totalMatches: 0
        });
      }

      const entry = playerStatsMap.get(pName)!;
      if (!entry.team && p.TIME) entry.team = p.TIME;
      entry.totalHs += hs;
      entry.totalMatches += 1;

      if (rd) {
        const rdStat = entry.rounds.get(rd) || { hs: 0, matches: 0, kills: 0 };
        rdStat.hs += hs;
        rdStat.matches += 1;
        rdStat.kills += kills;
        entry.rounds.set(rd, rdStat);
      }
    });

    // Calcular evolução de média de HS para cada jogador que disputou a última rodada
    const evolvers: PlayerHsEvolutionSummary[] = [];

    playerStatsMap.forEach((entry, name) => {
      const latestRdStat = entry.rounds.get(latestRound);
      // O jogador precisa ter jogado ao menos 1 partida na última rodada
      if (!latestRdStat || latestRdStat.matches === 0) return;

      const latestAvgHs = latestRdStat.hs / latestRdStat.matches;

      let prevHs = 0;
      let prevMatches = 0;
      let prevAvgHs = 0;

      if (prevRound && entry.rounds.has(prevRound)) {
        const prevRdStat = entry.rounds.get(prevRound)!;
        prevHs = prevRdStat.hs;
        prevMatches = prevRdStat.matches;
        prevAvgHs = prevMatches > 0 ? prevHs / prevMatches : 0;
      } else {
        // Se não jogou a rodada imediatamente anterior, calcular média de todas as rodadas antes da última
        let priorHs = 0;
        let priorMatches = 0;
        entry.rounds.forEach((stat, r) => {
          if (r !== latestRound) {
            priorHs += stat.hs;
            priorMatches += stat.matches;
          }
        });
        if (priorMatches > 0) {
          prevHs = priorHs;
          prevMatches = priorMatches;
          prevAvgHs = priorHs / priorMatches;
        }
      }

      const evolution = latestAvgHs - prevAvgHs;
      const pctChange = prevAvgHs > 0 
        ? ((latestAvgHs - prevAvgHs) / prevAvgHs) * 100 
        : (latestAvgHs > 0 ? 100 : 0);

      const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(name));

      evolvers.push({
        name,
        team: entry.team,
        playerImg: findDimImg(data.playersDimension, name),
        teamImg: findTeamLogo(entry.team, data.teamsReference),
        funcao: dim?.Funcao || 'JOGADOR',
        latestRound,
        prevRound,
        latestHs: latestRdStat.hs,
        latestMatches: latestRdStat.matches,
        latestAvgHs,
        prevHs,
        prevMatches,
        prevAvgHs,
        evolution,
        pctChange,
        totalHs: entry.totalHs,
        totalMatches: entry.totalMatches,
        overallAvgHs: entry.totalMatches > 0 ? entry.totalHs / entry.totalMatches : 0
      });
    });

    // Ordenar por maior evolução positiva na média de HS (e desempate por total de HS e média da última rodada)
    evolvers.sort((a, b) => {
      // Priorizar evolução
      if (Math.abs(b.evolution - a.evolution) > 0.001) {
        return b.evolution - a.evolution;
      }
      // Desempate por HS na última rodada
      if (b.latestHs !== a.latestHs) {
        return b.latestHs - a.latestHs;
      }
      return b.latestAvgHs - a.latestAvgHs;
    });

    return {
      allRounds: sortedRounds,
      topEvolvers: evolvers,
      latestRoundName: latestRound,
      prevRoundName: prevRound
    };
  }, [data.players, data.playersDimension, data.teamsReference]);

  const topPlayer = topEvolvers[0];
  const runnerUps = topEvolvers.slice(1, 4);

  if (!topPlayer) {
    return null;
  }

  const isEvolutionPositive = topPlayer.evolution > 0;
  const roundLabel = `RD ${latestRoundName.replace(/\D/g, '') || latestRoundName}`;
  const prevRoundLabel = prevRoundName 
    ? `RD ${prevRoundName.replace(/\D/g, '') || prevRoundName}` 
    : 'MÉDIA ANTERIOR';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#141416] to-[#0c0c0e] border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.1)] p-5 md:p-6 transition-all ${className}`}>
      {/* Background glow & accents */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                Card de Destaque
              </span>
              <span className="text-gray-600" aria-hidden="true">·</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp size={12} /> Maior Evolução de Média de HS
              </span>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Atleta com maior salto de precisão e taxa de headshot na <span className="text-white font-bold">{roundLabel}</span>
            </div>
          </div>
        </div>

        {/* Round Badge Tag & Hide Button */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg flex items-center gap-2 text-xs">
            <Crosshair size={13} className="text-amber-400" />
            <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Última Rodada:</span>
            <span className="text-white font-black">{roundLabel}</span>
          </div>

          {onHide && (
            <button
              onClick={onHide}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-lg text-xs font-bold uppercase transition-all"
              title="Ocultar Card de Destaque"
            >
              <EyeOff size={13} />
              <span>Ocultar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Player Profile & Identity (Cols 1-5) */}
        <div className="lg:col-span-5 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {/* Player Avatar */}
            {topPlayer.playerImg ? (
              <img 
                src={topPlayer.playerImg} 
                alt={topPlayer.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gray-900"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-900 border-2 border-amber-500/60 flex items-center justify-center text-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <User size={36} />
              </div>
            )}

            {/* Team Logo Badge */}
            {topPlayer.teamImg && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-black/80 border border-white/20 p-1 shadow-lg flex items-center justify-center backdrop-blur-sm">
                <img 
                  src={topPlayer.teamImg} 
                  alt={topPlayer.team} 
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Rank #1 Evolution Badge */}
            <div className="absolute -top-2 -left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md flex items-center gap-0.5">
              <Award size={10} /> #1 HS
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-amber-400">
                {topPlayer.funcao}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
                {topPlayer.team}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight font-display truncate">
              {topPlayer.name}
            </h3>

            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <span>{topPlayer.totalMatches} quedas disputadas</span>
              <span aria-hidden="true">·</span>
              <span className="text-gray-300 font-bold">{topPlayer.totalHs} HS no campeonato</span>
            </div>
          </div>
        </div>

        {/* Evolution Metrics Highlight (Cols 6-8) */}
        <div className="lg:col-span-4 bg-black/30 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              SALTO NA MÉDIA DE HS
            </span>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp size={12} />
              {isEvolutionPositive ? `+${topPlayer.pctChange.toFixed(0)}%` : `${topPlayer.pctChange.toFixed(0)}%`}
            </div>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-3xl md:text-4xl font-black tracking-tight leading-none ${isEvolutionPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isEvolutionPositive ? `+${topPlayer.evolution.toFixed(2)}` : topPlayer.evolution.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              HS / Queda
            </span>
          </div>

          {/* Comparison Grid: Previous Round vs Last Round */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
            <div className="bg-white/5 p-2 rounded-lg">
              <div className="text-[9px] font-bold text-gray-500 uppercase truncate">
                {prevRoundLabel}
              </div>
              <div className="text-sm font-black text-gray-300">
                {topPlayer.prevAvgHs.toFixed(2)} <span className="text-[9px] text-gray-500 font-normal">HS/Q</span>
              </div>
              <div className="text-[9px] text-gray-500 truncate">
                {topPlayer.prevHs} HS em {topPlayer.prevMatches}Q
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <div className="text-[9px] font-black text-emerald-400 uppercase truncate flex items-center justify-between">
                <span>{roundLabel}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-sm font-black text-emerald-300">
                {topPlayer.latestAvgHs.toFixed(2)} <span className="text-[9px] text-emerald-400 font-normal">HS/Q</span>
              </div>
              <div className="text-[9px] text-emerald-400/80 truncate">
                {topPlayer.latestHs} HS em {topPlayer.latestMatches}Q
              </div>
            </div>
          </div>
        </div>

        {/* Action CTAs (Cols 9-12) */}
        <div className="lg:col-span-3 flex flex-col justify-center gap-2.5">
          <button
            onClick={() => onSelectPlayerForChart(topPlayer.name)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LineChartIcon size={15} />
            <span>Ver Gráfico de Evolução</span>
          </button>

          <button
            onClick={() => onViewPlayerProfile(topPlayer.name)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold uppercase text-xs tracking-wider border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <User size={14} />
            <span>Ver Perfil Individual</span>
          </button>
        </div>
      </div>

      {/* Runner-ups preview bar if available */}
      {runnerUps.length > 0 && (
        <div className="relative z-10 mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
            <span>Outros Destaques na Rodada:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {runnerUps.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => onSelectPlayerForChart(p.name)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 text-gray-300 hover:text-white text-xs transition-all group"
              >
                <span className="text-[10px] font-black text-amber-500">#{idx + 2}</span>
                <span className="font-bold uppercase">{p.name}</span>
                <span className="text-gray-500 text-[10px] font-medium">({p.team})</span>
                <span className={`text-[10px] font-black ${p.evolution > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {p.evolution > 0 ? `+${p.evolution.toFixed(2)}` : p.evolution.toFixed(2)}
                </span>
                <ChevronRight size={12} className="text-gray-600 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerHsHighlightCard;
