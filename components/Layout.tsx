import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Shield, Skull, RefreshCw, Menu, X, 
  Printer, Download, Settings, Map as MapIcon, Calendar, 
  Image as ImageIcon, Presentation as PresentationIcon, 
  ChevronLeft, ChevronRight, Activity, Sparkles, Trophy
} from 'lucide-react';
import { CSV_URLS, LOGO_URL } from '../constants';
import { AppConfig, DashboardData } from '../types';
import GlobalSearch from './GlobalSearch';
import ThemeSelector from './ThemeSelector';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  config: AppConfig;
  data?: DashboardData;
}

const Layout: React.FC<LayoutProps> = ({ children, onRefresh, loading, lastUpdated, config, data }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ffwsbr_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ffwsbr_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { name: 'Classificação', path: '/', icon: <LayoutDashboard size={20} />, badge: 'Ao Vivo' },
    { name: 'Cronograma', path: '/cronograma', icon: <Calendar size={20} /> },
    { name: 'Jogadores', path: '/players', icon: <Users size={20} /> },
    { name: 'Times', path: '/teams', icon: <Shield size={20} /> },
    { name: 'Killfeed', path: '/killfeed', icon: <Skull size={20} /> },
    { name: 'Estudos', path: '/estudos', icon: <MapIcon size={20} /> },
    { name: 'Banners', path: '/banners', icon: <ImageIcon size={20} /> },
    { name: 'Slides', path: '/slides', icon: <PresentationIcon size={20} />, highlight: true },
  ];

  const handlePrint = () => { window.print(); };

  const handleExportCSV = () => {
    const link = document.createElement('a');
    link.href = CSV_URLS.fDetalhes;
    link.setAttribute('download', 'FFWSBR2026_Dados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full text-gray-100 flex flex-col lg:flex-row bg-transparent">
      {/* ========================================================================= */}
      {/* SIDEBAR LATERAL DESKTOP                                                  */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ease-in-out border-r border-white/10 backdrop-blur-2xl bg-black/85 theme-card-surface no-print ${
          isCollapsed ? 'w-[78px]' : 'w-64'
        }`}
      >
        {/* Top Logo / Brand Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <NavLink 
            to="/" 
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
            title="Ir para o Início"
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#f97316] rounded-xl blur opacity-25 group-hover:opacity-60 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-[#2d0a31] to-black p-1 rounded-xl border border-[#f97316]/40 overflow-hidden w-11 h-11 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <img src={LOGO_URL} alt="FFWSBR Logo" className="w-full h-full object-contain scale-110" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <h1 className="text-base font-black italic tracking-wider font-display leading-tight text-white uppercase truncate">
                  {config.titlePart1} <span className="text-[#facc15]">{config.titlePart2}</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse shrink-0"></span>
                  <p className="text-[9px] text-gray-400 font-bold tracking-wider uppercase truncate">{config.subtitle}</p>
                </div>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation Items List (Scrollable if necessary, but fits effortlessly) */}
        <div className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-display flex items-center gap-1.5">
                <Trophy size={11} className="text-[#facc15]" />
                Navegação Principal
              </span>
            </div>
          )}

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 font-display uppercase tracking-wider ${
                  isActive
                    ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-lg shadow-orange-500/25 font-black scale-[1.01]'
                    : item.highlight
                    ? 'text-yellow-300 hover:text-white bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-black' : ''}`}>
                    {item.icon}
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="truncate">{item.name}</span>
                      {item.badge && !isActive && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30">
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && !isActive && (
                        <Sparkles size={13} className="text-yellow-400 animate-pulse shrink-0" />
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-black/95 text-white text-xs font-bold font-display uppercase tracking-wider rounded-lg border border-white/15 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Sidebar Footer (Live status, Settings, Collapse Toggle) */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
          {/* Settings Navlink */}
          <NavLink
            to="/admin"
            title={isCollapsed ? 'Configurações' : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-white/10 text-[#facc15]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Settings size={18} className="shrink-0 transition-transform group-hover:rotate-45" />
            {!isCollapsed && <span className="truncate">Painel & Config</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-black/95 text-white text-xs font-bold font-display uppercase tracking-wider rounded-lg border border-white/15 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-xl">
                Configurações
              </div>
            )}
          </NavLink>

          {/* Live Status indicator */}
          {!isCollapsed && (
            <div className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-gray-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="uppercase text-[9px] font-bold">Sync:</span>
                <span className="text-[#facc15] font-bold">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
              </div>
              <Activity size={13} className="text-emerald-400" />
            </div>
          )}

          {/* Collapse/Expand Action Button */}
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : (
              <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider">
                <ChevronLeft size={16} />
                <span>Recolher Menu</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / OVERLAY (LATERAL PARA TELAS PEQUENAS)                    */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Lateral Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0e0712] border-r border-white/15 flex flex-col p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header with close button */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d0a31] to-black p-1 border border-[#f97316]/40 flex items-center justify-center">
                  <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-sm font-black font-display text-white uppercase">{config.titlePart1} {config.titlePart2}</h2>
                  <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">{config.subtitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 border border-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Navigation List */}
            <div className="flex-1 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-black font-display uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-md'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {React.cloneElement(item.icon, { size: 18 })}
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}

              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all ${
                    isActive ? 'bg-white/10 text-yellow-400' : 'text-gray-400 hover:bg-white/5'
                  }`
                }
              >
                <Settings size={17} />
                <span>Configurações & Painel</span>
              </NavLink>
            </div>

            {/* Mobile Drawer Bottom with Theme & Sync */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#facc15] block mb-2 font-display">
                  Tema da Interface
                </span>
                <ThemeSelector showLabels />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-1">
                <span>Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER (COMPENSATED FOR SIDEBAR ON DESKTOP)                      */}
      {/* ========================================================================= */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[78px]' : 'lg:pl-64'
        }`}
      >
        {/* Developer Credit Top Bar */}
        <div className="bg-gradient-to-r from-yellow-500/15 via-amber-500/20 to-yellow-500/15 border-b border-yellow-500/30 py-1.5 px-4 sm:px-6 no-print shadow-sm">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 text-yellow-400 min-w-0">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0"></span>
              <span className="text-gray-200 truncate font-display">FFWSBR 2026 SPLIT 2 • 👑 GRANDE FINAL (CHAMPIONS RUSH)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/70 px-3 py-0.5 rounded-full border border-yellow-500/40 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.2)] shrink-0 whitespace-nowrap">
              <span>Dashboard desenvolvido por <strong className="text-white font-black">Jhan Medeiros Analista</strong></span>
            </div>
          </div>
        </div>

        {/* Top Header Bar with Global Search and Action Buttons */}
        <header className="glass sticky top-0 z-30 no-print border-b border-white/10 backdrop-blur-md bg-black/60">
          <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center gap-2 sm:gap-4">
              
              {/* Left Side Header: Mobile Hamburger + Current Title on Mobile */}
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)} 
                  className="lg:hidden text-gray-300 hover:text-white p-2 rounded-xl bg-black/60 border border-white/10"
                  aria-label="Abrir Menu Lateral"
                >
                  <Menu size={20} />
                </button>

                {/* Mobile Brand Title */}
                <div className="flex lg:hidden items-center gap-2.5 min-w-0" onClick={() => window.location.hash = '/'}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2d0a31] to-black p-0.5 border border-[#f97316]/40 flex items-center justify-center shrink-0">
                    <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-sm font-black font-display text-white uppercase truncate">
                    {config.titlePart1} <span className="text-[#facc15]">{config.titlePart2}</span>
                  </span>
                </div>

                {/* Desktop Tournament Badge */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold font-display text-gray-300">
                  <Shield size={14} className="text-[#f97316]" />
                  <span>SISTEMA DE ESTATÍSTICAS OFICIAIS</span>
                </div>
              </div>

              {/* Center: Wide Global Search */}
              {data && (
                <div className="hidden sm:block flex-1 max-w-md mx-2">
                  <GlobalSearch data={data} />
                </div>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Mobile Search Button */}
                {data && (
                  <div className="sm:hidden">
                    <GlobalSearch data={data} isCompact={true} />
                  </div>
                )}

                {/* Print & CSV Export buttons */}
                <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1 theme-card-surface">
                  <button 
                    onClick={handlePrint} 
                    title="Imprimir Página / Gerar PDF" 
                    className="p-2 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Printer size={16} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-0.5"></div>
                  <button 
                    onClick={handleExportCSV} 
                    title="Exportar Dados CSV" 
                    className="p-2 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                  </button>
                </div>

                {/* Global Theme Selector */}
                <ThemeSelector />

                {/* Live Sync Refresh Button */}
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title="Atualizar Dados Ao Vivo"
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#701a75] to-[#4b164c] hover:from-[#4b164c] hover:to-[#701a75] text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(112,26,117,0.3)] border border-white/10 ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden md:inline font-display uppercase tracking-wide">
                    {loading ? 'Carregando...' : 'Atualizar'}
                  </span>
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 relative">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-6 mt-8 bg-black/40 no-print">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2">
            <span className="font-bold">
              &copy; 2026 {config.titlePart1} {config.titlePart2} • <span className="text-yellow-400 font-bold">Dashboard desenvolvido por Jhan Medeiros Analista</span>
            </span>
            <div className="flex gap-2 text-[10px] text-gray-500 uppercase">
              <span className="text-[#f97316]">Domínio Total</span>
              <span>•</span>
              <span className="text-[#facc15]">Fogo Cruzado</span>
              <span>•</span>
              <span className="text-purple-400">Champions Rush</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
