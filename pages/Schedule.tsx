import React, { useState } from 'react';
import { DashboardData } from '../types';
import { Calendar, Check, X, Star, Filter, Info, Shield, Trophy, Flame } from 'lucide-react';
import { findTeamLogo } from '../utils/teamUtils';

interface ScheduleProps {
  data: DashboardData;
}

interface TeamSchedule {
  name: string;
  isLoud?: boolean;
  rounds: { [key: number]: boolean }; // true = plays, false = rests
}

// Complete 14 Round Schedule Matrix from official image
const OFFICIAL_SCHEDULE: TeamSchedule[] = [
  {
    name: 'Sx Gaming',
    rounds: { 1: false, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: false }
  },
  {
    name: 'INTZ',
    rounds: { 1: false, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: false, 14: true }
  },
  {
    name: 'Civis',
    rounds: { 1: true, 2: false, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: false, 11: true, 12: true, 13: true, 14: true }
  },
  {
    name: 'CPT Vox',
    rounds: { 1: true, 2: false, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: false, 12: true, 13: true, 14: true }
  },
  {
    name: 'Rush Gaming',
    rounds: { 1: true, 2: true, 3: false, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: false, 14: true }
  },
  {
    name: 'Loud Snickers',
    isLoud: true,
    rounds: { 1: true, 2: true, 3: false, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: false, 11: true, 12: true, 13: true, 14: true }
  },
  {
    name: 'AfroGames',
    rounds: { 1: true, 2: true, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: false, 12: true, 13: true, 14: true }
  },
  {
    name: 'LOS',
    rounds: { 1: true, 2: true, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: false }
  },
  {
    name: 'Alpha7',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: false, 13: true, 14: true }
  },
  {
    name: 'Team Solid (TS)',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: false, 6: true, 7: true, 8: true, 9: false, 10: true, 11: true, 12: true, 13: true, 14: true }
  },
  {
    name: 'Loops',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 7: true, 8: true, 9: true, 10: true, 11: true, 12: false, 13: true, 14: true }
  },
  {
    name: 'Fluxo W7M (FX)',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false, 7: true, 8: false, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true }
  },
  {
    name: 'Influence Rage',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: false, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true }
  },
  {
    name: 'Rise Gaming',
    rounds: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 8: true, 9: false, 10: true, 11: true, 12: true, 13: true, 14: true }
  }
];

