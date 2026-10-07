import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeSelectorProps {
  isCompact?: boolean;
  showLabels?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ isCompact = false, showLabels = false }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'system',
      label: 'Automático',
      desc: `Preferência do sistema (${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'})`,
      icon: <Laptop size={15} />,
    },
    {
      id: 'dark',
      label: 'Escuro',
      desc: 'Tema esportivo escuro padrão',
      icon: <Moon size={15} />,
    },
    {
      id: 'light',
      label: 'Claro',
      desc: 'Tema claro de alta visibilidade',
      icon: <Sun size={15} />,
    },
  ];

  const currentIcon = () => {
    if (themeMode === 'system') return <Laptop size={16} className="text-[#facc15]" />;
    if (themeMode === 'dark') return <Moon size={16} className="text-[#a855f7]" />;
    return <Sun size={16} className="text-[#f97316]" />;
  };

  const currentLabel = () => {
    if (themeMode === 'system') return 'Automático';
    if (themeMode === 'dark') return 'Escuro';
    return 'Claro';
  };

  if (showLabels) {
    // Segmented full pill control (e.g. inside mobile menu or settings)
    return (
      <div className="bg-black/60 p-1 rounded-xl border border-white/10 flex items-center gap-1 w-full theme-card-surface">
        {options.map((opt) => {
          const isActive = themeMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setThemeMode(opt.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg text-xs font-black uppercase tracking-wider font-display transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`Tema: ${currentLabel()} (Clique para alterar)`}
        aria-label="Alternar tema claro/escuro"
        aria-expanded={isOpen}
        className={`flex items-center gap-1.5 p-2 rounded-xl transition-all duration-200 border border-white/10 hover:border-yellow-500/40 ${
          isOpen
            ? 'bg-white/10 text-white shadow-md'
            : 'bg-black/60 text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        {currentIcon()}
        {!isCompact && (
          <span className="hidden xl:inline text-[11px] font-bold font-display uppercase tracking-wider text-gray-300 mr-0.5">
            {currentLabel()}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-[#120817]/95 backdrop-blur-xl border border-yellow-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.6)] z-50 animate-in fade-in zoom-in-95 duration-150 theme-dropdown-surface">
          <div className="px-3 py-2 border-b border-white/10 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#facc15] block font-display">
              Aparência do Dashboard
            </span>
            <p className="text-[11px] text-gray-400 font-medium">
              Escolha entre o modo escuro, claro ou automático.
            </p>
          </div>

          <div className="space-y-1">
            {options.map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setThemeMode(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-yellow-500/40 text-white'
                      : 'hover:bg-white/5 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-yellow-500 text-black shadow-sm shadow-yellow-500/50'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide font-display flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {opt.id === 'system' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-yellow-300 font-mono">
                            Auto
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block leading-tight">
                        {opt.desc}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-yellow-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
