
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Leaderboard from './pages/Leaderboard';
import Schedule from './pages/Schedule';
import Players from './pages/Players';
import Teams from './pages/Teams';
import KillFeedPage from './pages/KillFeedPage';
import Studies from './pages/Studies';
import Banners from './pages/Banners';
import Admin from './pages/Admin';
import SplashScreen from './components/SplashScreen';
import { fetchDashboardData, getAppConfig } from './services/dataService';
import { DashboardData } from './types';
import { DEFAULT_CONFIG } from './constants';

const AppContent: React.FC<{ data: DashboardData; loadData: () => void }> = ({ data, loadData }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <div className={path === '/' ? 'block' : 'hidden'}>
        <Leaderboard data={data} />
      </div>
      <div className={path === '/cronograma' ? 'block' : 'hidden'}>
        <Schedule data={data} />
      </div>
      <div className={path === '/players' ? 'block' : 'hidden'}>
        <Players data={data} />
      </div>
      <div className={path === '/teams' ? 'block' : 'hidden'}>
        <Teams data={data} />
      </div>
      <div className={path === '/killfeed' ? 'block' : 'hidden'}>
        <KillFeedPage data={data} />
      </div>
      <div className={path === '/estudos' ? 'block' : 'hidden'}>
        <Studies data={data} />
      </div>
      <div className={path === '/banners' ? 'block' : 'hidden'}>
        <Banners data={data} />
      </div>
      <div className={path === '/admin' ? 'block' : 'hidden'}>
        <Admin onRefresh={loadData} />
      </div>
    </>
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
      <Layout onRefresh={loadData} loading={data.loading} lastUpdated={data.lastUpdated} config={config}>
        <AppContent data={data} loadData={loadData} />
      </Layout>
    </HashRouter>
  );
};

export default App;
