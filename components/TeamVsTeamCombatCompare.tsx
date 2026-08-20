import React, { useState } from 'react';
import { Swords, Crown, Skull, User, Shield, ChevronDown, ChevronUp, Crosshair, Flame, ShieldAlert, Target } from 'lucide-react';

export interface CombatTeamEntry {
  name: string;
  count: number;
  img?: string;
  grupo?: string;
}

export interface CombatPlayerEntry {
  name: string;
  count: number;
  team?: string;
  img?: string;
  teamImg?: string;
}

export interface TeamVsTeamCombatCompareProps {
  teamA: string;
  teamB: string;
  combatData: {
    teamA: {
      name: string;
      totalKillsMade: number;
      totalDeathsSuffered: number;
      kdRatio: string;
      victimTeams: CombatTeamEntry[];
      killerTeams: CombatTeamEntry[];
      victimPlayers: CombatPlayerEntry[];
      killerPlayers: CombatPlayerEntry[];
      killerWeapons?: Array<{ name: string; count: number; img?: string }>;
      victimWeapons?: Array<{ name: string; count: number; img?: string }>;
    };
    teamB: {
      name: string;
      totalKillsMade: number;
      totalDeathsSuffered: number;
      kdRatio: string;
      victimTeams: CombatTeamEntry[];
      killerTeams: CombatTeamEntry[];
      victimPlayers: CombatPlayerEntry[];
      killerPlayers: CombatPlayerEntry[];
      killerWeapons?: Array<{ name: string; count: number; img?: string }>;
      victimWeapons?: Array<{ name: string; count: number; img?: string }>;
    };
    headToHead: {
      teamAKillsTeamB: number;
      teamBKillsTeamA: number;
      totalDirectDuels: number;
      teamAWinRate: string;
      teamBWinRate: string;
      directEvents: any[];
    };
  };
  onPlayerClick?: (playerName: string) => void;
  onTeamClick?: (teamName: string) => void;
}

