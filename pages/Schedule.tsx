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

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Top Banner Header - Exactly matching the uploaded image */}
      <div className="relative bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 p-4 sm:p-6 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.3)] text-black border border-yellow-300 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center justify-center gap-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic tracking-widest font-display text-black drop-shadow-sm flex items-center gap-3">
            <Calendar size={32} className="text-black shrink-0" />
            MATRIZ DE PARTICIPAÇÃO POR RODADA
          </h1>
          <p className="text-xs sm:text-sm font-bold text-black/80 uppercase tracking-wider">
            FFWSBR 2026 - Acompanhe as rodadas ativas e folgas de cada equipe
          </p>
        </div>
      </div>

      {/* Legend & Controls Bar */}
      <div className="bg-[#121215] border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold font-display uppercase tracking-wider">
          <span className="text-gray-400 text-[10px] font-black tracking-widest mr-1">LEGENDA:</span>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <span className="text-emerald-400 font-black">JOGA</span>
            <Check size={14} className="stroke-[3]" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <span className="text-red-400 font-black">FOLGA</span>
            <X size={14} className="stroke-[3]" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400 font-black">LOUD SNICKERS</span>
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
                  return (
                    <th 
                      key={r} 
                      onClick={() => setSelectedRound(selectedRound === r ? null : r)}
                      className={`py-4 px-2 text-center cursor-pointer transition-colors hover:bg-white/5 ${
                        isLoudRestRound ? 'text-red-500 font-black scale-110' : 'text-gray-300'
                      } ${selectedRound === r ? 'bg-yellow-500/20 text-yellow-400' : ''}`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-xs ${isLoudRestRound ? 'text-red-500 font-black' : ''}`}>R{r}</span>
                        {isLoudRestRound && (
                          <span className="text-[8px] text-red-400/80 font-bold uppercase tracking-tighter">Folga LOUD</span>
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
                      const isLoudRestRound = r === 3 || r === 10;

                      return (
                        <td 
                          key={r}
                          className={`py-3 px-2 text-center transition-colors ${
                            selectedRound === r ? 'bg-yellow-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {isLoudRow ? (
                              plays ? (
                                <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-400/60 flex items-center justify-center text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
                                  <X size={16} className="stroke-[3]" />
                                </div>
                              )
                            ) : (
                              plays ? (
                                <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
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
      {selectedRound !== null && (
        <div className="bg-[#18181c] border border-yellow-500/30 rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-2 shadow-2xl">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-black uppercase italic text-white font-display flex items-center gap-2">
              <Info size={18} className="text-yellow-400" />
              Detalhamento da Rodada R{selectedRound}
            </h3>
            <button
              onClick={() => setSelectedRound(null)}
              className="text-xs text-gray-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg"
            >
              Fechar
            </button>
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
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase ${
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
      )}

    </div>
  );
};

export default Schedule;
