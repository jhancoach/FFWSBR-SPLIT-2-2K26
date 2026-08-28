import React, { useMemo, useState } from 'react';
import { 
  MapIcon, 
  Swords, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Crown, 
  Skull, 
  Flame, 
  Zap, 
  Shield, 
  Crosshair, 
  Trophy, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { calculateMapDurationSec } from '../utils/kpmUtils';
import { normalize, parseNumber, calculateTeamStats, calculatePlayerStats } from '../lib/utils';
import { findDimImg } from '../utils/skillImages';
import { findTeamLogo } from '../utils/teamUtils';

const MAPS_CONFIG = [
  { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
  { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
  { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
  { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
  { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

export interface TeamVsTeamMapCompareProps {
  teamA: string;
  teamB: string;
  allDetails?: any[];
  allPlayers?: any[];
  killFeed?: any[];
  playersDimension?: any[];
  teamsReference?: any[];
  weapons?: any[];
  filters?: any;
  onPlayerClick?: (playerName: string) => void;
}

export const TeamVsTeamMapCompare: React.FC<TeamVsTeamMapCompareProps> = ({
  teamA,
  teamB,
  allDetails = [],
  allPlayers = [],
  killFeed = [],
  playersDimension = [],
  teamsReference = [],
  weapons = [],
  filters,
  onPlayerClick
}) => {
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('ALL');
  const [expandAll, setExpandAll] = useState<boolean>(true);

  const normA = normalize(teamA);
  const normB = normalize(teamB);

  // Quick player to team mapping helper
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    allPlayers.forEach((p: any) => {
      if (p.PLAYER && p.TIME) {
        map.set(normalize(p.PLAYER), p.TIME);
      }
    });
    playersDimension.forEach((dim: any) => {
      if (dim.Name && (dim.Equipe || dim.TIME)) {
        const team = dim.Equipe || dim.TIME;
        const key = normalize(dim.Name);
        if (!map.has(key)) map.set(key, team);
      }
    });
    return map;
  }, [allPlayers, playersDimension]);

  // Apply global filters (Rodada, Queda, Confronto)
  const filteredDetails = useMemo(() => {
    return allDetails.filter((d: any) => {
      if (filters?.rodada?.length > 0 && !filters.rodada.some((r: any) => normalize(r) === normalize(d.RD || d.Rd))) return false;
      if (filters?.queda?.length > 0 && !filters.queda.some((q: any) => normalize(q) === normalize(d.Q || d.Queda))) return false;
      if (filters?.confrontation?.length > 0 && !filters.confrontation.some((c: any) => normalize(c) === normalize(d.CONFRONTO || d.Confronto))) return false;
      return true;
    });
  }, [allDetails, filters]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((p: any) => {
      if (filters?.rodada?.length > 0 && !filters.rodada.some((r: any) => normalize(r) === normalize(p.RD || p.Rd))) return false;
      if (filters?.queda?.length > 0 && !filters.queda.some((q: any) => normalize(q) === normalize(p.Q || p.Queda))) return false;
      if (filters?.confrontation?.length > 0 && !filters.confrontation.some((c: any) => normalize(c) === normalize(p.CONFRONTO || p.Confronto))) return false;
      return true;
    });
  }, [allPlayers, filters]);

  const filteredKillFeed = useMemo(() => {
    return killFeed.filter((k: any) => {
      if (filters?.rodada?.length > 0 && !filters.rodada.some((r: any) => normalize(r) === normalize(k.RD || k.Rd))) return false;
      if (filters?.queda?.length > 0 && !filters.queda.some((q: any) => normalize(q) === normalize(k.Q || k.Queda))) return false;
      if (filters?.confrontation?.length > 0 && !filters.confrontation.some((c: any) => normalize(c) === normalize(k.CONFRONTO || k.Confronto))) return false;
      return true;
    });
  }, [killFeed, filters]);

  // Discover maps played by either team
  const availableMaps = useMemo(() => {
    const mapSet = new Set<string>();
    
    // Add from match details
    filteredDetails.forEach((d: any) => {
      if (d.MAPA && (normalize(d.TIME) === normA || normalize(d.TIME) === normB)) {
        mapSet.add(d.MAPA.trim());
      }
    });

    // Add from player data
    filteredPlayers.forEach((p: any) => {
      if (p.MAPA && (normalize(p.TIME) === normA || normalize(p.TIME) === normB)) {
        mapSet.add(p.MAPA.trim());
      }
    });

    // Add from kill feed
    filteredKillFeed.forEach((k: any) => {
      if (k.MAPA) {
        const kTeam = normalize(playerToTeamMap.get(normalize(k.PLAYER)) || '');
        const vTeam = normalize(playerToTeamMap.get(normalize(k.VITIMA)) || '');
        if (kTeam === normA || kTeam === normB || vTeam === normA || vTeam === normB) {
          mapSet.add(k.MAPA.trim());
        }
      }
    });

    // If still empty, pull all distinct maps from details
    if (mapSet.size === 0) {
      filteredDetails.forEach((d: any) => {
        if (d.MAPA) mapSet.add(d.MAPA.trim());
      });
    }

    const list = Array.from(mapSet);
    // Sort so canonical maps come in standard tournament order
    const priority = ['Bermuda', 'Purgatório', 'Kalahari', 'Nova Terra', 'Solara'];
    return list.sort((a, b) => {
      const idxA = priority.findIndex(p => normalize(p) === normalize(a));
      const idxB = priority.findIndex(p => normalize(p) === normalize(b));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [filteredDetails, filteredPlayers, filteredKillFeed, normA, normB, playerToTeamMap]);

  // Build territory-by-territory comparison payload
  const mapDataList = useMemo(() => {
    return availableMaps.map(mapName => {
      const normMap = normalize(mapName);

      // Match details per team
      const teamADetails = filteredDetails.filter((d: any) => normalize(d.TIME) === normA && normalize(d.MAPA) === normMap);
      const teamBDetails = filteredDetails.filter((d: any) => normalize(d.TIME) === normB && normalize(d.MAPA) === normMap);

      const statsA = calculateTeamStats({ details: teamADetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };
      const statsB = calculateTeamStats({ details: teamBDetails })[0] || { pts: 0, ptsc: 0, abts: 0, b: 0, s: 0, avgPts: '0.00', avgAbts: '0.00', avgPtsc: '0.00' };
      
      const durationSecA = calculateMapDurationSec(mapName) * (statsA.s || 0);
      const kpmA = durationSecA > 0 ? (statsA.abts / (durationSecA / 60)).toFixed(2) : '0.00';
      
      const durationSecB = calculateMapDurationSec(mapName) * (statsB.s || 0);
      const kpmB = durationSecB > 0 ? (statsB.abts / (durationSecB / 60)).toFixed(2) : '0.00';
      
      const kpmDiff = parseFloat(kpmA) - parseFloat(kpmB);
      

      // Players for Team A in this territory
      const rawPlayersA = filteredPlayers.filter((p: any) => normalize(p.TIME) === normA && normalize(p.MAPA) === normMap);
      let playersA = calculatePlayerStats({ players: rawPlayersA });

      // Fallback: If no player records in rawPlayersA, check killFeed for kills made by Team A on this map
      if (playersA.length === 0) {
        const teamAKillsInFeed = filteredKillFeed.filter((k: any) => {
          const t = normalize(playerToTeamMap.get(normalize(k.PLAYER)) || '');
          return t === normA && normalize(k.MAPA) === normMap;
        });
        const feedMap: Record<string, number> = {};
        teamAKillsInFeed.forEach((k: any) => {
          const p = k.PLAYER;
          if (p) feedMap[p] = (feedMap[p] || 0) + 1;
        });
        playersA = Object.entries(feedMap).map(([pName, kills]) => ({
          name: pName,
          j: pName,
          abts: kills,
          kills: kills,
          dmg: 0,
          dano: 0,
          hs: 0,
          matchesCount: statsA.s || 1,
          matches: statsA.s || 1,
          avgAbts: (kills / (statsA.s || 1)).toFixed(2),
          avgKills: (kills / (statsA.s || 1)).toFixed(2),
          avgDmg: '0',
          avgDano: '0',
          hsPercent: 0
        }));
      }

      // Players for Team B in this territory
      const rawPlayersB = filteredPlayers.filter((p: any) => normalize(p.TIME) === normB && normalize(p.MAPA) === normMap);
      let playersB = calculatePlayerStats({ players: rawPlayersB });

      // Fallback: If no player records in rawPlayersB, check killFeed for kills made by Team B on this map
      if (playersB.length === 0) {
        const teamBKillsInFeed = filteredKillFeed.filter((k: any) => {
          const t = normalize(playerToTeamMap.get(normalize(k.PLAYER)) || '');
          return t === normB && normalize(k.MAPA) === normMap;
        });
        const feedMap: Record<string, number> = {};
        teamBKillsInFeed.forEach((k: any) => {
          const p = k.PLAYER;
          if (p) feedMap[p] = (feedMap[p] || 0) + 1;
        });
        playersB = Object.entries(feedMap).map(([pName, kills]) => ({
          name: pName,
          j: pName,
          abts: kills,
          kills: kills,
          dmg: 0,
          dano: 0,
          hs: 0,
          matchesCount: statsB.s || 1,
          matches: statsB.s || 1,
          avgAbts: (kills / (statsB.s || 1)).toFixed(2),
          avgKills: (kills / (statsB.s || 1)).toFixed(2),
          avgDmg: '0',
          avgDano: '0',
          hsPercent: 0
        }));
      }

      // Sort players by kills descending, then damage descending
      playersA.sort((a: any, b: any) => (b.abts || b.kills || 0) - (a.abts || a.kills || 0) || (b.dmg || b.dano || 0) - (a.dmg || a.dano || 0));
      playersB.sort((a: any, b: any) => (b.abts || b.kills || 0) - (a.abts || a.kills || 0) || (b.dmg || b.dano || 0) - (a.dmg || a.dano || 0));

      // Direct duels on this map (Team A vs Team B)
      const directKillsAtoB = filteredKillFeed.filter((k: any) => {
        const killerTeam = normalize(playerToTeamMap.get(normalize(k.PLAYER)) || '');
        const victimTeam = normalize(playerToTeamMap.get(normalize(k.VITIMA)) || '');
        return normalize(k.MAPA) === normMap && killerTeam === normA && victimTeam === normB;
      });

      const directKillsBtoA = filteredKillFeed.filter((k: any) => {
        const killerTeam = normalize(playerToTeamMap.get(normalize(k.PLAYER)) || '');
        const victimTeam = normalize(playerToTeamMap.get(normalize(k.VITIMA)) || '');
        return normalize(k.MAPA) === normMap && killerTeam === normB && victimTeam === normA;
      });

      const directDuels = [
        ...directKillsAtoB.map((e: any) => ({ ...e, isTeamAKiller: true })),
        ...directKillsBtoA.map((e: any) => ({ ...e, isTeamAKiller: false }))
      ];

      const mapConfig = MAPS_CONFIG.find(mc => normalize(mc.name) === normMap);

      return {
        mapName,
        mapImg: mapConfig?.url,
        statsA,
        statsB,
        playersA,
        playersB,
        directDuels,
        killsAtoBCount: directKillsAtoB.length,
        killsBtoACount: directKillsBtoA.length
      };
    });
  }, [availableMaps, filteredDetails, filteredPlayers, filteredKillFeed, normA, normB, playerToTeamMap]);

  const teamALogo = findTeamLogo(teamA, teamsReference);
  const teamBLogo = findTeamLogo(teamB, teamsReference);

  const displayedMaps = useMemo(() => {
    if (selectedMapFilter === 'ALL') return mapDataList;
    return mapDataList.filter(m => normalize(m.mapName) === normalize(selectedMapFilter));
  }, [mapDataList, selectedMapFilter]);

  if (!mapDataList || mapDataList.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
        Nenhum dado de território encontrado para as equipes selecionadas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Bar & Controls */}
      <div className="bg-[#141414] rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Map Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedMapFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
              selectedMapFilter === 'ALL'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers size={14} /> Todos os Territórios ({mapDataList.length})
          </button>

          {mapDataList.map((m) => (
            <button
              key={m.mapName}
              onClick={() => setSelectedMapFilter(m.mapName)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
                selectedMapFilter === m.mapName
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {m.mapImg && (
                <img src={m.mapImg} alt={m.mapName} className="w-4 h-4 rounded-full object-cover" />
              )}
              {m.mapName}
            </button>
          ))}
        </div>

        {/* Global Expand / Collapse Button */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setExpandAll(prev => !prev)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
          >
            {expandAll ? (
              <>
                <ChevronUp size={14} /> Recolher Todos
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Expandir Todos
              </>
            )}
          </button>
        </div>
      </div>

      {/* List of Maps */}
      <div className="space-y-6">
        {displayedMaps.map((m, idx) => (
          <MapCard
            key={m.mapName || idx}
            mapData={m}
            teamA={teamA}
            teamB={teamB}
            teamALogo={teamALogo}
            teamBLogo={teamBLogo}
            playersDimension={playersDimension}
            weapons={weapons}
            forceOpen={expandAll}
            onPlayerClick={onPlayerClick}
          />
        ))}
      </div>
    </div>
  );
};

interface MapCardProps {
  mapData: any;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  playersDimension: any[];
  weapons: any[];
  forceOpen: boolean;
  onPlayerClick?: (playerName: string) => void;
}

const MapCard: React.FC<MapCardProps> = ({
  mapData,
  teamA,
  teamB,
  teamALogo,
  teamBLogo,
  playersDimension,
  weapons,
  forceOpen,
  onPlayerClick
}) => {
  const [isOpen, setIsOpen] = useState(true);

  React.useEffect(() => {
    setIsOpen(forceOpen);
  }, [forceOpen]);

  const {
    mapName,
    mapImg,
    statsA,
    statsB,
    playersA,
    playersB,
    directDuels,
    killsAtoBCount,
    killsBtoACount
  } = mapData;

  const totalPtsA = parseNumber(statsA.pts);
  const totalPtsB = parseNumber(statsB.pts);
  const isABetterPts = totalPtsA > totalPtsB;
  const isBBetterPts = totalPtsB > totalPtsA;

  const totalKillsA = parseNumber(statsA.abts);
  const totalKillsB = parseNumber(statsB.abts);

  const mapDurSec = calculateMapDurationSec(mapName);
  const totalMinsA = ((statsA.s || 1) * mapDurSec) / 60;
  const kpmA = totalMinsA > 0 ? (totalKillsA / totalMinsA).toFixed(3) : '0.000';
  const totalMinsB = ((statsB.s || 1) * mapDurSec) / 60;
  const kpmB = totalMinsB > 0 ? (totalKillsB / totalMinsB).toFixed(3) : '0.000';

  // Calculate MVP for Team A and Team B in this map
  const topPlayerA = playersA && playersA.length > 0 ? playersA[0] : null;
  const topPlayerB = playersB && playersB.length > 0 ? playersB[0] : null;

  return (
    <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 shadow-2xl overflow-hidden transition-all">
      {/* Header Banner */}
      <div
        className="relative bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 p-6 md:p-8 cursor-pointer hover:bg-white/[0.02] transition-all border-b border-white/5"
        onClick={() => setIsOpen(prev => !prev)}
      >
        {/* Subtle Map Background overlay if available */}
        {mapImg && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 overflow-hidden pointer-events-none">
            <img src={mapImg} alt="" className="w-full h-full object-cover blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-gray-950/80 to-gray-950" />
          </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          {/* Map Title & Overview */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shrink-0 overflow-hidden shadow-inner">
              {mapImg ? (
                <img src={mapImg} alt={mapName} className="w-full h-full object-cover" />
              ) : (
                <MapIcon size={28} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">{mapName}</h3>
                <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  {statsA.s || statsB.s || 0} Quedas
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider mt-2">
                <div className="flex items-center gap-2">
                  {teamALogo && <img src={teamALogo} alt={teamA} className="w-4 h-4 object-contain" />}
                  <span className={isABetterPts ? 'text-yellow-500 font-black' : 'text-gray-300'}>
                    {teamA}: <span className="font-black text-white">{totalPtsA} PTS</span> ({totalKillsA} Kills)
                  </span>
                </div>
                <span className="text-gray-600 font-black">VS</span>
                <div className="flex items-center gap-2">
                  {teamBLogo && <img src={teamBLogo} alt={teamB} className="w-4 h-4 object-contain" />}
                  <span className={isBBetterPts ? 'text-blue-400 font-black' : 'text-gray-300'}>
                    {teamB}: <span className="font-black text-white">{totalPtsB} PTS</span> ({totalKillsB} Kills)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action toggle & quick badges */}
          <div className="flex items-center gap-4 self-end md:self-auto">
            {directDuels.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider">
                <Swords size={14} />
                <span>{directDuels.length} Duelos Diretos</span>
              </div>
            )}
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-6 md:p-8 space-y-8 bg-black/40 border-t border-white/5">
          {/* Team Summary Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* TEAM A STATS */}
            <div className="bg-gradient-to-br from-yellow-500/5 via-black/40 to-transparent p-6 rounded-3xl border border-yellow-500/20 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-yellow-500/20 pb-4">
                <div className="flex items-center gap-3">
                  {teamALogo ? (
                    <img src={teamALogo} alt={teamA} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-500 font-black flex items-center justify-center text-xs">
                      {teamA.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-black text-yellow-500 uppercase italic tracking-wider">{teamA}</h4>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{mapName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white italic">{totalPtsA}</span>
                  <span className="text-[10px] text-yellow-500 font-black ml-1 uppercase">PTS</span>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Abates</span>
                  <span className="text-base font-black text-red-500">{totalKillsA}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Posição</span>
                  <span className="text-base font-black text-orange-500">{statsA.ptsc || 0}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Média Kills</span>
                  <span className="text-base font-black text-white">{statsA.avgAbts || '0.00'}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-yellow-500/20 bg-yellow-500/[0.03]">
                  <span className="text-[9px] text-yellow-500 font-bold uppercase block mb-1">KPM</span>
                  <span className="text-base font-black text-yellow-400 font-mono">{kpmA}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Booyahs</span>
                  <span className="text-base font-black text-yellow-500">{statsA.b || 0}</span>
                </div>
              </div>

              {/* PLAYERS & ABATES IN THIS TERRITORY */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Abates dos Jogadores em {mapName}
                  </h5>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">
                    {playersA.length} {playersA.length === 1 ? 'Jogador' : 'Jogadores'}
                  </span>
                </div>

                {playersA && playersA.length > 0 ? (
                  <div className="space-y-2.5">
                    {playersA.map((p: any, pIdx: number) => {
                      const pImg = findDimImg(playersDimension, p.name || p.j);
                      const isTop = pIdx === 0 && (p.abts || p.kills || 0) > 0;
                      const killCount = p.abts || p.kills || 0;
                      const dmgCount = p.dmg || p.dano || 0;
                      const killPct = totalKillsA > 0 ? Math.min(Math.round((killCount / totalKillsA) * 100), 100) : 0;

                      return (
                        <div
                          key={pIdx}
                          onClick={() => onPlayerClick && onPlayerClick(p.name || p.j)}
                          className={`p-3 rounded-2xl bg-black/60 border transition-all ${
                            isTop 
                              ? 'border-yellow-500/40 bg-yellow-500/[0.03] shadow-md shadow-yellow-500/5' 
                              : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                          } ${onPlayerClick ? 'cursor-pointer' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-9 h-9 rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {pImg ? (
                                  <img src={pImg} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-yellow-500 font-black text-xs">
                                    {(p.name || p.j || '?').substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                {isTop && (
                                  <div className="absolute top-0 right-0 bg-yellow-500 text-black p-0.5 rounded-bl">
                                    <Crown size={8} className="fill-black" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                                    {p.name || p.j}
                                  </span>
                                  {isTop && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">
                                      MVP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-gray-400 font-bold flex items-center gap-2 mt-0.5">
                                  <span>{p.matchesCount || p.matches || statsA.s || 1} Quedas</span>
                                  <span>•</span>
                                  <span>{p.avgAbts || p.avgKills || '0.00'} Kills/Queda</span>
                                </div>
                              </div>
                            </div>

                            {/* Kills & Damage Numbers */}
                            <div className="flex items-center gap-3 shrink-0 text-right">
                              <div>
                                <span className="text-sm font-black text-red-500">{killCount}</span>
                                <span className="text-[8px] text-gray-500 font-bold block uppercase">Kills</span>
                              </div>
                              <div className="border-l border-white/10 pl-3">
                                <span className="text-xs font-black text-yellow-500">{dmgCount}</span>
                                <span className="text-[8px] text-gray-500 font-bold block uppercase">Dano</span>
                              </div>
                            </div>
                          </div>

                          {/* Kill Contribution Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase">
                              <span>Participação nos Abates</span>
                              <span>{killPct}%</span>
                            </div>
                            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-red-600 to-yellow-500 rounded-full transition-all"
                                style={{ width: `${killPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-black/40 border border-dashed border-gray-800 text-center text-[10px] text-gray-500 font-bold uppercase">
                    Nenhum jogador registrado neste território
                  </div>
                )}
              </div>
            </div>

            {/* TEAM B STATS */}
            <div className="bg-gradient-to-br from-blue-500/5 via-black/40 to-transparent p-6 rounded-3xl border border-blue-500/20 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
                <div className="flex items-center gap-3">
                  {teamBLogo ? (
                    <img src={teamBLogo} alt={teamB} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                      {teamB.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-black text-blue-400 uppercase italic tracking-wider">{teamB}</h4>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{mapName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white italic">{totalPtsB}</span>
                  <span className="text-[10px] text-blue-400 font-black ml-1 uppercase">PTS</span>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Abates</span>
                  <span className="text-base font-black text-red-500">{totalKillsB}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Posição</span>
                  <span className="text-base font-black text-orange-500">{statsB.ptsc || 0}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Média Kills</span>
                  <span className="text-base font-black text-white">{statsB.avgAbts || '0.00'}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-blue-500/20 bg-blue-500/[0.03]">
                  <span className="text-[9px] text-blue-400 font-bold uppercase block mb-1">KPM</span>
                  <span className="text-base font-black text-blue-400 font-mono">{kpmB}</span>
                </div>
                <div className="bg-black/60 rounded-2xl p-3 text-center border border-white/5 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Booyahs</span>
                  <span className="text-base font-black text-blue-400">{statsB.b || 0}</span>
                </div>
              </div>

              {/* PLAYERS & ABATES IN THIS TERRITORY */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Abates dos Jogadores em {mapName}
                  </h5>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">
                    {playersB.length} {playersB.length === 1 ? 'Jogador' : 'Jogadores'}
                  </span>
                </div>

                {playersB && playersB.length > 0 ? (
                  <div className="space-y-2.5">
                    {playersB.map((p: any, pIdx: number) => {
                      const pImg = findDimImg(playersDimension, p.name || p.j);
                      const isTop = pIdx === 0 && (p.abts || p.kills || 0) > 0;
                      const killCount = p.abts || p.kills || 0;
                      const dmgCount = p.dmg || p.dano || 0;
                      const killPct = totalKillsB > 0 ? Math.min(Math.round((killCount / totalKillsB) * 100), 100) : 0;

                      return (
                        <div
                          key={pIdx}
                          onClick={() => onPlayerClick && onPlayerClick(p.name || p.j)}
                          className={`p-3 rounded-2xl bg-black/60 border transition-all ${
                            isTop 
                              ? 'border-blue-500/40 bg-blue-500/[0.03] shadow-md shadow-blue-500/5' 
                              : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                          } ${onPlayerClick ? 'cursor-pointer' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-9 h-9 rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {pImg ? (
                                  <img src={pImg} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-blue-400 font-black text-xs">
                                    {(p.name || p.j || '?').substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                {isTop && (
                                  <div className="absolute top-0 right-0 bg-blue-500 text-black p-0.5 rounded-bl">
                                    <Crown size={8} className="fill-black" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                                    {p.name || p.j}
                                  </span>
                                  {isTop && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                                      MVP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-gray-400 font-bold flex items-center gap-2 mt-0.5">
                                  <span>{p.matchesCount || p.matches || statsB.s || 1} Quedas</span>
                                  <span>•</span>
                                  <span>{p.avgAbts || p.avgKills || '0.00'} Kills/Queda</span>
                                </div>
                              </div>
                            </div>

                            {/* Kills & Damage Numbers */}
                            <div className="flex items-center gap-3 shrink-0 text-right">
                              <div>
                                <span className="text-sm font-black text-red-500">{killCount}</span>
                                <span className="text-[8px] text-gray-500 font-bold block uppercase">Kills</span>
                              </div>
                              <div className="border-l border-white/10 pl-3">
                                <span className="text-xs font-black text-blue-400">{dmgCount}</span>
                                <span className="text-[8px] text-gray-500 font-bold block uppercase">Dano</span>
                              </div>
                            </div>
                          </div>

                          {/* Kill Contribution Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase">
                              <span>Participação nos Abates</span>
                              <span>{killPct}%</span>
                            </div>
                            <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-red-600 to-blue-500 rounded-full transition-all"
                                style={{ width: `${killPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-black/40 border border-dashed border-gray-800 text-center text-[10px] text-gray-500 font-bold uppercase">
                    Nenhum jogador registrado neste território
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIRECT DUELS (KILL FEED NO TERRITÓRIO) */}
          <div className="pt-6 border-t border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Swords size={18} className="text-red-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">
                  Duelos Diretos (Kill Feed) em {mapName}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                  {teamA}: {killsAtoBCount} Abates
                </span>
                <span className="text-gray-600 font-bold">X</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {teamB}: {killsBtoACount} Abates
                </span>
              </div>
            </div>

            {directDuels && directDuels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {directDuels.map((ev: any, dIdx: number) => {
                  const isA = ev.isTeamAKiller;
                  const killerImg = findDimImg(playersDimension, ev.PLAYER);
                  const victimImg = findDimImg(playersDimension, ev.VITIMA);
                  const weaponImg = weapons.find((w: any) => normalize(w.Arma) === normalize(ev.ARMA))?.IMG;

                  return (
                    <div
                      key={dIdx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isA
                          ? 'bg-yellow-500/[0.04] border-yellow-500/20 hover:border-yellow-500/40'
                          : 'bg-blue-500/[0.04] border-blue-500/20 hover:border-blue-500/40'
                      }`}
                    >
                      {/* Killer & Victim */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Killer mini avatar */}
                        <div className="w-7 h-7 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {killerImg ? (
                            <img src={killerImg} alt={ev.PLAYER} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`text-[9px] font-black ${isA ? 'text-yellow-500' : 'text-blue-400'}`}>
                              {(ev.PLAYER || '?').substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => onPlayerClick && onPlayerClick(ev.PLAYER)}
                              className={`font-black uppercase truncate text-xs hover:underline cursor-pointer ${
                                isA ? 'text-yellow-500' : 'text-blue-400'
                              }`}
                            >
                              {ev.PLAYER}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                            <Skull size={10} className="text-red-500 shrink-0" />
                            <span 
                              onClick={() => onPlayerClick && onPlayerClick(ev.VITIMA)}
                              className="truncate hover:underline cursor-pointer text-gray-300"
                            >
                              {ev.VITIMA}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Weapon & Match metadata */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {ev.ARMA && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 border border-white/10 text-gray-300 text-[9px] font-black uppercase">
                            {weaponImg && (
                              <img src={weaponImg} alt={ev.ARMA} className="w-3 h-3 object-contain" />
                            )}
                            <span>{ev.ARMA}</span>
                          </div>
                        )}
                        <div className="text-[8px] text-gray-500 font-bold uppercase">
                          {ev.RD ? `RD ${ev.RD}` : ''}{ev.Q ? ` • Q${ev.Q}` : ''}{ev.SAFE ? ` • ${ev.SAFE}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-[10px] font-bold uppercase border border-dashed border-gray-800 rounded-2xl">
                Nenhum confronto direto registrado entre {teamA} e {teamB} neste território.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
