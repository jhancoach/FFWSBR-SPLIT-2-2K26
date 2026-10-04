import React, { useState, useMemo } from 'react';
import { 
  Flame, Shield, Zap, Sparkles, Search, ArrowUpDown, 
  Users, Trophy, ChevronRight, Activity, Filter, Eye, X, Crown, Layers, User
} from 'lucide-react';
import { CharacterData, DashboardData } from '../types';
import { findDimImg } from '../utils/skillImages';
import { findTeamLogo } from '../utils/teamUtils';

interface CharacterSkillsFrequencyProps {
  data: DashboardData;
  filters?: {
    rodada?: string[];
    queda?: string[];
    team?: string[];
    map?: string[];
  };
}

export type SkillSlot = 'ALL' | 'HAB1' | 'HAB2' | 'HAB3' | 'HAB4';

export interface CompetitorUsage {
  playerName: string;
  playerImg?: string;
  teamName: string;
  teamLogo?: string;
  picks: number;
}

export interface SkillFrequencyItem {
  name: string;
  img?: string;
  slotType: 'ATIVA' | 'PASSIVA' | 'MISTA';
  slotsUsed: {
    hab1: number;
    hab2: number;
    hab3: number;
    hab4: number;
  };
  totalPicks: number;
  pickRate: number; // 0 - 100%
  competitors: CompetitorUsage[];
}

