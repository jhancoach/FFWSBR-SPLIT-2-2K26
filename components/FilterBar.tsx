import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Search, Check, ChevronDown, ChevronUp, Eye, EyeOff, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterState {
  team: string[];
  players: string[];
  weapon: string[];
  safe: string[];
  map: string[];
  rodada: string[];
  queda: string[];
  confrontation: string[];
  grupo: string[];
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  options: {
    teams: string[];
    players: string[];
    weapons: string[];
    safes: string[];
    maps: string[];
    rounds: string[];
    quedas: string[];
    confrontations: string[];
    grupos: string[];
  };
  defaultOpen?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, options, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const clearFilters = () => {
    setFilters({
      team: [],
      players: [],
      weapon: [],
      safe: [],
      map: [],
      rodada: [],
      queda: [],
      confrontation: [],
      grupo: []
    });
  };

  const removeFilterItem = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value)
    }));
  };

  // Explicitly cast Object.values to string[][] to avoid typing issues
  const activeFiltersCount = (Object.values(filters) as string[][]).reduce((acc, curr) => acc + curr.length, 0);
  const hasActiveFilters = activeFiltersCount > 0;

  const filterCategoryLabels: Record<keyof FilterState, string> = {
    players: 'Jogador',
    team: 'Equipe',
    grupo: 'Grupo',
    confrontation: 'Confronto',
    map: 'Mapa',
    rodada: 'Rodada',
    queda: 'Queda',
    weapon: 'Arma',
    safe: 'Safe'
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-4 md:p-5 mb-6 border border-gray-800 shadow-xl relative z-40 transition-all">
      {/* Barra de Título com Botão de Ocultar/Mostrar e Limpar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 flex items-center justify-center shadow-inner">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm uppercase tracking-wider">
                Filtros Avançados
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">
              Refine os dados por atletas, equipes, mapas, rodadas e quedas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button 
              onClick={clearFilters} 
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Remover todos os filtros aplicados"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Limpar Tudo</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95 border ${
              isOpen
                ? 'bg-white/10 hover:bg-white/15 text-gray-200 border-white/10 shadow-sm'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-500 shadow-lg shadow-yellow-500/20'
            }`}
          >
            {isOpen ? (
              <>
                <EyeOff size={14} />
                <span>Ocultar Filtros</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Mostrar Filtros</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumo de Tags dos Filtros Ativos (especialmente útil quando o painel está recolhido) */}
      {hasActiveFilters && (
        <div className={`flex flex-wrap items-center gap-1.5 ${isOpen ? 'mt-3 pt-2 border-t border-white/5' : 'mt-3'}`}>
          <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mr-1 flex items-center gap-1">
            <Filter size={11} className="text-yellow-500" /> ATIVOS:
          </span>
          {(Object.entries(filters) as [keyof FilterState, string[]][]).map(([key, values]) =>
            values.map(val => (
              <span
                key={`${key}-${val}`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-black uppercase tracking-wider"
              >
                <span className="text-gray-400 font-bold text-[9px]">{filterCategoryLabels[key]}:</span>
                <span>{val}</span>
                <button
                  onClick={() => removeFilterItem(key, val)}
                  className="hover:text-red-400 transition-colors ml-0.5 cursor-pointer"
                  title={`Remover ${val}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
      )}

      {/* Grid de Seleção dos Filtros */}
      {isOpen && (
        <div className="mt-4 pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-5 animate-in fade-in duration-200">
          <MultiSelect label="Jogadores" selected={filters.players} options={options.players} onChange={(v) => setFilters(p => ({...p, players: v}))} highlight />
          <MultiSelect label="Equipes" selected={filters.team} options={options.teams} onChange={(v) => setFilters(p => ({...p, team: v}))} />
          <MultiSelect label="Grupo" selected={filters.grupo} options={options.grupos} onChange={(v) => setFilters(p => ({...p, grupo: v}))} />
          <MultiSelect label="Confrontos" selected={filters.confrontation} options={options.confrontations} onChange={(v) => setFilters(p => ({...p, confrontation: v}))} />
          <MultiSelect label="Mapas" selected={filters.map} options={options.maps} onChange={(v) => setFilters(p => ({...p, map: v}))} />
          <MultiSelect label="Rodadas (RD)" selected={filters.rodada} options={options.rounds} onChange={(v) => setFilters(p => ({...p, rodada: v}))} />
          <MultiSelect label="Quedas (Q)" selected={filters.queda} options={options.quedas} onChange={(v) => setFilters(p => ({...p, queda: v}))} />
          {options.weapons.length > 0 && <MultiSelect label="Armas" selected={filters.weapon} options={options.weapons} onChange={(v) => setFilters(p => ({...p, weapon: v}))} />}
          {options.safes.length > 0 && <MultiSelect label="Safes" selected={filters.safe} options={options.safes} onChange={(v) => setFilters(p => ({...p, safe: v}))} />}
        </div>
      )}
    </div>
  );
};

interface MultiSelectProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
    highlight?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, highlight }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(s => s !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-[10px] text-gray-500 uppercase mb-1.5 font-black tracking-widest">{label}</label>
            <div 
                className={`bg-black rounded-xl border transition-all duration-300 px-3 py-2.5 flex justify-between items-center cursor-pointer min-h-[42px] ${open ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-gray-800 hover:border-gray-600'}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-wrap gap-1 max-w-[90%]">
                    {selected.length === 0 ? (
                        <span className="text-gray-600 text-[11px] font-bold uppercase italic">Todos(as)</span>
                    ) : (
                        <span className={`text-[11px] font-black uppercase italic ${highlight ? 'text-yellow-500' : 'text-white'}`}>
                            {selected.length === 1 ? selected[0] : `${selected.length} Selecionados`}
                        </span>
                    )}
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>

            {open && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#121215] border border-gray-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100] max-h-72 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-800 bg-black/40">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text" 
                                placeholder="Filtrar..." 
                                className="w-full bg-black text-white p-2 pl-9 rounded-lg border border-gray-800 text-[11px] font-bold focus:outline-none focus:border-yellow-500 placeholder-gray-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <div 
                                key={opt} 
                                className={`px-4 py-3 hover:bg-yellow-500/10 cursor-pointer flex items-center justify-between text-[11px] font-bold border-b border-white/5 last:border-0 transition-colors ${selected.includes(opt) ? 'bg-yellow-500/5 text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                                onClick={() => toggleOption(opt)}
                            >
                                <span className="uppercase italic">{opt}</span>
                                {selected.includes(opt) && <Check size={14} className="text-yellow-500" />}
                            </div>
                        )) : (
                            <div className="p-4 text-gray-600 text-[10px] text-center font-black uppercase italic tracking-widest">Nenhum resultado</div>
                        )}
                    </div>
                </div>
            )}

            {selected.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                    {selected.map(s => (
                        <div key={s} className="group flex items-center gap-1.5 bg-yellow-500 text-black px-2 py-0.5 rounded-md font-black text-[9px] uppercase italic shadow-sm hover:bg-yellow-400 transition-colors">
                            {s}
                            <button onClick={(e) => { e.stopPropagation(); toggleOption(s); }} className="hover:text-red-700 transition-colors">
                                <X size={10} strokeWidth={4}/>
                            </button>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};

export default FilterBar;