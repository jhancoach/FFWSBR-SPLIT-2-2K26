import React, { useState } from 'react';
import { 
  User, Swords, Zap, Skull, Crown, Flame, Target, 
  Shield, Crosshair, Sparkles, ChevronDown, ChevronUp, AlertCircle, 
  TrendingUp, Award, Activity, Users, ShieldAlert, HeartCrack, Trophy
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

interface PlayerVsPlayerCompareProps {
  comparePlayers: {
    p1: string;
    p1Hab: string;
    p2: string;
    p2Hab: string;
  };
  setComparePlayers: React.Dispatch<React.SetStateAction<{
    p1: string;
    p1Hab: string;
    p2: string;
    p2Hab: string;
  }>>;
  compareData: {
    p1: any;
    p2: any;
    headToHead?: {
      p1KillsP2: number;
      p2KillsP1: number;
      totalDuels: number;
      p1WinRate: string;
      p2WinRate: string;
      events: Array<any>;
    } | null;
  };
  allPlayersList: Array<{ name: string; img?: string; team?: string }>;
  activeHabs: string[];
}

export const PlayerVsPlayerCompare: React.FC<PlayerVsPlayerCompareProps> = ({
  comparePlayers,
  setComparePlayers,
  compareData,
  allPlayersList = [],
  activeHabs = []
}) => {
  const { p1, p2, headToHead } = compareData || {};
  const [showAllH2HEvents, setShowAllH2HEvents] = useState(false);
  const [showAllVictimTeams, setShowAllVictimTeams] = useState(false);
  const [showAllKillerTeams, setShowAllKillerTeams] = useState(false);
  const [showAllVictimPlayers, setShowAllVictimPlayers] = useState(false);
  const [showAllKillerPlayers, setShowAllKillerPlayers] = useState(false);

  // Radar data
  const radarData = p1 && p2 ? [
    {
      subject: 'Abates',
      Jogador1: Math.min(100, (p1.kills / (p1.matches || 1)) * 30),
      Jogador2: Math.min(100, (p2.kills / (p2.matches || 1)) * 30),
      fullMark: 100
    },
    {
      subject: 'Dano',
      Jogador1: Math.min(100, (p1.damage / (p1.matches || 1)) / 10),
      Jogador2: Math.min(100, (p2.damage / (p2.matches || 1)) / 10),
      fullMark: 100
    },
    {
      subject: 'K/D Ratio',
      Jogador1: Math.min(100, parseFloat(p1.kd || '0') * 20),
      Jogador2: Math.min(100, parseFloat(p2.kd || '0') * 20),
      fullMark: 100
    },
    {
      subject: 'Deitados',
      Jogador1: Math.min(100, (p1.knocks / (p1.matches || 1)) * 30),
      Jogador2: Math.min(100, (p2.knocks / (p2.matches || 1)) * 30),
      fullMark: 100
    },
    {
      subject: 'Constância',
      Jogador1: Math.min(100, parseFloat(p1.withKillsPct || '0')),
      Jogador2: Math.min(100, parseFloat(p2.withKillsPct || '0')),
      fullMark: 100
    },
    {
      subject: 'Gelos & Util',
      Jogador1: Math.min(100, (p1.gelos / (p1.matches || 1)) * 15),
      Jogador2: Math.min(100, (p2.gelos / (p2.matches || 1)) * 15),
      fullMark: 100
    }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SELETORES: Desafiante 1 vs Desafiante 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seleção Jogador 1 */}
        <div id="p1-selector-card" className="bg-[#1a1a1a] rounded-3xl border border-yellow-500/30 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <User size={14} /> DESAFIANTE 1 (JOGADOR 1)
            </label>
            <select 
              id="select-p1-player"
              value={comparePlayers.p1} 
              onChange={(e) => setComparePlayers(prev => ({...prev, p1: e.target.value}))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all mb-3 text-sm"
            >
              <option value="">Selecione um jogador...</option>
              {(allPlayersList || []).map(p => (
                <option key={p.name} value={p.name}>{p.name} {p.team ? `(${p.team})` : ''}</option>
              ))}
            </select>
            <select 
              id="select-p1-hab"
              value={comparePlayers.p1Hab} 
              onChange={(e) => setComparePlayers(prev => ({...prev, p1Hab: e.target.value}))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-yellow-500 outline-none transition-all text-xs"
            >
              <option value="All">Com Qualquer Personagem / Habilidade</option>
              {(activeHabs || []).map(h => <option key={h} value={h}>Com {h}</option>)}
            </select>
          </div>

          {p1 && (
            <div className="mt-8 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-yellow-500/40 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)] mb-4 bg-black flex-shrink-0">
                  {p1.playerImg ? (
                    <img src={p1.playerImg} className="w-full h-full object-cover" alt={p1.name} referrerPolicy="no-referrer" />
                  ) : p1.teamImg ? (
                    <img src={p1.teamImg} className="w-full h-full object-contain p-2" alt={p1.team} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={48} /></div>
                  )}
                </div>
                {p1.teamImg && (
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-black/90 border-2 border-yellow-500/40 p-1 shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={p1.teamImg} alt={p1.team} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">{p1.name}</h4>
              <span className="text-xs font-black text-yellow-500 uppercase tracking-widest mt-1">{p1.team}</span>

              {/* Badge de Personagem do Jogador 1 */}
              <div className="w-full mt-4 bg-black/50 p-3 rounded-2xl border border-yellow-500/20 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {p1.activeHabImg ? (
                    <img src={p1.activeHabImg} alt="Personagem" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Zap size={22} className="text-yellow-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500">
                      {comparePlayers.p1Hab !== 'All' ? 'Personagem Filtrado' : 'Personagem Principal (Main)'}
                    </span>
                    {comparePlayers.p1Hab === 'All' && p1.topCharacter && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-black">
                        {p1.topCharacter.pickRate}% uso
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-white uppercase italic truncate">
                    {comparePlayers.p1Hab !== 'All' ? comparePlayers.p1Hab : (p1.topCharacter?.name || 'Nenhum')}
                  </span>
                  {comparePlayers.p1Hab === 'All' && p1.characterPool && p1.characterPool.length > 1 && (
                    <span className="text-[9px] text-gray-400 truncate">
                      Pool: {p1.characterPool.map((c: any) => `${c.name} (${c.matches}Q)`).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats badges */}
              <div className="grid grid-cols-4 gap-2 w-full mt-4 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Abates</span>
                  <span className="text-base font-black text-white">{p1.kills}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Mortes</span>
                  <span className="text-base font-black text-red-400">{p1.deaths ?? 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">K/D</span>
                  <span className="text-base font-black text-yellow-400">{p1.kd ?? '0.00'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Zeradas</span>
                  <span className="text-base font-black text-orange-400">{p1.zeroKills ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seleção Jogador 2 */}
        <div id="p2-selector-card" className="bg-[#1a1a1a] rounded-3xl border border-blue-500/30 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <User size={14} /> DESAFIANTE 2 (JOGADOR 2)
            </label>
            <select 
              id="select-p2-player"
              value={comparePlayers.p2} 
              onChange={(e) => setComparePlayers(prev => ({...prev, p2: e.target.value}))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all mb-3 text-sm"
            >
              <option value="">Selecione um jogador...</option>
              {(allPlayersList || []).map(p => (
                <option key={p.name} value={p.name}>{p.name} {p.team ? `(${p.team})` : ''}</option>
              ))}
            </select>
            <select 
              id="select-p2-hab"
              value={comparePlayers.p2Hab} 
              onChange={(e) => setComparePlayers(prev => ({...prev, p2Hab: e.target.value}))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-blue-500 outline-none transition-all text-xs"
            >
              <option value="All">Com Qualquer Personagem / Habilidade</option>
              {(activeHabs || []).map(h => <option key={h} value={h}>Com {h}</option>)}
            </select>
          </div>

          {p2 && (
            <div className="mt-8 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/40 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-4 bg-black flex-shrink-0">
                  {p2.playerImg ? (
                    <img src={p2.playerImg} className="w-full h-full object-cover" alt={p2.name} referrerPolicy="no-referrer" />
                  ) : p2.teamImg ? (
                    <img src={p2.teamImg} className="w-full h-full object-contain p-2" alt={p2.team} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={48} /></div>
                  )}
                </div>
                {p2.teamImg && (
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-black/90 border-2 border-blue-500/40 p-1 shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={p2.teamImg} alt={p2.team} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">{p2.name}</h4>
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest mt-1">{p2.team}</span>

              {/* Badge de Personagem do Jogador 2 */}
              <div className="w-full mt-4 bg-black/50 p-3 rounded-2xl border border-blue-500/20 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {p2.activeHabImg ? (
                    <img src={p2.activeHabImg} alt="Personagem" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Zap size={22} className="text-blue-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">
                      {comparePlayers.p2Hab !== 'All' ? 'Personagem Filtrado' : 'Personagem Principal (Main)'}
                    </span>
                    {comparePlayers.p2Hab === 'All' && p2.topCharacter && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-black">
                        {p2.topCharacter.pickRate}% uso
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-white uppercase italic truncate">
                    {comparePlayers.p2Hab !== 'All' ? comparePlayers.p2Hab : (p2.topCharacter?.name || 'Nenhum')}
                  </span>
                  {comparePlayers.p2Hab === 'All' && p2.characterPool && p2.characterPool.length > 1 && (
                    <span className="text-[9px] text-gray-400 truncate">
                      Pool: {p2.characterPool.map((c: any) => `${c.name} (${c.matches}Q)`).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats badges */}
              <div className="grid grid-cols-4 gap-2 w-full mt-4 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Abates</span>
                  <span className="text-base font-black text-white">{p2.kills}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Mortes</span>
                  <span className="text-base font-black text-red-400">{p2.deaths ?? 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">K/D</span>
                  <span className="text-base font-black text-blue-400">{p2.kd ?? '0.00'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Zeradas</span>
                  <span className="text-base font-black text-orange-400">{p2.zeroKills ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL SE OS DOIS JOGADORES ESTIVEREM SELECIONADOS */}
      {p1 && p2 && (
        <div className="space-y-8">
          {/* ========================================================================= */}
          {/* CARD NOVO: CONFRONTO DIRETO (HEAD-TO-HEAD P1 vs P2) */}
          {/* ========================================================================= */}
          <div id="h2h-summary-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500/20 via-black/80 to-blue-500/20 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl text-black shadow-lg shadow-yellow-500/20">
                  <Swords size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-[0.2em] italic">Confronto Direto (Head-to-Head)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Histórico exato de abates mútuos entre {p1.name} e {p2.name} nas partidas filtradas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-black/60 border border-white/10 rounded-xl text-xs font-black text-gray-300">
                  {headToHead?.totalDuels || 0} Duelo(s) Registrado(s)
                </span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Placar do Duelo Direto */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Desafiante 1 Score */}
                <div className="bg-black/50 p-6 rounded-2xl border border-yellow-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-500/40 overflow-hidden bg-black flex-shrink-0">
                      {p1.playerImg ? (
                        <img src={p1.playerImg} alt={p1.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-yellow-500"><User size={20} /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-black text-white uppercase italic truncate block">{p1.name}</span>
                      <span className="text-[10px] text-yellow-500 font-bold uppercase">{p1.team}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-yellow-500 italic block leading-none">{headToHead?.p1KillsP2 || 0}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Abates em {p2.name}</span>
                  </div>
                </div>

                {/* Vantagem / Versus Center Indicator */}
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <span className="text-2xl font-black italic tracking-widest text-gray-600 mb-1">VS</span>
                  {headToHead && headToHead.totalDuels > 0 ? (
                    headToHead.p1KillsP2 > headToHead.p2KillsP1 ? (
                      <div className="px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[11px] font-black uppercase flex items-center gap-1.5">
                        <Trophy size={13} /> {p1.name} leva vantagem (+{headToHead.p1KillsP2 - headToHead.p2KillsP1})
                      </div>
                    ) : headToHead.p2KillsP1 > headToHead.p1KillsP2 ? (
                      <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase flex items-center gap-1.5">
                        <Trophy size={13} /> {p2.name} leva vantagem (+{headToHead.p2KillsP1 - headToHead.p1KillsP2})
                      </div>
                    ) : (
                      <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-gray-300 text-[11px] font-black uppercase">
                        Duelo Empatado ({headToHead.p1KillsP2} x {headToHead.p2KillsP1})
                      </div>
                    )
                  ) : (
                    <span className="text-xs font-bold text-gray-500 uppercase">Sem duelo direto no filtro atual</span>
                  )}

                  {/* Dominance Bar */}
                  {headToHead && headToHead.totalDuels > 0 && (
                    <div className="w-full mt-4 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black">
                        <span className="text-yellow-500">{headToHead.p1WinRate}%</span>
                        <span className="text-gray-500">Taxa de Vitória no Duelo</span>
                        <span className="text-blue-400">{headToHead.p2WinRate}%</span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden flex border border-white/10">
                        <div 
                          className="bg-yellow-500 h-full transition-all duration-700"
                          style={{ width: `${headToHead.p1WinRate}%` }}
                        />
                        <div 
                          className="bg-blue-500 h-full transition-all duration-700"
                          style={{ width: `${headToHead.p2WinRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Desafiante 2 Score */}
                <div className="bg-black/50 p-6 rounded-2xl border border-blue-500/30 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-4xl font-black text-blue-400 italic block leading-none">{headToHead?.p2KillsP1 || 0}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Abates em {p1.name}</span>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0 text-right">
                      <span className="text-sm font-black text-white uppercase italic truncate block">{p2.name}</span>
                      <span className="text-[10px] text-blue-400 font-bold uppercase">{p2.team}</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/40 overflow-hidden bg-black flex-shrink-0">
                      {p2.playerImg ? (
                        <img src={p2.playerImg} alt={p2.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-400"><User size={20} /></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linha do Tempo / Log dos Confrontos Diretos */}
              {headToHead && headToHead.events && headToHead.events.length > 0 ? (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Target size={14} className="text-yellow-500" /> Registro de Eliminações Mútuas
                    </span>
                    {headToHead.events.length > 3 && (
                      <button 
                        onClick={() => setShowAllH2HEvents(prev => !prev)}
                        className="text-[11px] font-black text-yellow-500 hover:text-yellow-400 flex items-center gap-1 uppercase transition-colors"
                      >
                        {showAllH2HEvents ? 'Mostrar Menos' : `Ver Todos (${headToHead.events.length})`}
                        {showAllH2HEvents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(showAllH2HEvents ? headToHead.events : headToHead.events.slice(0, 6)).map((ev: any, idx: number) => {
                      const isP1Killer = ev.winnerColor === 'yellow';
                      return (
                        <div key={idx} className="bg-black/60 rounded-xl p-3 border border-white/5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${isP1Killer ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 text-xs font-black truncate">
                                <span className={isP1Killer ? 'text-yellow-500' : 'text-blue-400'}>{ev.PLAYER}</span>
                                <span className="text-gray-500 font-normal">abateu</span>
                                <span className={isP1Killer ? 'text-blue-400' : 'text-yellow-500'}>{ev.VITIMA}</span>
                              </div>
                              <span className="text-[9px] text-gray-500 font-bold block">
                                RD {ev.RD || '-'} • Q{ev.Q || '-'} • {ev.MAPA || 'Mapa'} {ev.SAFE ? `• Safe ${ev.SAFE}` : ''}
                              </span>
                            </div>
                          </div>
                          {ev.ARM && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-300 font-black uppercase flex-shrink-0">
                              {ev.ARM}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-black/30 rounded-2xl border border-white/5 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  Nenhuma eliminação direta registrada entre {p1.name} e {p2.name} com os filtros aplicados.
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RADAR COMPETITIVO */}
          {/* ========================================================================= */}
          <div id="radar-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em]">Radar Competitivo de Habilidades</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Comparativo multidimensional normalizado de impacto competitivo</p>
              <div className="flex justify-center items-center gap-6 mt-4 text-xs font-black uppercase">
                <span className="flex items-center gap-2 text-yellow-500">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span> {p1.name}
                </span>
                <span className="flex items-center gap-2 text-blue-400">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span> {p2.name}
                </span>
              </div>
            </div>

            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={p1.name} dataKey="Jogador1" stroke="#eab308" fill="#eab308" fillOpacity={0.4} strokeWidth={2} />
                  <Radar name={p2.name} dataKey="Jogador2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 1: TIMES QUE MAIS MORREM (PRESAS FAVORITAS) */}
          {/* ========================================================================= */}
          <div id="victim-teams-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-teal-500/10 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Times que Mais Morrem (Presas Favoritas)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Equipes das quais cada jogador mais fez abates no campeonato
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllVictimTeams(prev => !prev)}
                className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase transition-colors"
              >
                {showAllVictimTeams ? 'Exibir Top 5' : 'Ver Todos os Times'}
                {showAllVictimTeams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Times Vítimas de P1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                    <User size={14} /> {p1.name} — Equipes Mais Abatidas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.victimTeams?.length || 0} times vítimas</span>
                </div>

                <div className="space-y-2.5">
                  {p1.victimTeams && p1.victimTeams.length > 0 ? (
                    (showAllVictimTeams ? p1.victimTeams : p1.victimTeams.slice(0, 5)).map((team: any, idx: number) => {
                      const maxKills = p1.victimTeams[0]?.count || 1;
                      const pct = ((team.count / maxKills) * 100).toFixed(0);
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {team.img ? (
                                <img src={team.img} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Shield size={14} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{team.name}</span>
                              <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {team.grupo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-right min-w-[48px]">
                              <span className="text-sm font-black text-yellow-500 italic block leading-none">{team.count}</span>
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

              {/* Times Vítimas de P2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                    <User size={14} /> {p2.name} — Equipes Mais Abatidas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.victimTeams?.length || 0} times vítimas</span>
                </div>

                <div className="space-y-2.5">
                  {p2.victimTeams && p2.victimTeams.length > 0 ? (
                    (showAllVictimTeams ? p2.victimTeams : p2.victimTeams.slice(0, 5)).map((team: any, idx: number) => {
                      const maxKills = p2.victimTeams[0]?.count || 1;
                      const pct = ((team.count / maxKills) * 100).toFixed(0);
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {team.img ? (
                                <img src={team.img} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Shield size={14} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{team.name}</span>
                              <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {team.grupo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-right min-w-[48px]">
                              <span className="text-sm font-black text-blue-400 italic block leading-none">{team.count}</span>
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
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 2: TIMES QUE MAIS MATAM (TIMES ALGOZES) */}
          {/* ========================================================================= */}
          <div id="killer-teams-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-red-500/10 via-black/40 to-rose-500/10 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Times que Mais Matam (Equipes Algozes)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Equipes que mais causaram a eliminação de cada jogador
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllKillerTeams(prev => !prev)}
                className="text-[10px] font-black text-red-400 hover:text-red-300 flex items-center gap-1 uppercase transition-colors"
              >
                {showAllKillerTeams ? 'Exibir Top 5' : 'Ver Todos os Times'}
                {showAllKillerTeams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Times Algozes de P1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                    <Skull size={14} className="text-red-400" /> {p1.name} — Maiores Ameaças Coletivas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.killerTeams?.length || 0} times algozes</span>
                </div>

                <div className="space-y-2.5">
                  {p1.killerTeams && p1.killerTeams.length > 0 ? (
                    (showAllKillerTeams ? p1.killerTeams : p1.killerTeams.slice(0, 5)).map((team: any, idx: number) => {
                      const maxDeaths = p1.killerTeams[0]?.count || 1;
                      const pct = ((team.count / maxDeaths) * 100).toFixed(0);
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {team.img ? (
                                <img src={team.img} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Shield size={14} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{team.name}</span>
                              <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {team.grupo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-right min-w-[48px]">
                              <span className="text-sm font-black text-red-400 italic block leading-none">{team.count}</span>
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

              {/* Times Algozes de P2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                    <Skull size={14} className="text-red-400" /> {p2.name} — Maiores Ameaças Coletivas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.killerTeams?.length || 0} times algozes</span>
                </div>

                <div className="space-y-2.5">
                  {p2.killerTeams && p2.killerTeams.length > 0 ? (
                    (showAllKillerTeams ? p2.killerTeams : p2.killerTeams.slice(0, 5)).map((team: any, idx: number) => {
                      const maxDeaths = p2.killerTeams[0]?.count || 1;
                      const pct = ((team.count / maxDeaths) * 100).toFixed(0);
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-8 h-8 rounded-lg bg-black/80 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {team.img ? (
                                <img src={team.img} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Shield size={14} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{team.name}</span>
                              <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {team.grupo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-right min-w-[48px]">
                              <span className="text-sm font-black text-red-400 italic block leading-none">{team.count}</span>
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
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 3: JOGADORES QUE MAIS MORREM (VÍTIMAS FREQUENTES / FREGUESES) */}
          {/* ========================================================================= */}
          <div id="victim-players-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-amber-500/10 via-black/40 to-yellow-500/10 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Crosshair size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Jogadores que Mais Morrem (Vítimas Frequentes)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Jogadores individuais que mais foram eliminados por cada desafiante
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllVictimPlayers(prev => !prev)}
                className="text-[10px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 uppercase transition-colors"
              >
                {showAllVictimPlayers ? 'Exibir Top 5' : 'Ver Todos os Jogadores'}
                {showAllVictimPlayers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Jogadores Vítimas de P1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                    <User size={14} /> {p1.name} — Vítimas Favoritas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.victimPlayers?.length || 0} jogadores</span>
                </div>

                <div className="space-y-2.5">
                  {p1.victimPlayers && p1.victimPlayers.length > 0 ? (
                    (showAllVictimPlayers ? p1.victimPlayers : p1.victimPlayers.slice(0, 5)).map((vPlayer: any, idx: number) => {
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-black/80 border border-yellow-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {vPlayer.img ? (
                                <img src={vPlayer.img} alt={vPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={16} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{vPlayer.name}</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase truncate block">{vPlayer.team || 'Sem Equipe'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-[50px]">
                            <span className="text-sm font-black text-yellow-500 italic block leading-none">{vPlayer.count}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                  )}
                </div>
              </div>

              {/* Jogadores Vítimas de P2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                    <User size={14} /> {p2.name} — Vítimas Favoritas
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.victimPlayers?.length || 0} jogadores</span>
                </div>

                <div className="space-y-2.5">
                  {p2.victimPlayers && p2.victimPlayers.length > 0 ? (
                    (showAllVictimPlayers ? p2.victimPlayers : p2.victimPlayers.slice(0, 5)).map((vPlayer: any, idx: number) => {
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-black/80 border border-blue-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {vPlayer.img ? (
                                <img src={vPlayer.img} alt={vPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={16} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{vPlayer.name}</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase truncate block">{vPlayer.team || 'Sem Equipe'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-[50px]">
                            <span className="text-sm font-black text-blue-400 italic block leading-none">{vPlayer.count}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">abates</span>
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
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 4: JOGADORES QUE MAIS MATAM (ALGOZES INDIVIDUAIS) */}
          {/* ========================================================================= */}
          <div id="killer-players-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500/10 via-black/40 to-pink-500/10 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                  <Skull size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Jogadores que Mais Matam (Algozes Individuais)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Jogadores que mais eliminaram cada desafiante no campeonato
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllKillerPlayers(prev => !prev)}
                className="text-[10px] font-black text-purple-400 hover:text-purple-300 flex items-center gap-1 uppercase transition-colors"
              >
                {showAllKillerPlayers ? 'Exibir Top 5' : 'Ver Todos os Algozes'}
                {showAllKillerPlayers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Algozes de P1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                    <HeartCrack size={14} className="text-purple-400" /> {p1.name} — Algozes Diretos
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.killerPlayers?.length || 0} algozes</span>
                </div>

                <div className="space-y-2.5">
                  {p1.killerPlayers && p1.killerPlayers.length > 0 ? (
                    (showAllKillerPlayers ? p1.killerPlayers : p1.killerPlayers.slice(0, 5)).map((kPlayer: any, idx: number) => {
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-black/80 border border-purple-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {kPlayer.img ? (
                                <img src={kPlayer.img} alt={kPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={16} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{kPlayer.name}</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase truncate block">{kPlayer.team || 'Sem Equipe'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-[50px]">
                            <span className="text-sm font-black text-purple-400 italic block leading-none">{kPlayer.count}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-600 text-xs font-bold uppercase">Nenhum dado encontrado</div>
                  )}
                </div>
              </div>

              {/* Algozes de P2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                    <HeartCrack size={14} className="text-purple-400" /> {p2.name} — Algozes Diretos
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.killerPlayers?.length || 0} algozes</span>
                </div>

                <div className="space-y-2.5">
                  {p2.killerPlayers && p2.killerPlayers.length > 0 ? (
                    (showAllKillerPlayers ? p2.killerPlayers : p2.killerPlayers.slice(0, 5)).map((kPlayer: any, idx: number) => {
                      return (
                        <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-black text-gray-600 w-4 text-center">#{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-black/80 border border-purple-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {kPlayer.img ? (
                                <img src={kPlayer.img} alt={kPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={16} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-white uppercase italic truncate block">{kPlayer.name}</span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase truncate block">{kPlayer.team || 'Sem Equipe'}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-[50px]">
                            <span className="text-sm font-black text-purple-400 italic block leading-none">{kPlayer.count}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">mortes</span>
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
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 5: DUELO DE PERSONAGENS & HABILIDADES ATIVAS (HAB 1) */}
          {/* ========================================================================= */}
          <div id="characters-duel-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-500/10 via-black/40 to-blue-500/10 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <Sparkles className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Duelo de Personagens & Habilidades Ativas (Hab 1)</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Comparativo detalhado de eficiência, média e taxa de uso por personagem</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <span className="text-yellow-500">{p1.name}: {p1.distinctCharactersCount} Personagens</span>
                <span className="text-gray-600">vs</span>
                <span className="text-blue-400">{p2.name}: {p2.distinctCharactersCount} Personagens</span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* Resumo Lado a Lado dos Personagens Mais Usados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main P1 */}
                <div className="bg-black/40 rounded-2xl p-5 border border-yellow-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-1 flex items-center justify-center overflow-hidden">
                      {p1.topCharacter?.img ? (
                        <img src={p1.topCharacter.img} alt={p1.topCharacter.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Zap size={28} className="text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">Main de {p1.name}</span>
                      <h4 className="text-lg font-black text-white uppercase italic">{p1.topCharacter?.name || 'N/A'}</h4>
                      <span className="text-xs text-gray-400 font-bold">
                        {p1.topCharacter ? `${p1.topCharacter.matches} Quedas (${p1.topCharacter.pickRate}%)` : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-yellow-500 italic block">{p1.topCharacter?.avgKills || '0.00'}</span>
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Média Kills / Q</span>
                  </div>
                </div>

                {/* Main P2 */}
                <div className="bg-black/40 rounded-2xl p-5 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-500/10 border border-blue-500/30 p-1 flex items-center justify-center overflow-hidden">
                      {p2.topCharacter?.img ? (
                        <img src={p2.topCharacter.img} alt={p2.topCharacter.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Zap size={28} className="text-blue-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Main de {p2.name}</span>
                      <h4 className="text-lg font-black text-white uppercase italic">{p2.topCharacter?.name || 'N/A'}</h4>
                      <span className="text-xs text-gray-400 font-bold">
                        {p2.topCharacter ? `${p2.topCharacter.matches} Quedas (${p2.topCharacter.pickRate}%)` : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-400 italic block">{p2.topCharacter?.avgKills || '0.00'}</span>
                    <span className="text-[8px] font-bold text-gray-500 uppercase">Média Kills / Q</span>
                  </div>
                </div>
              </div>

              {/* Comparativo de Eficiência com os Personagens Comuns */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Eficiência por Personagem Utilizado
                </h4>
                <div className="space-y-3">
                  {Array.from(new Set([
                    ...(p1.characterPool || []).map((c: any) => c.name),
                    ...(p2.characterPool || []).map((c: any) => c.name)
                  ])).map(charName => {
                    const c1 = (p1.characterPool || []).find((c: any) => c.name === charName);
                    const c2 = (p2.characterPool || []).find((c: any) => c.name === charName);
                    const k1 = c1 ? c1.kills : 0;
                    const k2 = c2 ? c2.kills : 0;
                    const m1 = c1 ? c1.matches : 0;
                    const m2 = c2 ? c2.matches : 0;
                    const avg1 = c1 ? c1.avgKills : '0.00';
                    const avg2 = c2 ? c2.avgKills : '0.00';
                    const img = c1?.img || c2?.img;

                    const isP1Better = parseFloat(avg1) > parseFloat(avg2);
                    const isP2Better = parseFloat(avg2) > parseFloat(avg1);

                    return (
                      <div key={charName} className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black">
                            <span className={`text-sm ${isP1Better ? 'text-yellow-500' : 'text-gray-400'}`}>{avg1} k/q</span>
                            <span className="text-[9px] text-gray-600">({k1}k em {m1}Q)</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {img && <img src={img} alt={charName} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />}
                            <span className="text-xs font-black text-white uppercase italic">{charName}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-black">
                            <span className="text-[9px] text-gray-600">({k2}k em {m2}Q)</span>
                            <span className={`text-sm ${isP2Better ? 'text-blue-400' : 'text-gray-400'}`}>{avg2} k/q</span>
                          </div>
                        </div>

                        {/* Bar comparison */}
                        <div className="h-1.5 bg-black rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`} 
                            style={{ width: `${((k1 + 0.1) / ((k1 + k2) || 1)) * 100}%` }}
                          />
                          <div 
                            className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`} 
                            style={{ width: `${((k2 + 0.1) / ((k1 + k2) || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 6: LOADOUT FAVORITO & HABILIDADES PASSIVAS */}
          {/* ========================================================================= */}
          <div id="loadout-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Loadout Favorito & Habilidades Passivas</h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Loadout Favorito Desafiante 1 */}
              <div className="bg-black/30 rounded-2xl border border-yellow-500/20 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider">{p1.name}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Loadout Mais Frequente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Passiva 1 (Hab 2)', item: p1.topHab2 },
                    { label: 'Passiva 2 (Hab 3)', item: p1.topHab3 },
                    { label: 'Passiva 3 (Hab 4)', item: p1.topHab4 },
                    { label: 'Pet Favorito', item: p1.topPet },
                    { label: 'Item Favorito', item: p1.topItem },
                  ].filter(l => l.item).map((load, idx) => (
                    <div key={idx} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {load.item?.img ? (
                          <img src={load.item.img} alt={load.item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Shield size={18} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">{load.label}</span>
                        <span className="text-xs font-black text-white uppercase italic truncate block">{load.item?.name}</span>
                        <span className="text-[8px] text-yellow-500 font-bold">{load.item?.count}x ({load.item?.pct}% das quedas)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loadout Favorito Desafiante 2 */}
              <div className="bg-black/30 rounded-2xl border border-blue-500/20 p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider">{p2.name}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Loadout Mais Frequente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Passiva 1 (Hab 2)', item: p2.topHab2 },
                    { label: 'Passiva 2 (Hab 3)', item: p2.topHab3 },
                    { label: 'Passiva 3 (Hab 4)', item: p2.topHab4 },
                    { label: 'Pet Favorito', item: p2.topPet },
                    { label: 'Item Favorito', item: p2.topItem },
                  ].filter(l => l.item).map((load, idx) => (
                    <div key={idx} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {load.item?.img ? (
                          <img src={load.item.img} alt={load.item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <Shield size={18} className="text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">{load.label}</span>
                        <span className="text-xs font-black text-white uppercase italic truncate block">{load.item?.name}</span>
                        <span className="text-[8px] text-blue-400 font-bold">{load.item?.count}x ({load.item?.pct}% das quedas)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 7: COMPARATIVO GERAL DE PERFORMANCE */}
          {/* ========================================================================= */}
          <div id="general-stats-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Comparativo Geral de Performance</h3>
            </div>
            <div className="p-8 space-y-6">
              {[
                { label: 'Abates Totais', key: 'kills' },
                { label: 'Abates por Queda (Média)', key: 'avg' },
                { label: 'Mortes Totais', key: 'deaths', lowerIsBetter: true },
                { label: 'K/D Ratio (Abates / Morte)', key: 'kd' },
                { label: 'Quedas Zeradas (0 Abates)', key: 'zeroKills', lowerIsBetter: true, format: (p: any) => `${p.zeroKills ?? 0} (${p.zeroKillsPct || '0.0'}%)` },
                { label: 'Quedas com Abate', key: 'withKills', format: (p: any) => `${p.withKills ?? 0} (${p.withKillsPct || '0.0'}%)` },
                { label: 'Partidas Jogadas', key: 'matches' },
                { label: 'Dano Total', key: 'damage' },
                { label: 'Média Dano', key: 'avgDmg' },
                { label: 'Assistências', key: 'assists' },
                { label: 'Headshots', key: 'hs' },
                { label: 'Deitados (Knocks)', key: 'knocks' },
                { label: 'Gelos', key: 'gelos' },
                { label: 'Gelos Destruídos', key: 'gelosDestruidos' },
                { label: 'Reviveu', key: 'reviveu' },
                { label: 'Aliados Revividos', key: 'aliadosRevividos' },
                { label: 'MVP', key: 'mvp' },
              ].map((stat) => {
                const rawVal1 = p1[stat.key as keyof typeof p1] as any;
                const rawVal2 = p2[stat.key as keyof typeof p2] as any;
                const val1 = parseFloat(rawVal1) || 0;
                const val2 = parseFloat(rawVal2) || 0;
                const isP1Better = stat.lowerIsBetter ? (val1 < val2) : (val1 > val2);
                const isP2Better = stat.lowerIsBetter ? (val2 < val1) : (val2 > val1);
                const display1 = (stat as any).format ? (stat as any).format(p1) : (rawVal1 ?? 0);
                const display2 = (stat as any).format ? (stat as any).format(p2) : (rawVal2 ?? 0);

                return (
                  <div key={stat.key} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <span className={isP1Better ? 'text-yellow-500 font-black' : ''}>{display1}</span>
                      <span className="text-white">{stat.label}</span>
                      <span className={isP2Better ? 'text-blue-500 font-black' : ''}>{display2}</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`} 
                        style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                      />
                      <div 
                        className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`} 
                        style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 8: ABATES POR MAPA */}
          {/* ========================================================================= */}
          <div id="map-kills-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Mapa</h3>
            </div>
            <div className="p-8 space-y-6">
              {Array.from(new Set([...Object.keys(p1.mapKills || {}), ...Object.keys(p2.mapKills || {})])).sort().map(mapName => {
                const val1 = p1.mapKills?.[mapName] || 0;
                const val2 = p2.mapKills?.[mapName] || 0;
                const isP1Better = val1 > val2;
                const isP2Better = val2 > val1;

                return (
                  <div key={mapName} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <span className={isP1Better ? 'text-yellow-500 font-black' : ''}>{val1}</span>
                      <span className="text-white">{mapName}</span>
                      <span className={isP2Better ? 'text-blue-500 font-black' : ''}>{val2}</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500' : 'bg-gray-800'}`} 
                        style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                      />
                      <div 
                        className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`} 
                        style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEÇÃO 9: ABATES POR SAFE */}
          {/* ========================================================================= */}
          <div id="safe-kills-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Safe</h3>
            </div>
            <div className="p-8 space-y-6">
              {Array.from(new Set([...Object.keys(p1.safeKills || {}), ...Object.keys(p2.safeKills || {})])).sort().map(safeName => {
                const val1 = p1.safeKills?.[safeName] || 0;
                const val2 = p2.safeKills?.[safeName] || 0;
                const isP1Better = val1 > val2;
                const isP2Better = val2 > val1;

                return (
                  <div key={safeName} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      <span className={isP1Better ? 'text-yellow-500 font-black' : ''}>{val1}</span>
                      <span className="text-white">{safeName === 'OUT' ? 'OUT' : `Safe ${safeName}`}</span>
                      <span className={isP2Better ? 'text-blue-500 font-black' : ''}>{val2}</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500' : 'bg-gray-800'}`} 
                        style={{ width: `${(val1 / (val1 + val2 || 1)) * 100}%` }}
                      />
                      <div 
                        className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`} 
                        style={{ width: `${(val2 / (val1 + val2 || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