const Schedule: React.FC<ScheduleProps> = ({ data }) => {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [loudOnly, setLoudOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const roundsList = Array.from({ length: 14 }, (_, i) => i + 1);

  // Compute round status strictly from fDetalhes (data.details)
  const fDetailsRoundStats = React.useMemo(() => {
    const stats = new Map<number, { recordsCount: number; quedas: Set<string>; isComplete: boolean; isStarted: boolean }>();
    for (let r = 1; r <= 14; r++) {
      stats.set(r, { recordsCount: 0, quedas: new Set<string>(), isComplete: false, isStarted: false });
    }

    if (data.details && Array.isArray(data.details)) {
      data.details.forEach(d => {
        if (!d || !d.RD) return;
        const num = parseInt(String(d.RD).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num >= 1 && num <= 14) {
          const item = stats.get(num)!;
          item.recordsCount += 1;
          item.isStarted = true;
          if (d.Q) {
            const qClean = String(d.Q).trim();
            if (qClean) item.quedas.add(qClean);
          }
        }
      });
    }

    // A round is complete if 6 or more quedas are registered in fDetalhes
    stats.forEach((val) => {
      val.isComplete = val.quedas.size >= 6;
    });

    return stats;
  }, [data.details]);

  // Derived round counts from fDetalhes
  const playedRounds = React.useMemo(() => {
    const set = new Set<number>();
    fDetailsRoundStats.forEach((val, r) => {
      if (val.isComplete) set.add(r);
    });
    return set;
  }, [fDetailsRoundStats]);

  const startedRounds = React.useMemo(() => {
    const set = new Set<number>();
    fDetailsRoundStats.forEach((val, r) => {
      if (val.isStarted) set.add(r);
    });
    return set;
  }, [fDetailsRoundStats]);

  // Next round is strictly the first round (1 to 14) that is NOT complete in fDetalhes.
  // If no rounds are filled or completed yet, this returns 1 (Rodada 1).
  const detectedNextRound = React.useMemo(() => {
    for (let r = 1; r <= 14; r++) {
      if (!fDetailsRoundStats.get(r)?.isComplete) {
        return r;
      }
    }
    return 14; // If all 14 rounds are completely finished
  }, [fDetailsRoundStats]);

  // Allow manual selection/override for next round if needed
  const [forcedNextRound, setForcedNextRound] = useState<number | null>(null);
  const nextRound = forcedNextRound !== null ? forcedNextRound : detectedNextRound;

  const completedCount = playedRounds.size;
  const remainingCount = 14 - completedCount;

  const upcomingRounds = React.useMemo(() => {
    return roundsList.filter(r => !playedRounds.has(r));
  }, [playedRounds]);

  // Helper to find team logo
  const getTeamLogo = (teamName: string) => {
    return findTeamLogo(teamName, data.teamsReference);
  };

  // Filter teams based on search and loudOnly
  const filteredTeams = OFFICIAL_SCHEDULE.filter(t => {
    if (loudOnly && !t.isLoud) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const tName = t.name.toLowerCase();
      const matchesSearch = tName.includes(q) ||
        (q === 'ts' && tName.includes('solid')) ||
        (q === 'fx' && (tName.includes('fluxo') || tName.includes('w7m')));
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Calculate rested teams per round
  const getRestedTeamsInRound = (r: number) => {
    return OFFICIAL_SCHEDULE.filter(t => !t.rounds[r]).map(t => t.name);
  };

  const getPlayingTeamsInRound = (r: number) => {
    return OFFICIAL_SCHEDULE.filter(t => t.rounds[r]).map(t => t.name);
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="relative bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 p-4 sm:p-6 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.3)] text-black border border-yellow-300 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic tracking-widest font-display text-black drop-shadow-sm flex items-center gap-3">
            <Calendar size={32} className="text-black shrink-0" />
            MATRIZ DE PARTICIPAÇÃO POR RODADA
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 uppercase tracking-wider">
            FFWSBR 2026 SPLIT 2 • Coluna <strong className="text-black underline">RD</strong> da planilha fDetalhes = Rodada (R1 a R14)
          </p>
        </div>
      </div>

      {/* Progress & Remaining Rounds Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Rounds */}
        <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1">
              <Check size={12} className="stroke-[3]" /> Concluídas
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">
              {((completedCount / 14) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black italic text-white font-display">
              {completedCount}
            </span>
            <span className="text-sm font-bold text-gray-500 uppercase">/ 14 Rodadas</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            {completedCount > 0 ? `${completedCount} rodadas jogadas com dados em tempo real.` : 'Aguardando encerramento da 1ª rodada.'}
          </p>
        </div>

        {/* Card 2: Remaining Rounds (FALTAM) */}
        <div className="bg-[#121215] border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/70 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
              <Flame size={12} /> Faltam
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {remainingCount} RESTANTES
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black italic text-amber-400 font-display">
              {remainingCount}
            </span>
            <span className="text-sm font-bold text-gray-400 uppercase">Rodadas Faltantes</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            Falta disputar {remainingCount} rodadas para a definição da fase.
          </p>
        </div>

        {/* Card 3: Next Round Highlight */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-2 border-yellow-500/60 rounded-2xl p-5 shadow-[0_0_25px_rgba(234,179,8,0.2)] relative overflow-hidden group hover:border-yellow-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300 bg-yellow-500/30 px-2.5 py-1 rounded-md border border-yellow-400/50 flex items-center gap-1 animate-pulse">
                <Star size={12} className="fill-yellow-300" /> Próxima Rodada
              </span>
              <button
                onClick={() => setSelectedRound(nextRound)}
                className="text-[10px] font-black text-black bg-yellow-400 hover:bg-yellow-300 px-2 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer"
              >
                Ver R{nextRound}
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black italic text-yellow-300 font-display">
                RODADA {nextRound}
              </span>
              {nextRound === 1 && (
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded uppercase">
                  Início
                </span>
              )}
            </div>
            <p className="text-[11px] text-yellow-200/90 mt-1 font-medium truncate">
              Folgam na R{nextRound}: <span className="font-bold text-white">{getRestedTeamsInRound(nextRound).join(', ')}</span>
            </p>
          </div>

          {/* Quick Round Switcher for Tournament Start vs Detected CSV */}
          <div className="mt-3 pt-2 border-t border-yellow-500/20 flex items-center justify-between gap-1 text-[10px]">
            <span className="text-gray-400 font-bold uppercase">Definir Próxima:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setForcedNextRound(1)}
                className={`px-2 py-0.5 rounded font-black uppercase transition-all cursor-pointer ${
                  nextRound === 1 
                    ? 'bg-yellow-400 text-black border border-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                    : 'bg-black/60 text-gray-400 hover:text-white border border-gray-700'
                }`}
                title="Forçar Rodada 1 como a próxima"
              >
                R1 (Início)
              </button>
              {detectedNextRound !== 1 && (
                <button
                  onClick={() => setForcedNextRound(null)}
                  className={`px-2 py-0.5 rounded font-black uppercase transition-all cursor-pointer ${
                    forcedNextRound === null 
                      ? 'bg-yellow-400 text-black border border-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.5)]' 
                      : 'bg-black/60 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                  title={`Usar detecção da planilha fDetalhes (R${detectedNextRound})`}
                >
                  R{detectedNextRound} (fDetalhes)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming List Quick Jump */}
        <div className="bg-[#121215] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <Trophy size={12} className="text-yellow-400" /> Próximas Rodadas
            </span>
            <span className="text-[10px] text-gray-500 font-mono">14 No Total</span>
          </div>
          <div className="flex flex-wrap gap-1.5 my-1">
            {roundsList.map(r => {
              const isDone = playedRounds.has(r);
              const isNext = r === nextRound;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRound(r)}
                  className={`px-2 py-1 rounded text-[10px] font-black transition-all ${
                    isNext
                      ? 'bg-yellow-400 text-black border border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-110 z-10'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-black/50 text-gray-400 border border-gray-800 hover:border-yellow-500/50 hover:text-white'
                  }`}
                  title={isNext ? `Próxima Rodada (R${r})` : isDone ? `R${r} Concluída` : `R${r} Faltante`}
                >
                  R{r}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-gray-500 mt-1">Clique em qualquer rodada para filtrar detalhes.</span>
        </div>
      </div>

      {/* Dedicated "Próximas Rodadas em Destaque" Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Flame size={22} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/40">
                DESTAQUE DE CALENDÁRIO
              </span>
              <span className="text-xs text-gray-300 font-bold">
                {remainingCount > 0 ? `${remainingCount} rodadas restantes no torneio` : 'Todas as 14 rodadas concluídas!'}
              </span>
            </div>
            <h3 className="text-base font-black uppercase italic text-white font-display mt-0.5">
              {remainingCount > 0 ? `Próximas Rodadas a Disputar: ${upcomingRounds.map(r => `R${r}`).slice(0, 5).join(', ')}${upcomingRounds.length > 5 ? '...' : ''}` : 'Fase de Classificação Concluída'}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filtrar Rodada:</span>
          <button
            onClick={() => setSelectedRound(nextRound)}
            className="px-3.5 py-1.5 bg-yellow-500 text-black font-black text-xs uppercase rounded-xl border border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Star size={13} className="fill-black" />
            Focar Próxima (R{nextRound})
          </button>
          {selectedRound !== null && (
            <button
              onClick={() => setSelectedRound(null)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs uppercase rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Ver Todas
            </button>
          )}
        </div>
      </div>

      {/* Legend & Controls Bar */}
      <div className="bg-[#121215] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-bold font-display uppercase tracking-wider">
          <span className="text-gray-400 text-[10px] font-black tracking-widest mr-1">LEGENDA:</span>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <span className="text-emerald-400 font-black">JOGA</span>
            <Check size={14} className="stroke-[3]" />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <span className="text-red-400 font-black">FOLGA</span>
            <X size={14} className="stroke-[3]" />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400 font-black">LOUD</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/50 rounded-xl text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-300 font-black">CONCLUÍDA</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-400 text-black font-black rounded-xl border border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.4)]">
            <span>PRÓXIMA</span>
          </div>
        </div>

        {/* Action Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar time..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-black/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 w-full sm:w-48"
          />

          <button
            onClick={() => setLoudOnly(!loudOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
              loudOnly 
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            <Star size={14} className={loudOnly ? 'fill-black' : 'fill-yellow-400'} />
            Ver Apenas LOUD
          </button>
        </div>
      </div>

      {/* LOUD Highlight Banner Card */}
      <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-transparent border-2 border-yellow-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-yellow-500/10 pointer-events-none">
          <Flame size={180} />
        </div>

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl p-1 shadow-lg shrink-0 flex items-center justify-center border border-yellow-300">
            <img 
              src={getTeamLogo('Loud Snickers') || "https://i.ibb.co/d04qyJhF/image.png"} 
              alt="LOUD" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest rounded-md">
                ★ TIME DESTAQUE LOUD
              </span>
              <span className="text-xs text-yellow-400 font-bold">12 Jogadas • 2 Folgas</span>
            </div>
            <h3 className="text-lg font-black uppercase italic text-white font-display mt-0.5">
              Agenda de Jogos da LOUD SNICKERS
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              A LOUD folga apenas nas rodadas <strong className="text-red-400">R3</strong> e <strong className="text-red-400">R10</strong>. Em todas as outras 12 rodadas a LOUD entra em campo!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 self-stretch md:self-auto justify-end">
          <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Folgas LOUD</span>
            <span className="text-sm font-black text-red-400 font-mono">R3 &amp; R10</span>
          </div>
          <div className="bg-black/60 px-4 py-2.5 rounded-xl border border-gray-800 text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Aproveitamento</span>
            <span className="text-sm font-black text-yellow-400 font-mono">85.7%</span>
          </div>
        </div>
      </div>

      {/* Main Participation Matrix Table */}
      <div className="bg-[#121215] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#18181c] border-b border-gray-800 text-xs font-black uppercase tracking-wider text-gray-400">
                <th className="py-4 px-4 sticky left-0 bg-[#18181c] z-20 min-w-[180px] shadow-r">
                  Equipe / Time
                </th>
                {roundsList.map(r => {
                  const isLoudRestRound = r === 3 || r === 10;
                  const isCompleted = playedRounds.has(r);
                  const isNext = r === nextRound;
                  const isSelected = selectedRound === r;

                  return (
                    <th 
                      key={r} 
                      onClick={() => setSelectedRound(isSelected ? null : r)}
                      className={`py-3 px-2 text-center cursor-pointer transition-all hover:bg-white/5 relative ${
                        isNext
                          ? 'bg-gradient-to-b from-yellow-500/30 to-amber-500/10 text-yellow-300 font-black border-x border-yellow-500/50 shadow-[inset_0_0_15px_rgba(234,179,8,0.2)]'
                          : isCompleted
                          ? 'bg-emerald-500/5 text-emerald-400 border-x border-emerald-500/10'
                          : isLoudRestRound
                          ? 'text-red-500 font-black'
                          : 'text-gray-300'
                      } ${isSelected ? 'ring-2 ring-yellow-400 z-10' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {/* Round status badge */}
                        {isNext ? (
                          <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-[8px] font-black rounded uppercase tracking-tighter shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse">
                            PRÓXIMA
                          </span>
                        ) : isCompleted ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[8px] font-bold rounded uppercase tracking-tighter flex items-center gap-0.5">
                            <Check size={9} className="stroke-[3]" /> OK
                          </span>
                        ) : (
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">
                            FALTA
                          </span>
                        )}

                        <span className={`text-xs font-display font-black ${isNext ? 'text-yellow-300 scale-110' : isLoudRestRound ? 'text-red-400' : ''}`}>
                          R{r}
                        </span>
                        <span className="text-[8px] text-gray-500 font-mono font-bold">
                          RD {r}
                        </span>

                        {isLoudRestRound && (
                          <span className="text-[8px] text-red-400/90 font-bold uppercase tracking-tighter">Folga LOUD</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/60 text-xs font-medium">
              {filteredTeams.map((team, idx) => {
                const isLoudRow = team.isLoud;
                const logo = getTeamLogo(team.name);

                return (
                  <tr 
                    key={team.name}
                    className={`transition-all duration-200 ${
                      isLoudRow 
                        ? 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/5 hover:from-yellow-500/30 border-y-2 border-yellow-500/60 font-bold shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                        : idx % 2 === 0 ? 'bg-[#121215] hover:bg-white/[0.02]' : 'bg-[#151519] hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Team Name + Logo sticky column */}
                    <td className={`py-3.5 px-4 sticky left-0 z-10 flex items-center gap-3 ${
                      isLoudRow ? 'bg-[#221c08] border-r border-yellow-500/40' : 'bg-[#121215] border-r border-gray-800'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg p-0.5 flex items-center justify-center shrink-0 border ${
                        isLoudRow ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/50 border-gray-800'
                      }`}>
                        {logo ? (
                          <img src={logo} alt={team.name} className="w-full h-full object-contain" />
                        ) : (
                          <Shield size={16} className={isLoudRow ? 'text-yellow-400' : 'text-gray-500'} />
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className={`font-black font-display uppercase tracking-wide flex items-center gap-1.5 ${
                          isLoudRow ? 'text-yellow-400 text-sm drop-shadow' : 'text-white'
                        }`}>
                          {team.name}
                          {isLoudRow && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                        </span>
                        {isLoudRow && (
                          <span className="text-[9px] text-yellow-400/80 font-bold uppercase tracking-wider">★ Time Destaque</span>
                        )}
                      </div>
                    </td>

                    {/* Round Status Cells */}
                    {roundsList.map(r => {
                      const plays = team.rounds[r];
                      const isNext = r === nextRound;
                      const isCompleted = playedRounds.has(r);
                      const isSelected = selectedRound === r;

                      return (
                        <td 
                          key={r}
                          className={`py-3 px-2 text-center transition-colors ${
                            isNext ? 'bg-yellow-500/10 border-x border-yellow-500/20' : isSelected ? 'bg-yellow-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {isLoudRow ? (
                              plays ? (
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  isNext 
                                    ? 'bg-yellow-400 text-black border border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.6)] scale-110' 
                                    : 'bg-yellow-500/20 border border-yellow-400/60 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                }`}>
                                  <Star size={14} className={isNext ? "fill-black text-black" : "fill-yellow-400 text-yellow-400"} />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
                                  <X size={16} className="stroke-[3]" />
                                </div>
                              )
                            ) : (
                              plays ? (
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                  isNext
                                    ? 'bg-yellow-400/20 border border-yellow-400 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.3)] font-bold'
                                    : isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400/80'
                                }`}>
                                  <Check size={14} className="stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center">
                                  <X size={14} className="stroke-[3]" />
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Round Details Modal/Card */}
      {selectedRound !== null && (() => {
        const rStat = fDetailsRoundStats.get(selectedRound);
        const quedasArray = Array.from(rStat?.quedas || []).sort();

        return (
          <div className="bg-[#18181c] border-2 border-yellow-500/50 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-2 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black uppercase italic text-white font-display flex items-center gap-2">
                  <Info size={18} className="text-yellow-400" />
                  Detalhamento da Rodada R{selectedRound}
                </h3>
                {selectedRound === nextRound && (
                  <span className="px-2.5 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-md shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                    ★ PRÓXIMA RODADA
                  </span>
                )}
                {rStat?.isComplete && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold rounded-md">
                    ✓ RODADA CONCLUÍDA
                  </span>
                )}
                {rStat?.isStarted && !rStat?.isComplete && (
                  <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-bold rounded-md animate-pulse">
                    ⚡ EM ANDAMENTO
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedRound(null)}
                className="text-xs text-gray-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>

            {/* fDetalhes Spreadsheet Status Bar for selected round */}
            <div className="bg-black/60 p-4 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Status na Planilha fDetalhes</span>
                <span className={`text-sm font-black uppercase font-display flex items-center gap-1.5 ${rStat?.isComplete ? 'text-emerald-400' : rStat?.isStarted ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {rStat?.isComplete ? '✓ Concluída (6 Quedas Processadas)' : rStat?.isStarted ? `⚡ Em Andamento (${rStat.quedas.size}/6 Quedas Preenchidas)` : '⏳ Aguardando Preenchimento na fDetalhes'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Linhas na fDetalhes</span>
                <span className="text-sm font-black text-white font-mono">{rStat?.recordsCount || 0} registros</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">Quedas Detectadas</span>
                <span className="text-sm font-bold text-yellow-400">
                  {quedasArray.length > 0 ? quedasArray.join(', ') : 'Nenhuma queda registrada'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#0f0f12] p-4 rounded-xl border border-emerald-500/20 space-y-2">
                <span className="font-black text-emerald-400 uppercase tracking-wider block">
                  ✓ 12 Times que Jogam na R{selectedRound}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {OFFICIAL_SCHEDULE.filter(t => t.rounds[selectedRound]).map(t => (
                    <span 
                      key={t.name}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase flex items-center gap-1.5 ${
                        t.isLoud 
                          ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-black' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      {t.name} {t.isLoud && '★'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f0f12] p-4 rounded-xl border border-red-500/20 space-y-2">
                <span className="font-black text-red-400 uppercase tracking-wider block">
                  ✕ 2 Times que Folgam na R{selectedRound}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {getRestedTeamsInRound(selectedRound).map(name => (
                    <span 
                      key={name}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase ${
                        name.toLowerCase().includes('loud')
                          ? 'bg-red-500/20 border-red-500 text-red-300 font-black'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {name} {name.toLowerCase().includes('loud') && '(FOLGA LOUD)'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Schedule;
