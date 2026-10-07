import React from 'react';
import { 
  Users, Target, Flame, Crosshair, Award, Crown, Star, 
  CheckCircle2, AlertTriangle, Zap, Activity, TrendingUp, 
  MapPin, BarChart3, Disc, Swords, Trophy, Shield, Skull,
  Calendar, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, LineChart, Line, PieChart, Pie, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { DashboardData, PlayerData, CharacterData } from '../../types';
import { PlayerRadarChart } from '../PlayerRadarChart';
import { PlayerKpmAnalysis } from '../PlayerKpmAnalysis';

interface PlayerSlidesSectionsProps {
  slideIndex: number;
  data: DashboardData;
  playerStats: any;
  rankings: any;
  playerWeapons: any[];
  dominantLoadout: any;
  playerLoadouts: any[];
  playerMapStats: any[];
  playerRoundStats: any[];
  playerDropStats: any[];
  playerSafeStats: any[];
  victimsAndKillers: { victims: any[]; killers: any[] };
  zeroStatsPlayer: any;
  playerMatchesList: any[];
  allRankingData: any[];
  playerKillContribution: string;
  playerTeamStats: any;
}

export const PlayerSlidesSections: React.FC<PlayerSlidesSectionsProps> = ({
  slideIndex,
  data,
  playerStats,
  rankings,
  playerWeapons,
  dominantLoadout,
  playerLoadouts,
  playerMapStats,
  playerRoundStats,
  playerDropStats,
  playerSafeStats,
  victimsAndKillers,
  zeroStatsPlayer,
  playerMatchesList,
  allRankingData,
  playerKillContribution,
  playerTeamStats,
}) => {
  switch (slideIndex) {
    // 1. CAPA DO ATLETA
    case 0:
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl bg-black/80 border-2 border-yellow-500/40 p-2 flex items-center justify-center overflow-hidden shadow-2xl">
                {playerStats.img ? (
                  <img src={playerStats.img} alt={playerStats.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Users size={96} className="text-yellow-400" />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-black uppercase tracking-wider">
                #{playerStats.rank} Ranking de Abates
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {playerStats.teamImg && (
                  <img src={playerStats.teamImg} alt={playerStats.team} className="w-5 h-5 object-contain" />
                )}
                <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
                  {playerStats.team || 'ATLETA COMPETITIVO'}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black italic uppercase text-white font-display tracking-tight leading-none">
                {playerStats.name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold uppercase">
                  Função: {playerStats.funcao || 'Atleta'}
                </span>
                <span className="text-xs text-gray-400">
                  {playerStats.matches} partidas disputadas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">ABATES</span>
                <span className="text-3xl font-black text-red-400 italic font-mono">{playerStats.kills}</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">eliminações</span>
              </div>
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">DANO TOTAL</span>
                <span className="text-3xl font-black text-white italic font-mono">{playerStats.damage.toLocaleString()}</span>
                <span className="text-[10px] text-yellow-400 font-bold block mt-0.5">pts de dano</span>
              </div>
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">% DO TIME</span>
                <span className="text-3xl font-black text-yellow-400 italic font-mono">{playerKillContribution}%</span>
                <span className="text-[10px] text-yellow-500 font-bold block mt-0.5">participação</span>
              </div>
            </div>
          </div>
        </div>
      );

    // 2. RAIO-X INDIVIDUAL & RATING
    case 1:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/50 p-5 rounded-2xl border border-red-500/20">
              <div className="flex items-center justify-between text-red-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Média de Kills</span>
                <Crosshair size={16} />
              </div>
              <span className="text-3xl font-black text-red-400 italic font-mono">{playerStats.avgKills}</span>
              <span className="text-[10px] text-gray-400 block mt-1">por queda</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-yellow-500/20">
              <div className="flex items-center justify-between text-yellow-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Dano Médio</span>
                <Flame size={16} />
              </div>
              <span className="text-3xl font-black text-white italic font-mono">{playerStats.avgDamage}</span>
              <span className="text-[10px] text-gray-400 block mt-1">por queda</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-blue-500/20">
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Taxa de HS</span>
                <Target size={16} />
              </div>
              <span className="text-3xl font-black text-blue-400 italic font-mono">{playerStats.hsRate}%</span>
              <span className="text-[10px] text-gray-400 block mt-1">tiros na cabeça</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-purple-500/20">
              <div className="flex items-center justify-between text-purple-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Deitados / Knocks</span>
                <Zap size={16} />
              </div>
              <span className="text-3xl font-black text-purple-400 italic font-mono">{playerStats.knocks}</span>
              <span className="text-[10px] text-gray-400 block mt-1">adversários derrubados</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Assistências</span>
              <span className="text-2xl font-black text-white font-mono">{playerStats.assists}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">MVPs Conquistados</span>
              <span className="text-2xl font-black text-yellow-400 font-mono">{playerStats.mvp} 👑</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Partidas</span>
              <span className="text-2xl font-black text-white font-mono">{playerStats.matches}</span>
            </div>
          </div>
        </div>
      );

    // 3. RECORDES & DESTAQUES COMPETITIVOS
    case 2:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-500/15 to-black/80 p-6 rounded-3xl border border-red-500/30 text-center space-y-2">
              <span className="text-xs font-black uppercase text-red-400 tracking-wider block">
                MAIOR QUANTIDADE DE ABATES EM 1 QUEDA
              </span>
              <span className="text-5xl font-black text-white font-mono italic">
                {Math.max(...(playerMatchesList.map(m => Number(m.Abates) || 0)), 0)}
              </span>
              <span className="text-xs text-gray-400 block">Recorde pessoal no campeonato</span>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/15 to-black/80 p-6 rounded-3xl border border-yellow-500/30 text-center space-y-2">
              <span className="text-xs font-black uppercase text-yellow-400 tracking-wider block">
                MAIOR DANO CAUSADO EM 1 QUEDA
              </span>
              <span className="text-5xl font-black text-yellow-400 font-mono italic">
                {Math.max(...(playerMatchesList.map(m => Number(m.Dano) || 0)), 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 block">Dano máximo em uma única partida</span>
            </div>

            <div className="bg-gradient-to-br from-purple-500/15 to-black/80 p-6 rounded-3xl border border-purple-500/30 text-center space-y-2">
              <span className="text-xs font-black uppercase text-purple-400 tracking-wider block">
                EFICIÊNCIA DE HEADSHOT (HS TOTAL)
              </span>
              <span className="text-5xl font-black text-purple-400 font-mono italic">
                {playerStats.hs}
              </span>
              <span className="text-xs text-gray-400 block">Eliminações com tiro na cabeça</span>
            </div>
          </div>
        </div>
      );

    // 4. RADAR HEXAGONAL DE ATRIBUTOS COMPETITIVOS
    case 3:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center min-h-[360px]">
            <PlayerRadarChart 
              p1Stats={playerStats} 
              p1Name={playerStats.name} 
              rankingData={allRankingData} 
              data={data}
              title="Raio-X Hexagonal dos Atributos do Atleta"
            />
          </div>
        </div>
      );

    // 5. MÉTRICAS GERAIS DE EFICIÊNCIA
    case 4:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Gelos Utilizados</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">{playerStats.gelos || 0}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Gelos Destruídos</span>
              <span className="text-2xl font-black text-purple-400 font-mono">{playerStats.gelosDestruidos || 0}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Vezes que Reviveu</span>
              <span className="text-2xl font-black text-green-400 font-mono">{playerStats.reviveu || 0}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Aliados Revividos</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{playerStats.aliadosRevividos || 0}</span>
            </div>
          </div>
        </div>
      );

    // 6. DESEMPENHO POR MAPA
    case 5:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerMapStats.map((m) => (
              <div key={m.map} className="bg-black/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white uppercase italic">{m.map}</span>
                  <span className="text-xs font-mono font-black text-red-400">{m.kills} kills</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(((m.kills || 0) / (playerStats.kills || 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                  <span>{m.matches} partidas</span>
                  <span className="text-yellow-400">{m.avgKills} kills/queda</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 7. ABATES POR RODADA
    case 6:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Produção Ofensiva por Rodada da Competição
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={playerRoundStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="round" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#12141c', borderColor: '#ffffff20', borderRadius: '12px' }} />
                  <Bar dataKey="kills" fill="#ef4444" radius={[4, 4, 0, 0]} name="Abates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

    // 8. ABATES POR QUEDA (Q1 A Q6)
    case 7:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2">
            Desempenho por Ordem de Queda no Dia de Jogo
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {playerDropStats.map((d) => (
              <div key={d.drop} className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                <span className="text-xs font-black text-yellow-400 uppercase block">{d.drop}</span>
                <span className="text-2xl font-black text-red-400 font-mono block">{d.kills}</span>
                <span className="text-[10px] text-gray-400 block">abates totais</span>
                <span className="text-[10px] text-white font-mono block pt-1">{d.matches} jogos</span>
              </div>
            ))}
          </div>
        </div>
      );

    // 9. ABATES POR SAFE / ONDE FECHOU
    case 8:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2">
            Zonas e Safes Mais Letais do Atleta
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
            {playerSafeStats.slice(0, 9).map((s, idx) => (
              <div key={idx} className="bg-black/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-white block truncate">{s.name || s.local || 'Local'}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{s.map || 'Mapa'}</span>
                </div>
                <span className="text-base font-black font-mono text-red-400">{s.kills} kills</span>
              </div>
            ))}
          </div>
        </div>
      );

    // 10. VÍTIMAS & ALGOZES (KILL FEED)
    case 9:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/60 p-5 rounded-3xl border border-emerald-500/20">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <Crosshair size={15} /> Maiores Vítimas (Quem Mais Eliminou)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {victimsAndKillers.victims.slice(0, 5).map((v, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-white block">{v.victim}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{v.team}</span>
                    </div>
                    <span className="text-sm font-mono font-black text-emerald-400">{v.count}x eliminado</span>
                  </div>
                ))}
                {victimsAndKillers.victims.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-xs">Sem registros de vítimas</div>
                )}
              </div>
            </div>

            <div className="bg-black/60 p-5 rounded-3xl border border-red-500/20">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                <Skull size={15} /> Principais Algozes (Quem Mais o Eliminou)
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {victimsAndKillers.killers.slice(0, 5).map((k, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-white block">{k.killer}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{k.team}</span>
                    </div>
                    <span className="text-sm font-mono font-black text-red-400">{k.count}x eliminou</span>
                  </div>
                ))}
                {victimsAndKillers.killers.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-xs">Sem registros de algozes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    // 11. ARSENAL & ARMAS UTILIZADAS
    case 10:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playerWeapons.slice(0, 8).map((w, idx) => (
              <div 
                key={w.name}
                className={`bg-black/50 p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  idx === 0 ? 'border-yellow-500/40' : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-10 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center shrink-0">
                    {w.img ? (
                      <img src={w.img} alt={w.name} className="w-full h-full object-contain" />
                    ) : (
                      <Crosshair size={18} className="text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-black text-white uppercase italic block truncate">
                      {w.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {w.tipo}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-yellow-400 font-mono block">
                    {w.count} abates
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {w.pct}% das kills do atleta
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 12. LOADOUT & HABILIDADES ATIVAS / PASSIVAS
    case 11:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {dominantLoadout ? (
            <div className="bg-black/60 p-6 rounded-3xl border border-white/10 space-y-6">
              <h4 className="text-sm font-black uppercase text-white tracking-wide">
                Configuração de Personagem & Habilidades
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-black/80 p-4 rounded-2xl border border-yellow-500/30 text-center">
                  <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider block mb-2">HABILIDADE ATIVA</span>
                  <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 mx-auto p-1 flex items-center justify-center mb-2">
                    {dominantLoadout.hab1Img ? (
                      <img src={dominantLoadout.hab1Img} alt={dominantLoadout.Hab1} className="w-full h-full object-contain" />
                    ) : (
                      <Zap size={24} className="text-yellow-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-white uppercase block">{dominantLoadout.Hab1 || 'N/A'}</span>
                </div>

                <div className="bg-black/80 p-4 rounded-2xl border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-2">PASSIVA 1</span>
                  <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 mx-auto p-1 flex items-center justify-center mb-2">
                    {dominantLoadout.hab2Img ? (
                      <img src={dominantLoadout.hab2Img} alt={dominantLoadout.Hab2} className="w-full h-full object-contain" />
                    ) : (
                      <Shield size={24} className="text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-white uppercase block">{dominantLoadout.Hab2 || 'N/A'}</span>
                </div>

                <div className="bg-black/80 p-4 rounded-2xl border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-2">PASSIVA 2</span>
                  <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 mx-auto p-1 flex items-center justify-center mb-2">
                    {dominantLoadout.hab3Img ? (
                      <img src={dominantLoadout.hab3Img} alt={dominantLoadout.Hab3} className="w-full h-full object-contain" />
                    ) : (
                      <Shield size={24} className="text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-white uppercase block">{dominantLoadout.Hab3 || 'N/A'}</span>
                </div>

                <div className="bg-black/80 p-4 rounded-2xl border border-white/10 text-center">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-2">PASSIVA 3</span>
                  <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 mx-auto p-1 flex items-center justify-center mb-2">
                    {dominantLoadout.hab4Img ? (
                      <img src={dominantLoadout.hab4Img} alt={dominantLoadout.Hab4} className="w-full h-full object-contain" />
                    ) : (
                      <Shield size={24} className="text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-black text-white uppercase block">{dominantLoadout.Hab4 || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs font-bold uppercase">
              Sem registros de habilidades para este atleta
            </div>
          )}
        </div>
      );

    // 13. HISTÓRICO DE PERSONAGENS
    case 12:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Histórico de Personagens & Variações de Loadout
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto custom-scrollbar">
            {playerLoadouts.map((loadout, idx) => (
              <div key={idx} className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-yellow-400 block">
                  Loadout #{idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase">{loadout.Hab1 || 'N/A'}</span>
                  <span className="text-[10px] text-gray-500">(Ativa)</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Passivas: {loadout.Hab2}, {loadout.Hab3}, {loadout.Hab4}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 14. QUEDAS ZERADAS DO ATLETA
    case 13:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 border border-red-500/30 p-6 rounded-3xl text-center space-y-2">
              <span className="text-xs font-black uppercase text-red-400 tracking-wider block">
                PARTIDAS COM 0 ABATES
              </span>
              <span className="text-5xl font-black text-red-400 font-mono italic">
                {zeroStatsPlayer?.zeroCount || 0}
              </span>
              <span className="text-xs text-gray-400 block">
                {zeroStatsPlayer?.zeroPct || '0'}% das partidas disputadas
              </span>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-3xl text-center space-y-2">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block">
                PARTIDAS COM ABATES CONVERTIDOS
              </span>
              <span className="text-5xl font-black text-emerald-400 font-mono italic">
                {playerStats.matches - (zeroStatsPlayer?.zeroCount || 0)}
              </span>
              <span className="text-xs text-gray-400 block">
                Taxa de conversão ofensiva
              </span>
            </div>
          </div>
        </div>
      );

    // 15. HISTÓRICO COMPLETO DE PARTIDAS
    case 14:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Histórico Recente de Partidas Disputadas
          </h4>
          <div className="bg-black/60 rounded-2xl border border-white/10 max-h-72 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-3">Rodada</th>
                  <th className="p-3">Queda</th>
                  <th className="p-3">Mapa</th>
                  <th className="p-3 text-center">Abates</th>
                  <th className="p-3 text-center">Dano</th>
                  <th className="p-3 text-center">HS</th>
                  <th className="p-3 text-center">MVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {playerMatchesList.map((m, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-3 font-bold text-white">RD {m.RD || 'N/A'}</td>
                    <td className="p-3 text-yellow-500 font-mono font-bold">Q{m.Q || 'N/A'}</td>
                    <td className="p-3 uppercase text-gray-300">{m.MAPA || 'N/A'}</td>
                    <td className="p-3 text-center font-mono font-black text-red-400">{m.Abates || 0}</td>
                    <td className="p-3 text-center font-mono text-gray-300">{m.Dano || 0}</td>
                    <td className="p-3 text-center font-mono text-blue-400">{m.HS || 0}</td>
                    <td className="p-3 text-center font-mono text-yellow-400">{Number(m.MVP) > 0 ? '👑' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    // 16. ANÁLISE DE KPM POR SAFE
    case 15:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PlayerKpmAnalysis 
            data={data} 
            selectedPlayer={playerStats.name} 
            onSelectPlayer={() => {}} 
            singlePlayerOnly={true}
            hideTopControls={true}
          />
        </div>
      );

    // 17. IMPACTO NA EQUIPE & SINERGIA
    case 16:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Participação nos Abates da Equipe ({playerStats.team})
              </h4>
              <span className="text-xs font-mono font-black text-yellow-400">
                {playerStats.kills} de {playerTeamStats?.abts || 1} kills totais
              </span>
            </div>

            <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/10 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(parseFloat(playerKillContribution) || 0, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-yellow-400">
                {playerKillContribution}% Participação Direta do Jogador
              </span>
              <span className="text-gray-400">
                {(100 - (parseFloat(playerKillContribution) || 0)).toFixed(1)}% Restante da Line-up
              </span>
            </div>
          </div>
        </div>
      );

    // 18. PAUTA & METAS DE DESENVOLVIMENTO
    case 17:
    default:
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-green-500/10 to-transparent p-6 rounded-3xl border border-green-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <CheckCircle2 size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Pontos Fortes do Atleta
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li>Alta conversão de dano em abates ({playerStats.kills} kills).</li>
                <li>Eficiência no duelo de curta e média distância.</li>
                <li>Excelente impacto na pontuação do time ({playerKillContribution}% de participação).</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-green-400 tracking-wider mt-4">
              ✓ Ponto de destaque
            </span>
          </div>

          <div className="bg-gradient-to-b from-amber-500/10 to-transparent p-6 rounded-3xl border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <AlertTriangle size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Oportunidades de Evolução
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li>Elevar índice de headshot nas trocas primárias (atual: {playerStats.hsRate}%).</li>
                <li>Gestão tática do uso de gelos em momentos de rush.</li>
                <li>Posicionamento sincronizado com os outros atletas da line.</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mt-4">
              ⚠ Ajustes individuais
            </span>
          </div>

          <div className="bg-gradient-to-b from-yellow-500/10 to-transparent p-6 rounded-3xl border border-yellow-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-yellow-400 mb-4">
                <Target size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Metas para Próximos Jogos
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li>Manter média de abates acima de 1.5 por queda.</li>
                <li>Buscar top 5 no ranking geral de abates da liga.</li>
                <li>Liderar as calls de combate nas entradas de safe.</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider mt-4">
              ★ Metas do próximo confronto
            </span>
          </div>
        </div>
      );
  }
};
