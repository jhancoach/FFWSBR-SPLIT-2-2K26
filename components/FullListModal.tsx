import React, { useState, useMemo } from 'react';
import { 
  X, Search, Swords, Shield, User, Disc, Skull, 
  ArrowUpDown, Check, Filter, TrendingUp, Sparkles, LayoutGrid, List as ListIcon
} from 'lucide-react';

export interface FullListItem {
  name: string;
  count: number;
}

interface FullListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: FullListItem[];
  totalCount: number;
  type: 'weapon' | 'team' | 'player' | 'safe';
  getImage?: (name: string) => string | undefined;
  getRole?: (name: string) => string | null;
  getPlayerTeam?: (playerName: string) => string | undefined;
  getTeamLogo?: (teamName: string) => string | undefined;
  isVictimList?: boolean;
  color?: string;
  activeValues?: string[];
  onSelect?: (name: string) => void;
  tab?: 'kills' | 'deaths';
}

type SortOrder = 'count-desc' | 'count-asc' | 'alpha-asc';

export const FullListModal: React.FC<FullListModalProps> = ({
  isOpen,
  onClose,
  title,
  items,
  totalCount,
  type,
  getImage,
  getRole,
  getPlayerTeam,
  getTeamLogo,
  isVictimList = false,
  activeValues = [],
  onSelect,
  tab = 'kills'
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOrder>('count-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filtragem e ordenação
  const processedItems = useMemo(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const playerTeam = getPlayerTeam ? getPlayerTeam(item.name)?.toLowerCase() : '';
        const role = getRole ? getRole(item.name)?.toLowerCase() : '';
        return nameMatch || (playerTeam && playerTeam.includes(q)) || (role && role.includes(q));
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'count-desc') return b.count - a.count;
      if (sortBy === 'count-asc') return a.count - b.count;
      if (sortBy === 'alpha-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [items, search, sortBy, getPlayerTeam, getRole]);

  // Estatísticas do conjunto
  const stats = useMemo(() => {
    const totalRecorded = items.reduce((acc, curr) => acc + curr.count, 0);
    const topItem = items.length > 0 ? [...items].sort((a, b) => b.count - a.count)[0] : null;
    const avg = items.length > 0 ? (totalRecorded / items.length).toFixed(1) : '0';
    return { totalRecorded, topItem, avg };
  }, [items]);

  if (!isOpen) return null;

  const getRankBadgeClass = (rankIndex: number) => {
    if (rankIndex === 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
    if (rankIndex === 1) return 'bg-slate-300/20 text-slate-200 border-slate-400/40';
    if (rankIndex === 2) return 'bg-amber-700/20 text-amber-400 border-amber-600/40';
    return 'bg-white/5 text-gray-400 border-white/10';
  };

  const getMetricLabel = () => {
    if (type === 'weapon') return tab === 'deaths' ? 'Mortes causadas' : 'Abates realizados';
    if (isVictimList || tab === 'deaths') return 'Mortes sofridas';
    return 'Abates conquistados';
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#111116] border border-white/10 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO MODAL */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-black/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isVictimList 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : type === 'weapon'
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {type === 'weapon' && <Swords size={24} />}
              {type === 'team' && (isVictimList ? <Skull size={24} /> : <Shield size={24} />)}
              {type === 'player' && (isVictimList ? <Skull size={24} /> : <User size={24} />)}
              {type === 'safe' && <Disc size={24} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-gray-300">
                  {type === 'weapon' ? 'Arsenal Completo' : type === 'team' ? 'Equipes' : type === 'player' ? 'Atletas' : 'Safes'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {items.length} {type === 'weapon' ? 'Armas' : type === 'team' ? 'Equipes' : type === 'player' ? 'Jogadores' : 'Zonas'}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black italic uppercase tracking-tight truncate text-white mt-0.5">
                {title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
            title="Fechar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE ESTATÍSTICAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-black/40 border-b border-white/5 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Total Registrado</span>
            <span className="text-base font-black text-white italic">{stats.totalRecorded}</span>
            <span className="text-[9px] text-gray-500 block">{getMetricLabel()}</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Líder (#1)</span>
            <span className="text-base font-black text-yellow-400 italic truncate block">
              {stats.topItem?.name || 'N/A'}
            </span>
            <span className="text-[9px] text-gray-400 block">{stats.topItem?.count || 0} registros</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">% do Líder</span>
            <span className="text-base font-black text-emerald-400 italic">
              {totalCount && stats.topItem ? ((stats.topItem.count / totalCount) * 100).toFixed(1) : '0.0'}%
            </span>
            <span className="text-[9px] text-gray-500 block">Do volume total</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Média por Item</span>
            <span className="text-base font-black text-blue-400 italic">{stats.avg}</span>
            <span className="text-[9px] text-gray-500 block">Média por entrada</span>
          </div>
        </div>

        {/* BARRA DE CONTROLES: BUSCA, ORDENAÇÃO E MODO DE VISUALIZAÇÃO */}
        <div className="p-4 bg-[#15151c] border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar por nome de ${type === 'weapon' ? 'arma' : type === 'team' ? 'equipe' : 'jogador'}...`}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Ordenação e Alternador de Visão */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1 text-xs">
              <span className="text-[10px] font-bold text-gray-400 px-2 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={12} /> Ordem:
              </span>
              <button
                onClick={() => setSortBy('count-desc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  sortBy === 'count-desc' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mais
              </button>
              <button
                onClick={() => setSortBy('count-asc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  sortBy === 'count-asc' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Menos
              </button>
              <button
                onClick={() => setSortBy('alpha-asc')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  sortBy === 'alpha-asc' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                A-Z
              </button>
            </div>

            <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Modo Grade com Imagens Grandes"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'table' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Modo Lista Detalhada / Tabela"
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTEÚDO SCROLLÁVEL: LISTA COMPLETA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-black/30">
          {processedItems.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-bold uppercase text-xs">
              Nenhum item encontrado para "{search}".
            </div>
          ) : viewMode === 'grid' ? (
            /* MODO GRADE VISUAL: CARDS ROBUSTOS COM IMAGENS GRANDES */
            <div className={`grid gap-3.5 ${
              type === 'weapon' 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                : type === 'player'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
            }`}>
              {processedItems.map((item, idx) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : '0.0';
                const img = getImage && getImage(item.name);
                const role = getRole && getRole(item.name);
                const teamName = getPlayerTeam && getPlayerTeam(item.name);
                const teamLogo = teamName && getTeamLogo && getTeamLogo(teamName);
                const isActive = activeValues.includes(item.name);
                const rankIndex = items.findIndex(it => it.name === item.name);

                return (
                  <div
                    key={item.name}
                    onClick={() => onSelect && onSelect(item.name)}
                    className={`rounded-2xl border p-4 flex flex-col justify-between relative group transition-all duration-200 ${
                      onSelect ? 'cursor-pointer hover:border-yellow-500/50 hover:bg-white/5' : ''
                    } ${
                      isActive 
                        ? 'bg-yellow-500/10 border-yellow-500 ring-2 ring-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                        : 'bg-[#15151a] border-white/10'
                    }`}
                  >
                    {/* Linha Superior: Posição no Ranking e Ação de Filtro */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${getRankBadgeClass(rankIndex)}`}>
                        #{rankIndex + 1}
                      </span>

                      {onSelect && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                          isActive 
                            ? 'bg-yellow-500 text-black border-yellow-400 font-bold' 
                            : 'bg-white/5 text-gray-400 border-white/10 group-hover:text-yellow-400'
                        }`}>
                          {isActive ? 'Filtro Ativo' : 'Filtrar'}
                        </span>
                      )}
                    </div>

                    {/* Imagem Central (Arma, Time ou Jogador) */}
                    <div className="w-full flex items-center justify-center my-2">
                      {type === 'weapon' ? (
                        <div className="h-20 w-full flex items-center justify-center bg-black/40 rounded-xl p-2 border border-white/5 group-hover:border-white/20 transition-all">
                          {img ? (
                            <img 
                              src={img} 
                              alt={item.name} 
                              className="h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <Swords size={28} className="text-gray-700" />
                          )}
                        </div>
                      ) : type === 'team' ? (
                        <div className="w-16 h-16 rounded-2xl bg-black/60 border border-white/10 p-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                          {img ? (
                            <img src={img} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <Shield size={24} className="text-gray-700" />
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-white/15 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                            {img ? (
                              <img src={img} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={24} className="text-gray-700" />
                            )}
                          </div>
                          {teamLogo && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-white/20 p-0.5 shadow-md">
                              <img src={teamLogo} alt={teamName} className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Detalhes de Nome e Metadados */}
                    <div className="mt-2 text-center">
                      <span className={`text-xs font-black uppercase italic tracking-tight truncate block ${
                        isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-white'
                      }`}>
                        {item.name}
                      </span>

                      {/* Metadados para Jogadores (Time e Função) */}
                      {type === 'player' && (
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          {teamName && (
                            <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                              {teamName}
                            </span>
                          )}
                          {role && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
                              {role}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contador Principal e Barra de Progresso */}
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                          {getMetricLabel()}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-base font-black italic ${
                            isVictimList ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {item.count}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            ({percent}%)
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isVictimList ? 'bg-red-500' : type === 'weapon' ? 'bg-orange-500' : 'bg-yellow-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, parseFloat(percent)))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODO TABELA: VISÃO EM LINHAS DETALHADAS */
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#15151a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-[10px] uppercase font-mono text-gray-400 border-b border-white/10 tracking-widest">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Pos</th>
                    <th className="py-3 px-4">Item / Entidade</th>
                    {type === 'player' && <th className="py-3 px-4">Time & Função</th>}
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 w-40">% do Total</th>
                    {onSelect && <th className="py-3 px-4 text-center w-24">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedItems.map((item) => {
                    const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : '0.0';
                    const img = getImage && getImage(item.name);
                    const role = getRole && getRole(item.name);
                    const teamName = getPlayerTeam && getPlayerTeam(item.name);
                    const isActive = activeValues.includes(item.name);
                    const rankIndex = items.findIndex(it => it.name === item.name);

                    return (
                      <tr 
                        key={item.name}
                        onClick={() => onSelect && onSelect(item.name)}
                        className={`hover:bg-white/5 transition-colors ${
                          onSelect ? 'cursor-pointer' : ''
                        } ${isActive ? 'bg-yellow-500/10' : ''}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getRankBadgeClass(rankIndex)}`}>
                            #{rankIndex + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 p-1 flex items-center justify-center shrink-0">
                              {img ? (
                                <img 
                                  src={img} 
                                  alt={item.name} 
                                  className={`w-full h-full ${type === 'player' ? 'object-cover rounded-full' : 'object-contain'}`} 
                                />
                              ) : (
                                <span className="text-[10px] text-gray-600 font-mono">?</span>
                              )}
                            </div>
                            <span className={`font-black uppercase italic tracking-tight ${
                              isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-white'
                            }`}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        {type === 'player' && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-300 font-bold uppercase">{teamName || '-'}</span>
                              {role && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
                                  {role}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-black italic ${isVictimList ? 'text-red-400' : 'text-yellow-400'}`}>
                            {item.count}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className={`h-full rounded-full ${
                                  isVictimList ? 'bg-red-500' : type === 'weapon' ? 'bg-orange-500' : 'bg-yellow-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(2, parseFloat(percent)))}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                              {percent}%
                            </span>
                          </div>
                        </td>
                        {onSelect && (
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item.name);
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-colors border ${
                                isActive 
                                  ? 'bg-yellow-500 text-black border-yellow-400' 
                                  : 'bg-white/5 text-gray-300 border-white/10 hover:border-yellow-500 hover:text-yellow-400'
                              }`}
                            >
                              {isActive ? 'Ativo' : 'Filtrar'}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 bg-black/80 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span className="text-[11px]">
            Mostrando <strong className="text-white">{processedItems.length}</strong> de <strong className="text-white">{items.length}</strong> entradas
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-xs"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
