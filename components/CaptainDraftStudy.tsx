import React, { useState, useMemo } from 'react';
import { 
  Crown, Users, UserCheck, ShieldAlert, Sparkles, Trophy, 
  Flame, Swords, Shield, Target, RefreshCw, Printer, Download, 
  Search, CheckCircle2, ChevronRight, AlertCircle, Award, BarChart2,
  Shuffle, Info, Layers, ListOrdered, Play, Check, ArrowRight, RotateCcw,
  MousePointer, Hand, Star
} from 'lucide-react';
import { DashboardData, GenericDimData, TeamStats } from '../types';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';
import { calculateTeamStats } from '../services/dataService';

interface CaptainDraftStudyProps {
  data: DashboardData;
}

const normalize = (s: string | undefined | null) => (s || '').trim().toUpperCase();
const cleanKey = (s: string | undefined | null) => 
  s ? s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim() : "";

const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned, 10) || 0;
};

// Helper function to check if a role string indicates CPT / Capitão
const isCptRole = (roleStr: string | undefined | null) => {
  if (!roleStr) return false;
  const norm = normalize(roleStr);
  return norm.includes('CPT') || norm.includes('CAPITÃO') || norm.includes('CAPITAO') || norm.includes('CAP') || norm.includes('IGL') || norm.includes('LÍDER') || norm.includes('LIDER');
};

