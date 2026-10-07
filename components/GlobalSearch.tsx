import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Shield, Users, Trophy, Flame, ChevronRight, 
  X, Crosshair, Crown, Star, ArrowRight, Presentation, 
  Sparkles, Filter, Hash, ExternalLink, Command
} from 'lucide-react';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';

interface GlobalSearchProps {
  data: DashboardData;
  isCompact?: boolean;
}

const normalize = (str: any): string => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const parseNum = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ data, isCompact = false }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'teams' | 'players'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K / /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Compute all teams list
  const teamsList = useMemo(() => {
    const stats: TeamStats[] = calculateTeamStats(data);
    return stats.map((t, idx) => ({
      name: t.name,
      image: t.image || findTeamLogo(t.name, data.teamsReference),
      pts: t.pts,
      abts: t.abts,
      b: t.b,
      rank: idx + 1,
      grupo: t.grupo || ''
    })).sort((a, b) => b.pts - a.pts).map((t, idx) => ({ ...t, rank: idx + 1 }));
  }, [data]);

  // Compute all players list
  const playersList = useMemo(() => {
    const pMap = new Map<string, {
      name: string;
      team: string;
      img?: string;
      teamImg?: string;
      kills: number;
      damage: number;
      matches: number;
      hs: number;
      funcao: string;
      funcao2: string;
      mvp: number;
    }>();

    // From dimension
    (data.playersDimension || []).forEach(dim => {
      if (dim.Name) {
        const norm = normalize(dim.Name);
        pMap.set(norm, {
          name: dim.Name,
          team: (dim as any).Time || '',
          img: dim.IMG,
          teamImg: '',
          kills: 0,
          damage: 0,
          matches: 0,
          hs: 0,
          funcao: dim.Funcao || 'N/A',
          funcao2: dim.Funcao2 || 'N/A',
          mvp: 0
        });
      }
    });

    // From players facts
    (data.players || []).forEach(p => {
      if (!p.PLAYER) return;
      const norm = normalize(p.PLAYER);
      const existing = pMap.get(norm) || {
        name: p.PLAYER,
        team: p.TIME || '',
        img: undefined,
        teamImg: '',
        kills: 0,
        damage: 0,
        matches: 0,
        hs: 0,
        funcao: 'N/A',
        funcao2: 'N/A',
        mvp: 0
      };

      existing.kills += parseNum(p.Abates);
      existing.damage += parseNum(p.Dano);
      existing.hs += parseNum(p.HS);
      existing.mvp += parseNum(p.MVP);
      existing.matches += 1;
      if (!existing.team && p.TIME) existing.team = p.TIME;

      pMap.set(norm, existing);
    });

    const arr = Array.from(pMap.values()).map(p => ({
      ...p,
      teamImg: findTeamLogo(p.team, data.teamsReference),
      img: p.img || findDimImg(data.playersDimension, p.name)
    })).filter(p => p.matches > 0 || p.kills > 0);

    return arr.sort((a, b) => b.kills - a.kills).map((p, idx) => ({ ...p, killRank: idx + 1 }));
  }, [data.playersDimension, data.players, data.teamsReference]);

  // Filtered results
  const filteredTeams = useMemo(() => {
    if (activeFilter === 'players') return [];
    if (!query.trim()) {
      return teamsList.slice(0, 4); // Top 4 by default
    }
    const q = normalize(query);
    return teamsList.filter(t => normalize(t.name).includes(q) || normalize(t.grupo).includes(q)).slice(0, 6);
  }, [teamsList, query, activeFilter]);

  const filteredPlayers = useMemo(() => {
    if (activeFilter === 'teams') return [];
    if (!query.trim()) {
      return playersList.slice(0, 6); // Top 6 MVP players by default
    }
    const q = normalize(query);
    return playersList.filter(p => 
      normalize(p.name).includes(q) || 
      normalize(p.team).includes(q) || 
      normalize(p.funcao).includes(q)
    ).slice(0, 8);
  }, [playersList, query, activeFilter]);

  const totalResultsCount = filteredTeams.length + filteredPlayers.length;

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    const list: Array<{ type: 'team' | 'player'; data: any }> = [];
    filteredTeams.forEach(t => list.push({ type: 'team', data: t }));
    filteredPlayers.forEach(p => list.push({ type: 'player', data: p }));
    return list;
  }, [filteredTeams, filteredPlayers]);

  const handleSelectResult = (item: { type: 'team' | 'player'; data: any }, action: 'view' | 'slides' = 'view') => {
    setIsOpen(false);
    if (item.type === 'team') {
      if (action === 'slides') {
        navigate(`/slides?type=team&name=${encodeURIComponent(item.data.name)}`);
      } else {
        navigate('/teams', { state: { team: item.data.name } });
      }
    } else {
      if (action === 'slides') {
        navigate(`/slides?type=player&name=${encodeURIComponent(item.data.name)}`);
      } else {
        navigate('/players', { state: { player: item.data.name } });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectResult(flatResults[selectedIndex], 'view');
      }
    }
  };

  return (
    <>
      {/* Trigger Button in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-between gap-3 bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white px-3 sm:px-4 py-2 rounded-xl border border-white/10 hover:border-yellow-500/40 transition-all shadow-inner group cursor-pointer ${
          isCompact ? 'w-auto' : 'w-44 sm:w-60 md:w-72'
        }`}
        title="Pesquisar time ou jogador (Ctrl + K)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Search size={15} className="text-yellow-500 group-hover:scale-110 transition-transform shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 truncate">
            {isCompact ? 'Buscar...' : 'Buscar time / jogador...'}
          </span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-gray-400 group-hover:text-yellow-400">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Modal / Search Palette Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-4 animate-in fade-in duration-200">
          <div 
            ref={containerRef}
            className="w-full max-w-2xl bg-[#0e1017] rounded-3xl border border-yellow-500/30 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 bg-black/50">
              <Search size={20} className="text-yellow-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite o nome de um time ou jogador (ex: LOUD, Fluxo, Lost, Cauan)..."
                className="w-full bg-transparent text-white placeholder-gray-500 text-sm sm:text-base font-bold uppercase focus:outline-none tracking-wide"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                ESC
              </button>
            </div>

            {/* Quick Filter Chips */}
            <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeFilter === 'all'
                      ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Todos ({totalResultsCount})
                </button>
                <button
                  onClick={() => setActiveFilter('teams')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    activeFilter === 'teams'
                      ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Shield size={10} />
                  <span>Times ({filteredTeams.length})</span>
                </button>
                <button
                  onClick={() => setActiveFilter('players')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    activeFilter === 'players'
                      ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Users size={10} />
                  <span>Jogadores ({filteredPlayers.length})</span>
                </button>
              </div>

              <span className="text-[9px] font-mono text-gray-500 hidden sm:inline uppercase">
                ↑↓ Navegar • Enter Selecionar
              </span>
            </div>

            {/* Results Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
              
              {/* SEÇÃO: TIMES */}
              {filteredTeams.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1.5">
                      <Shield size={12} />
                      <span>{query ? 'Times Encontrados' : 'Times em Destaque'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {filteredTeams.length} {filteredTeams.length === 1 ? 'equipe' : 'equipes'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredTeams.map((team, idx) => {
                      const isSelected = flatResults[selectedIndex]?.type === 'team' && flatResults[selectedIndex]?.data.name === team.name;
                      return (
                        <div
                          key={team.name}
                          onClick={() => handleSelectResult({ type: 'team', data: team }, 'view')}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                            isSelected
                              ? 'bg-yellow-500/15 border-yellow-400 shadow-md shadow-yellow-500/10 scale-[1.01]'
                              : 'bg-black/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 p-1 flex items-center justify-center shrink-0">
                              {team.image ? (
                                <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                              ) : (
                                <Shield size={18} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-black text-gray-500">#{team.rank}</span>
                                <h4 className="text-xs font-black uppercase text-white truncate italic group-hover:text-yellow-400 transition-colors">
                                  {team.name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 block">
                                {team.pts} pts • {team.abts} kills • {team.b} 👑
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSelectResult({ type: 'team', data: team }, 'slides')}
                              className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black transition-colors"
                              title="Apresentar Time em Slides"
                            >
                              <Presentation size={13} />
                            </button>
                            <button
                              onClick={() => handleSelectResult({ type: 'team', data: team }, 'view')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                              title="Ver Estatísticas do Time"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEÇÃO: JOGADORES */}
              {filteredPlayers.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1.5">
                      <Users size={12} />
                      <span>{query ? 'Jogadores Encontrados' : 'Atletas em Destaque'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {filteredPlayers.length} {filteredPlayers.length === 1 ? 'atleta' : 'atletas'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredPlayers.map((player, idx) => {
                      const isSelected = flatResults[selectedIndex]?.type === 'player' && flatResults[selectedIndex]?.data.name === player.name;
                      return (
                        <div
                          key={player.name}
                          onClick={() => handleSelectResult({ type: 'player', data: player }, 'view')}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                            isSelected
                              ? 'bg-yellow-500/15 border-yellow-400 shadow-md shadow-yellow-500/10 scale-[1.01]'
                              : 'bg-black/50 border-white/5 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                              {player.img ? (
                                <img src={player.img} alt={player.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Users size={18} className="text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-black text-red-400">#{player.killRank}</span>
                                <h4 className="text-xs font-black uppercase text-white truncate italic group-hover:text-yellow-400 transition-colors">
                                  {player.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                <span className="text-yellow-400 font-bold uppercase truncate max-w-[90px]">{player.team}</span>
                                <span>•</span>
                                <span className="text-white font-mono font-bold">{player.kills} kills</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSelectResult({ type: 'player', data: player }, 'slides')}
                              className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black transition-colors"
                              title="Apresentar Jogador em Slides"
                            >
                              <Presentation size={13} />
                            </button>
                            <button
                              onClick={() => handleSelectResult({ type: 'player', data: player }, 'view')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors"
                              title="Ver Perfil do Jogador"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEM RESULTADOS */}
              {totalResultsCount === 0 && (
                <div className="py-12 text-center space-y-2">
                  <Search size={32} className="mx-auto text-gray-600 mb-2" />
                  <h4 className="text-sm font-black uppercase text-gray-300">
                    Nenhum time ou jogador encontrado
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Verifique a ortografia ou tente pesquisar por parte do nome (ex: "LOUD", "Fluxo", "Lost", "Cauan").
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <span>Clique no ícone 📽️ para abrir direto em slides</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
