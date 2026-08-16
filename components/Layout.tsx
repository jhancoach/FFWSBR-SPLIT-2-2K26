
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Skull, RefreshCw, Menu, X, Printer, Download, Settings, Map as MapIcon, Calendar, Image as ImageIcon } from 'lucide-react';
import { CSV_URLS, LOGO_URL } from '../constants';
import { AppConfig } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  config: AppConfig;
}

const Layout: React.FC<LayoutProps> = ({ children, onRefresh, loading, lastUpdated, config }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Classificação', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Cronograma', path: '/cronograma', icon: <Calendar size={20} /> },
    { name: 'Jogadores', path: '/players', icon: <Users size={20} /> },
    { name: 'Times', path: '/teams', icon: <Shield size={20} /> },
    { name: 'Killfeed', path: '/killfeed', icon: <Skull size={20} /> },
    { name: 'Estudos', path: '/estudos', icon: <MapIcon size={20} /> },
    { name: 'Banners', path: '/banners', icon: <ImageIcon size={20} /> },
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
    <div className="min-h-screen w-fit min-w-full text-gray-100 flex flex-col bg-transparent">
      {/* Developer Credit Top Bar */}
      <div className="bg-gradient-to-r from-yellow-500/15 via-amber-500/20 to-yellow-500/15 border-b border-yellow-500/30 py-1.5 px-4 sm:px-6 no-print shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 text-yellow-400 min-w-0">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0"></span>
            <span className="text-gray-200 truncate font-display">FFWSBR 2026 SPLIT 2 • PAINEL COMPETITIVO</span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/70 px-3 py-0.5 rounded-full border border-yellow-500/40 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.2)] shrink-0 whitespace-nowrap">
            <span>Dashboard desenvolvido por <strong className="text-white font-black">Jhan Medeiros Analista</strong></span>
          </div>
        </div>
      </div>

      {/* Navbar Temática */}
      <nav className="glass sticky top-0 z-50 no-print border-b border-white/10 backdrop-blur-md bg-black/60">
        <div className="max-w-[1800px] w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center gap-2 sm:gap-4">
            
            {/* Logo Dinâmica Oficial */}
            <div className="flex items-center gap-3 group cursor-pointer shrink-0" onClick={() => window.location.hash = '/'}>
              <div className="relative shrink-0">
                 <div className="absolute inset-0 bg-[#f97316] rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                 <div className="relative bg-gradient-to-br from-[#2d0a31] to-black p-0.5 rounded-xl border border-[#f97316]/30 overflow-hidden w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    <img src={LOGO_URL} alt="FFWSBR 2026 Logo" className="w-full h-full object-contain scale-110" />
                 </div>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-black italic tracking-wider font-display leading-tight text-white drop-shadow-md uppercase whitespace-nowrap">
                  {config.titlePart1} <span className="text-[#facc15]">{config.titlePart2}</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse shrink-0"></span>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-wider uppercase truncate">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner overflow-x-auto custom-scrollbar max-w-full">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 xl:px-4 py-2 xl:py-2.5 rounded-xl text-xs xl:text-sm font-black transition-all duration-200 font-display uppercase tracking-wider whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-lg shadow-orange-500/25 scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {React.cloneElement(item.icon, { size: 16 })}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden 2xl:flex flex-col items-end mr-1">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-black">Live Status</span>
                  <span className="text-xs text-[#facc15] font-mono font-bold">{lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
              </div>

              <div className="flex items-center bg-black/60 rounded-xl border border-white/10 p-1">
                  <button onClick={handlePrint} title="Imprimir" className="p-2 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"><Printer size={16} /></button>
                  <div className="w-px h-4 bg-white/10 mx-0.5"></div>
                  <button onClick={handleExportCSV} title="Exportar CSV" className="p-2 text-gray-400 hover:text-[#facc15] hover:bg-white/5 rounded-lg transition-colors"><Download size={16} /></button>
                  <div className="w-px h-4 bg-white/10 mx-0.5"></div>
                  <NavLink to="/admin" title="Configurações" className={({ isActive }) => `p-2 rounded-lg transition-colors ${isActive ? 'text-[#facc15] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Settings size={16} /></NavLink>
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#701a75] to-[#4b164c] hover:from-[#4b164c] hover:to-[#701a75] text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(112,26,117,0.3)] border border-white/10 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline font-display uppercase tracking-wide">{loading ? '...' : 'Live'}</span>
              </button>

              <div className="lg:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                  className="text-gray-300 hover:text-white p-2 rounded-xl bg-black/60 border border-white/10"
                  aria-label="Abrir Menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0e0712] border-b border-[#f97316]/20 animate-in slide-in-from-top-2">
            <div className="px-4 pt-3 pb-4 space-y-1.5 max-w-md mx-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black font-display uppercase tracking-wider transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#f97316] to-[#facc15] text-black shadow-md font-black'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {React.cloneElement(item.icon, { size: 18 })}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>
      
      <footer className="border-t border-white/5 py-6 mt-8 bg-black/40 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs font-mono flex flex-col items-center gap-2">
            <span className="font-bold">&copy; 2026 {config.titlePart1} {config.titlePart2} • <span className="text-yellow-400 font-bold">Dashboard desenvolvido por Jhan Medeiros Analista</span></span>
            <div className="flex gap-2 text-[10px] text-gray-500 uppercase">
                <span className="text-[#f97316]">Domínio Total</span>
                <span>•</span>
                <span className="text-[#facc15]">Fogo Cruzado</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
