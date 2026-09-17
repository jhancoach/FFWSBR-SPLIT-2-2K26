import React, { useState } from 'react';
import { 
  Zap, 
  Shield, 
  Trophy, 
  Swords, 
  Target, 
  Skull, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Crosshair,
  Award,
  Layers,
  Compass
} from 'lucide-react';
import { DropCombatAnalysis, SafeCombatSummary, PlayerCombatStats } from '../utils/dropCombatUtils';
import { PlayerLoadoutDetailed } from '../utils/characterUtils';

interface DropCombatDetailsViewProps {
  analysis: DropCombatAnalysis;
  playersLoadout: PlayerLoadoutDetailed[];
  ondeFechou?: string;
  mapa?: string;
  onSelectPlayer?: (playerName: string) => void;
  onSelectTeam?: (teamName: string) => void;
}

export const DropCombatDetailsView: React.FC<DropCombatDetailsViewProps> = ({
  analysis,
  playersLoadout,
  ondeFechou,
  mapa,
  onSelectPlayer,
  onSelectTeam,
}) => {
  const [activeTab, setActiveTab] = useState<'combat' | 'loadout'>('combat');
  const [expandedSafe, setExpandedSafe] = useState<number | null>(null);

  // Toggle expansão de detalhes de uma safe
  const toggleSafeExpand = (s: number) => {
    setExpandedSafe(prev => (prev === s ? null : s));
  };

  return (
    <div className="bg-[#0d0d10] rounded-2xl border border-yellow-500/20 p-4 sm:p-6 space-y-5 shadow-2xl animate-in fade-in duration-200">
      {/* 1. Header do Painel de Ações e Combate */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Auditoria de Ações & Combate
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase">
                Baseado no Kill Feed Oficial
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black uppercase italic text-white mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{analysis.teamName}</span>
              <span className="text-gray-500 text-xs font-normal">•</span>
              <span className="text-yellow-400 text-xs">RD {analysis.rd} • Q{analysis.q}</span>
              {mapa && (
                <>
                  <span className="text-gray-500 text-xs font-normal">•</span>
                  <span className="text-gray-300 text-xs font-bold">{mapa}</span>
                </>
              )}
              {ondeFechou && ondeFechou.trim() && ondeFechou !== 'N/A' && (
                <>
                  <span className="text-gray-500 text-xs font-normal">•</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black tracking-wider flex items-center gap-1">
                    <Compass size={11} className="text-amber-400" />
                    Fechou em: <strong className="text-white">{ondeFechou}</strong>
                  </span>
                </>
              )}
              {analysis.booyah && (
                <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black tracking-wider flex items-center gap-1">
                  <Trophy size={10} /> BOOYAH!
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Alternador de visualização interna */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 self-stretch md:self-auto justify-end">
          <button
            onClick={() => setActiveTab('combat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'combat'
                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crosshair size={13} /> Kills, Mortes & Safes
          </button>
          <button
            onClick={() => setActiveTab('loadout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'loadout'
                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap size={13} /> Loadout dos 4 Jogadores
          </button>
        </div>
      </div>

      {/* 2. Destaque Especial: Chegada ao End Game & Saldo de Eliminações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status de End Game */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          analysis.booyah 
            ? 'bg-gradient-to-br from-yellow-500/15 via-amber-500/5 to-transparent border-yellow-500/40 text-yellow-300'
            : analysis.isFullSquadAtEndGame
            ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/40 text-emerald-300'
            : analysis.reachedEndGame
            ? 'bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border-blue-500/40 text-blue-300'
            : 'bg-gradient-to-br from-red-500/15 via-rose-500/5 to-transparent border-red-500/30 text-rose-300'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                Chegada ao End Game (S4+)
              </span>
              {analysis.reachedEndGame ? (
                <ShieldCheck size={16} className={analysis.booyah ? 'text-yellow-400' : 'text-emerald-400'} />
              ) : (
                <AlertTriangle size={16} className="text-red-400" />
              )}
            </div>
            <span className="text-base sm:text-lg font-black italic uppercase block mt-1 leading-tight">
              {analysis.reachedEndGame ? (
                analysis.isFullSquadAtEndGame 
                  ? '4 Vivos (Full Squad)' 
                  : `${analysis.playersAliveAtEndGame} ${analysis.playersAliveAtEndGame === 1 ? 'Atleta Vivo' : 'Atletas Vivos'}`
              ) : (
                'Eliminado Antes'
              )}
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-75 mt-2 block">
            {analysis.reachedEndGame 
              ? `Chegou vivo no End Game • Safe Máx: ${analysis.maxSafeReached}`
              : `Caiu na Safe ${analysis.maxSafeReached} (${analysis.maxSafeReached <= 2 ? 'Early Game' : 'Mid Game'})`
            }
          </span>
        </div>

        {/* Total de Abates da Squad */}
        <div className="bg-black/50 p-4 rounded-xl border border-red-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-red-400">
                Abates Realizados (Kills)
              </span>
              <Target size={16} className="text-red-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black italic text-white">
                {analysis.totalKills}
              </span>
              <span className="text-[10px] font-black uppercase text-red-400">
                Eliminações
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-500 mt-2 block">
            Registrados no feed da queda
          </span>
        </div>

        {/* Total de Mortes Sofridas */}
        <div className="bg-black/50 p-4 rounded-xl border border-rose-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">
                Mortes Sofridas (Deaths)
              </span>
              <Skull size={16} className="text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black italic text-white">
                {analysis.totalDeaths}
              </span>
              <span className="text-[10px] font-black uppercase text-rose-400">
                Baixas
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-500 mt-2 block">
            {analysis.totalDeaths === 0 ? 'Nenhum jogador morreu!' : 'Eliminações sofridas pela squad'}
          </span>
        </div>

        {/* Saldo de K/D da Partida */}
        <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                Saldo & Colocação
              </span>
              <Award size={16} className="text-yellow-500" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black italic text-yellow-400">
                {analysis.kdRatio}
              </span>
              <span className="text-[10px] font-black uppercase text-gray-400">
                K/D • #{analysis.pos} LUGAR
              </span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-400 mt-2 flex items-center gap-1 flex-wrap">
            <span>Safe Máxima: Safe {analysis.maxSafeReached}</span>
            {ondeFechou && ondeFechou.trim() && ondeFechou !== 'N/A' && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Compass size={9} /> Fechou: {ondeFechou}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      {activeTab === 'combat' ? (
        <>
          {/* 3. Matriz e Timeline de Safes (Early, Mid e End Game) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Flame size={15} className="text-yellow-400" />
                <h5 className="text-xs font-black uppercase italic tracking-wider text-white">
                  Distribuição de Kills & Mortes por Safe (Linha do Tempo)
                </h5>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                Clique numa safe para inspecionar os combates
              </span>
            </div>

            {/* Grid horizontal de Safes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {analysis.safesTimeline.map(s => {
                const isEndGame = s.safe >= 4;
                const isSelected = expandedSafe === s.safe;
                const hasEvents = s.killsCount > 0 || s.deathsCount > 0;

                return (
                  <button
                    key={s.safe}
                    type="button"
                    onClick={() => toggleSafeExpand(s.safe)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-yellow-500/15 border-yellow-400 ring-1 ring-yellow-400/50'
                        : isEndGame
                        ? 'bg-[#151520] hover:bg-[#1a1a28] border-indigo-500/30'
                        : 'bg-[#141418] hover:bg-[#191920] border-white/5'
                    }`}
                  >
                    {/* Header da Safe */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isEndGame ? 'text-indigo-400' : 'text-gray-300'
                      }`}>
                        SAFE {s.safe}
                      </span>
                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.2 rounded ${
                        s.phaseKey === 'end' 
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                          : s.phaseKey === 'mid'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-white/5 text-gray-400'
                      }`}>
                        {s.phaseKey === 'end' ? 'End' : s.phaseKey === 'mid' ? 'Mid' : 'Early'}
                      </span>
                    </div>

                    {/* Contadores de Kills e Mortes na Safe */}
                    <div className="space-y-1 my-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                          <Target size={10} className="text-emerald-400" /> Kills:
                        </span>
                        <span className={`font-black italic ${s.killsCount > 0 ? 'text-emerald-400 font-bold' : 'text-gray-600'}`}>
                          {s.killsCount > 0 ? `+${s.killsCount}` : '0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-1">
                          <Skull size={10} className="text-rose-400" /> Mortes:
                        </span>
                        <span className={`font-black italic ${s.deathsCount > 0 ? 'text-rose-400 font-bold' : 'text-gray-600'}`}>
                          {s.deathsCount > 0 ? `-${s.deathsCount}` : '0'}
                        </span>
                      </div>
                    </div>

                    {/* Vivos após a safe */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-bold">
                      <span className="text-gray-500 uppercase">Vivos:</span>
                      <span className={`font-black uppercase ${
                        s.playersAliveAfterSafe === 4 
                          ? 'text-emerald-400' 
                          : s.playersAliveAfterSafe > 0 
                          ? 'text-yellow-400' 
                          : 'text-gray-600'
                      }`}>
                        {s.playersAliveAfterSafe}/4
                      </span>
                    </div>

                    {hasEvents && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Painel de Detalhes da Safe Selecionada (se houver expansão) */}
            {expandedSafe !== null && (() => {
              const safeSummary = analysis.safesTimeline.find(s => s.safe === expandedSafe);
              if (!safeSummary) return null;

              return (
                <div className="p-4 rounded-xl bg-black/80 border border-yellow-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase italic text-yellow-400 flex items-center gap-1.5">
                      <Crosshair size={14} /> Detalhes dos Eventos na Safe {safeSummary.safe} ({safeSummary.phase})
                    </span>
                    <button
                      onClick={() => setExpandedSafe(null)}
                      className="text-[10px] text-gray-400 hover:text-white uppercase font-bold cursor-pointer"
                    >
                      Fechar ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kills feitas na Safe */}
                    <div className="bg-[#121216] p-3 rounded-lg border border-emerald-500/20">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block mb-2">
                        Abates Feitos pela Equipe ({safeSummary.kills.length})
                      </span>
                      {safeSummary.kills.length > 0 ? (
                        <div className="space-y-1.5">
                          {safeSummary.kills.map((k, idx) => (
                            <div key={idx} className="text-xs flex items-center justify-between bg-black/50 p-2 rounded border border-white/5">
                              <span className="font-bold text-white flex items-center gap-1">
                                <span className="text-emerald-400 font-black">{k.killer}</span>
                                <span className="text-gray-500 text-[9px]">eliminou</span>
                                <span className="text-gray-300">{k.victim}</span>
                                {k.victimTeam && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/10 text-gray-400 uppercase">
                                    {k.victimTeam}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                {k.weapon}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic block">
                          Nenhum abate realizado nesta safe.
                        </span>
                      )}
                    </div>

                    {/* Mortes sofridas na Safe */}
                    <div className="bg-[#121216] p-3 rounded-lg border border-rose-500/20">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 block mb-2">
                        Baixas Sofridas pela Equipe ({safeSummary.deaths.length})
                      </span>
                      {safeSummary.deaths.length > 0 ? (
                        <div className="space-y-1.5">
                          {safeSummary.deaths.map((d, idx) => (
                            <div key={idx} className="text-xs flex items-center justify-between bg-black/50 p-2 rounded border border-white/5">
                              <span className="font-bold text-white flex items-center gap-1">
                                <span className="text-rose-400 font-black">{d.victim}</span>
                                <span className="text-gray-500 text-[9px]">caiu para</span>
                                <span className="text-gray-300">{d.killer}</span>
                                {d.killerTeam && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/10 text-gray-400 uppercase">
                                    {d.killerTeam}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                {d.weapon}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic block">
                          Nenhuma baixa sofrida nesta safe.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 4. Kills e Mortes de Cada Jogador da Squad */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={15} className="text-yellow-400" />
                <h5 className="text-xs font-black uppercase italic tracking-wider text-white">
                  Desempenho Individual: Kills & Mortes dos 4 Jogadores
                </h5>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                Detalhes de quem matou quem e quem morreu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {analysis.playersCombat.map((p, idx) => {
                return (
                  <div
                    key={idx}
                    className="bg-[#141419] p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all flex flex-col justify-between space-y-3"
                  >
                    {/* Topo do Jogador */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => onSelectPlayer && onSelectPlayer(p.player)}
                          className="flex items-center gap-2 text-left hover:text-yellow-400 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-900 border border-yellow-500/30 flex items-center justify-center text-[10px] text-yellow-500 font-black shrink-0">
                            {p.player.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black italic uppercase text-white group-hover:text-yellow-400 block truncate">
                              {p.player}
                            </span>
                            {p.funcao && (
                              <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest block">
                                {p.funcao}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Status de Sobrevivência */}
                        {p.isAlive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={10} /> Vivo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Skull size={10} /> Safe {p.lastDeathSafe || '?'}
                          </span>
                        )}
                      </div>

                      {/* Habilidade Ativa */}
                      {p.hab1 && (
                        <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2">
                          {p.hab1Img ? (
                            <img src={p.hab1Img} alt={p.hab1} className="w-5 h-5 object-contain rounded" />
                          ) : (
                            <Zap size={12} className="text-yellow-400" />
                          )}
                          <span className="text-[10px] font-black italic uppercase text-gray-200 truncate">
                            {p.hab1}
                          </span>
                        </div>
                      )}

                      {/* Resumo de Kills & Mortes do Jogador */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-[7px] font-black uppercase tracking-widest text-emerald-400 block">
                            KILLS
                          </span>
                          <span className="text-lg font-black italic text-emerald-400 leading-none mt-0.5 block">
                            {p.killsCount}
                          </span>
                        </div>
                        <div className="bg-black/60 p-2 rounded-lg border border-white/5 text-center">
                          <span className="text-[7px] font-black uppercase tracking-widest text-rose-400 block">
                            MORTES
                          </span>
                          <span className="text-lg font-black italic text-rose-400 leading-none mt-0.5 block">
                            {p.deathsCount}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Kills Feitas pelo Jogador */}
                      <div className="space-y-1 mb-2">
                        <span className="text-[8px] font-black uppercase tracking-wider text-gray-500 block">
                          Abates Realizados ({p.kills.length}):
                        </span>
                        {p.kills.length > 0 ? (
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {p.kills.map((k, kIdx) => (
                              <div key={kIdx} className="text-[10px] bg-black/40 p-1.5 rounded border border-white/5 flex items-center justify-between">
                                <span className="text-gray-200 truncate max-w-[110px]">
                                  🎯 {k.victim}
                                  {k.victimTeam && (
                                    <span className="text-[7px] text-gray-500 ml-1">({k.victimTeam})</span>
                                  )}
                                </span>
                                <span className="text-[8px] font-mono text-yellow-400 bg-yellow-500/10 px-1 py-0.2 rounded shrink-0">
                                  {k.weapon} • S{k.safe}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-600 italic block">
                            Nenhum abate registrado
                          </span>
                        )}
                      </div>

                      {/* Registro de Morte(s) Sofrida(s) */}
                      <div className="space-y-1 pt-2 border-t border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-gray-500 block">
                          Eliminação Sofrida:
                        </span>
                        {p.deaths.length > 0 ? (
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {p.deaths.map((d, dIdx) => (
                              <div key={dIdx} className="text-[10px] bg-rose-950/20 p-1.5 rounded border border-rose-900/30 flex items-center justify-between text-rose-300">
                                <span className="truncate max-w-[110px]">
                                  💀 por {d.killer}
                                  {d.killerTeam && (
                                    <span className="text-[7px] opacity-75 ml-1">({d.killerTeam})</span>
                                  )}
                                </span>
                                <span className="text-[8px] font-mono opacity-90 shrink-0">
                                  {d.weapon} • S{d.safe}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                            <ShieldCheck size={11} /> Sobreviveu até o fim!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status de End Game do Atleta */}
                    <div className="pt-2 border-t border-white/5">
                      <span className={`text-[8px] font-black uppercase tracking-widest block text-center py-1 rounded ${
                        p.aliveAtEndGame
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-gray-500'
                      }`}>
                        {p.aliveAtEndGame ? '✓ VIVO NO END GAME (S4+)' : '✗ Caiu antes da Safe 4'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Aba 2: Loadout Completo dos 4 Jogadores (Passivas, Pets, Itens) */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-yellow-400" />
            <h5 className="text-xs font-black uppercase italic tracking-wider text-white">
              Composição de Loadout: Ativa, Passivas, Pet e Item dos 4 Jogadores
            </h5>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {playersLoadout.map((p, idx) => (
              <div key={idx} className="bg-[#141418] p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div>
                    <span className="text-xs font-black italic uppercase text-white block">
                      {p.player}
                    </span>
                    {p.funcao && (
                      <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                        {p.funcao}
                      </span>
                    )}
                  </div>
                  {p.kills !== undefined && (
                    <span className="text-xs font-black italic text-red-400">
                      {p.kills} Kills
                    </span>
                  )}
                </div>

                {/* Ativa */}
                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-2">
                  {p.hab1Img ? (
                    <img src={p.hab1Img} alt={p.hab1} className="w-7 h-7 object-contain rounded bg-black/40 p-0.5" />
                  ) : (
                    <Zap size={14} className="text-yellow-400" />
                  )}
                  <div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-yellow-500 block">
                      HABILIDADE ATIVA
                    </span>
                    <span className="text-xs font-black italic uppercase text-white truncate block">
                      {p.hab1 || 'Sem Ativa'}
                    </span>
                  </div>
                </div>

                {/* Passivas */}
                <div className="space-y-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 block">
                    HABILIDADES PASSIVAS (H2, H3, H4)
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { name: p.hab2, img: p.hab2Img, label: 'H2' },
                      { name: p.hab3, img: p.hab3Img, label: 'H3' },
                      { name: p.hab4, img: p.hab4Img, label: 'H4' },
                    ].map((pass, pIdx) => (
                      <div key={pIdx} className="bg-black/50 p-1.5 rounded border border-white/5 flex flex-col items-center text-center">
                        {pass.img ? (
                          <img src={pass.img} alt={pass.name} className="w-5 h-5 object-contain mb-0.5" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-800 text-[8px] flex items-center justify-center text-gray-400 font-mono mb-0.5">
                            {pass.label}
                          </div>
                        )}
                        <span className="text-[7px] font-bold text-gray-300 uppercase truncate max-w-[50px] leading-tight">
                          {pass.name || '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pet & Item */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[8px]">
                  <div className="bg-black/40 p-1.5 rounded border border-white/5 flex items-center gap-1.5">
                    {p.petImg ? (
                      <img src={p.petImg} alt={p.pet} className="w-4 h-4 object-contain" />
                    ) : (
                      <span className="text-gray-500">Pet:</span>
                    )}
                    <span className="font-bold text-gray-300 uppercase truncate">
                      {p.pet || '-'}
                    </span>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded border border-white/5 flex items-center gap-1.5">
                    {p.itemImg ? (
                      <img src={p.itemImg} alt={p.item} className="w-4 h-4 object-contain" />
                    ) : (
                      <span className="text-gray-500">Item:</span>
                    )}
                    <span className="font-bold text-gray-300 uppercase truncate">
                      {p.item || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
