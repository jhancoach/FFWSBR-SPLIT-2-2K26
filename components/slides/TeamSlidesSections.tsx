import React from 'react';
import { 
  Shield, Users, Target, Flame, Crosshair, Award, 
  Crown, Star, CheckCircle2, AlertTriangle, Zap, Activity, 
  TrendingUp, MapPin, BarChart3, Disc, Swords, Trophy,
  Clock, Skull, ArrowUp, ArrowDown, Sparkles, Filter, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, LineChart, Line, PieChart, Pie, Legend 
} from 'recharts';
import { DashboardData, TeamStats, MatchDetails } from '../../types';
import { TeamKpmAnalysis } from '../TeamKpmAnalysis';

interface TeamSlidesSectionsProps {
  slideIndex: number;
  data: DashboardData;
  teamStats: any;
  teamMatchDetails: MatchDetails[];
  teamMapStats: any[];
  teamRoster: any[];
  teamWeapons: any[];
  teamDropTimeline: any[];
  zeroStatsTeam: any;
  safeStats: any[];
  lineups: any[];
  killfeedPhases: any;
  positionsSummary: any[];
  dropsSummary: any[];
}

const MAP_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'BERMUDA': { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  'PURGATÓRIO': { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'KALAHARI': { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  'NOVA TERRA': { color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'SOLARA': { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

export const TeamSlidesSections: React.FC<TeamSlidesSectionsProps> = ({
  slideIndex,
  data,
  teamStats,
  teamMatchDetails,
  teamMapStats,
  teamRoster,
  teamWeapons,
  teamDropTimeline,
  zeroStatsTeam,
  safeStats,
  lineups,
  killfeedPhases,
  positionsSummary,
  dropsSummary,
}) => {
  switch (slideIndex) {
    // 1. CAPA & IDENTIDADE
    case 0:
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl bg-black/80 border-2 border-yellow-500/40 p-4 flex items-center justify-center shadow-2xl">
                {teamStats.image ? (
                  <img src={teamStats.image} alt={teamStats.name} className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                ) : (
                  <Shield size={96} className="text-yellow-400" />
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-black uppercase tracking-wider">
                #{teamStats.rank} no Ranking Geral
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400 block mb-1">
                RELATÓRIO EXECUTIVO & ANÁLISE COMPLETA DO TIME
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black italic uppercase text-white font-display tracking-tight leading-none">
                {teamStats.name}
              </h1>
              <p className="text-gray-400 text-sm mt-2 max-w-xl font-medium leading-relaxed">
                Apresentação executiva integrando todas as 13 seções táticas: estilo por mapa, quedas zeradas, safes, formações de elenco, kill feed por fase e diretrizes para comissão técnica.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">PONTUAÇÃO TOTAL</span>
                <span className="text-3xl font-black text-white italic font-mono">{teamStats.pts}</span>
                <span className="text-[10px] text-yellow-400 font-bold block mt-0.5">pts acumulados</span>
              </div>
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">ABATES TOTAIS</span>
                <span className="text-3xl font-black text-red-400 italic font-mono">{teamStats.abts}</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">eliminações</span>
              </div>
              <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">VITÓRIAS (BOOYAHS)</span>
                <span className="text-3xl font-black text-yellow-400 italic font-mono">{teamStats.b}</span>
                <span className="text-[10px] text-yellow-500 font-bold block mt-0.5">Booyahs 👑</span>
              </div>
            </div>
          </div>
        </div>
      );

    // 2. RAIO-X DE PERFORMANCE
    case 1:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/50 p-5 rounded-2xl border border-yellow-500/20">
              <div className="flex items-center justify-between text-yellow-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Média de Pontos</span>
                <Flame size={16} />
              </div>
              <span className="text-3xl font-black text-white italic font-mono">{teamStats.avgPts || '0.0'}</span>
              <span className="text-[10px] text-gray-400 block mt-1">pontos por queda</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-red-500/20">
              <div className="flex items-center justify-between text-red-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Média de Abates</span>
                <Crosshair size={16} />
              </div>
              <span className="text-3xl font-black text-red-400 italic font-mono">{teamStats.avgAbts || '0.0'}</span>
              <span className="text-[10px] text-gray-400 block mt-1">kills por queda</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-blue-500/20">
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Quedas Jogadas</span>
                <Activity size={16} />
              </div>
              <span className="text-3xl font-black text-white italic font-mono">{teamStats.s || teamMatchDetails.length || 0}</span>
              <span className="text-[10px] text-gray-400 block mt-1">partidas disputadas</span>
            </div>

            <div className="bg-black/50 p-5 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider">Taxa de Booyah</span>
                <Trophy size={16} />
              </div>
              <span className="text-3xl font-black text-emerald-400 italic font-mono">
                {teamStats.s > 0 ? `${((teamStats.b / teamStats.s) * 100).toFixed(0)}%` : '0%'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">aproveitamento de vitória</span>
            </div>
          </div>

          {/* Distribuição dos Pontos (Abates vs Posição) */}
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Origem da Pontuação: Combate vs Posicionamento
              </h4>
              <span className="text-xs font-bold text-gray-400">
                {teamStats.abts} pts de kills | {teamStats.ptsc} pts de posição
              </span>
            </div>

            <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/10 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-l-full transition-all duration-700"
                style={{ width: `${teamStats.percentAbts || 50}%` }}
                title={`Abates: ${teamStats.percentAbts}%`}
              />
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-r-full transition-all duration-700"
                style={{ width: `${teamStats.percentPos || 50}%` }}
                title={`Posicionamento: ${teamStats.percentPos}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-red-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                {teamStats.percentAbts}% Abates (Agressividade)
              </span>
              <span className="text-yellow-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                {teamStats.percentPos}% Posição (Sobrevivência)
              </span>
            </div>
          </div>
        </div>
      );

    // 3. ESTILOS POR MAPA (MAPSTYLES)
    case 2:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMapStats.map((m, idx) => {
              const cfg = MAP_CONFIG[m.map] || { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
              return (
                <div 
                  key={m.map}
                  className={`p-5 rounded-2xl border transition-all ${
                    idx === 0 
                      ? 'bg-gradient-to-br from-yellow-500/15 via-black/60 to-black/80 border-yellow-500/40 shadow-lg shadow-yellow-500/10' 
                      : 'bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black uppercase text-white italic tracking-wide">
                      {m.map}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-black uppercase">
                        ★ Maior Eficiência
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Pontos Totais</span>
                      <span className="text-xl font-black text-white font-mono">{m.pts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Média / Queda</span>
                      <span className="text-xl font-black text-yellow-400 font-mono">{m.avgPts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Abates</span>
                      <span className="text-base font-black text-red-400 font-mono">{m.kills}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Booyahs</span>
                      <span className="text-base font-black text-yellow-400 font-mono">{m.booyahs} 👑</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    // 4. QUEDAS ZERADAS (ANÁLISE CRÍTICA)
    case 3:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-950/30 border border-red-500/30 p-5 rounded-2xl text-center">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1">
                TOTAL DE QUEDAS ZERADAS (0 PTS)
              </span>
              <span className="text-4xl font-black text-red-400 font-mono italic">
                {zeroStatsTeam?.totalZeroPts || 0}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                {zeroStatsTeam?.pctZeradas || '0'}% do total de partidas disputadas
              </span>
            </div>

            <div className="bg-black/60 border border-white/10 p-5 rounded-2xl text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                QUEDAS COM ZERO ABATES (0 KILLS)
              </span>
              <span className="text-4xl font-black text-amber-400 font-mono italic">
                {zeroStatsTeam?.totalZeroKills || 0}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                partidas sem abater adversários
              </span>
            </div>

            <div className="bg-black/60 border border-white/10 p-5 rounded-2xl text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                ZERADAS ABSOLUTAS (0 PTS E 0 KILLS)
              </span>
              <span className="text-4xl font-black text-rose-500 font-mono italic">
                {zeroStatsTeam?.totalZeradasAbsoluta || 0}
              </span>
              <span className="text-[10px] text-gray-400 block mt-1">
                eliminações prematuras sem pontuação
              </span>
            </div>
          </div>

          {/* Histórico recente de quedas zeradas */}
          <div className="bg-black/60 p-5 rounded-3xl border border-white/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
              Detalhamento das Quedas Críticas
            </h4>
            {zeroStatsTeam?.allZeradasList && zeroStatsTeam.allZeradasList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                {zeroStatsTeam.allZeradasList.slice(0, 8).map((z: any, idx: number) => (
                  <div key={idx} className="bg-black/70 p-3 rounded-xl border border-red-500/20 text-xs">
                    <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold">
                      <span>RD {z.RD || 'N/A'}</span>
                      <span className="text-yellow-500">Q{z.Q || 'N/A'}</span>
                    </div>
                    <span className="font-black text-white uppercase block mt-1 truncate">{z.MAPA || 'N/A'}</span>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-red-400 font-bold">{z.ABTS || 0} kills</span>
                      <span className="text-gray-400">{z.POS ? `${z.POS}º lugar` : '0 pts'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-emerald-400 text-xs font-black uppercase">
                ✓ Nenhuma queda zerada registrada para esta equipe!
              </div>
            )}
          </div>
        </div>
      );

    // 5. PONTOS & ABATES POR RODADA / QUEDA
    case 4:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-black uppercase text-white tracking-wide">
                  Evolução dos Pontos e Abates por Partida
                </h4>
                <span className="text-[11px] text-gray-400">
                  Desempenho sequencial de cada queda disputada
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Pontos
                </span>
                <span className="flex items-center gap-1.5 text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Abates
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamDropTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="drop" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12141c', borderColor: '#ffffff20', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="pts" fill="#eab308" radius={[4, 4, 0, 0]} name="Pontos" />
                  <Bar dataKey="kills" fill="#ef4444" radius={[4, 4, 0, 0]} name="Abates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

    // 6. MELHORES & PIORES SAFES POR MAPA (ONDE FECHOU)
    case 5:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/60 p-5 rounded-3xl border border-emerald-500/20">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <MapPin size={15} /> Locais de Safe com Maior Pontuação
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {safeStats.slice(0, 5).map((s, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-white block">{s.name || s.local || 'Local N/A'}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{s.map || 'Mapa'} • {s.count || s.matches || 1} aparições</span>
                    </div>
                    <span className="text-sm font-mono font-black text-emerald-400">{s.pts || s.kills || 0} pts</span>
                  </div>
                ))}
                {safeStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-xs">Sem registros de safe filtrados</div>
                )}
              </div>
            </div>

            <div className="bg-black/60 p-5 rounded-3xl border border-red-500/20">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle size={15} /> Safes com Menor Rendimento
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {safeStats.slice(-5).reverse().map((s, idx) => (
                  <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-white block">{s.name || s.local || 'Local N/A'}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{s.map || 'Mapa'}</span>
                    </div>
                    <span className="text-sm font-mono font-black text-red-400">{s.pts || 0} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    // 7. ABATES & MVP POR MAPA
    case 6:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMapStats.map((m) => (
              <div key={m.map} className="bg-black/60 p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white uppercase italic">{m.map}</span>
                  <span className="text-xs font-mono font-black text-red-400">{m.kills} abates</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full rounded-full" 
                    style={{ width: `${Math.min(((m.kills || 0) / (teamStats.abts || 1)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                  <span>{m.drops} partidas</span>
                  <span className="text-yellow-400">{m.booyahs} Booyahs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 8. FORMAÇÕES (LINEUPS)
    case 7:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Formações Escaladas pela Equipe
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto custom-scrollbar">
            {lineups.length > 0 ? (
              lineups.map((l, idx) => (
                <div key={idx} className="bg-black/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-yellow-400 block mb-1">
                      Lineup #{idx + 1} ({l.matches || 1} quedas disputadas)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(l.players || []).map((p: string, pIdx: number) => (
                        <span key={pIdx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-bold text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-sm font-black text-yellow-400 font-mono block">{l.pts || 0} pts</span>
                    <span className="text-[10px] text-red-400 font-mono">{l.kills || 0} kills</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-gray-500 text-xs">
                Lineup padrão ativa em todas as rodadas
              </div>
            )}
          </div>
        </div>
      );

    // 9. FASES DO JOGO (KILL FEED POR SAFE)
    case 8:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((safeNum) => {
              const kills = killfeedPhases?.killsBySafe?.[safeNum] || 0;
              const deaths = killfeedPhases?.deathsBySafe?.[safeNum] || 0;
              return (
                <div key={safeNum} className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                  <span className="text-[10px] font-black uppercase text-yellow-400 block">SAFE {safeNum}</span>
                  <div className="flex justify-around items-center pt-1">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Kills</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">{kills}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Mortes</span>
                      <span className="text-xl font-black text-rose-500 font-mono">{deaths}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    // 10. HISTÓRICO DE PERFORMANCE & EVOLUÇÃO
    case 9:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black/60 p-6 rounded-3xl border border-white/10">
            <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
              Curva de Acúmulo de Pontos
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={teamDropTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="drop" stroke="#6b7280" fontSize={10} />
                  <YAxis stroke="#6b7280" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12141c', borderColor: '#ffffff20', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="pts" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 4 }} name="Pontos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

    // 11. DOMÍNIO TERRITORIAL (MAPAS)
    case 10:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/60 p-6 rounded-3xl border border-white/10">
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-4">
                Participação dos Mapas na Pontuação
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={teamMapStats} dataKey="pts" nameKey="map" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                      {teamMapStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MAP_CONFIG[entry.map]?.color || '#eab308'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#12141c', borderColor: '#ffffff20', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-black/60 p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400 mb-3">
                Destaques por Mapa
              </h4>
              <ul className="space-y-3 text-xs text-gray-300">
                {teamMapStats.map((m) => (
                  <li key={m.map} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-black uppercase">{m.map}</span>
                    <span className="font-mono text-yellow-400 font-bold">{m.pts} pts ({m.avgPts} pts/queda)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );

    // 12. DISTRIBUIÇÃO POR SAFE / KPM
    case 11:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <TeamKpmAnalysis data={data} selectedTeam={teamStats.name} onSelectTeam={() => {}} />
        </div>
      );

    // 13. SUMÁRIO DE POSIÇÕES (1º ao 12º LUGAR)
    case 12:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2">
            Frequência de Posições (1º ao 12º Lugar)
          </h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {positionsSummary.map((pos) => (
              <div 
                key={pos.position} 
                className={`p-3 rounded-xl border text-center ${
                  pos.position === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 font-black' :
                  pos.position <= 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  'bg-black/50 border-white/10 text-gray-300'
                }`}
              >
                <span className="text-[10px] font-bold block">{pos.position}º</span>
                <span className="text-lg font-black font-mono">{pos.count}</span>
                <span className="text-[8px] text-gray-500 block uppercase">vezes</span>
              </div>
            ))}
          </div>
        </div>
      );

    // 14. PERFORMANCE POR QUEDA (DROP 1 A DROP 6)
    case 13:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-2">
            Desempenho por Ordem da Partida no Dia (Queda 1 a 6)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {dropsSummary.map((d) => (
              <div key={d.drop} className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center space-y-1">
                <span className="text-xs font-black text-yellow-400 uppercase block">{d.drop}</span>
                <span className="text-2xl font-black text-white font-mono block">{d.avgPts}</span>
                <span className="text-[10px] text-gray-400 block">pts média</span>
                <span className="text-[10px] text-red-400 font-mono block pt-1">{d.kills} kills</span>
              </div>
            ))}
          </div>
        </div>
      );

    // 15. DESEMPENHO DO ELENCO (ROSTER)
    case 14:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamRoster.slice(0, 8).map((player, idx) => (
              <div 
                key={player.name}
                className={`bg-black/60 p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  idx === 0 
                    ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/10' 
                    : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-black border border-white/10 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                      {player.img ? (
                        <img src={player.img} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Users size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black uppercase text-white truncate italic">
                          {player.name}
                        </h4>
                        {idx === 0 && <Crown size={12} className="text-yellow-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">
                        {player.funcao || 'Atleta'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Abates</span>
                      <span className="text-lg font-black text-red-400 font-mono">{player.kills}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Dano</span>
                      <span className="text-lg font-black text-white font-mono">{player.damage.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Participação nas Kills</span>
                  <span className="text-yellow-400 font-mono font-black">
                    {teamStats.abts > 0 ? `${((player.kills / teamStats.abts) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 16. ARSENAL & ARMAS
    case 15:
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamWeapons.map((w) => (
              <div 
                key={w.name}
                className="bg-black/50 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4"
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
                    {w.pct}% das kills
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    // 17. PAUTA DA REUNIÃO
    case 16:
    default:
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-green-500/10 to-transparent p-6 rounded-3xl border border-green-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <CheckCircle2 size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Pontos Fortes Consolidados
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li><strong>Letalidade em Combate:</strong> A equipe converteu {teamStats.abts} abates no total.</li>
                <li><strong>Força em {teamMapStats[0]?.map || 'Bermuda'}:</strong> Maior média de pontos com {teamMapStats[0]?.avgPts || '0'} pts/queda.</li>
                <li><strong>Sinergia de Roster:</strong> Consistência de abates e apoio nas trocas de tiro.</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-green-400 tracking-wider mt-4">
              ✓ Manter padrão de jogo
            </span>
          </div>

          <div className="bg-gradient-to-b from-amber-500/10 to-transparent p-6 rounded-3xl border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-4">
                <AlertTriangle size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Ajustes Prioritários
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li><strong>Evitar Quedas Zeradas:</strong> {zeroStatsTeam?.totalZeroPts || 0} partidas sem pontuar exigem atenção redobrada no early game.</li>
                <li><strong>Controle de Rotação:</strong> Entrada antecipada nas safes de meio e fim de mapa.</li>
                <li><strong>Gestão de Recursos:</strong> Economia de gelos e posicionamento compacto.</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider mt-4">
              ⚠ Foco em correções táticas
            </span>
          </div>

          <div className="bg-gradient-to-b from-yellow-500/10 to-transparent p-6 rounded-3xl border border-yellow-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-yellow-400 mb-4">
                <Target size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Diretrizes para a Próxima Rodada
                </h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-3 list-disc list-inside leading-relaxed">
                <li><strong>Meta de Pontos:</strong> Buscar média de 8+ pontos por partida.</li>
                <li><strong>Foco em Booyah:</strong> Priorizar domínio de centro de safe nos mapas de maior aproveitamento.</li>
                <li><strong>Comunicação Ativa:</strong> Reforçar chamadas rápidas em trocas de time contra time.</li>
              </ul>
            </div>
            <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider mt-4">
              ★ Meta da comissão técnica
            </span>
          </div>
        </div>
      );
  }
};
