import React, { useState } from 'react';
import { 
  User, ShieldAlert, Swords, Zap, Skull, Crown, Flame, Target, 
  Shield, Crosshair, Sparkles, ChevronDown, ChevronUp, AlertCircle, 
  TrendingUp, Award, Activity 
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

interface PlayerVsTeamCompareProps {
  comparePvt: {
    player: string;
    playerHab: string;
    team: string;
    teamMetric: 'total' | 'average';
  };
  setComparePvt: React.Dispatch<React.SetStateAction<{
    player: string;
    playerHab: string;
    team: string;
    teamMetric: 'total' | 'average';
  }>>;
  comparePvtData: {
    player: any;
    team: any;
    headToHead: {
      playerKills: number;
      teamKills: number;
      totalDuels: number;
      playerWinRate: string;
      victims: Array<{ name: string; count: number; img?: string }>;
      killers: Array<{ name: string; count: number; img?: string }>;
      recentEvents: Array<any>;
    } | null;
    share: {
      killsShare: string;
      damageShare: string;
      knocksShare: string;
    } | null;
  };
  allPlayersList: Array<{ name: string; img?: string; team?: string }>;
  allTeamsList: Array<{ name: string; img?: string; grupo?: string }>;
  activeHabs: string[];
}

export const PlayerVsTeamCompare: React.FC<PlayerVsTeamCompareProps> = ({
  comparePvt,
  setComparePvt,
  comparePvtData,
  allPlayersList = [],
  allTeamsList = [],
  activeHabs = []
}) => {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const { player, team, headToHead, share } = comparePvtData || {};
  const isAvgMetric = comparePvt?.teamMetric === 'average';

  // Radar data
  const radarData = player && team ? [
    {
      subject: 'Abates',
      Jogador: Math.min(100, (player.kills / (player.matches || 1)) * 30),
      Time: Math.min(100, (isAvgMetric ? (team.totalKills / (team.rosterCount || 4) / (team.matches || 1)) * 30 : (team.totalKills / (team.matches || 1)) * 10)),
      fullMark: 100
    },
    {
      subject: 'Dano',
      Jogador: Math.min(100, (player.damage / (player.matches || 1)) / 10),
      Time: Math.min(100, (isAvgMetric ? (team.totalDamage / (team.rosterCount || 4) / (team.matches || 1)) / 10 : (team.totalDamage / (team.matches || 1)) / 35)),
      fullMark: 100
    },
    {
      subject: 'K/D Ratio',
      Jogador: Math.min(100, parseFloat(player.kd) * 20),
      Time: Math.min(100, parseFloat(team.kd) * 20),
      fullMark: 100
    },
    {
      subject: 'Deitados',
      Jogador: Math.min(100, (player.knocks / (player.matches || 1)) * 30),
      Time: Math.min(100, (isAvgMetric ? (team.totalKnocks / (team.rosterCount || 4) / (team.matches || 1)) * 30 : (team.totalKnocks / (team.matches || 1)) * 10)),
      fullMark: 100
    },
    {
      subject: 'Constância',
      Jogador: Math.min(100, parseFloat(player.withKillsPct || '0')),
      Time: Math.min(100, parseFloat(isAvgMetric ? team.avgPerPlayer.withKillsPct : team.withKillsPct || '0')),
      fullMark: 100
    },
    {
      subject: 'Gelos & Util',
      Jogador: Math.min(100, (player.gelos / (player.matches || 1)) * 15),
      Time: Math.min(100, (isAvgMetric ? (team.totalGelos / (team.rosterCount || 4) / (team.matches || 1)) * 15 : (team.totalGelos / (team.matches || 1)) * 5)),
      fullMark: 100
    }
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SELETORES: Jogador Desafiante vs Time Rival */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card de Seleção: Jogador */}
        <div className="bg-[#1a1a1a] rounded-3xl border border-yellow-500/30 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <User size={14} /> JOGADOR DESAFIANTE
            </label>
            <select
              value={comparePvt.player}
              onChange={(e) => setComparePvt(prev => ({ ...prev, player: e.target.value }))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-yellow-500 outline-none transition-all mb-3 text-sm"
            >
              <option value="">Selecione um jogador...</option>
              {(allPlayersList || []).map(p => (
                <option key={p.name} value={p.name}>{p.name} {p.team ? `(${p.team})` : ''}</option>
              ))}
            </select>

            <select
              value={comparePvt.playerHab}
              onChange={(e) => setComparePvt(prev => ({ ...prev, playerHab: e.target.value }))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold focus:border-yellow-500 outline-none transition-all text-xs"
            >
              <option value="All">Com Qualquer Personagem / Habilidade</option>
              {(activeHabs || []).map(h => <option key={h} value={h}>Com {h}</option>)}
            </select>
          </div>

          {player && (
            <div className="mt-8 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-yellow-500/40 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.2)] mb-4 bg-black flex-shrink-0">
                  {player.playerImg ? (
                    <img src={player.playerImg} className="w-full h-full object-cover" alt={player.name} referrerPolicy="no-referrer" />
                  ) : player.teamImg ? (
                    <img src={player.teamImg} className="w-full h-full object-contain p-3" alt={player.team} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 bg-black"><User size={48} /></div>
                  )}
                </div>
                {player.teamImg && (
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-black/90 border-2 border-yellow-500/50 p-1 shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={player.teamImg} alt={player.team} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">{player.name}</h4>
              <span className="text-xs font-black text-yellow-500 uppercase tracking-widest mt-1">{player.team || 'Sem Equipe'}</span>

              {/* Badge de Personagem */}
              <div className="w-full mt-4 bg-black/50 p-3 rounded-2xl border border-yellow-500/20 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-1 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {player.activeHabImg ? (
                    <img src={player.activeHabImg} alt="Personagem" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <Zap size={22} className="text-yellow-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500">
                      {comparePvt.playerHab !== 'All' ? 'Personagem Filtrado' : 'Personagem Main'}
                    </span>
                    {comparePvt.playerHab === 'All' && player.topCharacter && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-black">
                        {player.topCharacter.pickRate}% uso
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-black text-white uppercase italic truncate">
                    {comparePvt.playerHab !== 'All' ? comparePvt.playerHab : (player.topCharacter?.name || 'Padrão')}
                  </span>
                  {comparePvt.playerHab === 'All' && player.characterPool.length > 1 && (
                    <span className="text-[9px] text-gray-400 truncate">
                      Pool: {player.characterPool.map((c: any) => `${c.name} (${c.matches}Q)`).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick stats badges */}
              <div className="grid grid-cols-4 gap-2 w-full mt-4 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Abates</span>
                  <span className="text-base font-black text-yellow-500 italic">{player.kills}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Mortes</span>
                  <span className="text-base font-black text-red-400">{player.deaths}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">K/D</span>
                  <span className="text-base font-black text-yellow-400">{player.kd}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Zeradas</span>
                  <span className="text-base font-black text-orange-400">{player.zeroKills}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card de Seleção: Time Rival */}
        <div className="bg-[#1a1a1a] rounded-3xl border border-blue-500/30 p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={14} /> TIME RIVAL / ADVERSÁRIO
              </label>
              <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-[9px] font-black uppercase">
                <button
                  onClick={() => setComparePvt(prev => ({ ...prev, teamMetric: 'total' }))}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    !isAvgMetric ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Total Equipe
                </button>
                <button
                  onClick={() => setComparePvt(prev => ({ ...prev, teamMetric: 'average' }))}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isAvgMetric ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Média / Jogador
                </button>
              </div>
            </div>

            <select
              value={comparePvt.team}
              onChange={(e) => setComparePvt(prev => ({ ...prev, team: e.target.value }))}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-blue-500 outline-none transition-all mb-3 text-sm"
            >
              <option value="">Selecione uma equipe...</option>
              {(allTeamsList || []).map(t => (
                <option key={t.name} value={t.name}>{t.name} (Grupo {t.grupo})</option>
              ))}
            </select>

            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-bold">Modo de Comparação:</span>
              <span className="font-black text-blue-400 uppercase tracking-wider">
                {isAvgMetric ? 'Média por Jogador da Equipe' : 'Total Acumulado de Toda a Equipe'}
              </span>
            </div>
          </div>

          {team && (
            <div className="mt-8 flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-blue-500/40 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-4 bg-black flex-shrink-0 flex items-center justify-center p-3">
                  {team.img ? (
                    <img src={team.img} className="w-full h-full object-contain" alt={team.name} referrerPolicy="no-referrer" />
                  ) : (
                    <Shield size={48} className="text-blue-500" />
                  )}
                </div>
                {team.grupo && team.grupo !== 'N/A' && (
                  <div className="absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full bg-blue-600 border border-white/20 shadow-lg text-[9px] font-black text-white uppercase">
                    GRP {team.grupo}
                  </div>
                )}
              </div>

              <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">{team.name}</h4>
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest mt-1">
                {team.rosterCount} Jogadores Registrados • {team.matches} Quedas
              </span>

              {/* Badges de Performance da Equipe */}
              <div className="w-full mt-4 bg-black/50 p-3 rounded-2xl border border-blue-500/20 flex items-center justify-around">
                <div className="flex items-center gap-2">
                  <Crown size={16} className="text-yellow-400" />
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-black block">Booyahs</span>
                    <span className="text-xs font-black text-yellow-400">{team.booyahs}x</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-blue-400" />
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-black block">Pontos Totais</span>
                    <span className="text-xs font-black text-blue-400">{team.points} PTS</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-black block">Média Queda</span>
                    <span className="text-xs font-black text-emerald-400">{team.avg} K/Q</span>
                  </div>
                </div>
              </div>

              {/* Quick stats badges */}
              <div className="grid grid-cols-4 gap-2 w-full mt-4 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
                    {isAvgMetric ? 'Kills Médias' : 'Kills Totais'}
                  </span>
                  <span className="text-base font-black text-blue-400 italic">
                    {isAvgMetric ? team.avgPerPlayer.kills : team.totalKills}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">
                    {isAvgMetric ? 'Mortes Méd.' : 'Mortes Tot.'}
                  </span>
                  <span className="text-base font-black text-red-400">
                    {isAvgMetric ? team.avgPerPlayer.deaths : team.totalDeaths}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">K/D Equipe</span>
                  <span className="text-base font-black text-blue-400">{team.kd}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Zeradas</span>
                  <span className="text-base font-black text-orange-400">{team.zeroKills}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: CONFRONTO DIRETO NO KILLFEED (HEAD-TO-HEAD) */}
      {player && team && headToHead && (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
            <div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.25em] block">HISTÓRICO NO KILLFEED</span>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2 mt-0.5">
                <Crosshair size={20} className="text-red-500" /> Confrontos Diretos ({player.name} vs {team.name})
              </h3>
            </div>
            <div className="px-4 py-2 bg-black/60 rounded-xl border border-white/10 flex items-center gap-3">
              <span className="text-xs font-black text-gray-400 uppercase">Total de Duelos no KillFeed:</span>
              <span className="text-sm font-black text-white">{headToHead.totalDuels}</span>
            </div>
          </div>

          {/* Placar Principal de Confrontos Diretos */}
          <div className="bg-gradient-to-r from-yellow-500/10 via-black to-blue-500/10 rounded-2xl border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                {player.playerImg ? (
                  <img src={player.playerImg} alt={player.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <User size={28} className="text-yellow-500" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block">Abates de {player.name}</span>
                <span className="text-4xl font-black text-yellow-400 italic">{headToHead.playerKills}</span>
                <span className="text-xs text-gray-400 font-bold block mt-0.5">Membros do {team.name} eliminados</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center px-6">
              <div className="text-2xl font-black text-gray-600 italic tracking-widest">VS</div>
              <div className="mt-2 text-xs font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                {headToHead.playerWinRate}% Taxa de Vitória nos Duelos
              </div>
            </div>

            <div className="flex items-center gap-4 text-center md:text-right flex-row-reverse md:flex-row">
              <div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Abates do {team.name}</span>
                <span className="text-4xl font-black text-blue-400 italic">{headToHead.teamKills}</span>
                <span className="text-xs text-gray-400 font-bold block mt-0.5">Vezes que abateram {player.name}</span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 p-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                {team.img ? (
                  <img src={team.img} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <Shield size={28} className="text-blue-400" />
                )}
              </div>
            </div>
          </div>

          {/* Listas Detalhadas: Vítimas do Jogador vs Quem Abateu o Jogador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vítimas do Time */}
            <div className="bg-black/40 rounded-2xl border border-yellow-500/20 p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-black text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                  <Skull size={14} /> Vítimas do {team.name}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">{headToHead.victims.length} jogadores abatidos</span>
              </div>

              {headToHead.victims.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-600 font-bold italic">
                  Nenhum jogador do {team.name} foi abatido por {player.name} nas partidas filtradas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {headToHead.victims.map((v, idx) => (
                    <div key={idx} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:border-yellow-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {v.img ? (
                            <img src={v.img} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User size={16} className="text-yellow-500" />
                          )}
                        </div>
                        <span className="text-xs font-black text-white uppercase italic">{v.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black text-xs">
                          {v.count}x Abatido
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Membros que Abateram o Jogador */}
            <div className="bg-black/40 rounded-2xl border border-blue-500/20 p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Crosshair size={14} /> Quem Abateu {player.name}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">{headToHead.killers.length} algozes</span>
              </div>

              {headToHead.killers.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-600 font-bold italic">
                  Nenhum integrante do {team.name} abateu {player.name} nas partidas filtradas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {headToHead.killers.map((k, idx) => (
                    <div key={idx} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center justify-between hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {k.img ? (
                            <img src={k.img} alt={k.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User size={16} className="text-blue-400" />
                          )}
                        </div>
                        <span className="text-xs font-black text-white uppercase italic">{k.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs">
                          {k.count}x Eliminou
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Histórico Recente de Duelos no KillFeed */}
          {headToHead.recentEvents.length > 0 && (
            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  REGISTRO COMPLETO DOS EVENTOS DE CONFRONTO ({headToHead.recentEvents.length})
                </span>
                {headToHead.recentEvents.length > 4 && (
                  <button
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400 uppercase flex items-center gap-1"
                  >
                    {showAllEvents ? <>Ver Menos <ChevronUp size={12} /></> : <>Ver Todos <ChevronDown size={12} /></>}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(showAllEvents ? headToHead.recentEvents : headToHead.recentEvents.slice(0, 4)).map((ev: any, idx: number) => {
                  const isPlayerKill = ev.type === 'player_kill';
                  return (
                    <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isPlayerKill ? 'bg-yellow-950/20 border-yellow-500/30' : 'bg-blue-950/20 border-blue-500/30'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          isPlayerKill ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          RD{ev.RD} Q{ev.Q}
                        </span>
                        <span className="font-black text-white truncate">{ev.PLAYER}</span>
                        <span className="text-[10px] text-red-500 font-black">➔</span>
                        <span className="font-bold text-gray-300 truncate">{ev.VITIMA}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-gray-400 flex-shrink-0">
                        {ev.ARMA && <span className="font-mono text-gray-300">{ev.ARMA}</span>}
                        {ev.SAFE && <span className="text-yellow-500">S{ev.SAFE}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 2: PODER DE IMPACTO & SHARE DO JOGADOR VS O TIME */}
      {player && team && share && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-yellow-500/20 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block mb-1">
                EQUIVALÊNCIA DE ABATES
              </span>
              <h4 className="text-2xl font-black text-white italic">{share.killsShare}%</h4>
              <p className="text-xs text-gray-400 mt-2">
                {player.name} sozinho acumula <strong>{player.kills}</strong> abates em relação aos <strong>{team.totalKills}</strong> de toda a equipe rival.
              </p>
            </div>
            <div className="w-full bg-black h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${Math.min(100, parseFloat(share.killsShare))}%` }} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">
                EQUIVALÊNCIA DE DANO
              </span>
              <h4 className="text-2xl font-black text-white italic">{share.damageShare}%</h4>
              <p className="text-xs text-gray-400 mt-2">
                {player.name} produziu <strong>{player.damage.toLocaleString()}</strong> de dano contra <strong>{team.totalDamage.toLocaleString()}</strong> da equipe.
              </p>
            </div>
            <div className="w-full bg-black h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, parseFloat(share.damageShare))}%` }} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl border border-purple-500/20 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">
                EQUIVALÊNCIA DE KNOCKS
              </span>
              <h4 className="text-2xl font-black text-white italic">{share.knocksShare}%</h4>
              <p className="text-xs text-gray-400 mt-2">
                <strong>{player.knocks}</strong> adversários deitados por {player.name} vs <strong>{team.totalKnocks}</strong> da equipe inteira.
              </p>
            </div>
            <div className="w-full bg-black h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, parseFloat(share.knocksShare))}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 3: RADAR COMPARATIVO DE ATRIBUTOS */}
      {player && team && (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl flex flex-col items-center">
          <div className="w-full flex justify-between items-center pb-4 border-b border-white/5 mb-6">
            <div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.25em] block">ANÁLISE POLIGONAL</span>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                Radar de Performance: {player.name} vs {isAvgMetric ? `Média de ${team.name}` : `Total de ${team.name}`}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-yellow-400">
                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> {player.name}
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> {team.name} ({isAvgMetric ? 'Média' : 'Total'})
              </span>
            </div>
          </div>

          <div className="w-full h-80 max-w-lg">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" stroke="#999" tick={{ fill: '#aaa', fontSize: 11, fontWeight: 'bold' }} />
                <PolarRadiusAxis stroke="#444" angle={30} domain={[0, 100]} />
                <Radar name={player.name} dataKey="Jogador" stroke="#eab308" fill="#eab308" fillOpacity={0.4} />
                <Radar name={team.name} dataKey="Time" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SEÇÃO 4: COMPARATIVO GERAL DE PERFORMANCE (BARRAS DE PROPORÇÃO) */}
      {player && team && (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="bg-black/40 px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.25em] block">MÉTRICAS DETALHADAS</span>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                Comparativo Completo de Atributos
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-black text-gray-400 uppercase px-2">Base do Time:</span>
              <button
                onClick={() => setComparePvt(prev => ({ ...prev, teamMetric: 'total' }))}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  !isAvgMetric ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Total Equipe
              </button>
              <button
                onClick={() => setComparePvt(prev => ({ ...prev, teamMetric: 'average' }))}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  isAvgMetric ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Média / Jogador
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {[
              {
                label: isAvgMetric ? 'Abates Médios (Jogador vs Média Jogador Time)' : 'Abates Totais (Jogador vs Total Equipe)',
                val1: player.kills,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.kills) : team.totalKills,
                display1: player.kills,
                display2: isAvgMetric ? `${team.avgPerPlayer.kills} (méd)` : team.totalKills
              },
              {
                label: 'Abates por Queda (Média K/Q)',
                val1: parseFloat(player.avg),
                val2: parseFloat(isAvgMetric ? team.avgPerPlayer.avg : team.avg),
                display1: player.avg,
                display2: isAvgMetric ? team.avgPerPlayer.avg : team.avg
              },
              {
                label: 'Mortes Registradas',
                val1: player.deaths,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.deaths) : team.totalDeaths,
                display1: player.deaths,
                display2: isAvgMetric ? `${team.avgPerPlayer.deaths} (méd)` : team.totalDeaths,
                lowerIsBetter: true
              },
              {
                label: 'K/D Ratio (Abates / Mortes)',
                val1: parseFloat(player.kd),
                val2: parseFloat(team.kd),
                display1: player.kd,
                display2: team.kd
              },
              {
                label: 'Quedas Zeradas (0 Abates)',
                val1: player.zeroKills,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.zeroKills) : team.zeroKills,
                display1: `${player.zeroKills} (${player.zeroKillsPct}%)`,
                display2: isAvgMetric ? `${team.avgPerPlayer.zeroKills} (${team.avgPerPlayer.zeroKillsPct}%)` : `${team.zeroKills} (${team.zeroKillsPct}%)`,
                lowerIsBetter: true
              },
              {
                label: 'Quedas com Abate',
                val1: player.withKills,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.withKills) : team.withKills,
                display1: `${player.withKills} (${player.withKillsPct}%)`,
                display2: isAvgMetric ? `${team.avgPerPlayer.withKills} (${team.avgPerPlayer.withKillsPct}%)` : `${team.withKills} (${team.withKillsPct}%)`
              },
              {
                label: isAvgMetric ? 'Dano Médio Acumulado' : 'Dano Total Acumulado',
                val1: player.damage,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.damage) : team.totalDamage,
                display1: player.damage.toLocaleString(),
                display2: isAvgMetric ? `${parseFloat(team.avgPerPlayer.damage).toLocaleString()} (méd)` : team.totalDamage.toLocaleString()
              },
              {
                label: 'Dano Médio por Queda',
                val1: parseFloat(player.avgDmg),
                val2: parseFloat(isAvgMetric ? team.avgPerPlayer.avgDmg : team.avgDmg),
                display1: player.avgDmg,
                display2: isAvgMetric ? team.avgPerPlayer.avgDmg : team.avgDmg
              },
              {
                label: 'Deitados (Knocks)',
                val1: player.knocks,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.knocks) : team.totalKnocks,
                display1: player.knocks,
                display2: isAvgMetric ? `${team.avgPerPlayer.knocks} (méd)` : team.totalKnocks
              },
              {
                label: 'Headshots (Tiros na Cabeça)',
                val1: player.hs,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.hs) : team.totalHs,
                display1: player.hs,
                display2: isAvgMetric ? `${team.avgPerPlayer.hs} (méd)` : team.totalHs
              },
              {
                label: 'Assistências',
                val1: player.assists,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.assists) : team.totalAssists,
                display1: player.assists,
                display2: isAvgMetric ? `${team.avgPerPlayer.assists} (méd)` : team.totalAssists
              },
              {
                label: 'Gelos Utilizados',
                val1: player.gelos,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.gelos) : team.totalGelos,
                display1: player.gelos,
                display2: isAvgMetric ? `${team.avgPerPlayer.gelos} (méd)` : team.totalGelos
              },
              {
                label: 'Gelos Destruídos',
                val1: player.gelosDestruidos,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.gelosDestruidos) : team.totalGelosDestruidos,
                display1: player.gelosDestruidos,
                display2: isAvgMetric ? `${team.avgPerPlayer.gelosDestruidos} (méd)` : team.totalGelosDestruidos
              },
              {
                label: 'Aliados Revividos',
                val1: player.aliadosRevividos,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.aliadosRevividos) : team.totalAliadosRevividos,
                display1: player.aliadosRevividos,
                display2: isAvgMetric ? `${team.avgPerPlayer.aliadosRevividos} (méd)` : team.totalAliadosRevividos
              },
              {
                label: 'Títulos de MVP',
                val1: player.mvp,
                val2: isAvgMetric ? parseFloat(team.avgPerPlayer.mvp) : team.totalMvp,
                display1: player.mvp,
                display2: isAvgMetric ? `${team.avgPerPlayer.mvp} (méd)` : team.totalMvp
              }
            ].map((stat, sIdx) => {
              const isP1Better = stat.lowerIsBetter ? (stat.val1 < stat.val2) : (stat.val1 > stat.val2);
              const isP2Better = stat.lowerIsBetter ? (stat.val2 < stat.val1) : (stat.val2 > stat.val1);
              const total = stat.val1 + stat.val2 || 1;

              return (
                <div key={sIdx} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span className={isP1Better ? 'text-yellow-500 font-black' : ''}>{stat.display1}</span>
                    <span className="text-white">{stat.label}</span>
                    <span className={isP2Better ? 'text-blue-500 font-black' : ''}>{stat.display2}</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-1000 ${isP1Better ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`}
                      style={{ width: `${(stat.val1 / total) * 100}%` }}
                    />
                    <div
                      className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`}
                      style={{ width: `${(stat.val2 / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 5: ELENCO DA EQUIPE RIVAL (ROSTER BREAKDOWN) */}
      {player && team && team.roster && (
        <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] block">ELENCO TITULAR & RESERVAS</span>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                Jogadores do {team.name} vs {player.name}
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-400">{team.roster.length} jogadores</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/10">
                  <th className="pb-3">Jogador</th>
                  <th className="pb-3 text-center">Quedas</th>
                  <th className="pb-3 text-center">Abates</th>
                  <th className="pb-3 text-center">Dano Total</th>
                  <th className="pb-3 text-center">K/D</th>
                  <th className="pb-3 text-center">Zeradas</th>
                  <th className="pb-3 text-center">Duelo Direto com {player.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {(team.roster || []).map((rPlayer: any, rIdx: number) => {
                  const victimEntry = headToHead?.victims.find(v => v.name.toUpperCase() === rPlayer.name.toUpperCase());
                  const killerEntry = headToHead?.killers.find(k => k.name.toUpperCase() === rPlayer.name.toUpperCase());
                  const killsOnRival = victimEntry?.count || 0;
                  const deathsToRival = killerEntry?.count || 0;

                  return (
                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {rPlayer.playerImg ? (
                            <img src={rPlayer.playerImg} alt={rPlayer.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User size={18} className="text-blue-400" />
                          )}
                        </div>
                        <span className="font-black text-white uppercase italic">{rPlayer.name}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-gray-300">{rPlayer.matches}</td>
                      <td className="py-3 text-center font-black text-blue-400 italic">{rPlayer.kills}</td>
                      <td className="py-3 text-center font-mono text-gray-400">{rPlayer.damage.toLocaleString()}</td>
                      <td className="py-3 text-center font-black text-yellow-500">{rPlayer.kd}</td>
                      <td className="py-3 text-center font-bold text-red-400">{rPlayer.zeroKills}</td>
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-white/10 text-xs font-black">
                          <span className="text-yellow-400">{killsOnRival}</span>
                          <span className="text-gray-500">x</span>
                          <span className="text-blue-400">{deathsToRival}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEÇÃO 6: ABATES POR MAPA & SAFE (JOGADOR VS TIME) */}
      {player && team && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Abates por Mapa */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Mapa</h3>
            </div>
            <div className="p-8 space-y-6">
              {Array.from(new Set([...Object.keys(player.mapKills || {}), ...Object.keys(team.mapKills || {})])).sort().map(mapName => {
                const val1 = player.mapKills?.[mapName] || 0;
                const val2 = isAvgMetric ? (team.mapKills?.[mapName] ? (team.mapKills[mapName] / (team.rosterCount || 4)).toFixed(1) : 0) : (team.mapKills?.[mapName] || 0);
                const isP1Better = Number(val1) > Number(val2);
                const isP2Better = Number(val2) > Number(val1);
                const total = Number(val1) + Number(val2) || 1;

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
                        style={{ width: `${(Number(val1) / total) * 100}%` }}
                      />
                      <div
                        className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`}
                        style={{ width: `${(Number(val2) / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abates por Safe */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="bg-black/40 px-8 py-6 border-b border-white/5 text-center">
              <h3 className="text-sm font-black text-yellow-500 uppercase tracking-[0.3em] italic">Abates por Safe</h3>
            </div>
            <div className="p-8 space-y-6">
              {Array.from(new Set([...Object.keys(player.safeKills || {}), ...Object.keys(team.safeKills || {})])).sort().map(safeName => {
                const val1 = player.safeKills?.[safeName] || 0;
                const val2 = isAvgMetric ? (team.safeKills?.[safeName] ? (team.safeKills[safeName] / (team.rosterCount || 4)).toFixed(1) : 0) : (team.safeKills?.[safeName] || 0);
                const isP1Better = Number(val1) > Number(val2);
                const isP2Better = Number(val2) > Number(val1);
                const total = Number(val1) + Number(val2) || 1;

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
                        style={{ width: `${(Number(val1) / total) * 100}%` }}
                      />
                      <div
                        className={`h-full transition-all duration-1000 ${isP2Better ? 'bg-blue-500' : 'bg-gray-800'}`}
                        style={{ width: `${(Number(val2) / total) * 100}%` }}
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