export const CharacterSkillsFrequency: React.FC<CharacterSkillsFrequencyProps> = ({ data, filters }) => {
  const [selectedSlot, setSelectedSlot] = useState<SkillSlot>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'picks-desc' | 'picks-asc' | 'name-asc'>('picks-desc');
  const [selectedCharModal, setSelectedCharModal] = useState<SkillFrequencyItem | null>(null);

  const normalize = (val: string | undefined | null) => (val || '').trim().toUpperCase();

  // Filter raw characters by page filters (RD, Q, Team, Map) if provided
  const filteredCharacters = useMemo(() => {
    const list = data.characters || [];
    if (!filters) return list;

    return list.filter(c => {
      if (filters.team && filters.team.length > 0) {
        if (!filters.team.some(t => normalize(t) === normalize(c.Time))) return false;
      }
      if (filters.map && filters.map.length > 0) {
        if (!filters.map.some(m => normalize(m) === normalize(c.Mapa))) return false;
      }
      if (filters.rodada && filters.rodada.length > 0) {
        const cRd = c.Rd || c.RD || '';
        const matchRd = filters.rodada.some(r => {
          const normR = normalize(r).replace(/\D/g, '');
          const normC = normalize(cRd).replace(/\D/g, '');
          return normR === normC || normalize(r) === normalize(cRd);
        });
        if (!matchRd) return false;
      }
      if (filters.queda && filters.queda.length > 0) {
        const cQ = c.Q || '';
        const matchQ = filters.queda.some(q => {
          const normQ = normalize(q).replace(/\D/g, '');
          const normCQ = normalize(cQ).replace(/\D/g, '');
          return normQ === normCQ || normalize(q) === normalize(cQ);
        });
        if (!matchQ) return false;
      }
      return true;
    });
  }, [data.characters, filters]);

  const totalLoadouts = filteredCharacters.length || 1;

  // Aggregate frequency for all skills across Hab1, Hab2, Hab3, Hab4
  const aggregatedSkills = useMemo(() => {
    const map = new Map<string, {
      name: string;
      slots: { hab1: number; hab2: number; hab3: number; hab4: number };
      competitorsMap: Map<string, { playerName: string; teamName: string; picks: number }>;
    }>();

    const addSkillPick = (
      skillNameRaw: string | undefined, 
      slot: 'hab1' | 'hab2' | 'hab3' | 'hab4', 
      playerName: string, 
      teamName: string
    ) => {
      const cleanName = (skillNameRaw || '').trim();
      if (!cleanName || cleanName === '-' || cleanName.toUpperCase() === 'N/A' || cleanName.toUpperCase() === 'PADRÃO') {
        return;
      }
      const key = cleanName.toUpperCase();

      if (!map.has(key)) {
        map.set(key, {
          name: cleanName,
          slots: { hab1: 0, hab2: 0, hab3: 0, hab4: 0 },
          competitorsMap: new Map()
        });
      }

      const item = map.get(key)!;
      item.slots[slot] += 1;

      // Track competitor pick
      if (playerName && playerName.trim()) {
        const pKey = normalize(playerName);
        if (!item.competitorsMap.has(pKey)) {
          item.competitorsMap.set(pKey, {
            playerName: playerName.trim(),
            teamName: teamName.trim(),
            picks: 0
          });
        }
        item.competitorsMap.get(pKey)!.picks += 1;
      }
    };

    filteredCharacters.forEach(c => {
      const player = c.Player || '';
      const team = c.Time || '';
      addSkillPick(c.Hab1, 'hab1', player, team);
      addSkillPick(c.Hab2, 'hab2', player, team);
      addSkillPick(c.Hab3, 'hab3', player, team);
      addSkillPick(c.Hab4, 'hab4', player, team);
    });

    const result: SkillFrequencyItem[] = [];

    map.forEach(val => {
      let relevantPicks = 0;
      if (selectedSlot === 'ALL') {
        relevantPicks = val.slots.hab1 + val.slots.hab2 + val.slots.hab3 + val.slots.hab4;
      } else if (selectedSlot === 'HAB1') {
        relevantPicks = val.slots.hab1;
      } else if (selectedSlot === 'HAB2') {
        relevantPicks = val.slots.hab2;
      } else if (selectedSlot === 'HAB3') {
        relevantPicks = val.slots.hab3;
      } else if (selectedSlot === 'HAB4') {
        relevantPicks = val.slots.hab4;
      }

      if (relevantPicks === 0) return;

      // Find image from dimension tables
      let img: string | undefined = undefined;
      if (val.slots.hab1 > 0) {
        img = findDimImg(data.hab1, val.name);
      }
      if (!img && val.slots.hab2 > 0) {
        img = findDimImg(data.hab2, val.name);
      }
      if (!img && val.slots.hab3 > 0) {
        img = findDimImg(data.hab3, val.name);
      }
      if (!img && val.slots.hab4 > 0) {
        img = findDimImg(data.hab4, val.name);
      }
      if (!img) {
        img = findDimImg([...(data.hab1 || []), ...(data.hab2 || []), ...(data.hab3 || []), ...(data.hab4 || [])], val.name);
      }

      // Slot type classification
      let slotType: 'ATIVA' | 'PASSIVA' | 'MISTA' = 'PASSIVA';
      if (val.slots.hab1 > 0 && (val.slots.hab2 === 0 && val.slots.hab3 === 0 && val.slots.hab4 === 0)) {
        slotType = 'ATIVA';
      } else if (val.slots.hab1 > 0 && (val.slots.hab2 > 0 || val.slots.hab3 > 0 || val.slots.hab4 > 0)) {
        slotType = 'MISTA';
      }

      // Base denominator: for slot-specific, it's totalLoadouts. For ALL, each loadout has 4 slots
      const denominator = selectedSlot === 'ALL' ? (totalLoadouts * 4) : totalLoadouts;
      const pickRate = parseFloat(((relevantPicks / denominator) * 100).toFixed(1));

      // Competitors sorted by picks
      const competitors: CompetitorUsage[] = Array.from(val.competitorsMap.values())
        .map(comp => {
          const normPlayer = normalize(comp.playerName);
          const pDim = (data.playersDimension || []).find(d => normalize(d.Name) === normPlayer);
          return {
            ...comp,
            playerImg: pDim?.IMG,
            teamLogo: findTeamLogo(comp.teamName, data.teamsReference)
          };
        })
        .sort((a, b) => b.picks - a.picks);

      result.push({
        name: val.name,
        img,
        slotType,
        slotsUsed: val.slots,
        totalPicks: relevantPicks,
        pickRate,
        competitors
      });
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'picks-desc') return b.totalPicks - a.totalPicks;
      if (sortBy === 'picks-asc') return a.totalPicks - b.totalPicks;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return b.totalPicks - a.totalPicks;
    });

    return result;
  }, [filteredCharacters, selectedSlot, sortBy, data.hab1, data.hab2, data.hab3, data.hab4, data.teamsReference, totalLoadouts]);

  // Filtered by Search Query
  const displayedSkills = useMemo(() => {
    if (!searchQuery.trim()) return aggregatedSkills;
    const cleanSearch = normalize(searchQuery);
    return aggregatedSkills.filter(s => normalize(s.name).includes(cleanSearch));
  }, [aggregatedSkills, searchQuery]);

  // Highlights for Top Summary
  const topActive = useMemo(() => {
    const actives = aggregatedSkills.filter(s => s.slotsUsed.hab1 > 0);
    return actives.length > 0 ? actives.reduce((prev, curr) => (curr.slotsUsed.hab1 > prev.slotsUsed.hab1 ? curr : prev), actives[0]) : null;
  }, [aggregatedSkills]);

  const topPassive = useMemo(() => {
    return aggregatedSkills.reduce((prev, curr) => {
      const prevPassive = prev ? (prev.slotsUsed.hab2 + prev.slotsUsed.hab3 + prev.slotsUsed.hab4) : 0;
      const currPassive = curr.slotsUsed.hab2 + curr.slotsUsed.hab3 + curr.slotsUsed.hab4;
      return currPassive > prevPassive ? curr : prev;
    }, null as SkillFrequencyItem | null);
  }, [aggregatedSkills]);

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL COM IDENTIDADE COMPETITIVA */}
      <div className="bg-gradient-to-r from-yellow-950/40 via-[#121217] to-black/80 rounded-3xl border border-yellow-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-yellow-500 pointer-events-none">
          <Flame size={160} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-yellow-500 text-black shadow-sm font-display">
                Meta de Personagens
              </span>
              <span className="text-xs text-gray-400 font-mono font-bold">
                {totalLoadouts} Loadouts Analisados • Hab1 a Hab4
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white font-display flex items-center gap-2.5">
              <span>Frequência de Uso de Personagens</span>
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Monitore a taxa de escolha (pick rate) e popularidade de cada habilidade ativa e passiva utilizada pelos atletas profissionais do torneio.
            </p>
          </div>

          {/* Destaques Rápidos do Meta */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {topActive && (
              <div className="bg-black/60 border border-yellow-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/40 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_12px_rgba(234,179,8,0.2)]">
                  {topActive.img ? (
                    <img src={topActive.img} alt={topActive.name} className="w-full h-full object-contain" />
                  ) : (
                    <Flame size={20} className="text-yellow-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 block truncate">
                    Rei das Ativas (Hab 1)
                  </span>
                  <span className="text-sm font-black text-white uppercase italic truncate block">
                    {topActive.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    {topActive.slotsUsed.hab1}x ({((topActive.slotsUsed.hab1 / totalLoadouts) * 100).toFixed(0)}% do meta)
                  </span>
                </div>
              </div>
            )}

            {topPassive && (
              <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/40 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                  {topPassive.img ? (
                    <img src={topPassive.img} alt={topPassive.name} className="w-full h-full object-contain" />
                  ) : (
                    <Shield size={20} className="text-purple-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-300 block truncate">
                    Top Passiva (Hab 2-4)
                  </span>
                  <span className="text-sm font-black text-white uppercase italic truncate block">
                    {topPassive.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    {topPassive.slotsUsed.hab2 + topPassive.slotsUsed.hab3 + topPassive.slotsUsed.hab4}x escolhas
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BARRA DE CONTROLES: SELETOR DE SLOT + BUSCA + ORDENAÇÃO */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Seletor de Slot Hab 1 a Hab 4 */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setSelectedSlot('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedSlot === 'ALL'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-bold scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={13} /> Todas (Hab1 a Hab4)
            </button>
            <button
              onClick={() => setSelectedSlot('HAB1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedSlot === 'HAB1'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20 font-bold scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flame size={13} /> Hab 1 (Ativas)
            </button>
            <button
              onClick={() => setSelectedSlot('HAB2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedSlot === 'HAB2'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-bold scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield size={13} /> Hab 2 (Passiva 1)
            </button>
            <button
              onClick={() => setSelectedSlot('HAB3')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedSlot === 'HAB3'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-bold scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap size={13} /> Hab 3 (Passiva 2)
            </button>
            <button
              onClick={() => setSelectedSlot('HAB4')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                selectedSlot === 'HAB4'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20 font-bold scale-[1.02]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles size={13} /> Hab 4 (Passiva 3)
            </button>
          </div>

          {/* Busca e Ordenação */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar personagem..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/70 border border-gray-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 uppercase"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-black/70 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 font-bold uppercase focus:outline-none focus:border-yellow-500/50 cursor-pointer"
            >
              <option value="picks-desc">Mais Usados</option>
              <option value="picks-asc">Menos Usados</option>
              <option value="name-asc">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRID DE CARDS COM ÍCONES E AVATARES CUSTOMIZADOS */}
      {displayedSkills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedSkills.map((skill, index) => {
            const isTopRanked = index < 3;
            const isAtiva = skill.slotType === 'ATIVA' || skill.slotsUsed.hab1 > 0;

            return (
              <div
                key={skill.name}
                onClick={() => setSelectedCharModal(skill)}
                className={`bg-[#121217] hover:bg-[#181820] border rounded-2xl p-4.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-xl relative overflow-hidden ${
                  isTopRanked
                    ? 'border-yellow-500/40 hover:border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.08)]'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Top Badge: Rank & Slot */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] ${
                      index === 0
                        ? 'bg-yellow-500 text-black shadow-sm'
                        : index === 1
                          ? 'bg-gray-300 text-black'
                          : index === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-white/10 text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isAtiva
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {isAtiva ? 'Ativa (Hab1)' : 'Passiva'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-black text-yellow-400">
                    {skill.pickRate}% Meta
                  </span>
                </div>

                {/* Avatar / Imagem do Personagem */}
                <div className="flex items-center gap-3.5 my-1">
                  <div className={`w-14 h-14 rounded-2xl bg-black/80 border p-1 shrink-0 flex items-center justify-center shadow-inner overflow-hidden group-hover:scale-105 transition-transform ${
                    isAtiva
                      ? 'border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.25)]'
                      : 'border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  }`}>
                    {skill.img ? (
                      <img
                        src={skill.img}
                        alt={skill.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl font-black text-yellow-500 uppercase font-display">
                        {skill.name.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black uppercase italic tracking-tight text-white group-hover:text-yellow-400 transition-colors truncate font-display">
                      {skill.name}
                    </h3>
                    <div className="text-xs font-mono font-black text-gray-300 mt-0.5">
                      {skill.totalPicks} <span className="text-[10px] font-normal text-gray-500 uppercase">escolhas</span>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso de Frequência */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAtiva
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-400'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, skill.pickRate))}%` }}
                    />
                  </div>

                  {/* Breakdown dos slots se em modo ALL */}
                  {selectedSlot === 'ALL' && (
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono pt-1">
                      <span title="Picks em Hab 1 (Ativa)">H1: <strong className="text-orange-400">{skill.slotsUsed.hab1}</strong></span>
                      <span title="Picks em Hab 2 (Passiva 1)">H2: <strong className="text-cyan-400">{skill.slotsUsed.hab2}</strong></span>
                      <span title="Picks em Hab 3 (Passiva 2)">H3: <strong className="text-indigo-400">{skill.slotsUsed.hab3}</strong></span>
                      <span title="Picks em Hab 4 (Passiva 3)">H4: <strong className="text-pink-400">{skill.slotsUsed.hab4}</strong></span>
                    </div>
                  )}
                </div>

                {/* Competidores que mais usam */}
                <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1 truncate min-w-0">
                    <Users size={12} className="text-gray-500 shrink-0" />
                    <span className="text-[10px] text-gray-400 truncate">
                      {skill.competitors.length > 0 ? (
                        <>
                          <strong className="text-gray-200">{skill.competitors[0].playerName}</strong>
                          {skill.competitors.length > 1 && ` +${skill.competitors.length - 1}`}
                        </>
                      ) : (
                        'Geral'
                      )}
                    </span>
                  </div>

                  <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider flex items-center gap-0.5 group-hover:text-yellow-400">
                    Detalhes <ChevronRight size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#121217] rounded-3xl p-12 text-center border border-white/5">
          <Filter size={36} className="text-gray-600 mx-auto mb-3" />
          <h4 className="text-white font-black text-base uppercase tracking-wider">Nenhum personagem encontrado</h4>
          <p className="text-xs text-gray-500 mt-1">Tente ajustar o slot selecionado ou limpar o termo de busca.</p>
        </div>
      )}

      {/* MODAL DETALHADO DO PERSONAGEM AO CLICAR */}
      {selectedCharModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#14141a] border border-yellow-500/30 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-black border border-yellow-500/40 p-1 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  {selectedCharModal.img ? (
                    <img src={selectedCharModal.img} alt={selectedCharModal.name} className="w-full h-full object-contain" />
                  ) : (
                    <User size={24} className="text-yellow-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      {selectedCharModal.slotType}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-400">
                      {selectedCharModal.totalPicks} Picks Totais
                    </span>
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white font-display mt-0.5">
                    {selectedCharModal.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedCharModal(null)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Stats & Competitors List */}
            <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
              {/* Distribuição por slots */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-black/40 p-2.5 rounded-xl border border-orange-500/20">
                  <span className="text-[9px] font-bold text-orange-400 block uppercase">Hab 1 (Ativa)</span>
                  <span className="text-lg font-black text-white font-mono">{selectedCharModal.slotsUsed.hab1}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-cyan-500/20">
                  <span className="text-[9px] font-bold text-cyan-400 block uppercase">Hab 2</span>
                  <span className="text-lg font-black text-white font-mono">{selectedCharModal.slotsUsed.hab2}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-[9px] font-bold text-indigo-400 block uppercase">Hab 3</span>
                  <span className="text-lg font-black text-white font-mono">{selectedCharModal.slotsUsed.hab3}</span>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-pink-500/20">
                  <span className="text-[9px] font-bold text-pink-400 block uppercase">Hab 4</span>
                  <span className="text-lg font-black text-white font-mono">{selectedCharModal.slotsUsed.hab4}</span>
                </div>
              </div>

              {/* Lista dos Competidores que usam */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-yellow-400" />
                  Competidores que utilizam {selectedCharModal.name} ({selectedCharModal.competitors.length} Atletas)
                </h4>

                <div className="space-y-2">
                  {selectedCharModal.competitors.map((comp, idx) => (
                    <div
                      key={comp.playerName}
                      className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-yellow-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-gray-500 w-5">
                          #{idx + 1}
                        </span>
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-gray-800 border border-yellow-500/30 overflow-hidden flex items-center justify-center">
                            {comp.playerImg ? (
                              <img src={comp.playerImg} alt={comp.playerName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className="text-gray-400" />
                            )}
                          </div>
                          {comp.teamLogo && (
                            <img 
                              src={comp.teamLogo} 
                              alt={comp.teamName} 
                              className="w-4 h-4 rounded-full bg-black absolute -bottom-1 -right-1 border border-white/20 object-contain p-0.5" 
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-black uppercase text-white tracking-wide block">
                            {comp.playerName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {comp.teamName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-yellow-400 font-mono">
                          {comp.picks}x
                        </span>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold">
                          Quedas
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
              <button
                onClick={() => setSelectedCharModal(null)}
                className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-400 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSkillsFrequency;
