import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { 
  Trophy, Shield, Users, Target, Flame, Crosshair, Award, 
  ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize, 
  Printer, Download, Grid, MessageSquare, ArrowLeft, RefreshCw, 
  Crown, Star, CheckCircle2, AlertTriangle, Zap, Activity, 
  TrendingUp, MapPin, BarChart3, HelpCircle, Sparkles, Filter, 
  Search, Eye, Clock, Layers, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, LineChart, Line, PieChart, Pie 
} from 'recharts';
import { DashboardData, TeamStats, PlayerData, CharacterData, MatchDetails } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { findTeamLogo, formatTeamName } from '../utils/teamUtils';
import { getWeaponInfo } from '../utils/weaponUtils';
import { findDimImg } from '../utils/skillImages';
import { getTeamCharacters, getTeamCharacterSummary, isSameTeam } from '../utils/characterUtils';
import { TeamSlidesSections } from '../components/slides/TeamSlidesSections';
import { PlayerSlidesSections } from '../components/slides/PlayerSlidesSections';

interface PresentationProps {
  data: DashboardData;
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

export const Presentation: React.FC<PresentationProps> = ({ data }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const slideRef = useRef<HTMLDivElement>(null);

  // URL State & Defaults
  const initialType = (searchParams.get('type') === 'player' ? 'player' : 'team') as 'team' | 'player';
  const initialName = searchParams.get('name') || '';

  const [mode, setMode] = useState<'team' | 'player'>(initialType);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);
  const [autoplayInterval, setAutoplayInterval] = useState<number>(10); // seconds
  const [showOverviewGrid, setShowOverviewGrid] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedRound, setSelectedRound] = useState<string>('ALL');

  // Calculate base team stats
  const allTeamStats: TeamStats[] = useMemo(() => {
    return calculateTeamStats(data);
  }, [data]);

  // Teams list
  const teamsList = useMemo(() => {
    return allTeamStats.map(t => ({
      name: t.name,
      image: t.image || findTeamLogo(t.name, data.teamsReference),
      pts: t.pts,
      abts: t.abts,
      b: t.b,
      rank: 0
    })).sort((a, b) => b.pts - a.pts).map((t, idx) => ({ ...t, rank: idx + 1 }));
  }, [allTeamStats, data.teamsReference]);

  // Selected Team
  const [selectedTeamName, setSelectedTeamName] = useState<string>(() => {
    if (initialType === 'team' && initialName) {
      const found = teamsList.find(t => normalize(t.name) === normalize(initialName));
      if (found) return found.name;
    }
    return teamsList[0]?.name || '';
  });

  // Calculate players ranking / data
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
      knocks: number;
      assists: number;
      funcao?: string;
      mvp: number;
    }>();

    // Fill from playersDimension
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
          knocks: 0,
          assists: 0,
          funcao: dim.Funcao || 'N/A',
          mvp: 0
        });
      }
    });

    // Aggregate from data.players
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
        knocks: 0,
        assists: 0,
        funcao: 'N/A',
        mvp: 0
      };

      existing.kills += parseNum(p.Abates);
      existing.damage += parseNum(p.Dano);
      existing.hs += parseNum(p.HS);
      existing.knocks += parseNum(p.Deitados);
      existing.assists += parseNum(p.Assistencias);
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

    return arr.sort((a, b) => b.kills - a.kills);
  }, [data.playersDimension, data.players, data.teamsReference]);

  // Selected Player
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>(() => {
    if (initialType === 'player' && initialName) {
      const found = playersList.find(p => normalize(p.name) === normalize(initialName));
      if (found) return found.name;
    }
    return playersList[0]?.name || '';
  });

  // Available rounds
  const availableRounds = useMemo(() => {
    const set = new Set<string>();
    (data.details || []).forEach(d => {
      if (d.RD && d.RD.trim()) set.add(d.RD.trim());
    });
    return Array.from(set).sort((a, b) => parseNum(a) - parseNum(b));
  }, [data.details]);

  // Sync mode changes to URL
  const handleSelectMode = (newMode: 'team' | 'player') => {
    setMode(newMode);
    setCurrentSlideIndex(0);
    const targetName = newMode === 'team' ? selectedTeamName : selectedPlayerName;
    setSearchParams({ type: newMode, name: targetName });
  };

  const handleSelectTeam = (teamName: string) => {
    setSelectedTeamName(teamName);
    setCurrentSlideIndex(0);
    setSearchParams({ type: 'team', name: teamName });
  };

  const handleSelectPlayer = (playerName: string) => {
    setSelectedPlayerName(playerName);
    setCurrentSlideIndex(0);
    setSearchParams({ type: 'player', name: playerName });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(totalSlides - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (showOverviewGrid) setShowOverviewGrid(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Autoplay timer
  useEffect(() => {
    if (!isAutoplay) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % totalSlides);
    }, autoplayInterval * 1000);

    return () => clearInterval(timer);
  }, [isAutoplay, autoplayInterval]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      slideRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Export current slide as image
  const handleDownloadSlide = async () => {
    const container = document.getElementById('active-slide-container');
    if (!container) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0b10'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const targetName = mode === 'team' ? selectedTeamName : selectedPlayerName;
      link.download = `Slide_${currentSlideIndex + 1}_${targetName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erro ao gerar slide em imagem:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // =========================================================================
  // DADOS ESPECÍFICOS DO TIME SELECIONADO
  // =========================================================================
  const currentTeamStats = useMemo(() => {
    const found = allTeamStats.find(t => normalize(t.name) === normalize(selectedTeamName));
    const rank = teamsList.find(t => normalize(t.name) === normalize(selectedTeamName))?.rank || 1;
    return {
      ...(found || {
        name: selectedTeamName,
        pts: 0,
        abts: 0,
        b: 0,
        ptsc: 0,
        s: 1,
        avgPts: 0,
        avgAbts: 0,
        percentPos: 0,
        percentAbts: 0,
        kpm: 0
      }),
      rank,
      image: findTeamLogo(selectedTeamName, data.teamsReference)
    };
  }, [allTeamStats, selectedTeamName, teamsList, data.teamsReference]);

  // Matches/Details of this team
  const teamMatchDetails = useMemo(() => {
    return (data.details || []).filter(d => {
      if (normalize(d.TIME) !== normalize(selectedTeamName)) return false;
      if (selectedRound !== 'ALL' && normalize(d.RD) !== normalize(selectedRound)) return false;
      return true;
    });
  }, [data.details, selectedTeamName, selectedRound]);

  // Map performance of this team
  const teamMapStats = useMemo(() => {
    const mapAgg = new Map<string, { map: string; drops: number; booyahs: number; kills: number; pts: number }>();
    teamMatchDetails.forEach(d => {
      const rawMap = d.MAPA || 'N/A';
      const mapKey = rawMap.trim().toUpperCase();
      const current = mapAgg.get(mapKey) || { map: mapKey, drops: 0, booyahs: 0, kills: 0, pts: 0 };
      current.drops += 1;
      current.booyahs += parseNum(d.B);
      current.kills += parseNum(d.ABTS);
      current.pts += parseNum(d.PTS);
      mapAgg.set(mapKey, current);
    });

    return Array.from(mapAgg.values()).map(m => ({
      ...m,
      avgPts: m.drops > 0 ? (m.pts / m.drops).toFixed(1) : '0',
      avgKills: m.drops > 0 ? (m.kills / m.drops).toFixed(1) : '0',
      booyahRate: m.drops > 0 ? ((m.booyahs / m.drops) * 100).toFixed(0) : '0'
    })).sort((a, b) => b.pts - a.pts);
  }, [teamMatchDetails]);

  // Players of this team
  const teamRoster = useMemo(() => {
    return playersList.filter(p => normalize(p.team) === normalize(selectedTeamName))
      .sort((a, b) => b.kills - a.kills);
  }, [playersList, selectedTeamName]);

  // Killfeed weapons of this team
  const teamWeapons = useMemo(() => {
    const rosterNames = new Set(teamRoster.map(p => normalize(p.name)));
    const weaponMap = new Map<string, number>();

    (data.killFeed || []).forEach(k => {
      if (rosterNames.has(normalize(k.PLAYER)) && k.ARMA) {
        const weaponKey = k.ARMA.trim().toUpperCase();
        weaponMap.set(weaponKey, (weaponMap.get(weaponKey) || 0) + 1);
      }
    });

    const totalKills = Array.from(weaponMap.values()).reduce((a, b) => a + b, 0) || 1;

    return Array.from(weaponMap.entries()).map(([name, count]) => {
      const info = getWeaponInfo(name, data.weapons);
      return {
        name: info.name || name,
        count,
        pct: ((count / totalKills) * 100).toFixed(1),
        tipo: info.tipo || 'OUTRAS',
        img: info.img,
        config: info.config
      };
    }).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [teamRoster, data.killFeed, data.weapons]);

  // Timeline / Drops points evolution
  const teamDropTimeline = useMemo(() => {
    return teamMatchDetails.map((d, idx) => ({
      drop: `Queda ${idx + 1}`,
      round: `R${d.RD || 1}`,
      map: d.MAPA || 'N/A',
      pts: parseNum(d.PTS),
      kills: parseNum(d.ABTS),
      pos: parseNum(d.POS),
      isBooyah: parseNum(d.B) > 0
    }));
  }, [teamMatchDetails]);

  // =========================================================================
  // DADOS ESPECÍFICOS DO JOGADOR SELECIONADO
  // =========================================================================
  const currentPlayerStats = useMemo(() => {
    const found = playersList.find(p => normalize(p.name) === normalize(selectedPlayerName));
    const rank = playersList.findIndex(p => normalize(p.name) === normalize(selectedPlayerName)) + 1;
    const base = found || {
      name: selectedPlayerName,
      team: 'N/A',
      kills: 0,
      damage: 0,
      matches: 1,
      hs: 0,
      knocks: 0,
      assists: 0,
      funcao: 'N/A',
      mvp: 0,
      img: '',
      teamImg: ''
    };

    const avgKills = base.matches > 0 ? (base.kills / base.matches).toFixed(2) : '0.00';
    const avgDamage = base.matches > 0 ? (base.damage / base.matches).toFixed(0) : '0';
    const hsRate = base.kills > 0 ? ((base.hs / base.kills) * 100).toFixed(1) : '0.0';

    return {
      ...base,
      rank,
      avgKills,
      avgDamage,
      hsRate
    };
  }, [playersList, selectedPlayerName]);

  // Weapons used by this player
  const playerWeapons = useMemo(() => {
    const weaponMap = new Map<string, number>();

    (data.killFeed || []).forEach(k => {
      if (normalize(k.PLAYER) === normalize(selectedPlayerName) && k.ARMA) {
        const weaponKey = k.ARMA.trim().toUpperCase();
        weaponMap.set(weaponKey, (weaponMap.get(weaponKey) || 0) + 1);
      }
    });

    const totalKills = currentPlayerStats.kills || 1;

    return Array.from(weaponMap.entries()).map(([name, count]) => {
      const info = getWeaponInfo(name, data.weapons);
      return {
        name: info.name || name,
        count,
        pct: ((count / totalKills) * 100).toFixed(1),
        tipo: info.tipo || 'OUTRAS',
        img: info.img,
        config: info.config
      };
    }).sort((a, b) => b.count - a.count);
  }, [data.killFeed, selectedPlayerName, data.weapons, currentPlayerStats.kills]);

  // Loadouts and skills of this player
  const playerLoadouts = useMemo(() => {
    return (data.characters || []).filter(c => normalize(c.Player) === normalize(selectedPlayerName)).map(c => ({
      ...c,
      hab1Img: findDimImg(data.hab1, c.Hab1),
      hab2Img: findDimImg(data.hab2, c.Hab2),
      hab3Img: findDimImg(data.hab3, c.Hab3),
      hab4Img: findDimImg(data.hab4, c.Hab4),
      petImg: findDimImg(data.pets, c.Pet),
      itemImg: findDimImg(data.items, c.Item)
    }));
  }, [data.characters, selectedPlayerName, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items]);

  // Most common loadout
  const dominantLoadout = useMemo(() => {
    return playerLoadouts[0] || null;
  }, [playerLoadouts]);

  // Player team context
  const playerTeamStats = useMemo(() => {
    return allTeamStats.find(t => normalize(t.name) === normalize(currentPlayerStats.team));
  }, [allTeamStats, currentPlayerStats.team]);

  const playerKillContribution = useMemo(() => {
    if (!playerTeamStats || playerTeamStats.abts === 0) return '0.0';
    return ((currentPlayerStats.kills / playerTeamStats.abts) * 100).toFixed(1);
  }, [playerTeamStats, currentPlayerStats.kills]);

  // Zero stats team
  const zeroStatsTeam = useMemo(() => {
    if (!selectedTeamName) return null;
    const teamMatches = teamMatchDetails.filter(d => {
      const hasMap = d.MAPA && d.MAPA.trim() !== '';
      const hasPts = d.PTS !== '' && d.PTS !== undefined && d.PTS !== null;
      const hasAbts = d.ABTS !== '' && d.ABTS !== undefined && d.ABTS !== null;
      return hasMap && (hasPts || hasAbts);
    });

    const totalMatches = teamMatches.length;
    const zeroPointsAndKillsMatches: MatchDetails[] = [];
    const zeroKillsOnlyMatches: MatchDetails[] = [];
    const zeroPointsOnlyMatches: MatchDetails[] = [];

    teamMatches.forEach(m => {
      const pts = parseNum(m.PTS);
      const abts = parseNum(m.ABTS);
      if (pts === 0 && abts === 0) zeroPointsAndKillsMatches.push(m);
      else if (abts === 0) zeroKillsOnlyMatches.push(m);
      else if (pts === 0) zeroPointsOnlyMatches.push(m);
    });

    const totalZeroPts = zeroPointsAndKillsMatches.length + zeroPointsOnlyMatches.length;
    const totalZeroKills = zeroPointsAndKillsMatches.length + zeroKillsOnlyMatches.length;
    const totalZeradasAbsoluta = zeroPointsAndKillsMatches.length;

    const allZeradasList = [...zeroPointsAndKillsMatches, ...zeroKillsOnlyMatches, ...zeroPointsOnlyMatches];

    return {
      totalMatches,
      totalZeroPts,
      totalZeroKills,
      totalZeradasAbsoluta,
      pctZeradas: totalMatches > 0 ? ((totalZeroPts / totalMatches) * 100).toFixed(1) : '0.0',
      allZeradasList
    };
  }, [teamMatchDetails, selectedTeamName]);

  // Safe stats (Onde fechou) e Análise de Safes por Mapa
  const safePerformanceByMapTeam = useMemo(() => {
    if (!selectedTeamName) return [];
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

    teamMatchDetails.forEach(m => {
      const map = m.MAPA ? m.MAPA.trim().toUpperCase() : 'N/A';
      const local = (m.ONDE_FECHOU || m.LOCAL || (m as any).SAFE || (m as any).Safe || 'Geral').trim();
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
          sumPos: 0,
        });
      }
      const locObj = mapLocals.get(local)!;
      const pts = parseNum(m.PTS);
      const abts = parseNum(m.ABTS);
      const ptsc = parseNum(m.PTSC);
      const pos = parseNum(m.POS);
      const isBooyah = pos === 1 || parseNum(m.B) > 0;

      locObj.matches.push(m);
      locObj.matchesCount += 1;
      locObj.totalPts += pts;
      locObj.totalPtsc += ptsc;
      locObj.totalKills += abts;
      if (isBooyah) locObj.booyahs += 1;
      if (pos > 0) locObj.sumPos += pos;
    });

    return Array.from(mapsMap.entries()).map(([mapName, localsMap]) => {
      const localsList = Array.from(localsMap.values()).map(loc => {
        const avgPts = loc.matchesCount > 0 ? loc.totalPts / loc.matchesCount : 0;
        const avgKills = loc.matchesCount > 0 ? loc.totalKills / loc.matchesCount : 0;
        const avgPos = loc.matchesCount > 0 ? loc.sumPos / loc.matchesCount : 12;
        return {
          ...loc,
          avgPts: avgPts.toFixed(1),
          avgPtsNum: avgPts,
          avgKills: avgKills.toFixed(1),
          avgKillsNum: avgKills,
          avgPos: avgPos.toFixed(1),
        };
      });

      const bestLocals = [...localsList].sort((a, b) => b.avgPtsNum - a.avgPtsNum || b.avgKillsNum - a.avgKillsNum);
      const worstLocals = [...localsList].sort((a, b) => a.avgPtsNum - b.avgPtsNum || a.avgKillsNum - b.avgKillsNum);

      return {
        mapName,
        localsList,
        bestLocals,
        worstLocals
      };
    }).sort((a, b) => b.localsList.length - a.localsList.length);
  }, [teamMatchDetails, selectedTeamName]);

  const safeStats = useMemo(() => {
    const safeMap = new Map<string, { name: string; map: string; pts: number; kills: number; count: number }>();
    teamMatchDetails.forEach(d => {
      const local = (d.ONDE_FECHOU || d.LOCAL || (d as any).SAFE || 'N/A').trim();
      if (!local || local === 'N/A') return;
      const key = `${d.MAPA || 'MAP'}_${local}`.toUpperCase();
      const current = safeMap.get(key) || { name: local, map: d.MAPA || 'N/A', pts: 0, kills: 0, count: 0 };
      current.pts += parseNum(d.PTS);
      current.kills += parseNum(d.ABTS);
      current.count += 1;
      safeMap.set(key, current);
    });
    return Array.from(safeMap.values()).sort((a, b) => b.pts - a.pts);
  }, [teamMatchDetails]);

  // Formações escaladas (Lineups) da equipe
  const teamLineupsData = useMemo(() => {
    if (!selectedTeamName) return null;
    const teamMatches = teamMatchDetails.filter(d => {
      const hasMap = d.MAPA && d.MAPA.trim() !== '';
      const hasPts = d.PTS !== '' && d.PTS !== undefined && d.PTS !== null;
      const hasAbts = d.ABTS !== '' && d.ABTS !== undefined && d.ABTS !== null;
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
    }>();

    teamMatches.forEach(match => {
      const rdClean = (match.RD || '').toString().replace(/\D/g, '');
      const qClean = (match.Q || (match as any).S || '').toString().replace(/\D/g, '');
      const playerNamesSet = new Set<string>();

      // 1. characters
      if (data.characters && data.characters.length > 0) {
        data.characters.forEach(c => {
          if (!c || !c.Player) return;
          if (!isSameTeam(c.Time, selectedTeamName, data.teamsReference)) return;
          const cRd = (c.Rd || c.RD || '').toString().replace(/\D/g, '');
          const cQ = (c.Q || (c as any).S || '').toString().replace(/\D/g, '');
          if (cRd === rdClean && cQ === qClean) {
            playerNamesSet.add(c.Player.trim());
          }
        });
      }

      // 2. players
      if (playerNamesSet.size === 0 && data.players && data.players.length > 0) {
        data.players.forEach(p => {
          if (!p || !p.PLAYER) return;
          if (!isSameTeam(p.TIME, selectedTeamName, data.teamsReference)) return;
          const pRd = (p.RD || '').toString().replace(/\D/g, '');
          const pQ = (p.Q || (p as any).S || '').toString().replace(/\D/g, '');
          if (pRd === rdClean && pQ === qClean) {
            playerNamesSet.add(p.PLAYER.trim());
          }
        });
      }

      // 3. killFeed fallback
      if (playerNamesSet.size === 0 && data.killFeed && data.killFeed.length > 0) {
        data.killFeed.forEach(k => {
          const kRd = (k.RD || '').toString().replace(/\D/g, '');
          const kQ = (k.Q || '').toString().replace(/\D/g, '');
          if (kRd === rdClean && kQ === qClean) {
            if (isSameTeam(k.TIME_ASSASSINO || k.TIME, selectedTeamName, data.teamsReference) && k.ASSASSINO) {
              playerNamesSet.add(k.ASSASSINO.trim());
            }
            if (isSameTeam(k.TIME_VITIMA, selectedTeamName, data.teamsReference) && k.VITIMA) {
              playerNamesSet.add(k.VITIMA.trim());
            }
          }
        });
      }

      const playerNames = Array.from(playerNamesSet).sort((a, b) => a.localeCompare(b));
      if (playerNames.length === 0) return;

      const lineupKey = playerNames.join(' • ');
      const pts = parseNum(match.PTS);
      const kills = parseNum(match.ABTS);
      const ptsc = parseNum(match.PTSC);
      const pos = parseNum(match.POS);
      const booyah = pos === 1 || parseNum(match.B) === 1;

      if (lineupsMap.has(lineupKey)) {
        const existing = lineupsMap.get(lineupKey)!;
        existing.matches += 1;
        existing.kills += kills;
        existing.points += pts;
        existing.ptsc += ptsc;
        if (booyah) existing.booyahs += 1;
        if (pts === 0) existing.zeroPts += 1;
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
        });
      }
    });

    const lineupsList = Array.from(lineupsMap.values()).map(l => {
      const avgPts = l.matches > 0 ? (l.points / l.matches).toFixed(1) : '0.0';
      const avgKills = l.matches > 0 ? (l.kills / l.matches).toFixed(1) : '0.0';
      const winRate = l.matches > 0 ? ((l.booyahs / l.matches) * 100).toFixed(0) : '0';
      return {
        ...l,
        avgPts,
        avgKills,
        winRate,
      };
    }).sort((a, b) => b.matches - a.matches || b.points - a.points);

    return {
      lineups: lineupsList,
      totalCount: lineupsList.length
    };
  }, [teamMatchDetails, selectedTeamName, data.characters, data.players, data.killFeed, data.teamsReference]);

  // Abates e Pontos por Rodada
  const teamRoundsStats = useMemo(() => {
    const roundMap = new Map<string, { round: string; roundLabel: string; kills: number; pts: number; matches: number }>();
    teamMatchDetails.forEach(d => {
      const rd = (d.RD || '1').toString().trim();
      const label = `RD ${rd}`;
      const current = roundMap.get(rd) || { round: rd, roundLabel: label, kills: 0, pts: 0, matches: 0 };
      current.kills += parseNum(d.ABTS);
      current.pts += parseNum(d.PTS);
      current.matches += 1;
      roundMap.set(rd, current);
    });

    return Array.from(roundMap.values()).map(r => ({
      ...r,
      avgKills: r.matches > 0 ? (r.kills / r.matches).toFixed(1) : '0.0',
      avgPts: r.matches > 0 ? (r.pts / r.matches).toFixed(1) : '0.0',
    })).sort((a, b) => parseNum(a.round) - parseNum(b.round));
  }, [teamMatchDetails]);

  // MVP e Destaque da Equipe por Mapa
  const teamMapMvpStats = useMemo(() => {
    const teamPlayerNames = new Set(teamRoster.map(p => normalize(p.name)));

    return teamMapStats.map(m => {
      const normMap = normalize(m.map);
      const playerMapPerf = new Map<string, { name: string; kills: number; damage: number; mvpCount: number; img?: string }>();

      (data.players || []).forEach(p => {
        if (!p.PLAYER) return;
        if (!isSameTeam(p.TIME, selectedTeamName, data.teamsReference) && !teamPlayerNames.has(normalize(p.PLAYER))) return;
        const pMap = normalize(p.MAPA);
        if (pMap === normMap || pMap.includes(normMap) || normMap.includes(pMap)) {
          const pKey = normalize(p.PLAYER);
          const current = playerMapPerf.get(pKey) || {
            name: p.PLAYER,
            kills: 0,
            damage: 0,
            mvpCount: 0,
            img: findDimImg(data.playersDimension, p.PLAYER)
          };
          current.kills += parseNum(p.Abates);
          current.damage += parseNum(p.Dano);
          current.mvpCount += parseNum(p.MVP);
          playerMapPerf.set(pKey, current);
        }
      });

      const playerList = Array.from(playerMapPerf.values()).sort((a, b) => b.kills - a.kills || b.damage - a.damage);
      const topPlayer = playerList[0] || (teamRoster[0] ? {
        name: teamRoster[0].name,
        kills: Math.round(m.kills * 0.4),
        damage: Math.round(m.kills * 400),
        mvpCount: m.booyahs,
        img: teamRoster[0].img
      } : null);

      return {
        map: m.map,
        drops: m.drops,
        booyahs: m.booyahs,
        teamKills: m.kills,
        pts: m.pts,
        avgKills: m.avgKills,
        avgPts: m.avgPts,
        topPlayer
      };
    });
  }, [teamMapStats, data.players, data.playersDimension, data.teamsReference, teamRoster, selectedTeamName]);

  // Composição de Habilidades do Time
  const teamCharSummary = useMemo(() => {
    return getTeamCharacterSummary(data, selectedTeamName);
  }, [data, selectedTeamName]);

  // Killfeed phases
  const killfeedPhases = useMemo(() => {
    const killsBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const deathsBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const rosterSet = new Set(teamRoster.map(p => normalize(p.name)));

    (data.killFeed || []).forEach(k => {
      const safeNum = parseInt((k.SAFE || '').replace(/\D/g, ''), 10) || 1;
      const clampedSafe = Math.min(Math.max(safeNum, 1), 6);
      if (rosterSet.has(normalize(k.PLAYER))) {
        killsBySafe[clampedSafe] = (killsBySafe[clampedSafe] || 0) + 1;
      }
      if (rosterSet.has(normalize(k.VITIMA))) {
        deathsBySafe[clampedSafe] = (deathsBySafe[clampedSafe] || 0) + 1;
      }
    });

    return { killsBySafe, deathsBySafe };
  }, [data.killFeed, teamRoster]);

  // Positions summary (1º ao 12º)
  const positionsSummary = useMemo(() => {
    const posCounts: Record<number, number> = {};
    for (let i = 1; i <= 12; i++) posCounts[i] = 0;
    teamMatchDetails.forEach(d => {
      const pos = parseNum(d.POS);
      if (pos >= 1 && pos <= 12) posCounts[pos] = (posCounts[pos] || 0) + 1;
    });
    return Object.entries(posCounts).map(([pos, count]) => ({ position: Number(pos), count }));
  }, [teamMatchDetails]);

  // Drops summary (Queda 1 a 6)
  const dropsSummary = useMemo(() => {
    const dropAgg: Record<number, { pts: number; kills: number; count: number }> = {};
    for (let i = 1; i <= 6; i++) dropAgg[i] = { pts: 0, kills: 0, count: 0 };
    teamMatchDetails.forEach(d => {
      const q = parseNum(d.QUEDA || (d as any).Q);
      if (q >= 1 && q <= 6) {
        dropAgg[q].pts += parseNum(d.PTS);
        dropAgg[q].kills += parseNum(d.ABTS);
        dropAgg[q].count += 1;
      }
    });
    return Object.entries(dropAgg).map(([dropNum, val]) => ({
      drop: `Queda ${dropNum}`,
      avgPts: val.count > 0 ? (val.pts / val.count).toFixed(1) : '0.0',
      kills: val.kills,
      count: val.count
    }));
  }, [teamMatchDetails]);

  // Player matches list
  const playerMatchesList = useMemo(() => {
    return (data.players || []).filter(p => normalize(p.PLAYER) === normalize(selectedPlayerName));
  }, [data.players, selectedPlayerName]);

  // Player map stats
  const playerMapStats = useMemo(() => {
    const mapMap = new Map<string, { map: string; kills: number; damage: number; matches: number }>();
    playerMatchesList.forEach(m => {
      const mapKey = (m.MAPA || 'N/A').toUpperCase().trim();
      const current = mapMap.get(mapKey) || { map: mapKey, kills: 0, damage: 0, matches: 0 };
      current.kills += parseNum(m.Abates);
      current.damage += parseNum(m.Dano);
      current.matches += 1;
      mapMap.set(mapKey, current);
    });
    return Array.from(mapMap.values()).map(m => ({
      ...m,
      avgKills: m.matches > 0 ? (m.kills / m.matches).toFixed(1) : '0.0'
    }));
  }, [playerMatchesList]);

  // Player round stats
  const playerRoundStats = useMemo(() => {
    const roundMap = new Map<string, { round: string; kills: number; damage: number; matches: number }>();
    playerMatchesList.forEach(m => {
      const rd = `RD ${m.RD || '1'}`;
      const current = roundMap.get(rd) || { round: rd, kills: 0, damage: 0, matches: 0 };
      current.kills += parseNum(m.Abates);
      current.damage += parseNum(m.Dano);
      current.matches += 1;
      roundMap.set(rd, current);
    });
    return Array.from(roundMap.values()).sort((a, b) => parseNum(a.round) - parseNum(b.round));
  }, [playerMatchesList]);

  // Player drop stats (Q1 a Q6)
  const playerDropStats = useMemo(() => {
    const dropAgg: Record<number, { kills: number; damage: number; matches: number }> = {};
    for (let i = 1; i <= 6; i++) dropAgg[i] = { kills: 0, damage: 0, matches: 0 };
    playerMatchesList.forEach(m => {
      const q = parseNum(m.QUEDA || (m as any).Q);
      if (q >= 1 && q <= 6) {
        dropAgg[q].kills += parseNum(m.Abates);
        dropAgg[q].damage += parseNum(m.Dano);
        dropAgg[q].matches += 1;
      }
    });
    return Object.entries(dropAgg).map(([qNum, val]) => ({
      drop: `Queda ${qNum}`,
      kills: val.kills,
      matches: val.matches
    }));
  }, [playerMatchesList]);

  // Player safe stats
  const playerSafeStats = useMemo(() => {
    const safeMap = new Map<string, { name: string; map: string; kills: number }>();
    (data.killFeed || []).forEach(k => {
      if (normalize(k.PLAYER) === normalize(selectedPlayerName)) {
        const local = (k.LOCAL || (k as any).SAFE || 'Safe Geral').trim();
        const key = `${k.MAPA || 'MAP'}_${local}`.toUpperCase();
        const current = safeMap.get(key) || { name: local, map: k.MAPA || 'N/A', kills: 0 };
        current.kills += 1;
        safeMap.set(key, current);
      }
    });
    return Array.from(safeMap.values()).sort((a, b) => b.kills - a.kills);
  }, [data.killFeed, selectedPlayerName]);

  // Victims & Killers
  const victimsAndKillers = useMemo(() => {
    const victimCounts = new Map<string, { victim: string; team: string; count: number }>();
    const killerCounts = new Map<string, { killer: string; team: string; count: number }>();

    (data.killFeed || []).forEach(k => {
      if (normalize(k.PLAYER) === normalize(selectedPlayerName) && k.VITIMA) {
        const vKey = normalize(k.VITIMA);
        const current = victimCounts.get(vKey) || { victim: k.VITIMA, team: k.TIME_VITIMA || '', count: 0 };
        current.count += 1;
        victimCounts.set(vKey, current);
      }
      if (normalize(k.VITIMA) === normalize(selectedPlayerName) && k.PLAYER) {
        const kKey = normalize(k.PLAYER);
        const current = killerCounts.get(kKey) || { killer: k.PLAYER, team: k.TIME || '', count: 0 };
        current.count += 1;
        killerCounts.set(kKey, current);
      }
    });

    return {
      victims: Array.from(victimCounts.values()).sort((a, b) => b.count - a.count),
      killers: Array.from(killerCounts.values()).sort((a, b) => b.count - a.count)
    };
  }, [data.killFeed, selectedPlayerName]);

  // Zero stats player
  const zeroStatsPlayer = useMemo(() => {
    const total = playerMatchesList.length;
    const zeroCount = playerMatchesList.filter(m => parseNum(m.Abates) === 0).length;
    return {
      total,
      zeroCount,
      zeroPct: total > 0 ? ((zeroCount / total) * 100).toFixed(1) : '0.0'
    };
  }, [playerMatchesList]);

  // All ranking data for radar
  const allRankingData = useMemo(() => {
    return playersList;
  }, [playersList]);

  // =========================================================================
  // DEFINIÇÃO DOS SLIDES
  // =========================================================================
  const teamSlideTitles = [
    '1. Capa & Identidade',
    '2. Raio-X de Performance',
    '3. Estilos por Mapa',
    '4. Quedas Zeradas',
    '5. Pontos & Abates por Partida',
    '6. Abates por Rodada',
    '7. Safes por Mapa',
    '8. Abates & MVP por Mapa',
    '9. Formações Escaladas (Lineups)',
    '10. Composição de Habilidades',
    '11. Fases do Jogo (Kill Feed)',
    '12. Histórico de Performance',
    '13. Domínio Territorial',
    '14. KPM por Safe',
    '15. Sumário de Posições',
    '16. Performance por Ordem de Queda',
    '17. Desempenho do Elenco',
    '18. Arsenal & Armas',
    '19. Pauta da Reunião'
  ];

  const playerSlideTitles = [
    '1. Capa do Atleta',
    '2. Raio-X Individual',
    '3. Recordes & Destaques',
    '4. Radar de Atributos',
    '5. Métricas Gerais',
    '6. Desempenho por Mapa',
    '7. Abates por Rodada',
    '8. Abates por Queda',
    '9. Abates por Safe',
    '10. Vítimas & Algozes',
    '11. Arsenal & Armas',
    '12. Loadout Meta',
    '13. Histórico de Loadouts',
    '14. Quedas Zeradas',
    '15. Histórico de Partidas',
    '16. Análise de KPM por Safe',
    '17. Impacto na Equipe',
    '18. Pauta & Metas'
  ];

  const totalSlides = mode === 'team' ? teamSlideTitles.length : playerSlideTitles.length;
  const currentSlideTitle = mode === 'team' 
    ? teamSlideTitles[currentSlideIndex] 
    : playerSlideTitles[currentSlideIndex];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* CONTROLE SUPERIOR / BARRA DE FERRAMENTAS DO APRESENTADOR */}
      {/* ========================================================================= */}
      <div className="no-print bg-[#10121a]/95 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Esquerda: Tipo de Apresentação (Time vs Jogador) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleSelectMode('team')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'team'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield size={14} />
              <span>Slides de Time</span>
            </button>
            <button
              onClick={() => handleSelectMode('player')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'player'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Slides de Jogador</span>
            </button>
          </div>

          {/* Seletor do Alvo (Time ou Jogador) */}
          {mode === 'team' ? (
            <select
              value={selectedTeamName}
              onChange={(e) => handleSelectTeam(e.target.value)}
              className="bg-black/70 border border-yellow-500/30 text-yellow-400 font-black text-xs uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-yellow-400"
            >
              {teamsList.map(t => (
                <option key={t.name} value={t.name} className="bg-[#12141c] text-white">
                  #{t.rank} {t.name} ({t.pts} pts • {t.b} B)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedPlayerName}
              onChange={(e) => handleSelectPlayer(e.target.value)}
              className="bg-black/70 border border-yellow-500/30 text-yellow-400 font-black text-xs uppercase px-3 py-2 rounded-xl focus:outline-none focus:border-yellow-400 max-w-[240px]"
            >
              {playersList.map(p => (
                <option key={p.name} value={p.name} className="bg-[#12141c] text-white">
                  {p.name} ({p.team || 'Sem time'}) - {p.kills} kills
                </option>
              ))}
            </select>
          )}

          {/* Filtro de Escopo de Rodadas */}
          {mode === 'team' && availableRounds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <Filter size={12} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 uppercase font-bold">Rodada:</span>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="bg-transparent text-white font-bold text-xs uppercase focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#12141c]">Todas</option>
                {availableRounds.map(r => (
                  <option key={r} value={r} className="bg-[#12141c]">Rodada {r}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Direita: Controles de Apresentação (Slides, Fullscreen, Notas, Exportar) */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full lg:w-auto">
          {/* Contador de Slides */}
          <div className="bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-gray-300">
            Slide <strong className="text-yellow-400 font-black">{currentSlideIndex + 1}</strong> de {totalSlides}
          </div>

          {/* Navegação Prev / Next */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentSlideIndex === 0}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Slide Anterior (Seta Esquerda)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1))}
              disabled={currentSlideIndex === totalSlides - 1}
              className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Próximo Slide (Seta Direita / Espaço)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsAutoplay(prev => !prev)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isAutoplay 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
            title={isAutoplay ? 'Pausar Reprodução Automática' : 'Iniciar Reprodução Automática'}
          >
            {isAutoplay ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{isAutoplay ? 'Pausar' : 'Autoplay'}</span>
          </button>

          {/* Visão Geral (Grade) */}
          <button
            onClick={() => setShowOverviewGrid(prev => !prev)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              showOverviewGrid 
                ? 'bg-yellow-500 text-black border-yellow-400 font-black' 
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Visão Geral de Todos os Slides"
          >
            <Grid size={14} />
            <span className="hidden sm:inline">Grade</span>
          </button>

          {/* Pauta da Reunião (Notas) */}
          <button
            onClick={() => setShowNotes(prev => !prev)}
            className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              showNotes 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
            title="Pauta da Reunião e Notas do Treinador"
          >
            <MessageSquare size={14} />
            <span className="hidden sm:inline">Pauta</span>
          </button>

          {/* Exportar para PDF (Destaque) */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600/25 via-red-500/35 to-amber-500/25 border border-red-500/40 text-red-300 hover:text-white hover:border-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-red-500/10 cursor-pointer"
            title="Exportar apresentação completa em relatório PDF estruturado para envio externo"
          >
            <FileText size={14} className="text-red-400" />
            <span className="hidden sm:inline">Exportar para PDF</span>
          </button>

          {/* Download Slide Atual (PNG) */}
          <button
            onClick={handleDownloadSlide}
            disabled={isExporting}
            className="p-2 rounded-xl bg-black/60 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Baixar Este Slide como Imagem (PNG)"
          >
            <Download size={14} />
          </button>

          {/* Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 transition-colors cursor-pointer"
            title="Modo Tela Cheia (F)"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE VISÃO GERAL (GRADE DE MINIATURAS) */}
      {/* ========================================================================= */}
      {showOverviewGrid && (
        <div className="bg-black/95 p-6 rounded-3xl border border-yellow-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200 no-print">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Grid size={18} className="text-yellow-400" />
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Visão Geral da Apresentação ({mode === 'team' ? selectedTeamName : selectedPlayerName})
              </h3>
            </div>
            <button
              onClick={() => setShowOverviewGrid(false)}
              className="text-xs font-bold uppercase text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg"
            >
              Fechar Grade
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(mode === 'team' ? teamSlideTitles : playerSlideTitles).map((title, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  setShowOverviewGrid(false);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between aspect-[16/10] ${
                  currentSlideIndex === idx
                    ? 'bg-yellow-500/15 border-yellow-400 shadow-lg shadow-yellow-500/20'
                    : 'bg-[#12141f] border-white/10 hover:border-white/30 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-gray-500 uppercase">
                    Slide #{idx + 1}
                  </span>
                  {currentSlideIndex === idx && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  )}
                </div>
                <div className="my-auto text-center py-2">
                  <p className="text-xs font-black uppercase text-white group-hover:text-yellow-400 transition-colors">
                    {title}
                  </p>
                </div>
                <span className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-wider">
                  Clique para apresentar
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAINEL DE PAUTA DA REUNIÃO / NOTAS DO TREINADOR (COLLAPSIBLE) */}
      {/* ========================================================================= */}
      {showNotes && (
        <div className="bg-gradient-to-r from-purple-950/40 via-black/80 to-purple-950/40 p-5 rounded-3xl border border-purple-500/30 shadow-2xl animate-in slide-in-from-top duration-300 no-print">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-300">
                Pauta da Reunião & Diretrizes Táticas para o Analista / Treinador
              </h4>
            </div>
            <button
              onClick={() => setShowNotes(false)}
              className="text-[10px] font-bold uppercase text-purple-300 hover:text-white"
            >
              Fechar Pauta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="bg-black/60 p-3.5 rounded-2xl border border-green-500/20">
              <div className="flex items-center gap-1.5 text-green-400 font-black uppercase text-[11px] mb-2">
                <CheckCircle2 size={14} />
                <span>1. Pontos Fortes a Elogiar</span>
              </div>
              <ul className="text-gray-300 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                {mode === 'team' ? (
                  <>
                    <li>Aproveitamento de abates nos confrontos diretos ({currentTeamStats.abts} abates).</li>
                    <li>Desempenho no mapa de maior pontuação ({teamMapStats[0]?.map || 'Bermuda'}).</li>
                    <li>Sinergia de line-up e consistência do elenco.</li>
                  </>
                ) : (
                  <>
                    <li>Taxa de conversão de abates ({currentPlayerStats.kills} kills).</li>
                    <li>Dano constante nas trocas ({currentPlayerStats.avgDamage} dano médio).</li>
                    <li>Especialidade com armamento de assinatura.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-black/60 p-3.5 rounded-2xl border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[11px] mb-2">
                <AlertTriangle size={14} />
                <span>2. Oportunidades de Correção</span>
              </div>
              <ul className="text-gray-300 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                {mode === 'team' ? (
                  <>
                    <li>Quedas sem pontuação expressiva (atenção aos drop-spots).</li>
                    <li>Sobrevida para os círculos finais (fechamentos 4 e 5).</li>
                    <li>Ajustes de rotação no mapa mais crítico.</li>
                  </>
                ) : (
                  <>
                    <li>Posicionamento para evitar ser pego isolado.</li>
                    <li>Gestão de recursos (gelos e granadas).</li>
                    <li>Participação nas decisões táticas e calls de combate.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-black/60 p-3.5 rounded-2xl border border-blue-500/20">
              <div className="flex items-center gap-1.5 text-blue-400 font-black uppercase text-[11px] mb-2">
                <Target size={14} />
                <span>3. Metas para a Próxima Rodada</span>
              </div>
              <ul className="text-gray-300 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                {mode === 'team' ? (
                  <>
                    <li>Meta de pontuação mínima: <strong>40+ pontos</strong> no dia.</li>
                    <li>Pelo menos 1 Booyah nos mapas dominados.</li>
                    <li>Garantir top 3 na classificação geral.</li>
                  </>
                ) : (
                  <>
                    <li>Manter média de abates acima de <strong>1.5 kills/queda</strong>.</li>
                    <li>Melhorar índice de headshot nas trocas de média distância.</li>
                    <li>Foco total no suporte ao time e trade de kills.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTAINER PRINCIPAL DO SLIDE (FORMATO 16:9 / FULLSCREEN CAPABLE) */}
      {/* ========================================================================= */}
      <div 
        ref={slideRef}
        id="active-slide-container"
        className={`relative w-full rounded-[32px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 ${
          isFullscreen 
            ? 'h-screen w-screen rounded-none border-none p-6 sm:p-12 flex flex-col justify-between bg-[#0a0b10]' 
            : 'min-h-[580px] lg:min-h-[640px] bg-[#0c0e15] flex flex-col justify-between p-6 sm:p-8 lg:p-10'
        }`}
      >
        {/* Barra de Progresso Superior do Slide */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 no-print">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
          />
        </div>

        {/* Header do Slide */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {mode === 'team' ? (
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-yellow-500/30 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {currentTeamStats.image ? (
                  <img src={currentTeamStats.image} alt={currentTeamStats.name} className="w-full h-full object-contain" />
                ) : (
                  <Shield size={20} className="text-yellow-400" />
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-black/60 border border-yellow-500/30 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                {currentPlayerStats.img ? (
                  <img src={currentPlayerStats.img} alt={currentPlayerStats.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Users size={20} className="text-yellow-400" />
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">
                  {mode === 'team' ? 'APRESENTAÇÃO EXECUTIVA DE TIME' : 'PERFIL ESTRATÉGICO DE ATLETA'}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  FFWS BRASIL 2026 SPLIT 2
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white font-display tracking-wide">
                {mode === 'team' ? currentTeamStats.name : `${currentPlayerStats.name} (${currentPlayerStats.team})`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black text-gray-300 uppercase tracking-wider">
              {currentSlideTitle}
            </span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CONTEÚDO DINÂMICO DOS SLIDES */}
        {/* ===================================================================== */}
        <div className="flex-1 my-6 flex flex-col justify-center">
          {mode === 'team' ? (
            <TeamSlidesSections
              slideIndex={currentSlideIndex}
              data={data}
              teamStats={currentTeamStats}
              teamMatchDetails={teamMatchDetails}
              teamMapStats={teamMapStats}
              teamRoster={teamRoster}
              teamWeapons={teamWeapons}
              teamDropTimeline={teamDropTimeline}
              zeroStatsTeam={zeroStatsTeam}
              safeStats={safeStats}
              safePerformanceByMapTeam={safePerformanceByMapTeam}
              lineups={teamLineupsData}
              teamRoundsStats={teamRoundsStats}
              teamMapMvpStats={teamMapMvpStats}
              teamCharSummary={teamCharSummary}
              killfeedPhases={killfeedPhases}
              positionsSummary={positionsSummary}
              dropsSummary={dropsSummary}
            />
          ) : (
            <PlayerSlidesSections
              slideIndex={currentSlideIndex}
              data={data}
              playerStats={currentPlayerStats}
              rankings={currentPlayerStats}
              playerWeapons={playerWeapons}
              dominantLoadout={dominantLoadout}
              playerLoadouts={playerLoadouts}
              playerMapStats={playerMapStats}
              playerRoundStats={playerRoundStats}
              playerDropStats={playerDropStats}
              playerSafeStats={playerSafeStats}
              victimsAndKillers={victimsAndKillers}
              zeroStatsPlayer={zeroStatsPlayer}
              playerMatchesList={playerMatchesList}
              allRankingData={allRankingData}
              playerKillContribution={playerKillContribution}
              playerTeamStats={playerTeamStats}
            />
          )}
        </div>

        {/* ===================================================================== */}
        {/* FOOTER DO SLIDE: MINIATURAS E NAVEGAÇÃO INFERIOR */}
        {/* ===================================================================== */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-print">
            {(mode === 'team' ? teamSlideTitles : playerSlideTitles).map((title, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 scale-105'
                    : 'bg-black/50 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {idx + 1}. {title.split('.')[1] || title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 shrink-0">
            <span className="hidden md:inline text-gray-500 text-[10px] uppercase">
              Use as setas ← → ou Espaço para navegar
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentSlideIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentSlideIndex === 0}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1))}
                disabled={currentSlideIndex === totalSlides - 1}
                className="px-3 py-1 rounded-lg bg-yellow-500 text-black font-black uppercase tracking-wider hover:bg-yellow-400 disabled:opacity-20 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINT-ONLY: GERA TODOS OS SLIDES PARA IMPRESSÃO EM PDF */}
      {/* ========================================================================= */}
      <div className="hidden print:block space-y-8 bg-white text-black p-4">
        {mode === 'team' ? (
          <>
            {/* Página 1: Capa Executiva */}
            <div className="p-8 bg-black text-white rounded-3xl border border-gray-800 break-after-page min-h-[500px] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-black border border-yellow-500/40 rounded-2xl p-2 flex items-center justify-center">
                    {currentTeamStats.image ? (
                      <img src={currentTeamStats.image} alt={currentTeamStats.name} className="w-full h-full object-contain" />
                    ) : (
                      <Shield size={32} className="text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-yellow-400 tracking-widest">RELATÓRIO ESTRUTURADO DE EQUIPE</span>
                    <h1 className="text-4xl font-black uppercase italic font-display">{currentTeamStats.name}</h1>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 uppercase font-bold block">FFWS BRASIL 2026 SPLIT 2</span>
                  <span className="text-sm font-black text-yellow-400 uppercase">#{currentTeamStats.rank} Ranking Geral</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 my-8">
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Pontos Totais</span>
                  <span className="text-3xl font-black text-yellow-400 font-mono">{currentTeamStats.pts}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Abates Totais</span>
                  <span className="text-3xl font-black text-red-400 font-mono">{currentTeamStats.abts}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Booyahs (Vitórias)</span>
                  <span className="text-3xl font-black text-yellow-400 font-mono">{currentTeamStats.b}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Média / Queda</span>
                  <span className="text-3xl font-black text-white font-mono">{currentTeamStats.avgPts}</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Relatório Gerado para Apresentação & Reunião Técnica</span>
                <span>Analista: Jhan Medeiros</span>
              </div>
            </div>

            {/* Página 2: Desempenho por Mapa e Roster */}
            <div className="p-8 bg-black text-white rounded-3xl border border-gray-800 break-after-page space-y-6">
              <h2 className="text-xl font-black uppercase text-yellow-400 border-b border-gray-800 pb-2">
                1. Eficiência por Mapa & Desempenho dos Atletas
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Desempenho nos Mapas</h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-900 text-gray-400 uppercase">
                      <tr>
                        <th className="p-2">Mapa</th>
                        <th className="p-2 text-center">Quedas</th>
                        <th className="p-2 text-center">Kills</th>
                        <th className="p-2 text-center">Booyahs</th>
                        <th className="p-2 text-center">Média Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {teamMapStats.map(m => (
                        <tr key={m.map}>
                          <td className="p-2 font-bold uppercase">{m.map}</td>
                          <td className="p-2 text-center font-mono">{m.drops}</td>
                          <td className="p-2 text-center font-mono text-red-400">{m.kills}</td>
                          <td className="p-2 text-center font-mono text-yellow-400">{m.booyahs}</td>
                          <td className="p-2 text-center font-mono font-bold text-white">{m.avgPts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Line-up da Equipe</h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-900 text-gray-400 uppercase">
                      <tr>
                        <th className="p-2">Atleta</th>
                        <th className="p-2">Função</th>
                        <th className="p-2 text-center">Abates</th>
                        <th className="p-2 text-center">% Kills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {teamRoster.map(p => (
                        <tr key={p.name}>
                          <td className="p-2 font-bold uppercase text-white">{p.name}</td>
                          <td className="p-2 text-gray-400 uppercase text-[10px]">{p.funcao || 'Atleta'}</td>
                          <td className="p-2 text-center font-mono text-red-400 font-bold">{p.kills}</td>
                          <td className="p-2 text-center font-mono text-yellow-400">
                            {currentTeamStats.abts > 0 ? `${((p.kills / currentTeamStats.abts) * 100).toFixed(1)}%` : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Arsenal & Top Armas da Equipe</h3>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {teamWeapons.slice(0, 4).map(w => (
                    <div key={w.name} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                      <span className="font-black uppercase text-white block truncate">{w.name}</span>
                      <span className="text-yellow-400 font-mono font-bold">{w.count} kills ({w.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Página 3: Safes, Formações & Composição de Habilidades */}
            <div className="p-8 bg-black text-white rounded-3xl border border-gray-800 break-after-page space-y-6">
              <h2 className="text-xl font-black uppercase text-yellow-400 border-b border-gray-800 pb-2">
                2. Safes por Mapa, Formações Escaladas & Composição de Habilidades
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Formações Escaladas (Lineups)</h3>
                  <div className="space-y-2 text-xs">
                    {(teamLineupsData?.lineups || []).slice(0, 3).map((l: any, idx: number) => (
                      <div key={idx} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                        <div className="flex justify-between font-bold text-yellow-400 mb-1">
                          <span>Formação #{idx + 1} ({l.matches} quedas)</span>
                          <span className="text-white font-mono">{l.points} pts • {l.kills} kills</span>
                        </div>
                        <span className="text-gray-300 text-[11px]">{(l.players || []).join(' • ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Habilidades Meta da Equipe</h3>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-yellow-500 block">Ativas Mais Escolhidas</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(teamCharSummary?.activeSkills || []).slice(0, 3).map((sk: any, idx: number) => (
                          <span key={idx} className="bg-black/60 px-2 py-0.5 rounded border border-white/10 text-white text-[10px] font-bold">
                            {sk.name} ({sk.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400 block">Passivas Dominantes</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(teamCharSummary?.passives || []).slice(0, 4).map((sk: any, idx: number) => (
                          <span key={idx} className="bg-black/60 px-2 py-0.5 rounded border border-white/10 text-white text-[10px] font-bold">
                            {sk.name} ({sk.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800">
                <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Melhores Safes por Mapa</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {safePerformanceByMapTeam.slice(0, 3).map((mObj: any) => (
                    <div key={mObj.mapName} className="bg-gray-900 p-2.5 rounded-xl border border-gray-800">
                      <span className="font-black text-yellow-400 uppercase block mb-1">{mObj.mapName}</span>
                      {(mObj.bestLocals || []).slice(0, 2).map((loc: any, lIdx: number) => (
                        <div key={lIdx} className="flex justify-between text-[10px] text-gray-300">
                          <span className="truncate">{loc.localName}</span>
                          <span className="font-mono text-emerald-400 font-bold">{loc.avgPts} pts/q</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Página 1: Capa do Atleta */}
            <div className="p-8 bg-black text-white rounded-3xl border border-gray-800 break-after-page min-h-[500px] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-black border border-yellow-500/40 rounded-2xl p-1 flex items-center justify-center overflow-hidden">
                    {currentPlayerStats.img ? (
                      <img src={currentPlayerStats.img} alt={currentPlayerStats.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Users size={32} className="text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-yellow-400 tracking-widest">DOSSIÊ ESTRATÉGICO DE ATLETA</span>
                    <h1 className="text-4xl font-black uppercase italic font-display">{currentPlayerStats.name}</h1>
                    <span className="text-xs text-gray-400 font-bold uppercase">{currentPlayerStats.team} • Função: {currentPlayerStats.funcao || 'Atleta'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 uppercase font-bold block">FFWS BRASIL 2026 SPLIT 2</span>
                  <span className="text-sm font-black text-red-400 uppercase">#{currentPlayerStats.rank} Ranking de Kills</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 my-8">
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Abates Totais</span>
                  <span className="text-3xl font-black text-red-400 font-mono">{currentPlayerStats.kills}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Média Kills / Queda</span>
                  <span className="text-3xl font-black text-yellow-400 font-mono">{currentPlayerStats.avgKills}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Dano Médio</span>
                  <span className="text-3xl font-black text-white font-mono">{currentPlayerStats.avgDamage}</span>
                </div>
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Taxa de HS</span>
                  <span className="text-3xl font-black text-blue-400 font-mono">{currentPlayerStats.hsRate}%</span>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Relatório Individual para Avaliação Técnica e Reunião</span>
                <span>Analista: Jhan Medeiros</span>
              </div>
            </div>

            {/* Página 2: Arsenal & Habilidades */}
            <div className="p-8 bg-black text-white rounded-3xl border border-gray-800 break-after-page space-y-6">
              <h2 className="text-xl font-black uppercase text-yellow-400 border-b border-gray-800 pb-2">
                1. Arsenal de Armas & Configuração de Habilidades
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Armas Utilizadas (% de Kills)</h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-900 text-gray-400 uppercase">
                      <tr>
                        <th className="p-2">Arma</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2 text-center">Abates</th>
                        <th className="p-2 text-center">% Kills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {playerWeapons.slice(0, 8).map(w => (
                        <tr key={w.name}>
                          <td className="p-2 font-bold uppercase text-white">{w.name}</td>
                          <td className="p-2 text-gray-400 uppercase text-[10px]">{w.tipo}</td>
                          <td className="p-2 text-center font-mono text-red-400 font-bold">{w.count}</td>
                          <td className="p-2 text-center font-mono text-yellow-400">{w.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Loadout Principal</h3>
                  {dominantLoadout ? (
                    <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-yellow-500 block">Ativa</span>
                        <span className="text-white font-black uppercase">{dominantLoadout.Hab1 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Passiva 1</span>
                        <span className="text-white font-bold uppercase">{dominantLoadout.Hab2 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Passiva 2</span>
                        <span className="text-white font-bold uppercase">{dominantLoadout.Hab3 || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Passiva 3</span>
                        <span className="text-white font-bold uppercase">{dominantLoadout.Hab4 || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">Sem loadout registrado</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Presentation;
