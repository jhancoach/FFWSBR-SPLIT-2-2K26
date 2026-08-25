
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats, PlayerData, KillFeed, MatchDetails } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Shield, TrendingUp, Users, ArrowLeft, Target, Award, Crosshair, Map as MapIcon, BarChart3, Star, Disc, Activity, Layers, Zap, ListOrdered, Trophy, ChevronDown, Medal, CheckCircle2, Flame, TrendingDown, LayoutGrid, LayoutList, MapPin, Scale, ArrowUp, ArrowDown, Calendar, User, Search, ArrowUpDown, BarChart2, Swords, AlertTriangle, Crown, Eye, EyeOff, Info, Skull, Sparkles, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend, CartesianGrid, YAxis } from 'recharts';
import FilterBar from '../components/FilterBar';
import { formatTeamName, findTeamLogo } from '../utils/teamUtils';
import { DropCompositionViewer } from '../components/DropComposition';
import { getTeamDropComposition, getTeamCharacterSummary, getTeamCharacters, getTeamMapSummaryDetail, isSameTeam } from '../utils/characterUtils';
import { findDimImg } from '../utils/skillImages';
import { TeamVsTeamCombatCompare } from '../components/TeamVsTeamCombatCompare';
import { TeamVsTeamSafeKillsCompare } from '../components/TeamVsTeamSafeKillsCompare';
import { TeamVsTeamMapCompare } from '../components/TeamVsTeamMapCompare';

interface TeamsProps {
  data: DashboardData;
}

const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];

