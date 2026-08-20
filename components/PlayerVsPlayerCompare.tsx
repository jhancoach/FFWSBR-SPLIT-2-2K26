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
  const [showAllKillerWeapons, setShowAllKillerWeapons] = useState(false);
  const [showAllVictimWeapons, setShowAllVictimWeapons] = useState(false);

  const [showSection1, setShowSection1] = useState(true);
  const [showSection2, setShowSection2] = useState(true);
  const [showSection3, setShowSection3] = useState(true);
  const [showSection4, setShowSection4] = useState(true);
  const [showWeaponsSection, setShowWeaponsSection] = useState(true);

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                <User size={14} /> Desafiante 1
              </span>
              {p1 && (
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {p1.team || 'Sem Equipe'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-yellow-500/30 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {p1?.img ? (
                  <img src={p1.img} alt={p1.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <User size={32} className="text-yellow-500" />
                )}
              </div>
              <div className="flex-1">
                <select
                  id="p1-select"
                  aria-label="Selecione o Jogador 1"
                  value={comparePlayers.p1}
                  onChange={(e) => setComparePlayers(prev => ({ ...prev, p1: e.target.value }))}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm font-black text-white uppercase tracking-wider focus:border-yellow-500 focus:outline-none transition-colors"
                >
                  <option value="">Selecione o Jogador 1</option>
                  {allPlayersList.map(p => (
                    <option key={`p1-${p.name}`} value={p.name}>
                      {p.name} {p.team ? `(${p.team})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Opcional de Hab 1 */}
            <div className="pt-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Filtrar por Habilidade Ativa (Opcional)
              </label>
              <select
                id="p1-hab-select"
                aria-label="Filtrar Habilidade Ativa Jogador 1"
                value={comparePlayers.p1Hab}
                onChange={(e) => setComparePlayers(prev => ({ ...prev, p1Hab: e.target.value }))}
                className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-gray-300 focus:border-yellow-500 focus:outline-none transition-colors"
              >
                <option value="">Todas as Habilidades Ativas</option>
                {activeHabs.map(h => (
                  <option key={`p1-hab-${h}`} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Seleção Jogador 2 */}
        <div id="p2-selector-card" className="bg-[#1a1a1a] rounded-3xl border border-blue-500/30 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <User size={14} /> Desafiante 2
              </span>
              {p2 && (
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {p2.team || 'Sem Equipe'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black border border-blue-500/30 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {p2?.img ? (
                  <img src={p2.img} alt={p2.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <User size={32} className="text-blue-400" />
                )}
              </div>
              <div className="flex-1">
                <select
                  id="p2-select"
                  aria-label="Selecione o Jogador 2"
                  value={comparePlayers.p2}
                  onChange={(e) => setComparePlayers(prev => ({ ...prev, p2: e.target.value }))}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-sm font-black text-white uppercase tracking-wider focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Selecione o Jogador 2</option>
                  {allPlayersList.map(p => (
                    <option key={`p2-${p.name}`} value={p.name}>
                      {p.name} {p.team ? `(${p.team})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro Opcional de Hab 1 */}
            <div className="pt-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Filtrar por Habilidade Ativa (Opcional)
              </label>
              <select
                id="p2-hab-select"
                aria-label="Filtrar Habilidade Ativa Jogador 2"
                value={comparePlayers.p2Hab}
                onChange={(e) => setComparePlayers(prev => ({ ...prev, p2Hab: e.target.value }))}
                className="w-full bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs font-bold text-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Todas as Habilidades Ativas</option>
                {activeHabs.map(h => (
                  <option key={`p2-hab-${h}`} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {p1 && p2 ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* ========================================================================= */}
          {/* CONFRONTO DIRETO (HEAD-TO-HEAD) */}
          {/* ========================================================================= */}
          {headToHead && (
            <div id="h2h-summary-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
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
                      Eliminações diretas entre {p1.name} e {p2.name}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10 text-gray-300">
                  {headToHead.totalDuels} duelos
                </span>
              </div>

              {/* Placar de Duelos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* P1 */}
                <div className="bg-black/40 p-5 rounded-2xl border border-yellow-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest block mb-1">
                      DESAFIANTE 1
                    </span>
                    <span className="text-lg font-black text-white uppercase italic truncate block max-w-[140px]">
                      {p1.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Taxa de Vitória: <span className="text-yellow-500 font-black">{headToHead.p1WinRate}%</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-yellow-500 italic block leading-none">
                      {headToHead.p1KillsP2}
                    </span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase">abates em {p2.name}</span>
                  </div>
                </div>

                {/* VS Center Indicator with Dual Bar */}
                <div className="space-y-3 text-center">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider px-1">
                    <span className="text-yellow-500">{headToHead.p1WinRate}%</span>
                    <span className="text-gray-500 font-black italic">DOMINÂNCIA DIRETA</span>
                    <span className="text-blue-400">{headToHead.p2WinRate}%</span>
                  </div>
                  <div className="h-3 w-full bg-black rounded-full overflow-hidden flex border border-white/10 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700"
                      style={{ width: `${headToHead.totalDuels > 0 ? (headToHead.p1KillsP2 / headToHead.totalDuels) * 100 : 50}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                      style={{ width: `${headToHead.totalDuels > 0 ? (headToHead.p2KillsP1 / headToHead.totalDuels) * 100 : 50}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">
                    {headToHead.p1KillsP2 > headToHead.p2KillsP1
                      ? `🔥 ${p1.name} leva vantagem no duelo direto (+${headToHead.p1KillsP2 - headToHead.p2KillsP1})`
                      : headToHead.p2KillsP1 > headToHead.p1KillsP2
                      ? `🔥 ${p2.name} leva vantagem no duelo direto (+${headToHead.p2KillsP1 - headToHead.p1KillsP2})`
                      : '⚖️ Duelo 100% equilibrado entre os atletas'}
                  </span>
                </div>

                {/* P2 */}
                <div className="bg-black/40 p-5 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest block mb-1">
                      DESAFIANTE 2
                    </span>
                    <span className="text-lg font-black text-white uppercase italic truncate block max-w-[140px]">
                      {p2.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Taxa de Vitória: <span className="text-blue-400 font-black">{headToHead.p2WinRate}%</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-blue-400 italic block leading-none">
                      {headToHead.p2KillsP1}
                    </span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase">abates em {p1.name}</span>
                  </div>
                </div>
              </div>

              {/* Log de Duelos Diretos */}
              {headToHead.events && headToHead.events.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      Feed de Abates do Duelo ({headToHead.events.length} eventos)
                    </span>
                    <button
                      onClick={() => setShowAllH2HEvents(prev => !prev)}
                      className="text-[10px] font-black text-yellow-500 hover:text-yellow-400 flex items-center gap-1 uppercase transition-colors"
                    >
                      {showAllH2HEvents ? 'Exibir Menos' : 'Ver Todos'}
                      {showAllH2HEvents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {(showAllH2HEvents ? headToHead.events : headToHead.events.slice(0, 6)).map((ev: any, idx: number) => {
                      const isP1Killer = ev.isP1Killer;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                            isP1Killer
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-blue-500/5 border-blue-500/20'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-black truncate">
                              <span className={isP1Killer ? 'text-yellow-400' : 'text-blue-400'}>
                                {ev.PLAYER}
                              </span>
                              <span className="text-gray-500 font-normal text-[10px]">⚔️</span>
                              <span className={isP1Killer ? 'text-blue-400' : 'text-yellow-400'}>
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
          )}

          {/* ========================================================================= */}
          {/* RADAR CHART: COMPARATIVO DE ESTILO DE JOGO */}
          {/* ========================================================================= */}
          <div id="radar-compare-card" className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white uppercase italic tracking-[0.2em] flex items-center gap-2">
                  <Activity size={18} className="text-yellow-500" />
                  Perfil de Atributos & Estilo de Jogo
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  Radar normalizado por métricas-chave por queda
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-black uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-yellow-500">{p1.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-blue-400">{p2.name}</span>
                </div>
              </div>
            </div>

            <div className="h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" stroke="#888" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 800 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#333" tick={false} />
                  <Radar name={p1.name} dataKey="Jogador1" stroke="#eab308" fill="#eab308" fillOpacity={0.4} />
                  <Radar name={p2.name} dataKey="Jogador2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
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
                    Equipes que cada jogador mais abateu no campeonato
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
                {/* P1 Victim Teams */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <Shield size={14} /> {p1.name} — Presas Favoritas
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p1.victimTeams?.length || 0} times abatidos
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p1.victimTeams && p1.victimTeams.length > 0 ? (
                      (showAllVictimTeams ? p1.victimTeams : p1.victimTeams.slice(0, 5)).map((t: any, idx: number) => {
                        const maxCount = p1.victimTeams[0]?.count || 1;
                        const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{t.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-yellow-500 italic block leading-none">{t.count}</span>
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

                {/* P2 Victim Teams */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <Shield size={14} /> {p2.name} — Presas Favoritas
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p2.victimTeams?.length || 0} times abatidos
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p2.victimTeams && p2.victimTeams.length > 0 ? (
                      (showAllVictimTeams ? p2.victimTeams : p2.victimTeams.slice(0, 5)).map((t: any, idx: number) => {
                        const maxCount = p2.victimTeams[0]?.count || 1;
                        const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{t.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-blue-400 italic block leading-none">{t.count}</span>
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
                    Equipes que mais abateram cada jogador
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
                {/* P1 Killer Teams */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <ShieldAlert size={14} className="text-red-500" /> Algozes de {p1.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p1.killerTeams?.length || 0} times algozes
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p1.killerTeams && p1.killerTeams.length > 0 ? (
                      (showAllKillerTeams ? p1.killerTeams : p1.killerTeams.slice(0, 5)).map((t: any, idx: number) => {
                        const maxCount = p1.killerTeams[0]?.count || 1;
                        const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{t.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-red-500 italic block leading-none">{t.count}</span>
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

                {/* P2 Killer Teams */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <ShieldAlert size={14} className="text-red-500" /> Algozes de {p2.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p2.killerTeams?.length || 0} times algozes
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p2.killerTeams && p2.killerTeams.length > 0 ? (
                      (showAllKillerTeams ? p2.killerTeams : p2.killerTeams.slice(0, 5)).map((t: any, idx: number) => {
                        const maxCount = p2.killerTeams[0]?.count || 1;
                        const pct = Math.min(100, Math.round((t.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{t.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase">Grupo {t.grupo || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-red-500 italic block leading-none">{t.count}</span>
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
                    Jogadores individuais que cada atleta mais eliminou
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
                {/* P1 Victim Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <User size={14} /> Vítimas Favoritas de {p1.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p1.victimPlayers?.length || 0} jogadores abatidos
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p1.victimPlayers && p1.victimPlayers.length > 0 ? (
                      (showAllVictimPlayers ? p1.victimPlayers : p1.victimPlayers.slice(0, 5)).map((p: any, idx: number) => {
                        const maxCount = p1.victimPlayers[0]?.count || 1;
                        const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{p.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">{p.team || 'Sem Equipe'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-yellow-500 italic block leading-none">{p.count}</span>
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

                {/* P2 Victim Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <User size={14} /> Vítimas Favoritas de {p2.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p2.victimPlayers?.length || 0} jogadores abatidos
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p2.victimPlayers && p2.victimPlayers.length > 0 ? (
                      (showAllVictimPlayers ? p2.victimPlayers : p2.victimPlayers.slice(0, 5)).map((p: any, idx: number) => {
                        const maxCount = p2.victimPlayers[0]?.count || 1;
                        const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{p.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">{p.team || 'Sem Equipe'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-blue-400 italic block leading-none">{p.count}</span>
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
                    Jogadores individuais que mais abateram cada atleta
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
                {/* P1 Killer Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                      <User size={14} className="text-rose-500" /> Maiores Algozes de {p1.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p1.killerPlayers?.length || 0} jogadores algozes
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p1.killerPlayers && p1.killerPlayers.length > 0 ? (
                      (showAllKillerPlayers ? p1.killerPlayers : p1.killerPlayers.slice(0, 5)).map((p: any, idx: number) => {
                        const maxCount = p1.killerPlayers[0]?.count || 1;
                        const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{p.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">{p.team || 'Sem Equipe'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-rose-500 italic block leading-none">{p.count}</span>
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

                {/* P2 Killer Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                      <User size={14} className="text-rose-500" /> Maiores Algozes de {p2.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {p2.killerPlayers?.length || 0} jogadores algozes
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {p2.killerPlayers && p2.killerPlayers.length > 0 ? (
                      (showAllKillerPlayers ? p2.killerPlayers : p2.killerPlayers.slice(0, 5)).map((p: any, idx: number) => {
                        const maxCount = p2.killerPlayers[0]?.count || 1;
                        const pct = Math.min(100, Math.round((p.count / maxCount) * 100));
                        return (
                          <div key={idx} className="bg-black/50 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
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
                                <span className="text-xs font-black text-white uppercase italic truncate block">{p.name}</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase truncate block">{p.team || 'Sem Equipe'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="w-16 hidden sm:block bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-right min-w-[48px]">
                                <span className="text-sm font-black text-rose-500 italic block leading-none">{p.count}</span>
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
          {/* SEÇÃO: ANÁLISE DE ARMAS */}
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
                    Desempenho com armamentos individuais
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
                {/* Armas Favoritas (Mais Matam) */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-r from-yellow-500/10 via-black/40 to-amber-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
                        <Flame size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                          Armas que Mais Matam (Favoritas)
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Armas mais utilizadas por cada jogador para eliminar adversários
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
                    {/* P1 Killer Weapons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                          <Crosshair size={14} /> {p1.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.killerWeapons?.length || 0} armas</span>
                      </div>
                      <div className="space-y-2.5">
                        {p1.killerWeapons && p1.killerWeapons.length > 0 ? (
                          (showAllKillerWeapons ? p1.killerWeapons : p1.killerWeapons.slice(0, 5)).map((w: any, idx: number) => {
                            const max = p1.killerWeapons[0]?.count || 1;
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
                                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma Principal</span>
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

                    {/* P2 Killer Weapons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                          <Crosshair size={14} /> {p2.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.killerWeapons?.length || 0} armas</span>
                      </div>
                      <div className="space-y-2.5">
                        {p2.killerWeapons && p2.killerWeapons.length > 0 ? (
                          (showAllKillerWeapons ? p2.killerWeapons : p2.killerWeapons.slice(0, 5)).map((w: any, idx: number) => {
                            const max = p2.killerWeapons[0]?.count || 1;
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
                                    <span className="text-[8px] text-gray-500 font-bold uppercase block">Arma Principal</span>
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

                {/* Armas Algozes (Mais Morre / Para Quais Mais Morre) */}
                <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-r from-rose-500/10 via-black/40 to-red-500/10 px-6 md:px-8 py-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                        <Skull size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                          Armas Algozes (Mais Causam Mortes ao Jogador)
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Armas responsáveis pelo maior número de eliminações sofridas por cada atleta
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
                    {/* P1 Victim Weapons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className="text-xs font-black text-yellow-500 uppercase italic tracking-wider flex items-center gap-2">
                          <Skull size={14} className="text-rose-500" /> {p1.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{p1.victimWeapons?.length || 0} armas</span>
                      </div>
                      <div className="space-y-2.5">
                        {p1.victimWeapons && p1.victimWeapons.length > 0 ? (
                          (showAllVictimWeapons ? p1.victimWeapons : p1.victimWeapons.slice(0, 5)).map((w: any, idx: number) => {
                            const max = p1.victimWeapons[0]?.count || 1;
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

                    {/* P2 Victim Weapons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className="text-xs font-black text-blue-400 uppercase italic tracking-wider flex items-center gap-2">
                          <Skull size={14} className="text-rose-500" /> {p2.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{p2.victimWeapons?.length || 0} armas</span>
                      </div>
                      <div className="space-y-2.5">
                        {p2.victimWeapons && p2.victimWeapons.length > 0 ? (
                          (showAllVictimWeapons ? p2.victimWeapons : p2.victimWeapons.slice(0, 5)).map((w: any, idx: number) => {
                            const max = p2.victimWeapons[0]?.count || 1;
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
      ) : (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-12 text-center shadow-2xl">
          <AlertCircle size={48} className="text-yellow-500/50 mx-auto mb-4" />
          <h4 className="text-lg font-black text-white uppercase italic tracking-wider mb-2">
            Selecione Dois Jogadores para Comparar
          </h4>
          <p className="text-xs text-gray-400 font-bold max-w-md mx-auto">
            Escolha os atletas acima para visualizar o confronto direto, radar de atributos, presas favoritas, maiores algozes, análise de armas e histórico completo.
          </p>
        </div>
      )}
    </div>
  );
};
