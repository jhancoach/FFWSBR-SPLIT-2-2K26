
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import { fetchDashboardData, getAppConfig } from './services/dataService';
import { DashboardData } from './types';
import { DEFAULT_CONFIG } from './constants';
import { RefreshCw } from 'lucide-react';

// Lazy loading das páginas para navegação fluida, leve e instantânea
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Players = lazy(() => import('./pages/Players'));
const Teams = lazy(() => import('./pages/Teams'));
const KillFeedPage = lazy(() => import('./pages/KillFeedPage'));
const Studies = lazy(() => import('./pages/Studies'));
const Banners = lazy(() => import('./pages/Banners'));
const Admin = lazy(() => import('./pages/Admin'));

const PageLoader: React.FC = () => (
  <div className="w-full min-h-[450px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150">
    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-3 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      <RefreshCw size={22} className="animate-spin text-yellow-400" />
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
      Carregando tela...
    </span>
  </div>
);

// Componente para scroll automático suave ao trocar de rota
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC<{ data: DashboardData; loadData: () => void }> = ({ data, loadData }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="animate-in fade-in duration-200">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
          <Route path="/" element={<Leaderboard data={data} />} />
          <Route path="/cronograma" element={<Schedule data={data} />} />
          <Route path="/players" element={<Players data={data} />} />
          <Route path="/teams" element={<Teams data={data} />} />
          <Route path="/killfeed" element={<KillFeedPage data={data} />} />
          <Route path="/estudos" element={<Studies data={data} />} />
          <Route path="/banners" element={<Banners data={data} />} />
          <Route path="/admin" element={<Admin onRefresh={loadData} />} />
          <Route path="*" element={<Leaderboard data={data} />} />
        </Routes>
      </Suspense>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    players: [],
    killFeed: [],
    details: [],
    characters: [],
    teamsReference: [],
    playersDimension: [],
    victimsDimension: [],
    weapons: [],
    safes: [],
    hab1: [],
    hab2: [],
    hab3: [],
    hab4: [],
    pets: [],
    items: [],
    confrontationsDimension: [],
    loading: true,
    lastUpdated: null
  });

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSplash, setShowSplash] = useState(true);

  const loadData = useCallback(async () => {
    setConfig(getAppConfig());
    setData(prev => ({ ...prev, loading: true }));
    const newData = await fetchDashboardData();
    setData(newData);
    if (showSplash) {
        setTimeout(() => {
            setShowSplash(false);
        }, 800); 
    }
  }, [showSplash]);

  useEffect(() => {
    loadData();
  }, []);

  if (showSplash) {
      return <SplashScreen config={config} />;
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <Layout onRefresh={loadData} loading={data.loading} lastUpdated={data.lastUpdated} config={config}>
        <AppContent data={data} loadData={loadData} />
      </Layout>
    </HashRouter>
  );
};

export default App;