export const TeamVsTeamCombatCompare: React.FC<TeamVsTeamCombatCompareProps> = ({
  teamA,
  teamB,
  combatData,
  onPlayerClick,
  onTeamClick
}) => {
  const [showAllDirectEvents, setShowAllDirectEvents] = useState(false);
  const [showAllVictimTeams, setShowAllVictimTeams] = useState(false);
  const [showAllKillerTeams, setShowAllKillerTeams] = useState(false);
  const [showAllVictimPlayers, setShowAllVictimPlayers] = useState(false);
  const [showAllKillerPlayers, setShowAllKillerPlayers] = useState(false);
  const [showAllKillerWeapons, setShowAllKillerWeapons] = useState(false);
  const [showAllVictimWeapons, setShowAllVictimWeapons] = useState(false);

  const [showSection1, setShowSection1] = useState(true);
  const [showSection2, setShowSection2] = useState(true);
  const [showSection3, setShowSection3] = useState(true);
  const [showSection4, setShowSection4] = useState(true);
  const [showWeaponsSection, setShowWeaponsSection] = useState(true);

  if (!combatData) return null;

  const { teamA: tA, teamB: tB, headToHead: h2h } = combatData;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* CONFRONTO DIRETO HEAD-TO-HEAD (TIME A VS TIME B) */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <Swords size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em]">
                Confronto Direto Head-to-Head
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Eliminações mútuas diretas entre {teamA} e {teamB}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10 text-gray-300">
            {h2h.totalDirectDuels} abates diretos
          </span>
        </div>

        {/* Placar de Duelo Direto */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Team A */}
          <div className="bg-black/40 p-5 rounded-2xl border border-yellow-500/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest block mb-1">
                EQUIPE A
              </span>
              <span className="text-lg font-black text-white uppercase italic truncate block max-w-[140px]">
                {teamA}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                Taxa de Vitória: <span className="text-yellow-500 font-black">{h2h.teamAWinRate}%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-yellow-500 italic block leading-none">
                {h2h.teamAKillsTeamB}
              </span>
              <span className="text-[8px] text-gray-500 font-bold uppercase">abates em {teamB}</span>
            </div>
          </div>

          {/* VS Center Indicator with Dual Bar */}
          <div className="space-y-3 text-center">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider px-1">
              <span className="text-yellow-500">{h2h.teamAWinRate}%</span>
              <span className="text-gray-500 font-black italic">DOMINÂNCIA DIRETA</span>
              <span className="text-blue-400">{h2h.teamBWinRate}%</span>
            </div>
            <div className="h-3 w-full bg-black rounded-full overflow-hidden flex border border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                style={{ width: `${h2h.totalDirectDuels > 0 ? (h2h.teamAKillsTeamB / h2h.totalDirectDuels) * 100 : 50}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                style={{ width: `${h2h.totalDirectDuels > 0 ? (h2h.teamBKillsTeamA / h2h.totalDirectDuels) * 100 : 50}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
              {h2h.teamAKillsTeamB > h2h.teamBKillsTeamA
                ? `🔥 ${teamA} leva vantagem no duelo (+${h2h.teamAKillsTeamB - h2h.teamBKillsTeamA})`
                : h2h.teamBKillsTeamA > h2h.teamAKillsTeamB
                ? `🔥 ${teamB} leva vantagem no duelo (+${h2h.teamBKillsTeamA - h2h.teamAKillsTeamB})`
                : '⚖️ Duelo equilibrado entre as equipes'}
            </span>
          </div>

          {/* Team B */}
          <div className="bg-black/40 p-5 rounded-2xl border border-blue-500/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest block mb-1">
                EQUIPE B
              </span>
              <span className="text-lg font-black text-white uppercase italic truncate block max-w-[140px]">
                {teamB}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                Taxa de Vitória: <span className="text-blue-400 font-black">{h2h.teamBWinRate}%</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-400 italic block leading-none">
                {h2h.teamBKillsTeamA}
              </span>
              <span className="text-[8px] text-gray-500 font-bold uppercase">abates em {teamA}</span>
            </div>
          </div>
        </div>

        {/* Log de Abates Diretos */}
        {h2h.directEvents && h2h.directEvents.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                Feed de Abates do Duelo ({h2h.directEvents.length} eventos)
              </span>
              <button
                onClick={() => setShowAllDirectEvents(prev => !prev)}
                className="text-[10px] font-black text-yellow-500 hover:text-yellow-400 flex items-center gap-1 uppercase transition-colors"
              >
                {showAllDirectEvents ? 'Exibir Menos' : 'Ver Todos'}
                {showAllDirectEvents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {(showAllDirectEvents ? h2h.directEvents : h2h.directEvents.slice(0, 6)).map((ev: any, idx: number) => {
                const isAKiller = ev.isTeamAKiller;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      isAKiller
                        ? 'bg-yellow-500/5 border-yellow-500/20'
                        : 'bg-blue-500/5 border-blue-500/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-black truncate">
                        <span className={isAKiller ? 'text-yellow-400' : 'text-blue-400'}>
                          {ev.PLAYER}
                        </span>
                        <span className="text-gray-500 font-normal text-[10px]">⚔️</span>
                        <span className={isAKiller ? 'text-blue-400' : 'text-yellow-400'}>
                          {ev.VITIMA}
                        </span>
                      </div>
                      <span className="text-[8px] text-gray-500 font-bold block">
                        RD {ev.RD || '-'} • Q{ev.Q || '-'} • {ev.MAPA || 'Mapa'} {ev.SAFE ? `• Safe ${ev.SAFE}` : ''}
                      </span>
                    </div>
                    {ev.ARMA && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/60 text-gray-300 font-black uppercase flex-shrink-0 border border-white/5">
                        {ev.ARMA}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: TIMES QUE MAIS MORREM (PRESAS FAVORITAS) */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-teal-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Times que Mais Morrem (Presas Favoritas)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Equipes que cada time mais abateu no campeonato
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllVictimTeams(prev => !prev)}
              className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase transition-colors"
            >
              {showAllVictimTeams ? 'Exibir Top 5' : 'Ver Todos os Times'}
              {showAllVictimTeams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowSection1(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection1 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showSection1 && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Times Vítimas de Team A */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                  <Shield size={14} /> {teamA} — Presas Favoritas
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tA.victimTeams?.length || 0} times abatidos
                </span>
              </div>
              <div className="space-y-2.5">
                {tA.victimTeams && tA.victimTeams.length > 0 ? (
                  (showAllVictimTeams ? tA.victimTeams : tA.victimTeams.slice(0, 5)).map((t, idx) => {
                    const maxCount = tA.victimTeams[0]?.count || 1;
                    const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onTeamClick && onTeamClick(t.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-yellow-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {t.img ? (
                              <img src={t.img} alt={t.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shield size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-yellow-400 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-yellow-500 italic block leading-none">
                              {t.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>

            {/* Times Vítimas de Team B */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                  <Shield size={14} /> {teamB} — Presas Favoritas
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tB.victimTeams?.length || 0} times abatidos
                </span>
              </div>
              <div className="space-y-2.5">
                {tB.victimTeams && tB.victimTeams.length > 0 ? (
                  (showAllVictimTeams ? tB.victimTeams : tB.victimTeams.slice(0, 5)).map((t, idx) => {
                    const maxCount = tB.victimTeams[0]?.count || 1;
                    const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onTeamClick && onTeamClick(t.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-blue-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {t.img ? (
                              <img src={t.img} alt={t.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shield size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-blue-400 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-blue-400 italic block leading-none">
                              {t.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: TIMES QUE MAIS MATAM (EQUIPES ALGOZES) */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-red-500/10 via-black/40 to-rose-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <Skull size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Times que Mais Matam (Equipes Algozes)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Equipes que mais abateram jogadores de cada time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllKillerTeams(prev => !prev)}
              className="text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 uppercase transition-colors"
            >
              {showAllKillerTeams ? 'Exibir Top 5' : 'Ver Todos os Times'}
              {showAllKillerTeams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowSection2(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection2 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection2 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showSection2 && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Times Algozes de Team A */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" /> Algozes de {teamA}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tA.killerTeams?.length || 0} times algozes
                </span>
              </div>
              <div className="space-y-2.5">
                {tA.killerTeams && tA.killerTeams.length > 0 ? (
                  (showAllKillerTeams ? tA.killerTeams : tA.killerTeams.slice(0, 5)).map((t, idx) => {
                    const maxCount = tA.killerTeams[0]?.count || 1;
                    const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onTeamClick && onTeamClick(t.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-red-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {t.img ? (
                              <img src={t.img} alt={t.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shield size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-red-400 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-red-500 italic block leading-none">
                              {t.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>

            {/* Times Algozes de Team B */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" /> Algozes de {teamB}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tB.killerTeams?.length || 0} times algozes
                </span>
              </div>
              <div className="space-y-2.5">
                {tB.killerTeams && tB.killerTeams.length > 0 ? (
                  (showAllKillerTeams ? tB.killerTeams : tB.killerTeams.slice(0, 5)).map((t, idx) => {
                    const maxCount = tB.killerTeams[0]?.count || 1;
                    const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onTeamClick && onTeamClick(t.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-red-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {t.img ? (
                              <img src={t.img} alt={t.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Shield size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-red-400 transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-red-500 italic block leading-none">
                              {t.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 3: JOGADORES QUE MAIS MORREM (VÍTIMAS FREQUENTES) */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500/10 via-black/40 to-yellow-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Jogadores que Mais Morrem (Vítimas Frequentes)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Jogadores individuais que cada time mais eliminou
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllVictimPlayers(prev => !prev)}
              className="text-[10px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase transition-colors"
            >
              {showAllVictimPlayers ? 'Exibir Top 5' : 'Ver Todos os Jogadores'}
              {showAllVictimPlayers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowSection3(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection3 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection3 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showSection3 && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Jogadores Vítimas de Team A */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                  <User size={14} /> Vítimas Favoritas de {teamA}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tA.victimPlayers?.length || 0} jogadores abatidos
                </span>
              </div>
              <div className="space-y-2.5">
                {tA.victimPlayers && tA.victimPlayers.length > 0 ? (
                  (showAllVictimPlayers ? tA.victimPlayers : tA.victimPlayers.slice(0, 5)).map((p, idx) => {
                    const maxCount = tA.victimPlayers[0]?.count || 1;
                    const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-yellow-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-black/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.img ? (
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-yellow-400 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">
                              {p.team || 'Sem Equipe'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-yellow-500 italic block leading-none">
                              {p.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>

            {/* Jogadores Vítimas de Team B */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                  <User size={14} /> Vítimas Favoritas de {teamB}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tB.victimPlayers?.length || 0} jogadores abatidos
                </span>
              </div>
              <div className="space-y-2.5">
                {tB.victimPlayers && tB.victimPlayers.length > 0 ? (
                  (showAllVictimPlayers ? tB.victimPlayers : tB.victimPlayers.slice(0, 5)).map((p, idx) => {
                    const maxCount = tB.victimPlayers[0]?.count || 1;
                    const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-blue-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-black/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.img ? (
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-blue-400 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">
                              {p.team || 'Sem Equipe'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-blue-400 italic block leading-none">
                              {p.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 4: JOGADORES QUE MAIS MATAM (MAIORES ALGOZES) */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-rose-500/10 via-black/40 to-red-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <Crosshair size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Jogadores que Mais Matam (Maiores Algozes)
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Jogadores individuais que mais abateram atletas de cada time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAllKillerPlayers(prev => !prev)}
              className="text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase transition-colors"
            >
              {showAllKillerPlayers ? 'Exibir Top 5' : 'Ver Todos os Jogadores'}
              {showAllKillerPlayers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowSection4(prev => !prev)}
              className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
            >
              {showSection4 ? 'Ocultar Seção' : 'Mostrar Seção'}
              {showSection4 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showSection4 && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Jogadores Algozes de Team A */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                  <User size={14} className="text-rose-500" /> Maiores Algozes de {teamA}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tA.killerPlayers?.length || 0} jogadores algozes
                </span>
              </div>
              <div className="space-y-2.5">
                {tA.killerPlayers && tA.killerPlayers.length > 0 ? (
                  (showAllKillerPlayers ? tA.killerPlayers : tA.killerPlayers.slice(0, 5)).map((p, idx) => {
                    const maxCount = tA.killerPlayers[0]?.count || 1;
                    const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-rose-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-black/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.img ? (
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-rose-400 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">
                              {p.team || 'Sem Equipe'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-rose-500 italic block leading-none">
                              {p.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>

            {/* Jogadores Algozes de Team B */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                  <User size={14} className="text-rose-500" /> Maiores Algozes de {teamB}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {tB.killerPlayers?.length || 0} jogadores algozes
                </span>
              </div>
              <div className="space-y-2.5">
                {tB.killerPlayers && tB.killerPlayers.length > 0 ? (
                  (showAllKillerPlayers ? tB.killerPlayers : tB.killerPlayers.slice(0, 5)).map((p, idx) => {
                    const maxCount = tB.killerPlayers[0]?.count || 1;
                    const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                    return (
                      <div
                        key={idx}
                        onClick={() => onPlayerClick && onPlayerClick(p.name)}
                        className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-rose-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full bg-black/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.img ? (
                              <img src={p.img} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-white uppercase italic truncate block group-hover:text-rose-400 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">
                              {p.team || 'Sem Equipe'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-right min-w-[48px]">
                            <span className="text-sm font-black text-rose-500 italic block leading-none">
                              {p.count}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO X: ANÁLISE DE ARMAS */}
      {/* ========================================================================= */}
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-6 md:p-8 shadow-2xl overflow-hidden mt-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <Crosshair size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em]">
                Análise de Armas
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Desempenho de armamentos pelas equipes
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowWeaponsSection(prev => !prev)}
            className="text-[10px] font-black text-gray-400 hover:text-white flex items-center gap-1 uppercase transition-colors px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
          >
            {showWeaponsSection ? 'Ocultar Seção' : 'Mostrar Seção'}
            {showWeaponsSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showWeaponsSection && (
          <div className="grid grid-cols-1 gap-8">
            {/* Armas Favoritas (Mais Matam pela Equipe) */}
            <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-yellow-500/10 via-black/40 to-amber-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                      Armas que a Equipe Mais Usa para Matar
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Armas mais utilizadas por cada equipe para eliminar adversários
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllKillerWeapons(prev => !prev)}
                  className="text-[10px] font-black text-yellow-400 hover:text-yellow-300 flex items-center gap-1 uppercase transition-colors"
                >
                  {showAllKillerWeapons ? 'Exibir Top 5' : 'Ver Todas'}
                  {showAllKillerWeapons ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team A Killer Weapons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <Crosshair size={14} /> {teamA}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{tA.killerWeapons?.length || 0} armas</span>
                  </div>
                  <div className="space-y-2.5">
                    {tA.killerWeapons && tA.killerWeapons.length > 0 ? (
                      (showAllKillerWeapons ? tA.killerWeapons : tA.killerWeapons.slice(0, 5)).map((w: any, idx: number) => {
                        const max = tA.killerWeapons![0]?.count || 1;
                        const pct = Math.min(100, Math.round((w.count / max) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                              <div className="w-10 h-8 rounded-lg bg-black/80 border border-yellow-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                {w.img ? (
                                  <img src={w.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Crosshair size={14} className="text-yellow-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-black text-white uppercase italic tracking-wide truncate block">{w.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma da Equipe</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className="w-16 sm:w-20 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[40px]">
                                <span className="text-sm font-black text-yellow-500 italic block leading-none">{w.count}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado</div>
                    )}
                  </div>
                </div>

                {/* Team B Killer Weapons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <Crosshair size={14} /> {teamB}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{tB.killerWeapons?.length || 0} armas</span>
                  </div>
                  <div className="space-y-2.5">
                    {tB.killerWeapons && tB.killerWeapons.length > 0 ? (
                      (showAllKillerWeapons ? tB.killerWeapons : tB.killerWeapons.slice(0, 5)).map((w: any, idx: number) => {
                        const max = tB.killerWeapons![0]?.count || 1;
                        const pct = Math.min(100, Math.round((w.count / max) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                              <div className="w-10 h-8 rounded-lg bg-black/80 border border-blue-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                {w.img ? (
                                  <img src={w.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Crosshair size={14} className="text-blue-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-black text-white uppercase italic tracking-wide truncate block">{w.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma da Equipe</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className="w-16 sm:w-20 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[40px]">
                                <span className="text-sm font-black text-blue-400 italic block leading-none">{w.count}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Armas Algozes (Mais Causam Mortes à Equipe) */}
            <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-rose-500/10 via-black/40 to-red-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <Skull size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                      Armas Algozes (Mais Causam Mortes à Equipe)
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Armas responsáveis pelo maior número de eliminações sofridas por cada equipe
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllVictimWeapons(prev => !prev)}
                  className="text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase transition-colors"
                >
                  {showAllVictimWeapons ? 'Exibir Top 5' : 'Ver Todas'}
                  {showAllVictimWeapons ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team A Victim Weapons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <Skull size={14} className="text-rose-500" /> {teamA}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{tA.victimWeapons?.length || 0} armas</span>
                  </div>
                  <div className="space-y-2.5">
                    {tA.victimWeapons && tA.victimWeapons.length > 0 ? (
                      (showAllVictimWeapons ? tA.victimWeapons : tA.victimWeapons.slice(0, 5)).map((w: any, idx: number) => {
                        const max = tA.victimWeapons![0]?.count || 1;
                        const pct = Math.min(100, Math.round((w.count / max) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                              <div className="w-10 h-8 rounded-lg bg-black/80 border border-rose-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                {w.img ? (
                                  <img src={w.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Skull size={14} className="text-rose-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-black text-white uppercase italic tracking-wide truncate block">{w.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma Letal Contra</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className="w-16 sm:w-20 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[40px]">
                                <span className="text-sm font-black text-rose-500 italic block leading-none">{w.count}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado</div>
                    )}
                  </div>
                </div>

                {/* Team B Victim Weapons */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <Skull size={14} className="text-rose-500" /> {teamB}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{tB.victimWeapons?.length || 0} armas</span>
                  </div>
                  <div className="space-y-2.5">
                    {tB.victimWeapons && tB.victimWeapons.length > 0 ? (
                      (showAllVictimWeapons ? tB.victimWeapons : tB.victimWeapons.slice(0, 5)).map((w: any, idx: number) => {
                        const max = tB.victimWeapons![0]?.count || 1;
                        const pct = Math.min(100, Math.round((w.count / max) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                              <div className="w-10 h-8 rounded-lg bg-black/80 border border-rose-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                {w.img ? (
                                  <img src={w.img} alt={w.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Skull size={14} className="text-rose-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-black text-white uppercase italic tracking-wide truncate block">{w.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma Letal Contra</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className="w-16 sm:w-20 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[40px]">
                                <span className="text-sm font-black text-rose-500 italic block leading-none">{w.count}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