const MAPS_CONFIG = [
  { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
  { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
  { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
  { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
  { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

const getTeamCharacteristic = (percentAbts: number, percentPos: number) => {
  const diff = Math.abs(percentAbts - percentPos);
  if (diff <= 5) return { label: 'Equilibrado', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <Activity size={14} /> };
  if (percentAbts > percentPos) return { label: 'Agressivo', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <Flame size={14} /> };
  return { label: 'Posicional', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: <Target size={14} /> };
};

const Teams: React.FC<TeamsProps> = ({ data }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    team: [] as string[],
    players: [] as string[],
    weapon: [] as string[],
    safe: [] as string[],
    map: [] as string[],
    rodada: [] as string[],
    queda: [] as string[],
    confrontation: [] as string[],
    grupo: [] as string[]
  });

  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'positions' | 'mapRanking' | 'bottomRanking' | 'mapAnalysis' | 'safeAnalysis' | 'comparison' | 'pointsTable' | 'teamRounds' | 'mapStats'>('gallery');
  const [positionTabFilter, setPositionTabFilter] = useState<number | 'ALL'>('ALL');
  const [positionSortConfig, setPositionSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'pos1', direction: 'desc' });
  const [expandedPositionTeam, setExpandedPositionTeam] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'pts', direction: 'desc' });
  const [compareTeamB, setCompareTeamB] = useState<string | null>(null);
  const [compositionModal, setCompositionModal] = useState<{ teamName: string; round: string; drop: string; mapa?: string; confronto?: string } | null>(null);
  const [expandedDropKey, setExpandedDropKey] = useState<string | null>(null);
  const [teamRoundsMapFilter, setTeamRoundsMapFilter] = useState<string>('ALL');
  const [expandAllLineups, setExpandAllLineups] = useState<boolean>(false);
  const [selectedSafeLocation, setSelectedSafeLocation] = useState<{ mapName: string, local: string } | null>(null);
  const [safeSortConfig, setSafeSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'pts', direction: 'desc' });
  const [mapStatsSearch, setMapStatsSearch] = useState<string>('');
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('ALL');
  const [showAllTeamsMap, setShowAllTeamsMap] = useState<boolean>(false);
  const [mapStatsSort, setMapStatsSort] = useState<{ field: 'totalKills' | 'avgKillsPerMatch' | 'totalMatches' | 'mapName'; direction: 'asc' | 'desc' }>({ field: 'totalKills', direction: 'desc' });
  const [mapRoundViewMode, setMapRoundViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [teamProfileSubTab, setTeamProfileSubTab] = useState<'all' | 'zeradas' | 'rounds' | 'mapKills' | 'safes' | 'lineups' | 'killfeedPhases'>('all');
  const [teamKillFeedPhaseFilter, setTeamKillFeedPhaseFilter] = useState<'ALL' | 'EARLY' | 'MID' | 'LATE'>('ALL');
  const [teamKillFeedEventType, setTeamKillFeedEventType] = useState<'all' | 'kills' | 'deaths'>('all');
  const [compareSubTab, setCompareSubTab] = useState<'all' | 'overview' | 'combat' | 'zeradas' | 'mapKills' | 'safeKills' | 'safes'>('all');
  const [showTeamDetails, setShowTeamDetails] = useState<boolean>(true);
  const [showTeamSectionMenu, setShowTeamSectionMenu] = useState<boolean>(false);
  const [teamVisibleSections, setTeamVisibleSections] = useState({
    header: true,
    mapStyles: true,
    zeradas: true,
    rounds: true,
    safes: true,
    mapKills: true,
    lineups: true,
    killfeedPhases: true,
    evolution: true,
    territorial: true,
    safesDistribution: true,
    positions: true,
    drops: true
  });

  const toggleTeamSection = (section: keyof typeof teamVisibleSections) => {
    setTeamVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const setAllTeamSections = (show: boolean) => {
    setTeamVisibleSections({
      header: show,
      mapStyles: show,
      zeradas: show,
      rounds: show,
      safes: show,
      mapKills: show,
      lineups: show,
      killfeedPhases: show,
      evolution: show,
      territorial: show,
      safesDistribution: show,
      positions: show,
      drops: show
    });
  };
  const [matrixViewMode, setMatrixViewMode] = useState<'both' | 'points' | 'kills'>('both');
  const [expandedMatrixCell, setExpandedMatrixCell] = useState<{ rd: string; q: string } | null>(null);
  const [expandedSafesMap, setExpandedSafesMap] = useState<Record<string, boolean>>({});
  const [lineupSortBy, setLineupSortBy] = useState<'matches' | 'points' | 'kills' | 'booyahs' | 'avgPts' | 'avgKills'>('matches');
  const [expandedLineupKey, setExpandedLineupKey] = useState<string | null>(null);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Análise de Comparação por Mapa
  const comparisonMapStats = useMemo(() => {
    if (!filters.team[0] || !compareTeamB) return [];
    
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    
    const maps = Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean) as string[];
    
    return maps.map(mapName => {
      const mapDetails = data.details.filter(d => normalize(d.MAPA) === normalize(mapName));
      
      // Filtros Globais (Rodada, Queda, Confronto) para os detalhes do mapa
      const mapFilteredDetails = mapDetails.filter(d => {
          if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
          if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
          if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;
          return true;
      });

      const statsA = calculateTeamStats({ ...data, details: mapFilteredDetails.filter(d => normalize(d.TIME) === normalize(teamA)) })[0] || {
        pts: 0, ptsc: 0, abts: 0, s: 0, avgPts: 0, avgAbts: 0, avgPtsc: 0
      };
      
      const statsB = calculateTeamStats({ ...data, details: mapFilteredDetails.filter(d => normalize(d.TIME) === normalize(teamB)) })[0] || {
        pts: 0, ptsc: 0, abts: 0, s: 0, avgPts: 0, avgAbts: 0, avgPtsc: 0
      };
      
      return {
        mapName,
        teamA: statsA,
        teamB: statsB
      };
    });
  }, [data, filters, compareTeamB]);

  const filteredData = useMemo(() => {
    const filteredDetails = data.details.filter(d => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(d.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(d.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(d.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(d.CONFRONTO))) return false;
      return true;
    });

    const filteredPlayers = data.players.filter(p => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(p.CONFRONTO))) return false;
      return true;
    });

    const filteredKillFeed = data.killFeed.filter(k => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(k.RD))) return false;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(k.Q))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.some(c => normalize(c) === normalize(k.CONFRONTO))) return false;
      return true;
    });

    return {
      ...data,
      details: filteredDetails,
      players: filteredPlayers,
      killFeed: filteredKillFeed
    };
  }, [data, filters]);

  // Comparativo de Estatísticas de Quedas Zeradas (0 pts ou 0 kills)
  const compareZeroStats = useMemo(() => {
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    if (!teamA || !teamB) return null;

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const computeZero = (team: string) => {
      const normT = normalize(team);
      const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normT);
      const totalMatches = teamMatches.length;

      let zeroPointsAndKills = 0;
      let zeroKillsOnly = 0;
      let zeroPointsOnly = 0;

      teamMatches.forEach(m => {
        const pts = parseNumber(m.PTS);
        const abts = parseNumber(m.ABTS);
        if (pts === 0 && abts === 0) zeroPointsAndKills++;
        else if (abts === 0) zeroKillsOnly++;
        else if (pts === 0) zeroPointsOnly++;
      });

      const totalZeroPts = zeroPointsAndKills + zeroPointsOnly;
      const totalZeroKills = zeroPointsAndKills + zeroKillsOnly;
      const pctZeroPts = totalMatches > 0 ? ((totalZeroPts / totalMatches) * 100).toFixed(1) : '0.0';

      return {
        totalMatches,
        zeroPointsAndKills,
        zeroKillsOnly,
        zeroPointsOnly,
        totalZeroPts,
        totalZeroKills,
        pctZeroPts
      };
    };

    return {
      teamA: computeZero(teamA),
      teamB: computeZero(teamB)
    };
  }, [filteredData.details, filters.team, compareTeamB]);

  // Comparativo de Abates e Mortes: Times e Jogadores que mais matam/morrem + Duelo Direto
  const compareCombatData = useMemo(() => {
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    if (!teamA || !teamB) return null;

    const normA = normalize(teamA);
    const normB = normalize(teamB);

    // Dicionários para resolução de imagens e metadados
    const playerDimMap = new Map<string, { img?: string; team?: string }>();
    (data.playersDimension || []).forEach(d => {
      if (d.Name) playerDimMap.set(normalize(d.Name), { img: d.IMG, team: d.Time });
    });

    const teamDimMap = new Map<string, { img?: string; grupo?: string }>();
    (data.teamsReference || []).forEach(t => {
      if (t.TIME) teamDimMap.set(normalize(t.TIME), { img: t.IMG, grupo: t.GRUPO });
    });

    // Mapeamento rápido de jogador -> time em cada queda
    const playerMatchTeamMap = new Map<string, string>();
    (data.players || []).forEach(p => {
      if (p.PLAYER && p.TIME) {
        const key = `${normalize(p.PLAYER)}|${normalize(p.RD)}|${normalize(p.Q)}`;
        playerMatchTeamMap.set(key, p.TIME);
      }
    });

    // Helper para identificar se um registro ou jogador pertence a um time
    const getPlayerTeamInEvent = (playerName: string, rd?: string, q?: string, explicitTeam?: string): string => {
      if (explicitTeam && explicitTeam.trim() !== '') return explicitTeam.trim();
      const normP = normalize(playerName);
      if (rd && q) {
        const key = `${normP}|${normalize(rd)}|${normalize(q)}`;
        const found = playerMatchTeamMap.get(key);
        if (found) return found;
      }
      const dim = playerDimMap.get(normP);
      if (dim?.team) return dim.team;
      return '';
    };

    const isTeamMatch = (teamCandidate: string, targetNormTeam: string): boolean => {
      if (!teamCandidate) return false;
      const cNorm = normalize(teamCandidate);
      if (cNorm === targetNormTeam) return true;
      return isSameTeam(teamCandidate, targetNormTeam, data.teamsReference);
    };

    // Estatísticas para cada time
    const computeTeamCombatStats = (teamName: string, normTeam: string) => {
      const victimPlayersMap = new Map<string, { count: number; team?: string }>();
      const killerPlayersMap = new Map<string, { count: number; team?: string }>();
      const victimTeamsMap = new Map<string, number>();
      const killerTeamsMap = new Map<string, number>();
      const killerWeaponsMap = new Map<string, number>();
      const victimWeaponsMap = new Map<string, number>();

      let totalKillsMade = 0;
      let totalDeathsSuffered = 0;

      (filteredData.killFeed || []).forEach(k => {
        const killerName = (k.PLAYER || '').trim();
        const victimName = (k.VITIMA || '').trim();
        if (!killerName && !victimName) return;

        const killerTeam = getPlayerTeamInEvent(killerName, k.RD, k.Q, (k as any).TIME || (k as any).TIME_ASSASSINO);
        const victimTeam = getPlayerTeamInEvent(victimName, k.RD, k.Q, (k as any).TIME_VITIMA);

        const isKillerMyTeam = isTeamMatch(killerTeam, normTeam);
        const isVictimMyTeam = isTeamMatch(victimTeam, normTeam);

        // 1. Time fez o abate
        if (isKillerMyTeam && victimName) {
          totalKillsMade++;
          if (k.ARMA) {
            killerWeaponsMap.set(k.ARMA, (killerWeaponsMap.get(k.ARMA) || 0) + 1);
          }

          // Vítima (Jogador)
          const currVp = victimPlayersMap.get(victimName) || { count: 0, team: victimTeam };
          currVp.count++;
          if (victimTeam && !currVp.team) currVp.team = victimTeam;
          victimPlayersMap.set(victimName, currVp);

          // Time Vítima
          if (victimTeam && !isTeamMatch(victimTeam, normTeam)) {
            victimTeamsMap.set(victimTeam, (victimTeamsMap.get(victimTeam) || 0) + 1);
          }
        }

        // 2. Time sofreu a morte
        if (isVictimMyTeam && killerName) {
          totalDeathsSuffered++;
          if (k.ARMA) {
            victimWeaponsMap.set(k.ARMA, (victimWeaponsMap.get(k.ARMA) || 0) + 1);
          }

          // Algoz (Jogador)
          const currKp = killerPlayersMap.get(killerName) || { count: 0, team: killerTeam };
          currKp.count++;
          if (killerTeam && !currKp.team) currKp.team = killerTeam;
          killerPlayersMap.set(killerName, currKp);

          // Time Algoz
          if (killerTeam && !isTeamMatch(killerTeam, normTeam)) {
            killerTeamsMap.set(killerTeam, (killerTeamsMap.get(killerTeam) || 0) + 1);
          }
        }
      });

      // Formatar listas
      const victimTeams = Array.from(victimTeamsMap.entries()).map(([name, count]) => {
        const tDim = teamDimMap.get(normalize(name));
        const logo = tDim?.img || findTeamLogo(name, data.teamsReference);
        return {
          name,
          count,
          img: logo || undefined,
          grupo: tDim?.grupo || undefined
        };
      }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const killerTeams = Array.from(killerTeamsMap.entries()).map(([name, count]) => {
        const tDim = teamDimMap.get(normalize(name));
        const logo = tDim?.img || findTeamLogo(name, data.teamsReference);
        return {
          name,
          count,
          img: logo || undefined,
          grupo: tDim?.grupo || undefined
        };
      }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const victimPlayers = Array.from(victimPlayersMap.entries()).map(([name, obj]) => {
        const pDim = playerDimMap.get(normalize(name));
        const pImg = pDim?.img || findDimImg(data.playersDimension, name);
        const resolvedTeam = obj.team || pDim?.team || '';
        const teamLogo = findTeamLogo(resolvedTeam, data.teamsReference);
        return {
          name,
          count: obj.count,
          team: resolvedTeam,
          img: pImg || undefined,
          teamImg: teamLogo || undefined
        };
      }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const killerPlayers = Array.from(killerPlayersMap.entries()).map(([name, obj]) => {
        const pDim = playerDimMap.get(normalize(name));
        const pImg = pDim?.img || findDimImg(data.playersDimension, name);
        const resolvedTeam = obj.team || pDim?.team || '';
        const teamLogo = findTeamLogo(resolvedTeam, data.teamsReference);
        return {
          name,
          count: obj.count,
          team: resolvedTeam,
          img: pImg || undefined,
          teamImg: teamLogo || undefined
        };
      }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const kdRatio = totalDeathsSuffered > 0 ? (totalKillsMade / totalDeathsSuffered).toFixed(2) : totalKillsMade.toFixed(2);

      const getWeaponImg = (name: string) => {
        if (!name) return undefined;
        const w = (data.weapons || []).find(w => w.Arma && w.Arma.trim().toLowerCase() === name.trim().toLowerCase());
        return w?.IMG;
      };

      const killerWeapons = Array.from(killerWeaponsMap.entries()).map(([name, count]) => ({
        name,
        count,
        img: getWeaponImg(name)
      })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      const victimWeapons = Array.from(victimWeaponsMap.entries()).map(([name, count]) => ({
        name,
        count,
        img: getWeaponImg(name)
      })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

      return {
        name: teamName,
        totalKillsMade,
        totalDeathsSuffered,
        kdRatio,
        victimTeams,
        killerTeams,
        victimPlayers,
        killerPlayers,
        killerWeapons,
        victimWeapons
      };
    };

    // Confrontos Diretos Team A vs Team B
    let teamAKillsTeamB = 0;
    let teamBKillsTeamA = 0;
    const directEvents: any[] = [];

    (filteredData.killFeed || []).forEach(k => {
      const killerName = (k.PLAYER || '').trim();
      const victimName = (k.VITIMA || '').trim();
      if (!killerName || !victimName) return;

      const killerTeam = getPlayerTeamInEvent(killerName, k.RD, k.Q, (k as any).TIME || (k as any).TIME_ASSASSINO);
      const victimTeam = getPlayerTeamInEvent(victimName, k.RD, k.Q, (k as any).TIME_VITIMA);

      const isKillerA = isTeamMatch(killerTeam, normA);
      const isVictimA = isTeamMatch(victimTeam, normA);
      const isKillerB = isTeamMatch(killerTeam, normB);
      const isVictimB = isTeamMatch(victimTeam, normB);

      if (isKillerA && isVictimB) {
        teamAKillsTeamB++;
        directEvents.push({
          ...k,
          isTeamAKiller: true,
          killerTeam: teamA,
          victimTeam: teamB
        });
      } else if (isKillerB && isVictimA) {
        teamBKillsTeamA++;
        directEvents.push({
          ...k,
          isTeamAKiller: false,
          killerTeam: teamB,
          victimTeam: teamA
        });
      }
    });

    const totalDirectDuels = teamAKillsTeamB + teamBKillsTeamA;
    const teamAWinRate = totalDirectDuels > 0 ? ((teamAKillsTeamB / totalDirectDuels) * 100).toFixed(1) : '50.0';
    const teamBWinRate = totalDirectDuels > 0 ? ((teamBKillsTeamA / totalDirectDuels) * 100).toFixed(1) : '50.0';

    return {
      teamA: computeTeamCombatStats(teamA, normA),
      teamB: computeTeamCombatStats(teamB, normB),
      headToHead: {
        teamAKillsTeamB,
        teamBKillsTeamA,
        totalDirectDuels,
        teamAWinRate,
        teamBWinRate,
        directEvents
      }
    };
  }, [filteredData.killFeed, filteredData.players, filters.team, compareTeamB, data.playersDimension, data.teamsReference, data.players]);

  // Comparativo de Abates por Rodada de Cada Mapa e MVPs
  const compareMapKillsAndMvpData = useMemo(() => {
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    if (!teamA || !teamB) return [];

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const normA = normalize(teamA);
    const normB = normalize(teamB);

    // Mapear mapas disputados por qualquer uma das equipes
    const mapsSet = new Set<string>();
    filteredData.details.forEach(m => {
      if (m.MAPA && (normalize(m.TIME) === normA || normalize(m.TIME) === normB)) {
        mapsSet.add(m.MAPA.trim());
      }
    });

    const sortedMaps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));

    return sortedMaps.map(mapName => {
      const normMap = normalize(mapName);

      const getTeamMapData = (teamName: string, normT: string) => {
        const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normT && normalize(d.MAPA) === normMap);
        const teamPlayerRecords = filteredData.players.filter(p => normalize(p.TIME) === normT && normalize(p.MAPA) === normMap);

        const totalMatches = teamMatches.length;
        const totalTeamKills = teamMatches.reduce((acc, m) => acc + parseNumber(m.ABTS), 0);
        const avgKillsPerMatch = totalMatches > 0 ? (totalTeamKills / totalMatches).toFixed(2) : '0.00';

        // Abates por Rodada de Cada Mapa
        const roundKillsMap: Record<string, { totalKills: number; matchesCount: number }> = {};
        teamMatches.forEach(m => {
          const rd = m.RD ? m.RD.trim() : 'N/A';
          if (!roundKillsMap[rd]) {
            roundKillsMap[rd] = { totalKills: 0, matchesCount: 0 };
          }
          roundKillsMap[rd].totalKills += parseNumber(m.ABTS);
          roundKillsMap[rd].matchesCount += 1;
        });

        const roundsList = Object.entries(roundKillsMap).map(([rd, rObj]) => {
          const avgKills = rObj.matchesCount > 0 ? (rObj.totalKills / rObj.matchesCount).toFixed(2) : '0.00';
          return {
            rd,
            totalKills: rObj.totalKills,
            matchesCount: rObj.matchesCount,
            avgKills
          };
        }).sort((x, y) => {
          const numX = parseInt(x.rd.replace(/\D/g, '')) || 0;
          const numY = parseInt(y.rd.replace(/\D/g, '')) || 0;
          if (numX !== numY) return numX - numY;
          return x.rd.localeCompare(y.rd);
        });

        // Abates por Jogador da Equipe neste Mapa
        const playerStatsMap = new Map<string, {
          name: string;
          kills: number;
          dano: number;
          hs: number;
          matches: Set<string>;
        }>();

        teamPlayerRecords.forEach(p => {
          const pName = p.PLAYER ? p.PLAYER.trim() : '';
          if (!pName) return;

          if (!playerStatsMap.has(pName)) {
            playerStatsMap.set(pName, {
              name: pName,
              kills: 0,
              dano: 0,
              hs: 0,
              matches: new Set()
            });
          }

          const pObj = playerStatsMap.get(pName)!;
          pObj.kills += parseNumber(p.Abates);
          pObj.dano += parseNumber(p.Dano);
          pObj.hs += parseNumber(p.HS);
          const matchKey = `${p.RD || ''}-${p.Q || ''}-${p.CONFRONTO || ''}`;
          pObj.matches.add(matchKey);
        });

        const playerList = Array.from(playerStatsMap.values()).map(p => {
          const matchesCount = p.matches.size || 1;
          const avgKills = (p.kills / matchesCount).toFixed(2);
          const avgDano = (p.dano / matchesCount).toFixed(0);
          const playerImg = findDimImg(data.playersDimension, p.name);

          return {
            name: p.name,
            kills: p.kills,
            dano: p.dano,
            hs: p.hs,
            matchesCount,
            avgKills,
            avgKillsNum: parseFloat(avgKills),
            avgDano,
            playerImg
          };
        }).sort((x, y) => {
          if (y.kills !== x.kills) return y.kills - x.kills;
          if (y.dano !== x.dano) return y.dano - x.dano;
          return x.name.localeCompare(y.name);
        });

        const mvpPlayer = playerList.length > 0 ? playerList[0] : null;

        return {
          totalMatches,
          totalTeamKills,
          avgKillsPerMatch,
          roundsList,
          playerList,
          mvpPlayer
        };
      };

      return {
        mapName,
        teamA: getTeamMapData(teamA, normA),
        teamB: getTeamMapData(teamB, normB)
      };
    }).sort((x, y) => x.mapName.localeCompare(y.mapName));
  }, [filteredData.details, filteredData.players, filters.team, compareTeamB, data.playersDimension]);

  // Comparativo de Desempenho por Safe
  const compareSafesMapData = useMemo(() => {
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    if (!teamA || !teamB) return [];

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const normA = normalize(teamA);
    const normB = normalize(teamB);

    // Mapear mapas disputados por qualquer uma das equipes
    const mapsSet = new Set<string>();
    filteredData.details.forEach(m => {
      if (m.MAPA && m.ONDE_FECHOU && (normalize(m.TIME) === normA || normalize(m.TIME) === normB)) {
        mapsSet.add(m.MAPA.trim());
      }
    });

    const sortedMaps = Array.from(mapsSet).sort((x, y) => x.localeCompare(y));

    return sortedMaps.map(mapName => {
      const normMap = normalize(mapName);

      const getTeamSafeData = (normT: string) => {
        const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normT && normalize(d.MAPA) === normMap && d.ONDE_FECHOU);
        
        const localsMap = new Map<string, {
          localName: string;
          matchesCount: number;
          totalPts: number;
          totalKills: number;
          booyahs: number;
        }>();

        teamMatches.forEach(m => {
          const local = m.ONDE_FECHOU.trim();
          if (!localsMap.has(local)) {
            localsMap.set(local, {
              localName: local,
              matchesCount: 0,
              totalPts: 0,
              totalKills: 0,
              booyahs: 0
            });
          }
          const obj = localsMap.get(local)!;
          obj.matchesCount += 1;
          obj.totalPts += parseNumber(m.PTS);
          obj.totalKills += parseNumber(m.ABTS);
          const pos = parseNumber(m.POS);
          if (pos === 1 || parseNumber(m.B) > 0) {
            obj.booyahs += 1;
          }
        });

        return Array.from(localsMap.values()).map(loc => {
          const avgPts = loc.matchesCount > 0 ? loc.totalPts / loc.matchesCount : 0;
          const avgKills = loc.matchesCount > 0 ? loc.totalKills / loc.matchesCount : 0;
          return {
            ...loc,
            avgPts: avgPts.toFixed(2),
            avgPtsNum: avgPts,
            avgKills: avgKills.toFixed(2),
            avgKillsNum: avgKills
          };
        }).sort((x, y) => y.avgPtsNum - x.avgPtsNum);
      };

      const safesA = getTeamSafeData(normA);
      const safesB = getTeamSafeData(normB);

      // Best & Worst (Top 3)
      const bestA = safesA.slice(0, 3);
      const worstA = [...safesA].reverse().filter(s => !bestA.includes(s)).slice(0, 3);

      const bestB = safesB.slice(0, 3);
      const worstB = [...safesB].reverse().filter(s => !bestB.includes(s)).slice(0, 3);

      return {
        mapName,
        teamA: {
          best: bestA,
          worst: worstA
        },
        teamB: {
          best: bestB,
          worst: worstB
        }
      };
    }).sort((x, y) => x.mapName.localeCompare(y.mapName));
  }, [filteredData.details, filters.team, compareTeamB]);

  // Comparativo de Abates por Safe do Kill Feed
  const compareSafeKillsData = useMemo(() => {
    const teamA = filters.team[0];
    const teamB = compareTeamB;
    if (!teamA || !teamB) return null;

    const normA = normalize(teamA);
    const normB = normalize(teamB);

    // Dicionários para resolução de imagens e metadados
    const playerDimMap = new Map<string, { img?: string; team?: string }>();
    (data.playersDimension || []).forEach(d => {
      if (d.Name) playerDimMap.set(normalize(d.Name), { img: d.IMG, team: d.Time });
    });

    const playerMatchTeamMap = new Map<string, string>();
    (data.players || []).forEach(p => {
      if (p.PLAYER && p.TIME) {
        const key = `${normalize(p.PLAYER)}|${normalize(p.RD)}|${normalize(p.Q)}`;
        playerMatchTeamMap.set(key, p.TIME);
      }
    });

    const getPlayerTeamInEvent = (playerName: string, rd?: string, q?: string, explicitTeam?: string): string => {
      if (explicitTeam && explicitTeam.trim() !== '') return explicitTeam.trim();
      const normP = normalize(playerName);
      if (rd && q) {
        const key = `${normP}|${normalize(rd)}|${normalize(q)}`;
        const found = playerMatchTeamMap.get(key);
        if (found) return found;
      }
      const dim = playerDimMap.get(normP);
      if (dim?.team) return dim.team;
      return '';
    };

    const isTeamMatch = (teamCandidate: string, targetNormTeam: string): boolean => {
      if (!teamCandidate) return false;
      const cNorm = normalize(teamCandidate);
      if (cNorm === targetNormTeam) return true;
      return isSameTeam(teamCandidate, targetNormTeam, data.teamsReference);
    };

    // Helper para normalizar o nome da Safe
    const normalizeSafeKey = (rawSafe: string | undefined): { key: string; label: string; group: 'early' | 'mid' | 'late' | 'other' } => {
      if (!rawSafe || rawSafe.trim() === '') return { key: 'SAFE_1', label: 'Safe 1', group: 'early' };
      const clean = rawSafe.trim().toUpperCase();
      const num = parseInt(clean.replace(/\D/g, ''));
      if (num === 1 || clean === '1' || clean.includes('SAFE 1') || clean === 'S1') return { key: 'SAFE_1', label: 'Safe 1', group: 'early' };
      if (num === 2 || clean === '2' || clean.includes('SAFE 2') || clean === 'S2') return { key: 'SAFE_2', label: 'Safe 2', group: 'early' };
      if (num === 3 || clean === '3' || clean.includes('SAFE 3') || clean === 'S3') return { key: 'SAFE_3', label: 'Safe 3', group: 'mid' };
      if (num === 4 || clean === '4' || clean.includes('SAFE 4') || clean === 'S4') return { key: 'SAFE_4', label: 'Safe 4', group: 'mid' };
      if (num === 5 || clean === '5' || clean.includes('SAFE 5') || clean === 'S5') return { key: 'SAFE_5', label: 'Safe 5', group: 'late' };
      if (num === 6 || clean === '6' || clean.includes('SAFE 6') || clean === 'S6') return { key: 'SAFE_6', label: 'Safe 6', group: 'late' };
      if (num >= 7 || clean === '7' || clean.includes('SAFE 7') || clean === 'S7') return { key: 'SAFE_7', label: 'Safe 7+', group: 'late' };
      return { key: `SAFE_${clean}`, label: `Safe ${clean}`, group: 'other' };
    };

    const STANDARD_SAFES = [
      { key: 'SAFE_1', label: 'Safe 1', group: 'early' as const },
      { key: 'SAFE_2', label: 'Safe 2', group: 'early' as const },
      { key: 'SAFE_3', label: 'Safe 3', group: 'mid' as const },
      { key: 'SAFE_4', label: 'Safe 4', group: 'mid' as const },
      { key: 'SAFE_5', label: 'Safe 5', group: 'late' as const },
      { key: 'SAFE_6', label: 'Safe 6', group: 'late' as const },
      { key: 'SAFE_7', label: 'Safe 7+', group: 'late' as const },
    ];

    // Aggregation containers per safe
    const phaseStatsMap = new Map<string, {
      safeKey: string;
      safeLabel: string;
      phaseGroup: 'early' | 'mid' | 'late' | 'other';
      teamAKills: number;
      teamADeaths: number;
      teamBKills: number;
      teamBDeaths: number;
      directDuelsA: number;
      directDuelsB: number;
      killersA: Map<string, number>;
      killersB: Map<string, number>;
      weaponsA: Map<string, number>;
      weaponsB: Map<string, number>;
    }>();

    STANDARD_SAFES.forEach(s => {
      phaseStatsMap.set(s.key, {
        safeKey: s.key,
        safeLabel: s.label,
        phaseGroup: s.group,
        teamAKills: 0,
        teamADeaths: 0,
        teamBKills: 0,
        teamBDeaths: 0,
        directDuelsA: 0,
        directDuelsB: 0,
        killersA: new Map(),
        killersB: new Map(),
        weaponsA: new Map(),
        weaponsB: new Map(),
      });
    });

    let totalKillsA = 0;
    let totalKillsB = 0;
    let totalDeathsA = 0;
    let totalDeathsB = 0;

    const directSafeDuels: Array<{
      player: string;
      victim: string;
      weapon?: string;
      mapa?: string;
      safe: string;
      rd?: string;
      q?: string;
      isTeamAKiller: boolean;
    }> = [];

    // Map breakdown structure
    const mapSafeStatsMap = new Map<string, Map<string, { teamAKills: number; teamBKills: number }>>();

    (filteredData.killFeed || []).forEach(k => {
      const killerName = (k.PLAYER || '').trim();
      const victimName = (k.VITIMA || '').trim();
      if (!killerName && !victimName) return;

      const killerTeam = getPlayerTeamInEvent(killerName, k.RD, k.Q, (k as any).TIME || (k as any).TIME_ASSASSINO);
      const victimTeam = getPlayerTeamInEvent(victimName, k.RD, k.Q, (k as any).TIME_VITIMA);

      const isKillerA = isTeamMatch(killerTeam, normA);
      const isVictimA = isTeamMatch(victimTeam, normA);
      const isKillerB = isTeamMatch(killerTeam, normB);
      const isVictimB = isTeamMatch(victimTeam, normB);

      const safeInfo = normalizeSafeKey(k.SAFE);
      if (!phaseStatsMap.has(safeInfo.key)) {
        phaseStatsMap.set(safeInfo.key, {
          safeKey: safeInfo.key,
          safeLabel: safeInfo.label,
          phaseGroup: safeInfo.group,
          teamAKills: 0,
          teamADeaths: 0,
          teamBKills: 0,
          teamBDeaths: 0,
          directDuelsA: 0,
          directDuelsB: 0,
          killersA: new Map(),
          killersB: new Map(),
          weaponsA: new Map(),
          weaponsB: new Map(),
        });
      }

      const safeObj = phaseStatsMap.get(safeInfo.key)!;
      const mapName = (k.MAPA || 'Mapa').trim();
      if (!mapSafeStatsMap.has(mapName)) {
        mapSafeStatsMap.set(mapName, new Map());
      }
      const mapObj = mapSafeStatsMap.get(mapName)!;
      if (!mapObj.has(safeInfo.key)) {
        mapObj.set(safeInfo.key, { teamAKills: 0, teamBKills: 0 });
      }
      const mapSafeObj = mapObj.get(safeInfo.key)!;

      // Team A Kills
      if (isKillerA) {
        totalKillsA++;
        safeObj.teamAKills++;
        mapSafeObj.teamAKills++;
        if (killerName) safeObj.killersA.set(killerName, (safeObj.killersA.get(killerName) || 0) + 1);
        if (k.ARMA) safeObj.weaponsA.set(k.ARMA, (safeObj.weaponsA.get(k.ARMA) || 0) + 1);
      }

      // Team A Deaths
      if (isVictimA) {
        totalDeathsA++;
        safeObj.teamADeaths++;
      }

      // Team B Kills
      if (isKillerB) {
        totalKillsB++;
        safeObj.teamBKills++;
        mapSafeObj.teamBKills++;
        if (killerName) safeObj.killersB.set(killerName, (safeObj.killersB.get(killerName) || 0) + 1);
        if (k.ARMA) safeObj.weaponsB.set(k.ARMA, (safeObj.weaponsB.get(k.ARMA) || 0) + 1);
      }

      // Team B Deaths
      if (isVictimB) {
        totalDeathsB++;
        safeObj.teamBDeaths++;
      }

      // Direct duel in safe
      if (isKillerA && isVictimB) {
        safeObj.directDuelsA++;
        directSafeDuels.push({
          player: killerName,
          victim: victimName,
          weapon: k.ARMA,
          mapa: k.MAPA,
          safe: safeInfo.label,
          rd: k.RD,
          q: k.Q,
          isTeamAKiller: true
        });
      } else if (isKillerB && isVictimA) {
        safeObj.directDuelsB++;
        directSafeDuels.push({
          player: killerName,
          victim: victimName,
          weapon: k.ARMA,
          mapa: k.MAPA,
          safe: safeInfo.label,
          rd: k.RD,
          q: k.Q,
          isTeamAKiller: false
        });
      }
    });

    // Format Phases
    const phases = Array.from(phaseStatsMap.values()).map(p => {
      const teamAPct = totalKillsA > 0 ? parseFloat(((p.teamAKills / totalKillsA) * 100).toFixed(1)) : 0;
      const teamBPct = totalKillsB > 0 ? parseFloat(((p.teamBKills / totalKillsB) * 100).toFixed(1)) : 0;
      const teamAKd = p.teamADeaths > 0 ? (p.teamAKills / p.teamADeaths).toFixed(2) : p.teamAKills.toFixed(2);
      const teamBKd = p.teamBDeaths > 0 ? (p.teamBKills / p.teamBDeaths).toFixed(2) : p.teamBKills.toFixed(2);

      // Top killer A
      const topKillerAEntry = Array.from(p.killersA.entries()).sort((a, b) => b[1] - a[1])[0];
      const topKillerA = topKillerAEntry ? {
        name: topKillerAEntry[0],
        kills: topKillerAEntry[1],
        img: findDimImg(data.playersDimension, topKillerAEntry[0]) || undefined
      } : undefined;

      // Top killer B
      const topKillerBEntry = Array.from(p.killersB.entries()).sort((a, b) => b[1] - a[1])[0];
      const topKillerB = topKillerBEntry ? {
        name: topKillerBEntry[0],
        kills: topKillerBEntry[1],
        img: findDimImg(data.playersDimension, topKillerBEntry[0]) || undefined
      } : undefined;

      // Top weapon A
      const topWeaponAEntry = Array.from(p.weaponsA.entries()).sort((a, b) => b[1] - a[1])[0];
      const topWeaponA = topWeaponAEntry ? { name: topWeaponAEntry[0], count: topWeaponAEntry[1] } : undefined;

      // Top weapon B
      const topWeaponBEntry = Array.from(p.weaponsB.entries()).sort((a, b) => b[1] - a[1])[0];
      const topWeaponB = topWeaponBEntry ? { name: topWeaponBEntry[0], count: topWeaponBEntry[1] } : undefined;

      return {
        safeKey: p.safeKey,
        safeLabel: p.safeLabel,
        phaseGroup: p.phaseGroup,
        teamAKills: p.teamAKills,
        teamAPct,
        teamADeaths: p.teamADeaths,
        teamAKd,
        teamBKills: p.teamBKills,
        teamBPct,
        teamBDeaths: p.teamBDeaths,
        teamBKd,
        directDuelsA: p.directDuelsA,
        directDuelsB: p.directDuelsB,
        topKillerA,
        topKillerB,
        topWeaponA,
        topWeaponB
      };
    });

    // Calculate early / mid / late aggregates
    const earlyPhases = phases.filter(p => p.phaseGroup === 'early');
    const midPhases = phases.filter(p => p.phaseGroup === 'mid');
    const latePhases = phases.filter(p => p.phaseGroup === 'late');

    const earlyKillsA = earlyPhases.reduce((acc, p) => acc + p.teamAKills, 0);
    const earlyKillsB = earlyPhases.reduce((acc, p) => acc + p.teamBKills, 0);
    const earlyDuelsA = earlyPhases.reduce((acc, p) => acc + p.directDuelsA, 0);
    const earlyDuelsB = earlyPhases.reduce((acc, p) => acc + p.directDuelsB, 0);

    const midKillsA = midPhases.reduce((acc, p) => acc + p.teamAKills, 0);
    const midKillsB = midPhases.reduce((acc, p) => acc + p.teamBKills, 0);
    const midDuelsA = midPhases.reduce((acc, p) => acc + p.directDuelsA, 0);
    const midDuelsB = midPhases.reduce((acc, p) => acc + p.directDuelsB, 0);

    const lateKillsA = latePhases.reduce((acc, p) => acc + p.teamAKills, 0);
    const lateKillsB = latePhases.reduce((acc, p) => acc + p.teamBKills, 0);
    const lateDuelsA = latePhases.reduce((acc, p) => acc + p.directDuelsA, 0);
    const lateDuelsB = latePhases.reduce((acc, p) => acc + p.directDuelsB, 0);

    const gamePhases = {
      early: {
        teamAKills: earlyKillsA,
        teamAPct: totalKillsA > 0 ? parseFloat(((earlyKillsA / totalKillsA) * 100).toFixed(1)) : 0,
        teamBKills: earlyKillsB,
        teamBPct: totalKillsB > 0 ? parseFloat(((earlyKillsB / totalKillsB) * 100).toFixed(1)) : 0,
        duelsA: earlyDuelsA,
        duelsB: earlyDuelsB
      },
      mid: {
        teamAKills: midKillsA,
        teamAPct: totalKillsA > 0 ? parseFloat(((midKillsA / totalKillsA) * 100).toFixed(1)) : 0,
        teamBKills: midKillsB,
        teamBPct: totalKillsB > 0 ? parseFloat(((midKillsB / totalKillsB) * 100).toFixed(1)) : 0,
        duelsA: midDuelsA,
        duelsB: midDuelsB
      },
      late: {
        teamAKills: lateKillsA,
        teamAPct: totalKillsA > 0 ? parseFloat(((lateKillsA / totalKillsA) * 100).toFixed(1)) : 0,
        teamBKills: lateKillsB,
        teamBPct: totalKillsB > 0 ? parseFloat(((lateKillsB / totalKillsB) * 100).toFixed(1)) : 0,
        duelsA: lateDuelsA,
        duelsB: lateDuelsB
      }
    };

    // Map breakdown formatting
    const mapBreakdown: any[] = Array.from(mapSafeStatsMap.entries()).map(([mapName, safeMap]) => {
      let teamATotal = 0;
      let teamBTotal = 0;
      const mapSafes = STANDARD_SAFES.map(s => {
        const entry = safeMap.get(s.key) || { teamAKills: 0, teamBKills: 0 };
        teamATotal += entry.teamAKills;
        teamBTotal += entry.teamBKills;
        return {
          safeKey: s.key,
          safeLabel: s.label,
          phaseGroup: s.group,
          teamAKills: entry.teamAKills,
          teamBKills: entry.teamBKills
        };
      });

      return {
        mapName,
        teamATotalKills: teamATotal,
        teamBTotalKills: teamBTotal,
        safes: mapSafes
      };
    }).filter(m => m.teamATotalKills > 0 || m.teamBTotalKills > 0).sort((a, b) => (b.teamATotalKills + b.teamBTotalKills) - (a.teamATotalKills + a.teamBTotalKills));

    return {
      totalKillsA,
      totalKillsB,
      totalDeathsA,
      totalDeathsB,
      phases,
      gamePhases,
      mapBreakdown,
      directSafeDuels
    };
  }, [filteredData.killFeed, filteredData.players, filters.team, compareTeamB, data.playersDimension, data.teamsReference, data.players]);

  useEffect(() => {
      if (location.state?.team) {
          setFilters(prev => ({ ...prev, team: [location.state.team] }));
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const filteredTeamStats = useMemo(() => {
    const stats = calculateTeamStats(filteredData);
    
    // Filtro de Grupo
    if (filters.grupo.length > 0) {
      return stats.filter(s => s.grupo && filters.grupo.some(g => normalize(g) === normalize(s.grupo)));
    }
    
    return stats;
  }, [filteredData, filters.grupo]);
  
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: [], 
    weapons: [], 
    safes: [], 
    maps: Array.from(new Set(data.players.map(p => p.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.players.map(p => p.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.players.map(p => p.Q))).filter(Boolean).sort(),
    confrontations: Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort(),
    grupos: Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[]
  }), [data.players, data.teamsReference, data.confrontationsDimension, data.killFeed, data.details, data.characters]);

  const selectedTeamName = filters.team.length === 1 ? filters.team[0] : null;

  const displayTeamStats = useMemo(() => {
    if (filters.team.length === 0) return filteredTeamStats;
    return filteredTeamStats.filter(t => {
      const normT = normalize(t.name);
      return filters.team.some(ft => {
        const normFt = normalize(ft);
        return normT === normFt || normT.includes(normFt) || normFt.includes(normT);
      });
    });
  }, [filteredTeamStats, filters.team]);

  const selectedTeamStats = useMemo(() => {
    if (!selectedTeamName) return null;
    const norm = normalize(selectedTeamName);
    return filteredTeamStats.find(t => normalize(t.name) === norm) ||
      filteredTeamStats.find(t => t.name.toLowerCase().includes(selectedTeamName.toLowerCase()) || selectedTeamName.toLowerCase().includes(t.name.toLowerCase())) ||
      null;
  }, [filteredTeamStats, selectedTeamName]);

  const activeTeamName = selectedTeamStats?.name || selectedTeamName || '';

  const teamCharSummary = useMemo(() => {
    if (!activeTeamName) return null;
    return getTeamCharacterSummary(data, activeTeamName);
  }, [data, activeTeamName]);

  const teamMapCharacterSummary = useMemo(() => {
    if (!activeTeamName || !data.characters) return [];

    const teamChars = getTeamCharacters(data, activeTeamName);
    if (teamChars.length === 0) return [];

    const maps = Array.from(new Set(teamChars.map(c => c.Mapa))).filter(Boolean) as string[];

    return maps.map(mapName => getTeamMapSummaryDetail(data, activeTeamName, mapName))
      .sort((a, b) => b.dropCount - a.dropCount);
  }, [data, activeTeamName]);

  const teamMapStylesData = useMemo(() => {
    if (!selectedTeamName) return [];
    
    const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normalize(selectedTeamName));
    const mapsSet = new Set<string>();
    teamMatches.forEach(m => { if (m.MAPA) mapsSet.add(m.MAPA.trim()); });
    
    const sortedMaps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));
    
    return sortedMaps.map(mapName => {
      const mapFilteredMatches = teamMatches.filter(d => normalize(d.MAPA) === normalize(mapName));
      let totalPts = 0;
      let totalAbates = 0;
      let totalPtsColocacao = 0;
      
      mapFilteredMatches.forEach(m => {
          const abts = typeof m.ABTS === 'number' ? m.ABTS : parseFloat(String(m.ABTS || '0').replace(',', '.'));
          const ptsc = typeof m.PTSC === 'number' ? m.PTSC : parseFloat(String(m.PTSC || '0').replace(',', '.'));
          const pts = typeof m.PTS === 'number' ? m.PTS : parseFloat(String(m.PTS || '0').replace(',', '.'));
          
          totalAbates += isNaN(abts) ? 0 : abts;
          totalPtsColocacao += isNaN(ptsc) ? 0 : ptsc;
          totalPts += isNaN(pts) ? 0 : pts;
      });
      
      const percentAbts = totalPts > 0 ? Math.round((totalAbates / totalPts) * 100) : 0;
      const percentPos = totalPts > 0 ? Math.round((totalPtsColocacao / totalPts) * 100) : 0;
      
      const characteristic = getTeamCharacteristic(percentAbts, percentPos);
      
      return {
          mapName,
          totalMatches: mapFilteredMatches.length,
          totalPts,
          totalAbates,
          totalPtsColocacao,
          percentAbts,
          percentPos,
          characteristic
      };
    });
  }, [filteredData.details, selectedTeamName]);

  // Reset local states if team changes and switch tab to gallery if single team selected
  useEffect(() => {
    setSelectedMap(null);
    setSelectedDrop(null);
    setSelectedPosition(null);
    setTeamRoundsMapFilter('ALL');
    setExpandAllLineups(false);
    setSelectedSafeLocation(null);
    if (filters.team.length === 1 && activeTab !== 'comparison' && activeTab !== 'teamRounds' && activeTab !== 'positions') {
      setActiveTab('gallery');
    }
  }, [filters.team]);

  // Roster do time ordenado por kills
  const teamRosterData = useMemo(() => {
      const rosters: Record<string, { name: string, kills: number, matches: number, avg: string }[]> = {};
      
      filteredData.players.forEach(p => {
          if (!p.TIME) return;
          if (!rosters[p.TIME]) rosters[p.TIME] = [];
          
          let player = rosters[p.TIME].find(pl => pl.name === p.PLAYER);
          if (!player) {
              player = { name: p.PLAYER, kills: 0, matches: 0, avg: '0.00' };
              rosters[p.TIME].push(player);
          }
          player.kills += parseInt(p.Abates || '0');
          player.matches += 1;
      });

      Object.keys(rosters).forEach(t => {
          rosters[t].forEach(p => {
              p.avg = p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00';
          });
          rosters[t].sort((a, b) => b.kills - a.kills);
      });

      return rosters;
  }, [filteredData.players]);

  const currentRoster = useMemo(() => {
    if (!selectedTeamName) return [];
    const norm = normalize(selectedTeamName);
    const matchedKey = Object.keys(teamRosterData).find(k => normalize(k) === norm) ||
      Object.keys(teamRosterData).find(k => normalize(k).includes(norm) || norm.includes(normalize(k)));
    return matchedKey ? teamRosterData[matchedKey] : [];
  }, [teamRosterData, selectedTeamName]);

  // Estatísticas de Posição (Quantidade de partidas por posição)
  const positionStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const counts: Record<number, number> = {};
    filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
        const pos = parseInt(d.POS) || 0;
        if (pos > 0) counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts).map(([pos, count]) => ({ 
        pos: parseInt(pos), 
        count 
    })).sort((a, b) => a.pos - b.pos);
  }, [filteredData.details, selectedTeamName]);

  // Evolução por Rodada e Confronto
  const evolutionData = useMemo(() => {
     if (!selectedTeamName) return [];
     const matchesMap = new Map<string, { label: string, rd: string, confronto: string, pts: number, kills: number }>();
     
     filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
         if (!d.RD) return;
         const conf = d.CONFRONTO || '';
         const key = `${conf}|${d.RD}`;
         
         if (!matchesMap.has(key)) {
             matchesMap.set(key, { 
                 label: conf ? `${conf} - R${d.RD}` : `R${d.RD}`,
                 rd: d.RD, 
                 confronto: conf,
                 pts: 0, 
                 kills: 0
             });
         }
         const m = matchesMap.get(key)!;
         m.pts += parseInt(d.PTS) || 0;
         m.kills += parseInt(d.ABTS) || 0;
     });

     return Array.from(matchesMap.values()).sort((a, b) => {
         const rdA = parseInt(a.rd.replace(/\D/g, '')) || 0;
         const rdB = parseInt(b.rd.replace(/\D/g, '')) || 0;
         if (rdA !== rdB) return rdA - rdB;

         const confA = parseInt(a.confronto.replace(/\D/g, '')) || 0;
         const confB = parseInt(b.confronto.replace(/\D/g, '')) || 0;
         if (confA !== confB) return confA - confB;
         return a.confronto.localeCompare(b.confronto);
     });
  }, [filteredData.details, selectedTeamName]);

  // Detalhes das partidas para a posição selecionada
  const selectedPositionMatchDetails = useMemo(() => {
    if (!selectedTeamName || selectedPosition === null) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && parseInt(d.POS) === selectedPosition)
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [filteredData.details, selectedTeamName, selectedPosition]);

  // Detalhes das partidas para o mapa selecionado
  const selectedMapMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedMap) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && normalize(d.MAPA) === normalize(selectedMap))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        if (rdA !== rdB) return rdA - rdB;
        return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
      });
  }, [filteredData.details, selectedTeamName, selectedMap]);

  // Performance por Partida / Queda
  const dropStatsData = useMemo(() => {
      if (!selectedTeamName) return [];
      const stats = new Map<string, { q: string, pts: number, kills: number, matches: number }>();

      filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
          const q = d.Q || '1';
          if (!stats.has(q)) stats.set(q, { q, pts: 0, kills: 0, matches: 0 });
          const s = stats.get(q)!;
          s.pts += parseInt(d.PTS) || 0;
          s.kills += parseInt(d.ABTS) || 0;
          s.matches += 1;
      });

      return Array.from(stats.values()).map(s => ({
          ...s,
          avgPts: (s.pts / s.matches).toFixed(2),
          avgKills: (s.kills / s.matches).toFixed(2)
      })).sort((a, b) => parseInt(a.q) - parseInt(b.q));
  }, [filteredData.details, selectedTeamName]);

  // Detalhes das partidas para a queda selecionada
  const selectedDropMatchDetails = useMemo(() => {
    if (!selectedTeamName || !selectedDrop) return [];
    return filteredData.details.filter(d => d.TIME === selectedTeamName && normalize(d.Q) === normalize(selectedDrop))
      .sort((a, b) => {
        const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
        const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
        return rdA - rdB;
      });
  }, [filteredData.details, selectedTeamName, selectedDrop]);

  // Performance por Mapa Completo
  const mapPerformanceData = useMemo(() => {
    if (!selectedTeamName) return [];
    const stats = new Map<string, { map: string, pts: number, ptsc: number, kills: number, matches: number, booyahs: number }>();
    
    filteredData.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
        const m = d.MAPA || 'N/A';
        if (!stats.has(m)) stats.set(m, { map: m, pts: 0, ptsc: 0, kills: 0, matches: 0, booyahs: 0 });
        const s = stats.get(m)!;
        s.pts += parseInt(d.PTS) || 0;
        s.ptsc += parseInt(d.PTSC) || 0;
        s.kills += parseInt(d.ABTS) || 0;
        s.matches += 1;
        if (parseInt(d.B) > 0) s.booyahs += 1;
    });

    return Array.from(stats.values()).map(s => ({
        ...s,
        avgPts: (s.pts / s.matches).toFixed(2),
        avgPtsc: (s.ptsc / s.matches).toFixed(2),
        avgKills: (s.kills / s.matches).toFixed(2)
    })).sort((a, b) => b.pts - a.pts);
  }, [filteredData.details, selectedTeamName]);

  // Abates por Safe
  const safeStatsData = useMemo(() => {
    if (!selectedTeamName) return [];
    const teamPlayers = new Set(filteredData.players.filter(p => p.TIME === selectedTeamName).map(p => normalize(p.PLAYER)));
    const safeCounts: Record<string, number> = {};

    filteredData.killFeed.forEach(k => {
        if (teamPlayers.has(normalize(k.PLAYER))) {
            const safe = k.SAFE || 'OUT';
            safeCounts[safe] = (safeCounts[safe] || 0) + 1;
        }
    });

    return Object.entries(safeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filteredData.killFeed, filteredData.players, selectedTeamName]);

  // Estatísticas de Quedas Zeradas do Time (0 pts ou 0 kills)
  const zeroStatsTeam = useMemo(() => {
    if (!selectedTeamName) return null;

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const teamMatches = filteredData.details.filter(d => {
      if (normalize(d.TIME) !== normalize(selectedTeamName)) return false;
      
      const hasMap = d.MAPA && d.MAPA.trim() !== "";
      const hasPts = d.PTS !== "" && d.PTS !== undefined && d.PTS !== null;
      const hasAbts = d.ABTS !== "" && d.ABTS !== undefined && d.ABTS !== null;
      
      return hasMap && (hasPts || hasAbts);
    });
    const totalMatches = teamMatches.length;

    const zeroPointsAndKillsMatches: MatchDetails[] = [];
    const zeroKillsOnlyMatches: MatchDetails[] = [];
    const zeroPointsOnlyMatches: MatchDetails[] = [];

    teamMatches.forEach(m => {
      const pts = parseNumber(m.PTS);
      const abts = parseNumber(m.ABTS);

      if (pts === 0 && abts === 0) {
        zeroPointsAndKillsMatches.push(m);
      } else if (abts === 0) {
        zeroKillsOnlyMatches.push(m);
      } else if (pts === 0) {
        zeroPointsOnlyMatches.push(m);
      }
    });

    const totalZeradasAbsoluta = zeroPointsAndKillsMatches.length;
    const totalZeroKills = zeroPointsAndKillsMatches.length + zeroKillsOnlyMatches.length;
    const totalZeroPts = zeroPointsAndKillsMatches.length + zeroPointsOnlyMatches.length;

    const allZeradasList = [...zeroPointsAndKillsMatches, ...zeroKillsOnlyMatches, ...zeroPointsOnlyMatches].sort((a, b) => {
      const rdA = parseInt(a.RD.replace(/\D/g, '')) || 0;
      const rdB = parseInt(b.RD.replace(/\D/g, '')) || 0;
      if (rdA !== rdB) return rdA - rdB;
      return (parseInt(a.Q) || 0) - (parseInt(b.Q) || 0);
    });

    const zeroByMap: Record<string, number> = {};
    allZeradasList.forEach(m => {
      const map = m.MAPA || 'N/A';
      zeroByMap[map] = (zeroByMap[map] || 0) + 1;
    });

    const zeroByQ: Record<string, number> = {};
    allZeradasList.forEach(m => {
      const q = m.Q ? `Q${m.Q}` : 'N/A';
      zeroByQ[q] = (zeroByQ[q] || 0) + 1;
    });

    return {
      totalMatches,
      totalZeradasAbsoluta,
      totalZeroKills,
      totalZeroPts,
      pctZeradas: totalMatches > 0 ? ((totalZeroPts / totalMatches) * 100).toFixed(1) : '0.0',
      zeroPointsAndKillsMatches,
      zeroKillsOnlyMatches,
      zeroPointsOnlyMatches,
      allZeradasList,
      zeroByMap,
      zeroByQ
    };
  }, [filteredData.details, selectedTeamName]);

  // Matriz de Pontos e Abates por Rodada e por Queda do Time
  const teamRoundsAndDropsMatrix = useMemo(() => {
    if (!selectedTeamName) return { rounds: [], dropsList: [], summary: { totalPts: 0, totalKills: 0, totalMatches: 0, avgPtsPerMatch: '0.00', avgKillsPerMatch: '0.00' } };

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normalize(selectedTeamName));

    const roundsSet = new Set<string>();
    const dropsSet = new Set<string>();

    teamMatches.forEach(m => {
      if (m.RD) roundsSet.add(m.RD.trim());
      if (m.Q) dropsSet.add(m.Q.trim());
    });

    const sortedRounds = Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const sortedDrops = Array.from(dropsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const matrix: Record<string, Record<string, MatchDetails>> = {};
    const roundTotals: Record<string, { totalPts: number; totalKills: number; totalPtsc: number; matchesCount: number; booyahs: number }> = {};

    sortedRounds.forEach(rd => {
      matrix[rd] = {};
      roundTotals[rd] = { totalPts: 0, totalKills: 0, totalPtsc: 0, matchesCount: 0, booyahs: 0 };
    });

    let grandTotalPts = 0;
    let grandTotalKills = 0;
    let grandTotalMatches = teamMatches.length;

    teamMatches.forEach(m => {
      const rd = m.RD ? m.RD.trim() : '';
      const q = m.Q ? m.Q.trim() : '';
      if (!rd || !q) return;

      if (!matrix[rd]) matrix[rd] = {};
      matrix[rd][q] = m;

      const pts = parseNumber(m.PTS);
      const abts = parseNumber(m.ABTS);
      const ptsc = parseNumber(m.PTSC);
      const pos = parseNumber(m.POS);
      const isBooyah = pos === 1 || parseNumber(m.B) > 0;

      grandTotalPts += pts;
      grandTotalKills += abts;

      if (roundTotals[rd]) {
        roundTotals[rd].totalPts += pts;
        roundTotals[rd].totalKills += abts;
        roundTotals[rd].totalPtsc += ptsc;
        roundTotals[rd].matchesCount += 1;
        if (isBooyah) roundTotals[rd].booyahs += 1;
      }
    });

    const roundsList = sortedRounds.map(rd => ({
      rd,
      drops: matrix[rd] || {},
      totals: roundTotals[rd] || { totalPts: 0, totalKills: 0, totalPtsc: 0, matchesCount: 0, booyahs: 0 },
      avgPts: (roundTotals[rd]?.matchesCount || 0) > 0 ? (roundTotals[rd].totalPts / roundTotals[rd].matchesCount).toFixed(2) : '0.00',
      avgKills: (roundTotals[rd]?.matchesCount || 0) > 0 ? (roundTotals[rd].totalKills / roundTotals[rd].matchesCount).toFixed(2) : '0.00'
    }));

    return {
      rounds: roundsList,
      dropsList: sortedDrops,
      summary: {
        totalPts: grandTotalPts,
        totalKills: grandTotalKills,
        totalMatches: grandTotalMatches,
        avgPtsPerMatch: grandTotalMatches > 0 ? (grandTotalPts / grandTotalMatches).toFixed(2) : '0.00',
        avgKillsPerMatch: grandTotalMatches > 0 ? (grandTotalKills / grandTotalMatches).toFixed(2) : '0.00'
      }
    };
  }, [filteredData.details, selectedTeamName]);

  // LINEUPS (FORMAÇÕES) DA EQUIPE
  const teamLineupsData = useMemo(() => {
    const targetTeam = activeTeamName || selectedTeamName || (filters.team.length === 1 ? filters.team[0] : null);
    if (!targetTeam) return null;

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    // Pegamos todas as partidas (quedas) válidas que o time jogou
    const teamMatches = filteredData.details.filter(d => {
      if (!isSameTeam(d.TIME, targetTeam, data.teamsReference)) return false;
      const hasMap = d.MAPA && d.MAPA.trim() !== "";
      const hasPts = d.PTS !== "" && d.PTS !== undefined && d.PTS !== null;
      const hasAbts = d.ABTS !== "" && d.ABTS !== undefined && d.ABTS !== null;
      return hasMap && (hasPts || hasAbts);
    });

    const lineupsMap = new Map<string, {
      id: string;
      players: string[];
      matches: number;
      kills: number;
      points: number;
      ptsc: number;
      booyahs: number;
      zeroPts: number;
      matchesList: {
        rd: string;
        q: string;
        mapa: string;
        confronto?: string;
        pts: number;
        kills: number;
        ptsc: number;
        pos: number;
        booyah: boolean;
      }[];
    }>();

    teamMatches.forEach(match => {
      const rdClean = (match.RD || '').toString().replace(/\D/g, '');
      const qClean = (match.Q || match.S || '').toString().replace(/\D/g, '');

      const playerNamesSet = new Set<string>();

      // 1. Prioridade: dados de Personagens/Loadout (que possui os 4 jogadores exatos por queda)
      if (data.characters && data.characters.length > 0) {
        data.characters.forEach(c => {
          if (!c || !c.Player) return;
          if (!isSameTeam(c.Time, targetTeam, data.teamsReference)) return;
          const cRd = (c.Rd || c.RD || '').toString().replace(/\D/g, '');
          const cQ = (c.Q || c.S || '').toString().replace(/\D/g, '');
          if (cRd === rdClean && cQ === qClean) {
            playerNamesSet.add(c.Player.trim());
          }
        });
      }

      // 2. Se não encontrou em characters, busca em players
      if (playerNamesSet.size === 0 && data.players && data.players.length > 0) {
        data.players.forEach(p => {
          if (!p || !p.PLAYER) return;
          if (!isSameTeam(p.TIME, targetTeam, data.teamsReference)) return;
          const pRd = (p.RD || '').toString().replace(/\D/g, '');
          const pQ = (p.Q || p.S || '').toString().replace(/\D/g, '');
          if (pRd === rdClean && pQ === qClean) {
            playerNamesSet.add(p.PLAYER.trim());
          }
        });
      }

      // 3. Fallback killFeed
      if (playerNamesSet.size === 0 && data.killFeed && data.killFeed.length > 0) {
        data.killFeed.forEach(k => {
          const kRd = (k.RD || '').toString().replace(/\D/g, '');
          const kQ = (k.Q || '').toString().replace(/\D/g, '');
          if (kRd === rdClean && kQ === qClean) {
            if (isSameTeam(k.TIME_ASSASSINO, targetTeam, data.teamsReference) && k.ASSASSINO) {
              playerNamesSet.add(k.ASSASSINO.trim());
            }
            if (isSameTeam(k.TIME_VITIMA, targetTeam, data.teamsReference) && k.VITIMA) {
              playerNamesSet.add(k.VITIMA.trim());
            }
          }
        });
      }

      const playerNames = Array.from(playerNamesSet).sort((a, b) => a.localeCompare(b));
      if (playerNames.length === 0) return;

      const lineupKey = playerNames.join(' • ');

      const pts = parseNumber(match.PTS);
      const kills = parseNumber(match.ABTS);
      const ptsc = parseNumber(match.PTSC);
      const pos = parseInt(String(match.POS)) || 0;
      const booyah = pos === 1 || parseNumber(match.B) === 1;

      const matchRec = {
        rd: match.RD || '1',
        q: match.Q || '1',
        mapa: match.MAPA || 'N/A',
        confronto: match.CONFRONTO,
        pts,
        kills,
        ptsc,
        pos,
        booyah
      };

      if (lineupsMap.has(lineupKey)) {
        const existing = lineupsMap.get(lineupKey)!;
        existing.matches += 1;
        existing.kills += kills;
        existing.points += pts;
        existing.ptsc += ptsc;
        if (booyah) existing.booyahs += 1;
        if (pts === 0) existing.zeroPts += 1;
        existing.matchesList.push(matchRec);
      } else {
        lineupsMap.set(lineupKey, {
          id: lineupKey,
          players: playerNames,
          matches: 1,
          kills,
          points: pts,
          ptsc,
          booyahs: booyah ? 1 : 0,
          zeroPts: pts === 0 ? 1 : 0,
          matchesList: [matchRec]
        });
      }
    });

    const lineupsList = Array.from(lineupsMap.values()).map(l => {
      const avgPts = l.matches > 0 ? parseFloat((l.points / l.matches).toFixed(2)) : 0;
      const avgKills = l.matches > 0 ? parseFloat((l.kills / l.matches).toFixed(2)) : 0;
      const winRate = l.matches > 0 ? parseFloat(((l.booyahs / l.matches) * 100).toFixed(1)) : 0;
      return {
        ...l,
        avgPts,
        avgKills,
        winRate
      };
    });

    if (lineupsList.length === 0) return null;

    // Destaques
    const mostMatches = [...lineupsList].sort((a, b) => b.matches - a.matches || b.points - a.points)[0];
    const mostPoints = [...lineupsList].sort((a, b) => b.points - a.points || b.avgPts - a.avgPts)[0];
    const mostKills = [...lineupsList].sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills)[0];
    const mostBooyahs = [...lineupsList].sort((a, b) => b.booyahs - a.booyahs || b.winRate - a.winRate)[0];

    return {
      lineups: lineupsList,
      totalLineupsCount: lineupsList.length,
      highlights: {
        mostMatches,
        mostPoints,
        mostKills,
        mostBooyahs
      }
    };
  }, [filteredData, data, activeTeamName, selectedTeamName, filters.team]);

  // Análise de Melhores e Piores Desempenhos por Onde a Safe Fechou por Mapa
  const safePerformanceByMapTeam = useMemo(() => {
    if (!selectedTeamName) return [];

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const teamPlayers = new Set(data.players.filter(p => normalize(p.TIME) === normalize(selectedTeamName)).map(p => normalize(p.PLAYER)));

    const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normalize(selectedTeamName) && d.MAPA && d.ONDE_FECHOU);

    const mapsMap = new Map<string, Map<string, {
      localName: string;
      mapName: string;
      matches: MatchDetails[];
      matchesCount: number;
      totalPts: number;
      totalPtsc: number;
      totalKills: number;
      booyahs: number;
      sumPos: number;
    }>>();

    teamMatches.forEach(m => {
      const map = m.MAPA ? m.MAPA.trim() : 'N/A';
      const local = m.ONDE_FECHOU ? m.ONDE_FECHOU.trim() : 'N/A';

      if (!mapsMap.has(map)) {
        mapsMap.set(map, new Map());
      }
      const mapLocals = mapsMap.get(map)!;

      if (!mapLocals.has(local)) {
        mapLocals.set(local, {
          localName: local,
          mapName: map,
          matches: [],
          matchesCount: 0,
          totalPts: 0,
          totalPtsc: 0,
          totalKills: 0,
          booyahs: 0,
          sumPos: 0
        });
      }

      const locObj = mapLocals.get(local)!;
      const pts = parseNumber(m.PTS);
      const abts = parseNumber(m.ABTS);
      const ptsc = parseNumber(m.PTSC);
      const pos = parseNumber(m.POS);
      const isBooyah = pos === 1 || parseNumber(m.B) > 0;

      locObj.matches.push(m);
      locObj.matchesCount += 1;
      locObj.totalPts += pts;
      locObj.totalPtsc += ptsc;
      locObj.totalKills += abts;
      if (isBooyah) locObj.booyahs += 1;
      if (pos > 0) locObj.sumPos += pos;
    });

    const result = Array.from(mapsMap.entries()).map(([mapName, localsMap]) => {
      const localsList = Array.from(localsMap.values()).map(loc => {
        const avgPts = loc.matchesCount > 0 ? loc.totalPts / loc.matchesCount : 0;
        const avgKills = loc.matchesCount > 0 ? loc.totalKills / loc.matchesCount : 0;
        const avgPos = loc.matchesCount > 0 ? loc.sumPos / loc.matchesCount : 12;

        return {
          ...loc,
          avgPts: avgPts.toFixed(2),
          avgPtsNum: avgPts,
          avgKills: avgKills.toFixed(2),
          avgKillsNum: avgKills,
          avgPos: avgPos.toFixed(1),
          avgPosNum: avgPos
        };
      });

      const sortedByPerformance = [...localsList].sort((a, b) => {
        if (b.avgPtsNum !== a.avgPtsNum) return b.avgPtsNum - a.avgPtsNum;
        if (b.avgKillsNum !== a.avgKillsNum) return b.avgKillsNum - a.avgKillsNum;
        return a.avgPosNum - b.avgPosNum;
      });

      const bestSafes = sortedByPerformance.slice(0, 3);
      const sortedReverse = [...localsList].sort((a, b) => {
        if (a.avgPtsNum !== b.avgPtsNum) return a.avgPtsNum - b.avgPtsNum;
        if (a.avgKillsNum !== b.avgKillsNum) return a.avgKillsNum - b.avgKillsNum;
        return b.avgPosNum - a.avgPosNum;
      });
      const worstSafes = sortedReverse.slice(0, 3);

      const totalMatchesOnMap = localsList.reduce((acc, l) => acc + l.matchesCount, 0);
      const totalKillsOnMap = localsList.reduce((acc, l) => acc + l.totalKills, 0);
      const avgKillsPerSafeOnMap = totalMatchesOnMap > 0 ? (totalKillsOnMap / totalMatchesOnMap).toFixed(2) : '0.00';

      // Distribuição de abates por safe do killfeed (Safe 1 a Safe 7)
      const mapKillFeed = filteredData.killFeed.filter(k => normalize(k.MAPA) === normalize(mapName) && teamPlayers.has(normalize(k.PLAYER)));
      
      const safePhasesList = ['SAFE 1', 'SAFE 2', 'SAFE 3', 'SAFE 4', 'SAFE 5', 'SAFE 6', 'SAFE 7'];
      const safeKillsCounts: Record<string, number> = {
        'SAFE 1': 0,
        'SAFE 2': 0,
        'SAFE 3': 0,
        'SAFE 4': 0,
        'SAFE 5': 0,
        'SAFE 6': 0,
        'SAFE 7': 0,
      };

      mapKillFeed.forEach(k => {
        const safeRaw = (k.SAFE || '').trim().toUpperCase();
        if (safeRaw === '1' || safeRaw.includes('SAFE 1')) safeKillsCounts['SAFE 1']++;
        else if (safeRaw === '2' || safeRaw.includes('SAFE 2')) safeKillsCounts['SAFE 2']++;
        else if (safeRaw === '3' || safeRaw.includes('SAFE 3')) safeKillsCounts['SAFE 3']++;
        else if (safeRaw === '4' || safeRaw.includes('SAFE 4')) safeKillsCounts['SAFE 4']++;
        else if (safeRaw === '5' || safeRaw.includes('SAFE 5')) safeKillsCounts['SAFE 5']++;
        else if (safeRaw === '6' || safeRaw.includes('SAFE 6')) safeKillsCounts['SAFE 6']++;
        else if (safeRaw === '7' || safeRaw.includes('SAFE 7')) safeKillsCounts['SAFE 7']++;
      });

      const safeDistribution = safePhasesList.map(phase => {
        const count = safeKillsCounts[phase] || 0;
        const avg = totalMatchesOnMap > 0 ? (count / totalMatchesOnMap).toFixed(2) : '0.00';
        return {
          phase,
          count,
          avg,
          avgNum: totalMatchesOnMap > 0 ? (count / totalMatchesOnMap) : 0
        };
      });

      return {
        mapName,
        allLocals: sortedByPerformance,
        bestSafes,
        worstSafes,
        totalMatchesOnMap,
        totalLocalsCount: localsList.length,
        totalKillsOnMap,
        avgKillsPerSafeOnMap,
        safeDistribution
      };
    }).sort((a, b) => a.mapName.localeCompare(b.mapName));

    return result;
  }, [filteredData.details, data.players, filteredData.killFeed, selectedTeamName]);

  // Análise de Abates por Rodada de Cada Mapa e MVP da Equipe por Mapa
  const teamMapKillsAndMvpData = useMemo(() => {
    if (!selectedTeamName) return [];

    const parseNumber = (v: string | number | undefined) => {
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (!v) return 0;
      const p = parseFloat(String(v).replace(',', '.'));
      return isNaN(p) ? 0 : p;
    };

    const normTeam = normalize(selectedTeamName);

    // Partidas do time em fDetalhes
    const teamMatches = filteredData.details.filter(d => normalize(d.TIME) === normTeam);

    // Registros de jogadores do time em fJogadores
    const teamPlayerRecords = filteredData.players.filter(p => normalize(p.TIME) === normTeam);

    // Mapear mapas jogados pelo time
    const mapsSet = new Set<string>();
    teamMatches.forEach(m => { if (m.MAPA) mapsSet.add(m.MAPA.trim()); });
    teamPlayerRecords.forEach(p => { if (p.MAPA) mapsSet.add(p.MAPA.trim()); });

    const sortedMaps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));

    return sortedMaps.map(mapName => {
      const normMap = normalize(mapName);

      // Partidas neste mapa
      const matchesOnMap = teamMatches.filter(d => normalize(d.MAPA) === normMap);
      const totalMatches = matchesOnMap.length;

      // Abates totais da equipe neste mapa
      const totalTeamKills = matchesOnMap.reduce((acc, m) => acc + parseNumber(m.ABTS), 0);
      const avgKillsPerMatch = totalMatches > 0 ? (totalTeamKills / totalMatches).toFixed(2) : '0.00';

      // Abates por Rodada de Cada Mapa
      const roundKillsMap: Record<string, { totalKills: number; matchesCount: number }> = {};
      matchesOnMap.forEach(m => {
        const rd = m.RD ? m.RD.trim() : 'N/A';
        if (!roundKillsMap[rd]) {
          roundKillsMap[rd] = { totalKills: 0, matchesCount: 0 };
        }
        roundKillsMap[rd].totalKills += parseNumber(m.ABTS);
        roundKillsMap[rd].matchesCount += 1;
      });

      const roundsList = Object.entries(roundKillsMap).map(([rd, rObj]) => {
        const avgKills = rObj.matchesCount > 0 ? (rObj.totalKills / rObj.matchesCount).toFixed(2) : '0.00';
        return {
          rd,
          totalKills: rObj.totalKills,
          matchesCount: rObj.matchesCount,
          avgKills,
          avgKillsNum: parseFloat(avgKills)
        };
      }).sort((a, b) => {
        const numA = parseInt(a.rd.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.rd.replace(/\D/g, '')) || 0;
        if (numA !== numB) return numA - numB;
        return a.rd.localeCompare(b.rd);
      });

      // Abates por Jogador da Equipe neste Mapa
      const playerStatsMap = new Map<string, {
        name: string;
        kills: number;
        dano: number;
        hs: number;
        matches: Set<string>;
      }>();

      const playerRecordsOnMap = teamPlayerRecords.filter(p => normalize(p.MAPA) === normMap);
      playerRecordsOnMap.forEach(p => {
        const pName = p.PLAYER ? p.PLAYER.trim() : '';
        if (!pName) return;

        if (!playerStatsMap.has(pName)) {
          playerStatsMap.set(pName, {
            name: pName,
            kills: 0,
            dano: 0,
            hs: 0,
            matches: new Set()
          });
        }

        const pObj = playerStatsMap.get(pName)!;
        pObj.kills += parseNumber(p.Abates);
        pObj.dano += parseNumber(p.Dano);
        pObj.hs += parseNumber(p.HS);
        const matchKey = `${p.RD || ''}-${p.Q || ''}-${p.CONFRONTO || ''}`;
        pObj.matches.add(matchKey);
      });

      const playerList = Array.from(playerStatsMap.values()).map(p => {
        const matchesCount = p.matches.size || 1;
        const avgKills = (p.kills / matchesCount).toFixed(2);
        const avgDano = (p.dano / matchesCount).toFixed(0);
        const playerImg = findDimImg(data.playersDimension, p.name);

        return {
          name: p.name,
          kills: p.kills,
          dano: p.dano,
          hs: p.hs,
          matchesCount,
          avgKills,
          avgKillsNum: parseFloat(avgKills),
          avgDano,
          playerImg
        };
      }).sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        if (b.dano !== a.dano) return b.dano - a.dano;
        return a.name.localeCompare(b.name);
      });

      const mvpPlayer = playerList.length > 0 ? playerList[0] : null;

      return {
        mapName,
        totalTeamKills,
        totalMatches,
        avgKillsPerMatch,
        roundsList,
        playerList,
        mvpPlayer
      };
    }).sort((a, b) => a.mapName.localeCompare(b.mapName));
  }, [filteredData.details, filteredData.players, selectedTeamName, data.playersDimension]);

  // Classificação por Mapa (Comparativo)
  const mapRankings = useMemo(() => {
    const maps = Array.from(new Set(filteredData.details.map(d => d.MAPA))).filter(Boolean) as string[];
    return maps.map(mapName => {
      const mapDetails = filteredData.details.filter(d => normalize(d.MAPA) === normalize(mapName));
      const stats = calculateTeamStats({ ...filteredData, details: mapDetails });
      
      // Aplicar Ordenação
      const sortedStats = [...stats].sort((a: any, b: any) => {
        const aValue = a[sortConfig.key] ?? 0;
        const bValue = b[sortConfig.key] ?? 0;
        if (sortConfig.direction === 'asc') return aValue > bValue ? 1 : -1;
        return aValue < bValue ? 1 : -1;
      });

      // Find top player MVP for this map
      const mapKills = filteredData.killFeed.filter(k => normalize(k.MAPA) === normalize(mapName));
      const playerKillsMap: Record<string, { kills: number, team?: string }> = {};
      mapKills.forEach(k => {
        if (k.PLAYER) {
          if (!playerKillsMap[k.PLAYER]) playerKillsMap[k.PLAYER] = { kills: 0, team: k.TIME };
          playerKillsMap[k.PLAYER].kills += 1;
        }
      });
      let topPlayer = { name: '', kills: 0, team: '' };
      Object.entries(playerKillsMap).forEach(([pName, pObj]) => {
        if (pObj.kills > topPlayer.kills) {
          topPlayer = { name: pName, kills: pObj.kills, team: pObj.team || '' };
        }
      });

      const totalMatches = new Set(mapDetails.map(d => `${d.RD}_${d.Q}`)).size;
      const totalKills = stats.reduce((acc, s) => acc + (s.abts || 0), 0);
      const totalPoints = stats.reduce((acc, s) => acc + (s.pts || 0), 0);
      const totalBooyahs = stats.reduce((acc, s) => acc + (s.b || 0), 0);

      // Top team by points
      const topTeamPts = [...stats].sort((a, b) => b.pts - a.pts)[0] || null;
      // Top team by kills
      const topTeamKills = [...stats].sort((a, b) => b.abts - a.abts)[0] || null;

      const mapConfig = MAPS_CONFIG.find(m => normalize(m.name) === normalize(mapName));

      return { 
        mapName, 
        mapImg: mapConfig?.url || null,
        stats: sortedStats,
        allStats: stats,
        totalMatches,
        totalKills,
        totalPoints,
        totalBooyahs,
        topTeamPts,
        topTeamKills,
        topPlayer
      };
    });
  }, [filteredData, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Map Stats Calculation Engine (Transferido de Estudos)
  const mapStatsData = useMemo(() => {
    if (!data) return { mapList: [], roundsList: [], kpis: { topMapKills: null, topMapAvg: null, topRoundMap: null, totalKillsAllMaps: 0 } };

    const parseNumber = (val: string | number | undefined) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const parsed = parseFloat(String(val).replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    };

    const mapsSet = new Set<string>();
    const roundsSet = new Set<string>();

    if (data.details) {
      data.details.forEach(d => {
        if (d.MAPA) mapsSet.add(d.MAPA.trim());
        if (d.RD) roundsSet.add(d.RD.trim());
      });
    }

    if (data.players) {
      data.players.forEach(p => {
        if (p.MAPA) mapsSet.add(p.MAPA.trim());
        if (p.RD) roundsSet.add(p.RD.trim());
      });
    }

    const sortedRounds = Array.from(roundsSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    const sortedMaps = Array.from(mapsSet).sort((a, b) => a.localeCompare(b));

    const mapStatsMap = new Map<string, {
      mapName: string;
      totalKills: number;
      uniqueMatches: Set<string>;
      roundData: Map<string, {
        totalKills: number;
        uniqueMatches: Set<string>;
        teamKills: Map<string, number>;
        playerKills: Map<string, number>;
      }>;
      teamKillsOverall: Map<string, number>;
      playerKillsOverall: Map<string, number>;
      matchKills: Map<string, number>;
    }>();

    sortedMaps.forEach(m => {
      mapStatsMap.set(m, {
        mapName: m,
        totalKills: 0,
        uniqueMatches: new Set(),
        roundData: new Map(),
        teamKillsOverall: new Map(),
        playerKillsOverall: new Map(),
        matchKills: new Map()
      });
    });

    if (data.players && data.players.length > 0) {
      data.players.forEach(p => {
        const mName = p.MAPA ? p.MAPA.trim() : '';
        if (!mName) return;

        if (!mapStatsMap.has(mName)) {
          mapStatsMap.set(mName, {
            mapName: mName,
            totalKills: 0,
            uniqueMatches: new Set(),
            roundData: new Map(),
            teamKillsOverall: new Map(),
            playerKillsOverall: new Map(),
            matchKills: new Map()
          });
        }

        const mObj = mapStatsMap.get(mName)!;
        const kills = parseNumber(p.Abates);
        const rd = p.RD ? p.RD.trim() : 'N/A';
        const q = p.Q ? p.Q.trim() : 'Q1';
        const matchKey = `${rd}_${q}`;
        const player = p.PLAYER ? p.PLAYER.trim() : '';
        const team = p.TIME ? p.TIME.trim() : '';

        mObj.totalKills += kills;
        mObj.uniqueMatches.add(matchKey);
        mObj.matchKills.set(matchKey, (mObj.matchKills.get(matchKey) || 0) + kills);

        if (team) {
          mObj.teamKillsOverall.set(team, (mObj.teamKillsOverall.get(team) || 0) + kills);
        }
        if (player) {
          mObj.playerKillsOverall.set(player, (mObj.playerKillsOverall.get(player) || 0) + kills);
        }

        if (!mObj.roundData.has(rd)) {
          mObj.roundData.set(rd, {
            totalKills: 0,
            uniqueMatches: new Set(),
            teamKills: new Map(),
            playerKills: new Map()
          });
        }

        const rObj = mObj.roundData.get(rd)!;
        rObj.totalKills += kills;
        rObj.uniqueMatches.add(matchKey);

        if (team) {
          rObj.teamKills.set(team, (rObj.teamKills.get(team) || 0) + kills);
        }
        if (player) {
          rObj.playerKills.set(player, (rObj.playerKills.get(player) || 0) + kills);
        }
      });
    } else if (data.details && data.details.length > 0) {
      data.details.forEach(d => {
        const mName = d.MAPA ? d.MAPA.trim() : '';
        if (!mName) return;

        if (!mapStatsMap.has(mName)) {
          mapStatsMap.set(mName, {
            mapName: mName,
            totalKills: 0,
            uniqueMatches: new Set(),
            roundData: new Map(),
            teamKillsOverall: new Map(),
            playerKillsOverall: new Map(),
            matchKills: new Map()
          });
        }

        const mObj = mapStatsMap.get(mName)!;
        const kills = parseNumber(d.ABTS);
        const rd = d.RD ? d.RD.trim() : 'N/A';
        const q = d.Q ? d.Q.trim() : 'Q1';
        const matchKey = `${rd}_${q}`;
        const team = d.TIME ? d.TIME.trim() : '';

        mObj.totalKills += kills;
        mObj.uniqueMatches.add(matchKey);
        mObj.matchKills.set(matchKey, (mObj.matchKills.get(matchKey) || 0) + kills);

        if (team) {
          mObj.teamKillsOverall.set(team, (mObj.teamKillsOverall.get(team) || 0) + kills);
        }

        if (!mObj.roundData.has(rd)) {
          mObj.roundData.set(rd, {
            totalKills: 0,
            uniqueMatches: new Set(),
            teamKills: new Map(),
            playerKills: new Map()
          });
        }

        const rObj = mObj.roundData.get(rd)!;
        rObj.totalKills += kills;
        rObj.uniqueMatches.add(matchKey);

        if (team) {
          rObj.teamKills.set(team, (rObj.teamKills.get(team) || 0) + kills);
        }
      });
    }

    let totalKillsAllMaps = 0;

    const mapList = Array.from(mapStatsMap.values()).map(mObj => {
      totalKillsAllMaps += mObj.totalKills;
      const totalMatchesCount = mObj.uniqueMatches.size;
      const avgKillsPerMatch = totalMatchesCount > 0 ? mObj.totalKills / totalMatchesCount : 0;

      let maxKillsInMatch = 0;
      mObj.matchKills.forEach(val => {
        if (val > maxKillsInMatch) maxKillsInMatch = val;
      });

      let topTeam: { name: string; kills: number } | null = null;
      mObj.teamKillsOverall.forEach((kills, name) => {
        if (!topTeam || kills > topTeam.kills) topTeam = { name, kills };
      });

      let topPlayer: { name: string; kills: number } | null = null;
      mObj.playerKillsOverall.forEach((kills, name) => {
        if (!topPlayer || kills > topPlayer.kills) topPlayer = { name, kills };
      });

      const rounds: Record<string, {
        totalKills: number;
        matchesCount: number;
        avgKillsPerMatch: number;
        falls: string[];
        topTeam: { name: string; kills: number } | null;
        topPlayer: { name: string; kills: number } | null;
      }> = {};

      mObj.roundData.forEach((rObj, rdName) => {
        const matchesCount = rObj.uniqueMatches.size;
        const avgKillsPerMatchRound = matchesCount > 0 ? rObj.totalKills / matchesCount : 0;

        let topRoundTeam: { name: string; kills: number } | null = null;
        rObj.teamKills.forEach((kills, name) => {
          if (!topRoundTeam || kills > topRoundTeam.kills) topRoundTeam = { name, kills };
        });

        let topRoundPlayer: { name: string; kills: number } | null = null;
        rObj.playerKills.forEach((kills, name) => {
          if (!topRoundPlayer || kills > topRoundPlayer.kills) topRoundPlayer = { name, kills };
        });

        const falls = Array.from(rObj.uniqueMatches).map(k => k.split('_')[1] || k);

        rounds[rdName] = {
          totalKills: rObj.totalKills,
          matchesCount,
          avgKillsPerMatch: avgKillsPerMatchRound,
          falls,
          topTeam: topRoundTeam,
          topPlayer: topRoundPlayer
        };
      });

      return {
        mapName: mObj.mapName,
        totalKills: mObj.totalKills,
        totalMatches: totalMatchesCount,
        avgKillsPerMatch,
        maxKillsInMatch,
        rounds,
        topTeam,
        topPlayer
      };
    });

    mapList.sort((a, b) => b.totalKills - a.totalKills);

    let topMapKills = mapList.length > 0 ? mapList[0] : null;
    let topMapAvg = mapList.length > 0 ? mapList[0] : null;
    let topRoundMap: { mapName: string; roundName: string; totalKills: number; avgKills: number } | null = null;

    mapList.forEach(m => {
      if (!topMapKills || m.totalKills > topMapKills.totalKills) topMapKills = m;
      if (!topMapAvg || m.avgKillsPerMatch > topMapAvg.avgKillsPerMatch) topMapAvg = m;

      Object.entries(m.rounds).forEach(([rdName, rdInfo]) => {
        if (!topRoundMap || rdInfo.totalKills > topRoundMap.totalKills) {
          topRoundMap = {
            mapName: m.mapName,
            roundName: rdName,
            totalKills: rdInfo.totalKills,
            avgKills: rdInfo.avgKillsPerMatch
          };
        }
      });
    });

    return {
      mapList,
      roundsList: sortedRounds,
      kpis: {
        topMapKills,
        topMapAvg,
        topRoundMap,
        totalKillsAllMaps
      }
    };
  }, [data]);

  const filteredAndSortedMaps = useMemo(() => {
    let result = mapStatsData.mapList;

    if (mapStatsSearch.trim()) {
      const q = mapStatsSearch.trim().toLowerCase();
      result = result.filter(m => m.mapName.toLowerCase().includes(q));
    }

    if (selectedMapFilter !== 'all' && selectedMapFilter !== 'ALL') {
      result = result.filter(m => m.mapName.toLowerCase() === selectedMapFilter.toLowerCase());
    }

    const { field, direction } = mapStatsSort;

    return [...result].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (field === 'mapName') {
        return direction === 'asc' ? a.mapName.localeCompare(b.mapName) : b.mapName.localeCompare(a.mapName);
      } else if (field === 'totalKills') {
        valA = a.totalKills;
        valB = b.totalKills;
      } else if (field === 'avgKillsPerMatch') {
        valA = a.avgKillsPerMatch;
        valB = b.avgKillsPerMatch;
      } else if (field === 'totalMatches') {
        valA = a.totalMatches;
        valB = b.totalMatches;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [mapStatsData, mapStatsSearch, selectedMapFilter, mapStatsSort]);

  // Piores Times (Bottom Rankings)
  const bottomRankings = useMemo(() => {
    const stats = [...displayTeamStats];
    return {
      pts: [...stats].sort((a, b) => a.pts - b.pts).slice(0, 12),
      ptsc: [...stats].sort((a, b) => a.ptsc - b.ptsc).slice(0, 12),
      booyahs: [...stats].sort((a, b) => a.b - b.b).slice(0, 12),
      avgPts: [...stats].sort((a, b) => a.avgPts - b.avgPts).slice(0, 12),
      avgAbts: [...stats].sort((a, b) => a.avgAbts - b.avgAbts).slice(0, 12),
    };
  }, [displayTeamStats]);

  // Lista ordenada de todas as rodadas / dias
  const sortedRoundsList = useMemo(() => {
    const uniqueRounds = Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean) as string[];
    return uniqueRounds.sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.details]);

  // Formata o cabeçalho da rodada para "Day X" se for numérico, correspondendo ao print do usuário
  const formatRoundHeader = (rd: string) => {
    const num = parseInt(rd.replace(/\D/g, ''));
    if (!isNaN(num)) {
      return `Day ${num}`;
    }
    return rd;
  };

  // Mapeamento de pontos por rodada e time
  const teamRoundPoints = useMemo(() => {
    const pointsMap: Record<string, Record<string, number>> = {};
    
    data.details.forEach(d => {
      const teamName = d.TIME;
      const round = d.RD;
      if (!teamName || !round) return;
      
      if (!pointsMap[teamName]) {
        pointsMap[teamName] = {};
      }
      const pts = parseInt(d.PTS) || 0;
      pointsMap[teamName][round] = (pointsMap[teamName][round] || 0) + pts;
    });
    
    return pointsMap;
  }, [data.details]);

  // Tendências de Rank baseadas no acumulado anterior ao último round
  const rankTrends = useMemo(() => {
    const trends: Record<string, { change: number; type: 'up' | 'down' | 'neutral' }> = {};
    
    if (sortedRoundsList.length <= 1) {
      return trends;
    }

    const penultimaRounds = sortedRoundsList.slice(0, -1);
    const prevTeamStats: Record<string, { pts: number; b: number; abts: number; name: string }> = {};

    data.details.forEach(row => {
      const teamName = row.TIME;
      if (!teamName || !row.RD || !penultimaRounds.includes(row.RD)) return;

      if (!prevTeamStats[teamName]) {
        prevTeamStats[teamName] = { pts: 0, b: 0, abts: 0, name: teamName };
      }
      const pStats = prevTeamStats[teamName];
      pStats.pts += parseInt(row.PTS) || 0;
      pStats.b += parseInt(row.B) || 0;
      pStats.abts += parseInt(row.ABTS) || 0;
    });

    const sortedPrevTeams = Object.values(prevTeamStats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.b !== a.b) return b.b - a.b;
      return b.abts - a.abts;
    });

    filteredTeamStats.forEach((teamCurrent, currentIdx) => {
      const prevIdx = sortedPrevTeams.findIndex(t => t.name === teamCurrent.name);
      if (prevIdx === -1) {
        trends[teamCurrent.name] = { change: 0, type: 'neutral' };
      } else {
        const change = prevIdx - currentIdx; 
        if (change > 0) {
          trends[teamCurrent.name] = { change, type: 'up' };
        } else if (change < 0) {
          trends[teamCurrent.name] = { change: Math.abs(change), type: 'down' };
        } else {
          trends[teamCurrent.name] = { change: 0, type: 'neutral' };
        }
      }
    });

    return trends;
  }, [data.details, sortedRoundsList, filteredTeamStats]);

  // Rodadas jogadas pelo time selecionado
  const selectedTeamRounds = useMemo(() => {
    if (!selectedTeamName) return [];
    
    const roundsMap: Record<string, {
      round: string;
      confrontos: string[];
      matches: MatchDetails[];
      pts: number;
      ptsc: number;
      abts: number;
      booyahs: number;
    }> = {};

    data.details.forEach(d => {
      if (normalize(d.TIME) !== normalize(selectedTeamName)) return;
      const rd = d.RD;
      if (!rd) return;

      if (!roundsMap[rd]) {
        roundsMap[rd] = {
          round: rd,
          confrontos: [],
          matches: [],
          pts: 0,
          ptsc: 0,
          abts: 0,
          booyahs: 0
        };
      }

      const rdData = roundsMap[rd];
      rdData.matches.push(d);
      rdData.pts += parseInt(d.PTS) || 0;
      rdData.ptsc += parseInt(d.PTSC) || 0;
      rdData.abts += parseInt(d.ABTS) || 0;
      if (parseInt(d.B) > 0) {
        rdData.booyahs += 1;
      }
      if (d.CONFRONTO && !rdData.confrontos.includes(d.CONFRONTO)) {
        rdData.confrontos.push(d.CONFRONTO);
      }
    });

    return Object.values(roundsMap).sort((a, b) => {
      const numA = parseInt(a.round.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.round.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.round.localeCompare(b.round);
    });
  }, [data.details, selectedTeamName]);

  const teamsList = useMemo(() => {
    return displayTeamStats.map(t => ({ name: t.name, image: t.image, grupo: t.grupo, pts: t.pts })).sort((a,b) => a.name.localeCompare(b.name));
  }, [displayTeamStats]);

  // Análise de Mapas por Queda
  const mapAnalysisData = useMemo(() => {
    const analysis: Record<string, Record<string, number>> = {};
    const totalsPerDrop: Record<string, number> = {};
    const seenMatches = new Set<string>();

    data.details.forEach(d => {
      const matchKey = `${d.CONFRONTO}-${d.RD}-${d.Q}`;
      if (seenMatches.has(matchKey)) return;
      seenMatches.add(matchKey);

      const drop = d.Q || '1';
      const map = d.MAPA;
      if (!map || !drop) return;

      if (!analysis[drop]) analysis[drop] = {};
      if (!totalsPerDrop[drop]) totalsPerDrop[drop] = 0;

      analysis[drop][map] = (analysis[drop][map] || 0) + 1;
      totalsPerDrop[drop]++;
    });

    return { analysis, totalsPerDrop };
  }, [data.details]);

  // Ranking de Times por Fechamento de Safe
  const safeRankingStats = useMemo(() => {
    if (!selectedSafeLocation) return [];
    
    // Filtrar partidas que fecharam nesse mapa e nesse local
    const safeMatches = data.details.filter(d => 
        normalize(d.MAPA) === normalize(selectedSafeLocation.mapName) && 
        normalize(d.ONDE_FECHOU) === normalize(selectedSafeLocation.local)
    );

    // Calcular estatísticas apenas para essas partidas
    const stats = calculateTeamStats({ ...data, details: safeMatches });
    
    return stats.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        
        switch (safeSortConfig.key) {
            case 'pts': valA = a.pts; valB = b.pts; break;
            case 'b': valA = a.b; valB = b.b; break;
            case 'abts': valA = a.abts; valB = b.abts; break;
            case 'ptsc': valA = a.ptsc; valB = b.ptsc; break;
            case 's': valA = a.s; valB = b.s; break;
            case 'mediaPts': valA = a.s > 0 ? a.pts / a.s : 0; valB = b.s > 0 ? b.pts / b.s : 0; break;
            case 'mediaAbts': valA = a.s > 0 ? a.abts / a.s : 0; valB = b.s > 0 ? b.abts / b.s : 0; break;
            case 'mediaPtsc': valA = a.s > 0 ? a.ptsc / a.s : 0; valB = b.s > 0 ? b.ptsc / b.s : 0; break;
            default: valA = a.pts; valB = b.pts; break;
        }

        if (valA === valB) {
            // Desempate
            if (safeSortConfig.key !== 'pts' && safeSortConfig.key !== 'b') {
                return b.pts - a.pts; // Se iguais, desempatar por pontos decrescente
            }
            if (safeSortConfig.key === 'pts') {
                return b.b - a.b; // Se pontos iguais, desempatar por booyahs
            }
        }

        return safeSortConfig.direction === 'desc' ? valB - valA : valA - valB;
    });
  }, [data, selectedSafeLocation, safeSortConfig]);

  // Estatísticas de Posições (1º ao 12º Lugar) para Todas as Equipes
  const allTeamsPositionStats = useMemo(() => {
    const teamsMap = new Map<string, {
      name: string;
      image?: string;
      grupo?: string;
      totalMatches: number;
      posCounts: Record<number, number>;
      posKills: Record<number, number>;
      posPts: Record<number, number>;
      posDetails: Record<number, MatchDetails[]>;
    }>();

    // Inicializar mapa de times com base nos filteredTeamStats
    filteredTeamStats.forEach(t => {
      teamsMap.set(t.name, {
        name: t.name,
        image: t.image,
        grupo: t.grupo,
        totalMatches: 0,
        posCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
        posKills: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
        posPts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 },
        posDetails: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] }
      });
    });

    filteredData.details.forEach(d => {
      if (!d.TIME) return;
      let teamObj = teamsMap.get(d.TIME);
      if (!teamObj) {
        const foundKey = Array.from(teamsMap.keys()).find(k => normalize(k) === normalize(d.TIME));
        if (foundKey) {
          teamObj = teamsMap.get(foundKey);
        }
      }
      if (!teamObj) return;

      const pos = parseInt(d.POS) || 0;
      if (pos >= 1 && pos <= 12) {
        teamObj.totalMatches += 1;
        teamObj.posCounts[pos] = (teamObj.posCounts[pos] || 0) + 1;
        teamObj.posKills[pos] = (teamObj.posKills[pos] || 0) + (parseInt(d.ABTS) || 0);
        teamObj.posPts[pos] = (teamObj.posPts[pos] || 0) + (parseInt(d.PTS) || 0);
        teamObj.posDetails[pos].push(d);
      }
    });

    return Array.from(teamsMap.values()).map(t => {
      const top3 = (t.posCounts[1] || 0) + (t.posCounts[2] || 0) + (t.posCounts[3] || 0);
      const top6 = top3 + (t.posCounts[4] || 0) + (t.posCounts[5] || 0) + (t.posCounts[6] || 0);
      const bottom3 = (t.posCounts[10] || 0) + (t.posCounts[11] || 0) + (t.posCounts[12] || 0);
      
      let sumPos = 0;
      for (let p = 1; p <= 12; p++) {
        sumPos += p * (t.posCounts[p] || 0);
      }
      const avgPos = t.totalMatches > 0 ? sumPos / t.totalMatches : 12;

      return {
        ...t,
        top3,
        top3Pct: t.totalMatches > 0 ? (top3 / t.totalMatches) * 100 : 0,
        top6,
        top6Pct: t.totalMatches > 0 ? (top6 / t.totalMatches) * 100 : 0,
        bottom3,
        bottom3Pct: t.totalMatches > 0 ? (bottom3 / t.totalMatches) * 100 : 0,
        avgPos,
        avgPosFormatted: avgPos.toFixed(2)
      };
    });
  }, [filteredTeamStats, filteredData.details]);

  // Lista ordenada das equipes para a tabela de posições
  const sortedPositionRanking = useMemo(() => {
    return [...allTeamsPositionStats].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (positionSortConfig.key.startsWith('pos')) {
        const p = parseInt(positionSortConfig.key.replace('pos', ''));
        valA = a.posCounts[p] || 0;
        valB = b.posCounts[p] || 0;
      } else {
        switch (positionSortConfig.key) {
          case 'name':
            return positionSortConfig.direction === 'asc' 
              ? a.name.localeCompare(b.name) 
              : b.name.localeCompare(a.name);
          case 'totalMatches':
            valA = a.totalMatches;
            valB = b.totalMatches;
            break;
          case 'top3':
            valA = a.top3;
            valB = b.top3;
            break;
          case 'top6':
            valA = a.top6;
            valB = b.top6;
            break;
          case 'bottom3':
            valA = a.bottom3;
            valB = b.bottom3;
            break;
          case 'avgPos':
            valA = a.avgPos;
            valB = b.avgPos;
            // Para posição média, menor é melhor!
            return positionSortConfig.direction === 'asc' ? valA - valB : valB - valA;
          default:
            valA = a.posCounts[1] || 0;
            valB = b.posCounts[1] || 0;
            break;
        }
      }

      if (valA === valB) {
        if (a.posCounts[1] !== b.posCounts[1]) {
          return b.posCounts[1] - a.posCounts[1];
        }
        return a.avgPos - b.avgPos;
      }

      return positionSortConfig.direction === 'desc' ? valB - valA : valA - valB;
    });
  }, [allTeamsPositionStats, positionSortConfig]);

  // Análise de Fechamento de Safe (Onde Fechou)
  const safeAnalysisData = useMemo(() => {
    const analysis: Record<string, { totals: number, locals: Record<string, number> }> = {};
    const seenMatches = new Set<string>();

    data.details.forEach(d => {
      const matchKey = `${d.CONFRONTO}-${d.RD}-${d.Q}`;
      if (seenMatches.has(matchKey)) return;
      seenMatches.add(matchKey);

      const map = d.MAPA;
      const local = d.ONDE_FECHOU;
      if (!map || !local) return;

      if (!analysis[map]) analysis[map] = { totals: 0, locals: {} };
      analysis[map].locals[local] = (analysis[map].locals[local] || 0) + 1;
      analysis[map].totals++;
    });

    return analysis;
  }, [data.details]);

  const getGamePhase = (safe: string | undefined): 'EARLY' | 'MID' | 'LATE' | 'OTHER' => {
      if (!safe) return 'OTHER';
      const s = safe.trim().toUpperCase();
      if (s.includes('SAFE 1') || s.includes('SAFE 2') || s === '1' || s === '2') return 'EARLY';
      if (s.includes('SAFE 3') || s.includes('SAFE 4') || s === '3' || s === '4') return 'MID';
      if (s.includes('SAFE 5') || s.includes('SAFE 6') || s.includes('SAFE 7') || s === '5' || s === '6' || s === '7') return 'LATE';
      return 'OTHER';
  };

  const allTeamsPhaseStats = useMemo(() => {
    const phaseStatsMap = new Map<string, {
      name: string;
      image?: string;
      earlyKills: number;
      midKills: number;
      lateKills: number;
      otherKills: number;
      totalPhaseKills: number;
    }>();

    filteredTeamStats.forEach(t => {
      phaseStatsMap.set(t.name, {
        name: t.name,
        image: t.image,
        earlyKills: 0,
        midKills: 0,
        lateKills: 0,
        otherKills: 0,
        totalPhaseKills: 0,
      });
    });

    const playerToTeamMap = new Map<string, string>();
    filteredData.players.forEach(p => {
        if (p.PLAYER && p.TIME) {
            playerToTeamMap.set(normalize(p.PLAYER), p.TIME);
        }
    });

    filteredData.killFeed.forEach(k => {
      const killerTeam = playerToTeamMap.get(normalize(k.PLAYER));
      if (killerTeam && phaseStatsMap.has(killerTeam)) {
        const ph = getGamePhase(k.SAFE);
        const st = phaseStatsMap.get(killerTeam)!;
        st.totalPhaseKills++;
        if (ph === 'EARLY') st.earlyKills++;
        else if (ph === 'MID') st.midKills++;
        else if (ph === 'LATE') st.lateKills++;
        else st.otherKills++;
      }
    });

    return Array.from(phaseStatsMap.values()).map(t => ({
        ...t,
        earlyPct: t.totalPhaseKills > 0 ? (t.earlyKills / t.totalPhaseKills * 100).toFixed(1) : '0.0',
        midPct: t.totalPhaseKills > 0 ? (t.midKills / t.totalPhaseKills * 100).toFixed(1) : '0.0',
        latePct: t.totalPhaseKills > 0 ? (t.lateKills / t.totalPhaseKills * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.totalPhaseKills - a.totalPhaseKills);
  }, [filteredData.killFeed, filteredData.players, filteredTeamStats]);

  const handlePlayerClick = (playerName: string) => {
    navigate('/players', { state: { player: playerName } });
  };

  if (data.loading) return <div className="text-center py-20 animate-pulse text-yellow-500 font-bold uppercase italic tracking-widest">Processando Equipes...</div>;

  return (
    <div className="space-y-6">
        {/* Navigation Tabs Bar & Back Action */}
        <div className="flex flex-col gap-4 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-2 rounded-2xl border border-white/5">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar">
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'gallery' && !selectedTeamName ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <LayoutGrid size={15} /> Galeria
                    </button>
                    <button 
                        onClick={() => setActiveTab('positions')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'positions' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Trophy size={15} /> Posições (1º-12º)
                    </button>
                    <button 
                        onClick={() => setActiveTab('mapRanking')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'mapRanking' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <MapIcon size={15} /> Por Mapa
                    </button>
                    <button 
                        onClick={() => setActiveTab('mapStats')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'mapStats' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BarChart2 size={15} /> Ranking de Mapas
                    </button>
                    <button 
                        onClick={() => setActiveTab('bottomRanking')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'bottomRanking' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <TrendingDown size={15} /> Piores
                    </button>
                    <button 
                        onClick={() => setActiveTab('mapAnalysis')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'mapAnalysis' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <BarChart3 size={15} /> Análise Mapas
                    </button>
                    <button 
                        onClick={() => setActiveTab('safeAnalysis')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'safeAnalysis' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <MapPin size={15} /> Onde Fechou
                    </button>
                    <button 
                        onClick={() => setActiveTab('killfeedPhases')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'killfeedPhases' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Crosshair size={15} /> Fases do Jogo
                    </button>
                    <button 
                        onClick={() => setActiveTab('comparison')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Scale size={15} /> Comparar
                    </button>
                    <button 
                        onClick={() => setActiveTab('pointsTable')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'pointsTable' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ListOrdered size={15} /> Tabela de Pontos
                    </button>
                    <button 
                        onClick={() => setActiveTab('teamRounds')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'teamRounds' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Calendar size={15} /> Rodadas por Time
                    </button>
                </div>

                {selectedTeamName && activeTab !== 'comparison' && activeTab !== 'teamRounds' && (
                    <button 
                        onClick={() => {
                            if (selectedMap) setSelectedMap(null);
                            else if (selectedDrop) setSelectedDrop(null);
                            else if (selectedPosition !== null) setSelectedPosition(null);
                            else setFilters(prev => ({...prev, team: []}));
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl transition-all text-xs font-black uppercase tracking-wider border border-yellow-500/30 shrink-0"
                    >
                        <ArrowLeft size={16} /> {(selectedMap || selectedDrop || selectedPosition !== null) ? `Voltar ao Perfil` : `Voltar à Galeria`}
                    </button>
                )}
            </div>

            {/* Filter Bar 100% Width */}
            <div className="w-full">
                <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />
            </div>
        </div>

        {selectedTeamName && selectedTeamStats && activeTab !== 'comparison' ? (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
                {/* Header do Time */}
                {teamVisibleSections.header ? (
                    <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-black">
                        <div className="absolute top-0 right-0 p-12 opacity-5">
                             <Shield size={220} className="text-yellow-500" />
                        </div>
                        <div className="absolute top-6 right-6 z-20">
                            <button
                                onClick={() => toggleTeamSection('header')}
                                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-yellow-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md"
                                title="Ocultar esta seção"
                            >
                                <EyeOff size={13} /> Ocultar Seção
                            </button>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                             <div className="w-40 h-40 bg-black rounded-3xl border-2 border-yellow-500/30 flex items-center justify-center overflow-hidden shadow-2xl p-4 rotate-2 hover:rotate-0 transition-transform duration-500">
                                 {selectedTeamStats.image ? (
                                     <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                                 ) : (
                                     <Shield size={80} className="text-gray-800" />
                                 )}
                             </div>
                             <div className="text-center md:text-left space-y-4">
                                 <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">PRO LEAGUE</span>
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">DADOS FILTRADOS</span>
                                    {(() => {
                                        const char = getTeamCharacteristic(selectedTeamStats.percentAbts, selectedTeamStats.percentPos);
                                        return (
                                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${char.bg} ${char.border} ${char.color} text-[9px] font-black uppercase tracking-widest shadow-lg`}>
                                                {char.icon}
                                                {char.label}
                                            </div>
                                        );
                                    })()}
                                 </div>
                                 <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">{selectedTeamStats.name}</h1>
                                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                     <StatBadge label="PONTOS" value={selectedTeamStats.pts} color="text-yellow-500" />
                                     <StatBadge label="VITÓRIAS" value={selectedTeamStats.b} color="text-orange-500" />
                                     <StatBadge label="KILLS" value={selectedTeamStats.abts} color="text-red-500" />
                                     <StatBadge label="MÉDIA EQUIPE" value={selectedTeamStats.avgAbts} color="text-blue-500" />
                                     <button 
                                         onClick={() => setActiveTab('comparison')}
                                         className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-yellow-500 hover:scale-105 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                                     >
                                         <Scale size={16} /> Comparar este Time
                                     </button>
                                 </div>
                                 
                                 <div className="mt-6 max-w-md">
                                     <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2 italic">
                                         <span className="text-red-500 flex items-center gap-1"><Flame size={10}/> ABATES ({selectedTeamStats.percentAbts}%)</span>
                                         <span className="text-yellow-500 flex items-center gap-1">POSIÇÃO ({selectedTeamStats.percentPos}%) <Target size={10}/></span>
                                     </div>
                                     <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
                                         <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" style={{ width: `${selectedTeamStats.percentAbts}%` }}></div>
                                         <div className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-1000" style={{ width: `${selectedTeamStats.percentPos}%` }}></div>
                                     </div>
                                     <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase tracking-widest italic leading-relaxed">
                                         * Distribuição baseada na origem dos pontos totais da equipe.
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Shield size={20} className="text-yellow-500" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                1. Resumo & Identidade da Equipe: <strong className="text-yellow-400">{selectedTeamStats.name}</strong> <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('header')}
                            className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                )}

                {/* Sub-Navegação e Controles de Exibição do Perfil do Time */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121215] p-3 rounded-2xl border border-white/10 shadow-xl relative">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setTeamProfileSubTab('all')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'all' 
                                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <LayoutGrid size={15} /> Visão Geral Completa
                        </button>
                        <button
                            onClick={() => setTeamProfileSubTab('mapStyles')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'mapStyles'
                                     ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-black'
                                     : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <MapIcon size={15} /> Estilos por Mapa
                        </button>

                        <button
                            onClick={() => setTeamProfileSubTab('zeradas')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'zeradas' 
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <AlertTriangle size={15} /> Quedas Zeradas ({zeroStatsTeam?.totalZeroPts || 0})
                        </button>

                        <button
                            onClick={() => setTeamProfileSubTab('rounds')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'rounds' 
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Swords size={15} /> Pontos & Abates por Rodada / Queda
                        </button>

                        <button
                            onClick={() => setTeamProfileSubTab('mapKills')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'mapKills' 
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Trophy size={15} /> Abates & MVP por Mapa
                        </button>

                        <button
                            onClick={() => setTeamProfileSubTab('safes')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'safes' 
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <MapPin size={15} /> Melhores & Piores Safes por Mapa
                        </button>

                        <button
                            onClick={() => setTeamProfileSubTab('lineups')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'lineups' 
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Users size={15} /> Formações (Lineups)
                        </button>
                        
                        <button
                            onClick={() => setTeamProfileSubTab('killfeedPhases')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                teamProfileSubTab === 'killfeedPhases' 
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black' 
                                    : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <Crosshair size={15} /> Fases do Jogo
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Dropdown Gerenciador de Seções */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTeamSectionMenu(!showTeamSectionMenu)}
                                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer shadow-md ${
                                    showTeamSectionMenu 
                                        ? 'bg-yellow-500 text-black border-yellow-400' 
                                        : 'bg-black/60 border-white/10 text-gray-300 hover:text-white hover:border-yellow-500/40'
                                }`}
                                title="Mostrar ou ocultar seções individuais"
                            >
                                <LayoutList size={15} className={showTeamSectionMenu ? 'text-black' : 'text-yellow-400'} />
                                <span>Seções ({Object.values(teamVisibleSections).filter(Boolean).length}/13)</span>
                                <ChevronDown size={14} className={`transition-transform ${showTeamSectionMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showTeamSectionMenu && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-[#141417] border border-yellow-500/30 rounded-2xl p-4 shadow-2xl z-50 space-y-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                                            <Layers size={14} className="text-yellow-400" /> Seções do Time
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setAllTeamSections(true)}
                                                className="text-[10px] font-black text-emerald-400 hover:underline uppercase"
                                            >
                                                Todas
                                            </button>
                                            <span className="text-gray-600 text-xs">|</span>
                                            <button
                                                onClick={() => setAllTeamSections(false)}
                                                className="text-[10px] font-black text-rose-400 hover:underline uppercase"
                                            >
                                                Nenhuma
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                        {[
                                            { key: 'header', label: '1. Resumo & Identidade', icon: Shield },
                                            { key: 'mapStyles', label: '2. Estilos por Mapa', icon: MapIcon },
                                            { key: 'zeradas', label: '3. Quedas Zeradas', icon: AlertTriangle },
                                            { key: 'rounds', label: '4. Pontos & Kills por Rodada', icon: Swords },
                                            { key: 'safes', label: '5. Safes por Mapa', icon: MapPin },
                                            { key: 'mapKills', label: '6. Abates & MVP por Mapa', icon: Trophy },
                                            { key: 'lineups', label: '7. Formações (Lineups)', icon: Users },
                                            { key: 'killfeedPhases', label: '8. Fases do Jogo (Kill Feed)', icon: Crosshair },
                                            { key: 'evolution', label: '9. Histórico de Performance', icon: TrendingUp },
                                            { key: 'territorial', label: '10. Domínio Territorial (Mapas)', icon: MapIcon },
                                            { key: 'safesDistribution', label: '11. Distribuição por Safe', icon: Disc },
                                            { key: 'positions', label: '12. Sumário de Posições', icon: Trophy },
                                            { key: 'drops', label: '13. Performance por Queda', icon: Zap }
                                        ].map(({ key, label, icon: Icon }) => {
                                            const isVisible = teamVisibleSections[key as keyof typeof teamVisibleSections];
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => toggleTeamSection(key as keyof typeof teamVisibleSections)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                        isVisible 
                                                            ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30' 
                                                            : 'bg-black/40 text-gray-500 border border-white/5 hover:text-gray-300'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-2 truncate">
                                                        <Icon size={13} className={isVisible ? 'text-yellow-400' : 'text-gray-600'} />
                                                        {label}
                                                    </span>
                                                    {isVisible ? <Eye size={13} className="text-emerald-400 flex-shrink-0" /> : <EyeOff size={13} className="text-gray-600 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowTeamDetails(!showTeamDetails)}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer shadow-md ${
                                showTeamDetails 
                                    ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20' 
                                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                        >
                            {showTeamDetails ? (
                                <>
                                    <EyeOff size={15} /> Ocultar Detalhamento
                                </>
                            ) : (
                                <>
                                    <Eye size={15} /> Exibir Detalhamento
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* NOVO: PERFIL DE ESTILO POR MAPA */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'mapStyles') && teamMapStylesData.length > 0 && (
                    teamVisibleSections.mapStyles ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-orange-500/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                                    <MapIcon className="text-orange-500" size={28} />
                                    PERFIL E ESTILO DE JOGO POR MAPA
                                </h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    CARACTERÍSTICAS DA EQUIPE ({selectedTeamStats?.name}) EM CADA MAPA
                                </p>
                            </div>
                            <button
                                onClick={() => toggleTeamSection('mapStyles')}
                                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-orange-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                                title="Ocultar esta seção"
                            >
                                <EyeOff size={13} /> Ocultar Seção
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teamMapStylesData.map((mapData) => {
                                const char = mapData.characteristic;
                                const mapConfig = MAPS_CONFIG.find(m => normalize(m.name) === normalize(mapData.mapName));
                                
                                return (
                                    <div key={mapData.mapName} className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-xl">
                                        {/* Map Header with Background */}
                                        <div className="relative h-24 overflow-hidden flex items-center justify-center">
                                            {mapConfig && (
                                                <div 
                                                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                                                    style={{ backgroundImage: `url(${mapConfig.url})` }}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                            <h4 className="relative z-10 text-2xl font-black italic uppercase tracking-widest text-white drop-shadow-md">
                                                {mapData.mapName}
                                            </h4>
                                        </div>
                                        
                                        {/* Characteristic Badge */}
                                        <div className="px-6 -mt-5 relative z-20 flex justify-center">
                                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${char.bg} ${char.border} ${char.color} text-xs font-black uppercase tracking-widest shadow-lg shadow-black/50 backdrop-blur-md`}>
                                                {char.icon}
                                                {char.label}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="p-6 space-y-4">
                                            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/5 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Partidas</span>
                                                    <span className="text-lg font-black text-white">{mapData.totalMatches}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pontos</span>
                                                    <span className="text-lg font-black text-yellow-500">{mapData.totalPts}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Abates</span>
                                                    <span className="text-lg font-black text-red-500">{mapData.totalAbates}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bars */}
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                                                        <span className="text-red-500 flex items-center gap-1"><Flame size={10}/> ABATES</span>
                                                        <span className="text-red-400">{mapData.percentAbts}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" style={{ width: `${mapData.percentAbts}%` }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-1.5">
                                                        <span className="text-yellow-500 flex items-center gap-1">POSIÇÃO <Target size={10}/></span>
                                                        <span className="text-yellow-400">{mapData.percentPos}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-1000" style={{ width: `${mapData.percentPos}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <MapIcon size={20} className="text-orange-500" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                2. Perfil e Estilo de Jogo por Mapa <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('mapStyles')}
                            className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* 1. SEÇÃO: QUEDAS ZERADAS DO TIME */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'zeradas') && zeroStatsTeam && (
                    teamVisibleSections.zeradas ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-red-900/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                                        QUEDAS ZERADAS DA EQUIPE ({selectedTeamStats.name})
                                    </h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Detalhamento de partidas onde o time zerou (não conquistou pontos e/ou não realizou abates)
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-black text-xs uppercase">
                                    {zeroStatsTeam.totalZeroPts} Quedas sem Pontos ({zeroStatsTeam.pctZeradas}%)
                                </span>
                                <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-xs uppercase">
                                    {zeroStatsTeam.totalZeroKills} Quedas sem Abates
                                </span>
                                <button
                                    onClick={() => toggleTeamSection('zeradas')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-red-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {/* Cards Resumo KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">ZERADA ABSOLUTA (0 PTS & 0 KILLS)</span>
                                <span className="text-2xl font-black text-red-500 italic block">{zeroStatsTeam.totalZeradasAbsoluta} <small className="text-xs text-gray-400 font-normal">partidas</small></span>
                                <span className="text-[9px] text-gray-400 font-medium block">Eliminado sem abates e sem pontos</span>
                            </div>

                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">ZERO ABATES (0 KILLS)</span>
                                <span className="text-2xl font-black text-orange-400 italic block">{zeroStatsTeam.totalZeroKills} <small className="text-xs text-gray-400 font-normal">partidas</small></span>
                                <span className="text-[9px] text-gray-400 font-medium block">Nenhuma eliminação conquistada</span>
                            </div>

                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">ZERO PONTOS (0 PTS)</span>
                                <span className="text-2xl font-black text-yellow-500 italic block">{zeroStatsTeam.totalZeroPts} <small className="text-xs text-gray-400 font-normal">partidas</small></span>
                                <span className="text-[9px] text-gray-400 font-medium block">Sem pontuação de posição</span>
                            </div>

                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">MAPA COM MAIS ZERADAS</span>
                                {(() => {
                                    const topMapEntry = Object.entries(zeroStatsTeam.zeroByMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
                                    return topMapEntry ? (
                                        <span className="text-lg font-black text-white italic block uppercase truncate">{topMapEntry[0]} ({topMapEntry[1]}x)</span>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-500 italic block">Nenhum</span>
                                    );
                                })()}
                                <span className="text-[9px] text-gray-400 font-medium block">Mapa com maior número de quedas zeradas</span>
                            </div>
                        </div>

                        {/* Lista de Quedas Zeradas */}
                        {zeroStatsTeam.allZeradasList.length > 0 ? (
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                                    LISTA DE QUEDAS ONDE A EQUIPE ZEROU
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {zeroStatsTeam.allZeradasList.map((m, idx) => {
                                        const dKey = `zero-${m.RD}-${m.Q}`;
                                        const isExp = expandedDropKey === dKey;
                                        const pts = parseInt(m.PTS) || 0;
                                        const abts = parseInt(m.ABTS) || 0;

                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => setExpandedDropKey(isExp ? null : dKey)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                                                    pts === 0 && abts === 0 
                                                        ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/60' 
                                                        : 'bg-black/60 border-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-black text-white uppercase italic">{m.CONFRONTO}</span>
                                                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                                        RD {m.RD} • Q{m.Q}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center text-xs pt-1">
                                                    <span className="font-bold text-gray-300 uppercase text-[10px]">{m.MAPA}</span>
                                                    <span className="text-[10px] font-black text-yellow-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                                        {m.POS}º Lugar
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                                                    <span className={`font-black italic ${pts === 0 ? 'text-red-400' : 'text-yellow-500'}`}>
                                                        {pts} PTS
                                                    </span>
                                                    <span className={`font-black italic ${abts === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                                                        {abts} Kills
                                                    </span>
                                                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExp ? 'rotate-180 text-yellow-500' : ''}`} />
                                                </div>

                                                {m.ONDE_FECHOU && (
                                                    <div className="text-[9px] text-gray-400 font-bold bg-black/40 px-2 py-1 rounded truncate">
                                                        📍 Safe: {m.ONDE_FECHOU}
                                                    </div>
                                                )}

                                                {isExp && (
                                                    <div className="pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                                                        <DropCompositionViewer
                                                            teamName={activeTeamName}
                                                            round={m.RD}
                                                            drop={m.Q}
                                                            mapa={m.MAPA}
                                                            playersLoadout={getTeamDropComposition(
                                                                data,
                                                                activeTeamName,
                                                                m.RD,
                                                                m.Q,
                                                                m.CONFRONTO,
                                                                m.MAPA
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-emerald-400 font-black uppercase text-xs tracking-wider bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                🎉 A equipe não possui nenhuma queda zerada no filtro atual!
                            </div>
                        )}
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={20} className="text-red-500" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                3. Quedas Zeradas da Equipe ({zeroStatsTeam.totalZeroPts} quedas) <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('zeradas')}
                            className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* 2. SEÇÃO: MATRIZ DE PONTOS E ABATES POR RODADA E POR QUEDA (COM DETALHAMENTO) */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'rounds') && (
                    teamVisibleSections.rounds ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-blue-900/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                                        <Swords size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                                        PONTOS E ABATES POR RODADA E POR QUEDA ({selectedTeamStats.name})
                                    </h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Matriz de abates e pontos conquistados em cada Rodada e Queda. Clique em qualquer célula para ver os detalhes completos da partida.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="bg-black p-1 rounded-xl border border-white/10 flex items-center gap-1">
                                    <button
                                        onClick={() => setMatrixViewMode('both')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                                            matrixViewMode === 'both' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Pts & Abates
                                    </button>
                                    <button
                                        onClick={() => setMatrixViewMode('points')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                                            matrixViewMode === 'points' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Pontos
                                    </button>
                                    <button
                                        onClick={() => setMatrixViewMode('kills')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer transition-all ${
                                            matrixViewMode === 'kills' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Abates
                                    </button>
                                </div>
                                <button
                                    onClick={() => toggleTeamSection('rounds')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {/* Cards Resumo */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-black/60 p-3.5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">TOTAL PONTOS</span>
                                <span className="text-2xl font-black text-yellow-500 italic block">{teamRoundsAndDropsMatrix.summary.totalPts}</span>
                                <span className="text-[8px] text-gray-400 block font-mono">Média: {teamRoundsAndDropsMatrix.summary.avgPtsPerMatch}/Q</span>
                            </div>
                            <div className="bg-black/60 p-3.5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">TOTAL ABATES</span>
                                <span className="text-2xl font-black text-red-500 italic block">{teamRoundsAndDropsMatrix.summary.totalKills}</span>
                                <span className="text-[8px] text-gray-400 block font-mono">Média: {teamRoundsAndDropsMatrix.summary.avgKillsPerMatch}/Q</span>
                            </div>
                            <div className="bg-black/60 p-3.5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">RODADAS REGISTRADAS</span>
                                <span className="text-2xl font-black text-white italic block">{teamRoundsAndDropsMatrix.rounds.length}</span>
                                <span className="text-[8px] text-gray-400 block font-mono">{teamRoundsAndDropsMatrix.summary.totalMatches} quedas no total</span>
                            </div>
                            <div className="bg-black/60 p-3.5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">BOOYAHS</span>
                                <span className="text-2xl font-black text-emerald-400 italic block">
                                    {teamRoundsAndDropsMatrix.rounds.reduce((acc, r) => acc + r.totals.booyahs, 0)}
                                </span>
                                <span className="text-[8px] text-emerald-500 font-bold block uppercase">Vitórias da Equipe</span>
                            </div>
                        </div>

                        {/* Tabela de Matriz por Rodada x Queda */}
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/80">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-black text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="p-4 border-b border-r border-white/10">Rodada (RD)</th>
                                        {teamRoundsAndDropsMatrix.dropsList.map(q => (
                                            <th key={q} className="p-4 border-b border-r border-white/10 text-center">
                                                Queda {q}
                                            </th>
                                        ))}
                                        <th className="p-4 border-b border-white/10 text-center text-yellow-500 bg-yellow-500/10">Total RD</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {teamRoundsAndDropsMatrix.rounds.map(rObj => (
                                        <React.Fragment key={rObj.rd}>
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-black text-white border-r border-white/10 bg-black/40">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm italic">{rObj.rd}</span>
                                                        {rObj.totals.booyahs > 0 && (
                                                            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded text-[9px] font-black">
                                                                {rObj.totals.booyahs} 🏆
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {teamRoundsAndDropsMatrix.dropsList.map(q => {
                                                    const match = rObj.drops[q];
                                                    if (!match) {
                                                        return (
                                                            <td key={q} className="p-4 text-center border-r border-white/10 text-gray-700 italic">
                                                                -
                                                            </td>
                                                        );
                                                    }

                                                    const pts = parseInt(match.PTS) || 0;
                                                    const abts = parseInt(match.ABTS) || 0;
                                                    const pos = parseInt(match.POS) || 0;
                                                    const isBooyah = pos === 1 || parseInt(match.B) > 0;
                                                    const isZero = pts === 0 && abts === 0;

                                                    const isSelected = expandedMatrixCell?.rd === rObj.rd && expandedMatrixCell?.q === q;

                                                    let bgStyle = 'bg-black/40 border-white/5 hover:border-yellow-500/40';
                                                    if (isBooyah) bgStyle = 'bg-yellow-500/20 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
                                                    else if (isZero) bgStyle = 'bg-red-950/40 border-red-500/30';

                                                    return (
                                                        <td key={q} className="p-2 border-r border-white/10 text-center">
                                                            <button
                                                                onClick={() => setExpandedMatrixCell(isSelected ? null : { rd: rObj.rd, q })}
                                                                className={`w-full p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${bgStyle} ${
                                                                    isSelected ? 'ring-2 ring-yellow-500 scale-105' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-1.5">
                                                                    {isBooyah && <Crown size={12} className="text-yellow-400 animate-bounce" />}
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{match.MAPA}</span>
                                                                    <span className="text-[9px] font-black text-gray-500">#{pos}</span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {(matrixViewMode === 'both' || matrixViewMode === 'points') && (
                                                                        <span className={`font-black italic text-sm ${pts === 0 ? 'text-red-400' : 'text-yellow-500'}`}>
                                                                            {pts} P
                                                                        </span>
                                                                    )}
                                                                    {(matrixViewMode === 'both' || matrixViewMode === 'kills') && (
                                                                        <span className={`font-black italic text-xs ${abts === 0 ? 'text-red-400' : 'text-red-500'}`}>
                                                                            {abts} K
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        </td>
                                                    );
                                                })}

                                                <td className="p-4 text-center font-black bg-yellow-500/10 text-yellow-500 italic">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm">{rObj.totals.totalPts} P</span>
                                                        <span className="text-xs text-red-400">{rObj.totals.totalKills} K</span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Detalhamento Expandido da Partida ao Clicar na Célula */}
                                            {teamRoundsAndDropsMatrix.dropsList.map(q => {
                                                const isSelected = expandedMatrixCell?.rd === rObj.rd && expandedMatrixCell?.q === q;
                                                const match = rObj.drops[q];
                                                if (!isSelected || !match) return null;

                                                return (
                                                    <tr key={`exp-${rObj.rd}-${q}`} className="bg-black/95 border-y-2 border-yellow-500/40">
                                                        <td colSpan={teamRoundsAndDropsMatrix.dropsList.length + 2} className="p-6">
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="px-3 py-1 rounded-xl bg-yellow-500 text-black font-black text-xs uppercase">
                                                                            RODADA {match.RD} • QUEDA {match.Q}
                                                                        </span>
                                                                        <span className="text-sm font-black text-white uppercase italic">MAPA: {match.MAPA}</span>
                                                                        <span className="text-xs text-gray-400 font-bold">({match.CONFRONTO})</span>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => setExpandedMatrixCell(null)}
                                                                        className="text-xs text-gray-400 hover:text-white font-bold uppercase border border-white/10 px-3 py-1 rounded-lg cursor-pointer"
                                                                    >
                                                                        Fechar Detalhes ✕
                                                                    </button>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                                    <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center">
                                                                        <span className="text-[8px] text-gray-500 font-black uppercase block">POSIÇÃO</span>
                                                                        <span className="text-lg font-black text-white italic">{match.POS}º Lugar</span>
                                                                    </div>
                                                                    <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center">
                                                                        <span className="text-[8px] text-gray-500 font-black uppercase block">PONTOS COLOCAÇÃO</span>
                                                                        <span className="text-lg font-black text-orange-400 italic">{match.PTSC} PTS</span>
                                                                    </div>
                                                                    <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center">
                                                                        <span className="text-[8px] text-gray-500 font-black uppercase block">ABATES</span>
                                                                        <span className="text-lg font-black text-red-500 italic">{match.ABTS} Kills</span>
                                                                    </div>
                                                                    <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center">
                                                                        <span className="text-[8px] text-gray-500 font-black uppercase block">PONTOS TOTAIS</span>
                                                                        <span className="text-lg font-black text-yellow-500 italic">{match.PTS} PTS</span>
                                                                    </div>
                                                                    <div className="bg-black/60 p-3 rounded-xl border border-white/5 text-center col-span-2 sm:col-span-1">
                                                                        <span className="text-[8px] text-gray-500 font-black uppercase block">ONDE FECHOU</span>
                                                                        <span className="text-xs font-black text-gray-300 italic truncate block">{match.ONDE_FECHOU || 'N/A'}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Loadout / Personagens da Equipe nesta Queda */}
                                                                <div className="pt-2">
                                                                    <DropCompositionViewer
                                                                        teamName={activeTeamName}
                                                                        round={match.RD}
                                                                        drop={match.Q}
                                                                        mapa={match.MAPA}
                                                                        playersLoadout={getTeamDropComposition(
                                                                            data,
                                                                            activeTeamName,
                                                                            match.RD,
                                                                            match.Q,
                                                                            match.CONFRONTO,
                                                                            match.MAPA
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Swords size={20} className="text-blue-400" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                4. Pontos e Abates por Rodada e por Queda <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('rounds')}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* 3. SEÇÃO: MELHORES E PIORES DESEMPENHO POR ONDE A SAFE FECHOU PARA CADA MAPA */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'safes') && safePerformanceByMapTeam.length > 0 && (
                    teamVisibleSections.safes ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-amber-900/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
                                        <MapPin size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                                        MELHORES E PIORES SAFES POR MAPA ({selectedTeamStats.name})
                                    </h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Mapeamento por local final de fechamento de safe (`ONDE_FECHOU`), listando os melhores e piores desempenhos da equipe em cada mapa.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                                    {safePerformanceByMapTeam.length} Mapas Mapeados
                                </span>
                                <button
                                    onClick={() => toggleTeamSection('safes')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {/* Cards por Mapa */}
                        <div className="space-y-6">
                            {safePerformanceByMapTeam.map(mapGroup => {
                                const mapImg = findDimImg(data?.safes, mapGroup.mapName);

                                return (
                                    <div key={mapGroup.mapName} className="bg-black/60 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-3">
                                                {mapImg ? (
                                                    <img src={mapImg} alt={mapGroup.mapName} className="w-12 h-12 object-cover rounded-xl border border-amber-500/30 bg-black" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-black border border-amber-500/30 flex items-center justify-center text-amber-500">
                                                        <MapIcon size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                                                        MAPA: {mapGroup.mapName}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                                                        {mapGroup.totalMatchesOnMap} quedas disputadas em {mapGroup.totalLocalsCount} safes diferentes
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                                <div className="bg-amber-950/40 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-center">
                                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">TOTAL ABATES EM SAFES</span>
                                                    <span className="text-sm font-black text-white italic block leading-tight">{mapGroup.totalKillsOnMap} Kills</span>
                                                </div>
                                                <div className="bg-amber-950/40 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-center">
                                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">MÉDIA DE ABATES / SAFE</span>
                                                    <span className="text-sm font-black text-amber-300 italic block leading-tight">{mapGroup.avgKillsPerSafeOnMap} K/Q</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* MELHORES SAFES */}
                                            <div className="bg-gradient-to-b from-emerald-950/20 to-black p-5 rounded-2xl border border-emerald-500/30 space-y-3">
                                                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider border-b border-emerald-500/20 pb-2">
                                                    <Crown size={16} /> 🟢 MELHORES SAFES (MAIOR APROVEITAMENTO)
                                                </div>

                                                <div className="space-y-2.5">
                                                    {mapGroup.bestSafes.map((safe, idx) => (
                                                        <div key={idx} className="bg-black/80 p-3.5 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                 <div className="flex items-center gap-2">
                                                                    <span className="w-5 h-5 rounded bg-emerald-500 text-black font-black text-[10px] flex items-center justify-center shrink-0">
                                                                        #{idx + 1}
                                                                    </span>
                                                                    <span className="text-xs font-black text-white uppercase truncate italic">{safe.localName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-1.5">
                                                                    <span>{safe.matchesCount} quedas</span>
                                                                    <span>•</span>
                                                                    <span>Pos Média #{safe.avgPos}</span>
                                                                    {safe.booyahs > 0 && (
                                                                        <span className="text-yellow-400 font-bold ml-1">({safe.booyahs} Booyahs)</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <span className="text-sm font-black text-yellow-400 block leading-none">{safe.avgPts} <small className="text-[9px] text-gray-500">Pts/Q</small></span>
                                                                <span className="text-xs font-black text-red-400 block mt-1">{safe.avgKills} <small className="text-[8px] text-gray-500">K/Q</small></span>
                                                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">({safe.totalKills} Kills)</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {mapGroup.bestSafes.length === 0 && (
                                                        <span className="text-xs text-gray-500 italic block py-2">Sem dados de safes para este mapa.</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* PIORES SAFES */}
                                            <div className="bg-gradient-to-b from-red-950/20 to-black p-5 rounded-2xl border border-red-500/30 space-y-3">
                                                <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider border-b border-red-500/20 pb-2">
                                                    <AlertTriangle size={16} /> 🔴 PIORES SAFES (MENOR APROVEITAMENTO)
                                                </div>

                                                <div className="space-y-2.5">
                                                    {mapGroup.worstSafes.map((safe, idx) => (
                                                        <div key={idx} className="bg-black/80 p-3.5 rounded-xl border border-red-500/20 flex items-center justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-5 h-5 rounded bg-red-500/30 text-red-400 font-black text-[10px] flex items-center justify-center border border-red-500/40 shrink-0">
                                                                        ⚠️
                                                                    </span>
                                                                    <span className="text-xs font-black text-white uppercase truncate italic">{safe.localName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-1.5">
                                                                    <span>{safe.matchesCount} quedas</span>
                                                                    <span>•</span>
                                                                    <span>Pos Média #{safe.avgPos}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <span className="text-sm font-black text-red-400 block leading-none">{safe.avgPts} <small className="text-[9px] text-gray-500">Pts/Q</small></span>
                                                                <span className="text-xs font-black text-gray-400 block mt-1">{safe.avgKills} <small className="text-[8px] text-gray-500">K/Q</small></span>
                                                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">({safe.totalKills} Kills)</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {mapGroup.worstSafes.length === 0 && (
                                                        <span className="text-xs text-gray-500 italic block py-2">Sem dados de safes para este mapa.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Distribuição por Fase de Safe (Safe 1 a Safe 7) */}
                                        <div className="bg-black/40 rounded-2xl border border-white/5 p-5 space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-2">
                                                <h5 className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                                                    <Flame size={14} className="text-amber-500 animate-pulse" /> Distribuição de Abates por Fase de Safe (Killfeed)
                                                </h5>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                    Abates Totais & Médias por Queda
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                                                {mapGroup.safeDistribution?.map((dist) => {
                                                    // Determine safe color accents based on phase
                                                    let badgeBg = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                                                    let barColor = "bg-amber-500";
                                                    if (dist.phase.includes('1') || dist.phase.includes('2')) {
                                                        badgeBg = "bg-blue-500/10 border-blue-500/30 text-blue-400";
                                                        barColor = "bg-blue-500";
                                                    } else if (dist.phase.includes('3') || dist.phase.includes('4')) {
                                                        badgeBg = "bg-orange-500/10 border-orange-500/30 text-orange-400";
                                                        barColor = "bg-orange-500";
                                                    } else {
                                                        badgeBg = "bg-red-500/10 border-red-500/30 text-red-400";
                                                        barColor = "bg-red-500";
                                                    }

                                                    // Calculate percentage width for visual indicator
                                                    const maxKills = Math.max(...(mapGroup.safeDistribution?.map(d => d.count) || [1]));
                                                    const pct = maxKills > 0 ? (dist.count / maxKills) * 100 : 0;

                                                    return (
                                                        <div key={dist.phase} className="bg-black/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between space-y-2.5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                                                            <div className="flex justify-between items-center">
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeBg}`}>
                                                                    {dist.phase}
                                                                </span>
                                                                <span className="text-[10px] font-black text-white italic">
                                                                    {dist.count} K
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="space-y-1">
                                                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest block leading-none">Média / Queda</span>
                                                                <span className="text-xs font-black text-yellow-500 block leading-tight">
                                                                    {dist.avg} <small className="text-[8px] text-gray-500">K/Q</small>
                                                                </span>
                                                            </div>

                                                            {/* Mini Progress Bar Indicator */}
                                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full ${barColor} rounded-full transition-all duration-500 group-hover:brightness-125`} 
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Botão de Expansão para Ver Todas as Safes */}
                                        <div className="pt-2 border-t border-white/5 flex justify-center">
                                            <button
                                                onClick={() => setExpandedSafesMap(prev => ({
                                                    ...prev,
                                                    [mapGroup.mapName]: !prev[mapGroup.mapName]
                                                }))}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-lg cursor-pointer"
                                            >
                                                {expandedSafesMap[mapGroup.mapName] ? (
                                                    <>Ocultar Todas as Safes ✕</>
                                                ) : (
                                                    <>Ver Todas as Safes ({mapGroup.allLocals.length}) 🗂️</>
                                                )}
                                            </button>
                                        </div>

                                        {/* Tabela de Todas as Safes do Mapa */}
                                        {expandedSafesMap[mapGroup.mapName] && (
                                            <div className="mt-4 bg-black/80 rounded-xl border border-white/5 p-4 space-y-3">
                                                <h5 className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2 border-b border-white/10 pb-2">
                                                    <ListOrdered size={14} className="text-amber-500" /> Todos os Abates e Estatísticas por Safe ({mapGroup.mapName})
                                                </h5>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="bg-black/60 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/10">
                                                                <th className="py-2.5 px-3">Local da Safe</th>
                                                                <th className="py-2.5 px-3 text-center">Quedas</th>
                                                                <th className="py-2.5 px-3 text-center">Pos Média</th>
                                                                <th className="py-2.5 px-3 text-center">Booyahs</th>
                                                                <th className="py-2.5 px-3 text-center text-yellow-500">Pts Total</th>
                                                                <th className="py-2.5 px-3 text-center text-yellow-400">Média Pts</th>
                                                                <th className="py-2.5 px-3 text-center text-red-500">Abates Total</th>
                                                                <th className="py-2.5 px-3 text-center text-red-400">Média Abates</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {mapGroup.allLocals.map((loc, lIdx) => (
                                                                <tr key={lIdx} className="hover:bg-white/5 transition-colors">
                                                                    <td className="py-2 px-3 font-black text-white uppercase italic">{loc.localName}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-300 font-bold">{loc.matchesCount}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-300 font-bold">#{loc.avgPos}</td>
                                                                    <td className="py-2 px-3 text-center">
                                                                        {loc.booyahs > 0 ? (
                                                                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black">
                                                                                {loc.booyahs} 🏆
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-600">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 px-3 text-center font-black text-yellow-500 italic">{loc.totalPts}</td>
                                                                    <td className="py-2 px-3 text-center font-black text-yellow-400 italic">{loc.avgPts}</td>
                                                                    <td className="py-2 px-3 text-center font-black text-red-500 italic">{loc.totalKills}</td>
                                                                    <td className="py-2 px-3 text-center font-black text-red-400 italic">{loc.avgKills}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-amber-500" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                5. Melhores e Piores Safes por Mapa <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('safes')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* 4. SEÇÃO: ABATES POR RODADA DE CADA MAPA E MVP DA EQUIPE POR MAPA */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'mapKills') && teamMapKillsAndMvpData.length > 0 && (
                    teamVisibleSections.mapKills ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-purple-900/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                                        <Trophy size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                                        ABATES POR RODADA E MVP DA EQUIPE POR MAPA ({selectedTeamStats.name})
                                    </h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Análise detalhada do volume de abates e médias por rodada em cada mapa, juntamente com a identificação do MVP e ranking de abates dos jogadores da equipe.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                                    {teamMapKillsAndMvpData.length} Mapas Analisados
                                </span>
                                <button
                                    onClick={() => toggleTeamSection('mapKills')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {/* Cards por Mapa */}
                        <div className="space-y-6">
                            {teamMapKillsAndMvpData.map(mGroup => {
                                const mapImg = findDimImg(data?.safes, mGroup.mapName);

                                return (
                                    <div key={mGroup.mapName} className="bg-black/60 rounded-2xl border border-white/10 p-6 space-y-5 shadow-xl">
                                        {/* Cabecalho do Mapa */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-3">
                                                {mapImg ? (
                                                    <img src={mapImg} alt={mGroup.mapName} className="w-12 h-12 object-cover rounded-xl border border-purple-500/30 bg-black" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-black border border-purple-500/30 flex items-center justify-center text-purple-400">
                                                        <MapIcon size={20} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                                                        MAPA: {mGroup.mapName}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                                                        {mGroup.totalMatches} Quedas Disputadas neste mapa
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="bg-purple-950/40 border border-purple-500/30 px-4 py-2 rounded-xl text-center">
                                                    <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest block">TOTAL ABATES</span>
                                                    <span className="text-lg font-black text-white italic block leading-tight">{mGroup.totalTeamKills} Kills</span>
                                                </div>
                                                <div className="bg-purple-950/40 border border-purple-500/30 px-4 py-2 rounded-xl text-center">
                                                    <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest block">MÉDIA / QUEDA</span>
                                                    <span className="text-lg font-black text-purple-400 italic block leading-tight">{mGroup.avgKillsPerMatch} K/Q</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Conteúdo em Duas Colunas: Abates por Rodada & MVP + Ranking de Jogadores */}
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            
                                            {/* Coluna 1: Abates por Rodada de Cada Mapa */}
                                            <div className="lg:col-span-5 bg-black/80 rounded-2xl border border-white/5 p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                    <span className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        <Crosshair size={15} className="text-purple-400" /> Abates por Rodada
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                        {mGroup.roundsList.length} Rodadas
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="border-b border-white/10 text-[9px] text-gray-400 uppercase font-black tracking-wider bg-white/5">
                                                                <th className="py-2.5 px-3">Rodada</th>
                                                                <th className="py-2.5 px-3 text-center">Quedas</th>
                                                                <th className="py-2.5 px-3 text-center">Total Abates</th>
                                                                <th className="py-2.5 px-3 text-right">Média / Queda</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {mGroup.roundsList.map(rItem => (
                                                                <tr key={rItem.rd} className="hover:bg-white/5 transition-colors">
                                                                    <td className="py-2.5 px-3 font-black text-white italic uppercase">{rItem.rd}</td>
                                                                    <td className="py-2.5 px-3 text-center font-bold text-gray-300">{rItem.matchesCount}</td>
                                                                    <td className="py-2.5 px-3 text-center font-black text-purple-400">{rItem.totalKills}</td>
                                                                    <td className="py-2.5 px-3 text-right font-black text-yellow-400">{rItem.avgKills}</td>
                                                                </tr>
                                                            ))}
                                                            {mGroup.roundsList.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="text-center py-4 text-xs text-gray-500 italic">
                                                                        Sem dados de rodadas para este mapa.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Coluna 2: MVP da Equipe e Lista de Kills dos Jogadores no Mapa */}
                                            <div className="lg:col-span-7 bg-black/80 rounded-2xl border border-white/5 p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                    <span className="text-xs font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        <Crown size={15} className="text-yellow-400" /> MVP & Ranking dos Jogadores
                                                    </span>
                                                    {mGroup.mvpPlayer && (
                                                        <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                                                            👑 MVP: {mGroup.mvpPlayer.name} ({mGroup.mvpPlayer.kills} Kills)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Cartão de Destaque do MVP do Mapa */}
                                                {mGroup.mvpPlayer && (
                                                    <div className="bg-gradient-to-r from-yellow-950/40 via-purple-950/30 to-black p-4 rounded-xl border border-yellow-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                                                        <div className="flex items-center gap-3">
                                                            {mGroup.mvpPlayer.playerImg ? (
                                                                <img src={mGroup.mvpPlayer.playerImg} alt={mGroup.mvpPlayer.name} className="w-12 h-12 object-cover rounded-xl border-2 border-yellow-500/60 bg-black shrink-0" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-black border-2 border-yellow-500/60 flex items-center justify-center text-yellow-500 font-black shrink-0">
                                                                    👑
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 rounded bg-yellow-500 text-black text-[9px] font-black uppercase tracking-wider">
                                                                        MVP DO MAPA
                                                                    </span>
                                                                    <span className="text-xs font-bold text-gray-400">#{mGroup.mapName}</span>
                                                                </div>
                                                                <h5 className="text-lg font-black text-white uppercase italic tracking-wide mt-0.5">
                                                                    {mGroup.mvpPlayer.name}
                                                                </h5>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-center">
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase block">ABATES</span>
                                                                <span className="text-xl font-black text-yellow-400 italic block">{mGroup.mvpPlayer.kills}</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-white/10" />
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase block">MÉDIA/Q</span>
                                                                <span className="text-base font-black text-white italic block">{mGroup.mvpPlayer.avgKills}</span>
                                                            </div>
                                                            <div className="w-px h-8 bg-white/10" />
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase block">DANO</span>
                                                                <span className="text-base font-black text-purple-300 italic block">{mGroup.mvpPlayer.dano}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tabela do Ranking de Kills dos Jogadores do Time no Mapa */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse text-xs">
                                                        <thead>
                                                            <tr className="border-b border-white/10 text-[9px] text-gray-400 uppercase font-black tracking-wider bg-white/5">
                                                                <th className="py-2.5 px-3">#</th>
                                                                <th className="py-2.5 px-3">Jogador</th>
                                                                <th className="py-2.5 px-3 text-center">Quedas</th>
                                                                <th className="py-2.5 px-3 text-center">Abates</th>
                                                                <th className="py-2.5 px-3 text-center">Média/Q</th>
                                                                <th className="py-2.5 px-3 text-right">Dano Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {mGroup.playerList.map((player, idx) => (
                                                                <tr key={player.name} className={`hover:bg-white/5 transition-colors ${idx === 0 ? 'bg-yellow-500/5' : ''}`}>
                                                                    <td className="py-2.5 px-3 font-black text-gray-400">
                                                                        {idx === 0 ? (
                                                                            <span className="text-yellow-400 font-bold">👑 #1</span>
                                                                        ) : (
                                                                            `#${idx + 1}`
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 font-black text-white italic uppercase flex items-center gap-2">
                                                                        {player.playerImg ? (
                                                                            <img src={player.playerImg} alt={player.name} className="w-6 h-6 object-cover rounded-md border border-white/10 bg-black shrink-0" />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 shrink-0">
                                                                                <User size={12} />
                                                                            </div>
                                                                        )}
                                                                        <span>{player.name}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-center font-bold text-gray-300">{player.matchesCount}</td>
                                                                    <td className="py-2.5 px-3 text-center font-black text-yellow-400">{player.kills}</td>
                                                                    <td className="py-2.5 px-3 text-center font-bold text-purple-300">{player.avgKills}</td>
                                                                    <td className="py-2.5 px-3 text-right font-mono text-gray-300">{player.dano}</td>
                                                                </tr>
                                                            ))}
                                                            {mGroup.playerList.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={6} className="text-center py-4 text-xs text-gray-500 italic">
                                                                        Sem dados de jogadores para este mapa.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Trophy size={20} className="text-purple-400" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                6. Abates por Rodada e MVP da Equipe por Mapa <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('mapKills')}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'lineups') && (
                    teamVisibleSections.lineups ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-indigo-900/40 shadow-2xl space-y-8">
                        {/* Header da Seção */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-wider flex items-center gap-3">
                                            FORMAÇÕES (LINEUPS) DA EQUIPE • <span className="text-indigo-400">{selectedTeamStats?.name || activeTeamName}</span>
                                        </h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            Análise dos quartetos de jogadores: quem jogou mais vezes, fez mais abates, conquistou mais booyahs e mais pontos
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                                {teamLineupsData && (
                                    <span className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black text-xs uppercase tracking-wider">
                                        {teamLineupsData.totalLineupsCount} {teamLineupsData.totalLineupsCount === 1 ? 'Formação Utilizada' : 'Formações Utilizadas'}
                                    </span>
                                )}
                                <button
                                    onClick={() => toggleTeamSection('lineups')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {teamLineupsData && teamLineupsData.lineups.length > 0 ? (
                            <>
                                {/* 4 CARDS DE DESTAQUES (OS MELHORES EM CADA CRITÉRIO) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* 1. Mais Frequente */}
                                    {teamLineupsData.highlights.mostMatches && (
                                        <div className="bg-black/60 p-5 rounded-2xl border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Crown size={14} className="text-indigo-400" /> MAIS FREQUENTE (MAIS JOGOS)
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-black text-[10px]">
                                                        {teamLineupsData.highlights.mostMatches.matches} Quedas
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 my-2">
                                                    {teamLineupsData.highlights.mostMatches.players.map((p, idx) => (
                                                        <span key={idx} className="text-[11px] font-black text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-400 font-bold uppercase">{teamLineupsData.highlights.mostMatches.points} PTS</span>
                                                <span className="text-red-400 font-black italic">{teamLineupsData.highlights.mostMatches.kills} KILLS</span>
                                                <span className="text-yellow-400 font-black italic">{teamLineupsData.highlights.mostMatches.booyahs} BOOYAH(S)</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Mais Pontos */}
                                    {teamLineupsData.highlights.mostPoints && (
                                        <div className="bg-black/60 p-5 rounded-2xl border border-blue-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Zap size={14} className="text-blue-400" /> MAIOR PONTUAÇÃO
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-black text-[10px]">
                                                        {teamLineupsData.highlights.mostPoints.points} Pts
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 my-2">
                                                    {teamLineupsData.highlights.mostPoints.players.map((p, idx) => (
                                                        <span key={idx} className="text-[11px] font-black text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-400 font-bold uppercase">{teamLineupsData.highlights.mostPoints.matches} JOGOS</span>
                                                <span className="text-blue-400 font-black italic">MÉD: {teamLineupsData.highlights.mostPoints.avgPts} PTS/Q</span>
                                                <span className="text-yellow-400 font-black italic">{teamLineupsData.highlights.mostPoints.booyahs} BOOYAH</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Mais Abates */}
                                    {teamLineupsData.highlights.mostKills && (
                                        <div className="bg-black/60 p-5 rounded-2xl border border-red-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Target size={14} className="text-red-400" /> MAIS LETAL (KILLS)
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 font-black text-[10px]">
                                                        {teamLineupsData.highlights.mostKills.kills} Kills
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 my-2">
                                                    {teamLineupsData.highlights.mostKills.players.map((p, idx) => (
                                                        <span key={idx} className="text-[11px] font-black text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-400 font-bold uppercase">{teamLineupsData.highlights.mostKills.matches} JOGOS</span>
                                                <span className="text-red-400 font-black italic">MÉD: {teamLineupsData.highlights.mostKills.avgKills} KILLS/Q</span>
                                                <span className="text-blue-400 font-black italic">{teamLineupsData.highlights.mostKills.points} PTS</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Mais Booyahs */}
                                    {teamLineupsData.highlights.mostBooyahs && (
                                        <div className="bg-black/60 p-5 rounded-2xl border border-yellow-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Trophy size={14} className="text-yellow-400" /> MAIS VITORIOSA (BOOYAHS)
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 font-black text-[10px]">
                                                        {teamLineupsData.highlights.mostBooyahs.booyahs} Booyahs
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 my-2">
                                                    {teamLineupsData.highlights.mostBooyahs.players.map((p, idx) => (
                                                        <span key={idx} className="text-[11px] font-black text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                                                <span className="text-gray-400 font-bold uppercase">{teamLineupsData.highlights.mostBooyahs.matches} JOGOS</span>
                                                <span className="text-yellow-400 font-black italic">WIN RATE: {teamLineupsData.highlights.mostBooyahs.winRate}%</span>
                                                <span className="text-blue-400 font-black italic">{teamLineupsData.highlights.mostBooyahs.points} PTS</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* BARRA DE ORDENAÇÃO */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-wider">
                                        <ArrowUpDown size={14} className="text-indigo-400" /> Ordenar Formações Por:
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {[
                                            { key: 'matches', label: 'Mais Quedas' },
                                            { key: 'points', label: 'Mais Pontos' },
                                            { key: 'kills', label: 'Mais Abates' },
                                            { key: 'booyahs', label: 'Mais Booyahs' },
                                            { key: 'avgPts', label: 'Média de Pts' },
                                            { key: 'avgKills', label: 'Média de Kills' }
                                        ].map(sortOpt => (
                                            <button
                                                key={sortOpt.key}
                                                onClick={() => setLineupSortBy(sortOpt.key as any)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                    lineupSortBy === sortOpt.key
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                                }`}
                                            >
                                                {sortOpt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* LISTA DE FORMAÇÕES */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {[...teamLineupsData.lineups]
                                        .sort((a, b) => {
                                            if (lineupSortBy === 'matches') return b.matches - a.matches || b.points - a.points;
                                            if (lineupSortBy === 'points') return b.points - a.points || b.avgPts - a.avgPts;
                                            if (lineupSortBy === 'kills') return b.kills - a.kills || b.avgKills - a.avgKills;
                                            if (lineupSortBy === 'booyahs') return b.booyahs - a.booyahs || b.winRate - a.winRate;
                                            if (lineupSortBy === 'avgPts') return b.avgPts - a.avgPts || b.points - a.points;
                                            if (lineupSortBy === 'avgKills') return b.avgKills - a.avgKills || b.kills - a.kills;
                                            return 0;
                                        })
                                        .map((lineup, idx) => {
                                            const isExpanded = expandedLineupKey === lineup.id;
                                            return (
                                                <div 
                                                    key={lineup.id} 
                                                    className="bg-black/50 p-6 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-5 shadow-xl group"
                                                >
                                                    {/* Header do Card com Rank e Jogadores */}
                                                    <div>
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black italic text-xs ${
                                                                    idx === 0 
                                                                        ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20' 
                                                                        : idx === 1 
                                                                        ? 'bg-gray-300 text-black' 
                                                                        : idx === 2 
                                                                        ? 'bg-amber-700 text-white' 
                                                                        : 'bg-white/10 text-gray-400'
                                                                }`}>
                                                                    #{idx + 1}
                                                                </span>
                                                                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
                                                                    Formação com {lineup.players.length} Atletas
                                                                </span>
                                                            </div>

                                                            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs font-black text-indigo-300 uppercase">
                                                                {lineup.matches} {lineup.matches === 1 ? 'Queda' : 'Quedas'}
                                                            </span>
                                                        </div>

                                                        {/* Avatares e Nomes dos 4 Atletas */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                            {lineup.players.map((pName, pIdx) => {
                                                                const pImg = findDimImg(data.playersDimension, pName);
                                                                return (
                                                                    <div 
                                                                        key={pIdx} 
                                                                        onClick={() => handlePlayerClick(pName)}
                                                                        className="bg-black/70 p-2.5 rounded-xl border border-white/5 hover:border-indigo-500/40 transition-all flex flex-col items-center text-center cursor-pointer group/player"
                                                                    >
                                                                        {pImg ? (
                                                                            <img src={pImg} alt={pName} className="w-10 h-10 object-cover rounded-xl border border-white/10 bg-gray-900 mb-1.5 shadow-sm group-hover/player:scale-105 transition-transform" />
                                                                        ) : (
                                                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-1.5 group-hover/player:text-indigo-400 transition-colors">
                                                                                <User size={18} />
                                                                            </div>
                                                                        )}
                                                                        <span className="text-[11px] font-black text-white group-hover/player:text-indigo-400 uppercase italic truncate max-w-full">
                                                                            {pName}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Painel de Métricas Combinadas */}
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-black/80 p-3.5 rounded-xl border border-white/5 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pontos</span>
                                                            <span className="text-base font-black text-blue-400 italic mt-0.5">{lineup.points}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l border-white/5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Abates</span>
                                                            <span className="text-base font-black text-red-400 italic mt-0.5">{lineup.kills}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l border-white/5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Booyahs</span>
                                                            <span className="text-base font-black text-yellow-400 italic mt-0.5">{lineup.booyahs}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l border-white/5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Média Pts</span>
                                                            <span className="text-base font-black text-white italic mt-0.5">{lineup.avgPts}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l border-white/5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Média Kills</span>
                                                            <span className="text-base font-black text-white italic mt-0.5">{lineup.avgKills}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center border-l border-white/5">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Win Rate</span>
                                                            <span className="text-base font-black text-yellow-500 italic mt-0.5">{lineup.winRate}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Detalhes das Quedas */}
                                                    <div>
                                                        <button
                                                            onClick={() => setExpandedLineupKey(isExpanded ? null : lineup.id)}
                                                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/5"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronDown size={14} className="rotate-180 transition-transform" /> Ocultar Quedas Desta Formação
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown size={14} /> Ver Histórico de Quedas ({lineup.matchesList.length})
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Lista detalhada de quedas expandida */}
                                                        {isExpanded && (
                                                            <div className="mt-3 bg-black/90 p-3 rounded-xl border border-white/5 space-y-2">
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-1 border-b border-white/5 flex justify-between">
                                                                    <span>Queda & Mapa</span>
                                                                    <span>Posição • Pts • Kills</span>
                                                                </div>
                                                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                                                    {lineup.matchesList.map((m, mIdx) => (
                                                                        <div key={mIdx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 text-xs">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                                                                                    RD {m.rd} • Q{m.q}
                                                                                </span>
                                                                                <span className="text-gray-300 font-black italic">{m.mapa}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={`font-black ${m.booyah ? 'text-yellow-400 flex items-center gap-1' : 'text-gray-400'}`}>
                                                                                    {m.booyah && <Crown size={12} />} #{m.pos}º
                                                                                </span>
                                                                                <span className="text-blue-400 font-bold">{m.pts} pts</span>
                                                                                <span className="text-red-400 font-bold">{m.kills} kills</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        ) : (
                            <div className="py-12 px-4 text-center bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-3">
                                <Users size={36} className="text-gray-600" />
                                <div className="text-sm font-black text-gray-400 uppercase tracking-wider">
                                    Nenhuma formação registrada para os filtros selecionados
                                </div>
                                <p className="text-xs text-gray-600 max-w-md">
                                    Verifique se há filtros de Rodada, Queda ou Mapa ativos que restrinjam as partidas deste time.
                                </p>
                            </div>
                        )}
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Users size={20} className="text-indigo-400" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                7. Formações (Lineups) da Equipe <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('lineups')}
                            className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* Roster Performance Ordenada por Kills - GRID RESPONSIVO (SEM SCROLL) */}
                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                        <Users size={20} className="text-yellow-500"/> ROSTER PERFORMANCE (ORDENADO)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {currentRoster.map((player, idx) => {
                            const totalKills = currentRoster.reduce((acc, curr) => acc + curr.kills, 0) || 1;
                            const percent = ((player.kills / totalKills) * 100).toFixed(1);
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => handlePlayerClick(player.name)} 
                                    className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-4 group cursor-pointer hover:border-yellow-500/40 transition-all active:scale-[0.98] shadow-lg"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-[10px] border transition-colors ${idx === 0 ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-900 text-gray-500 border-gray-800 group-hover:border-yellow-500/30'}`}>
                                                {idx + 1}º
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-white font-black text-xs uppercase italic group-hover:text-yellow-500 transition-colors tracking-tight truncate">{player.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">{player.matches} JOGOS</span>
                                                    <span className="text-[8px] text-blue-400 font-black italic">AVG: {player.avg}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-500 font-black text-lg leading-none italic">{player.kills}</span>
                                                <span className="text-[9px] text-blue-400 font-black italic mt-0.5">{percent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-950 h-1 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-yellow-500' : 'bg-red-500/60'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {currentRoster.length === 0 && (
                            <div className="col-span-full py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem roster registrado</div>
                        )}
                    </div>
                </div>

                {/* Seção de Composição e Personagens da Equipe Selecionada */}
                {teamCharSummary && (teamCharSummary.activeSkills.length > 0 || teamMapCharacterSummary.length > 0) && (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <h3 className="text-white font-black text-base uppercase italic tracking-wider flex items-center gap-2">
                                    <Zap size={20} className="text-yellow-500" />
                                    COMPOSIÇÃO E HABILIDADES DA EQUIPE ({selectedTeamStats.name})
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                    Resumo das habilidades ativas, pets e preferências da line-up em {teamCharSummary.totalDrops} quedas disputadas
                                </p>
                            </div>
                        </div>

                        {/* Ativas mais usadas pelo time */}
                        {teamCharSummary.activeSkills.length > 0 && (
                            <div>
                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                    <Zap size={12} /> HABILIDADES ATIVAS MAIS USADAS PELA EQUIPE
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {teamCharSummary.activeSkills.slice(0, 6).map((sk) => (
                                        <div key={sk.name} className="bg-black/60 p-3 rounded-2xl border border-yellow-500/20 flex flex-col items-center text-center shadow-md">
                                            {sk.img ? (
                                                <img src={sk.img} alt={sk.name} className="w-9 h-9 object-contain rounded-xl bg-black p-0.5 border border-yellow-500/30 mb-2" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-xl bg-black border border-yellow-500/30 flex items-center justify-center mb-2">
                                                    <Zap size={18} className="text-yellow-500" />
                                                </div>
                                            )}
                                            <span className="text-xs font-black italic uppercase text-white truncate max-w-full">{sk.name}</span>
                                            <span className="text-[10px] font-bold text-yellow-500 mt-0.5">{sk.count}x ({sk.pct}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preferências por jogador da line-up */}
                        {teamCharSummary.players.length > 0 && (
                            <div>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                    <Users size={12} className="text-yellow-500" /> PREFERÊNCIAS POR JOGADOR NA LINE-UP
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {teamCharSummary.players.map((p) => {
                                        const mainActive = p.activeSkills[0];
                                        return (
                                            <div key={p.name} className="bg-black/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-between space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {p.img ? (
                                                            <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden flex-shrink-0 bg-black">
                                                                <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center flex-shrink-0 text-gray-500">
                                                                <Users size={16} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <button
                                                                onClick={() => handlePlayerClick(p.name)}
                                                                className="text-xs font-black italic uppercase text-white hover:text-yellow-500 transition-colors block text-left"
                                                            >
                                                                {p.name}
                                                            </button>
                                                            {p.funcao && (
                                                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">{p.funcao}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                                        {p.totalDrops} Quedas
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {mainActive && (
                                                        <div className="bg-yellow-500/5 p-2 rounded-xl border border-yellow-500/20 flex items-center gap-2">
                                                            {mainActive.img ? (
                                                                <img src={mainActive.img} className="w-6 h-6 object-contain rounded bg-black p-0.5 border border-yellow-500/30" alt={mainActive.name} />
                                                            ) : (
                                                                <Zap size={14} className="text-yellow-500" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <span className="text-[7px] text-yellow-500 font-black uppercase block leading-none">ATIVA MAIS USADA</span>
                                                                <span className="text-[10px] font-black italic text-white uppercase truncate block mt-0.5">{mainActive.name} ({mainActive.pct}%)</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {p.passives && p.passives.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {p.passives.map(pass => (
                                                                <div key={pass.name} className="flex items-center gap-1 bg-black/40 px-1.5 py-1 rounded border border-white/5" title={`${pass.name} (${pass.pct}%)`}>
                                                                    {pass.img && <img src={pass.img} alt={pass.name} className="w-4 h-4 object-contain rounded-full" />}
                                                                    <span className="text-[9px] text-gray-300 font-bold truncate max-w-[60px]">{pass.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                                        {p.topPet && (
                                                            <div className="flex items-center gap-1">
                                                                {p.topPet.img && <img src={p.topPet.img} alt={p.topPet.name} className="w-4 h-4 object-contain" />}
                                                                <span className="text-[9px] text-gray-400 font-bold truncate max-w-[50px]">{p.topPet.name}</span>
                                                            </div>
                                                        )}
                                                        {p.topItem && (
                                                            <div className="flex items-center gap-1">
                                                                {p.topItem.img && <img src={p.topItem.img} alt={p.topItem.name} className="w-4 h-4 object-contain" />}
                                                                <span className="text-[9px] text-gray-400 font-bold truncate max-w-[50px]">{p.topItem.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Composições de Habilidades por Mapa */}
                        {teamMapCharacterSummary.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                    <MapIcon size={12} /> COMPOSIÇÕES DE HABILIDADES POR MAPA
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {teamMapCharacterSummary.map((m) => {
                                        const isSelected = selectedMap && normalize(selectedMap) === normalize(m.mapName);
                                        return (
                                            <div
                                                key={m.mapName}
                                                className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/5'
                                                        : 'bg-black/60 border-white/5 hover:border-yellow-500/30'
                                                }`}
                                            >
                                                <div 
                                                    className="cursor-pointer"
                                                    onClick={() => setSelectedMap(isSelected ? null : m.mapName)}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                                                            <MapPin size={12} className="text-yellow-500" /> {m.mapName}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                                            {m.dropCount} Quedas
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {m.topActives.map((act) => (
                                                            <span key={act.name} className="inline-flex items-center gap-1 bg-black/80 px-2 py-1 rounded-lg border border-yellow-500/20 text-[9px] font-bold text-white uppercase">
                                                                {act.img && <img src={act.img} alt={act.name} className="w-3.5 h-3.5 object-contain" />}
                                                                {act.name} ({act.pct}%)
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {isSelected && m.players && m.players.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-yellow-500/20 grid gap-3">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-1.5">
                                                            <Users size={10} className="text-yellow-500" /> PREFERÊNCIAS NO MAPA
                                                        </span>
                                                        {m.players.map((p) => {
                                                            const mainActive = p.activeSkills?.[0];
                                                            return (
                                                                <div key={p.name} className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {p.img ? (
                                                                                <img src={p.img} alt={p.name} className="w-6 h-6 object-cover rounded-full border border-yellow-500/30" />
                                                                            ) : (
                                                                                <div className="w-6 h-6 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center text-gray-500">
                                                                                    <Users size={10} />
                                                                                </div>
                                                                            )}
                                                                            <span className="text-[10px] font-black italic uppercase text-white">{p.name}</span>
                                                                        </div>
                                                                        {p.funcao && <span className="text-[8px] font-bold text-gray-500 uppercase">{p.funcao}</span>}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {mainActive && (
                                                                            <div className="bg-yellow-500/5 p-1.5 rounded-lg border border-yellow-500/20 flex items-center gap-2">
                                                                                {mainActive.img ? (
                                                                                    <img src={mainActive.img} className="w-5 h-5 object-contain rounded bg-black p-0.5 border border-yellow-500/30" alt={mainActive.name} />
                                                                                ) : (
                                                                                    <Zap size={12} className="text-yellow-500" />
                                                                                )}
                                                                                <div className="min-w-0 flex-1 flex justify-between items-center">
                                                                                    <div>
                                                                                        <span className="text-[6px] text-yellow-500 font-black uppercase block leading-none">ATIVA</span>
                                                                                        <span className="text-[9px] font-black italic text-white uppercase truncate block mt-0.5">{mainActive.name}</span>
                                                                                    </div>
                                                                                    <span className="text-[9px] font-bold text-yellow-500">{mainActive.pct}%</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {p.passives && p.passives.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                                                {p.passives.map(pass => (
                                                                                    <div key={pass.name} className="flex items-center gap-1 bg-black/40 px-1.5 py-1 rounded border border-white/5" title={`${pass.name} (${pass.pct}%)`}>
                                                                                        {pass.img && <img src={pass.img} alt={pass.name} className="w-3.5 h-3.5 object-contain rounded-full" />}
                                                                                        <span className="text-[8px] text-gray-300 font-bold truncate max-w-[50px]">{pass.name}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2 pt-1.5 border-t border-white/5">
                                                                            {p.topPet && (
                                                                                <div className="flex items-center gap-1">
                                                                                    {p.topPet.img && <img src={p.topPet.img} alt={p.topPet.name} className="w-3.5 h-3.5 object-contain" />}
                                                                                    <span className="text-[8px] text-gray-400 font-bold truncate max-w-[50px]">{p.topPet.name}</span>
                                                                                </div>
                                                                            )}
                                                                            {p.topItem && (
                                                                                <div className="flex items-center gap-1">
                                                                                    {p.topItem.img && <img src={p.topItem.img} alt={p.topItem.name} className="w-3.5 h-3.5 object-contain" />}
                                                                                    <span className="text-[8px] text-gray-400 font-bold truncate max-w-[50px]">{p.topItem.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* SEÇÃO: KILL FEED PHASES (EARLY, MID, LATE) NO PERFIL DA EQUIPE */}
                {showTeamDetails && (teamProfileSubTab === 'all' || teamProfileSubTab === 'killfeedPhases') && (
                    teamVisibleSections.killfeedPhases ? (
                    <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-emerald-900/30 shadow-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                                        <Crosshair size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
                                        AGRESSIVIDADE POR FASE DO JOGO ({selectedTeamStats.name})
                                    </h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Análise da distribuição de abates da equipe baseada nas zonas seguras (Early, Mid e Late Game) no Kill Feed.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleTeamSection('killfeedPhases')}
                                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white hover:border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-2"
                                    title="Ocultar esta seção"
                                >
                                    <EyeOff size={13} /> Ocultar Seção
                                </button>
                            </div>
                        </div>

                        {(() => {
                            const teamPhaseStats = allTeamsPhaseStats.find(t => t.name === selectedTeamStats.name);
                            if (!teamPhaseStats || teamPhaseStats.totalPhaseKills === 0) {
                                return (
                                    <div className="py-12 text-center text-gray-500 font-black uppercase italic tracking-widest">
                                        Nenhum registro de abates no kill feed para esta equipe.
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-black/60 p-6 rounded-2xl border border-emerald-500/30 text-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">EARLY GAME (SAFES 1-2)</span>
                                            <span className="text-4xl font-black text-white italic">{teamPhaseStats.earlyKills}</span>
                                            <span className="text-xs font-bold text-gray-400 block mt-1">KILLS</span>
                                            <div className="mt-4 bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1.5 rounded-full inline-block">
                                                {teamPhaseStats.earlyPct}% do total
                                            </div>
                                        </div>
                                        <div className="bg-black/60 p-6 rounded-2xl border border-yellow-500/30 text-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-yellow-500/20 transition-colors"></div>
                                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">MID GAME (SAFES 3-4)</span>
                                            <span className="text-4xl font-black text-white italic">{teamPhaseStats.midKills}</span>
                                            <span className="text-xs font-bold text-gray-400 block mt-1">KILLS</span>
                                            <div className="mt-4 bg-yellow-500/20 text-yellow-400 text-xs font-black px-3 py-1.5 rounded-full inline-block">
                                                {teamPhaseStats.midPct}% do total
                                            </div>
                                        </div>
                                        <div className="bg-black/60 p-6 rounded-2xl border border-red-500/30 text-center relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/20 transition-colors"></div>
                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2">LATE GAME (SAFES 5+)</span>
                                            <span className="text-4xl font-black text-white italic">{teamPhaseStats.lateKills}</span>
                                            <span className="text-xs font-bold text-gray-400 block mt-1">KILLS</span>
                                            <div className="mt-4 bg-red-500/20 text-red-400 text-xs font-black px-3 py-1.5 rounded-full inline-block">
                                                {teamPhaseStats.latePct}% do total
                                            </div>
                                        </div>
                                    </div>
                                    {teamPhaseStats.otherKills > 0 && (
                                        <div className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            + {teamPhaseStats.otherKills} abates em safes não identificadas
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    ) : (
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <Crosshair size={20} className="text-emerald-400" />
                            <span className="text-xs font-black uppercase text-gray-300">
                                8. Agressividade por Fase do Jogo <span className="text-red-400 font-normal">(Oculto)</span>
                            </span>
                        </div>
                        <button
                            onClick={() => toggleTeamSection('killfeedPhases')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <Eye size={13} /> Mostrar Seção
                        </button>
                    </div>
                    )
                )}

                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Seção de Detalhes Dinâmicos (Mapa, Queda ou Posição) */}
                        {(selectedMap || selectedDrop || selectedPosition !== null) ? (
                            <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-yellow-500/40 shadow-2xl animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-500 rounded-2xl text-black">
                                            {selectedMap ? <MapIcon size={24} /> : selectedDrop ? <Zap size={24} /> : <Trophy size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                                {selectedMap || (selectedDrop ? `QUEDA ${selectedDrop}` : `${selectedPosition}º LUGAR`)}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Relatório Detalhado de Performance</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedMap(null); setSelectedDrop(null); setSelectedPosition(null); }}
                                        className="text-[10px] font-black text-yellow-500 hover:text-white uppercase tracking-widest border border-yellow-500/20 px-4 py-2 rounded-xl transition-all"
                                    >
                                        Fechar Detalhes
                                    </button>
                                </div>

                                <div className="bg-black/30 rounded-2xl border border-gray-800 overflow-hidden shadow-inner overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead className="bg-black/80 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">{selectedMap ? "Partida" : "Mapa / Partida"}</th>
                                                <th className="px-6 py-4 text-center">Posição</th>
                                                <th className="px-6 py-4 text-center">PTS</th>
                                                <th className="px-6 py-4 text-center">PTS/C</th>
                                                <th className="px-6 py-4 text-center">Abates</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {(selectedMap ? selectedMapMatchDetails : selectedDrop ? selectedDropMatchDetails : selectedPositionMatchDetails).map((match, idx) => {
                                                const dKey = `${match.RD}-${match.Q}`;
                                                const isExp = expandedDropKey === dKey;
                                                return (
                                                <React.Fragment key={idx}>
                                                    <tr 
                                                        onClick={() => setExpandedDropKey(isExp ? null : dKey)}
                                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-white uppercase italic">
                                                                    {selectedMap ? `Queda ${match.Q}` : `${match.MAPA} (Q${match.Q})`}
                                                                </span>
                                                                <span className="text-[9px] text-gray-600 font-bold uppercase">Rodada {match.RD}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black italic text-xs border ${parseInt(match.POS) === 1 ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-900 text-gray-400 border-gray-800'}`}>
                                                                {match.POS}º
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-black text-yellow-500 italic">{match.PTS}</td>
                                                        <td className="px-6 py-4 text-center font-black text-orange-500 italic">{match.PTSC}</td>
                                                        <td className="px-6 py-4 text-center font-black text-red-500 italic flex items-center justify-center gap-3">
                                                            {match.ABTS}
                                                            <ChevronDown size={14} className={`text-gray-500 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                                                        </td>
                                                    </tr>
                                                    {isExp && (
                                                        <tr className="bg-black/60 border-y border-yellow-500/20">
                                                            <td colSpan={5} className="p-4 sm:p-6">
                                                                <DropCompositionViewer
                                                                    teamName={activeTeamName}
                                                                    round={match.RD}
                                                                    drop={match.Q}
                                                                    mapa={match.MAPA}
                                                                    playersLoadout={getTeamDropComposition(
                                                                        data,
                                                                        activeTeamName,
                                                                        match.RD,
                                                                        match.Q,
                                                                        match.CONFRONTO,
                                                                        match.MAPA
                                                                    )}
                                                                />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Gráfico de Evolução */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-12 flex items-center gap-3 uppercase tracking-widest">
                                        <TrendingUp size={20} className="text-yellow-500"/> HISTÓRICO DE PERFORMANCE
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                <XAxis dataKey="label" stroke="#444" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                                                <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }}
                                                    labelStyle={{ color: '#EAB308', fontWeight: 'bold', marginBottom: '5px' }}
                                                />
                                                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                                <Bar dataKey="pts" name="Pontos" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={35}>
                                                    <LabelList dataKey="pts" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                                </Bar>
                                                <Bar dataKey="kills" name="Abates" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={35}>
                                                    <LabelList dataKey="kills" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Performance Territorial (MAPAS) */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                        <MapIcon size={20} className="text-blue-500"/> DOMÍNIO TERRITORIAL (CLIQUE PARA DETALHES)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {mapPerformanceData.map((m, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setSelectedMap(m.map)}
                                                className="bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-yellow-500/60 hover:bg-yellow-500/5 transition-all group relative overflow-hidden cursor-pointer shadow-lg active:scale-95"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-white font-black italic uppercase text-2xl leading-none tracking-tight group-hover:text-yellow-500 transition-colors">{m.map}</h4>
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">{m.matches} QUEDAS DISPUTADAS</span>
                                                    </div>
                                                    <div className="bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black italic shadow-lg">
                                                        {m.booyahs} BOOYAHS
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">PTS TOTAL</span>
                                                        <span className="text-2xl font-black text-yellow-500 italic">{m.pts}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgPts}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5 pl-4">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">PTS/C</span>
                                                        <span className="text-2xl font-black text-orange-500 italic">{m.ptsc}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgPtsc}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5 pl-4">
                                                        <span className="text-[9px] text-gray-600 font-black uppercase">ABATES</span>
                                                        <span className="text-2xl font-black text-red-500 italic">{m.kills}</span>
                                                        <span className="text-[8px] text-gray-500 font-mono mt-1">AVG: {m.avgKills}</span>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <span className="text-[8px] font-black text-yellow-500 uppercase italic">Ver mais</span>
                                                    <ChevronDown size={12} className="text-yellow-500 -rotate-90" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* MOVIDO: Distribuição por Safe (Posicionamento atualizado conforme solicitado) */}
                                <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                        <Disc size={20} className="text-red-500"/> DISTRIBUIÇÃO POR SAFE
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                        {safeStatsData.map((s, i) => {
                                            const maxSafe = Math.max(...safeStatsData.map(x => x.count)) || 1;
                                            const percent = ((s.count / maxSafe) * 100);
                                            return (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <Disc size={12} className="text-red-600 opacity-50" /> SAFE {s.name}
                                                        </span>
                                                        <span className="text-xs font-black text-white italic">{s.count} ABATES</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-gradient-to-r from-red-800 to-red-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {safeStatsData.length === 0 && <div className="col-span-2 py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem logs de abates registrados</div>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        {/* Sumário de Posições Interativo */}
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <Trophy size={20} className="text-yellow-500"/> SUMÁRIO DE POSIÇÕES (CLIQUE)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {positionStatsData.map((p, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedPosition(p.pos)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group hover:bg-yellow-500/10 ${selectedPosition === p.pos ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-white/5 bg-black/40'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic text-sm border flex-shrink-0 transition-colors ${p.pos === 1 || selectedPosition === p.pos ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-900 text-gray-500 border-gray-800'}`}>
                                            {p.pos}º
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${selectedPosition === p.pos ? 'text-yellow-500' : 'text-gray-600'}`}>LUGAR</span>
                                            <div className="flex items-end gap-1.5 mt-1">
                                                <span className="text-2xl font-black text-white italic leading-none">{p.count}x</span>
                                            </div>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter mt-1 opacity-60">FREQUÊNCIA</span>
                                        </div>
                                    </div>
                                ))}
                                {positionStatsData.length === 0 && (
                                    <div className="col-span-2 py-8 text-center text-[10px] text-gray-700 font-black uppercase italic tracking-widest">Sem dados de posição</div>
                                )}
                            </div>
                        </div>

                        {/* Performance por Partida (QUEDAS) */}
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-8 flex items-center gap-3 uppercase tracking-widest">
                                <Zap size={20} className="text-orange-500"/> PERFORMANCE POR QUEDA (CLIQUE)
                            </h3>
                            <div className="space-y-4">
                                {dropStatsData.map((d, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedDrop(d.q)}
                                        className={`bg-black/40 rounded-2xl p-4 border transition-all cursor-pointer group hover:bg-yellow-500/10 ${selectedDrop === d.q ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-sm italic transition-colors ${selectedDrop === d.q ? 'text-white bg-yellow-600' : 'text-yellow-500'}`}>
                                                    Q{d.q}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-white font-black text-lg leading-none">{d.pts} <small className="text-[10px] text-gray-500 uppercase">Pts</small></span>
                                                        <span className="text-red-500 font-black text-lg leading-none">{d.kills} <small className="text-[10px] text-gray-500 uppercase">Kills</small></span>
                                                    </div>
                                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                                                        MÉDIAS: {d.avgPts} P / {d.avgKills} K
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-700 transition-transform ${selectedDrop === d.q ? 'rotate-180 text-yellow-500' : '-rotate-90 group-hover:text-yellow-500'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : activeTab === 'positions' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header & Subtitle */}
                <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500 shadow-lg">
                                    <Trophy size={22} />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter">
                                    Ranking de Posições (1º ao 12º Lugar)
                                </h2>
                            </div>
                            <p className="text-xs text-gray-400 font-medium max-w-2xl">
                                Descubra quais times mais ficaram em cada colocação específica (do 1º ao 12º lugar), taxas de Booyah, Top 3, Top 6 e desempenho por posição.
                            </p>
                        </div>

                        {/* Badges de Destaque Geral */}
                        <div className="flex flex-wrap gap-2">
                            <div className="px-4 py-2 bg-black/60 rounded-xl border border-white/5 flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                    {allTeamsPositionStats.length} Equipes Mapeadas
                                </span>
                            </div>
                            <div className="px-4 py-2 bg-black/60 rounded-xl border border-white/5 flex items-center gap-2.5">
                                <span className="text-yellow-500 font-black text-xs">
                                    {allTeamsPositionStats.reduce((acc, t) => acc + t.totalMatches, 0)}
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                    Total de Quedas
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-selector de Posição (Pills 1º ao 12º + Geral) */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => {
                                setPositionTabFilter('ALL');
                                setExpandedPositionTeam(null);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                positionTabFilter === 'ALL' 
                                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' 
                                    : 'bg-black/60 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                            }`}
                        >
                            <LayoutGrid size={14} /> Matriz Geral (1º-12º)
                        </button>

                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(pos => {
                            const isFirst = pos === 1;
                            const isSecond = pos === 2;
                            const isThird = pos === 3;
                            const isLast = pos === 12;
                            const isSelected = positionTabFilter === pos;

                            let badgeColor = 'border-white/5 text-gray-400';
                            if (isFirst) badgeColor = 'border-yellow-500/30 text-yellow-500';
                            else if (isSecond) badgeColor = 'border-gray-400/30 text-gray-300';
                            else if (isThird) badgeColor = 'border-amber-600/30 text-amber-500';
                            else if (isLast) badgeColor = 'border-red-500/30 text-red-400';

                            return (
                                <button
                                    key={pos}
                                    onClick={() => {
                                        setPositionTabFilter(pos);
                                        setExpandedPositionTeam(null);
                                        setPositionSortConfig({ key: `pos${pos}`, direction: 'desc' });
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isSelected 
                                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black' 
                                            : `bg-black/60 hover:bg-white/5 border ${badgeColor} hover:text-white`
                                    }`}
                                >
                                    <span>{pos}º</span>
                                    <span className="text-[10px] opacity-80">{pos === 1 ? 'Booyah' : 'Lugar'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CONTEÚDO 1: VISÃO DE UMA POSIÇÃO ESPECÍFICA (Ex: 1º Lugar, 4º Lugar, 12º Lugar) */}
                {positionTabFilter !== 'ALL' ? (
                    <div className="space-y-6">
                        {(() => {
                            const pos = positionTabFilter as number;
                            const sortedByThisPos = [...allTeamsPositionStats].sort((a, b) => {
                                const countDiff = (b.posCounts[pos] || 0) - (a.posCounts[pos] || 0);
                                if (countDiff !== 0) return countDiff;
                                return (b.posKills[pos] || 0) - (a.posKills[pos] || 0);
                            });

                            const top3Teams = sortedByThisPos.slice(0, 3);
                            const totalOcorrencias = sortedByThisPos.reduce((acc, t) => acc + (t.posCounts[pos] || 0), 0);
                            const totalAbatesPos = sortedByThisPos.reduce((acc, t) => acc + (t.posKills[pos] || 0), 0);

                            return (
                                <>
                                    {/* Pódio / Top 3 da Posição */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {top3Teams.map((team, rankIdx) => {
                                            const count = team.posCounts[pos] || 0;
                                            const pct = team.totalMatches > 0 ? ((count / team.totalMatches) * 100).toFixed(1) : "0.0";
                                            const kills = team.posKills[pos] || 0;
                                            const avgKills = count > 0 ? (kills / count).toFixed(1) : "0.0";
                                            const pts = team.posPts[pos] || 0;

                                            const medals = ['🥇 1º Mais Frequente', '🥈 2º Mais Frequente', '🥉 3º Mais Frequente'];
                                            const borderColors = [
                                                'border-yellow-500/40 bg-gradient-to-b from-yellow-500/10 to-transparent',
                                                'border-gray-400/30 bg-gradient-to-b from-gray-400/10 to-transparent',
                                                'border-amber-600/30 bg-gradient-to-b from-amber-600/10 to-transparent'
                                            ];

                                            return (
                                                <div 
                                                    key={team.name}
                                                    className={`bg-[#1a1a1a] rounded-3xl p-6 border ${borderColors[rankIdx] || 'border-gray-800'} shadow-xl relative overflow-hidden group hover:border-yellow-500/50 transition-all`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                                                            {medals[rankIdx]}
                                                        </span>
                                                        <span className="text-3xl font-black italic text-white">
                                                            {count}<small className="text-xs text-gray-500 font-bold ml-1">x</small>
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-14 h-14 bg-black rounded-2xl border border-white/10 p-2 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                                            {team.image ? (
                                                                <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <Shield size={24} className="text-gray-700" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-lg font-black text-white italic uppercase tracking-wider truncate group-hover:text-yellow-500 transition-colors">
                                                                {team.name}
                                                            </h3>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                                {pct}% de suas quedas jogadas
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
                                                        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
                                                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block">Kills</span>
                                                            <span className="text-sm font-black text-red-400">{kills}</span>
                                                        </div>
                                                        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
                                                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block">Média K</span>
                                                            <span className="text-sm font-black text-orange-400">{avgKills}</span>
                                                        </div>
                                                        <div className="bg-black/40 rounded-xl p-2 border border-white/5">
                                                            <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider block">Pontos</span>
                                                            <span className="text-sm font-black text-yellow-500">{pts}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Tabela Ranqueada Completa para a Posição */}
                                    <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                                        <div className="p-6 bg-black/40 border-b border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-black italic text-white uppercase tracking-wider flex items-center gap-2">
                                                    <Trophy size={18} className="text-yellow-500" />
                                                    Classificação de Times em {pos}º Lugar
                                                </h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    Total de {totalOcorrencias} registros mapeados em {pos}º lugar no campeonato
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setPositionTabFilter('ALL')}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 w-fit border border-white/5"
                                            >
                                                <ArrowLeft size={14} /> Voltar à Matriz Geral
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-left min-w-[850px]">
                                                <thead className="bg-black/60 text-[10px] text-gray-400 uppercase tracking-widest font-black italic">
                                                    <tr>
                                                        <th className="p-4 w-16 text-center">#</th>
                                                        <th className="p-4">Equipe</th>
                                                        <th className="p-4 text-center text-yellow-500">Vezes em {pos}º</th>
                                                        <th className="p-4 text-center">% das Quedas</th>
                                                        <th className="p-4 w-40 text-center">Frequência</th>
                                                        <th className="p-4 text-center text-red-400">Total Abates</th>
                                                        <th className="p-4 text-center text-orange-400">Média Abates</th>
                                                        <th className="p-4 text-center text-yellow-400">Total Pontos</th>
                                                        <th className="p-4 text-center">Partidas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {sortedByThisPos.map((team, idx) => {
                                                        const count = team.posCounts[pos] || 0;
                                                        const pctNum = team.totalMatches > 0 ? (count / team.totalMatches) * 100 : 0;
                                                        const pct = pctNum.toFixed(1);
                                                        const kills = team.posKills[pos] || 0;
                                                        const avgKills = count > 0 ? (kills / count).toFixed(1) : "0.0";
                                                        const pts = team.posPts[pos] || 0;
                                                        const isExpanded = expandedPositionTeam === team.name;
                                                        const detailsList = team.posDetails[pos] || [];

                                                        return (
                                                            <React.Fragment key={team.name}>
                                                                <tr className={`hover:bg-white/5 transition-colors group ${count > 0 ? '' : 'opacity-40'}`}>
                                                                    <td className="p-4 text-center">
                                                                        <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] font-black italic ${
                                                                            idx === 0 && count > 0 ? 'bg-yellow-500 text-black' :
                                                                            idx === 1 && count > 0 ? 'bg-gray-300 text-black' :
                                                                            idx === 2 && count > 0 ? 'bg-amber-600 text-white' :
                                                                            'bg-black text-gray-500 border border-white/10'
                                                                        }`}>
                                                                            {idx + 1}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="flex items-center gap-3">
                                                                            {team.image ? (
                                                                                <img src={team.image} alt={team.name} className="w-8 h-8 rounded-lg object-contain bg-black border border-white/5" />
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-lg bg-black border border-white/5 flex items-center justify-center">
                                                                                    <Shield size={14} className="text-gray-700" />
                                                                                </div>
                                                                            )}
                                                                            <span className="text-white font-black italic uppercase tracking-wider text-sm group-hover:text-yellow-500 transition-colors">
                                                                                {team.name}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`text-lg font-black italic ${count > 0 ? 'text-yellow-500' : 'text-gray-600'}`}>
                                                                            {count}x
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className="text-gray-300 font-bold text-xs">{pct}%</span>
                                                                        <span className="text-[9px] text-gray-500 block">({team.totalMatches} quedas)</span>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                                                            <div 
                                                                                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all"
                                                                                style={{ width: `${Math.min(pctNum * 2, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-center font-black text-red-400">{kills}</td>
                                                                    <td className="p-4 text-center font-black text-orange-400">{avgKills}</td>
                                                                    <td className="p-4 text-center font-black text-yellow-500">{pts}</td>
                                                                    <td className="p-4 text-center">
                                                                        {count > 0 ? (
                                                                            <button
                                                                                onClick={() => setExpandedPositionTeam(isExpanded ? null : team.name)}
                                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                                                                    isExpanded 
                                                                                        ? 'bg-yellow-500 text-black border-yellow-400 shadow-md' 
                                                                                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
                                                                                }`}
                                                                            >
                                                                                {isExpanded ? 'Ocultar' : `Ver Partidas (${count})`}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-gray-700 text-xs font-bold">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>

                                                                {/* Lista Expandida de Partidas nessa Colocação */}
                                                                {isExpanded && detailsList.length > 0 && (
                                                                    <tr className="bg-black/60 border-y border-yellow-500/20">
                                                                        <td colSpan={9} className="p-4 md:p-6">
                                                                            <div className="space-y-3">
                                                                                <h4 className="text-xs font-black text-yellow-500 uppercase tracking-wider flex items-center gap-2">
                                                                                    <Target size={14} /> Quedas onde {team.name} terminou em {pos}º Lugar
                                                                                </h4>
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                                    {detailsList.map((d, mIdx) => (
                                                                                        <div key={mIdx} className="bg-black/80 p-3.5 rounded-xl border border-white/10 space-y-2">
                                                                                            <div className="flex justify-between items-center text-xs">
                                                                                                <span className="font-black text-white">{d.CONFRONTO}</span>
                                                                                                <span className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                                                                                                    RD {d.RD} • Q{d.Q}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center text-xs text-gray-400">
                                                                                                <span className="font-bold uppercase text-[10px] text-gray-300">{d.MAPA}</span>
                                                                                                <span className="text-red-400 font-black">{d.ABTS} Kills</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5">
                                                                                                <span className="text-gray-500">Pontos: <strong className="text-yellow-500">{d.PTS}</strong></span>
                                                                                                {d.ONDE_FECHOU && (
                                                                                                    <span className="text-[9px] text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                                                                                                        📍 {d.ONDE_FECHOU}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                ) : (
                    /* CONTEÚDO 2: VISÃO MATRIZ GERAL (1º AO 12º LUGAR) */
                    <div className="space-y-8">
                        {/* 12 Cards de Líderes por Posição (1º ao 12º) */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black italic text-white uppercase tracking-wider flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500" />
                                    Times que Mais Ficaram em Cada Posição (1º ao 12º)
                                </h3>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    Clique em qualquer posição para abrir a análise detalhada
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(pos => {
                                    const sortedForPos = [...allTeamsPositionStats].sort((a, b) => (b.posCounts[pos] || 0) - (a.posCounts[pos] || 0));
                                    const leader = sortedForPos[0];
                                    const second = sortedForPos[1];
                                    const leaderCount = leader ? (leader.posCounts[pos] || 0) : 0;
                                    const leaderPct = leader && leader.totalMatches > 0 ? ((leaderCount / leader.totalMatches) * 100).toFixed(0) : "0";

                                    let titleColor = 'text-gray-300';
                                    let borderAccent = 'border-white/5 hover:border-yellow-500/40';
                                    let badgeBg = 'bg-gray-800 text-gray-300';
                                    let label = `${pos}º Lugar`;

                                    if (pos === 1) {
                                        titleColor = 'text-yellow-400';
                                        borderAccent = 'border-yellow-500/30 hover:border-yellow-500 bg-gradient-to-b from-yellow-500/5 to-transparent';
                                        badgeBg = 'bg-yellow-500 text-black font-black';
                                        label = '1º (Booyah)';
                                    } else if (pos === 2) {
                                        titleColor = 'text-gray-200';
                                        borderAccent = 'border-gray-400/30 hover:border-gray-400 bg-gradient-to-b from-gray-400/5 to-transparent';
                                        badgeBg = 'bg-gray-300 text-black font-black';
                                        label = '2º (Vice)';
                                    } else if (pos === 3) {
                                        titleColor = 'text-amber-500';
                                        borderAccent = 'border-amber-600/30 hover:border-amber-600 bg-gradient-to-b from-amber-600/5 to-transparent';
                                        badgeBg = 'bg-amber-600 text-white font-black';
                                        label = '3º Lugar';
                                    } else if (pos === 12) {
                                        titleColor = 'text-red-400';
                                        borderAccent = 'border-red-500/30 hover:border-red-500 bg-gradient-to-b from-red-500/5 to-transparent';
                                        badgeBg = 'bg-red-600 text-white font-black';
                                        label = '12º (Último)';
                                    }

                                    return (
                                        <div
                                            key={pos}
                                            onClick={() => {
                                                setPositionTabFilter(pos);
                                                setPositionSortConfig({ key: `pos${pos}`, direction: 'desc' });
                                            }}
                                            className={`bg-[#1a1a1a] rounded-2xl p-4 border ${borderAccent} shadow-xl cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group`}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeBg}`}>
                                                    {label}
                                                </span>
                                                <ChevronDown size={14} className="text-gray-600 -rotate-90 group-hover:text-yellow-500 transition-colors" />
                                            </div>

                                            {leader && leaderCount > 0 ? (
                                                <div className="space-y-2 my-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-black rounded-lg border border-white/10 p-1 flex items-center justify-center flex-shrink-0">
                                                            {leader.image ? (
                                                                <img src={leader.image} alt={leader.name} className="w-full h-full object-contain" />
                                                            ) : (
                                                                <Shield size={14} className="text-gray-700" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-black text-white italic uppercase tracking-wider block truncate group-hover:text-yellow-500 transition-colors">
                                                                {leader.name}
                                                            </span>
                                                            <span className="text-[9px] text-gray-500 font-bold block">
                                                                {leaderPct}% das quedas
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase">Líder:</span>
                                                        <span className="font-black italic text-yellow-500">{leaderCount}x</span>
                                                    </div>

                                                    {second && (second.posCounts[pos] || 0) > 0 && (
                                                        <div className="flex justify-between items-center text-[9px] text-gray-500">
                                                            <span className="truncate max-w-[80px]">2º {second.name}</span>
                                                            <span className="font-bold">{second.posCounts[pos]}x</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-[10px] text-gray-600 font-bold uppercase">
                                                    Sem registros
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tabela Matriz Completa de Posições (1º ao 12º) */}
                        <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                            <div className="p-6 bg-black/40 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-black italic text-white uppercase tracking-wider flex items-center gap-2">
                                        <ListOrdered size={20} className="text-yellow-500" />
                                        Matriz de Colocações por Equipe
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium">
                                        Clique em qualquer cabeçalho de coluna (1º, 2º, 3º... 12º, Top 3, Top 6, Média) para ordenar os times por aquela colocação.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">
                                        Ordenando por: <strong className="text-yellow-500 uppercase">{positionSortConfig.key.toUpperCase()} ({positionSortConfig.direction === 'desc' ? 'Maior p/ Menor' : 'Menor p/ Maior'})</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left min-w-[1100px] border-collapse select-none">
                                    <thead className="bg-black/70 text-[9px] text-gray-400 uppercase tracking-widest font-black italic border-b border-gray-800">
                                        <tr>
                                            <th className="p-3.5 w-12 text-center">#</th>
                                            <th 
                                                className="p-3.5 cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setPositionSortConfig(prev => ({
                                                    key: 'name',
                                                    direction: prev.key === 'name' && prev.direction === 'asc' ? 'desc' : 'asc'
                                                }))}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>Equipe</span>
                                                    {positionSortConfig.key === 'name' && (
                                                        <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setPositionSortConfig(prev => ({
                                                    key: 'totalMatches',
                                                    direction: prev.key === 'totalMatches' && prev.direction === 'desc' ? 'asc' : 'desc'
                                                }))}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Quedas (S)</span>
                                                    {positionSortConfig.key === 'totalMatches' && (
                                                        <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>

                                            {/* Colunas de 1º a 12º Lugar */}
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(pos => {
                                                const key = `pos${pos}`;
                                                const isActive = positionSortConfig.key === key;

                                                let labelColor = 'hover:text-white';
                                                if (pos === 1) labelColor = 'text-yellow-400';
                                                else if (pos === 2) labelColor = 'text-gray-300';
                                                else if (pos === 3) labelColor = 'text-amber-500';
                                                else if (pos === 12) labelColor = 'text-red-400';

                                                return (
                                                    <th 
                                                        key={pos}
                                                        className={`p-3.5 text-center cursor-pointer transition-colors ${labelColor} ${isActive ? 'bg-white/5' : ''}`}
                                                        onClick={() => setPositionSortConfig(prev => ({
                                                            key,
                                                            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
                                                        }))}
                                                    >
                                                        <div className="flex items-center justify-center gap-0.5">
                                                            <span className={isActive ? 'text-yellow-500 font-black' : ''}>{pos}º</span>
                                                            {isActive && (
                                                                <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}

                                            <th 
                                                className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setPositionSortConfig(prev => ({
                                                    key: 'top3',
                                                    direction: prev.key === 'top3' && prev.direction === 'desc' ? 'asc' : 'desc'
                                                }))}
                                            >
                                                <div className="flex items-center justify-center gap-1 text-yellow-500">
                                                    <span>Top 3</span>
                                                    {positionSortConfig.key === 'top3' && (
                                                        <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setPositionSortConfig(prev => ({
                                                    key: 'top6',
                                                    direction: prev.key === 'top6' && prev.direction === 'desc' ? 'asc' : 'desc'
                                                }))}
                                            >
                                                <div className="flex items-center justify-center gap-1 text-blue-400">
                                                    <span>Top 6</span>
                                                    {positionSortConfig.key === 'top6' && (
                                                        <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                className="p-3.5 text-center cursor-pointer hover:text-white transition-colors"
                                                onClick={() => setPositionSortConfig(prev => ({
                                                    key: 'avgPos',
                                                    direction: prev.key === 'avgPos' && prev.direction === 'asc' ? 'desc' : 'asc'
                                                }))}
                                            >
                                                <div className="flex items-center justify-center gap-1 text-purple-400">
                                                    <span>Pos. Média</span>
                                                    {positionSortConfig.key === 'avgPos' && (
                                                        <ArrowDown size={10} className={`text-yellow-500 ${positionSortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                        {sortedPositionRanking.map((team, idx) => {
                                            return (
                                                <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-3.5 text-center font-mono text-gray-500 text-[10px]">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <div 
                                                            className="flex items-center gap-3 cursor-pointer"
                                                            onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}
                                                        >
                                                            {team.image ? (
                                                                <img src={team.image} alt={team.name} className="w-7 h-7 rounded-lg object-contain bg-black border border-white/5 flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-lg bg-black border border-white/5 flex items-center justify-center flex-shrink-0">
                                                                    <Shield size={12} className="text-gray-700" />
                                                                </div>
                                                            )}
                                                            <span className="text-white font-black italic uppercase tracking-wider group-hover:text-yellow-500 transition-colors">
                                                                {team.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 text-center font-bold text-gray-400">
                                                        {team.totalMatches}
                                                    </td>

                                                    {/* Células de 1º a 12º Lugar */}
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(pos => {
                                                        const count = team.posCounts[pos] || 0;
                                                        const isSortedCol = positionSortConfig.key === `pos${pos}`;

                                                        let badgeStyle = 'text-gray-600 font-bold';
                                                        if (count > 0) {
                                                            if (pos === 1) badgeStyle = 'text-yellow-400 font-black bg-yellow-500/10 rounded px-1.5 py-0.5 border border-yellow-500/20';
                                                            else if (pos === 2) badgeStyle = 'text-gray-200 font-black bg-gray-400/10 rounded px-1.5 py-0.5 border border-gray-400/20';
                                                            else if (pos === 3) badgeStyle = 'text-amber-500 font-black bg-amber-600/10 rounded px-1.5 py-0.5 border border-amber-600/20';
                                                            else if (pos === 12) badgeStyle = 'text-red-400 font-black bg-red-500/10 rounded px-1.5 py-0.5 border border-red-500/20';
                                                            else if (pos <= 6) badgeStyle = 'text-blue-300 font-bold';
                                                            else badgeStyle = 'text-gray-300 font-bold';
                                                        }

                                                        return (
                                                            <td 
                                                                key={pos} 
                                                                className={`p-3.5 text-center cursor-pointer transition-colors hover:bg-yellow-500/10 ${isSortedCol ? 'bg-white/[0.03]' : ''}`}
                                                                onClick={() => {
                                                                    setPositionTabFilter(pos);
                                                                    setPositionSortConfig({ key: `pos${pos}`, direction: 'desc' });
                                                                }}
                                                            >
                                                                <span className={badgeStyle}>
                                                                    {count > 0 ? `${count}` : '-'}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="p-3.5 text-center">
                                                        <span className="text-yellow-500 font-black">{team.top3}</span>
                                                        <span className="text-[9px] text-gray-500 font-bold block">{team.top3Pct.toFixed(0)}%</span>
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        <span className="text-blue-400 font-black">{team.top6}</span>
                                                        <span className="text-[9px] text-gray-500 font-bold block">{team.top6Pct.toFixed(0)}%</span>
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        <span className="text-purple-400 font-black italic bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                                            {team.avgPosFormatted}º
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ) : activeTab === 'mapStats' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-yellow-500/20 backdrop-blur-md">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30 shadow-inner">
                                <BarChart2 size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                    Ranking & Análise de Mapas
                                </h1>
                                <p className="text-xs text-gray-400 font-medium tracking-wide mt-1">
                                    Acompanhe o ranking de mapas por abates, média de abates por partida e o desempenho detalhado por rodada.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-black/60 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
                            <Swords size={18} className="text-yellow-500" />
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Total Abates Registrados</div>
                                <div className="text-base font-black text-white">{mapStatsData.kpis.totalKillsAllMaps.toLocaleString('pt-BR')} Kills</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1 */}
                    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-white/10 hover:border-yellow-500/40 p-5 rounded-2xl shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Mapa Mais Letal</span>
                            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                                <Flame size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-white uppercase italic tracking-wide">
                            {mapStatsData.kpis.topMapKills?.mapName || 'N/A'}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Total Kills:</span>
                            <span className="font-black text-yellow-400">{mapStatsData.kpis.topMapKills?.totalKills.toLocaleString('pt-BR') || 0}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Média / Partida:</span>
                            <span className="font-bold text-gray-200">{(mapStatsData.kpis.topMapKills?.avgKillsPerMatch || 0).toFixed(1)}</span>
                        </div>
                    </div>

                    {/* KPI 2 */}
                    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-white/10 hover:border-emerald-500/40 p-5 rounded-2xl shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Maior Média por Jogo</span>
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-white uppercase italic tracking-wide">
                            {mapStatsData.kpis.topMapAvg?.mapName || 'N/A'}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Média por Partida:</span>
                            <span className="font-black text-emerald-400">{(mapStatsData.kpis.topMapAvg?.avgKillsPerMatch || 0).toFixed(1)} Kills</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Partidas Disputadas:</span>
                            <span className="font-bold text-gray-200">{mapStatsData.kpis.topMapAvg?.totalMatches || 0} PJ</span>
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-white/10 hover:border-red-500/40 p-5 rounded-2xl shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Recorde de Abates em Rodada</span>
                            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                                <Award size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-white uppercase italic tracking-wide">
                            {mapStatsData.kpis.topRoundMap ? `${mapStatsData.kpis.topRoundMap.mapName} (${mapStatsData.kpis.topRoundMap.roundName})` : 'N/A'}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Kills na Rodada:</span>
                            <span className="font-black text-red-400">{mapStatsData.kpis.topRoundMap?.totalKills || 0} Kills</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Média/Partida RD:</span>
                            <span className="font-bold text-gray-200">{(mapStatsData.kpis.topRoundMap?.avgKills || 0).toFixed(1)}</span>
                        </div>
                    </div>

                    {/* KPI 4 */}
                    <div className="bg-gradient-to-br from-gray-900/90 via-black to-gray-950 border border-white/10 hover:border-blue-500/40 p-5 rounded-2xl shadow-xl transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total de Mapas Ativos</span>
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                <Layers size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-black text-white uppercase italic tracking-wide">
                            {mapStatsData.mapList.length} Mapas
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Rodadas Analisadas:</span>
                            <span className="font-black text-blue-400">{mapStatsData.roundsList.length} Rodadas</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-bold">Média Geral p/ Mapa:</span>
                            <span className="font-bold text-gray-200">
                                {mapStatsData.mapList.length > 0 ? (mapStatsData.kpis.totalKillsAllMaps / mapStatsData.mapList.length).toFixed(0) : 0} Kills
                            </span>
                        </div>
                    </div>
                </div>

                {/* SEÇÃO 1: RANKING GERAL DE MAPAS */}
                <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
                        <div>
                            <h2 className="text-lg font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500" />
                                Ranking Geral de Mapas por Abates e Médias
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">Classificação geral dos mapas com médias calculadas por partida disputada.</p>
                        </div>

                        {/* Search */}
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-56">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar mapa..."
                                    value={mapStatsSearch}
                                    onChange={(e) => setMapStatsSearch(e.target.value)}
                                    className="w-full bg-black/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                                    <th className="py-3.5 px-4 text-center w-12">#</th>
                                    <th 
                                        className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setMapStatsSort(prev => ({ field: 'mapName', direction: prev.field === 'mapName' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            Mapa
                                            <ArrowUpDown size={12} className={mapStatsSort.field === 'mapName' ? 'text-yellow-500' : 'text-gray-600'} />
                                        </div>
                                    </th>
                                    <th 
                                        className="py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setMapStatsSort(prev => ({ field: 'totalMatches', direction: prev.field === 'totalMatches' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            Partidas (PJ)
                                            <ArrowUpDown size={12} className={mapStatsSort.field === 'totalMatches' ? 'text-yellow-500' : 'text-gray-600'} />
                                        </div>
                                    </th>
                                    <th 
                                        className="py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setMapStatsSort(prev => ({ field: 'totalKills', direction: prev.field === 'totalKills' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            Total Kills
                                            <ArrowUpDown size={12} className={mapStatsSort.field === 'totalKills' ? 'text-yellow-500' : 'text-gray-600'} />
                                        </div>
                                    </th>
                                    <th 
                                        className="py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors"
                                        onClick={() => setMapStatsSort(prev => ({ field: 'avgKillsPerMatch', direction: prev.field === 'avgKillsPerMatch' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                                    >
                                        <div className="flex items-center justify-center gap-1.5">
                                            Média / Partida
                                            <ArrowUpDown size={12} className={mapStatsSort.field === 'avgKillsPerMatch' ? 'text-yellow-500' : 'text-gray-600'} />
                                        </div>
                                    </th>
                                    <th className="py-3.5 px-4 text-center">% do Total</th>
                                    <th className="py-3.5 px-4 text-center">Recorde (1 Queda)</th>
                                    <th className="py-3.5 px-4">Time MVP</th>
                                    <th className="py-3.5 px-4">Jogador MVP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs font-medium">
                                {filteredAndSortedMaps.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-gray-500 italic font-medium">
                                            Nenhum dado de mapa encontrado para os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedMaps.map((m, idx) => {
                                        const mapImg = MAPS_CONFIG.find(item => item.name.toLowerCase() === m.mapName.toLowerCase())?.url;
                                        const percentOfTotal = mapStatsData.kpis.totalKillsAllMaps > 0 
                                            ? ((m.totalKills / mapStatsData.kpis.totalKillsAllMaps) * 100).toFixed(1)
                                            : '0.0';
                                        const teamLogo = m.topTeam ? findTeamLogo(m.topTeam.name, data?.teamsReference) : null;

                                        return (
                                            <tr key={m.mapName} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-black text-gray-400">
                                                    {idx === 0 ? (
                                                        <span className="w-6 h-6 rounded-full bg-yellow-500 text-black font-black text-[10px] inline-flex items-center justify-center shadow-lg shadow-yellow-500/30">1</span>
                                                    ) : idx === 1 ? (
                                                        <span className="w-6 h-6 rounded-full bg-gray-300 text-black font-black text-[10px] inline-flex items-center justify-center">2</span>
                                                    ) : idx === 2 ? (
                                                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-[10px] inline-flex items-center justify-center">3</span>
                                                    ) : (
                                                        `#${idx + 1}`
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-black uppercase text-white tracking-wider">
                                                    <div className="flex items-center gap-3">
                                                        {mapImg ? (
                                                            <img src={mapImg} alt={m.mapName} className="w-9 h-9 rounded-lg object-cover border border-white/10 shadow" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center text-yellow-500 font-bold">
                                                                <MapPin size={16} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-white text-sm font-black italic">{m.mapName}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-gray-300">{m.totalMatches} PJ</td>
                                                <td className="py-3.5 px-4 text-center font-black text-yellow-400 text-sm">
                                                    {m.totalKills.toLocaleString('pt-BR')} Kills
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-black">
                                                        {m.avgKillsPerMatch.toFixed(1)} / partida
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-[11px] font-bold text-gray-300">{percentOfTotal}%</span>
                                                        <div className="w-20 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${Math.min(100, parseFloat(percentOfTotal))}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-red-400">
                                                    {m.maxKillsInMatch} Kills
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {m.topTeam ? (
                                                        <div className="flex items-center gap-2">
                                                            {teamLogo ? (
                                                                <img src={teamLogo} alt={m.topTeam.name} className="w-5 h-5 object-contain" />
                                                            ) : (
                                                                <Users size={14} className="text-gray-400" />
                                                            )}
                                                            <span className="font-bold text-gray-200 text-xs truncate max-w-[120px]">{m.topTeam.name}</span>
                                                            <span className="text-[10px] text-yellow-500 font-black">({m.topTeam.kills})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic text-[10px]">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {m.topPlayer ? (
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className="text-yellow-400" />
                                                            <span className="font-bold text-gray-200 text-xs truncate max-w-[120px]">{m.topPlayer.name}</span>
                                                            <span className="text-[10px] text-yellow-500 font-black">({m.topPlayer.kills})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic text-[10px]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SEÇÃO 2: ABATES POR RODADA DE CADA MAPA E MÉDIAS */}
                <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-800">
                        <div>
                            <h2 className="text-lg font-black uppercase italic tracking-wider text-white flex items-center gap-2">
                                <Swords size={18} className="text-yellow-500" />
                                Abates por Rodada de Cada Mapa e Médias
                            </h2>
                            <p className="text-xs text-gray-400 font-medium">Detalhamento por rodada do volume de abates e médias por partida em cada mapa.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Map Filter Dropdown */}
                            <select
                                value={selectedMapFilter}
                                onChange={(e) => setSelectedMapFilter(e.target.value)}
                                className="bg-black/80 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-yellow-500/50"
                            >
                                <option value="ALL">Todos os Mapas</option>
                                {mapStatsData.mapList.map(m => (
                                    <option key={m.mapName} value={m.mapName}>{m.mapName}</option>
                                ))}
                            </select>

                            {/* View Mode Switcher */}
                            <div className="flex bg-black/80 p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setMapRoundViewMode('matrix')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        mapRoundViewMode === 'matrix' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <LayoutGrid size={14} /> Matriz (Tabela)
                                </button>
                                <button
                                    onClick={() => setMapRoundViewMode('cards')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        mapRoundViewMode === 'cards' ? 'bg-yellow-500 text-black shadow' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <ListOrdered size={14} /> Cards Detalhados
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MATRIX VIEW */}
                    {mapRoundViewMode === 'matrix' && (
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                                        <th className="py-3.5 px-4">Mapa</th>
                                        {mapStatsData.roundsList.map(rd => (
                                            <th key={rd} className="py-3.5 px-3 text-center min-w-[100px]">{rd}</th>
                                        ))}
                                        <th className="py-3.5 px-4 text-center bg-yellow-500/10 text-yellow-400">Total Kills</th>
                                        <th className="py-3.5 px-4 text-center bg-yellow-500/10 text-yellow-400">Média / Partida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs font-medium">
                                    {filteredAndSortedMaps.length === 0 ? (
                                        <tr>
                                            <td colSpan={mapStatsData.roundsList.length + 3} className="py-8 text-center text-gray-500 italic">
                                                Nenhum mapa disponível.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAndSortedMaps.map(m => {
                                            return (
                                                <tr key={m.mapName} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3.5 px-4 font-black uppercase text-white tracking-wider">
                                                        {m.mapName}
                                                    </td>

                                                    {mapStatsData.roundsList.map(rd => {
                                                        const rInfo = m.rounds[rd];
                                                        if (!rInfo || rInfo.totalKills === 0) {
                                                            return (
                                                                <td key={rd} className="py-3.5 px-3 text-center text-gray-600 font-bold">
                                                                    -
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td key={rd} className="py-3 px-2 text-center">
                                                                <div className="flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-xl py-1.5 px-2">
                                                                    <span className="font-black text-yellow-400 text-xs">{rInfo.totalKills} Kills</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                                        Média: {rInfo.avgKillsPerMatch.toFixed(1)}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-500">
                                                                        ({rInfo.matchesCount} {rInfo.matchesCount === 1 ? 'jogo' : 'jogos'})
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="py-3.5 px-4 text-center font-black text-yellow-400 text-sm bg-yellow-500/5">
                                                        {m.totalKills}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-black text-white text-xs bg-yellow-500/5">
                                                        {m.avgKillsPerMatch.toFixed(1)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CARDS VIEW */}
                    {mapRoundViewMode === 'cards' && (
                        <div className="space-y-8">
                            {filteredAndSortedMaps.map(m => {
                                const mapImg = MAPS_CONFIG.find(item => item.name.toLowerCase() === m.mapName.toLowerCase())?.url;

                                return (
                                    <div key={m.mapName} className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                                        {/* Map Header */}
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <div className="flex items-center gap-3">
                                                {mapImg ? (
                                                    <img src={mapImg} alt={m.mapName} className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center text-yellow-500 font-bold">
                                                        <MapPin size={18} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-base font-black text-white uppercase italic tracking-wider">{m.mapName}</h3>
                                                    <div className="text-xs text-gray-400 flex items-center gap-3 font-medium">
                                                        <span>Total: <strong className="text-yellow-400">{m.totalKills} Kills</strong></span>
                                                        <span>•</span>
                                                        <span>Média: <strong className="text-white">{m.avgKillsPerMatch.toFixed(1)} / partida</strong></span>
                                                        <span>•</span>
                                                        <span>Partidas: <strong className="text-gray-300">{m.totalMatches} PJ</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rounds Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {mapStatsData.roundsList.map(rd => {
                                                const rInfo = m.rounds[rd];

                                                if (!rInfo) {
                                                    return (
                                                        <div key={rd} className="bg-white/5 border border-white/5 rounded-xl p-3 opacity-40">
                                                            <div className="text-xs font-black text-gray-400 uppercase">{rd}</div>
                                                            <div className="text-[11px] text-gray-500 italic mt-2">Sem partidas registradas neste mapa</div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={rd} className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 hover:border-yellow-500/30 rounded-xl p-4 space-y-3 transition-all">
                                                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                                            <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">{rd}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                                                {rInfo.matchesCount} {rInfo.matchesCount === 1 ? 'partida' : 'partidas'}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-400 font-medium">Total de Abates:</span>
                                                                <span className="font-black text-yellow-400 text-sm">{rInfo.totalKills} Kills</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-400 font-medium">Média / Partida:</span>
                                                                <span className="font-bold text-white">{rInfo.avgKillsPerMatch.toFixed(1)}</span>
                                                            </div>
                                                            {rInfo.falls && rInfo.falls.length > 0 && (
                                                                <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                                    <span>Quedas:</span>
                                                                    <span className="font-bold text-gray-300">{rInfo.falls.join(', ')}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Top Performers in this Round for this Map */}
                                                        {(rInfo.topTeam || rInfo.topPlayer) && (
                                                            <div className="pt-2 border-t border-white/10 space-y-1">
                                                                {rInfo.topTeam && (
                                                                    <div className="flex items-center justify-between text-[10px]">
                                                                        <span className="text-gray-400 font-bold flex items-center gap-1">
                                                                            <Users size={10} className="text-yellow-500" /> Time MVP:
                                                                        </span>
                                                                        <span className="font-bold text-gray-200 truncate max-w-[100px]">
                                                                            {rInfo.topTeam.name} ({rInfo.topTeam.kills})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {rInfo.topPlayer && (
                                                                    <div className="flex items-center justify-between text-[10px]">
                                                                        <span className="text-gray-400 font-bold flex items-center gap-1">
                                                                            <User size={10} className="text-yellow-500" /> Player MVP:
                                                                        </span>
                                                                        <span className="font-bold text-gray-200 truncate max-w-[100px]">
                                                                            {rInfo.topPlayer.name} ({rInfo.topPlayer.kills})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        ) : activeTab === 'mapRanking' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-black p-6 rounded-3xl border border-blue-500/30 backdrop-blur-md shadow-2xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-inner">
                                <MapIcon size={26} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-2">
                                    Estatísticas de Equipes por Mapa
                                </h1>
                                <p className="text-xs text-gray-400 font-medium tracking-wide mt-1">
                                    Acompanhe o desempenho, pontuação, abates, médias por partida e eficiência de cada equipe em cada território do campeonato.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-black/60 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
                            <Layers size={18} className="text-yellow-500" />
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Mapas Analisados</div>
                                <div className="text-base font-black text-white">{mapRankings.length} Territórios</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls & Filters Bar */}
                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xl">
                    {/* Map Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                        <button
                            onClick={() => setSelectedMapFilter('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
                                selectedMapFilter === 'ALL'
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Layers size={14} /> Todos os Mapas
                        </button>
                        {mapRankings.map(m => {
                            const config = MAPS_CONFIG.find(mc => normalize(mc.name) === normalize(m.mapName));
                            return (
                                <button
                                    key={m.mapName}
                                    onClick={() => setSelectedMapFilter(m.mapName)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 flex-shrink-0 ${
                                        selectedMapFilter === m.mapName
                                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {config?.url && (
                                        <img src={config.url} alt={m.mapName} className="w-4 h-4 rounded-full object-cover" />
                                    )}
                                    {m.mapName}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 md:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar equipe..."
                                value={mapStatsSearch}
                                onChange={(e) => setMapStatsSearch(e.target.value)}
                                className="w-full bg-black/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                            />
                        </div>

                        <button
                            onClick={() => setShowAllTeamsMap(prev => !prev)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                                showAllTeamsMap
                                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                            }`}
                        >
                            <Users size={14} /> {showAllTeamsMap ? 'Mostrar Top 10' : 'Mostrar Todos os Times'}
                        </button>
                    </div>
                </div>

                {/* Map Grid / Display */}
                <div className="space-y-8">
                    {mapRankings
                        .filter(m => selectedMapFilter === 'ALL' || normalize(m.mapName) === normalize(selectedMapFilter))
                        .map((m) => {
                            const config = MAPS_CONFIG.find(mc => normalize(mc.name) === normalize(m.mapName));
                            const mapImg = config?.url || m.mapImg;

                            // Filter teams by search input
                            const filteredMapStats = m.stats.filter(s => 
                                !mapStatsSearch || normalize(s.name).includes(normalize(mapStatsSearch))
                            );

                            const displayStats = showAllTeamsMap ? filteredMapStats : filteredMapStats.slice(0, 10);

                            return (
                                <div key={m.mapName} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl space-y-2">
                                    {/* Map Card Header */}
                                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/80 via-black to-gray-950 p-6 border-b border-gray-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                        {mapImg && (
                                            <div 
                                                className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none"
                                                style={{ backgroundImage: `url(${mapImg})` }}
                                            />
                                        )}

                                        <div className="relative z-10 flex items-center gap-4">
                                            {mapImg ? (
                                                <img src={mapImg} alt={m.mapName} className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-500/40 shadow-xl" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl">
                                                    <MapIcon size={32} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-wider">{m.mapName}</h2>
                                                    <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                                        {m.totalMatches} Partidas
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-400">
                                                    <span>Total Kills: <strong className="text-red-400">{m.totalKills.toLocaleString('pt-BR')}</strong></span>
                                                    <span>•</span>
                                                    <span>Total Pontos: <strong className="text-yellow-400">{m.totalPoints.toLocaleString('pt-BR')}</strong></span>
                                                    <span>•</span>
                                                    <span>Booyahs: <strong className="text-emerald-400">{m.totalBooyahs}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Highlights for this Map */}
                                        <div className="relative z-10 flex flex-wrap items-center gap-3">
                                            {m.topTeamPts && (
                                                <div className="bg-black/60 border border-yellow-500/30 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                                                    <Trophy size={20} className="text-yellow-500" />
                                                    <div>
                                                        <span className="block text-[9px] text-gray-400 font-black uppercase tracking-wider">Líder do Mapa</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {m.topTeamPts.image && (
                                                                <img src={m.topTeamPts.image} alt={m.topTeamPts.name} className="w-4 h-4 object-contain" />
                                                            )}
                                                            <span className="text-xs font-black text-white truncate max-w-[100px]">{m.topTeamPts.name}</span>
                                                            <span className="text-xs font-black text-yellow-400">({m.topTeamPts.pts} pts)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {m.topPlayer && m.topPlayer.name && (
                                                <div className="bg-black/60 border border-red-500/30 p-3 rounded-2xl flex items-center gap-3 shadow-lg">
                                                    <Flame size={20} className="text-red-500" />
                                                    <div>
                                                        <span className="block text-[9px] text-gray-400 font-black uppercase tracking-wider">MVP do Mapa</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <User size={14} className="text-red-400" />
                                                            <span className="text-xs font-black text-white truncate max-w-[100px]">{m.topPlayer.name}</span>
                                                            <span className="text-xs font-black text-red-400">({m.topPlayer.kills} K)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ranking Table */}
                                    <div className="p-4 overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead className="bg-black/40 text-[9px] text-gray-400 uppercase font-black tracking-widest border-b border-gray-800">
                                                <tr>
                                                    <th className="px-3 py-3 w-10 text-center">#</th>
                                                    <th 
                                                        className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('name')}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            Equipe
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'name' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('s')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            S
                                                            <ArrowUpDown size={12} className={sortConfig.key === 's' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('pts')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            PTS
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'pts' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('b')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            B
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'b' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('abts')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            Kills
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'abts' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('avgPts')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            AVG PTS
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'avgPts' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('avgAbts')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            AVG K
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'avgAbts' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th 
                                                        className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                                                        onClick={() => toggleSort('avgPtsc')}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            AVG POS
                                                            <ArrowUpDown size={12} className={sortConfig.key === 'avgPtsc' ? 'text-yellow-500' : 'text-gray-600'} />
                                                        </div>
                                                    </th>
                                                    <th className="px-3 py-3 text-center">
                                                        % Booyah
                                                    </th>
                                                    <th className="px-3 py-3 text-center w-28">
                                                        Ação
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                                                {displayStats.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={11} className="py-8 text-center text-gray-500 italic">
                                                            Nenhuma equipe encontrada para os filtros aplicados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    displayStats.map((team, tIdx) => {
                                                        const booyahRate = team.s > 0 ? ((team.b / team.s) * 100).toFixed(1) : '0.0';

                                                        return (
                                                            <tr 
                                                                key={tIdx} 
                                                                className="hover:bg-white/5 transition-colors group"
                                                            >
                                                                <td className="px-3 py-3 text-center font-black">
                                                                    {tIdx === 0 ? (
                                                                        <span className="w-6 h-6 rounded-full bg-yellow-500 text-black font-black text-[10px] inline-flex items-center justify-center shadow-lg shadow-yellow-500/30">1</span>
                                                                    ) : tIdx === 1 ? (
                                                                        <span className="w-6 h-6 rounded-full bg-gray-300 text-black font-black text-[10px] inline-flex items-center justify-center">2</span>
                                                                    ) : tIdx === 2 ? (
                                                                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-[10px] inline-flex items-center justify-center">3</span>
                                                                    ) : (
                                                                        <span className="text-gray-500 font-mono text-xs">#{tIdx + 1}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <div 
                                                                        className="flex items-center gap-3 cursor-pointer"
                                                                        onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}
                                                                    >
                                                                        <div className="w-7 h-7 bg-black rounded-lg border border-gray-800 p-0.5 flex-shrink-0 flex items-center justify-center">
                                                                            {team.image ? (
                                                                                <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                                            ) : (
                                                                                <Shield size={14} className="text-gray-600" />
                                                                            )}
                                                                        </div>
                                                                        <span className="font-black text-white uppercase italic text-xs tracking-wider group-hover:text-yellow-400 transition-colors">
                                                                            {team.name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-3 text-center font-bold text-gray-400">{team.s}</td>
                                                                <td className="px-3 py-3 text-center font-black text-yellow-400 text-sm">{team.pts}</td>
                                                                <td className="px-3 py-3 text-center font-bold text-orange-400">{team.b}</td>
                                                                <td className="px-3 py-3 text-center font-black text-red-400">{team.abts}</td>
                                                                <td className="px-3 py-3 text-center font-bold text-yellow-300">{team.avgPts}</td>
                                                                <td className="px-3 py-3 text-center font-bold text-red-300">{team.avgAbts}</td>
                                                                <td className="px-3 py-3 text-center font-bold text-blue-300">{team.avgPtsc}</td>
                                                                <td className="px-3 py-3 text-center font-bold text-emerald-400">{booyahRate}%</td>
                                                                <td className="px-3 py-3 text-center">
                                                                    <button
                                                                        onClick={() => {
                                                                            setFilters(prev => ({...prev, team: [team.name]}));
                                                                            setActiveTab('gallery');
                                                                        }}
                                                                        className="bg-white/5 hover:bg-yellow-500 hover:text-black text-gray-300 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-white/10"
                                                                    >
                                                                        Ver Equipe
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer count toggle if > 10 */}
                                    {filteredMapStats.length > 10 && !showAllTeamsMap && (
                                        <div className="p-3 bg-black/40 border-t border-gray-800/50 text-center">
                                            <button
                                                onClick={() => setShowAllTeamsMap(true)}
                                                className="text-xs font-black text-yellow-500 hover:text-yellow-400 uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto"
                                            >
                                                Ver mais {filteredMapStats.length - 10} equipes neste mapa ↓
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        ) : activeTab === 'mapAnalysis' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(dropNum => {
                        const dropStr = dropNum.toString();
                        const dropData: Record<string, number> = mapAnalysisData.analysis[dropStr] || {};
                        const total: number = mapAnalysisData.totalsPerDrop[dropStr] || 0;
                        
                        // Sort maps by frequency
                        const sortedMaps = Object.entries(dropData).sort((a, b) => (b[1] as number) - (a[1] as number));

                        return (
                            <div key={dropNum} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                                <div className="bg-gradient-to-r from-yellow-500/10 to-transparent p-5 border-b border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-yellow-500 text-black rounded-lg flex items-center justify-center font-black italic">
                                            {dropNum}º
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Queda</h3>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{total} SALAS TOTAIS</span>
                                </div>
                                <div className="p-6 space-y-4 flex-grow">
                                    {sortedMaps.length > 0 ? (
                                        sortedMaps.map(([mapName, count]) => {
                                            const percentage = total > 0 ? (((count as number) / total) * 100).toFixed(1) : "0.0";
                                            return (
                                                <div key={mapName} className="space-y-2">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-black text-white uppercase italic">{mapName}</span>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-yellow-500 font-black">{percentage}%</span>
                                                            <span className="text-[9px] text-gray-500 font-bold ml-2 uppercase">({count}x)</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-gray-600 text-[10px] font-bold uppercase tracking-widest italic">
                                            Sem dados para esta queda
                                        </div>
                                    )}
                                </div>
                                {sortedMaps.length > 0 && (
                                    <div className="p-4 bg-black/40 border-t border-gray-800/50">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <TrendingUp size={12} className="text-green-500" />
                                            Chance para próxima: 
                                            <span className="text-white ml-auto">
                                                {sortedMaps[0][0]} ({total > 0 ? (((sortedMaps[0][1] as number) / total) * 100).toFixed(0) : "0"}%)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : activeTab === 'safeAnalysis' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                {selectedSafeLocation ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setSelectedSafeLocation(null)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <h3 className="text-white font-black text-lg uppercase italic tracking-widest flex items-center gap-2">
                                        <MapPin size={20} className="text-yellow-500" /> {selectedSafeLocation.local}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Mapa: {selectedSafeLocation.mapName}</p>
                                </div>
                            </div>
                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest px-3 py-1 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                Classificação neste fechamento
                            </div>
                        </div>

                        {safeRankingStats.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { title: 'Top Pontos', stat: [...safeRankingStats].sort((a,b)=>b.pts-a.pts).slice(0,3), key: 'pts' },
                                    { title: 'Top Abates', stat: [...safeRankingStats].sort((a,b)=>b.abts-a.abts).slice(0,3), key: 'abts' },
                                    { title: 'Top Booyahs', stat: [...safeRankingStats].sort((a,b)=>b.b-a.b).slice(0,3), key: 'b' },
                                    { title: 'Top Pts Colocação', stat: [...safeRankingStats].sort((a,b)=>b.ptsc-a.ptsc).slice(0,3), key: 'ptsc' },
                                    { title: 'Mais Partidas', stat: [...safeRankingStats].sort((a,b)=>b.s-a.s).slice(0,3), key: 's' }
                                ].map(topList => (
                                    <div key={topList.title} className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 shadow-xl space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">{topList.title}</h4>
                                        <div className="space-y-2">
                                            {topList.stat.map((t, i) => {
                                                let val = t[topList.key as keyof typeof t];
                                                if (topList.key === 'b' && val === 0) return null;
                                                return (
                                                    <div key={t.name} className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-300 font-bold truncate max-w-[80px]">{i+1}. {t.name}</span>
                                                        <span className="text-yellow-500 font-black">{val}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-800 shadow-xl overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="bg-black/60 text-[10px] text-gray-500 uppercase tracking-widest font-black italic select-none">
                                    <tr>
                                        <th className="p-4 w-16 text-center">Pos</th>
                                        <th className="p-4">Equipe</th>
                                        {[
                                            { key: 'pts', label: 'PTS' },
                                            { key: 'b', label: 'BOOYAH' },
                                            { key: 'abts', label: 'ABTS' },
                                            { key: 'ptsc', label: 'PTSC' },
                                            { key: 's', label: 'Partidas' },
                                            { key: 'mediaPts', label: 'Média PTS' },
                                            { key: 'mediaAbts', label: 'Média ABTS' },
                                            { key: 'mediaPtsc', label: 'Média PTSC' }
                                        ].map(col => (
                                            <th 
                                                key={col.key}
                                                className="p-4 text-center cursor-pointer hover:bg-white/5 transition-colors group"
                                                onClick={() => setSafeSortConfig(prev => ({ 
                                                    key: col.key, 
                                                    direction: prev.key === col.key && prev.direction === 'desc' ? 'asc' : 'desc' 
                                                }))}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className={safeSortConfig.key === col.key ? 'text-yellow-500' : ''}>{col.label}</span>
                                                    <ArrowDown 
                                                        size={12} 
                                                        className={`transition-all ${safeSortConfig.key === col.key ? 'text-yellow-500 opacity-100' : 'opacity-0 group-hover:opacity-50'} ${safeSortConfig.key === col.key && safeSortConfig.direction === 'asc' ? 'rotate-180' : ''}`}
                                                    />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {safeRankingStats.map((team, idx) => {
                                        const mediaPts = team.s > 0 ? (team.pts / team.s).toFixed(1) : "0.0";
                                        const mediaAbts = team.s > 0 ? (team.abts / team.s).toFixed(1) : "0.0";
                                        const mediaPtsc = team.s > 0 ? (team.ptsc / team.s).toFixed(1) : "0.0";
                                        
                                        return (
                                            <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 text-center">
                                                    <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] font-black italic ${
                                                        idx === 0 && safeSortConfig.key === 'pts' ? 'bg-yellow-500 text-black' :
                                                        idx === 1 && safeSortConfig.key === 'pts' ? 'bg-gray-300 text-black' :
                                                        idx === 2 && safeSortConfig.key === 'pts' ? 'bg-amber-600 text-white' :
                                                        'bg-black text-gray-500 border border-white/10'
                                                    }`}>
                                                        {idx + 1}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {team.image ? (
                                                            <img src={team.image} alt={team.name} className="w-8 h-8 rounded-lg object-contain bg-black border border-white/5" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-black border border-white/5 flex items-center justify-center">
                                                                <Shield size={14} className="text-gray-700" />
                                                            </div>
                                                        )}
                                                        <span className="text-white font-black italic uppercase tracking-wider text-sm group-hover:text-yellow-500 transition-colors">
                                                            {team.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-yellow-500 font-black italic text-lg">{team.pts}</span>
                                                </td>
                                                <td className="p-4 text-center text-orange-400 font-bold">{team.b}</td>
                                                <td className="p-4 text-center text-red-400 font-bold">{team.abts}</td>
                                                <td className="p-4 text-center text-blue-400 font-bold">{team.ptsc}</td>
                                                <td className="p-4 text-center text-gray-400 font-bold">{team.s}</td>
                                                <td className="p-4 text-center text-yellow-500/80 font-bold">{mediaPts}</td>
                                                <td className="p-4 text-center text-red-400/80 font-bold">{mediaAbts}</td>
                                                <td className="p-4 text-center text-blue-400/80 font-bold">{mediaPtsc}</td>
                                            </tr>
                                        );
                                    })}
                                    {safeRankingStats.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest italic">
                                                Nenhum time pontuou nesta safe.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(safeAnalysisData).map(([mapName, entry]) => {
                            const data = entry as { totals: number, locals: Record<string, number> };
                            const sortedLocals = Object.entries(data.locals).sort((a, b) => (b[1] as number) - (a[1] as number));
                            
                            return (
                                <div key={mapName} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-xl flex flex-col">
                                    <div className="bg-gradient-to-r from-red-500/10 to-transparent p-5 border-b border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center">
                                                <Target size={18} />
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{mapName}</h3>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase">{data.totals} FECHAMENTOS</span>
                                    </div>
                                    <div className="p-6 space-y-4 flex-grow">
                                        {sortedLocals.map(([local, count]) => {
                                            const percentage = data.totals > 0 ? (((count as number) / data.totals) * 100).toFixed(1) : "0.0";
                                            return (
                                                <div 
                                                    key={local} 
                                                    onClick={() => setSelectedSafeLocation({ mapName, local })}
                                                    className="space-y-2 cursor-pointer group p-2 -mx-2 rounded-xl hover:bg-white/5 transition-all"
                                                >
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-xs font-black text-white uppercase italic group-hover:text-yellow-500 transition-colors">{local}</span>
                                                        <div className="text-right flex items-center gap-2">
                                                            <span className="text-[10px] text-red-500 font-black">{percentage}%</span>
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase">({count}x)</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full group-hover:from-yellow-600 group-hover:to-yellow-400 transition-colors" 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="p-4 bg-black/40 border-t border-gray-800/50">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <MapPin size={12} className="text-red-500" />
                                            Hot Zone: 
                                            <span className="text-white ml-auto italic">
                                                {sortedLocals[0][0]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(safeAnalysisData).length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-gray-500 font-black uppercase tracking-widest italic animate-pulse">
                                    Nenhum dado de fechamento de safe encontrado...
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        ) : activeTab === 'killfeedPhases' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800 shadow-xl">
                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest mb-6 flex items-center gap-2">
                        <Crosshair size={20} className="text-emerald-500" />
                        AGRESSIVIDADE POR FASE DO JOGO (TODAS AS EQUIPES)
                    </h3>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                            <thead className="bg-black/80 text-[10px] text-gray-500 uppercase font-black tracking-widest border-b-2 border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">#</th>
                                    <th className="px-6 py-4">Equipe</th>
                                    <th className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-emerald-400">EARLY GAME</span>
                                            <span className="text-[8px] text-gray-600">(SAFES 1-2)</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-yellow-400">MID GAME</span>
                                            <span className="text-[8px] text-gray-600">(SAFES 3-4)</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-red-400">LATE GAME</span>
                                            <span className="text-[8px] text-gray-600">(SAFES 5+)</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-400">NÃO ID. / OUTRO</span>
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-center">TOTAL KILLS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                                {allTeamsPhaseStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                                            Nenhum dado de kill feed encontrado para as equipes filtradas.
                                        </td>
                                    </tr>
                                ) : (
                                    allTeamsPhaseStats.map((team, tIdx) => (
                                        <tr key={team.name} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-center text-gray-500 font-mono text-[10px]">
                                                {tIdx + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div 
                                                    className="flex items-center gap-3 cursor-pointer"
                                                    onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}
                                                >
                                                    <div className="w-8 h-8 bg-black rounded-lg border border-gray-800 p-1 flex-shrink-0 flex items-center justify-center shadow-lg group-hover:border-emerald-500/50 transition-colors">
                                                        {team.image ? (
                                                            <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Shield size={16} className="text-gray-600" />
                                                        )}
                                                    </div>
                                                    <span className="font-black text-white uppercase italic tracking-wider group-hover:text-emerald-400 transition-colors">
                                                        {team.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-emerald-400 text-sm">{team.earlyKills}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold">{team.earlyPct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-yellow-400 text-sm">{team.midKills}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold">{team.midPct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-black text-red-400 text-sm">{team.lateKills}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold">{team.latePct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-500">
                                                {team.otherKills > 0 ? team.otherKills : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-white text-base">
                                                {team.totalPhaseKills}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : activeTab === 'comparison' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                     {/* Team A Selection */}
                     <div className="w-full md:w-80 p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">Equipe A</label>
                         <select 
                             value={filters.team[0] || ''} 
                             onChange={(e) => setFilters(prev => ({...prev, team: e.target.value ? [e.target.value] : []}))}
                             className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-yellow-500 transition-all"
                         >
                             <option value="" disabled>Selecione...</option>
                             {filterOptions.teams.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     </div>

                     <div className="relative group">
                         <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/30 transition-all animate-pulse" />
                         <div className="relative w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black italic shadow-2xl z-10 border-4 border-black text-xl">VS</div>
                     </div>

                     {/* Team B Selection */}
                     <div className="w-full md:w-80 p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                         <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">Equipe B</label>
                         <select 
                             value={compareTeamB || ''} 
                             onChange={(e) => setCompareTeamB(e.target.value || null)}
                             className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-xs font-black uppercase tracking-widest outline-none focus:border-yellow-500 transition-all"
                         >
                             <option value="" disabled>Selecione...</option>
                             {filterOptions.teams.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     </div>
                </div>

                {filters.team[0] && compareTeamB ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {[filters.team[0], compareTeamB].map((teamName, idx) => {
                                const stats = filteredTeamStats.find(s => s.name === teamName);
                                if (!stats) return null;
                                return (
                                    <div key={teamName} className={`bg-[#1a1a1a] rounded-[40px] p-8 border ${idx === 0 ? 'border-yellow-500/20' : 'border-blue-500/20'} shadow-2xl relative overflow-hidden group`}>
                                        <div className={`absolute top-0 right-0 w-64 h-64 ${idx === 0 ? 'bg-yellow-500/5' : 'bg-blue-500/5'} blur-[100px] -mr-32 -mt-32 rounded-full`} />
                                        
                                        <div className="flex items-center gap-6 mb-12 relative">
                                            <div className={`w-24 h-24 bg-black rounded-3xl flex items-center justify-center border ${idx === 0 ? 'border-yellow-500/40' : 'border-blue-500/40'} p-4 shadow-2xl group-hover:scale-105 transition-transform`}>
                                                {stats.image ? <img src={stats.image} alt={stats.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-800" size={40} />}
                                            </div>
                                            <div>
                                                <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter mb-2">{stats.name}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-4 py-1.5 rounded-full ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'} text-[10px] font-black uppercase tracking-widest`}>
                                                        {stats.grupo || 'SEM GRUPO'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stats.s} QUEDAS JOGADAS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">PTS TOTAL</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>{stats.pts}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">BOOYAHS</span>
                                                <span className={`text-2xl font-black italic ${idx === 0 ? 'text-orange-500' : 'text-blue-400'}`}>{stats.b}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">KILLS</span>
                                                <span className="text-2xl font-black italic text-red-500">{stats.abts}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2">
                                                <span className="text-gray-500">Média Pts/Queda</span>
                                                <span className="text-white">{stats.avgPts}</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className={`h-full ${idx === 0 ? 'bg-yellow-500' : 'bg-blue-500'} rounded-full`} style={{ width: `${Math.min((stats.avgPts / 20) * 100, 100)}%` }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pt-2">
                                                <span className="text-gray-500">Média Kills/Queda</span>
                                                <span className="text-white">{stats.avgAbts}</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className={`h-full bg-red-500 rounded-full`} style={{ width: `${Math.min((stats.avgAbts / 15) * 100, 100)}%` }} />
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pt-2">
                                                <span className="text-gray-500">% Pontos por Posição</span>
                                                <span className="text-white">{stats.percentPos}%</span>
                                            </div>
                                            <div className="h-2 bg-black rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.percentPos}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Sub-tab Selector inside Comparison Mode */}
                        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 w-fit mx-auto no-print">
                            {[
                                { id: 'all', label: 'Ver Tudo (Sem Abas)', icon: <LayoutList size={14} className={compareSubTab === 'all' ? 'text-black' : 'text-emerald-400'} /> },
                                { id: 'overview', label: 'Resumo Geral', icon: <LayoutGrid size={14} /> },
                                { id: 'combat', label: 'Times & Jogadores (Abates/Mortes)', icon: <Swords size={14} className={compareSubTab === 'combat' ? 'text-black' : 'text-red-500'} /> },
                                { id: 'zeradas', label: 'Quedas Zeradas', icon: <AlertTriangle size={14} className={compareSubTab === 'zeradas' ? 'text-black' : 'text-yellow-500'} /> },
                                { id: 'mapKills', label: 'Abates & MVP por Mapa', icon: <Crown size={14} className={compareSubTab === 'mapKills' ? 'text-black' : 'text-orange-500'} /> },
                                { id: 'safeKills', label: 'Abates por Safe (Kill Feed)', icon: <Crosshair size={14} className={compareSubTab === 'safeKills' ? 'text-black' : 'text-red-400'} /> },
                                { id: 'safes', label: 'Locais de Fechamento', icon: <MapPin size={14} className={compareSubTab === 'safes' ? 'text-black' : 'text-blue-500'} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCompareSubTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        compareSubTab === tab.id
                                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* SUB-TAB: Overview (Existing Map and Metric Table Comparison) */}
                        {(compareSubTab === 'overview' || compareSubTab === 'all') && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-4">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-yellow-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <LayoutGrid size={16} /> Resumo Geral & Territórios
                                        </div>
                                    </div>
                                )}
                                {/* Comparison per Map */}
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center">
                                        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-4" />
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Comparativo por Território</h3>
                                    </div>
                                    
                                    <TeamVsTeamMapCompare
                                        teamA={filters.team[0]}
                                        teamB={compareTeamB}
                                        allDetails={data.details}
                                        allPlayers={data.players}
                                        killFeed={data.killFeed}
                                        playersDimension={data.playersDimension}
                                        teamsReference={data.teamsReference}
                                        weapons={data.weapons}
                                        filters={filters}
                                        onPlayerClick={(pName) => navigate('/players', { state: { player: pName } })}
                                    />
                                </div>

                                {/* Comparison Table for detailed metrics */}
                                <div className="bg-[#1a1a1a] rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl no-print">
                                    <div className="bg-black/40 px-8 py-6 border-b border-gray-800 flex items-center justify-between">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Métricas Diretas</h3>
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <tbody className="divide-y divide-gray-800/30">
                                                {[
                                                    { label: 'Total de Pontos', key: 'pts', color: 'text-yellow-500' },
                                                    { label: 'Média de Pontos', key: 'avgPts', color: 'text-white' },
                                                    { label: 'Total de Booyahs', key: 'b', color: 'text-orange-500' },
                                                    { label: 'Total de Abates', key: 'abts', color: 'text-red-500' },
                                                    { label: 'Média de Abates', key: 'avgAbts', color: 'text-white' },
                                                    { label: 'Média Pts Posição', key: 'avgPtsc', color: 'text-blue-400' },
                                                    { label: '% Abates no Score', key: 'percentAbts', color: 'text-gray-400' },
                                                    { label: '% Posição no Score', key: 'percentPos', color: 'text-gray-400' },
                                                ].map((row, rIdx) => {
                                                    const valA = filteredTeamStats.find(s => s.name === filters.team[0])?.[row.key as keyof TeamStats] as number || 0;
                                                    const valB = filteredTeamStats.find(s => s.name === compareTeamB)?.[row.key as keyof TeamStats] as number || 0;
                                                    const isBetterA = valA > valB;
                                                    const isBetterB = valB > valA;

                                                    return (
                                                        <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className={`px-8 py-4 text-center font-black ${isBetterA ? 'text-yellow-500 scale-110' : 'text-gray-600'} transition-all`}>
                                                                {valA}{(row.key.includes('percent')) ? '%' : ''}
                                                            </td>
                                                            <td className="px-8 py-4 text-center text-[10px] font-black text-white uppercase tracking-widest bg-black/20 italic">
                                                                {row.label}
                                                            </td>
                                                            <td className={`px-8 py-4 text-center font-black ${isBetterB ? 'text-blue-500 scale-110' : 'text-gray-600'} transition-all`}>
                                                                {valB}{(row.key.includes('percent')) ? '%' : ''}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Combat & Rankings Overview inside Overview (only when overview subtab active) */}
                                {compareSubTab === 'overview' && compareCombatData && (
                                    <div className="space-y-6 pt-4">
                                        <div className="flex flex-col items-center">
                                            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-4" />
                                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] italic">Duelo & Ranking de Abates</h3>
                                        </div>
                                        <TeamVsTeamCombatCompare
                                            teamA={filters.team[0]}
                                            teamB={compareTeamB}
                                            combatData={compareCombatData}
                                            onPlayerClick={(pName) => navigate('/players', { state: { player: pName } })}
                                            onTeamClick={(tName) => setFilters(prev => ({ ...prev, team: [tName] }))}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-TAB: Combat & Rankings */}
                        {(compareSubTab === 'combat' || compareSubTab === 'all') && compareCombatData && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <Swords size={16} /> Duelo Direto & Rankings de Abates / Mortes
                                        </div>
                                    </div>
                                )}
                                <TeamVsTeamCombatCompare
                                    teamA={filters.team[0]}
                                    teamB={compareTeamB}
                                    combatData={compareCombatData}
                                    onPlayerClick={(pName) => navigate('/players', { state: { player: pName } })}
                                    onTeamClick={(tName) => setFilters(prev => ({ ...prev, team: [tName] }))}
                                />
                            </div>
                        )}

                        {/* SUB-TAB: Quedas Zeradas */}
                        {(compareSubTab === 'zeradas' || compareSubTab === 'all') && compareZeroStats && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-yellow-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <AlertTriangle size={16} /> Análise de Quedas Zeradas
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Team A Zero Stats */}
                                    <div className="bg-[#1a1a1a] rounded-[40px] p-8 border border-yellow-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full" />
                                        
                                        <h4 className="text-xl font-black italic text-yellow-500 uppercase tracking-tighter mb-6 flex items-center gap-3">
                                            <AlertTriangle size={20} /> {filters.team[0]}
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">TOTAL QUEDAS</span>
                                                <span className="text-2xl font-black italic text-white">{compareZeroStats.teamA.totalMatches}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">% QUEDAS ZERADAS</span>
                                                <span className="text-2xl font-black italic text-red-500">{compareZeroStats.teamA.pctZeroPts}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 border-b border-white/5 pb-2">
                                                <span className="text-gray-500">Apenas 0 Kills</span>
                                                <span className="text-white">{compareZeroStats.teamA.zeroKillsOnly} quedas</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 border-b border-white/5 pb-2">
                                                <span className="text-gray-500">Apenas 0 Pontos de Posição</span>
                                                <span className="text-white">{compareZeroStats.teamA.zeroPointsOnly} quedas</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pb-2">
                                                <span className="text-gray-500">Zero Absoluto (0 Pts & 0 Kills)</span>
                                                <span className="text-red-500">{compareZeroStats.teamA.zeroPointsAndKills} quedas</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team B Zero Stats */}
                                    <div className="bg-[#1a1a1a] rounded-[40px] p-8 border border-blue-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
                                        
                                        <h4 className="text-xl font-black italic text-blue-400 uppercase tracking-tighter mb-6 flex items-center gap-3">
                                            <AlertTriangle size={20} /> {compareTeamB}
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">TOTAL QUEDAS</span>
                                                <span className="text-2xl font-black italic text-white">{compareZeroStats.teamB.totalMatches}</span>
                                            </div>
                                            <div className="bg-black/40 p-4 rounded-3xl border border-white/5 text-center">
                                                <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">% QUEDAS ZERADAS</span>
                                                <span className="text-2xl font-black italic text-red-500">{compareZeroStats.teamB.pctZeroPts}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 border-b border-white/5 pb-2">
                                                <span className="text-gray-500">Apenas 0 Kills</span>
                                                <span className="text-white">{compareZeroStats.teamB.zeroKillsOnly} quedas</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 border-b border-white/5 pb-2">
                                                <span className="text-gray-500">Apenas 0 Pontos de Posição</span>
                                                <span className="text-white">{compareZeroStats.teamB.zeroPointsOnly} quedas</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-2 pb-2">
                                                <span className="text-gray-500">Zero Absoluto (0 Pts & 0 Kills)</span>
                                                <span className="text-red-500">{compareZeroStats.teamB.zeroPointsAndKills} quedas</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB-TAB: Abates & MVPs por Mapa */}
                        {(compareSubTab === 'mapKills' || compareSubTab === 'all') && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-orange-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-orange-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <Crown size={16} /> Abates & MVP por Território
                                        </div>
                                    </div>
                                )}
                                {compareMapKillsAndMvpData.map((m, mIdx) => (
                                    <div key={mIdx} className="bg-[#1a1a1a] rounded-[40px] border border-gray-800 p-8 space-y-6 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full" />
                                        
                                        <div className="border-b border-gray-800 pb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                                    <MapIcon size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-white uppercase italic tracking-widest">{m.mapName}</h4>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Histórico head-to-head por rodada</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-8">
                                                <div className="text-center md:text-right">
                                                    <span className="block text-[8px] text-gray-500 font-bold">TOTAL ABATES ({filters.team[0]})</span>
                                                    <span className="text-lg font-black text-yellow-500 italic">{m.teamA.totalTeamKills} <span className="text-[10px] text-gray-500 font-normal">({m.teamA.avgKillsPerMatch} avg)</span></span>
                                                </div>
                                                <div className="text-center md:text-right">
                                                    <span className="block text-[8px] text-gray-500 font-bold">TOTAL ABATES ({compareTeamB})</span>
                                                    <span className="text-lg font-black text-blue-400 italic">{m.teamB.totalTeamKills} <span className="text-[10px] text-gray-500 font-normal">({m.teamB.avgKillsPerMatch} avg)</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                            {/* Team A Players & MVP */}
                                            <div className="lg:col-span-4 bg-black/20 p-5 rounded-3xl border border-yellow-500/10 space-y-4">
                                                <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest block border-b border-white/5 pb-2">MVP & Elenco ({filters.team[0]})</span>
                                                {m.teamA.mvpPlayer ? (
                                                    <div className="flex items-center gap-4 bg-yellow-500/5 p-3 rounded-2xl border border-yellow-500/20">
                                                        <div className="w-12 h-12 bg-black rounded-xl border border-yellow-500/30 overflow-hidden flex items-center justify-center relative shrink-0">
                                                            {m.teamA.mvpPlayer.playerImg ? (
                                                                <img src={m.teamA.mvpPlayer.playerImg} alt={m.teamA.mvpPlayer.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={20} className="text-yellow-500" />
                                                            )}
                                                            <div className="absolute top-0 left-0 bg-yellow-500 text-black px-1 py-0.5 rounded-br text-[6px] font-black uppercase">MVP</div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-xs font-black text-white truncate">{m.teamA.mvpPlayer.name}</span>
                                                            <span className="block text-[8px] text-gray-500 font-bold uppercase">{m.teamA.mvpPlayer.kills} kills ({m.teamA.mvpPlayer.avgKills} avg)</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600 italic block">Nenhum registro de jogador</span>
                                                )}
                                                <div className="space-y-2">
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Lista de Jogadores</span>
                                                    {m.teamA.playerList.slice(0, 5).map((p, pIdx) => (
                                                        <div key={pIdx} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400 font-bold truncate max-w-[120px]">{p.name}</span>
                                                            <span className="text-white font-black">{p.kills} <span className="text-[8px] text-gray-600">({p.avgKills})</span></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Round comparison list */}
                                            <div className="lg:col-span-4 bg-black/40 p-5 rounded-3xl border border-white/5 space-y-4">
                                                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest block border-b border-white/5 pb-2 text-center">Confronto por Rodada</span>
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const allRds = Array.from(new Set([
                                                            ...m.teamA.roundsList.map(r => r.rd),
                                                            ...m.teamB.roundsList.map(r => r.rd)
                                                        ])).sort((x, y) => {
                                                            const numX = parseInt(x.replace(/\D/g, '')) || 0;
                                                            const numY = parseInt(y.replace(/\D/g, '')) || 0;
                                                            if (numX !== numY) return numX - numY;
                                                            return x.localeCompare(y);
                                                        });

                                                        if (allRds.length === 0) {
                                                            return <span className="text-[10px] text-gray-600 italic block text-center py-4">Sem dados por rodada</span>;
                                                        }

                                                        return allRds.map(rd => {
                                                            const rdA = m.teamA.roundsList.find(r => r.rd === rd);
                                                            const rdB = m.teamB.roundsList.find(r => r.rd === rd);
                                                            const killsA = rdA ? rdA.totalKills : 0;
                                                            const killsB = rdB ? rdB.totalKills : 0;
                                                            
                                                            const isGreaterA = killsA > killsB;
                                                            const isGreaterB = killsB > killsA;

                                                            return (
                                                                <div key={rd} className="flex justify-between items-center text-xs">
                                                                    <span className={`w-8 text-left font-black ${isGreaterA ? 'text-yellow-500 scale-105 font-extrabold' : 'text-gray-500'}`}>{killsA}</span>
                                                                    <span className="text-[8px] text-gray-600 font-black uppercase bg-black/50 px-2 py-1 rounded-md border border-white/5 min-w-[50px] text-center">{rd}</span>
                                                                    <span className={`w-8 text-right font-black ${isGreaterB ? 'text-blue-400 scale-105 font-extrabold' : 'text-gray-500'}`}>{killsB}</span>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Team B Players & MVP */}
                                            <div className="lg:col-span-4 bg-black/20 p-5 rounded-3xl border border-blue-500/10 space-y-4">
                                                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest block border-b border-white/5 pb-2">MVP & Elenco ({compareTeamB})</span>
                                                {m.teamB.mvpPlayer ? (
                                                    <div className="flex items-center gap-4 bg-blue-500/5 p-3 rounded-2xl border border-blue-500/20">
                                                        <div className="w-12 h-12 bg-black rounded-xl border border-blue-500/30 overflow-hidden flex items-center justify-center relative shrink-0">
                                                            {m.teamB.mvpPlayer.playerImg ? (
                                                                <img src={m.teamB.mvpPlayer.playerImg} alt={m.teamB.mvpPlayer.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={20} className="text-blue-400" />
                                                            )}
                                                            <div className="absolute top-0 left-0 bg-blue-500 text-white px-1 py-0.5 rounded-br text-[6px] font-black uppercase">MVP</div>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-xs font-black text-white truncate">{m.teamB.mvpPlayer.name}</span>
                                                            <span className="block text-[8px] text-gray-500 font-bold uppercase">{m.teamB.mvpPlayer.kills} kills ({m.teamB.mvpPlayer.avgKills} avg)</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600 italic block">Nenhum registro de jogador</span>
                                                )}
                                                <div className="space-y-2">
                                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Lista de Jogadores</span>
                                                    {m.teamB.playerList.slice(0, 5).map((p, pIdx) => (
                                                        <div key={pIdx} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400 font-bold truncate max-w-[120px]">{p.name}</span>
                                                            <span className="text-white font-black">{p.kills} <span className="text-[8px] text-gray-600">({p.avgKills})</span></span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SUB-TAB: Abates por Safe do Kill Feed */}
                        {(compareSubTab === 'safeKills' || compareSubTab === 'all') && compareSafeKillsData && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <Crosshair size={16} /> Abates por Safe do Kill Feed
                                        </div>
                                    </div>
                                )}
                                <TeamVsTeamSafeKillsCompare
                                    teamA={filters.team[0]}
                                    teamB={compareTeamB}
                                    safeKillsData={compareSafeKillsData}
                                    onPlayerClick={(pName) => navigate('/players', { state: { player: pName } })}
                                    onTeamClick={(tName) => setFilters(prev => ({ ...prev, team: [tName] }))}
                                />
                            </div>
                        )}

                        {/* SUB-TAB: Safes */}
                        {(compareSubTab === 'safes' || compareSubTab === 'all') && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <MapPin size={16} /> Desempenho por Safe nos Mapas
                                        </div>
                                    </div>
                                )}
                                {compareSafesMapData.map((m, mIdx) => (
                                    <div key={mIdx} className="bg-[#1a1a1a] rounded-[40px] border border-gray-800 p-8 space-y-6 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full" />
                                        
                                        <div className="border-b border-gray-800 pb-4 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                                                    <MapPin size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-white uppercase italic tracking-widest">{m.mapName}</h4>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Locais onde as equipes mais pontuam ou falham</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Team A Safes */}
                                            <div className="space-y-4">
                                                <span className="text-xs font-black text-yellow-500 uppercase tracking-widest block border-b border-white/5 pb-2">{filters.team[0]}</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Best */}
                                                    <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-2"><ArrowUp size={12} /> MELHORES SAFES</span>
                                                        {m.teamA.best.length > 0 ? m.teamA.best.map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-300 font-bold truncate max-w-[120px]">{s.localName}</span>
                                                                <span className="text-emerald-400 font-black">{s.avgPts} pts</span>
                                                            </div>
                                                        )) : <span className="text-[10px] text-gray-600 italic block">Sem registros</span>}
                                                    </div>
                                                    {/* Worst */}
                                                    <div className="bg-red-950/20 p-4 rounded-2xl border border-red-500/20 space-y-3">
                                                        <span className="text-[9px] text-red-400 font-black uppercase tracking-wider flex items-center gap-2"><ArrowDown size={12} /> PIORES SAFES</span>
                                                        {m.teamA.worst.length > 0 ? m.teamA.worst.map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-300 font-bold truncate max-w-[120px]">{s.localName}</span>
                                                                <span className="text-red-400 font-black">{s.avgPts} pts</span>
                                                            </div>
                                                        )) : <span className="text-[10px] text-gray-600 italic block">Sem registros</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Team B Safes */}
                                            <div className="space-y-4">
                                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest block border-b border-white/5 pb-2">{compareTeamB}</span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Best */}
                                                    <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-2"><ArrowUp size={12} /> MELHORES SAFES</span>
                                                        {m.teamB.best.length > 0 ? m.teamB.best.map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-300 font-bold truncate max-w-[120px]">{s.localName}</span>
                                                                <span className="text-emerald-400 font-black">{s.avgPts} pts</span>
                                                            </div>
                                                        )) : <span className="text-[10px] text-gray-600 italic block">Sem registros</span>}
                                                    </div>
                                                    {/* Worst */}
                                                    <div className="bg-red-950/20 p-4 rounded-2xl border border-red-500/20 space-y-3">
                                                        <span className="text-[9px] text-red-400 font-black uppercase tracking-wider flex items-center gap-2"><ArrowDown size={12} /> PIORES SAFES</span>
                                                        {m.teamB.worst.length > 0 ? m.teamB.worst.map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-300 font-bold truncate max-w-[120px]">{s.localName}</span>
                                                                <span className="text-red-400 font-black">{s.avgPts} pts</span>
                                                            </div>
                                                        )) : <span className="text-[10px] text-gray-600 italic block">Sem registros</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* SUB-TAB: Killfeed Phases (Early/Mid/Late Game) */}
                        {(compareSubTab === 'safeKills' || compareSubTab === 'all') && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {compareSubTab === 'all' && (
                                    <div className="flex flex-col items-center pt-8">
                                        <div className="h-0.5 w-28 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-3" />
                                        <div className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-[0.4em] italic text-xs">
                                            <Crosshair size={16} /> Agressividade por Fases do Jogo
                                        </div>
                                    </div>
                                )}
                                <div className="bg-[#1a1a1a] rounded-[40px] border border-gray-800 p-8 space-y-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                                    
                                    <div className="border-b border-gray-800 pb-4 flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                                <Crosshair size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-white uppercase italic tracking-widest">Agressividade (Early / Mid / Late)</h4>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Comparativo de kills por fase no Kill Feed</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                                        {[filters.team[0], compareTeamB].map((teamName, idx) => {
                                            const phaseStats = allTeamsPhaseStats.find(t => t.name === teamName);
                                            if (!phaseStats) return null;

                                            return (
                                                <div key={teamName} className="space-y-6">
                                                    <h5 className={`text-xl font-black uppercase italic tracking-widest ${idx === 0 ? 'text-yellow-500' : 'text-blue-400'}`}>
                                                        {teamName}
                                                    </h5>
                                                    
                                                    <div className="space-y-4">
                                                        {/* Early */}
                                                        <div className="bg-black/60 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between group hover:border-emerald-500/40 transition-colors">
                                                            <div>
                                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">EARLY GAME (SAFES 1-2)</span>
                                                                <span className="text-xs text-gray-500 font-bold">Kills no início de partida</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-2xl font-black text-white italic">{phaseStats.earlyKills} <span className="text-xs text-emerald-400 ml-1 font-bold">KILLS</span></span>
                                                                <span className="text-[10px] text-emerald-400/80 font-black">{phaseStats.earlyPct}%</span>
                                                            </div>
                                                        </div>
                                                        {/* Mid */}
                                                        <div className="bg-black/60 p-4 rounded-2xl border border-yellow-500/20 flex items-center justify-between group hover:border-yellow-500/40 transition-colors">
                                                            <div>
                                                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block">MID GAME (SAFES 3-4)</span>
                                                                <span className="text-xs text-gray-500 font-bold">Kills no meio de jogo</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-2xl font-black text-white italic">{phaseStats.midKills} <span className="text-xs text-yellow-400 ml-1 font-bold">KILLS</span></span>
                                                                <span className="text-[10px] text-yellow-400/80 font-black">{phaseStats.midPct}%</span>
                                                            </div>
                                                        </div>
                                                        {/* Late */}
                                                        <div className="bg-black/60 p-4 rounded-2xl border border-red-500/20 flex items-center justify-between group hover:border-red-500/40 transition-colors">
                                                            <div>
                                                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">LATE GAME (SAFES 5+)</span>
                                                                <span className="text-xs text-gray-500 font-bold">Kills decisivas</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-2xl font-black text-white italic">{phaseStats.lateKills} <span className="text-xs text-red-400 ml-1 font-bold">KILLS</span></span>
                                                                <span className="text-[10px] text-red-400/80 font-black">{phaseStats.latePct}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 px-2">
                                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Registrado</span>
                                                        <span className="text-lg font-black text-white italic">{phaseStats.totalPhaseKills} KILLS</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#1a1a1a] rounded-[50px] border-2 border-dashed border-gray-800 py-32 flex flex-col items-center justify-center space-y-6">
                         <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-gray-700">
                             <Scale size={40} />
                         </div>
                         <div className="text-center">
                             <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Modo de Comparação</h3>
                             <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">Selecione duas equipes nos campos acima para comparar estatísticas head-to-head.</p>
                         </div>
                    </div>
                )}
            </div>
        ) : activeTab === 'bottomRanking' ? (
            <div className="space-y-12 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <BottomList title="Piores em Pontos" data={bottomRankings.pts} metric="pts" label="PTS" color="text-yellow-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores em PTS/C" data={bottomRankings.ptsc} metric="ptsc" label="PTS/C" color="text-orange-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores em Booyahs" data={bottomRankings.booyahs} metric="b" label="BOOYAHS" color="text-blue-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores Médias (PTS)" data={bottomRankings.avgPts} metric="avgPts" label="AVG PTS" color="text-yellow-400" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                    <BottomList title="Piores Médias (KILLS)" data={bottomRankings.avgAbts} metric="avgAbts" label="AVG KILLS" color="text-red-500" onSelect={(name) => setFilters(prev => ({...prev, team: [name]}))} />
                </div>
            </div>
        ) : activeTab === 'pointsTable' ? (
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                <ListOrdered size={20} className="text-yellow-500"/> TABELA DE PONTOS POR RODADA
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Classificação Geral & evolução de pontos de todos os times</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> LÍDER (1º)
                            </span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-[#10b981] inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> FINALISTAS (2-12º)
                            </span>
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded bg-red-700 inline-block shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span> REBAIXAMENTO (13º+)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full rounded-2xl border border-gray-800/60 shadow-inner scrollbar-thin scrollbar-thumb-gray-800">
                        <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead className="bg-[#0f0f0f] border-b border-gray-800 text-gray-400 text-[10px] uppercase font-black tracking-wider">
                                <tr>
                                    <th className="px-4 py-4 text-center w-16">#</th>
                                    <th className="px-4 py-4 text-center w-14">TEND</th>
                                    <th className="px-4 py-4 min-w-[200px]">Equipe</th>
                                    <th className="px-4 py-4 text-center bg-yellow-900/10 text-yellow-500 w-24">PTS</th>
                                    {sortedRoundsList.map(round => (
                                        <th key={round} className="px-4 py-4 text-center min-w-[80px] font-bold text-gray-300">
                                            {formatRoundHeader(round)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/40">
                                {displayTeamStats.map((team, index) => {
                                    const rank = index + 1;
                                    const trend = rankTrends[team.name] || { change: 0, type: 'neutral' };
                                    
                                    // Determinar a cor do badge de rank do print do Free Fire
                                    let rankBadgeClass = "w-6 h-6 rounded flex items-center justify-center font-black text-xs ";
                                    if (rank === 1) {
                                        rankBadgeClass += "bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]";
                                    } else if (rank <= 12) {
                                        rankBadgeClass += "bg-[#10b981] text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]";
                                    } else {
                                        rankBadgeClass += "bg-red-950/80 text-white border border-red-800/30";
                                    }

                                    // Determinar as bordas esquerdas das divisões
                                    let rowBorderClass = "hover:bg-white/[0.03] transition-colors ";
                                    if (rank <= 12) {
                                        rowBorderClass += "border-l-[4px] border-[#10b981] bg-emerald-500/[0.01]";
                                    } else {
                                        rowBorderClass += "border-l-[4px] border-red-700 bg-red-500/[0.01]";
                                    }

                                    return (
                                        <tr key={team.name} className={rowBorderClass}>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center items-center">
                                                    <span className={rankBadgeClass}>{rank}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center font-bold text-xs">
                                                    {trend.type === 'up' && (
                                                        <span className="text-emerald-400 flex items-center gap-0.5">
                                                            <ArrowUp size={12} className="stroke-[3]" /> {trend.change}
                                                        </span>
                                                    )}
                                                    {trend.type === 'down' && (
                                                        <span className="text-red-500 flex items-center gap-0.5">
                                                            <ArrowDown size={12} className="stroke-[3]" /> {trend.change}
                                                        </span>
                                                    )}
                                                    {trend.type === 'neutral' && (
                                                        <span className="text-gray-600 font-bold">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-black border border-gray-800 p-1 flex-shrink-0 flex items-center justify-center">
                                                        {team.image ? (
                                                            <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Shield size={16} className="text-gray-700" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase italic tracking-tight">{team.name}</span>
                                                        {team.grupo && (
                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{team.grupo}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-black text-sm italic text-yellow-500 bg-yellow-950/10">
                                                {team.pts}
                                            </td>
                                            {sortedRoundsList.map(round => {
                                                const pts = teamRoundPoints[team.name]?.[round];
                                                const isExistent = pts !== undefined;
                                                return (
                                                    <td key={round} className="px-4 py-3 text-center font-bold text-xs font-mono">
                                                        {isExistent ? (
                                                            <span className="text-white font-black">{pts}</span>
                                                        ) : (
                                                            <span className="text-gray-700 font-bold">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ) : activeTab === 'teamRounds' ? (
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-3">
                                <Calendar size={20} className="text-yellow-500"/> HISTÓRICO DE RODADAS POR EQUIPE
                            </h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                                Visualize quais rodadas uma equipe jogou e os detalhes de sua performance em cada queda
                            </p>
                        </div>
                    </div>

                    {/* Seleção de equipe */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Selecionar Equipe:</label>
                            <select 
                                value={selectedTeamName || ''} 
                                onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value ? [e.target.value] : [] }))}
                                className="bg-black text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl border border-gray-800 focus:border-yellow-500 outline-none cursor-pointer"
                            >
                                <option value="">-- Escolha uma Equipe --</option>
                                {teamsList.map(t => (
                                    <option key={t.name} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedTeamName && (
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, team: [] }))}
                                className="text-[10px] font-black text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/20 uppercase tracking-widest transition-colors scale-100 hover:scale-[1.02] active:scale-95"
                            >
                                Limpar Seleção
                            </button>
                        )}
                    </div>

                    {selectedTeamName && selectedTeamStats ? (
                        <div className="space-y-6">
                            {/* Card de Resumo do Time Selecionado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                    <div className="w-14 h-14 bg-black rounded-xl border border-gray-800 p-2 flex items-center justify-center relative shrink-0">
                                        {selectedTeamStats.image ? (
                                            <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Shield size={24} className="text-gray-700" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block">EQUIPE</span>
                                        <h4 className="text-lg font-black italic uppercase leading-none text-white truncate">{selectedTeamStats.name}</h4>
                                        {selectedTeamStats.grupo && (
                                            <span className="text-[8px] text-yellow-500 font-bold uppercase tracking-widest mt-1 block">{selectedTeamStats.grupo}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">PONTOS TOTAIS</span>
                                    <span className="text-2xl font-black italic leading-none text-yellow-500">{selectedTeamStats.pts}</span>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">ABATES (KILLS)</span>
                                    <span className="text-2xl font-black italic leading-none text-red-500">{selectedTeamStats.abts}</span>
                                </div>
                                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-center">
                                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">BOOYAHS (VITÓRIAS)</span>
                                    <span className="text-2xl font-black italic leading-none text-orange-500">{selectedTeamStats.b}</span>
                                </div>
                            </div>

                            {/* Seção de Personagens e Line-up da Equipe */}
                            {teamCharSummary && teamCharSummary.activeSkills.length > 0 && (
                                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                                        <div>
                                            <h4 className="text-base font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                <Zap size={18} className="text-yellow-500" />
                                                SÍNTESE DE PERSONAGENS & HABILIDADES DA EQUIPE
                                            </h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                                Resumo das habilidades ativas, pets e preferências da line-up em {teamCharSummary.totalDrops} quedas disputadas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ativas mais usadas pelo time */}
                                    <div>
                                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                            <Zap size={12} /> HABILIDADES ATIVAS MAIS USADAS PELA EQUIPE
                                        </span>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                            {teamCharSummary.activeSkills.slice(0, 6).map((sk) => (
                                                <div key={sk.name} className="bg-black/60 p-3 rounded-2xl border border-yellow-500/20 flex flex-col items-center text-center shadow-md">
                                                    {sk.img ? (
                                                        <img src={sk.img} alt={sk.name} className="w-9 h-9 object-contain rounded-xl bg-black p-0.5 border border-yellow-500/30 mb-2" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-black border border-yellow-500/30 flex items-center justify-center mb-2">
                                                            <Zap size={18} className="text-yellow-500" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-black italic uppercase text-white truncate max-w-full">{sk.name}</span>
                                                    <span className="text-[10px] font-bold text-yellow-500 mt-0.5">{sk.count}x ({sk.pct}%)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Line-up de Jogadores da Equipe */}
                                    {teamCharSummary.players.length > 0 && (
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                                <Users size={12} className="text-yellow-500" /> PREFERÊNCIAS POR JOGADOR NA LINE-UP
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {teamCharSummary.players.map((p) => {
                                                    const mainActive = p.activeSkills[0];
                                                    return (
                                                        <div key={p.name} className="bg-black/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-between space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    {p.img ? (
                                                                        <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden flex-shrink-0 bg-black">
                                                                            <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center flex-shrink-0 text-gray-500">
                                                                            <Users size={16} />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <button
                                                                            onClick={() => handlePlayerClick(p.name)}
                                                                            className="text-xs font-black italic uppercase text-white hover:text-yellow-500 transition-colors block text-left"
                                                                        >
                                                                            {p.name}
                                                                        </button>
                                                                        {p.funcao && (
                                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">{p.funcao}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                                                    {p.totalDrops} Quedas
                                                                </span>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {mainActive && (
                                                                    <div className="bg-yellow-500/5 p-2 rounded-xl border border-yellow-500/20 flex items-center gap-2">
                                                                        {mainActive.img ? (
                                                                            <img src={mainActive.img} className="w-6 h-6 object-contain rounded bg-black p-0.5 border border-yellow-500/30" alt={mainActive.name} />
                                                                        ) : (
                                                                            <Zap size={14} className="text-yellow-500" />
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <span className="text-[7px] text-yellow-500 font-black uppercase block leading-none">ATIVA MAIS USADA</span>
                                                                            <span className="text-[10px] font-black italic text-white uppercase truncate block mt-0.5">{mainActive.name} ({mainActive.pct}%)</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {p.passives && p.passives.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                                        {p.passives.map(pass => (
                                                                            <div key={pass.name} className="flex items-center gap-1 bg-black/40 px-1.5 py-1 rounded border border-white/5" title={`${pass.name} (${pass.pct}%)`}>
                                                                                {pass.img && <img src={pass.img} alt={pass.name} className="w-4 h-4 object-contain rounded-full" />}
                                                                                <span className="text-[9px] text-gray-300 font-bold truncate max-w-[60px]">{pass.name}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                                                    {p.topPet && (
                                                                        <div className="flex items-center gap-1">
                                                                            {p.topPet.img && <img src={p.topPet.img} alt={p.topPet.name} className="w-4 h-4 object-contain" />}
                                                                            <span className="text-[9px] text-gray-400 font-bold truncate max-w-[50px]">{p.topPet.name}</span>
                                                                        </div>
                                                                    )}
                                                                    {p.topItem && (
                                                                        <div className="flex items-center gap-1">
                                                                            {p.topItem.img && <img src={p.topItem.img} alt={p.topItem.name} className="w-4 h-4 object-contain" />}
                                                                            <span className="text-[9px] text-gray-400 font-bold truncate max-w-[50px]">{p.topItem.name}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                                     {/* Composições por Mapa */}
                                     {teamMapCharacterSummary.length > 0 && (
                                         <div className="pt-2 border-t border-white/5">
                                             <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-3 flex items-center gap-1.5">
                                                 <MapIcon size={12} /> COMPOSIÇÕES DE HABILIDADES POR MAPA
                                             </span>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                 {teamMapCharacterSummary.map((m) => {
                                                     const isSelected = normalize(teamRoundsMapFilter) === normalize(m.mapName);
                                                     return (
                                                         <div
                                                             key={m.mapName}
                                                             className={`p-3.5 rounded-2xl border text-left transition-all ${
                                                                 isSelected
                                                                     ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/5'
                                                                     : 'bg-black/60 border-white/5 hover:border-yellow-500/30'
                                                             }`}
                                                         >
                                                             <div 
                                                                 className="cursor-pointer"
                                                                 onClick={() => setTeamRoundsMapFilter(isSelected ? 'ALL' : m.mapName)}
                                                             >
                                                                 <div className="flex justify-between items-center mb-2">
                                                                     <span className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                                                                         <MapPin size={12} className="text-yellow-500" /> {m.mapName}
                                                                     </span>
                                                                     <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                                                                         {m.dropCount} Quedas
                                                                     </span>
                                                                 </div>
                                                                 <div className="flex items-center gap-1.5 flex-wrap">
                                                                     {m.topActives.map((act) => (
                                                                         <span key={act.name} className="inline-flex items-center gap-1 bg-black/80 px-2 py-1 rounded-lg border border-yellow-500/20 text-[9px] font-bold text-white uppercase">
                                                                             {act.img && <img src={act.img} alt={act.name} className="w-3.5 h-3.5 object-contain" />}
                                                                             {act.name} ({act.pct}%)
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             </div>
                                                             
                                                             {isSelected && m.players && m.players.length > 0 && (
                                                                 <div className="mt-4 pt-4 border-t border-yellow-500/20 grid gap-3">
                                                                     <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-1.5">
                                                                         <Users size={10} className="text-yellow-500" /> PREFERÊNCIAS NO MAPA
                                                                     </span>
                                                                     {m.players.map((p) => {
                                                                         const mainActive = p.activeSkills?.[0];
                                                                         return (
                                                                             <div key={p.name} className="bg-black/60 p-2.5 rounded-xl border border-white/5">
                                                                                 <div className="flex items-center justify-between mb-2">
                                                                                     <div className="flex items-center gap-2">
                                                                                         {p.img ? (
                                                                                             <img src={p.img} alt={p.name} className="w-6 h-6 object-cover rounded-full border border-yellow-500/30" />
                                                                                         ) : (
                                                                                             <div className="w-6 h-6 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center text-gray-500">
                                                                                                 <Users size={10} />
                                                                                         </div>
                                                                                         )}
                                                                                         <span className="text-[10px] font-black italic uppercase text-white">{p.name}</span>
                                                                                     </div>
                                                                                     {p.funcao && <span className="text-[8px] font-bold text-gray-500 uppercase">{p.funcao}</span>}
                                                                                 </div>
                                                                                 <div className="space-y-2">
                                                                                     {mainActive && (
                                                                                         <div className="bg-yellow-500/5 p-1.5 rounded-lg border border-yellow-500/20 flex items-center gap-2">
                                                                                             {mainActive.img ? (
                                                                                                 <img src={mainActive.img} className="w-5 h-5 object-contain rounded bg-black p-0.5 border border-yellow-500/30" alt={mainActive.name} />
                                                                                             ) : (
                                                                                                 <Zap size={12} className="text-yellow-500" />
                                                                                             )}
                                                                                             <div className="min-w-0 flex-1 flex justify-between items-center">
                                                                                                 <div>
                                                                                                     <span className="text-[6px] text-yellow-500 font-black uppercase block leading-none">ATIVA</span>
                                                                                                     <span className="text-[9px] font-black italic text-white uppercase truncate block mt-0.5">{mainActive.name}</span>
                                                                                                 </div>
                                                                                                 <span className="text-[9px] font-bold text-yellow-500">{mainActive.pct}%</span>
                                                                                             </div>
                                                                                         </div>
                                                                                     )}
                                                                                     {p.passives && p.passives.length > 0 && (
                                                                                         <div className="flex flex-wrap gap-1.5 pt-1">
                                                                                             {p.passives.map(pass => (
                                                                                                 <div key={pass.name} className="flex items-center gap-1 bg-black/40 px-1.5 py-1 rounded border border-white/5" title={`${pass.name} (${pass.pct}%)`}>
                                                                                                     {pass.img && <img src={pass.img} alt={pass.name} className="w-3.5 h-3.5 object-contain rounded-full" />}
                                                                                                     <span className="text-[8px] text-gray-300 font-bold truncate max-w-[50px]">{pass.name}</span>
                                                                                                 </div>
                                                                                             ))}
                                                                                         </div>
                                                                                     )}
                                                                                     <div className="flex items-center gap-2 pt-1.5 border-t border-white/5">
                                                                                         {p.topPet && (
                                                                                             <div className="flex items-center gap-1">
                                                                                                 {p.topPet.img && <img src={p.topPet.img} alt={p.topPet.name} className="w-3.5 h-3.5 object-contain" />}
                                                                                                 <span className="text-[8px] text-gray-400 font-bold truncate max-w-[50px]">{p.topPet.name}</span>
                                                                                             </div>
                                                                                         )}
                                                                                         {p.topItem && (
                                                                                             <div className="flex items-center gap-1">
                                                                                                 {p.topItem.img && <img src={p.topItem.img} alt={p.topItem.name} className="w-3.5 h-3.5 object-contain" />}
                                                                                                 <span className="text-[8px] text-gray-400 font-bold truncate max-w-[50px]">{p.topItem.name}</span>
                                                                                             </div>
                                                                                         )}
                                                                                     </div>
                                                                                 </div>
                                                                             </div>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             )}
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     )}

                             {/* Cabeçalho da Seção de Rodadas com Filtro de Mapa e Botão de Expandir Todas */}
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8 mb-4">
                                 <h4 className="text-white font-black uppercase tracking-widest text-xs border-l-2 border-yellow-500 pl-3">
                                     RODADAS DISPUTADAS ({selectedTeamRounds.length})
                                 </h4>

                                 <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                     {/* Filtro por Mapa */}
                                     <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                                         <button
                                             onClick={() => setTeamRoundsMapFilter('ALL')}
                                             className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                                 teamRoundsMapFilter === 'ALL'
                                                     ? 'bg-yellow-500 text-black shadow-md'
                                                     : 'text-gray-400 hover:text-white'
                                             }`}
                                         >
                                             Todos os Mapas
                                         </button>
                                         {teamMapCharacterSummary.map((m) => {
                                             const isActive = normalize(teamRoundsMapFilter) === normalize(m.mapName);
                                             return (
                                                 <button
                                                     key={m.mapName}
                                                     onClick={() => setTeamRoundsMapFilter(isActive ? 'ALL' : m.mapName)}
                                                     className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                         isActive
                                                             ? 'bg-yellow-500 text-black shadow-md'
                                                             : 'text-gray-400 hover:text-white'
                                                     }`}
                                                 >
                                                     {m.mapName}
                                                 </button>
                                             );
                                         })}
                                     </div>

                                     {/* Botão de Expandir / Recolher Todas as Line-ups */}
                                     <button
                                         onClick={() => setExpandAllLineups(!expandAllLineups)}
                                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap ${
                                             expandAllLineups
                                                 ? 'bg-yellow-500 text-black border-yellow-400 shadow-yellow-500/20'
                                                 : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border-yellow-500/30'
                                         }`}
                                     >
                                         <Zap size={13} /> {expandAllLineups ? 'Recolher Line-ups' : 'Expandir Todas as Line-ups'}
                                     </button>
                                 </div>
                             </div>

                            <div className="space-y-4">
                                {selectedTeamRounds.map((rdData) => {
                                    const filteredMatches = rdData.matches.filter(m => {
                                        if (teamRoundsMapFilter === 'ALL') return true;
                                        const normF = normalize(teamRoundsMapFilter);
                                        const normM = normalize(m.MAPA);
                                        return normM === normF || normM.includes(normF) || normF.includes(normM);
                                    });
                                    if (filteredMatches.length === 0) return null;

                                    return (
                                    <div key={rdData.round} className="bg-black/30 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
                                        {/* Cabeçalho da Rodada */}
                                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] border-b border-gray-800">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center font-black text-yellow-500 text-sm">
                                                    RD
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                                        RODADA {rdData.round}
                                                    </h5>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Confrontos:</span>
                                                        {rdData.confrontos.map(conf => (
                                                            <span key={conf} className="bg-white/5 border border-white/5 text-[8px] font-black uppercase text-gray-400 px-2 py-0.5 rounded">
                                                                {conf}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Pontos</span>
                                                    <span className="text-xs font-black text-yellow-500 leading-none mt-1 inline-block">{rdData.pts}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Kills</span>
                                                    <span className="text-xs font-black text-red-500 leading-none mt-1 inline-block">{rdData.abts}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Posição</span>
                                                    <span className="text-xs font-black text-blue-400 leading-none mt-1 inline-block">{rdData.ptsc}</span>
                                                </div>
                                                <div className="text-center bg-black/60 px-3 py-1.5 rounded-xl border border-white/5 min-w-[70px]">
                                                    <span className="block text-[7px] text-gray-500 font-black uppercase tracking-widest">Booyahs</span>
                                                    <span className="text-xs font-black text-orange-500 leading-none mt-1 inline-block">{rdData.booyahs}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quedas Jogadas */}
                                        <div className="p-4 overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                                                <thead className="bg-black/50 text-gray-500 text-[8px] uppercase font-black tracking-widest border-b border-gray-800">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Queda</th>
                                                        <th className="px-4 py-2.5">Mapa</th>
                                                        <th className="px-4 py-2.5 text-center">Posição</th>
                                                        <th className="px-4 py-2.5 text-center text-yellow-500">Pontos</th>
                                                        <th className="px-4 py-2.5 text-center text-orange-500">Pts Pos</th>
                                                        <th className="px-4 py-2.5 text-center text-red-500">Abates</th>
                                                        <th className="px-4 py-2.5 text-center">Booyah</th>
                                                        <th className="px-4 py-2.5">Onde Fechou</th>
                                                        <th className="px-4 py-2.5 text-center text-yellow-500">Personagens</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800/30 text-xs">
                                                    {filteredMatches.map((m, mIdx) => {
                                                        const dropKey = `${rdData.round}-${m.Q}`;
                                                        const isExpanded = expandAllLineups || expandedDropKey === dropKey;
                                                        const currentTeamName = selectedTeamStats?.name || selectedTeamName || '';

                                                        return (
                                                            <React.Fragment key={mIdx}>
                                                                <tr className={`hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-yellow-500/5' : ''}`}>
                                                                    <td className="px-4 py-3 font-semibold text-gray-400">Queda {m.Q}</td>
                                                                    <td className="px-4 py-3 font-bold text-white uppercase italic tracking-wider text-[10px]">{m.MAPA}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black italic text-xs border ${parseInt(m.POS) === 1 ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-gray-950 text-gray-400 border-gray-800'}`}>
                                                                            {m.POS}º
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center font-black text-yellow-500">{m.PTS}</td>
                                                                    <td className="px-4 py-3 text-center font-black text-orange-400">{m.PTSC}</td>
                                                                    <td className="px-4 py-3 text-center font-black text-red-500">{m.ABTS}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        {parseInt(m.B) > 0 ? (
                                                                            <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black text-[8px] uppercase tracking-tighter">BOOYAH</span>
                                                                        ) : (
                                                                            <span className="text-gray-700 font-bold">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        {m.ONDE_FECHOU ? (
                                                                            <span className="bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/20 shadow-md">
                                                                                {m.ONDE_FECHOU}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-600 font-bold text-[10px]">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <button
                                                                            onClick={() => setExpandedDropKey(isExpanded ? null : dropKey)}
                                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer ${isExpanded ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border-yellow-500/30'}`}
                                                                        >
                                                                            <Zap size={12} /> {isExpanded ? 'Ocultar Line-up' : 'Ver Line-up'}
                                                                        </button>
                                                                    </td>
                                                                </tr>

                                                                {/* Linha Expandida com Composição dos 4 Jogadores na Queda */}
                                                                {isExpanded && (
                                                                    <tr className="bg-black/60 border-y border-yellow-500/20">
                                                                        <td colSpan={9} className="p-4 sm:p-6">
                                                                            <DropCompositionViewer
                                                                                teamName={currentTeamName}
                                                                                round={rdData.round}
                                                                                drop={m.Q}
                                                                                mapa={m.MAPA}
                                                                                playersLoadout={getTeamDropComposition(
                                                                                    data,
                                                                                    currentTeamName,
                                                                                    rdData.round,
                                                                                    m.Q,
                                                                                    m.CONFRONTO,
                                                                                    m.MAPA
                                                                                )}
                                                                                onPlayerClick={(pName) => handlePlayerClick(pName)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                                {selectedTeamRounds.length === 0 && (
                                    <div className="py-12 text-center text-[10px] text-gray-600 font-black uppercase italic tracking-widest bg-black/10 rounded-2xl border border-dashed border-gray-800">
                                        Nenhuma rodada encontrada para esta equipe no momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-gray-800">
                                <Calendar size={40} className="text-yellow-500 mx-auto opacity-70 mb-4" />
                                <h4 className="text-white font-black uppercase italic tracking-widest text-sm">Nenhuma Equipe Selecionada</h4>
                                <p className="text-xs text-gray-500 font-medium mt-1">Escolha uma equipe abaixo ou na barra superior para listar suas rodadas.</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {teamsList.map(t => (
                                    <div 
                                        key={t.name}
                                        onClick={() => setFilters(prev => ({ ...prev, team: [t.name] }))}
                                        className="bg-black/30 rounded-2xl p-4 border border-gray-800/80 hover:border-yellow-500/40 cursor-pointer hover:bg-yellow-500/[0.02] flex flex-col items-center justify-center text-center transition-all group scale-100 hover:scale-[1.03] active:scale-95 shadow-md"
                                    >
                                        <div className="w-12 h-12 bg-black rounded-xl border border-gray-800 p-1.5 flex items-center justify-center shrink-0 mb-3 group-hover:border-yellow-500 transition-all">
                                            {t.image ? (
                                                <img src={t.image} alt={t.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Shield size={18} className="text-gray-700" />
                                            )}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-yellow-500 transition-colors">{t.name}</span>
                                        <span className="text-[8px] text-yellow-500/60 font-black uppercase mt-1 block">{t.pts} PTS</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            /* Galeria de Times */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {displayTeamStats.map(team => (
                    <div 
                        key={team.name} 
                        onClick={() => setFilters(prev => ({...prev, team: [team.name]}))}
                        className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 shadow-xl hover:border-yellow-500/40 hover:translate-y-[-5px] transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-gray-800 p-2 group-hover:scale-110 group-hover:border-yellow-500 transition-all">
                                {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-800" size={24} />}
                            </div>
                            <div className="text-right">
                                <h3 className="text-xl font-black italic text-white uppercase leading-none group-hover:text-yellow-500 transition-colors">{formatTeamName(team.name)}</h3>
                                <div className="flex flex-col items-end gap-1 mt-1">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">{team.pts} PONTOS</span>
                                    {(() => {
                                        const char = getTeamCharacteristic(team.percentAbts, team.percentPos);
                                        return (
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${char.bg} ${char.border} ${char.color} text-[8px] font-black uppercase tracking-widest`}>
                                                {char.icon}
                                                {char.label}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <div className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest group-hover:text-yellow-500 transition-colors">VER PERFIL COMPLETO →</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Modal de Composição por Queda (4 Jogadores) */}
        {compositionModal && (
          <DropCompositionViewer
            isModal
            teamName={compositionModal.teamName}
            round={compositionModal.round}
            drop={compositionModal.drop}
            mapa={compositionModal.mapa}
            playersLoadout={getTeamDropComposition(
              data,
              compositionModal.teamName,
              compositionModal.round,
              compositionModal.drop,
              compositionModal.confronto,
              compositionModal.mapa
            )}
            onPlayerClick={(pName) => {
              setCompositionModal(null);
              handlePlayerClick(pName);
            }}
            onClose={() => setCompositionModal(null)}
          />
        )}
    </div>
  );
};

const StatBadge = ({ label, value, color }: any) => (
    <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 text-center min-w-[100px] shadow-inner">
        <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{label}</span>
        <span className={`block text-2xl font-black ${color} italic`}>{value}</span>
    </div>
);

const BottomList = ({ title, data, metric, label, color, onSelect }: any) => (
    <div className="bg-[#1a1a1a] rounded-3xl border border-red-900/20 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-red-900/20 to-black p-5 border-b border-gray-800 flex items-center gap-3">
            <TrendingDown size={18} className="text-red-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <div className="divide-y divide-gray-800/50">
            {data.map((team: any, idx: number) => (
                <div key={idx} onClick={() => onSelect(team.name)} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-gray-600 w-4">#{idx + 1}</span>
                        <div className="w-8 h-8 bg-black rounded-lg border border-gray-800 p-1 flex items-center justify-center">
                            {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield size={14} className="text-gray-700" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-300 uppercase italic group-hover:text-white transition-colors leading-none">{team.name}</span>
                            {(() => {
                                const char = getTeamCharacteristic(team.percentAbts, team.percentPos);
                                return (
                                    <div className={`flex items-center gap-1 mt-1 ${char.color} text-[7px] font-black uppercase tracking-widest`}>
                                        {char.icon}
                                        {char.label}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-sm font-black italic ${color}`}>{team[metric]}</span>
                        <span className="block text-[8px] text-gray-600 font-black uppercase tracking-tighter">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default Teams;