export const CaptainDraftStudy: React.FC<CaptainDraftStudyProps> = ({ data }) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'snake_draft'>('snake_draft');
  const [selectedCaptainTeam, setSelectedCaptainTeam] = useState<string>('');
  const [selectedCaptainPlayer, setSelectedCaptainPlayer] = useState<string>('');
  const [draftPicks, setDraftPicks] = useState<Record<string, string>>({}); // { teamName: playerName }
  const [allowOwnTeamInLatePicks, setAllowOwnTeamInLatePicks] = useState<boolean>(true);
  const [teamSearch, setTeamSearch] = useState<string>('');
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [squadsLayoutMode, setSquadsLayoutMode] = useState<'compact' | 'detailed' | 'grid_12'>('compact');

  // Drag & Drop State
  const [draggedPlayerName, setDraggedPlayerName] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ teamName: string; roundIdx: number } | null>(null);

  // Slot Picker Modal State
  const [slotPickerModal, setSlotPickerModal] = useState<{ teamName: string; roundIdx: number } | null>(null);
  const [slotModalSearch, setSlotModalSearch] = useState<string>('');
  const [slotModalRoleFilter, setSlotModalRoleFilter] = useState<string>('ALL');

  const handleOpenSlotPicker = (teamName: string, roundIdx: number) => {
    setSlotModalSearch('');
    setSlotModalRoleFilter('ALL');
    setSlotPickerModal({ teamName, roundIdx });
  };

  // 1. Calculate Standings for Fase Rumo ao Mundial (Bonus Points from Quali + Match Points in Rumo ao Mundial)
  const sortedTeamStandings = useMemo(() => {
    if (!data.details || data.details.length === 0) {
      const stats = calculateTeamStats(data);
      return stats.slice(0, 12);
    }

    const BONUS_TABLE = [50, 42, 35, 29, 24, 19, 15, 11, 8, 5, 2, 0];

    // 1. Qualificatória (Rodadas 1 a 14) to determine top 12 and bonus points
    const qualiDetails = data.details.filter(d => {
      const roundNum = parseInt(d.RD?.replace(/\D/g, '') || '0', 10) || 0;
      const confNorm = normalize(d.CONFRONTO);
      const rdNorm = normalize(d.RD);
      const isQualiText = confNorm.includes('CLASSIF') || confNorm.includes('QUALI') || rdNorm.includes('CLASSIF') || rdNorm.includes('FASE 1') || rdNorm.includes('1A FASE') || rdNorm.includes('1ª FASE');
      const isQualiRound = (!confNorm || (!confNorm.includes('MUNDIAL') && !confNorm.includes('RUMO') && !confNorm.includes('FINAL'))) && (roundNum === 0 || (roundNum >= 1 && roundNum <= 14));
      return isQualiText || isQualiRound;
    });

    const targetQualiDetails = qualiDetails.length > 0 ? qualiDetails : data.details;
    const qualiStats = calculateTeamStats({ ...data, details: targetQualiDetails });
    const top12Quali = qualiStats.slice(0, 12);

    const bonusMap = new Map<string, number>();
    top12Quali.forEach((t, idx) => {
      bonusMap.set(normalize(t.name), BONUS_TABLE[idx] ?? 0);
    });

    // 2. Rumo ao Mundial (Rodadas 15 a 20)
    const rumoDetails = data.details.filter(d => {
      const roundNum = parseInt(d.RD?.replace(/\D/g, '') || '0', 10) || 0;
      const confNorm = normalize(d.CONFRONTO);
      const rdNorm = normalize(d.RD);
      const isRumoText = confNorm.includes('RUMO') || confNorm.includes('MUNDIAL') || confNorm.includes('FASE 2') || confNorm.includes('2A FASE') || confNorm.includes('2ª FASE') || rdNorm.includes('RUMO') || rdNorm.includes('MUNDIAL');
      const isRumoRound = (!confNorm || (!confNorm.includes('CLASSIF') && !confNorm.includes('FINAL'))) && (roundNum >= 15 && roundNum <= 20);
      return isRumoText || isRumoRound;
    });

    const rumoStats = rumoDetails.length > 0 ? calculateTeamStats({ ...data, details: rumoDetails }) : [];
    const rumoMap = new Map<string, TeamStats>();
    rumoStats.forEach(s => rumoMap.set(normalize(s.name), s));

    // Combine for each of the 12 teams in Rumo ao Mundial
    const rumoStandings: TeamStats[] = top12Quali.map(qTeam => {
      const normN = normalize(qTeam.name);
      const bonus = bonusMap.get(normN) ?? 0;
      const rStats = rumoMap.get(normN);

      const rPts = rStats ? rStats.pts : 0;
      const rAbts = rStats ? rStats.abts : 0;
      const rPtsc = rStats ? rStats.ptsc : 0;
      const rB = rStats ? rStats.b : 0;
      const rS = rStats ? rStats.s : 0;

      const totalPts = rPts + bonus;

      return {
        ...qTeam,
        pts: totalPts,
        abts: rAbts > 0 ? rAbts : qTeam.abts,
        ptsc: rPtsc > 0 ? rPtsc : qTeam.ptsc,
        b: rB > 0 ? rB : qTeam.b,
        s: rS > 0 ? rS : qTeam.s,
        avgPts: rS > 0 ? parseFloat((totalPts / rS).toFixed(2)) : qTeam.avgPts,
        avgAbts: rS > 0 ? parseFloat((rAbts / rS).toFixed(2)) : qTeam.avgAbts,
        avgPtsc: rS > 0 ? parseFloat((rPtsc / rS).toFixed(2)) : qTeam.avgPtsc,
      };
    });

    // If top12Quali has less than 12 teams, pad with reference teams
    if (rumoStandings.length < 12) {
      const existing = new Set(rumoStandings.map(t => normalize(t.name)));
      (data.teamsReference || []).forEach(tr => {
        if (rumoStandings.length < 12 && !existing.has(normalize(tr.TIME))) {
          existing.add(normalize(tr.TIME));
          rumoStandings.push({
            name: tr.TIME,
            s: 0, b: 0, ptsc: 0, abts: 0, pts: 0,
            avgAbts: 0, avgPts: 0, avgPtsc: 0, percentPos: 0, percentAbts: 0, lastPos: 99
          });
        }
      });
    }

    // Sort by Total Points in Rumo ao Mundial (Bonus + Match Points) desc, then Booyahs, then Kills, then Placement Points
    rumoStandings.sort((a, b) => (b.pts - a.pts) || (b.b - a.b) || (b.abts - a.abts) || (b.ptsc - a.ptsc));

    return rumoStandings.slice(0, 12);
  }, [data]);

  // Helper to find dimension info with clean key fallback
  const findPlayerDim = (dims: GenericDimData[] = [], playerName: string = ''): GenericDimData | undefined => {
    if (!playerName) return undefined;
    const norm = normalize(playerName);
    const clean = cleanKey(playerName);

    let direct = dims.find(d => d && d.Name && normalize(d.Name) === norm);
    if (direct) return direct;

    direct = dims.find(d => d && d.Name && cleanKey(d.Name) === clean);
    if (direct) return direct;

    return dims.find(d => {
      if (!d || !d.Name) return false;
      const ck = cleanKey(d.Name);
      return ck && (ck.includes(clean) || clean.includes(ck));
    });
  };

  // Aggregate stats per player across data.players
  const playerStatsMap = useMemo(() => {
    const map = new Map<string, {
      name: string;
      team: string;
      kills: number;
      damage: number;
      knocks: number;
      assists: number;
      matches: number;
      mvp: number;
      role: string;
      role2?: string;
      isCpt: boolean;
      playerImg?: string;
      teamImg?: string;
    }>();

    (data.players || []).forEach(p => {
      if (!p.PLAYER) return;
      const nameKey = normalize(p.PLAYER);
      const teamName = p.TIME || 'SEM TIME';
      const dim = findPlayerDim(data.playersDimension, p.PLAYER);
      const role1 = dim?.Funcao || 'JOGADOR';
      const role2 = dim?.Funcao2 || '';
      const isCpt = isCptRole(role1) || isCptRole(role2);

      const existing = map.get(nameKey) || {
        name: p.PLAYER,
        team: teamName,
        kills: 0,
        damage: 0,
        knocks: 0,
        assists: 0,
        matches: 0,
        mvp: 0,
        role: role1,
        role2,
        isCpt,
        playerImg: findDimImg(data.playersDimension, p.PLAYER),
        teamImg: findTeamLogo(teamName, data.teamsReference)
      };

      existing.kills += parseNumber(p.Abates);
      existing.damage += parseNumber(p.Dano);
      existing.knocks += parseNumber(p.Deitados);
      existing.assists += parseNumber(p.Assistencias);
      existing.mvp += parseNumber(p.MVP);
      existing.matches += 1;

      map.set(nameKey, existing);
    });

    return map;
  }, [data.players, data.playersDimension, data.teamsReference]);

  // List of all unique teams with roster ordered by standings and All Star Captain names/photos
  const teamsWithRosters = useMemo(() => {
    const rosterMap = new Map<string, Array<{
      name: string;
      team: string;
      kills: number;
      damage: number;
      knocks: number;
      assists: number;
      matches: number;
      avgKills: number;
      avgDamage: number;
      mvp: number;
      role: string;
      role2?: string;
      isCpt: boolean;
      playerImg?: string;
      teamImg?: string;
    }>>();

    playerStatsMap.forEach(stat => {
      if (!stat.team) return;
      const list = rosterMap.get(normalize(stat.team)) || [];
      const avgKills = stat.matches > 0 ? Number((stat.kills / stat.matches).toFixed(1)) : 0;
      const avgDamage = stat.matches > 0 ? Math.round(stat.damage / stat.matches) : 0;

      list.push({
        ...stat,
        avgKills,
        avgDamage
      });
      rosterMap.set(normalize(stat.team), list);
    });

    // Map sorted standings to teamsWithRosters with All Star Team naming (e.g. TEAM TRAP) and Captain photo logo
    return sortedTeamStandings.map((st, idx) => {
      const normName = normalize(st.name);
      const roster = rosterMap.get(normName) || [];

      // Find player with explicit CPT role
      const cptPlayer = roster.find(p => p.isCpt);

      // Reorder roster: Captain (CPT) first, then rest by kills desc
      const otherPlayers = roster.filter(p => p.name !== cptPlayer?.name);
      otherPlayers.sort((a, b) => b.kills - a.kills);

      const finalRoster = cptPlayer ? [cptPlayer, ...otherPlayers] : otherPlayers;
      const captainPlayer = cptPlayer || finalRoster[0];

      const captainName = captainPlayer ? captainPlayer.name : st.name;
      const allStarTeamName = `TEAM ${captainName.toUpperCase()}`;
      const captainPhoto = captainPlayer ? (captainPlayer.playerImg || findDimImg(data.playersDimension, captainPlayer.name)) : undefined;

      return {
        rank: idx + 1,
        teamName: st.name,      // Original club name (e.g. LOUD, PAIN)
        allStarTeamName,        // All Star Name e.g. TEAM TRAP
        pts: st.pts || 0,
        abts: st.abts || 0,
        logo: findTeamLogo(st.name, data.teamsReference),
        roster: finalRoster,
        captainPlayer,
        captainPhoto
      };
    });
  }, [sortedTeamStandings, playerStatsMap, data.teamsReference, data.playersDimension]);

  // Auto select top ranked team and its CPT captain player initially
  useMemo(() => {
    if (!selectedCaptainTeam && teamsWithRosters.length > 0) {
      const firstTeam = teamsWithRosters[0];
      setSelectedCaptainTeam(firstTeam.teamName);
      const capP = firstTeam.captainPlayer || firstTeam.roster[0];
      if (capP) {
        setSelectedCaptainPlayer(capP.name);
      }
    }
  }, [teamsWithRosters, selectedCaptainTeam]);

  // Handle selecting Captain Team
  const handleSelectCaptainTeam = (teamName: string) => {
    setSelectedCaptainTeam(teamName);
    const teamObj = teamsWithRosters.find(t => t.teamName === teamName);
    if (teamObj && teamObj.captainPlayer) {
      setSelectedCaptainPlayer(teamObj.captainPlayer.name);
    } else if (teamObj && teamObj.roster.length > 0) {
      setSelectedCaptainPlayer(teamObj.roster[0].name);
    } else {
      setSelectedCaptainPlayer('');
    }
    setDraftPicks({});
  };

  // Eligible teams to draft from in individual tab
  const eligibleOpponentTeams = useMemo(() => {
    return teamsWithRosters.filter(t => t.teamName !== selectedCaptainTeam);
  }, [teamsWithRosters, selectedCaptainTeam]);

  // Filtered opponent teams by search
  const filteredOpponentTeams = useMemo(() => {
    if (!teamSearch.trim()) return eligibleOpponentTeams;
    const q = teamSearch.toLowerCase().trim();
    return eligibleOpponentTeams.filter(t => 
      t.teamName.toLowerCase().includes(q) ||
      t.allStarTeamName.toLowerCase().includes(q) ||
      t.roster.some(p => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
    );
  }, [eligibleOpponentTeams, teamSearch]);

  const handleSelectDraftPlayer = (teamName: string, playerName: string) => {
    setDraftPicks(prev => {
      const copy = { ...prev };
      if (!playerName) {
        delete copy[teamName];
      } else {
        copy[teamName] = playerName;
      }
      return copy;
    });
  };

  // Auto-fill draft picks in individual mode
  const handleAutoDraft = () => {
    const autoPicks: Record<string, string> = {};
    eligibleOpponentTeams.forEach(t => {
      const availablePlayers = t.roster.filter(p => p.name !== t.captainPlayer?.name);
      const choice = availablePlayers.length > 0 ? availablePlayers[0] : t.roster[0];
      if (choice) {
        autoPicks[t.teamName] = choice.name;
      }
    });
    setDraftPicks(autoPicks);
  };

  const handleClearDraft = () => {
    setDraftPicks({});
  };

  // Individual Captain Squad Array
  const draftedSquad = useMemo(() => {
    const squad: Array<{
      isCaptain: boolean;
      name: string;
      team: string;
      kills: number;
      damage: number;
      knocks: number;
      assists: number;
      matches: number;
      avgKills: number;
      avgDamage: number;
      mvp: number;
      role: string;
      isCpt: boolean;
      playerImg?: string;
      teamImg?: string;
    }> = [];

    // 1. Captain
    if (selectedCaptainPlayer) {
      const capStats = playerStatsMap.get(normalize(selectedCaptainPlayer));
      if (capStats) {
        squad.push({
          isCaptain: true,
          name: capStats.name,
          team: capStats.team,
          kills: capStats.kills,
          damage: capStats.damage,
          knocks: capStats.knocks,
          assists: capStats.assists,
          matches: capStats.matches,
          avgKills: capStats.matches > 0 ? Number((capStats.kills / capStats.matches).toFixed(1)) : 0,
          avgDamage: capStats.matches > 0 ? Math.round(capStats.damage / capStats.matches) : 0,
          mvp: capStats.mvp,
          role: capStats.role || 'CAPITÃO (CPT)',
          isCpt: true,
          playerImg: capStats.playerImg,
          teamImg: capStats.teamImg
        });
      }
    }

    // 2. Drafted Players
    Object.entries(draftPicks).forEach(([_, pName]) => {
      const pStats = playerStatsMap.get(normalize(pName as string));
      if (pStats) {
        squad.push({
          isCaptain: false,
          name: pStats.name,
          team: pStats.team,
          kills: pStats.kills,
          damage: pStats.damage,
          knocks: pStats.knocks,
          assists: pStats.assists,
          matches: pStats.matches,
          avgKills: pStats.matches > 0 ? Number((pStats.kills / pStats.matches).toFixed(1)) : 0,
          avgDamage: pStats.matches > 0 ? Math.round(pStats.damage / pStats.matches) : 0,
          mvp: pStats.mvp,
          role: pStats.role || 'DRAFT',
          isCpt: pStats.isCpt,
          playerImg: pStats.playerImg,
          teamImg: pStats.teamImg
        });
      }
    });

    return squad;
  }, [selectedCaptainPlayer, draftPicks, playerStatsMap]);

  // Squad Analytics
  const squadAnalytics = useMemo(() => {
    if (draftedSquad.length === 0) {
      return { totalKills: 0, totalDamage: 0, totalKnocks: 0, totalAssists: 0, avgKills: 0 };
    }

    const totalKills = draftedSquad.reduce((acc, p) => acc + p.kills, 0);
    const totalDamage = draftedSquad.reduce((acc, p) => acc + p.damage, 0);
    const totalKnocks = draftedSquad.reduce((acc, p) => acc + p.knocks, 0);
    const totalAssists = draftedSquad.reduce((acc, p) => acc + p.assists, 0);
    const avgKills = Number((totalKills / draftedSquad.length).toFixed(1));

    return { totalKills, totalDamage, totalKnocks, totalAssists, avgKills };
  }, [draftedSquad]);

  // ----------------------------------------------------
  // SNAKE DRAFT SIMULATOR LOGIC (12 TEAMS x 3 ROUNDS OF PICKS = 4 PLAYERS EACH)
  // ----------------------------------------------------
  const [snakePicks, setSnakePicks] = useState<Record<string, string[]>>({}); // { teamName: [player1, player2, player3] }

  // Snake Order Generation: 
  // Round 1 (Pick 1-12): 1st -> 12th
  // Round 2 (Pick 13-24): 12th -> 1st
  // Round 3 (Pick 25-36): 1st -> 12th
  const snakeDraftOrder = useMemo(() => {
    const round1 = teamsWithRosters.map((t, idx) => ({ round: 1, pickNum: idx + 1, team: t }));
    const round2 = [...teamsWithRosters].reverse().map((t, idx) => ({ round: 2, pickNum: 12 + idx + 1, team: t }));
    const round3 = teamsWithRosters.map((t, idx) => ({ round: 3, pickNum: 24 + idx + 1, team: t }));
    return [...round1, ...round2, ...round3];
  }, [teamsWithRosters]);

  // Set of all currently drafted player names (including official CPT captains)
  const pickedPlayersSet = useMemo(() => {
    const set = new Set<string>();
    // Captains
    teamsWithRosters.forEach(t => {
      const capP = t.captainPlayer || t.roster[0];
      if (capP) {
        set.add(normalize(capP.name));
      }
    });
    // Drafted picks in snakePicks
    (Object.values(snakePicks) as string[][]).forEach(pList => {
      (pList || []).forEach(pName => {
        if (pName) set.add(normalize(pName));
      });
    });
    return set;
  }, [teamsWithRosters, snakePicks]);

  // Determine current active turn in Snake Draft
  const currentTurnInfo = useMemo(() => {
    let pickCount = 0;
    (Object.values(snakePicks) as string[][]).forEach(picks => {
      pickCount += (picks || []).filter(Boolean).length;
    });

    if (pickCount >= snakeDraftOrder.length) {
      return { isComplete: true, currentPick: null, pickNum: 36, round: 3, activeTeam: null };
    }

    const turn = snakeDraftOrder[pickCount];
    return {
      isComplete: false,
      currentPick: turn,
      pickNum: turn.pickNum,
      round: turn.round,
      activeTeam: turn.team
    };
  }, [snakePicks, snakeDraftOrder]);

  // Visual Chronological Pick Log State & Computation
  const [logFilter, setLogFilter] = useState<'ALL' | 'DONE' | 'PENDING'>('ALL');

  const chronologicalDraftLog = useMemo(() => {
    return snakeDraftOrder.map((item) => {
      const roundIdx = item.round - 1;
      const teamName = item.team.teamName;
      const pickedPlayerName = snakePicks[teamName]?.[roundIdx];
      const pickedPlayerStat = pickedPlayerName ? playerStatsMap.get(normalize(pickedPlayerName)) : null;

      const isCompleted = !!pickedPlayerName;
      const isCurrent = !currentTurnInfo.isComplete && currentTurnInfo.pickNum === item.pickNum;

      return {
        pickNum: item.pickNum,
        round: item.round,
        team: item.team,
        pickedPlayerName,
        pickedPlayerStat,
        isCompleted,
        isCurrent
      };
    });
  }, [snakeDraftOrder, snakePicks, playerStatsMap, currentTurnInfo]);

  const filteredDraftLog = useMemo(() => {
    if (logFilter === 'DONE') return chronologicalDraftLog.filter(l => l.isCompleted);
    if (logFilter === 'PENDING') return chronologicalDraftLog.filter(l => !l.isCompleted);
    return chronologicalDraftLog;
  }, [chronologicalDraftLog, logFilter]);

  const completedDraftPicksCount = useMemo(() => {
    return chronologicalDraftLog.filter(l => l.isCompleted).length;
  }, [chronologicalDraftLog]);

  // Pool of all available unpicked players (Only players from the 12 teams in Fase Rumo ao Mundial)
  const availablePlayersPool = useMemo(() => {
    const list: Array<{
      name: string;
      team: string;
      kills: number;
      damage: number;
      knocks: number;
      assists: number;
      matches: number;
      avgKills: number;
      avgDamage: number;
      role: string;
      isCpt: boolean;
      playerImg?: string;
      teamImg?: string;
    }> = [];

    const rumoTeamsSet = new Set(teamsWithRosters.map(t => normalize(t.teamName)));

    playerStatsMap.forEach(stat => {
      if (rumoTeamsSet.has(normalize(stat.team)) && !pickedPlayersSet.has(normalize(stat.name))) {
        const avgKills = stat.matches > 0 ? Number((stat.kills / stat.matches).toFixed(1)) : 0;
        const avgDamage = stat.matches > 0 ? Math.round(stat.damage / stat.matches) : 0;
        list.push({
          ...stat,
          avgKills,
          avgDamage
        });
      }
    });

    // Sort by kills desc
    list.sort((a, b) => b.kills - a.kills);
    return list;
  }, [playerStatsMap, pickedPlayersSet, teamsWithRosters]);

  // Flexible Role Matching Helper
  const isRoleMatch = (player: { role: string; role2?: string; isCpt: boolean }, filter: string) => {
    if (!filter || filter === 'ALL') return true;

    const fNorm = filter.trim().toUpperCase();
    const r1 = (player.role || '').toUpperCase();
    const r2 = (player.role2 || '').toUpperCase();
    const combined = `${r1} ${r2}`;
    const cleanCombined = combined.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // CAPITÃO / CPT / IGL Filter
    if (fNorm === 'CPT' || fNorm === 'CAPITÃO' || fNorm === 'CAPITAO' || fNorm === 'IGL') {
      return player.isCpt || cleanCombined.includes('CPT') || cleanCombined.includes('CAPITAO') || cleanCombined.includes('IGL') || cleanCombined.includes('LIDER') || cleanCombined.includes('CAP');
    }

    // RUSHER / RUSH Filter
    if (fNorm === 'RUSHER' || fNorm === 'RUSH') {
      return cleanCombined.includes('RUSH') || cleanCombined.includes('RUSHER') || cleanCombined.includes('ENTRY') || cleanCombined.includes('ATACANTE') || cleanCombined.includes('FRONTA');
    }

    // SUPORTE / SNIPER Filter
    if (fNorm === 'SUPORTE' || fNorm === 'SUP' || fNorm === 'SNIPER' || fNorm === 'SNIP') {
      return cleanCombined.includes('SUPORTE') || cleanCombined.includes('SUP') || cleanCombined.includes('SNIPER') || cleanCombined.includes('SNIP') || cleanCombined.includes('ATIRADOR');
    }

    // GRANADEIRO / BOMBA Filter
    if (fNorm === 'GRANADEIRO' || fNorm === 'GRAN' || fNorm === 'BOMBA') {
      return cleanCombined.includes('GRANADEIRO') || cleanCombined.includes('GRENADIER') || cleanCombined.includes('GRANADA') || cleanCombined.includes('GRAN') || cleanCombined.includes('BOMBA');
    }

    // CORINGA / FLEX Filter
    if (fNorm === 'CORINGA' || fNorm === 'FLEX') {
      return cleanCombined.includes('CORINGA') || cleanCombined.includes('FLEX') || cleanCombined.includes('APOIO');
    }

    const cleanFilter = fNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return cleanCombined.includes(cleanFilter);
  };

  // Filtered pool by search and role
  const filteredAvailablePool = useMemo(() => {
    return availablePlayersPool.filter(p => {
      const matchSearch = !poolSearch.trim() || 
        p.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
        p.team.toLowerCase().includes(poolSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(poolSearch.toLowerCase()) ||
        (p.role2 && p.role2.toLowerCase().includes(poolSearch.toLowerCase()));

      const matchRole = isRoleMatch(p, roleFilter);

      return matchSearch && matchRole;
    });
  }, [availablePlayersPool, poolSearch, roleFilter]);

  // Assign player to a team's specific pick slot
  const handlePickPlayerForTeam = (teamName: string, playerName: string, roundIdx?: number) => {
    setSnakePicks(prev => {
      const copy = { ...prev };
      const teamList = [...(copy[teamName] || [])];

      if (roundIdx !== undefined && roundIdx >= 0 && roundIdx < 3) {
        teamList[roundIdx] = playerName;
      } else {
        // Append to first empty slot
        if (teamList.length < 3) {
          teamList.push(playerName);
        } else {
          teamList[2] = playerName;
        }
      }

      copy[teamName] = teamList;
      return copy;
    });
  };

  // Remove player from a pick slot
  const handleRemovePick = (teamName: string, roundIdx: number) => {
    setSnakePicks(prev => {
      const copy = { ...prev };
      const teamList = [...(copy[teamName] || [])];
      teamList.splice(roundIdx, 1);
      copy[teamName] = teamList;
      return copy;
    });
  };

  // Pick Next Turn Automatically or Pick Selected Player for Current Turn
  const handlePickForCurrentTurn = (playerName?: string) => {
    if (currentTurnInfo.isComplete || !currentTurnInfo.activeTeam) return;

    const activeTeamName = currentTurnInfo.activeTeam.teamName;
    const currentRound = currentTurnInfo.round;

    let chosenName = playerName;

    if (!chosenName) {
      // Pick top available candidate
      const candidates = availablePlayersPool.filter(p => {
        if (currentRound < 3 && p.team === activeTeamName) return false;
        return true;
      });

      if (candidates.length > 0) {
        chosenName = candidates[0].name;
      } else {
        const fallbackCandidates = availablePlayersPool.filter(p => p.team === activeTeamName);
        if (fallbackCandidates.length > 0) {
          chosenName = fallbackCandidates[0].name;
        } else if (availablePlayersPool.length > 0) {
          chosenName = availablePlayersPool[0].name;
        }
      }
    }

    if (chosenName) {
      handlePickPlayerForTeam(activeTeamName, chosenName);
    }
  };

  // Automatically execute full snake draft
  const handleAutoSimulateSnakeDraft = () => {
    const pickedSet = new Set<string>();
    const newSnakePicks: Record<string, string[]> = {};

    // First: Lock CPT Captains in their respective team
    teamsWithRosters.forEach(t => {
      const capP = t.captainPlayer || t.roster[0];
      if (capP) {
        pickedSet.add(normalize(capP.name));
      }
      newSnakePicks[t.teamName] = [];
    });

    // Execute picks pick by pick
    snakeDraftOrder.forEach(({ round, team }) => {
      let choicePlayer: string | null = null;

      let candidates: Array<{ name: string; team: string; kills: number }> = [];
      teamsWithRosters.forEach(otherTeam => {
        // Can't pick player from own team in Round 1 & 2
        if (otherTeam.teamName === team.teamName && round < 3) return;

        otherTeam.roster.forEach(p => {
          if (!pickedSet.has(normalize(p.name))) {
            candidates.push({ name: p.name, team: p.team, kills: p.kills });
          }
        });
      });

      // Sort candidate by kills desc
      candidates.sort((a, b) => b.kills - a.kills);

      if (candidates.length > 0) {
        choicePlayer = candidates[0].name;
      } else if (round === 3) {
        // Fallback: If no other team candidates left, pick remaining players from captain's own team
        const ownRemaining = team.roster.filter(p => !pickedSet.has(normalize(p.name)));
        if (ownRemaining.length > 0) {
          choicePlayer = ownRemaining[0].name;
        }
      }

      if (choicePlayer) {
        pickedSet.add(normalize(choicePlayer));
        newSnakePicks[team.teamName].push(choicePlayer);
      }
    });

    setSnakePicks(newSnakePicks);
  };

  const handleClearSnakeDraft = () => {
    setSnakePicks({});
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, playerName: string) => {
    e.dataTransfer.setData('text/plain', playerName);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPlayerName(playerName);
  };

  const handleDragOver = (e: React.DragEvent, teamName: string, roundIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ teamName, roundIdx });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetTeamName: string, roundIdx: number) => {
    e.preventDefault();
    setDragOverTarget(null);
    const pName = e.dataTransfer.getData('text/plain') || draggedPlayerName;
    if (pName) {
      handlePickPlayerForTeam(targetTeamName, pName, roundIdx);
      setDraggedPlayerName(null);
    }
  };

  const selectedCaptainObj = teamsWithRosters.find(t => t.teamName === selectedCaptainTeam);
  const pickedCount = Object.keys(draftPicks).length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER - ALL STAR FREE FIRE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-950/60 via-purple-950/40 to-black border border-yellow-500/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/40 animate-pulse">
                <Star size={24} className="fill-black" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-yellow-300 bg-yellow-500/15 px-3.5 py-1 rounded-full border border-yellow-500/40 shadow-inner">
                🔥 ALL STAR FREE FIRE • Torneio de Capitães
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-amber-400 flex items-center gap-3">
              Draft All Star Free Fire
            </h2>
            <p className="text-sm text-gray-300 mt-1 max-w-3xl leading-relaxed">
              Cada equipe no <strong className="text-yellow-400">All Star Free Fire</strong> é batizada com o nome do seu capitão (ex: <strong className="text-yellow-300">TEAM TRAP</strong>) e utiliza a foto do capitão (função CPT) como logo oficial do time na disputa por serpenteamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-lg shadow-yellow-500/25 hover:scale-[1.02]"
            >
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>

        {/* RULE HIGHLIGHT BOX */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/50 border border-yellow-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <Crown size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-white uppercase block">Nomes Personalizados por Capitão</span>
              <span className="text-gray-400 text-[11px]">Os times recebem o nome e imagem oficial do seu capitão CPT (Ex: TEAM TRAP).</span>
            </div>
          </div>

          <div className="bg-black/50 border border-yellow-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <Shuffle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-white uppercase block">Sistema de Serpenteamento</span>
              <span className="text-gray-400 text-[11px]">R1: 1º ao 12º ➔ R2: 12º ao 1º ➔ R3: 1º ao 12º (Classificação Rumo ao Mundial).</span>
            </div>
          </div>

          <div className="bg-black/50 border border-purple-500/30 rounded-2xl p-3 flex items-start gap-2.5">
            <Hand size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-white uppercase block">Arrastar & Soltar Interativo</span>
              <span className="text-gray-400 text-[11px]">Arraste qualquer atleta disponível diretamente para o slot da equipe.</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-2 no-print">
        <button
          onClick={() => setActiveSubTab('snake_draft')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
            activeSubTab === 'snake_draft'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
              : 'bg-black/60 text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Shuffle size={16} />
          <span>Simulador All Star Free Fire (12 Equipes)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('individual')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
            activeSubTab === 'individual'
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
              : 'bg-black/60 text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <UserCheck size={16} />
          <span>Montar Meu Time All Star</span>
        </button>
      </div>

      {/* VIEW 1: SNAKE DRAFT SIMULATOR (12 CAPTAINS) + DRAG & DROP POOL */}
      {activeSubTab === 'snake_draft' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* CONTROLLER & TURN BAR */}
          <div className="bg-gradient-to-r from-black via-zinc-900 to-black border border-yellow-500/30 rounded-3xl p-5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 w-full md:w-auto">
              {currentTurnInfo.isComplete ? (
                <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/40 px-4 py-2.5 rounded-2xl text-green-400 font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 size={18} />
                  <span>Draft All Star Concluído (36 Picks Realizadas)</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2.5 rounded-2xl">
                  <span className="w-8 h-8 rounded-xl bg-yellow-500 text-black font-black text-xs flex items-center justify-center animate-pulse">
                    #{currentTurnInfo.pickNum}
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400 block">
                      Vez de Escolher • Rodada {currentTurnInfo.round}
                    </span>
                    <span className="text-sm font-black uppercase text-white flex items-center gap-2">
                      {currentTurnInfo.activeTeam?.captainPhoto && (
                        <img src={currentTurnInfo.activeTeam.captainPhoto} alt={currentTurnInfo.activeTeam.captainPlayer?.name} className="w-5 h-5 rounded-full object-cover border border-yellow-400" />
                      )}
                      <span className="text-yellow-400">{currentTurnInfo.activeTeam?.allStarTeamName}</span>
                      <span className="text-xs text-gray-400 font-normal">({currentTurnInfo.activeTeam?.captainPlayer?.name})</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end no-print">
              {!currentTurnInfo.isComplete && (
                <button
                  onClick={() => handlePickForCurrentTurn()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black transition-all shadow-lg shadow-yellow-500/20"
                >
                  <ArrowRight size={15} />
                  Pickar Próximo Turno
                </button>
              )}

              <button
                onClick={handleAutoSimulateSnakeDraft}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/20"
              >
                <Sparkles size={15} />
                Simular Draft Completo
              </button>

              {Object.keys(snakePicks).length > 0 && (
                <button
                  onClick={handleClearSnakeDraft}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all"
                >
                  <RotateCcw size={15} />
                  Reiniciar
                </button>
              )}
            </div>
          </div>

          {/* QUICK BADGES OF 12 ALL STAR CAPTAIN TEAMS */}
          <div className="space-y-3 bg-black/60 border border-white/10 rounded-3xl p-4 backdrop-blur-md">
            <span className="text-xs font-black uppercase tracking-wider text-yellow-400 block flex items-center gap-2">
              <Star size={14} className="fill-yellow-400" />
              Equipes All Star Free Fire (Fotos dos Capitães CPT)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {teamsWithRosters.map((teamObj) => (
                <div
                  key={teamObj.teamName}
                  className="bg-black/90 border border-white/15 rounded-2xl p-2.5 flex items-center gap-2.5 hover:border-yellow-500/50 transition-all"
                >
                  <div className="relative shrink-0">
                    {teamObj.captainPhoto ? (
                      <img src={teamObj.captainPhoto} alt={teamObj.captainPlayer?.name} className="w-8 h-8 rounded-xl object-cover border-2 border-yellow-400 shadow" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-400 font-black text-xs">
                        <Crown size={14} />
                      </div>
                    )}
                    {teamObj.logo && (
                      <img src={teamObj.logo} alt={teamObj.teamName} className="w-4 h-4 object-contain absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black uppercase text-yellow-400 truncate block">
                      {teamObj.allStarTeamName}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold block truncate">
                      Cap. {teamObj.captainPlayer?.name || 'N/D'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: AVAILABLE PLAYERS POOL (DRAGGABLE) */}
            <div className={`${squadsLayoutMode === 'grid_12' ? 'lg:col-span-12' : 'lg:col-span-3'} bg-black/80 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md transition-all no-print`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Hand size={18} className="text-yellow-400 animate-bounce" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">
                    Atletas Disponíveis ({filteredAvailablePool.length})
                  </h3>
                </div>
                <span className="text-[9px] bg-yellow-500/20 text-yellow-400 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                  Arraste
                </span>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar atleta ou time..."
                    value={poolSearch}
                    onChange={(e) => setPoolSearch(e.target.value)}
                    className="w-full bg-black/90 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 font-bold"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-black uppercase">
                  {['ALL', 'RUSH', 'BOMBA', 'SNIPER', 'CPT', 'CORINGA'].map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                        roleFilter === role
                          ? 'bg-yellow-500 text-black font-black'
                          : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCROLLABLE DRAGGABLE PLAYER LIST */}
              <div className={
                squadsLayoutMode === 'grid_12'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar"
                  : "max-h-[680px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
              }>
                {filteredAvailablePool.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs font-bold col-span-full">
                    Nenhum jogador disponível no filtro.
                  </div>
                ) : (
                  filteredAvailablePool.map(player => (
                    <div
                      key={player.name}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, player.name)}
                      className="group relative bg-black/90 hover:bg-yellow-500/10 border border-white/10 hover:border-yellow-500/50 rounded-2xl p-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] shadow-md"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {player.playerImg ? (
                          <img
                            src={player.playerImg}
                            alt={player.name}
                            className="w-9 h-9 rounded-xl object-cover border border-white/20 shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-black text-xs shrink-0">
                            <Users size={14} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black uppercase text-white truncate group-hover:text-yellow-400">
                              {player.name}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 font-bold truncate flex items-center gap-1">
                            {player.teamImg && (
                              <img src={player.teamImg} alt={player.team} className="w-3 h-3 object-contain shrink-0" />
                            )}
                            <span>{player.team} • {player.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <div className="text-right">
                          <span className="text-xs font-black text-amber-400 block">{player.kills} K</span>
                          <span className="text-[8px] text-gray-400 font-bold">{player.avgDamage} D</span>
                        </div>

                        {/* Direct Click Pick Button */}
                        {!currentTurnInfo.isComplete && (
                          <button
                            onClick={() => handlePickForCurrentTurn(player.name)}
                            title="Pickar para o turno atual"
                            className="p-1 rounded-xl bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/40 transition-all"
                          >
                            <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CENTER MAIN AREA: 12 ALL STAR SQUADS DRAFT BOARD (DROP TARGETS) */}
            <div className={`${squadsLayoutMode === 'grid_12' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-6 transition-all`}>
              <div className="bg-black/60 border border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-black uppercase italic text-white flex items-center gap-2">
                      <Star className="text-yellow-400 fill-yellow-400" size={18} />
                      Grade All Star Free Fire (12 Equipes)
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Times nomeados pelo capitão CPT (ex: TEAM TRAP) com a foto do líder.
                    </p>
                  </div>

                  {/* LAYOUT MODE TOGGLES (SEM ROLAR) */}
                  <div className="flex items-center gap-1 bg-black/80 border border-white/10 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                    <button
                      onClick={() => setSquadsLayoutMode('compact')}
                      title="Visão compacta sem rolar a tela"
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        squadsLayoutMode === 'compact'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Layers size={12} />
                      <span>Sem Rolar</span>
                    </button>

                    <button
                      onClick={() => setSquadsLayoutMode('grid_12')}
                      title="Visão Matriz Tabela (4 Colunas - Tela Cheia)"
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        squadsLayoutMode === 'grid_12'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChart2 size={12} />
                      <span>Matriz (12)</span>
                    </button>

                    <button
                      onClick={() => setSquadsLayoutMode('detailed')}
                      title="Visão Cards Ampliados"
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        squadsLayoutMode === 'detailed'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Users size={12} />
                      <span>Expandido</span>
                    </button>
                  </div>
                </div>

                {/* 12 SQUADS GRID */}
                <div className={`grid gap-2.5 ${
                  squadsLayoutMode === 'compact'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : squadsLayoutMode === 'grid_12'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 gap-3.5'
                }`}>
                  {teamsWithRosters.map((teamObj) => {
                    const captainPlayer = teamObj.captainPlayer || teamObj.roster[0];
                    const draftedPicksList = snakePicks[teamObj.teamName] || [];
                    const isTurnActive = currentTurnInfo.activeTeam?.teamName === teamObj.teamName;

                    let totalSquadKills = captainPlayer ? captainPlayer.kills : 0;
                    draftedPicksList.forEach(pName => {
                      const stat = playerStatsMap.get(normalize(pName));
                      if (stat) totalSquadKills += stat.kills;
                    });

                    const isCompactMode = squadsLayoutMode === 'compact' || squadsLayoutMode === 'grid_12';

                    return (
                      <div
                        key={teamObj.teamName}
                        className={`bg-black/80 border rounded-2xl ${
                          isCompactMode ? 'p-2 space-y-1.5' : 'p-3.5 space-y-2.5'
                        } transition-all shadow-xl relative ${
                          isTurnActive
                            ? 'border-yellow-400 ring-2 ring-yellow-400/40 shadow-yellow-500/20 bg-yellow-950/10'
                            : 'border-white/15 hover:border-yellow-500/40'
                        }`}
                      >
                        {/* All Star Team Header with Captain Photo Logo */}
                        <div className={`flex items-center justify-between border-b border-white/10 ${
                          isCompactMode ? 'pb-1.5' : 'pb-2.5'
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Captain Photo as Team Logo Avatar */}
                            <div className="relative shrink-0">
                              {teamObj.captainPhoto ? (
                                <img
                                  src={teamObj.captainPhoto}
                                  alt={captainPlayer?.name}
                                  className={`${
                                    isCompactMode ? 'w-7 h-7 rounded-xl' : 'w-10 h-10 rounded-2xl'
                                  } object-cover border-2 border-yellow-400 shadow-md`}
                                />
                              ) : (
                                <div className={`${
                                  isCompactMode ? 'w-7 h-7 rounded-xl' : 'w-10 h-10 rounded-2xl'
                                } bg-gradient-to-br from-yellow-500 to-amber-600 border-2 border-yellow-400 flex items-center justify-center text-black font-black`}>
                                  <Crown size={isCompactMode ? 13 : 18} />
                                </div>
                              )}
                              {teamObj.logo && (
                                <img
                                  src={teamObj.logo}
                                  alt={teamObj.teamName}
                                  className={`${
                                    isCompactMode ? 'w-3 h-3' : 'w-4 h-4'
                                  } object-contain absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/30 shadow`}
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className={`${
                                isCompactMode ? 'text-[11px]' : 'text-xs'
                              } font-black uppercase text-yellow-400 flex items-center gap-1 truncate`}>
                                <span className="truncate">{teamObj.allStarTeamName}</span>
                              </div>
                              <span className="text-[8px] sm:text-[9px] text-gray-300 font-bold block truncate">
                                Cap. {captainPlayer?.name || 'N/D'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-0.5 shrink-0 ml-1">
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-yellow-500/20 text-yellow-400 font-black text-[9px] sm:text-[10px] flex items-center justify-center border border-yellow-500/30">
                              #{teamObj.rank}
                            </span>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 px-1 py-0.2 rounded text-[8px] font-black text-amber-300">
                              🔥 {totalSquadKills} K
                            </div>
                          </div>
                        </div>

                        {/* Roster of 4 Players */}
                        <div className="space-y-1">
                          {/* Slot 1: Official CPT Captain */}
                          <div className={`bg-gradient-to-r from-yellow-500/25 via-amber-500/10 to-black border border-yellow-500/40 rounded-xl ${
                            isCompactMode ? 'p-1 text-[10px]' : 'p-1.5 text-xs'
                          } flex items-center justify-between`}>
                            <div className="flex items-center gap-1 min-w-0">
                              <Crown size={isCompactMode ? 11 : 13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                              <div className="min-w-0 flex items-center gap-1">
                                <span className="font-black text-yellow-400 uppercase truncate text-[10px] sm:text-[11px]">
                                  {captainPlayer?.name || 'N/D'}
                                </span>
                                <span className="text-[7px] bg-yellow-500 text-black px-1 rounded font-black shrink-0">CPT</span>
                              </div>
                            </div>
                            <span className="font-black text-white text-[10px] sm:text-[11px] shrink-0 ml-1">{captainPlayer?.kills || 0} K</span>
                          </div>

                          {/* Slots 2, 3, 4: Drafted Picks (Click or Drop Targets) */}
                          {[0, 1, 2].map((roundIdx) => {
                            const pickName = draftedPicksList[roundIdx];
                            const pickStat = pickName ? playerStatsMap.get(normalize(pickName)) : null;
                            const isOver = dragOverTarget?.teamName === teamObj.teamName && dragOverTarget?.roundIdx === roundIdx;

                            return (
                              <div
                                key={roundIdx}
                                onClick={() => handleOpenSlotPicker(teamObj.teamName, roundIdx)}
                                onDragOver={(e) => handleDragOver(e, teamObj.teamName, roundIdx)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, teamObj.teamName, roundIdx)}
                                title="Clique para selecionar atleta ou arraste um atleta disponível"
                                className={`rounded-xl cursor-pointer ${
                                  isCompactMode ? 'p-1 text-[10px]' : 'p-1.5 text-xs'
                                } flex items-center justify-between border transition-all group ${
                                  isOver
                                    ? 'border-yellow-400 bg-yellow-500/30 ring-2 ring-yellow-400 shadow-lg scale-[1.02]'
                                    : pickStat
                                    ? 'bg-black/90 border-white/20 hover:border-yellow-400/60 hover:bg-black'
                                    : 'bg-black/30 border-dashed border-white/15 text-gray-500 hover:border-yellow-500/70 hover:bg-yellow-500/10'
                                }`}
                              >
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="text-[7px] font-black uppercase bg-white/10 px-1 py-0.2 rounded text-gray-400 shrink-0">
                                    R{roundIdx + 1}
                                  </span>

                                  {pickStat ? (
                                    <div className="min-w-0 flex items-center gap-1">
                                      <span className="font-black text-white uppercase text-[10px] sm:text-[11px] truncate group-hover:text-yellow-300">
                                        {pickStat.name}
                                      </span>
                                      {!isCompactMode && (
                                        <span className="text-[8px] text-gray-400 font-bold truncate">
                                          • {pickStat.team}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 group-hover:text-yellow-300 text-[8px] sm:text-[9px] italic flex items-center gap-1 truncate font-medium">
                                      <MousePointer size={9} className="text-yellow-400 shrink-0" />
                                      {isOver ? 'Solte...' : 'Clique ou Arraste...'}
                                    </span>
                                  )}
                                </div>

                                {pickStat ? (
                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <span className="font-black text-amber-300 text-[10px] sm:text-[11px]">
                                      {pickStat.kills} K
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePick(teamObj.teamName, roundIdx);
                                      }}
                                      title="Remover pick"
                                      className="text-gray-500 hover:text-red-400 transition-colors p-0.5 text-[9px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[7px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 py-0.2 rounded font-black uppercase group-hover:bg-yellow-500 group-hover:text-black">
                                    + Slot
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: VISUAL DRAFT PICK LOG (CHRONOLOGICAL FEED) */}
            <div className={`${squadsLayoutMode === 'grid_12' ? 'lg:col-span-12' : 'lg:col-span-3'} bg-black/80 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-md transition-all no-print`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ListOrdered size={18} className="text-yellow-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-black uppercase text-white tracking-wider truncate">
                      Log Visual das Escolhas
                    </h3>
                    <span className="text-[9px] text-gray-400 font-bold block truncate">
                      Ordem Cronológica do Serpenteamento
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 font-black px-2 py-0.5 rounded-full border border-yellow-500/30 shrink-0">
                  {completedDraftPicksCount}/36
                </span>
              </div>

              {/* LOG FILTER BUTTONS */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl text-[9px] font-black uppercase">
                <button
                  onClick={() => setLogFilter('ALL')}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    logFilter === 'ALL' ? 'bg-yellow-500 text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Todas (36)
                </button>
                <button
                  onClick={() => setLogFilter('DONE')}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    logFilter === 'DONE' ? 'bg-yellow-500 text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Feitas ({completedDraftPicksCount})
                </button>
                <button
                  onClick={() => setLogFilter('PENDING')}
                  className={`flex-1 py-1 rounded-lg transition-all text-center ${
                    logFilter === 'PENDING' ? 'bg-yellow-500 text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Pendentes ({36 - completedDraftPicksCount})
                </button>
              </div>

              {/* SCROLLABLE CHRONOLOGICAL PICK LOG */}
              <div className={
                squadsLayoutMode === 'grid_12'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar"
                  : "max-h-[680px] overflow-y-auto space-y-2 pr-1 custom-scrollbar"
              }>
                {filteredDraftLog.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs font-bold col-span-full">
                    Nenhum registro encontrado no filtro.
                  </div>
                ) : (
                  filteredDraftLog.map((logItem) => (
                    <div
                      key={logItem.pickNum}
                      className={`rounded-2xl p-2.5 border transition-all text-xs ${
                        logItem.isCurrent
                          ? 'bg-yellow-500/15 border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/10'
                          : logItem.isCompleted
                          ? 'bg-black/90 border-white/15 hover:border-yellow-500/40'
                          : 'bg-black/40 border-dashed border-white/10 opacity-60'
                      }`}
                    >
                      {/* Pick Number & Round Tag Header */}
                      <div className="flex items-center justify-between mb-1.5 border-b border-white/10 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                            logItem.isCurrent
                              ? 'bg-yellow-400 text-black animate-pulse font-black'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            Pick #{logItem.pickNum}
                          </span>
                          <span className="text-[9px] text-gray-300 font-bold">
                            Rodada {logItem.round} {logItem.round === 2 ? '🔄' : ''}
                          </span>
                        </div>

                        {logItem.isCompleted ? (
                          <span className="text-[8px] text-green-400 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Concluída
                          </span>
                        ) : logItem.isCurrent ? (
                          <span className="text-[8px] text-yellow-400 font-bold animate-pulse">
                            ⚡ Vez do Pick
                          </span>
                        ) : (
                          <span className="text-[8px] text-gray-500 italic">Pendente</span>
                        )}
                      </div>

                      {/* Captain Team Info & Pick Choice Statement */}
                      <div className="flex items-start gap-2">
                        {logItem.team.captainPhoto ? (
                          <img
                            src={logItem.team.captainPhoto}
                            alt={logItem.team.allStarTeamName}
                            className="w-7 h-7 rounded-xl object-cover border border-yellow-400 shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shrink-0 font-black text-[10px]">
                            <Crown size={12} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-300 text-[10px] leading-tight truncate">
                            <span className="text-yellow-400 font-black">{logItem.team.allStarTeamName}</span>
                            <span className="text-gray-400 text-[9px] font-normal"> ({logItem.team.captainPlayer?.name || 'CPT'})</span>
                          </div>

                          {logItem.isCompleted && logItem.pickedPlayerStat ? (
                            <div className="mt-1 bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="text-[8px] text-gray-400 uppercase font-bold block leading-none">
                                  Rodada {logItem.round}: escolheu
                                </span>
                                <span className="text-[11px] font-black text-white uppercase truncate block mt-0.5">
                                  {logItem.pickedPlayerStat.name}
                                </span>
                                <span className="text-[8px] text-gray-400 font-bold block truncate">
                                  {logItem.pickedPlayerStat.team} • {logItem.pickedPlayerStat.role}
                                </span>
                              </div>
                              <div className="text-right shrink-0 ml-1">
                                <span className="text-[11px] font-black text-amber-300 block">{logItem.pickedPlayerStat.kills} K</span>
                                <span className="text-[7px] text-gray-400 font-bold">{logItem.pickedPlayerStat.avgDamage} Dano</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-500 italic block mt-0.5">
                              Aguardando escolha da Rodada {logItem.round}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL CAPTAIN SQUAD DRAFT */}
      {activeSubTab === 'individual' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* STEP 1: SELECT CAPTAIN & TEAM */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black text-sm">
                01
              </span>
              <div>
                <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                  Escolher Equipe All Star & Capitão (Função CPT)
                </h3>
                <p className="text-xs text-gray-400">
                  O capitão da equipe é identificado automaticamente pela função CPT na base de dados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {/* Captain Team Picker */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-yellow-400 block mb-2">
                  Equipe All Star Free Fire
                </label>
                <select
                  value={selectedCaptainTeam}
                  onChange={(e) => handleSelectCaptainTeam(e.target.value)}
                  className="w-full bg-black/80 border border-yellow-500/40 rounded-2xl px-4 py-3 text-sm text-yellow-400 font-black focus:outline-none focus:border-yellow-400"
                >
                  {teamsWithRosters.map(t => (
                    <option key={t.teamName} value={t.teamName}>
                      #{t.rank} {t.allStarTeamName} (Capitão: {t.captainPlayer?.name || 'N/D'}) • Base: {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Captain Player Picker */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Capitão Oficial
                </label>
                <select
                  value={selectedCaptainPlayer}
                  onChange={(e) => setSelectedCaptainPlayer(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-yellow-500"
                >
                  {(teamsWithRosters.find(t => t.teamName === selectedCaptainTeam)?.roster || []).map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} • {p.role} {p.isCpt ? '[CPT OFICIAL]' : ''} ({p.kills} Kills)
                    </option>
                  ))}
                </select>
              </div>

              {/* Captain Card Preview */}
              {selectedCaptainPlayer && (
                <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-black border border-yellow-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                  {findDimImg(data.playersDimension, selectedCaptainPlayer) ? (
                    <img
                      src={findDimImg(data.playersDimension, selectedCaptainPlayer)}
                      alt={selectedCaptainPlayer}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-400 shadow-md"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-black">
                      <Crown size={22} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-yellow-400 truncate">
                        {selectedCaptainPlayer}
                      </span>
                      <span className="text-[9px] font-black uppercase bg-yellow-500 text-black px-1.5 py-0.2 rounded">
                        CPT Capitão
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 truncate mt-0.5">
                      TEAM {selectedCaptainPlayer.toUpperCase()} • {playerStatsMap.get(normalize(selectedCaptainPlayer))?.role || 'CPT'}
                    </div>
                    <div className="text-[10px] font-black text-amber-300 mt-1">
                      🔥 {playerStatsMap.get(normalize(selectedCaptainPlayer))?.kills || 0} Abates Totais
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DRAFTED TEAM SUMMARY BOARD */}
          {draftedSquad.length > 0 && (
            <div className="bg-gradient-to-b from-yellow-950/20 via-black to-black border border-yellow-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-400" />
                    <h3 className="text-xl font-black uppercase italic text-white">
                      Lineup All Star ({draftedSquad.length} Atletas)
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Capitão CPT do TEAM {selectedCaptainPlayer.toUpperCase()} + Atletas Drafteados.
                  </p>
                </div>

                {/* Quick Metrics Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Abates Combinados</span>
                    <span className="text-lg font-black text-yellow-400">{squadAnalytics.totalKills}</span>
                  </div>
                  <div className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Dano Total</span>
                    <span className="text-lg font-black text-amber-300">{squadAnalytics.totalDamage.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-black/60 border border-white/10 rounded-2xl px-3.5 py-2">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Deitados (Knocks)</span>
                    <span className="text-lg font-black text-cyan-300">{squadAnalytics.totalKnocks}</span>
                  </div>
                </div>
              </div>

              {/* Player Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {draftedSquad.map((player, idx) => (
                  <div
                    key={`${player.team}-${player.name}`}
                    className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                      player.isCaptain 
                        ? 'bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-black border-yellow-400 shadow-xl shadow-yellow-500/10 scale-[1.02]' 
                        : 'bg-black/80 border-white/10 hover:border-yellow-500/40'
                    }`}
                  >
                    {/* Captain Badge */}
                    {player.isCaptain && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Crown size={11} className="fill-black" />
                        Capitão CPT
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      {player.playerImg ? (
                        <img
                          src={player.playerImg}
                          alt={player.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-black text-sm">
                          #{idx + 1}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-black uppercase text-white truncate flex items-center gap-1.5">
                          {player.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold mt-0.5 truncate">
                          {player.teamImg && (
                            <img src={player.teamImg} alt={player.team} className="w-3.5 h-3.5 object-contain" />
                          )}
                          <span>{player.team}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center">
                      <div className="bg-black/50 rounded-xl p-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Abates</span>
                        <span className="text-sm font-black text-yellow-400">{player.kills}</span>
                      </div>
                      <div className="bg-black/50 rounded-xl p-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Média / Queda</span>
                        <span className="text-sm font-black text-amber-300">{player.avgKills}</span>
                      </div>
                      <div className="bg-black/50 rounded-xl p-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Dano Médio</span>
                        <span className="text-sm font-black text-cyan-300">{player.avgDamage}</span>
                      </div>
                      <div className="bg-black/50 rounded-xl p-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Função</span>
                        <span className="text-[10px] font-black text-purple-300 uppercase truncate block">
                          {player.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: DRAFT 1 PLAYER FROM EACH OPPONENT TEAM */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black text-sm">
                  02
                </span>
                <div>
                  <h3 className="text-lg font-black uppercase italic text-white flex items-center gap-2">
                    Escolha de Atletas por Equipe
                  </h3>
                  <p className="text-xs text-gray-400">
                    Selecione os atletas para integrar a sua equipe drafteada.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoDraft}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/30 transition-all"
                >
                  <Sparkles size={14} />
                  Auto Pick
                </button>
                {pickedCount > 0 && (
                  <button
                    onClick={handleClearDraft}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all"
                  >
                    <RefreshCw size={14} />
                    Limpar
                  </button>
                )}
                <div className="relative w-full sm:w-52">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* RULE CHECKBOX / TOGGLE */}
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-purple-300 font-bold">
                <ShieldAlert size={18} className="shrink-0 text-purple-400" />
                <span>
                  <strong>Regra de Sobra de Atletas:</strong> Se os jogadores do seu próprio time (<strong className="text-white uppercase">{selectedCaptainTeam}</strong>) sobrarem nas últimas escolhas, você poderá selecioná-los.
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/40 text-purple-200 font-black text-[11px] shrink-0">
                <input
                  type="checkbox"
                  checked={allowOwnTeamInLatePicks}
                  onChange={(e) => setAllowOwnTeamInLatePicks(e.target.checked)}
                  className="rounded text-purple-500 focus:ring-0"
                />
                <span>Permitir Próprio Time se Sobrar</span>
              </label>
            </div>

            {/* OPPONENT TEAMS DRAFT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpponentTeams.map((teamObj) => {
                const currentPick = draftPicks[teamObj.teamName];
                const pickedPlayerStats = teamObj.roster.find(p => p.name === currentPick);

                return (
                  <div
                    key={teamObj.teamName}
                    className={`bg-black/80 border rounded-2xl p-4 transition-all duration-300 ${
                      currentPick
                        ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-white/10 text-gray-300 text-[10px] font-black flex items-center justify-center">
                          #{teamObj.rank}
                        </span>
                        {teamObj.captainPhoto ? (
                          <img src={teamObj.captainPhoto} alt={teamObj.allStarTeamName} className="w-6 h-6 rounded-md object-cover border border-yellow-400" />
                        ) : teamObj.logo ? (
                          <img src={teamObj.logo} alt={teamObj.teamName} className="w-6 h-6 object-contain" />
                        ) : null}
                        <div>
                          <span className="text-xs font-black uppercase text-yellow-400 block leading-tight">
                            {teamObj.allStarTeamName}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold block">
                            {teamObj.teamName}
                          </span>
                        </div>
                      </div>

                      {currentPick ? (
                        <span className="px-2.5 py-1 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {currentPick}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                          Pendente
                        </span>
                      )}
                    </div>

                    {/* Player Select Dropdown */}
                    <div className="space-y-2">
                      <select
                        value={currentPick || ''}
                        onChange={(e) => handleSelectDraftPlayer(teamObj.teamName, e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-yellow-500"
                      >
                        <option value="">-- Nenhum atleta selecionado --</option>
                        {teamObj.roster.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} • {p.kills} Kills ({p.role}) {p.isCpt ? '[CPT]' : ''}
                          </option>
                        ))}
                      </select>

                      {/* Picked Player Stats Highlight */}
                      {pickedPlayerStats && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs mt-2">
                          <div className="flex items-center gap-2">
                            {pickedPlayerStats.playerImg && (
                              <img src={pickedPlayerStats.playerImg} alt={pickedPlayerStats.name} className="w-8 h-8 rounded-lg object-cover" />
                            )}
                            <div>
                              <span className="font-black text-yellow-400 uppercase block">{pickedPlayerStats.name}</span>
                              <span className="text-[10px] text-gray-400 font-bold">{pickedPlayerStats.role}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-white block">{pickedPlayerStats.kills} Abates</span>
                            <span className="text-[10px] font-bold text-amber-300">Dano: {pickedPlayerStats.avgDamage}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SLOT PLAYER SELECTION MODAL */}
      {slotPickerModal && (() => {
        const targetTeam = teamsWithRosters.find(t => t.teamName === slotPickerModal.teamName);
        if (!targetTeam) return null;

        const currentPickName = snakePicks[slotPickerModal.teamName]?.[slotPickerModal.roundIdx];
        const currentPickStat = currentPickName ? playerStatsMap.get(normalize(currentPickName)) : null;

        // Filter available players or currently picked player in this slot
        const candidatePlayers = availablePlayersPool.filter(p => {
          const matchSearch = !slotModalSearch.trim() ||
            p.name.toLowerCase().includes(slotModalSearch.toLowerCase()) ||
            p.team.toLowerCase().includes(slotModalSearch.toLowerCase()) ||
            p.role.toLowerCase().includes(slotModalSearch.toLowerCase());

          const matchRole = isRoleMatch(p, slotModalRoleFilter);
          return matchSearch && matchRole;
        });

        // Include current pick in candidates list if filtered
        if (currentPickStat && !candidatePlayers.some(p => normalize(p.name) === normalize(currentPickStat.name))) {
          if (isRoleMatch(currentPickStat, slotModalRoleFilter)) {
            const matchSearch = !slotModalSearch.trim() ||
              currentPickStat.name.toLowerCase().includes(slotModalSearch.toLowerCase()) ||
              currentPickStat.team.toLowerCase().includes(slotModalSearch.toLowerCase()) ||
              currentPickStat.role.toLowerCase().includes(slotModalSearch.toLowerCase());
            if (matchSearch) {
              const avgKills = currentPickStat.matches > 0 ? Number((currentPickStat.kills / currentPickStat.matches).toFixed(1)) : 0;
              const avgDamage = currentPickStat.matches > 0 ? Math.round(currentPickStat.damage / currentPickStat.matches) : 0;
              candidatePlayers.unshift({
                ...currentPickStat,
                avgKills,
                avgDamage
              });
            }
          }
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 no-print">
            <div className="bg-zinc-950 border border-yellow-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 bg-gradient-to-r from-yellow-950/50 via-black to-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {targetTeam.captainPhoto ? (
                    <img src={targetTeam.captainPhoto} alt={targetTeam.allStarTeamName} className="w-12 h-12 rounded-2xl object-cover border-2 border-yellow-400 shadow-md" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500 text-black flex items-center justify-center font-black">
                      <Crown size={24} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-yellow-400 bg-yellow-500/15 px-2.5 py-0.5 rounded-full border border-yellow-500/30">
                        SELECIONAR JOGADOR • RODADA {slotPickerModal.roundIdx + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic mt-0.5 flex items-center gap-2">
                      <span>{targetTeam.allStarTeamName}</span>
                      <span className="text-xs font-bold text-gray-400">({targetTeam.teamName})</span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSlotPickerModal(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Filters */}
              <div className="p-4 border-b border-white/10 space-y-3 bg-black/40">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por nome do atleta, time ou função..."
                    value={slotModalSearch}
                    onChange={(e) => setSlotModalSearch(e.target.value)}
                    className="w-full bg-black/80 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Role Filter Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase">
                  {[
                    { id: 'ALL', label: 'Todos Atletas' },
                    { id: 'RUSHER', label: '⚔️ Rush' },
                    { id: 'BOMBA', label: '💣 Bomba' },
                    { id: 'SNIPER', label: '🎯 Sniper' },
                    { id: 'CORINGA', label: '🃏 Coringa' },
                    { id: 'CPT', label: '👑 Cpt / IGL' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSlotModalRoleFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        slotModalRoleFilter === f.id
                          ? 'bg-yellow-500 text-black shadow-md font-black'
                          : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Player Candidates List */}
              <div className="p-4 flex-1 overflow-y-auto space-y-2 max-h-[420px]">
                {currentPickStat && (
                  <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-yellow-400 uppercase">Slot Atual:</span>
                      <span className="text-sm font-black text-white uppercase">{currentPickStat.name} ({currentPickStat.team})</span>
                    </div>
                    <button
                      onClick={() => {
                        handleRemovePick(slotPickerModal.teamName, slotPickerModal.roundIdx);
                        setSlotPickerModal(null);
                      }}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-black uppercase transition-all"
                    >
                      Remover Jogador do Slot
                    </button>
                  </div>
                )}

                {candidatePlayers.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs font-bold">
                    Nenhum jogador disponível encontrado para os filtros aplicados.
                  </div>
                ) : (
                  candidatePlayers.map((player) => {
                    const isCurrentSelected = currentPickName && normalize(currentPickName) === normalize(player.name);

                    return (
                      <div
                        key={player.name}
                        onClick={() => {
                          handlePickPlayerForTeam(slotPickerModal.teamName, player.name, slotPickerModal.roundIdx);
                          setSlotPickerModal(null);
                        }}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                          isCurrentSelected
                            ? 'bg-yellow-500/20 border-yellow-400 ring-1 ring-yellow-400'
                            : 'bg-black/60 hover:bg-yellow-500/10 border-white/10 hover:border-yellow-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {player.playerImg ? (
                            <img src={player.playerImg} alt={player.name} className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-black shrink-0">
                              <Users size={16} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase text-white group-hover:text-yellow-400 truncate">
                                {player.name}
                              </span>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-amber-300 shrink-0">
                                {player.role}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 mt-0.5">
                              {player.teamImg && <img src={player.teamImg} alt={player.team} className="w-3.5 h-3.5 object-contain" />}
                              <span>{player.team}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400 block">{player.kills} Kills</span>
                            <span className="text-[10px] text-gray-400 font-bold">{player.avgDamage} Dano Médio</span>
                          </div>

                          <button className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                            isCurrentSelected
                              ? 'bg-yellow-500 text-black'
                              : 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-black'
                          }`}>
                            {isCurrentSelected ? 'Selecionado' : 'Escolher'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold">
                  {candidatePlayers.length} atletas disponíveis no pool
                </span>
                <button
                  onClick={() => setSlotPickerModal(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
