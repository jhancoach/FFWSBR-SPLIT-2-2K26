
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData, PlayerData, CharacterData } from '../types';
import { Trophy, Crown, User, Users, Swords, Zap, BarChart2, Scale, Map as MapIcon, Skull, ChevronRight, ChevronDown, ChevronUp, Sparkles, X, Activity, Info, Crosshair, Shield, ShieldAlert, ArrowLeft, Disc, Flame, Target, AlertCircle, LayoutGrid, MapPin, Hash, Target as TargetIcon, CheckCircle2, AlertTriangle, Search, Star, ListOrdered, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell, YAxis, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import FilterBar from '../components/FilterBar';
import InstagramPostModal from '../components/InstagramPostModal';
import { PlayerVsTeamCompare } from '../components/PlayerVsTeamCompare';
import { PlayerVsPlayerCompare } from '../components/PlayerVsPlayerCompare';
import { Camera } from 'lucide-react';
import { findTeamLogo } from '../utils/teamUtils';
import { findDimImg } from '../utils/skillImages';
import { getPlayerCharacterHistory } from '../utils/characterUtils';

interface PlayersProps {
  data: DashboardData;
}

const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
const cleanKey = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

// Helper para converter strings numéricas em inteiros, removendo pontos e vírgulas de formatação
const parseNumber = (val: string | undefined | null): number => {
  if (!val) return 0;
  // Remove tudo que não for dígito
  const cleaned = val.toString().replace(/\D/g, '');
  return parseInt(cleaned) || 0;
};

const Players: React.FC<PlayersProps> = ({ data }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'playerRounds' | 'playerDrops' | 'chars' | 'report' | 'auditoria' | 'stats' | 'roles' | 'compare' | 'mapKings'>('ranking');
  const [mapKingsSubTab, setMapKingsSubTab] = useState<"maps" | "drops">("maps");
  const [instagramPost, setInstagramPost] = useState<{ group: any; type: "map" | "drop" } | null>(null);
  const [rankingSubTab, setRankingSubTab] = useState<'general' | 'maps' | 'safes'>('general');
  const [activeRole, setActiveRole] = useState<string>('TODAS AS FUNÇÕES');
  const [roleSearch, setRoleSearch] = useState<string>('');
  const [roleSort, setRoleSort] = useState<{ field: string, direction: 'asc' | 'desc' }>({ field: 'kills', direction: 'desc' });
  const [rankingSort, setRankingSort] = useState<{ field: string, direction: 'asc' | 'desc' }>({ field: 'kills', direction: 'desc' });
  const [comparePlayers, setComparePlayers] = useState<{p1: string, p1Hab: string, p2: string, p2Hab: string}>({p1: '', p1Hab: 'All', p2: '', p2Hab: 'All'});
  const [compareMode, setCompareMode] = useState<'pvp' | 'pvt'>('pvp');
  const [comparePvt, setComparePvt] = useState<{ player: string; playerHab: string; team: string; teamMetric: 'total' | 'average' }>({ player: '', playerHab: 'All', team: '', teamMetric: 'total' });
  const [activeHabFilter, setActiveHabFilter] = useState<string>('All');
  const [activeHabSort, setActiveHabSort] = useState<{field: string, direction: 'asc'|'desc'}>({ field: 'kills', direction: 'desc' });

  const [playerRoundsSearch, setPlayerRoundsSearch] = useState('');
  const [playerRoundsSort, setPlayerRoundsSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'totalKills', direction: 'desc' });
  const [selectedPlayerRoundDrop, setSelectedPlayerRoundDrop] = useState<{ player: string; playerImg?: string; teamImg?: string; team: string; round: string; kills: number; matches: number; drops: Record<string, { kills: number; map: string }> } | null>(null);

  const [playerDropsSearch, setPlayerDropsSearch] = useState('');
  const [playerDropsSort, setPlayerDropsSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'totalKills', direction: 'desc' });
  const [selectedPlayerDropDetail, setSelectedPlayerDropDetail] = useState<{ 
    player: string; 
    playerImg?: string; 
    teamImg?: string; 
    team: string; 
    drop: string; 
    kills: number; 
    matches: number; 
    zeroCount: number;
    rounds: Record<string, { kills: number; map: string }>; 
  } | null>(null);

  const [showLegend, setShowLegend] = useState(false);
  
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

  useEffect(() => {
    if (location.state?.player) {
      setFilters(prev => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Opções de filtro dinâmicas: Se selecionar RD, as opções de Q são apenas daquela RD
  const filterOptions = useMemo(() => {
    const teams = Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort();
    
    const players = data.playersDimension.length > 0 
        ? data.playersDimension.map(d => d.Name).sort()
        : Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).sort();
    
    // Filtramos os dados base para pegar as opções de queda baseadas na rodada selecionada
    const baseDataForDrops = data.players.filter(p => 
        filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD))
    );

    const maps = Array.from(new Set([...data.players.map(p => p.MAPA), ...data.killFeed.map(k => k.MAPA)])).filter(Boolean).sort();
    const rounds = Array.from(new Set([...data.players.map(p => p.RD), ...data.killFeed.map(k => k.RD)])).filter(Boolean).sort();
    const quedas = Array.from(new Set(baseDataForDrops.map(p => p.Q))).filter(Boolean).sort();
    const activeHabs = Array.from(new Set(data.characters.map(c => c.Hab1))).filter(Boolean).sort();
    const grupos = Array.from(new Set(data.teamsReference.map(t => t.GRUPO))).filter(Boolean).sort() as string[];

    const confrontations = Array.from(new Set([
      ...data.confrontationsDimension.map(c => c.CONFRONTO),
      ...data.killFeed.map(k => k.CONFRONTO),
      ...data.details.map(d => d.CONFRONTO),
      ...data.characters.map(c => c.Confronto),
      ...data.players.map(p => p.CONFRONTO)
    ].filter(Boolean))).sort();

    return { teams, players, weapons: [], safes: [], maps, rounds, quedas, confrontations, activeHabs, grupos };
  }, [data.players, data.killFeed, data.characters, data.playersDimension, data.teamsReference, data.confrontationsDimension, data.details, filters.rodada]);

  const charactersMap = useMemo(() => {
      const m = new Map<string, any>();
      data.characters.forEach(c => {
          if (!c.Player) return;
          const key = normalize(c.Player);
          if (!m.has(key)) {
              m.set(key, {
                  ...c,
                  hab1Img: findDimImg(data.hab1, c.Hab1),
                  hab2Img: findDimImg(data.hab2, c.Hab2),
                  hab3Img: findDimImg(data.hab3, c.Hab3),
                  hab4Img: findDimImg(data.hab4, c.Hab4),
                  petImg: findDimImg(data.pets, c.Pet),
                  itemImg: findDimImg(data.items, c.Item),
              });
          }
      });
      return m;
  }, [data.characters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items]);

  const allSafeNames = useMemo(() => {
    const safes = new Set<string>();
    data.killFeed.forEach(k => {
        if (k.SAFE) safes.add(k.SAFE);
        else safes.add('OUT');
    });
    return Array.from(safes).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    });
  }, [data.killFeed]);

  // Ranking com Filtragem Estrita (RD AND Q)
  const rankingData = useMemo(() => {
    if (activeTab !== 'ranking' && activeTab !== 'auditoria' && activeTab !== 'stats' && activeTab !== 'roles' && activeTab !== 'compare' && activeTab !== 'report') return [];

    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
        if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    const filtered = data.players.filter(p => {
        if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
        
        // Filtro de Grupo
        if (filters.grupo.length > 0) {
            const teamGroup = teamGroupMap.get(normalize(p.TIME));
            if (!teamGroup || !filters.grupo.some(g => normalize(g) === teamGroup)) return false;
        }

        // FILTRO ESTRITO: Se selecionar RD e Q, deve bater os dois simultaneamente no registro
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
        
        return matchRD && matchQ;
    });

    const statsMap = new Map<string, { 
        kills: number; 
        damage: number; 
        hs: number; 
        knocks: number; 
        assists: number; 
        gelos: number;
        gelosDestruidos: number;
        reviveu: number;
        aliadosRevividos: number;
        mvp: number;
        matches: number; 
        zeroKills: number;
        withKills: number;
        team: string;
        mapStats: Map<string, { kills: number, matches: number }>;
    }>();
    filtered.forEach(p => {
        const kills = parseNumber(p.Abates);
        const damage = parseNumber(p.Dano);
        const hs = parseNumber(p.HS);
        const knocks = parseNumber(p.Deitados);
        const assists = parseNumber(p.Assistencias);
        const gelos = parseNumber(p.Gelos);
        const gelosDestruidos = parseNumber(p.GelosDestruidos);
        const reviveu = parseNumber(p.Reviveu);
        const aliadosRevividos = parseNumber(p.AliadosRevividos);
        const mvp = parseNumber(p.MVP);
        const mapName = normalize(p.MAPA) || 'N/A';
        
        if (!statsMap.has(p.PLAYER)) {
            const ms = new Map();
            ms.set(mapName, { kills, matches: 1 });
            statsMap.set(p.PLAYER, { 
                kills, damage, hs, knocks, assists, 
                gelos, gelosDestruidos, reviveu, aliadosRevividos,
                mvp,
                matches: 1, team: p.TIME,
                zeroKills: kills === 0 ? 1 : 0,
                withKills: kills > 0 ? 1 : 0,
                mapStats: ms
            });
        } else {
            const s = statsMap.get(p.PLAYER)!;
            s.kills += kills;
            s.damage += damage;
            s.hs += hs;
            s.knocks += knocks;
            s.assists += assists;
            s.gelos += gelos;
            s.gelosDestruidos += gelosDestruidos;
            s.reviveu += reviveu;
            s.aliadosRevividos += aliadosRevividos;
            s.mvp += mvp;
            s.matches += 1;
            s.zeroKills += kills === 0 ? 1 : 0;
            s.withKills += kills > 0 ? 1 : 0;

            const ms = s.mapStats.get(mapName) || { kills: 0, matches: 0 };
            ms.kills += kills;
            ms.matches += 1;
            s.mapStats.set(mapName, ms);
        }
    });

    const filteredKillFeed = data.killFeed.filter(k => {
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
        return matchRD && matchQ;
    });

    const playerSafes = new Map<string, Map<string, number>>();
    const playerDeathsMap = new Map<string, number>();
    const allSafeNames = new Set<string>();

    filteredKillFeed.forEach(k => {
        const killer = k.PLAYER; // Fixed from k.MATADOR
        if (killer) {
            const safeVal = k.SAFE || 'OUT';
            allSafeNames.add(safeVal);
            
            if (!playerSafes.has(killer)) playerSafes.set(killer, new Map());
            const sMap = playerSafes.get(killer)!;
            sMap.set(safeVal, (sMap.get(safeVal) || 0) + 1);
        }

        const victim = k.VITIMA;
        if (victim) {
            playerDeathsMap.set(victim, (playerDeathsMap.get(victim) || 0) + 1);
        }
    });

    const teamKillsMap = new Map<string, number>();
    const teamDamageMap = new Map<string, number>();
    const teamHsMap = new Map<string, number>();
    const teamKnocksMap = new Map<string, number>();
    const teamAssistsMap = new Map<string, number>();

    data.players.forEach(p => {
        if (!p.TIME) return;
        if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return;
        if (filters.grupo.length > 0) {
            const teamGroup = teamGroupMap.get(normalize(p.TIME));
            if (!teamGroup || !filters.grupo.some(g => normalize(g) === teamGroup)) return;
        }
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
        if (!matchRD || !matchQ) return;

        const t = p.TIME;
        teamKillsMap.set(t, (teamKillsMap.get(t) || 0) + parseNumber(p.Abates));
        teamDamageMap.set(t, (teamDamageMap.get(t) || 0) + parseNumber(p.Dano));
        teamHsMap.set(t, (teamHsMap.get(t) || 0) + parseNumber(p.HS));
        teamKnocksMap.set(t, (teamKnocksMap.get(t) || 0) + parseNumber(p.Deitados));
        teamAssistsMap.set(t, (teamAssistsMap.get(t) || 0) + parseNumber(p.Assistencias));
    });

    return Array.from(statsMap.entries()).map(([name, stat]) => {
        const dim = data.playersDimension.find(d => normalize(d.Name) === normalize(name));
        
        const safeKillsMap = playerSafes.get(name) || new Map();
        const safeKills: Record<string, number> = {};
        let totalSafeKills = 0;
        allSafeNames.forEach(safeName => {
            const count = safeKillsMap.get(safeName) || 0;
            safeKills[safeName] = count;
            totalSafeKills += count;
        });
        
        const mapKills: Record<string, number> = {};
        stat.mapStats.forEach((v, k) => {
            mapKills[k] = v.kills;
        });

        const teamTotalKills = teamKillsMap.get(stat.team) || 0;
        const teamTotalDamage = teamDamageMap.get(stat.team) || 0;
        const teamTotalHS = teamHsMap.get(stat.team) || 0;
        const teamTotalKnocks = teamKnocksMap.get(stat.team) || 0;
        const teamTotalAssists = teamAssistsMap.get(stat.team) || 0;
        const killContributionPct = teamTotalKills > 0 ? ((stat.kills / teamTotalKills) * 100).toFixed(1) : '0.0';

        const deaths = playerDeathsMap.get(name) || 0;

        return {
            name, 
            playerImg: findDimImg(data.playersDimension, name),
            teamImg: findTeamLogo(stat.team, data.teamsReference),
            team: stat.team, 
            kills: stat.kills, 
            deaths,
            kd: (stat.kills / (deaths || 1)).toFixed(2),
            diff: stat.kills - stat.matches,
            damage: stat.damage,
            hs: stat.hs,
            knocks: stat.knocks,
            assists: stat.assists,
            gelos: stat.gelos,
            gelosDestruidos: stat.gelosDestruidos,
            reviveu: stat.reviveu,
            aliadosRevividos: stat.aliadosRevividos,
            mvp: stat.mvp,
            matches: stat.matches,
            zeroKills: stat.zeroKills,
            withKills: stat.withKills,
            zeroKillsPct: stat.matches > 0 ? ((stat.zeroKills / stat.matches) * 100).toFixed(1) : '0.0',
            withKillsPct: stat.matches > 0 ? ((stat.withKills / stat.matches) * 100).toFixed(1) : '0.0',
            funcao: dim?.Funcao || 'N/A',
            funcao2: dim?.Funcao2 || 'N/A',
            avg: stat.matches > 0 ? (stat.kills / stat.matches).toFixed(2) : '0.00',
            avgDmg: stat.matches > 0 ? (stat.damage / stat.matches).toFixed(0) : '0',
            avgKnocks: stat.matches > 0 ? (stat.knocks / stat.matches).toFixed(2) : '0.00',
            killContributionPct,
            teamTotalKills,
            teamTotalDamage,
            teamTotalHS,
            teamTotalKnocks,
            teamTotalAssists,
            safeKills,
            totalSafeKills,
            mapKills,
            loadout: charactersMap.get(normalize(name))
        };
    }).sort((a, b) => {
        const valA = a[rankingSort.field as keyof typeof a];
        const valB = b[rankingSort.field as keyof typeof b];
        
        // Handle mapKills and safeKills if sorting by them
        if (rankingSort.field.startsWith('map_')) {
            const mapName = rankingSort.field.replace('map_', '');
            const mA = (a.mapKills as any)[mapName] || 0;
            const mB = (b.mapKills as any)[mapName] || 0;
            return rankingSort.direction === 'asc' ? mA - mB : mB - mA;
        }
        if (rankingSort.field.startsWith('safe_')) {
            const safeName = rankingSort.field.replace('safe_', '');
            const sA = (a.safeKills as any)[safeName] || 0;
            const sB = (b.safeKills as any)[safeName] || 0;
            return rankingSort.direction === 'asc' ? sA - sB : sB - sA;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return rankingSort.direction === 'asc' ? numA - numB : numB - numA;
            }
            return rankingSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        const numA = valA as number;
        const numB = valB as number;
        
        if (rankingSort.direction === 'asc') {
            return numA - numB;
        } else {
            return numB - numA;
        }
    });
  }, [data.players, data.playersDimension, data.killFeed, filters, activeTab, charactersMap, rankingSort, allSafeNames]);

  const handleRoleSort = (field: string) => {
    setRoleSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  
  const handleHabSort = (field: string) => {
      setActiveHabSort(prev => ({
          field,
          direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
      }));
  };

  const handleRankingSort = (field: string) => {
    setRankingSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Auditoria de Kills com a mesma Filtragem Estrita
  const rolesData = useMemo(() => {
    if (activeTab !== 'roles') return { players: [], bestsByRole: [] };
    
    const playersWithRoles: any[] = [];
    
    data.playersDimension.forEach(d => {
        const stats = rankingData.find(r => normalize(r.name) === normalize(d.Name));
        const safeKillsMap = stats?.safeKills || {};
        const safeFields: Record<string, number> = {};
        allSafeNames.forEach(s => {
            safeFields[`safe_${s}`] = safeKillsMap[s] || 0;
        });

        const basePlayer = {
            name: d.Name,
            img: d.IMG || findDimImg(data.playersDimension, d.Name),
            teamImg: stats?.teamImg || findTeamLogo(stats?.team || '', data.teamsReference),
            team: stats?.team || 'N/A',
            kills: stats?.kills || 0,
            diff: stats?.diff || 0,
            avg: stats?.avg || '0.00',
            damage: stats?.damage || 0,
            avgDmg: stats?.avgDmg || '0',
            hs: stats?.hs || 0,
            knocks: stats?.knocks || 0,
            avgKnocks: stats?.avgKnocks || '0.00',
            matches: stats?.matches || 0,
            assists: stats?.assists || 0,
            gelos: stats?.gelos || 0,
            gelosDestruidos: stats?.gelosDestruidos || 0,
            reviveu: stats?.reviveu || 0,
            aliadosRevividos: stats?.aliadosRevividos || 0,
            mvp: stats?.mvp || 0,
            killContributionPct: stats?.killContributionPct || '0.0',
            deaths: stats?.deaths || 0,
            kd: stats?.kd || '0.00',
            zeroKills: stats?.zeroKills || 0,
            withKills: stats?.withKills || 0,
            loadout: stats?.loadout,
            safeKills: safeKillsMap,
            totalSafeKills: stats?.totalSafeKills || 0,
            ...safeFields
        };

        const role1 = d.Funcao?.trim().toUpperCase();
        const role2 = d.Funcao2?.trim().toUpperCase();

        if (role1 && role1 !== 'N/A') {
            playersWithRoles.push({ ...basePlayer, funcao: role1, funcao2: role2 || 'N/A' });
        }
        if (role2 && role2 !== 'N/A' && role2 !== role1) {
            playersWithRoles.push({ ...basePlayer, funcao: role2, funcao2: role1 || 'N/A' });
        }
        if ((!role1 || role1 === 'N/A') && (!role2 || role2 === 'N/A')) {
            playersWithRoles.push({ ...basePlayer, funcao: 'N/A', funcao2: 'N/A' });
        }
    });

    const sortFn = (a: any, b: any) => {
        const field = roleSort.field;
        const valA = a[field];
        const valB = b[field];

        if (typeof valA === 'string' && typeof valB === 'string') {
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if (!isNaN(numA) && !isNaN(numB)) {
                return roleSort.direction === 'asc' ? numA - numB : numB - numA;
            }
            return roleSort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        const numA = (valA ?? 0) as number;
        const numB = (valB ?? 0) as number;

        return roleSort.direction === 'asc' ? numA - numB : numB - numA;
    };

    const getTopMetric = (list: any[], key: string, isStringNum = false) => {
        return [...list].sort((a, b) => {
            const valA = isStringNum ? parseFloat(a[key] || 0) : (a[key] || 0);
            const valB = isStringNum ? parseFloat(b[key] || 0) : (b[key] || 0);
            return valB - valA;
        })[0] || null;
    };

    // Unicidade para "TODAS AS FUNÇÕES"
    const uniquePlayersMap = new Map<string, any>();
    playersWithRoles.forEach(p => {
        if (!uniquePlayersMap.has(p.name)) {
            uniquePlayersMap.set(p.name, p);
        }
    });
    const allRolePlayers = Array.from(uniquePlayersMap.values());
    const sortedAllPlayers = [...allRolePlayers].sort(sortFn);

    const allRolesGroup = {
        role: 'TODAS AS FUNÇÕES',
        bestKills: getTopMetric(allRolePlayers, 'kills'),
        bestDamage: getTopMetric(allRolePlayers, 'damage'),
        bestAvgKills: getTopMetric(allRolePlayers, 'avg', true),
        bestAssists: getTopMetric(allRolePlayers, 'assists'),
        bestHS: getTopMetric(allRolePlayers, 'hs'),
        bestKnocks: getTopMetric(allRolePlayers, 'knocks'),
        bestAvgKnocks: getTopMetric(allRolePlayers, 'avgKnocks', true),
        bestGelos: getTopMetric(allRolePlayers, 'gelos'),
        bestGelosDestruidos: getTopMetric(allRolePlayers, 'gelosDestruidos'),
        bestReviveu: getTopMetric(allRolePlayers, 'reviveu'),
        bestAliadosRevividos: getTopMetric(allRolePlayers, 'aliadosRevividos'),
        bestMVP: getTopMetric(allRolePlayers, 'mvp'),
        bestDiff: getTopMetric(allRolePlayers, 'diff'),
        bestContrib: getTopMetric(allRolePlayers, 'killContributionPct', true),
        players: sortedAllPlayers
    };

    const roles = Array.from(new Set(playersWithRoles.map(r => r.funcao))).filter(r => r !== 'N/A').sort();
    
    const bestsByRole = roles.map(role => {
        const rolePlayers = playersWithRoles.filter(p => p.funcao === role);
        const sortedPlayers = [...rolePlayers].sort(sortFn);

        return {
            role,
            bestKills: getTopMetric(rolePlayers, 'kills'),
            bestDamage: getTopMetric(rolePlayers, 'damage'),
            bestAvgKills: getTopMetric(rolePlayers, 'avg', true),
            bestAssists: getTopMetric(rolePlayers, 'assists'),
            bestHS: getTopMetric(rolePlayers, 'hs'),
            bestKnocks: getTopMetric(rolePlayers, 'knocks'),
            bestAvgKnocks: getTopMetric(rolePlayers, 'avgKnocks', true),
            bestGelos: getTopMetric(rolePlayers, 'gelos'),
            bestGelosDestruidos: getTopMetric(rolePlayers, 'gelosDestruidos'),
            bestReviveu: getTopMetric(rolePlayers, 'reviveu'),
            bestAliadosRevividos: getTopMetric(rolePlayers, 'aliadosRevividos'),
            bestMVP: getTopMetric(rolePlayers, 'mvp'),
            bestDiff: getTopMetric(rolePlayers, 'diff'),
            bestContrib: getTopMetric(rolePlayers, 'killContributionPct', true),
            players: sortedPlayers
        };
    });

    return { players: playersWithRoles, bestsByRole: [allRolesGroup, ...bestsByRole] };
  }, [data.playersDimension, data.teamsReference, rankingData, activeTab, roleSort, allSafeNames]);

  const auditData = useMemo(() => {
    if (activeTab !== 'auditoria') return [];

    const feedFiltered = data.killFeed.filter(k => {
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
        
        // FILTRO ESTRITO NO FEED: RD AND Q
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
        
        return matchRD && matchQ;
    });

    const feedKillsMap = new Map<string, number>();
    feedFiltered.forEach(k => {
        const p = normalize(k.PLAYER);
        feedKillsMap.set(p, (feedKillsMap.get(p) || 0) + 1);
    });

    return rankingData.map(p => {
        const factKills = p.kills;
        const feedKills = feedKillsMap.get(normalize(p.name)) || 0;
        const diff = factKills - feedKills;
        return {
            ...p,
            factKills,
            feedKills,
            diff,
            status: diff === 0 ? 'OK' : 'DISCREPÂNCIA'
        };
    }).sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff) || b.factKills - a.factKills);
  }, [rankingData, data.killFeed, filters, activeTab]);


  const activeHabStats = useMemo(() => {
    if (activeHabFilter === 'All') return [];
    
    const habUsage = new Set<string>();
    data.characters.forEach(c => {
      if (normalize(c.Hab1) === normalize(activeHabFilter)) {
        habUsage.add(`${normalize(c.Player)}|${normalize(c.Rd)}|${normalize(c.Q)}`);
      }
    });

    const playerMap = new Map<string, {
      name: string;
      img: string;
      team: string;
      teamImg: string;
      matches: number;
      kills: number;
      dmg: number;
      knocks: number;
      assists: number;
      safeKills?: Record<string, number>;
      teamTotalKills: number;
    }>();

    const teamKillsByMatch = new Map<string, number>();
    data.players.forEach(p => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
      const matchMap = filters.map.length === 0 || filters.map.some(m => normalize(m) === normalize(p.MAPA));
      const matchTeam = filters.team.length === 0 || filters.team.some(t => normalize(t) === normalize(p.TIME));
      
      if (!matchRD || !matchQ || !matchMap || !matchTeam) return;

      const teamKey = `${normalize(p.TIME)}|${normalize(p.RD)}|${normalize(p.Q)}`;
      teamKillsByMatch.set(teamKey, (teamKillsByMatch.get(teamKey) || 0) + parseNumber(p.Abates));
    });

    data.players.forEach(p => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
      const matchMap = filters.map.length === 0 || filters.map.some(m => normalize(m) === normalize(p.MAPA));
      const matchTeam = filters.team.length === 0 || filters.team.some(t => normalize(t) === normalize(p.TIME));
      
      if (!matchRD || !matchQ || !matchMap || !matchTeam) return;

      const pName = p.PLAYER;
      const key = `${normalize(pName)}|${normalize(p.RD)}|${normalize(p.Q)}`;
      if (habUsage.has(key)) {
        if (!playerMap.has(pName)) {
           playerMap.set(pName, {
             name: pName,
             img: findDimImg(data.playersDimension, pName),
             team: p.TIME,
             teamImg: findTeamLogo(p.TIME, data.teamsReference),
             matches: 0,
             kills: 0,
             dmg: 0,
             knocks: 0,
             assists: 0,
             teamTotalKills: 0
           });
        }
        const st = playerMap.get(pName)!;
        st.matches += 1;
        st.kills += parseNumber(p.Abates);
        st.dmg += parseNumber(p.Dano);
        st.knocks += parseNumber(p.Deitados);
        st.assists += parseNumber(p.Assistencias);
        st.teamTotalKills += teamKillsByMatch.get(`${normalize(p.TIME)}|${normalize(p.RD)}|${normalize(p.Q)}`) || 0;
      }
    });

    // Populate safeKills for activeHabStats
    data.killFeed.forEach(k => {
      const killer = k.PLAYER;
      if (!killer) return;
      const key = `${normalize(killer)}|${normalize(k.RD)}|${normalize(k.Q)}`;
      if (habUsage.has(key)) {
        if (playerMap.has(killer)) {
            const st = playerMap.get(killer)!;
            const safeVal = k.SAFE || 'OUT';
            if (!st.safeKills) st.safeKills = {};
            st.safeKills[safeVal] = (st.safeKills[safeVal] || 0) + 1;
        }
      }
    });

    
    const arr = Array.from(playerMap.values());
    arr.sort((a, b) => {
        if (activeHabSort.field.startsWith('safe_')) {
            const safeName = activeHabSort.field.replace('safe_', '');
            const sA = a.safeKills?.[safeName] || 0;
            const sB = b.safeKills?.[safeName] || 0;
            return activeHabSort.direction === 'desc' ? sB - sA : sA - sB;
        }

        let valA = a[activeHabSort.field as keyof typeof a] as any;
        let valB = b[activeHabSort.field as keyof typeof b] as any;
        
        // Handling edge cases where val is a string (like name or team)
        if (typeof valA === 'string' && typeof valB === 'string') {
             return activeHabSort.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        
        // Number comparison
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return activeHabSort.direction === 'desc' ? valB - valA : valA - valB;
    });
    return arr;

  }, [data.characters, data.players, activeHabFilter, filters, data.teamsReference, activeHabSort]);

  const charactersData = useMemo(() => {
    return data.characters.filter(c => {
        if (!c.Player) return false;
        if (filters.team.length > 0 && !filters.team.includes(c.Time)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(c.Player))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(c.Mapa))) return false;
        
        // FILTRO ESTRITO NOS LOADOUTS: RD AND Q
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(c.Rd));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(c.Q));
        
        if (!(matchRD && matchQ)) return false;
        if (activeHabFilter !== 'All' && normalize(c.Hab1) !== normalize(activeHabFilter)) return false;
        return true;
    }).map(c => {
         return {
             ...c,
             hab1Img: findDimImg(data.hab1, c.Hab1),
             hab2Img: findDimImg(data.hab2, c.Hab2),
             hab3Img: findDimImg(data.hab3, c.Hab3),
             hab4Img: findDimImg(data.hab4, c.Hab4),
             petImg: findDimImg(data.pets, c.Pet),
             itemImg: findDimImg(data.items, c.Item),
             playerImg: findDimImg(data.playersDimension, c.Player),
             teamImg: findTeamLogo(c.Time, data.teamsReference)
         };
    });
  }, [data.characters, filters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items, data.teamsReference, activeHabFilter]);

  const usageStats = useMemo(() => {
    if (activeHabFilter === 'All') return null;
    const total = data.characters.length || 1;
    const count = charactersData.length;
    const percent = ((count / total) * 100).toFixed(1);
    return { count, percent };
  }, [charactersData, data.characters, activeHabFilter]);

  const allPlayersList = useMemo(() => {
    return data.playersDimension.length > 0 
        ? data.playersDimension.map(d => ({ name: d.Name, img: d.IMG, team: d.Time }))
        : Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).map(name => ({ name, img: undefined, team: undefined }));
  }, [data.playersDimension, data.players]);

  const compareData = useMemo(() => {
    if (activeTab !== 'compare') return { p1: null, p2: null, headToHead: null };
    
    // Quick lookup maps
    const playerDimMap = new Map<string, { img?: string; team?: string }>();
    (data.playersDimension || []).forEach(d => {
        if (d.Name) playerDimMap.set(normalize(d.Name), { img: d.IMG, team: d.Time });
    });

    const teamDimMap = new Map<string, { img?: string; grupo?: string }>();
    (data.teamsReference || []).forEach(t => {
        if (t.TIME) teamDimMap.set(normalize(t.TIME), { img: t.IMG, grupo: t.GRUPO });
    });

    const getStats = (pName: string, habFilter: string) => {
        if (!pName) return null;
        
        let validMatchKeys = new Set<string>();
        if (habFilter !== 'All') {
            (data.characters || []).forEach(c => {
                if (normalize(c.Player) === normalize(pName) && normalize(c.Hab1) === normalize(habFilter)) {
                    validMatchKeys.add(`${normalize(pName)}|${normalize(c.Rd)}|${normalize(c.Q)}`);
                }
            });
        }
        
        const stats = {
            name: pName,
            team: '',
            kills: 0,
            deaths: 0,
            damage: 0,
            hs: 0,
            knocks: 0,
            assists: 0,
            gelos: 0,
            gelosDestruidos: 0,
            reviveu: 0,
            aliadosRevividos: 0,
            mvp: 0,
            matches: 0,
            zeroKills: 0,
            withKills: 0,
            mapKills: {} as Record<string, number>,
            safeKills: {} as Record<string, number>,
        };

        // Aggregation maps for victims and killers
        const victimPlayersMap = new Map<string, number>();
        const killerPlayersMap = new Map<string, number>();
        const victimTeamsMap = new Map<string, number>();
        const killerTeamsMap = new Map<string, number>();
        const killerWeaponsMap = new Map<string, number>();
        const victimWeaponsMap = new Map<string, number>();

        // Character breakdown map
        const charMap = new Map<string, {
            name: string;
            img?: string;
            matches: number;
            kills: number;
            deaths: number;
            damage: number;
            hs: number;
            knocks: number;
            assists: number;
            zeroKills: number;
            withKills: number;
            hab2: Record<string, number>;
            hab3: Record<string, number>;
            hab4: Record<string, number>;
            pets: Record<string, number>;
            items: Record<string, number>;
        }>();
        
        const filtered = (data.players || []).filter(p => {
             if (normalize(p.PLAYER) !== normalize(pName)) return false;
             if (habFilter !== 'All') {
                 const key = `${normalize(pName)}|${normalize(p.RD)}|${normalize(p.Q)}`;
                 if (!validMatchKeys.has(key)) return false;
             }
             if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
             if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
             const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
             const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
             return matchRD && matchQ;
        });
        
        if (filtered.length === 0 && habFilter !== 'All') return null;
        
        filtered.forEach(p => {
            stats.team = p.TIME;
            stats.matches++;
            const pKills = parseNumber(p.Abates);
            stats.kills += pKills;
            stats.damage += parseNumber(p.Dano);
            stats.hs += parseNumber(p.HS);
            stats.knocks += parseNumber(p.Deitados);
            stats.assists += parseNumber(p.Assistencias);
            stats.gelos += parseNumber(p.Gelos);
            stats.gelosDestruidos += parseNumber(p.GelosDestruidos);
            stats.reviveu += parseNumber(p.Reviveu);
            stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
            stats.mvp += parseNumber(p.MVP);
            if (pKills === 0) {
                stats.zeroKills++;
            } else {
                stats.withKills++;
            }
            const m = normalize(p.MAPA) || 'N/A';
            stats.mapKills[m] = (stats.mapKills[m] || 0) + pKills;

            // Identificar personagem nesta queda
            const matchChar = (data.characters || []).find(c => 
                normalize(c.Player) === normalize(pName) && 
                normalize(c.Rd) === normalize(p.RD) && 
                normalize(c.Q) === normalize(p.Q)
            );
            const charName = matchChar?.Hab1 || 'Padrão / Desconhecido';
            if (!charMap.has(charName)) {
                charMap.set(charName, {
                    name: charName,
                    img: findDimImg(data.hab1, charName),
                    matches: 0,
                    kills: 0,
                    deaths: 0,
                    damage: 0,
                    hs: 0,
                    knocks: 0,
                    assists: 0,
                    zeroKills: 0,
                    withKills: 0,
                    hab2: {},
                    hab3: {},
                    hab4: {},
                    pets: {},
                    items: {}
                });
            }
            const cStat = charMap.get(charName)!;
            cStat.matches++;
            cStat.kills += pKills;
            cStat.damage += parseNumber(p.Dano);
            cStat.hs += parseNumber(p.HS);
            cStat.knocks += parseNumber(p.Deitados);
            cStat.assists += parseNumber(p.Assistencias);
            if (pKills === 0) cStat.zeroKills++;
            else cStat.withKills++;

            if (matchChar) {
                if (matchChar.Hab2) cStat.hab2[matchChar.Hab2] = (cStat.hab2[matchChar.Hab2] || 0) + 1;
                if (matchChar.Hab3) cStat.hab3[matchChar.Hab3] = (cStat.hab3[matchChar.Hab3] || 0) + 1;
                if (matchChar.Hab4) cStat.hab4[matchChar.Hab4] = (cStat.hab4[matchChar.Hab4] || 0) + 1;
                if (matchChar.Pet) cStat.pets[matchChar.Pet] = (cStat.pets[matchChar.Pet] || 0) + 1;
                if (matchChar.Item) cStat.items[matchChar.Item] = (cStat.items[matchChar.Item] || 0) + 1;
            }
        });
        
        (data.killFeed || []).forEach(k => {
            const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
            const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
            if (!matchRD || !matchQ) return;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return;

            const killerNorm = normalize(k.PLAYER);
            const victimNorm = normalize(k.VITIMA);

            // Jogador como Abatedor
            if (killerNorm === normalize(pName)) {
                if (habFilter !== 'All') {
                    const key = `${normalize(pName)}|${normalize(k.RD)}|${normalize(k.Q)}`;
                    if (!validMatchKeys.has(key)) return;
                }
                const safeVal = k.SAFE || 'OUT';
                stats.safeKills[safeVal] = (stats.safeKills[safeVal] || 0) + 1;

                if (k.ARMA) {
                    killerWeaponsMap.set(k.ARMA, (killerWeaponsMap.get(k.ARMA) || 0) + 1);
                }

                if (k.VITIMA) {
                    victimPlayersMap.set(k.VITIMA, (victimPlayersMap.get(k.VITIMA) || 0) + 1);

                    const matchPlayerRec = (data.players || []).find(p => 
                        normalize(p.PLAYER) === victimNorm && 
                        normalize(p.RD) === normalize(k.RD) && 
                        normalize(p.Q) === normalize(k.Q)
                    );
                    const victimTeam = matchPlayerRec?.TIME || playerDimMap.get(victimNorm)?.team || '';
                    if (victimTeam) {
                        victimTeamsMap.set(victimTeam, (victimTeamsMap.get(victimTeam) || 0) + 1);
                    }
                }
            }

            // Jogador como Vítima
            if (victimNorm === normalize(pName)) {
                if (habFilter !== 'All') {
                    const key = `${normalize(pName)}|${normalize(k.RD)}|${normalize(k.Q)}`;
                    if (!validMatchKeys.has(key)) return;
                }
                stats.deaths++;

                if (k.ARMA) {
                    victimWeaponsMap.set(k.ARMA, (victimWeaponsMap.get(k.ARMA) || 0) + 1);
                }

                const matchChar = (data.characters || []).find(c => 
                    normalize(c.Player) === normalize(pName) && 
                    normalize(c.Rd) === normalize(k.RD) && 
                    normalize(c.Q) === normalize(k.Q)
                );
                const charName = matchChar?.Hab1 || 'Padrão / Desconhecido';
                if (charMap.has(charName)) {
                    charMap.get(charName)!.deaths++;
                }

                if (k.PLAYER) {
                    killerPlayersMap.set(k.PLAYER, (killerPlayersMap.get(k.PLAYER) || 0) + 1);

                    const matchPlayerRec = (data.players || []).find(p => 
                        normalize(p.PLAYER) === killerNorm && 
                        normalize(p.RD) === normalize(k.RD) && 
                        normalize(p.Q) === normalize(k.Q)
                    );
                    const killerTeam = matchPlayerRec?.TIME || playerDimMap.get(killerNorm)?.team || '';
                    if (killerTeam) {
                        killerTeamsMap.set(killerTeam, (killerTeamsMap.get(killerTeam) || 0) + 1);
                    }
                }
            }
        });
        
        // Formatar Top Vítimas e Algozes (Jogadores e Times)
        const victimPlayers = Array.from(victimPlayersMap.entries()).map(([name, count]) => {
            const pDim = playerDimMap.get(normalize(name));
            const teamName = pDim?.team || '';
            const tDim = teamDimMap.get(normalize(teamName));
            return {
                name,
                count,
                team: teamName,
                img: pDim?.img,
                teamImg: tDim?.img
            };
        }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        const killerPlayers = Array.from(killerPlayersMap.entries()).map(([name, count]) => {
            const pDim = playerDimMap.get(normalize(name));
            const teamName = pDim?.team || '';
            const tDim = teamDimMap.get(normalize(teamName));
            return {
                name,
                count,
                team: teamName,
                img: pDim?.img,
                teamImg: tDim?.img
            };
        }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        const victimTeams = Array.from(victimTeamsMap.entries()).map(([name, count]) => {
            const tDim = teamDimMap.get(normalize(name));
            return {
                name,
                count,
                img: tDim?.img,
                grupo: tDim?.grupo || '-'
            };
        }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        const killerTeams = Array.from(killerTeamsMap.entries()).map(([name, count]) => {
            const tDim = teamDimMap.get(normalize(name));
            return {
                name,
                count,
                img: tDim?.img,
                grupo: tDim?.grupo || '-'
            };
        }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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

        // Use rankingData fallback if habFilter is 'All' so we get exactly the same baseline as before for global
        if (habFilter === 'All' && stats.matches === 0) {
            const rankP = rankingData.find(r => normalize(r.name) === normalize(pName));
            if (rankP) return rankP;
        }

        // Character Pool sorted
        const characterPool = Array.from(charMap.values()).map(c => ({
            ...c,
            avgKills: c.matches > 0 ? (c.kills / c.matches).toFixed(2) : '0.00',
            avgDamage: c.matches > 0 ? (c.damage / c.matches).toFixed(0) : '0',
            kd: (c.kills / (c.deaths || 1)).toFixed(2),
            zeroKillsPct: c.matches > 0 ? ((c.zeroKills / c.matches) * 100).toFixed(1) : '0.0',
            withKillsPct: c.matches > 0 ? ((c.withKills / c.matches) * 100).toFixed(1) : '0.0',
            pickRate: stats.matches > 0 ? ((c.matches / stats.matches) * 100).toFixed(1) : '0.0',
        })).sort((a, b) => b.matches - a.matches || b.kills - a.kills);

        const topCharacter = characterPool[0] || null;

        // Imagem do personagem ativo ou mais jogado
        let activeHabImg: string | undefined = undefined;
        if (habFilter !== 'All') {
            activeHabImg = findDimImg(data.hab1, habFilter);
        } else if (topCharacter) {
            activeHabImg = topCharacter.img;
        }

        // Agregação de passivas, pets e itens
        const allHab2Counts: Record<string, number> = {};
        const allHab3Counts: Record<string, number> = {};
        const allHab4Counts: Record<string, number> = {};
        const allPetCounts: Record<string, number> = {};
        const allItemCounts: Record<string, number> = {};

        characterPool.forEach(c => {
            Object.entries(c.hab2).forEach(([k, v]) => allHab2Counts[k] = (allHab2Counts[k] || 0) + v);
            Object.entries(c.hab3).forEach(([k, v]) => allHab3Counts[k] = (allHab3Counts[k] || 0) + v);
            Object.entries(c.hab4).forEach(([k, v]) => allHab4Counts[k] = (allHab4Counts[k] || 0) + v);
            Object.entries(c.pets).forEach(([k, v]) => allPetCounts[k] = (allPetCounts[k] || 0) + v);
            Object.entries(c.items).forEach(([k, v]) => allItemCounts[k] = (allItemCounts[k] || 0) + v);
        });

        const getTopItem = (counts: Record<string, number>, dimData: any[]) => {
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            if (sorted.length === 0) return null;
            return {
                name: sorted[0][0],
                count: sorted[0][1],
                pct: stats.matches > 0 ? ((sorted[0][1] / stats.matches) * 100).toFixed(0) : '0',
                img: findDimImg(dimData, sorted[0][0])
            };
        };

        const topHab2 = getTopItem(allHab2Counts, data.hab2);
        const topHab3 = getTopItem(allHab3Counts, data.hab3);
        const topHab4 = getTopItem(allHab4Counts, data.hab4);
        const topPet = getTopItem(allPetCounts, data.pets);
        const topItem = getTopItem(allItemCounts, data.items);

        // Totais acumulados da equipe em todas as partidas do filtro
        const teamName = stats.team || (data.players || []).find(p => normalize(p.PLAYER) === normalize(pName))?.TIME || '';
        let teamTotalKills = 0;
        let teamTotalDamage = 0;
        let teamTotalHS = 0;
        let teamTotalKnocks = 0;
        let teamTotalAssists = 0;

        if (teamName) {
            const teamMatches = (data.players || []).filter(p => {
                if (normalize(p.TIME) !== normalize(teamName)) return false;
                if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
                const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
                const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
                if (!matchRD || !matchQ) return false;
                if (habFilter !== 'All') {
                    const pKey = `${normalize(pName)}|${normalize(p.RD)}|${normalize(p.Q)}`;
                    if (!validMatchKeys.has(pKey)) return false;
                }
                return true;
            });

            teamTotalKills = teamMatches.reduce((acc, r) => acc + parseNumber(r.Abates), 0);
            teamTotalDamage = teamMatches.reduce((acc, r) => acc + parseNumber(r.Dano), 0);
            teamTotalHS = teamMatches.reduce((acc, r) => acc + parseNumber(r.HS), 0);
            teamTotalKnocks = teamMatches.reduce((acc, r) => acc + parseNumber(r.Deitados), 0);
            teamTotalAssists = teamMatches.reduce((acc, r) => acc + parseNumber(r.Assistencias), 0);
        }
        
        const playerDim = (data.playersDimension || []).find(d => normalize(d.Name) === normalize(pName));
        const teamDim = (data.teamsReference || []).find(t => normalize(t.TIME) === normalize(stats.team));

        return {
            ...stats,
            avg: stats.matches > 0 ? (stats.kills / stats.matches).toFixed(2) : '0.00',
            avgDmg: stats.matches > 0 ? (stats.damage / stats.matches).toFixed(0) : '0',
            zeroKillsPct: stats.matches > 0 ? ((stats.zeroKills / stats.matches) * 100).toFixed(1) : '0.0',
            withKillsPct: stats.matches > 0 ? ((stats.withKills / stats.matches) * 100).toFixed(1) : '0.0',
            kd: (stats.kills / (stats.deaths || 1)).toFixed(2),
            teamTotalKills,
            teamTotalDamage,
            teamTotalHS,
            teamTotalKnocks,
            teamTotalAssists,
            killContributionPct: teamTotalKills > 0 ? ((stats.kills / teamTotalKills) * 100).toFixed(1) : '0.0',
            playerImg: playerDim?.IMG,
            teamImg: teamDim?.IMG,
            characterPool,
            topCharacter,
            distinctCharactersCount: characterPool.length,
            activeHabImg,
            topHab2,
            topHab3,
            topHab4,
            topPet,
            topItem,
            victimPlayers,
            killerPlayers,
            victimTeams,
            killerTeams,
            killerWeapons,
            victimWeapons
        };
    };

    const p1 = getStats(comparePlayers.p1, comparePlayers.p1Hab);
    const p2 = getStats(comparePlayers.p2, comparePlayers.p2Hab);

    // Confronto Direto Head-to-Head (P1 vs P2)
    let headToHead = null;
    if (comparePlayers.p1 && comparePlayers.p2) {
        const p1Norm = normalize(comparePlayers.p1);
        const p2Norm = normalize(comparePlayers.p2);
        let p1KillsP2 = 0;
        let p2KillsP1 = 0;
        const events: any[] = [];

        (data.killFeed || []).forEach(k => {
            const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
            const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
            if (!matchRD || !matchQ) return;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return;

            const killer = normalize(k.PLAYER);
            const victim = normalize(k.VITIMA);

            if (killer === p1Norm && victim === p2Norm) {
                p1KillsP2++;
                events.push({
                    ...k,
                    winner: comparePlayers.p1,
                    loser: comparePlayers.p2,
                    winnerColor: 'yellow'
                });
            } else if (killer === p2Norm && victim === p1Norm) {
                p2KillsP1++;
                events.push({
                    ...k,
                    winner: comparePlayers.p2,
                    loser: comparePlayers.p1,
                    winnerColor: 'blue'
                });
            }
        });

        const totalDuels = p1KillsP2 + p2KillsP1;
        headToHead = {
            p1KillsP2,
            p2KillsP1,
            totalDuels,
            p1WinRate: totalDuels > 0 ? ((p1KillsP2 / totalDuels) * 100).toFixed(0) : '0',
            p2WinRate: totalDuels > 0 ? ((p2KillsP1 / totalDuels) * 100).toFixed(0) : '0',
            events: events.reverse()
        };
    }
    
    return { p1, p2, headToHead };
  }, [rankingData, data.players, data.characters, data.playersDimension, data.teamsReference, data.killFeed, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items, comparePlayers, activeTab, filters]);

  const allTeamsList = useMemo(() => {
    const teamNames = Array.from(new Set([
      ...(data.teamsReference || []).map(t => t.TIME),
      ...(data.players || []).map(p => p.TIME),
      ...(data.details || []).map(d => d.TIME)
    ])).filter(Boolean).sort();

    return teamNames.map(name => {
      const ref = (data.teamsReference || []).find(t => normalize(t.TIME) === normalize(name));
      return {
        name,
        img: ref?.IMG || '',
        grupo: ref?.GRUPO || 'N/A'
      };
    });
  }, [data.teamsReference, data.players, data.details]);

  const comparePvtData = useMemo(() => {
    if (activeTab !== 'compare' || compareMode !== 'pvt') return { player: null, team: null, headToHead: null, share: null };
    if (!comparePvt.player || !comparePvt.team) return { player: null, team: null, headToHead: null, share: null };

    const pName = comparePvt.player;
    const habFilter = comparePvt.playerHab;
    const tName = comparePvt.team;

    // 1. Processar dados do Jogador
    let validMatchKeys = new Set<string>();
    if (habFilter !== 'All') {
      data.characters.forEach(c => {
        if (normalize(c.Player) === normalize(pName) && normalize(c.Hab1) === normalize(habFilter)) {
          validMatchKeys.add(`${normalize(pName)}|${normalize(c.Rd)}|${normalize(c.Q)}`);
        }
      });
    }

    const pStats = {
      name: pName,
      team: '',
      kills: 0,
      deaths: 0,
      damage: 0,
      hs: 0,
      knocks: 0,
      assists: 0,
      gelos: 0,
      gelosDestruidos: 0,
      reviveu: 0,
      aliadosRevividos: 0,
      mvp: 0,
      matches: 0,
      zeroKills: 0,
      withKills: 0,
      mapKills: {} as Record<string, number>,
      safeKills: {} as Record<string, number>,
    };

    const charMap = new Map<string, any>();

    data.players.forEach(p => {
      if (normalize(p.PLAYER) !== normalize(pName)) return;
      if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return;
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return;
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
      if (!matchRD || !matchQ) return;

      if (habFilter !== 'All') {
        const key = `${normalize(pName)}|${normalize(p.RD)}|${normalize(p.Q)}`;
        if (!validMatchKeys.has(key)) return;
      }

      pStats.team = p.TIME || pStats.team;
      const pKills = parseNumber(p.Abates);
      pStats.kills += pKills;
      pStats.damage += parseNumber(p.Dano);
      pStats.hs += parseNumber(p.HS);
      pStats.knocks += parseNumber(p.Deitados);
      pStats.assists += parseNumber(p.Assistencias);
      pStats.gelos += parseNumber(p.Gelos);
      pStats.gelosDestruidos += parseNumber(p.GelosDestruidos);
      pStats.reviveu += parseNumber(p.Reviveu);
      pStats.aliadosRevividos += parseNumber(p.AliadosRevividos);
      pStats.mvp += parseNumber(p.MVP);
      pStats.matches++;

      if (pKills === 0) pStats.zeroKills++;
      else pStats.withKills++;

      const mapName = normalize(p.MAPA) || 'N/A';
      pStats.mapKills[mapName] = (pStats.mapKills[mapName] || 0) + pKills;

      const matchChar = data.characters.find(c =>
        normalize(c.Player) === normalize(pName) &&
        normalize(c.Rd) === normalize(p.RD) &&
        normalize(c.Q) === normalize(p.Q)
      );
      const charName = matchChar?.Hab1 || 'Padrão / Desconhecido';
      if (!charMap.has(charName)) {
        charMap.set(charName, {
          name: charName,
          img: findDimImg(data.hab1, charName),
          matches: 0,
          kills: 0,
          deaths: 0,
          damage: 0,
          hs: 0,
          knocks: 0,
          assists: 0,
          zeroKills: 0,
          withKills: 0
        });
      }
      const cStat = charMap.get(charName)!;
      cStat.matches++;
      cStat.kills += pKills;
      cStat.damage += parseNumber(p.Dano);
      cStat.hs += parseNumber(p.HS);
      cStat.knocks += parseNumber(p.Deitados);
      cStat.assists += parseNumber(p.Assistencias);
      if (pKills === 0) cStat.zeroKills++;
      else cStat.withKills++;
    });

    data.killFeed.forEach(k => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!matchRD || !matchQ) return;

      if (normalize(k.PLAYER) === normalize(pName)) {
        if (habFilter !== 'All') {
          const key = `${normalize(pName)}|${normalize(k.RD)}|${normalize(k.Q)}`;
          if (!validMatchKeys.has(key)) return;
        }
        const safeVal = k.SAFE || 'OUT';
        pStats.safeKills[safeVal] = (pStats.safeKills[safeVal] || 0) + 1;
      }

      if (normalize(k.VITIMA) === normalize(pName)) {
        if (habFilter !== 'All') {
          const key = `${normalize(pName)}|${normalize(k.RD)}|${normalize(k.Q)}`;
          if (!validMatchKeys.has(key)) return;
        }
        pStats.deaths++;
      }
    });

    const characterPool = Array.from(charMap.values()).map(c => ({
      ...c,
      avgKills: c.matches > 0 ? (c.kills / c.matches).toFixed(2) : '0.00',
      avgDamage: c.matches > 0 ? (c.damage / c.matches).toFixed(0) : '0',
      kd: (c.kills / (c.deaths || 1)).toFixed(2),
      zeroKillsPct: c.matches > 0 ? ((c.zeroKills / c.matches) * 100).toFixed(1) : '0.0',
      pickRate: pStats.matches > 0 ? ((c.matches / pStats.matches) * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.matches - a.matches || b.kills - a.kills);

    const topCharacter = characterPool[0] || null;
    let activeHabImg: string | undefined = undefined;
    if (habFilter !== 'All') {
      activeHabImg = findDimImg(data.hab1, habFilter);
    } else if (topCharacter) {
      activeHabImg = topCharacter.img;
    }

    const playerDim = data.playersDimension.find(d => normalize(d.Name) === normalize(pName));
    const playerTeamDim = data.teamsReference.find(t => normalize(t.TIME) === normalize(pStats.team));

    const finalPlayer = {
      ...pStats,
      avg: pStats.matches > 0 ? (pStats.kills / pStats.matches).toFixed(2) : '0.00',
      avgDmg: pStats.matches > 0 ? (pStats.damage / pStats.matches).toFixed(0) : '0',
      zeroKillsPct: pStats.matches > 0 ? ((pStats.zeroKills / pStats.matches) * 100).toFixed(1) : '0.0',
      withKillsPct: pStats.matches > 0 ? ((pStats.withKills / pStats.matches) * 100).toFixed(1) : '0.0',
      kd: (pStats.kills / (pStats.deaths || 1)).toFixed(2),
      playerImg: playerDim?.IMG,
      teamImg: playerTeamDim?.IMG,
      characterPool,
      topCharacter,
      activeHabImg
    };

    // 2. Processar dados do Time
    const teamDim = data.teamsReference.find(t => normalize(t.TIME) === normalize(tName));
    const teamGroup = teamDim?.GRUPO || 'N/A';

    const teamRosterMap = new Map<string, {
      name: string;
      playerImg?: string;
      kills: number;
      deaths: number;
      damage: number;
      matches: number;
      hs: number;
      knocks: number;
      assists: number;
      gelos: number;
      gelosDestruidos: number;
      reviveu: number;
      aliadosRevividos: number;
      mvp: number;
      zeroKills: number;
    }>();

    const teamMatchesMap = new Map<string, { kills: number; damage: number; map: string }>();
    const teamMapKills: Record<string, number> = {};
    const teamSafeKills: Record<string, number> = {};

    let teamTotalKills = 0;
    let teamTotalDamage = 0;
    let teamTotalHs = 0;
    let teamTotalKnocks = 0;
    let teamTotalAssists = 0;
    let teamTotalGelos = 0;
    let teamTotalGelosDestruidos = 0;
    let teamTotalReviveu = 0;
    let teamTotalAliadosRevividos = 0;
    let teamTotalMvp = 0;

    data.players.forEach(p => {
      if (normalize(p.TIME) !== normalize(tName)) return;
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return;
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
      if (!matchRD || !matchQ) return;

      const pKills = parseNumber(p.Abates);
      const pDmg = parseNumber(p.Dano);
      const pHs = parseNumber(p.HS);
      const pKnocks = parseNumber(p.Deitados);
      const pAssists = parseNumber(p.Assistencias);
      const pGelos = parseNumber(p.Gelos);
      const pGelosDest = parseNumber(p.GelosDestruidos);
      const pReviveu = parseNumber(p.Reviveu);
      const pAliados = parseNumber(p.AliadosRevividos);
      const pMvp = parseNumber(p.MVP);

      teamTotalKills += pKills;
      teamTotalDamage += pDmg;
      teamTotalHs += pHs;
      teamTotalKnocks += pKnocks;
      teamTotalAssists += pAssists;
      teamTotalGelos += pGelos;
      teamTotalGelosDestruidos += pGelosDest;
      teamTotalReviveu += pReviveu;
      teamTotalAliadosRevividos += pAliados;
      teamTotalMvp += pMvp;

      const mapName = normalize(p.MAPA) || 'N/A';
      teamMapKills[mapName] = (teamMapKills[mapName] || 0) + pKills;

      const matchKey = `${normalize(p.RD)}|${normalize(p.Q)}`;
      if (!teamMatchesMap.has(matchKey)) {
        teamMatchesMap.set(matchKey, { kills: 0, damage: 0, map: mapName });
      }
      const tMatch = teamMatchesMap.get(matchKey)!;
      tMatch.kills += pKills;
      tMatch.damage += pDmg;

      const plName = p.PLAYER;
      if (!teamRosterMap.has(plName)) {
        const plDim = data.playersDimension.find(d => normalize(d.Name) === normalize(plName));
        teamRosterMap.set(plName, {
          name: plName,
          playerImg: plDim?.IMG,
          kills: 0,
          deaths: 0,
          damage: 0,
          matches: 0,
          hs: 0,
          knocks: 0,
          assists: 0,
          gelos: 0,
          gelosDestruidos: 0,
          reviveu: 0,
          aliadosRevividos: 0,
          mvp: 0,
          zeroKills: 0
        });
      }
      const rPlayer = teamRosterMap.get(plName)!;
      rPlayer.kills += pKills;
      rPlayer.damage += pDmg;
      rPlayer.matches++;
      rPlayer.hs += pHs;
      rPlayer.knocks += pKnocks;
      rPlayer.assists += pAssists;
      rPlayer.gelos += pGelos;
      rPlayer.gelosDestruidos += pGelosDest;
      rPlayer.reviveu += pReviveu;
      rPlayer.aliadosRevividos += pAliados;
      rPlayer.mvp += pMvp;
      if (pKills === 0) rPlayer.zeroKills++;
    });

    const teamRosterNames = Array.from(teamRosterMap.keys()).map(n => normalize(n));

    let teamTotalDeaths = 0;
    data.killFeed.forEach(k => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!matchRD || !matchQ) return;

      if (teamRosterNames.includes(normalize(k.PLAYER))) {
        const safeVal = k.SAFE || 'OUT';
        teamSafeKills[safeVal] = (teamSafeKills[safeVal] || 0) + 1;
      }

      if (teamRosterNames.includes(normalize(k.VITIMA))) {
        teamTotalDeaths++;
        const vic = Array.from(teamRosterMap.keys()).find(n => normalize(n) === normalize(k.VITIMA));
        if (vic && teamRosterMap.has(vic)) {
          teamRosterMap.get(vic)!.deaths++;
        }
      }
    });

    const teamMatchesCount = teamMatchesMap.size;
    let teamZeroKillMatches = 0;
    teamMatchesMap.forEach(m => {
      if (m.kills === 0) teamZeroKillMatches++;
    });

    const rosterList = Array.from(teamRosterMap.values()).map(r => ({
      ...r,
      avg: r.matches > 0 ? (r.kills / r.matches).toFixed(2) : '0.00',
      kd: (r.kills / (r.deaths || 1)).toFixed(2),
      zeroKillsPct: r.matches > 0 ? ((r.zeroKills / r.matches) * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.kills - a.kills);

    const activeRosterCount = Math.max(rosterList.length, 1);

    let teamPoints = 0;
    let teamBooyahs = 0;
    (data.details || []).forEach(t => {
      if (normalize(t.TIME) !== normalize(tName)) return;
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(t.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(t.Q));
      if (!matchRD || !matchQ) return;

      teamPoints += parseNumber(t.PTS);
      if (parseNumber(t.POS) === 1 || parseNumber(t.B) === 1) {
        teamBooyahs++;
      }
    });

    const finalTeam = {
      name: tName,
      img: teamDim?.IMG || findTeamLogo(tName, data.teamsReference),
      grupo: teamGroup,
      totalKills: teamTotalKills,
      totalDeaths: teamTotalDeaths,
      kd: (teamTotalKills / (teamTotalDeaths || 1)).toFixed(2),
      totalDamage: teamTotalDamage,
      avgDmg: teamMatchesCount > 0 ? (teamTotalDamage / teamMatchesCount).toFixed(0) : '0',
      avg: teamMatchesCount > 0 ? (teamTotalKills / teamMatchesCount).toFixed(2) : '0.00',
      totalHs: teamTotalHs,
      totalKnocks: teamTotalKnocks,
      totalAssists: teamTotalAssists,
      totalGelos: teamTotalGelos,
      totalGelosDestruidos: teamTotalGelosDestruidos,
      totalReviveu: teamTotalReviveu,
      totalAliadosRevividos: teamTotalAliadosRevividos,
      totalMvp: teamTotalMvp,
      matches: teamMatchesCount,
      zeroKills: teamZeroKillMatches,
      zeroKillsPct: teamMatchesCount > 0 ? ((teamZeroKillMatches / teamMatchesCount) * 100).toFixed(1) : '0.0',
      withKills: teamMatchesCount - teamZeroKillMatches,
      withKillsPct: teamMatchesCount > 0 ? (((teamMatchesCount - teamZeroKillMatches) / teamMatchesCount) * 100).toFixed(1) : '0.0',
      points: teamPoints,
      booyahs: teamBooyahs,
      roster: rosterList,
      rosterCount: rosterList.length,
      mapKills: teamMapKills,
      safeKills: teamSafeKills,
      avgPerPlayer: {
        kills: (teamTotalKills / activeRosterCount).toFixed(1),
        damage: (teamTotalDamage / activeRosterCount).toFixed(0),
        hs: (teamTotalHs / activeRosterCount).toFixed(1),
        knocks: (teamTotalKnocks / activeRosterCount).toFixed(1),
        assists: (teamTotalAssists / activeRosterCount).toFixed(1),
        gelos: (teamTotalGelos / activeRosterCount).toFixed(1),
        gelosDestruidos: (teamTotalGelosDestruidos / activeRosterCount).toFixed(1),
        reviveu: (teamTotalReviveu / activeRosterCount).toFixed(1),
        aliadosRevividos: (teamTotalAliadosRevividos / activeRosterCount).toFixed(1),
        mvp: (teamTotalMvp / activeRosterCount).toFixed(1),
        matches: (rosterList.reduce((acc, r) => acc + r.matches, 0) / activeRosterCount).toFixed(1),
        deaths: (teamTotalDeaths / activeRosterCount).toFixed(1),
        kd: (teamTotalKills / (teamTotalDeaths || 1)).toFixed(2),
        avg: teamMatchesCount > 0 ? ((teamTotalKills / activeRosterCount) / teamMatchesCount).toFixed(2) : '0.00',
        avgDmg: teamMatchesCount > 0 ? ((teamTotalDamage / activeRosterCount) / teamMatchesCount).toFixed(0) : '0',
        zeroKills: (rosterList.reduce((acc, r) => acc + r.zeroKills, 0) / activeRosterCount).toFixed(1),
        zeroKillsPct: ((rosterList.reduce((acc, r) => acc + r.zeroKills, 0) / Math.max(rosterList.reduce((acc, r) => acc + r.matches, 0), 1)) * 100).toFixed(1),
        withKills: (rosterList.reduce((acc, r) => acc + (r.matches - r.zeroKills), 0) / activeRosterCount).toFixed(1),
        withKillsPct: ((rosterList.reduce((acc, r) => acc + (r.matches - r.zeroKills), 0) / Math.max(rosterList.reduce((acc, r) => acc + r.matches, 0), 1)) * 100).toFixed(1),
      }
    };

    // 3. Confrontos Diretos (Head-to-Head Killfeed Events)
    const playerKillsOnTeamEvents: any[] = [];
    const teamKillsOnPlayerEvents: any[] = [];
    const victimCounts: Record<string, number> = {};
    const killerCounts: Record<string, number> = {};

    data.killFeed.forEach(k => {
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!matchRD || !matchQ) return;

      const killerNorm = normalize(k.PLAYER);
      const victimNorm = normalize(k.VITIMA);

      if (killerNorm === normalize(pName) && teamRosterNames.includes(victimNorm)) {
        playerKillsOnTeamEvents.push(k);
        const origVicName = Array.from(teamRosterMap.keys()).find(n => normalize(n) === victimNorm) || k.VITIMA;
        victimCounts[origVicName] = (victimCounts[origVicName] || 0) + 1;
      }

      if (teamRosterNames.includes(killerNorm) && victimNorm === normalize(pName)) {
        teamKillsOnPlayerEvents.push(k);
        const origKillerName = Array.from(teamRosterMap.keys()).find(n => normalize(n) === killerNorm) || k.PLAYER;
        killerCounts[origKillerName] = (killerCounts[origKillerName] || 0) + 1;
      }
    });

    const victimsList = Object.entries(victimCounts).map(([name, count]) => {
      const pDim = data.playersDimension.find(d => normalize(d.Name) === normalize(name));
      return { name, count, img: pDim?.IMG };
    }).sort((a, b) => b.count - a.count);

    const killersList = Object.entries(killerCounts).map(([name, count]) => {
      const pDim = data.playersDimension.find(d => normalize(d.Name) === normalize(name));
      return { name, count, img: pDim?.IMG };
    }).sort((a, b) => b.count - a.count);

    const totalHeadToHead = playerKillsOnTeamEvents.length + teamKillsOnPlayerEvents.length;
    const playerWinRate = totalHeadToHead > 0 ? ((playerKillsOnTeamEvents.length / totalHeadToHead) * 100).toFixed(1) : '0.0';

    // 4. Share do Jogador vs Equipe Rival
    const killsShare = teamTotalKills > 0 ? ((finalPlayer.kills / teamTotalKills) * 100).toFixed(1) : '0.0';
    const damageShare = teamTotalDamage > 0 ? ((finalPlayer.damage / teamTotalDamage) * 100).toFixed(1) : '0.0';
    const knocksShare = teamTotalKnocks > 0 ? ((finalPlayer.knocks / teamTotalKnocks) * 100).toFixed(1) : '0.0';

    return {
      player: finalPlayer,
      team: finalTeam,
      headToHead: {
        playerKills: playerKillsOnTeamEvents.length,
        teamKills: teamKillsOnPlayerEvents.length,
        totalDuels: totalHeadToHead,
        playerWinRate,
        victims: victimsList,
        killers: killersList,
        recentEvents: [
          ...playerKillsOnTeamEvents.map(e => ({ ...e, type: 'player_kill' })),
          ...teamKillsOnPlayerEvents.map(e => ({ ...e, type: 'team_kill' }))
        ]
      },
      share: {
        killsShare,
        damageShare,
        knocksShare
      }
    };
  }, [data.players, data.killFeed, data.characters, data.details, data.teamsReference, data.playersDimension, data.hab1, comparePvt, compareMode, activeTab, filters]);

  const sortedRoundsList = useMemo(() => {
    const rounds = new Set<string>();
    data.players.forEach(p => {
      if (p.RD) rounds.add(p.RD);
    });
    return Array.from(rounds).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.players]);

  const playerRoundsData = useMemo(() => {
    if (activeTab !== 'playerRounds') return [];

    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
      if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    const playerMap = new Map<string, {
      name: string;
      team: string;
      grupo?: string;
      playerImg?: string;
      teamImg?: string;
      totalKills: number;
      totalMatches: number;
      roundKills: Record<string, number>;
      roundMatches: Record<string, number>;
      roundDrops: Record<string, Record<string, { kills: number; map: string }>>;
    }>();

    data.players.forEach(p => {
      if (!p.PLAYER) return;
      if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return;
      if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return;
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return;
      
      if (filters.grupo.length > 0) {
        const teamGroup = teamGroupMap.get(normalize(p.TIME));
        if (!teamGroup || !filters.grupo.some(g => normalize(g) === teamGroup)) return;
      }

      const pName = p.PLAYER;
      const kills = parseNumber(p.Abates);
      const round = p.RD || 'N/A';
      const drop = p.Q || 'Q1';
      const mapName = p.MAPA || '';

      if (!playerMap.has(pName)) {
        const teamDim = data.teamsReference.find(t => normalize(t.TIME) === normalize(p.TIME));
        playerMap.set(pName, {
          name: pName,
          team: p.TIME,
          grupo: teamDim?.GRUPO,
          playerImg: findDimImg(data.playersDimension, pName),
          teamImg: findTeamLogo(p.TIME, data.teamsReference),
          totalKills: 0,
          totalMatches: 0,
          roundKills: {},
          roundMatches: {},
          roundDrops: {}
        });
      }

      const st = playerMap.get(pName)!;
      st.totalKills += kills;
      st.totalMatches += 1;
      st.roundKills[round] = (st.roundKills[round] || 0) + kills;
      st.roundMatches[round] = (st.roundMatches[round] || 0) + 1;

      if (!st.roundDrops[round]) st.roundDrops[round] = {};
      st.roundDrops[round][drop] = { kills, map: mapName };
    });

    return Array.from(playerMap.values()).map(p => ({
      ...p,
      avgKills: p.totalMatches > 0 ? (p.totalKills / p.totalMatches).toFixed(2) : '0.00'
    }));
  }, [data.players, data.teamsReference, data.playersDimension, filters, activeTab]);

  const filteredAndSortedPlayerRounds = useMemo(() => {
    let result = playerRoundsData;

    if (playerRoundsSearch.trim()) {
      const q = playerRoundsSearch.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }

    const { field, direction } = playerRoundsSort;

    return [...result].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (field === 'name') {
        valA = a.name;
        valB = b.name;
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'team') {
        valA = a.team;
        valB = b.team;
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'totalKills') {
        valA = a.totalKills;
        valB = b.totalKills;
      } else if (field === 'totalMatches') {
        valA = a.totalMatches;
        valB = b.totalMatches;
      } else if (field === 'avgKills') {
        valA = parseFloat(a.avgKills);
        valB = parseFloat(b.avgKills);
      } else if (field.startsWith('rd_')) {
        const roundName = field.replace('rd_', '');
        valA = a.roundKills[roundName] || 0;
        valB = b.roundKills[roundName] || 0;
      }

      if (direction === 'asc') return valA - valB;
      return valB - valA;
    });
  }, [playerRoundsData, playerRoundsSearch, playerRoundsSort]);

  const playerRoundsKPIs = useMemo(() => {
    if (playerRoundsData.length === 0) return { topKiller: null, bestAvg: null, roundRecord: null, totalKills: 0 };

    let totalKills = 0;
    let topKiller = playerRoundsData[0];
    let bestAvg = playerRoundsData[0];
    let roundRecord = { player: '', round: '', kills: 0, team: '' };

    playerRoundsData.forEach(p => {
      totalKills += p.totalKills;
      if (p.totalKills > (topKiller?.totalKills || 0)) topKiller = p;
      if (parseFloat(p.avgKills) > parseFloat(bestAvg?.avgKills || '0')) bestAvg = p;

      Object.entries(p.roundKills).forEach(([rd, kVal]) => {
        const k = Number(kVal);
        if (k > roundRecord.kills) {
          roundRecord = { player: p.name, round: rd, kills: k, team: p.team };
        }
      });
    });

    return { topKiller, bestAvg, roundRecord, totalKills };
  }, [playerRoundsData]);

  const sortedDropsList = useMemo(() => {
    const drops = new Set<string>();
    data.players.forEach(p => {
      if (p.Q) drops.add(p.Q);
    });
    return Array.from(drops).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [data.players]);

  const playerDropsData = useMemo(() => {
    if (activeTab !== 'playerDrops') return { 
      playersList: [], 
      dropStatsMap: new Map<string, { drop: string; totalKills: number; totalMatches: number; zeroKillsCount: number; maps: Set<string>; zeroPlayersMap: Map<string, number> }>(), 
      kpis: { mostZeroDrop: null as any, topZeroPlayer: null as any, totalZeroMatches: 0, overallZeroRate: '0.0', mostLethalDrop: null as any } 
    };

    const teamGroupMap = new Map<string, string>();
    data.teamsReference.forEach(t => {
      if (t.TIME && t.GRUPO) teamGroupMap.set(normalize(t.TIME), normalize(t.GRUPO));
    });

    const playerMap = new Map<string, {
      name: string;
      team: string;
      grupo?: string;
      playerImg?: string;
      teamImg?: string;
      totalKills: number;
      totalMatches: number;
      zeroKillsMatches: number;
      dropKills: Record<string, number>;
      dropMatches: Record<string, number>;
      dropZeroMatches: Record<string, number>;
      dropRounds: Record<string, Record<string, { kills: number; map: string }>>;
    }>();

    const dropStats = new Map<string, {
      drop: string;
      totalKills: number;
      totalMatches: number;
      zeroKillsCount: number;
      maps: Set<string>;
      zeroPlayersMap: Map<string, number>;
    }>();

    data.players.forEach(p => {
      if (!p.PLAYER) return;
      if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return;
      if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return;
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return;
      if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return;
      
      if (filters.grupo.length > 0) {
        const teamGroup = teamGroupMap.get(normalize(p.TIME));
        if (!teamGroup || !filters.grupo.some(g => normalize(g) === teamGroup)) return;
      }

      const pName = p.PLAYER;
      const kills = parseNumber(p.Abates);
      const round = p.RD || 'N/A';
      const drop = p.Q || 'Q1';
      const mapName = p.MAPA || '';
      const isZero = kills === 0;

      if (!playerMap.has(pName)) {
        const teamDim = data.teamsReference.find(t => normalize(t.TIME) === normalize(p.TIME));
        playerMap.set(pName, {
          name: pName,
          team: p.TIME,
          grupo: teamDim?.GRUPO,
          playerImg: findDimImg(data.playersDimension, pName),
          teamImg: findTeamLogo(p.TIME, data.teamsReference),
          totalKills: 0,
          totalMatches: 0,
          zeroKillsMatches: 0,
          dropKills: {},
          dropMatches: {},
          dropZeroMatches: {},
          dropRounds: {}
        });
      }

      const st = playerMap.get(pName)!;
      st.totalKills += kills;
      st.totalMatches += 1;
      if (isZero) st.zeroKillsMatches += 1;

      st.dropKills[drop] = (st.dropKills[drop] || 0) + kills;
      st.dropMatches[drop] = (st.dropMatches[drop] || 0) + 1;
      if (isZero) st.dropZeroMatches[drop] = (st.dropZeroMatches[drop] || 0) + 1;

      if (!st.dropRounds[drop]) st.dropRounds[drop] = {};
      st.dropRounds[drop][round] = { kills, map: mapName };

      if (!dropStats.has(drop)) {
        dropStats.set(drop, {
          drop,
          totalKills: 0,
          totalMatches: 0,
          zeroKillsCount: 0,
          maps: new Set(),
          zeroPlayersMap: new Map()
        });
      }

      const ds = dropStats.get(drop)!;
      ds.totalKills += kills;
      ds.totalMatches += 1;
      if (mapName) ds.maps.add(mapName);
      if (isZero) {
        ds.zeroKillsCount += 1;
        ds.zeroPlayersMap.set(pName, (ds.zeroPlayersMap.get(pName) || 0) + 1);
      }
    });

    const playersList = Array.from(playerMap.values()).map(p => ({
      ...p,
      avgKills: p.totalMatches > 0 ? (p.totalKills / p.totalMatches).toFixed(2) : '0.00',
      zeroRate: p.totalMatches > 0 ? ((p.zeroKillsMatches / p.totalMatches) * 100).toFixed(1) : '0.0'
    }));

    let totalAllMatches = 0;
    let totalZeroMatches = 0;
    let mostZeroDrop: { drop: string; count: number; rate: string; mapList: string } | null = null;
    let mostLethalDrop: { drop: string; avgKills: string; totalKills: number } | null = null;

    dropStats.forEach((ds) => {
      totalAllMatches += ds.totalMatches;
      totalZeroMatches += ds.zeroKillsCount;

      const rate = ds.totalMatches > 0 ? ((ds.zeroKillsCount / ds.totalMatches) * 100).toFixed(1) : '0.0';
      const avgK = ds.totalMatches > 0 ? (ds.totalKills / ds.totalMatches).toFixed(2) : '0.00';
      const mapList = Array.from(ds.maps).join(', ') || 'N/A';

      if (!mostZeroDrop || ds.zeroKillsCount > mostZeroDrop.count) {
        mostZeroDrop = { drop: ds.drop, count: ds.zeroKillsCount, rate, mapList };
      }

      if (!mostLethalDrop || parseFloat(avgK) > parseFloat(mostLethalDrop.avgKills)) {
        mostLethalDrop = { drop: ds.drop, avgKills: avgK, totalKills: ds.totalKills };
      }
    });

    let topZeroPlayer = playersList.length > 0 ? playersList[0] : null;
    playersList.forEach(p => {
      if (topZeroPlayer && p.zeroKillsMatches > topZeroPlayer.zeroKillsMatches) {
        topZeroPlayer = p;
      }
    });

    const overallZeroRate = totalAllMatches > 0 ? ((totalZeroMatches / totalAllMatches) * 100).toFixed(1) : '0.0';

    return {
      playersList,
      dropStatsMap: dropStats,
      kpis: {
        mostZeroDrop,
        topZeroPlayer,
        totalZeroMatches,
        overallZeroRate,
        mostLethalDrop
      }
    };
  }, [data.players, data.teamsReference, data.playersDimension, filters, activeTab]);

  const filteredAndSortedPlayerDrops = useMemo(() => {
    let result = playerDropsData.playersList;

    if (playerDropsSearch.trim()) {
      const q = playerDropsSearch.trim().toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }

    const { field, direction } = playerDropsSort;

    return [...result].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (field === 'name') {
        valA = a.name;
        valB = b.name;
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'team') {
        valA = a.team;
        valB = b.team;
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (field === 'totalKills') {
        valA = a.totalKills;
        valB = b.totalKills;
      } else if (field === 'totalMatches') {
        valA = a.totalMatches;
        valB = b.totalMatches;
      } else if (field === 'avgKills') {
        valA = parseFloat(a.avgKills);
        valB = parseFloat(b.avgKills);
      } else if (field === 'zeroKillsMatches') {
        valA = a.zeroKillsMatches;
        valB = b.zeroKillsMatches;
      } else if (field.startsWith('drop_')) {
        const dropName = field.replace('drop_', '');
        valA = a.dropKills[dropName] || 0;
        valB = b.dropKills[dropName] || 0;
      } else if (field.startsWith('dropZero_')) {
        const dropName = field.replace('dropZero_', '');
        valA = a.dropZeroMatches[dropName] || 0;
        valB = b.dropZeroMatches[dropName] || 0;
      }

      if (direction === 'asc') return valA - valB;
      return valB - valA;
    });
  }, [playerDropsData.playersList, playerDropsSearch, playerDropsSort]);

  // Dados para Reis do Mapa (Mapas e Quedas)
  const mapKingsData = useMemo(() => {
    if (activeTab !== "mapKings") return { byMap: [], byDrop: [] };

    const filtered = data.players.filter(p => {
        if (filters.team.length > 0 && !filters.team.includes(p.TIME)) return false;
        if (filters.players.length > 0 && !filters.players.some(fp => normalize(fp) === normalize(p.PLAYER))) return false;
        if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
        const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(p.RD));
        const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(p.Q));
        return matchRD && matchQ;
    });

    const processGroup = (keyExtractor: (p: PlayerData) => string) => {
        const groupMap = new Map<string, Map<string, any>>();
        
        filtered.forEach(p => {
            const key = keyExtractor(p);
            if (!key) return;

            if (!groupMap.has(key)) {
                groupMap.set(key, new Map());
            }
            const playerMap = groupMap.get(key)!;
            
            const pName = normalize(p.PLAYER);
            if (!pName) return;

            if (!playerMap.has(pName)) {
                playerMap.set(pName, {
                    name: p.PLAYER,
                    team: p.TIME,
                    playerImg: findDimImg(data.playersDimension, p.PLAYER) || '',
                    teamImg: findTeamLogo(p.TIME, data.teamsReference),
                    kills: 0,
                    damage: 0,
                    hs: 0,
                    knocks: 0,
                    reviveu: 0,
                    aliadosRevividos: 0,
                    mvp: 0,
                    matches: 0,
                    zeroKills: 0,
                    withKills: 0
                });
            }
            
            const stats = playerMap.get(pName);
            const kills = parseNumber(p.Abates);
            
            stats.kills += kills;
            stats.damage += parseNumber(p.Dano);
            stats.hs += parseNumber(p.HS);
            stats.knocks += parseNumber(p.Deitados);
            stats.reviveu += parseNumber(p.Reviveu);
            stats.aliadosRevividos += parseNumber(p.AliadosRevividos);
            stats.mvp += parseNumber(p.MVP);
            stats.matches += 1;
            
            if (kills === 0) stats.zeroKills += 1;
            else stats.withKills += 1;
        });

        return Array.from(groupMap.entries()).map(([groupName, playersMap]) => {
            const players = Array.from(playersMap.values()).map(p => ({
                ...p,
                avgKills: p.matches > 0 ? (p.kills / p.matches) : 0,
                avgDamage: p.matches > 0 ? (p.damage / p.matches) : 0,
                zeroRate: p.matches > 0 ? (p.zeroKills / p.matches) * 100 : 0
            })).sort((a, b) => b.kills - a.kills || b.avgKills - a.avgKills);

            const getTop = (sortFn: (a: any, b: any) => number) => [...players].sort(sortFn)[0] || null;

            return {
                name: groupName,
                players,
                topDamage: getTop((a, b) => b.damage - a.damage),
                topAvgKills: getTop((a, b) => b.avgKills - a.avgKills),
                topKnocks: getTop((a, b) => b.knocks - a.knocks),
                topHs: getTop((a, b) => b.hs - a.hs),
                topZero: getTop((a, b) => b.zeroKills - a.zeroKills),
                topRevives: getTop((a, b) => b.reviveu - a.reviveu),
                topAlliesRevived: getTop((a, b) => b.aliadosRevividos - a.aliadosRevividos),
                topMvp: getTop((a, b) => b.mvp - a.mvp)
            };
        }).sort((a, b) => {
           const numA = parseInt(a.name.replace(/\D/g, ""));
           const numB = parseInt(b.name.replace(/\D/g, ""));
           if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
           return a.name.localeCompare(b.name);
        });
    };

    const byMap = processGroup(p => (p.MAPA || "").trim().toUpperCase());
    const byDrop = processGroup(p => (p.Q || "").trim().toUpperCase());

    return { byMap, byDrop };
  }, [data.players, filters, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 no-print">
        {[
            { id: "ranking", label: "Ranking Geral", icon: <Trophy size={18} /> },
            { id: "mapKings", label: "Reis do Mapa", icon: <Crown size={18} /> },
            { id: 'playerRounds', label: 'Kills por Rodada', icon: <ListOrdered size={18} /> },
            { id: 'playerDrops', label: 'Kills por Queda', icon: <Target size={18} /> },
            { id: 'stats', label: 'Estatísticas', icon: <BarChart2 size={18} /> },
            { id: 'roles', label: 'Funções', icon: <LayoutGrid size={18} /> },
            { id: 'chars', label: 'Loadouts', icon: <User size={18} /> },
            { id: 'auditoria', label: 'Auditoria Kills', icon: <Shield size={18} /> },
            { id: 'compare', label: 'Duelo', icon: <Swords size={18} /> },
            { id: 'report', label: 'Perfil Individual', icon: <Activity size={18} /> },
        ].map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase transition-all tracking-wider ${activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      <div className="flex justify-between items-center no-print bg-black/20 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-yellow-500" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Métricas e Estatísticas</span>
          <span className="text-[10px] text-gray-500 hidden sm:inline">• Entenda o significado de cada coluna da tabela</span>
        </div>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            showLegend 
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' 
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          {showLegend ? 'Ocultar Legenda' : 'Ver Legenda das Colunas'}
        </button>
      </div>

      {showLegend && (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" />
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Significado de Cada Coluna</h4>
            </div>
            <button 
              onClick={() => setShowLegend(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { abbrev: 'K', desc: 'Abates (Kills)', detail: 'Quantidade total de abates do jogador.' },
              { abbrev: 'S', desc: 'Saldo de Abates', detail: 'Diferença entre abates totais e partidas jogadas (Abates - Partidas).' },
              { abbrev: '% C', desc: 'Contribuição de Abates', detail: 'Percentual de abates do jogador em relação aos abates totais da equipe.' },
              { abbrev: 'AVG K', desc: 'Média de Abates', detail: 'Média de abates por queda (partida) disputada.' },
              { abbrev: 'Q. C/ KILL', desc: 'Quedas com Abate', detail: 'Número e percentual de partidas onde o jogador fez pelo menos 1 abate.' },
              { abbrev: 'Q. ZERO', desc: 'Quedas Zeradas', detail: 'Número e percentual de partidas concluídas sem realizar abates.' },
              { abbrev: 'DMG', desc: 'Dano Total', detail: 'Quantidade de dano total infligido aos adversários.' },
              { abbrev: 'AVG D', desc: 'Média de Dano', detail: 'Média de dano causado por queda (partida) jogada.' },
              { abbrev: 'AST', desc: 'Assistências', detail: 'Quantidade de assistências em abates realizadas.' },
              { abbrev: 'HS', desc: 'Headshots', detail: 'Quantidade total de abates com tiro na cabeça.' },
              { abbrev: 'KNK', desc: 'Deitados (Knockdowns)', detail: 'Quantidade de oponentes derrubados pelo jogador.' },
              { abbrev: 'AVG KNK', desc: 'Média de Deitados', detail: 'Média de oponentes derrubados por queda jogada.' },
              { abbrev: 'PJ', desc: 'Partidas Jogadas', detail: 'Quantidade total de quedas (salas) que o jogador disputou.' },
              { abbrev: 'GLO', desc: 'Gelos Colocados', detail: 'Quantidade total de paredes de gelo colocadas pelo jogador.' },
              { abbrev: 'DES', desc: 'Gelos Destruídos', detail: 'Quantidade de paredes de gelo adversárias destruídas pelo jogador.' },
              { abbrev: 'REV', desc: 'Reviveu', detail: 'Vezes em que o jogador utilizou o sistema para reviver companheiros de equipe.' },
              { abbrev: 'ALR', desc: 'Aliados Revividos', detail: 'Vezes em que o jogador levantou aliados que estavam caídos (deitados).' },
              { abbrev: 'MVP', desc: 'Most Valuable Player', detail: 'Quantidade de vezes em que o jogador foi o destaque (MVP) de uma queda.' },
              { abbrev: 'TOT S', desc: 'Total Safes', detail: 'Quantidade de abates realizados pelo jogador dentro das safe zones.' },
              { abbrev: 'S1 a S8', desc: 'Safes Específicas', detail: 'Quantidade de abates do jogador em cada um dos círculos de safe zone.' },
              { abbrev: 'OUT', desc: 'Fora de Safe', detail: 'Quantidade de abates realizados pelo jogador fora de qualquer círculo de safe zone.' }
            ].map((item, index) => (
              <div key={index} className="p-3 bg-black/40 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all flex flex-col gap-1 group">
                <span className="text-yellow-500 font-black text-xs uppercase tracking-wider group-hover:text-yellow-400 transition-colors">{item.abbrev}</span>
                <span className="text-white font-bold text-[10px] leading-tight">{item.desc}</span>
                <span className="text-gray-400 text-[9px] leading-normal">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-[600px]">
          {activeTab === 'playerRounds' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                    <Trophy size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">LÍDER DE KILLS</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">{playerRoundsKPIs.topKiller?.name || '-'}</span>
                    <span className="text-xs font-black text-red-500 italic">{playerRoundsKPIs.topKiller?.totalKills || 0} Kills Totais</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20">
                    <Zap size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">MAIOR MÉDIA</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">{playerRoundsKPIs.bestAvg?.name || '-'}</span>
                    <span className="text-xs font-black text-yellow-500 italic">{playerRoundsKPIs.bestAvg?.avgKills || '0.00'} Kills/Queda</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                    <Flame size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">RECORDE EM 1 RODADA</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">{playerRoundsKPIs.roundRecord?.player || '-'}</span>
                    <span className="text-xs font-black text-amber-500 italic">{playerRoundsKPIs.roundRecord?.kills || 0} Kills ({playerRoundsKPIs.roundRecord?.round || 'RD'})</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                    <TargetIcon size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">TOTAL DE KILLS</span>
                    <span className="text-2xl font-black italic text-blue-400 leading-none">{playerRoundsKPIs.totalKills.toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-gray-500 block mt-0.5">{playerRoundsData.length} Jogadores Registrados</span>
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl space-y-4">
                {/* Search and Header bar */}
                <div className="p-6 bg-black/40 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                      <ListOrdered size={20} className="text-yellow-500" />
                      TABELA DE KILLS POR RODADA DOS JOGADORES
                    </h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                      Abates obtidos por cada jogador em todas as rodadas do campeonato. Clique no nome para ver o perfil individual.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text"
                      value={playerRoundsSearch}
                      onChange={(e) => setPlayerRoundsSearch(e.target.value)}
                      placeholder="Buscar jogador ou equipe..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 font-bold outline-none focus:border-yellow-500 transition-colors"
                    />
                    {playerRoundsSearch && (
                      <button 
                        onClick={() => setPlayerRoundsSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Legenda de Desempenho (Kills vs Quedas/PJ) */}
                <div className="px-6 py-3 bg-black/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Relação Kills vs Quedas (PJ):</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>POSITIVO (Kills &gt; Quedas)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-black text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      <span>NEUTRO / PAR (Kills = Quedas)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 font-black text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span>NEGATIVO (Kills &lt; Quedas)</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase italic">
                    *Passe o cursor sobre a célula para ver o saldo exato (+2, 0, -1)
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar p-2">
                  <table className="w-full text-left whitespace-nowrap border-collapse">
                    <thead>
                      <tr className="bg-black/60 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                        <th className="px-4 py-4 text-center w-12">#</th>
                        <th 
                          className="px-4 py-4 cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerRoundsSort(prev => ({ field: 'name', direction: prev.field === 'name' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        >
                          <div className="flex items-center gap-1">
                            JOGADOR
                            {playerRoundsSort.field === 'name' && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerRoundsSort(prev => ({ field: 'team', direction: prev.field === 'team' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        >
                          <div className="flex items-center gap-1">
                            EQUIPE
                            {playerRoundsSort.field === 'team' && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-center bg-red-950/20 text-red-500 cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => setPlayerRoundsSort(prev => ({ field: 'totalKills', direction: prev.field === 'totalKills' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1 font-black">
                            KILLS
                            {playerRoundsSort.field === 'totalKills' && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-center text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerRoundsSort(prev => ({ field: 'totalMatches', direction: prev.field === 'totalMatches' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            PJ
                            {playerRoundsSort.field === 'totalMatches' && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors"
                          onClick={() => setPlayerRoundsSort(prev => ({ field: 'avgKills', direction: prev.field === 'avgKills' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <div className="flex items-center justify-center gap-1">
                            MÉDIA
                            {playerRoundsSort.field === 'avgKills' && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                          </div>
                        </th>

                        {/* Dynamic Round Columns */}
                        {sortedRoundsList.map(rd => {
                          const isSortedRD = playerRoundsSort.field === `rd_${rd}`;
                          return (
                            <th 
                              key={rd}
                              className={`px-4 py-4 text-center cursor-pointer min-w-[75px] hover:text-white transition-colors ${isSortedRD ? 'text-yellow-500 bg-white/[0.03]' : 'text-gray-300'}`}
                              onClick={() => setPlayerRoundsSort(prev => ({ field: `rd_${rd}`, direction: prev.field === `rd_${rd}` && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                            >
                              <div className="flex items-center justify-center gap-0.5">
                                {rd}
                                {isSortedRD && (playerRoundsSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {filteredAndSortedPlayerRounds.length === 0 ? (
                        <tr>
                          <td colSpan={6 + sortedRoundsList.length} className="py-12 text-center text-gray-500 font-bold text-sm">
                            Nenhum jogador encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        filteredAndSortedPlayerRounds.map((p, index) => {
                          const rank = index + 1;
                          let rankBadge = "w-6 h-6 rounded flex items-center justify-center font-black text-xs ";
                          if (rank === 1) rankBadge += "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]";
                          else if (rank === 2) rankBadge += "bg-gray-300 text-black";
                          else if (rank === 3) rankBadge += "bg-amber-600 text-white";
                          else if (rank <= 12) rankBadge += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                          else rankBadge += "bg-black/60 text-gray-500 border border-white/5";

                          return (
                            <tr key={p.name} className="hover:bg-white/[0.03] transition-colors group">
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center items-center">
                                  <span className={rankBadge}>{rank}</span>
                                </div>
                              </td>

                              {/* Player Info */}
                              <td className="px-4 py-3">
                                <div 
                                  onClick={() => { setFilters(prev => ({ ...prev, players: [p.name] })); setActiveTab('report'); }}
                                  className="flex items-center gap-3 cursor-pointer group/p"
                                >
                                  <div className="w-8 h-8 rounded-full bg-black border border-white/10 overflow-hidden flex-shrink-0 relative">
                                    {p.playerImg ? (
                                      <img src={p.playerImg} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-600"><User size={14} /></div>
                                    )}
                                  </div>
                                  <span className="text-xs font-black uppercase italic tracking-tight text-white group-hover/p:text-yellow-500 transition-colors">
                                    {p.name}
                                  </span>
                                </div>
                              </td>

                              {/* Team Info */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-black border border-gray-800 p-0.5 flex-shrink-0 flex items-center justify-center">
                                    {p.teamImg ? (
                                      <img src={p.teamImg} alt={p.team} className="w-full h-full object-contain" />
                                    ) : (
                                      <Shield size={12} className="text-gray-700" />
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-300 uppercase truncate max-w-[120px]">{p.team}</span>
                                    {p.grupo && <span className="text-[8px] font-black text-gray-500 uppercase">{p.grupo}</span>}
                                  </div>
                                </div>
                              </td>

                              {/* Total Kills */}
                              <td className="px-4 py-3 text-center bg-red-950/10 border-x border-red-900/10">
                                <span className="text-sm font-black italic text-red-500">{p.totalKills}</span>
                              </td>

                              {/* Total Matches */}
                              <td className="px-4 py-3 text-center font-bold text-xs text-gray-400">
                                {p.totalMatches}
                              </td>

                              {/* Avg Kills */}
                              <td className="px-4 py-3 text-center font-black text-xs text-yellow-500 italic bg-yellow-500/5">
                                {p.avgKills}
                              </td>

                              {/* Round Cells */}
                              {sortedRoundsList.map(rd => {
                                const kills = p.roundKills[rd];
                                const matches = p.roundMatches[rd] || 0;
                                const isExistent = kills !== undefined && matches > 0;
                                const hasDrops = p.roundDrops[rd] && Object.keys(p.roundDrops[rd]).length > 0;

                                if (!isExistent) {
                                  return (
                                    <td key={rd} className="px-3 py-3 text-center text-xs font-mono">
                                      <span className="text-gray-700 font-bold">-</span>
                                    </td>
                                  );
                                }

                                const diff = kills - matches;
                                const isPositive = kills > matches;
                                const isNeutral = kills === matches;

                                const tooltipText = `${kills} ${kills === 1 ? 'kill' : 'kills'} em ${matches} ${matches === 1 ? 'queda' : 'quedas'} (${isPositive ? `Positivo +${diff}` : isNeutral ? 'Neutro / Par (0)' : `Negativo ${diff}`})`;

                                return (
                                  <td 
                                    key={rd} 
                                    className="px-3 py-3 text-center text-xs font-mono"
                                    onClick={() => {
                                      if (hasDrops) {
                                        setSelectedPlayerRoundDrop({
                                          player: p.name,
                                          playerImg: p.playerImg,
                                          teamImg: p.teamImg,
                                          team: p.team,
                                          round: rd,
                                          kills: kills || 0,
                                          matches,
                                          drops: p.roundDrops[rd]
                                        });
                                      }
                                    }}
                                  >
                                    {isPositive ? (
                                      <span 
                                        className="inline-flex items-center justify-center gap-1 min-w-[36px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-xs hover:scale-110 cursor-pointer transition-all shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                        title={tooltipText}
                                      >
                                        {kills >= matches * 2 && <Flame size={10} className="text-emerald-400 animate-pulse" />}
                                        {kills}
                                      </span>
                                    ) : isNeutral ? (
                                      <span 
                                        className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-md bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black text-xs hover:scale-110 cursor-pointer transition-all"
                                        title={tooltipText}
                                      >
                                        {kills}
                                      </span>
                                    ) : (
                                      <span 
                                        className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-md ${kills === 0 ? 'bg-red-950/60 border border-red-800/50 text-red-500 font-black' : 'bg-red-500/15 border border-red-500/30 text-red-400 font-bold'} text-xs hover:scale-110 cursor-pointer transition-all`}
                                        title={tooltipText}
                                      >
                                        {kills}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drop Breakdown Modal for Selected Player Round */}
              {selectedPlayerRoundDrop && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black border border-yellow-500/30 overflow-hidden flex-shrink-0">
                          {selectedPlayerRoundDrop.playerImg ? (
                            <img src={selectedPlayerRoundDrop.playerImg} alt={selectedPlayerRoundDrop.player} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600"><User size={18} /></div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase italic">{selectedPlayerRoundDrop.player}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                            <span>{selectedPlayerRoundDrop.team}</span>
                            <span>•</span>
                            <span className="text-yellow-500">{selectedPlayerRoundDrop.round}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedPlayerRoundDrop(null)}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Summary Info */}
                    {(() => {
                      const k = selectedPlayerRoundDrop.kills;
                      const m = selectedPlayerRoundDrop.matches;
                      const diff = k - m;
                      const isPos = k > m;
                      const isNeu = k === m;

                      return (
                        <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-2xl border border-white/5">
                          <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Resumo na {selectedPlayerRoundDrop.round}</span>
                            <span className="text-xs font-bold text-gray-300">{m} {m === 1 ? 'Queda jogada' : 'Quedas jogadas'}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-base font-black text-white italic leading-none">{k} {k === 1 ? 'Kill' : 'Kills'}</span>
                            {isPos ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase">
                                <Flame size={10} /> POSITIVO (+{diff})
                              </span>
                            ) : isNeu ? (
                              <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] font-black uppercase">
                                NEUTRO / PAR (0)
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase">
                                NEGATIVO ({diff})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Detalhamento por Queda:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedPlayerRoundDrop.drops).sort((a,b) => a[0].localeCompare(b[0])).map(([drop, dInfoVal]) => {
                          const dInfo = dInfoVal as { kills: number; map: string };
                          return (
                            <div key={drop} className="bg-black/60 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-yellow-500 uppercase">{drop}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[80px]">{dInfo.map}</span>
                              </div>
                              <span className="text-sm font-black text-white italic mt-1">{dInfo.kills} {dInfo.kills === 1 ? 'Kill' : 'Kills'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, players: [selectedPlayerRoundDrop.player] }));
                        setActiveTab('report');
                        setSelectedPlayerRoundDrop(null);
                      }}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20"
                    >
                      Ver Perfil Completo do Jogador
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'playerDrops' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">QUEDA C/ MAIS ZERADAS</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">
                      {playerDropsData.kpis.mostZeroDrop ? `QUEDA ${playerDropsData.kpis.mostZeroDrop.drop}` : '-'}
                    </span>
                    <span className="text-xs font-black text-red-400 italic block">
                      {playerDropsData.kpis.mostZeroDrop ? `${playerDropsData.kpis.mostZeroDrop.count} partidas zeradas (${playerDropsData.kpis.mostZeroDrop.rate}%)` : '0 zeradas'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold truncate block">
                      {playerDropsData.kpis.mostZeroDrop?.mapList ? `Mapas: ${playerDropsData.kpis.mostZeroDrop.mapList}` : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20">
                    <Skull size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">JOGADOR MAIS ZERADO</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">
                      {playerDropsData.kpis.topZeroPlayer?.name || '-'}
                    </span>
                    <span className="text-xs font-black text-yellow-500 italic block">
                      {playerDropsData.kpis.topZeroPlayer ? `${playerDropsData.kpis.topZeroPlayer.zeroKillsMatches} de ${playerDropsData.kpis.topZeroPlayer.totalMatches} quedas (${playerDropsData.kpis.topZeroPlayer.zeroRate}%)` : '0 zeradas'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold truncate block">
                      {playerDropsData.kpis.topZeroPlayer?.team ? `Equipe: ${playerDropsData.kpis.topZeroPlayer.team}` : ''}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 border border-orange-500/20">
                    <Target size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">TOTAL DE QUEDAS ZERADAS</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">
                      {playerDropsData.kpis.totalZeroMatches} Partidas
                    </span>
                    <span className="text-xs font-black text-orange-400 italic block">
                      {playerDropsData.kpis.overallZeroRate}% do total de partidas
                    </span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-xl">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                    <Flame size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">QUEDA MAIS LETAL</span>
                    <span className="text-base font-black italic uppercase text-white truncate block">
                      {playerDropsData.kpis.mostLethalDrop ? `QUEDA ${playerDropsData.kpis.mostLethalDrop.drop}` : '-'}
                    </span>
                    <span className="text-xs font-black text-emerald-400 italic block">
                      {playerDropsData.kpis.mostLethalDrop ? `${playerDropsData.kpis.mostLethalDrop.avgKills} Kills / Jogador` : '0 Kills'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold truncate block">
                      {playerDropsData.kpis.mostLethalDrop ? `Total de ${playerDropsData.kpis.mostLethalDrop.totalKills} abates` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Análise de Quedas Zeradas por Posição/Sala */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Skull className="text-red-500" size={18} />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Análise de Quedas Zeradas por Posição na Sala (Q1 - Q6)</h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Identifique onde os jogadores mais sofrem para abater adversários
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {sortedDropsList.map(dropName => {
                    const ds = playerDropsData.dropStatsMap.get(dropName);
                    if (!ds) return null;

                    const zeroRateNum = ds.totalMatches > 0 ? (ds.zeroKillsCount / ds.totalMatches) * 100 : 0;
                    const mapNames = Array.from(ds.maps).join('/') || 'Vários';
                    const avgK = ds.totalMatches > 0 ? (ds.totalKills / ds.totalMatches).toFixed(2) : '0.00';

                    // Top zero players in this drop
                    const topZeroForThisDrop = Array.from(ds.zeroPlayersMap.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3);

                    return (
                      <div key={dropName} className="bg-black/50 border border-white/5 hover:border-red-500/30 rounded-2xl p-3 flex flex-col justify-between gap-3 transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-yellow-500 uppercase">{dropName}</span>
                            <span className="text-[9px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded uppercase truncate max-w-[70px]">{mapNames}</span>
                          </div>
                          
                          <div className="pt-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase block">Quedas Zeradas:</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-red-400 italic">{ds.zeroKillsCount}</span>
                              <span className="text-[10px] font-bold text-gray-500">({zeroRateNum.toFixed(1)}%)</span>
                            </div>
                          </div>

                          {/* Zero Rate Bar */}
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full"
                              style={{ width: `${Math.min(100, zeroRateNum)}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-gray-500 pt-1 font-bold">
                            <span>Média: <strong className="text-gray-300">{avgK}</strong></span>
                            <span>Total: <strong className="text-white">{ds.totalKills} k</strong></span>
                          </div>
                        </div>

                        {/* Top Zero Players list for this drop */}
                        {topZeroForThisDrop.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-wider block">Mais Zerados em {dropName}:</span>
                            <div className="space-y-1">
                              {topZeroForThisDrop.map(([pName, zCount]) => {
                                return (
                                  <div key={pName} className="flex items-center justify-between text-[9px]">
                                    <span className="text-gray-300 font-bold truncate max-w-[80px]">{pName}</span>
                                    <span className="text-red-400 font-black">{zCount}x zero</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Matrix Table: Kills & Quedas Zeradas por Jogador */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Search & Header bar */}
                <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Target size={18} className="text-yellow-500" />
                      Matriz de Kills e Quedas Zeradas por Jogador
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Acompanhe os abates acumulados e a frequência de jogos zerados em cada queda (Q1 a Q6)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="Buscar jogador ou equipe..."
                        value={playerDropsSearch}
                        onChange={(e) => setPlayerDropsSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-bar showing legend */}
                <div className="px-6 py-3 bg-black/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Legenda da Célula de Queda:</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[11px]">
                      <span>5 Kills (0 Zero)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-black text-[11px]">
                      <span>2 Kills (1 Zero)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800/60 text-red-400 font-black text-[11px]">
                      <Skull size={10} />
                      <span>100% Zerada (0 Kills)</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase italic">
                    *Clique em qualquer célula para ver o histórico do jogador naquela queda
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar p-2">
                  <table className="w-full text-left whitespace-nowrap border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <th className="px-3 py-3 text-center">#</th>
                        <th 
                          className="px-3 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'name', direction: prev.field === 'name' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        >
                          Jogador {playerDropsSort.field === 'name' && (playerDropsSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-3 py-3 cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'team', direction: prev.field === 'team' && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        >
                          Equipe {playerDropsSort.field === 'team' && (playerDropsSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors text-yellow-500"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'totalKills', direction: prev.field === 'totalKills' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          Kills {playerDropsSort.field === 'totalKills' && (playerDropsSort.direction === 'desc' ? '↓' : '↑')}
                        </th>
                        <th 
                          className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'totalMatches', direction: prev.field === 'totalMatches' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          PJ {playerDropsSort.field === 'totalMatches' && (playerDropsSort.direction === 'desc' ? '↓' : '↑')}
                        </th>
                        <th 
                          className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'avgKills', direction: prev.field === 'avgKills' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                        >
                          Média {playerDropsSort.field === 'avgKills' && (playerDropsSort.direction === 'desc' ? '↓' : '↑')}
                        </th>
                        <th 
                          className="px-3 py-3 text-center cursor-pointer hover:text-white transition-colors text-red-400"
                          onClick={() => setPlayerDropsSort(prev => ({ field: 'zeroKillsMatches', direction: prev.field === 'zeroKillsMatches' && prev.direction === 'desc' ? 'asc' : 'desc' }))}
                          title="Quantidade e % de partidas que o jogador concluiu com 0 Kills"
                        >
                          Q. Zero {playerDropsSort.field === 'zeroKillsMatches' && (playerDropsSort.direction === 'desc' ? '↓' : '↑')}
                        </th>

                        {/* Drop Columns */}
                        {sortedDropsList.map(dropName => (
                          <th 
                            key={dropName} 
                            className="px-3 py-3 text-center cursor-pointer hover:text-yellow-400 transition-colors bg-white/[0.02] border-l border-white/5"
                            onClick={() => setPlayerDropsSort(prev => ({ 
                              field: `drop_${dropName}`, 
                              direction: prev.field === `drop_${dropName}` && prev.direction === 'desc' ? 'asc' : 'desc' 
                            }))}
                            title={`Clique para ordenar por kills na ${dropName}`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-yellow-500 font-black">{dropName}</span>
                              <span className="text-[8px] text-gray-500 font-normal lowercase">kills</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredAndSortedPlayerDrops.map((p, idx) => {
                        return (
                          <tr key={p.name} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-3 py-3 text-center font-mono font-bold text-gray-500">{idx + 1}</td>
                            
                            {/* Player */}
                            <td className="px-3 py-3">
                              <button 
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, players: [p.name] }));
                                  setActiveTab('report');
                                }}
                                className="flex items-center gap-2.5 text-left group"
                              >
                                <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-yellow-500 transition-colors">
                                  {p.playerImg ? (
                                    <img src={p.playerImg} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600"><User size={14} /></div>
                                  )}
                                </div>
                                <span className="font-black text-white group-hover:text-yellow-500 transition-colors italic uppercase">{p.name}</span>
                              </button>
                            </td>

                            {/* Team */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded overflow-hidden bg-black/40 flex-shrink-0">
                                  {p.teamImg && <img src={p.teamImg} alt={p.team} className="w-full h-full object-contain" />}
                                </div>
                                <span className="text-gray-400 font-bold text-[11px] truncate max-w-[100px]">{p.team}</span>
                              </div>
                            </td>

                            {/* Total Kills */}
                            <td className="px-3 py-3 text-center font-black text-yellow-500 text-sm italic">{p.totalKills}</td>

                            {/* Matches (PJ) */}
                            <td className="px-3 py-3 text-center font-mono font-bold text-gray-300">{p.totalMatches}</td>

                            {/* Avg Kills */}
                            <td className="px-3 py-3 text-center font-mono font-bold text-gray-400">{p.avgKills}</td>

                            {/* Zero Matches & % */}
                            <td className="px-3 py-3 text-center">
                              {p.zeroKillsMatches > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 font-black text-xs">
                                  {p.zeroKillsMatches} <span className="text-[9px] text-red-400/70 font-normal">({p.zeroRate}%)</span>
                                </span>
                              ) : (
                                <span className="text-gray-600 font-bold">-</span>
                              )}
                            </td>

                            {/* Drop Cells */}
                            {sortedDropsList.map(dropName => {
                              const kills = p.dropKills[dropName] || 0;
                              const matches = p.dropMatches[dropName] || 0;
                              const zeros = p.dropZeroMatches[dropName] || 0;
                              const isExistent = matches > 0;

                              if (!isExistent) {
                                return (
                                  <td key={dropName} className="px-3 py-3 text-center text-xs font-mono border-l border-white/5">
                                    <span className="text-gray-700 font-bold">-</span>
                                  </td>
                                );
                              }

                              const isAllZero = zeros === matches && kills === 0;
                              const hasSomeZero = zeros > 0;

                              const tooltipText = `${p.name} na ${dropName}: ${kills} kills em ${matches} jogos (${zeros} jogos com 0 kills)`;

                              return (
                                <td 
                                  key={dropName}
                                  className="px-3 py-3 text-center text-xs font-mono border-l border-white/5"
                                  onClick={() => {
                                    setSelectedPlayerDropDetail({
                                      player: p.name,
                                      playerImg: p.playerImg,
                                      teamImg: p.teamImg,
                                      team: p.team,
                                      drop: dropName,
                                      kills,
                                      matches,
                                      zeroCount: zeros,
                                      rounds: p.dropRounds[dropName] || {}
                                    });
                                  }}
                                >
                                  {isAllZero ? (
                                    <span 
                                      className="inline-flex items-center justify-center gap-1 min-w-[40px] px-2 py-0.5 rounded-md bg-red-950/80 border border-red-800/60 text-red-400 font-black text-xs hover:scale-110 cursor-pointer transition-all"
                                      title={tooltipText}
                                    >
                                      <Skull size={10} /> 0
                                    </span>
                                  ) : hasSomeZero ? (
                                    <span 
                                      className="inline-flex items-center justify-center gap-1 min-w-[40px] px-2 py-0.5 rounded-md bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black text-xs hover:scale-110 cursor-pointer transition-all"
                                      title={tooltipText}
                                    >
                                      {kills} <span className="text-[9px] text-red-400 font-bold">({zeros}z)</span>
                                    </span>
                                  ) : (
                                    <span 
                                      className="inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black text-xs hover:scale-110 cursor-pointer transition-all shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                      title={tooltipText}
                                    >
                                      {kills}
                                    </span>
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

              {/* Modal de Detalhamento da Queda */}
              {selectedPlayerDropDetail && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black/60 border border-white/10 overflow-hidden flex-shrink-0">
                          {selectedPlayerDropDetail.playerImg ? (
                            <img src={selectedPlayerDropDetail.playerImg} alt={selectedPlayerDropDetail.player} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600"><User size={18} /></div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase italic">{selectedPlayerDropDetail.player}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                            <span>{selectedPlayerDropDetail.team}</span>
                            <span>•</span>
                            <span className="text-yellow-500">{selectedPlayerDropDetail.drop}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedPlayerDropDetail(null)}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl border border-white/5"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Summary Info */}
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Total de Abates na {selectedPlayerDropDetail.drop}:</span>
                        <span className="text-base font-black text-yellow-500 italic">{selectedPlayerDropDetail.kills} Kills</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Partidas Disputadas na {selectedPlayerDropDetail.drop}:</span>
                        <span className="text-white font-mono font-bold">{selectedPlayerDropDetail.matches} Jogos</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Jogos Zerados na {selectedPlayerDropDetail.drop}:</span>
                        <span className={selectedPlayerDropDetail.zeroCount > 0 ? 'text-red-400 font-black' : 'text-emerald-400 font-black'}>
                          {selectedPlayerDropDetail.zeroCount} {selectedPlayerDropDetail.zeroCount === 1 ? 'partida' : 'partidas'}
                        </span>
                      </div>
                    </div>

                    {/* Round-by-round list for this drop */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Detalhamento por Rodada na {selectedPlayerDropDetail.drop}:</span>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {Object.entries(selectedPlayerDropDetail.rounds).sort((a,b) => a[0].localeCompare(b[0])).map(([round, rInfoVal]) => {
                          const rInfo = rInfoVal as { kills: number; map: string };
                          const isZero = rInfo.kills === 0;

                          return (
                            <div key={round} className="bg-black/60 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-yellow-500 uppercase">{round}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase bg-white/5 px-2 py-0.5 rounded">{rInfo.map}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black italic ${isZero ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {rInfo.kills} {rInfo.kills === 1 ? 'Kill' : 'Kills'}
                                </span>
                                {isZero ? (
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[8px] font-black uppercase">ZEROU</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">OK</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setFilters(prev => ({ ...prev, players: [selectedPlayerDropDetail.player] }));
                        setActiveTab('report');
                        setSelectedPlayerDropDetail(null);
                      }}
                      className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-yellow-500/20"
                    >
                      Ver Perfil Completo do Jogador
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                  {/* Seleção de Função & Barra de Busca */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141414] p-4 rounded-2xl border border-white/5 shadow-xl">
                      <div className="flex flex-wrap gap-2">
                          {rolesData.bestsByRole.map(group => {
                              const isSelected = (activeRole === group.role || (!activeRole && rolesData.bestsByRole[0]?.role === group.role));
                              return (
                                  <button
                                      key={group.role}
                                      onClick={() => setActiveRole(group.role)}
                                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                          isSelected
                                              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105'
                                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                      }`}
                                  >
                                      {group.role === 'TODAS AS FUNÇÕES' ? (
                                          <Users size={14} className={isSelected ? 'text-black' : 'text-yellow-500'} />
                                      ) : (
                                          <Crown size={14} className={isSelected ? 'text-black' : 'text-yellow-500'} />
                                      )}
                                      <span>{group.role}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? 'bg-black/20 text-black' : 'bg-black/40 text-gray-500'}`}>
                                          {group.players.length}
                                      </span>
                                  </button>
                              );
                          })}
                      </div>

                      {/* Busca dentro da Função */}
                      <div className="relative min-w-[240px]">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                              type="text"
                              value={roleSearch}
                              onChange={(e) => setRoleSearch(e.target.value)}
                              placeholder="Buscar jogador ou equipe..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                          />
                          {roleSearch && (
                              <button
                                  onClick={() => setRoleSearch('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                              >
                                  <X size={12} />
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Atalhos de Filtro / Ordenação Rápida do Ranking */}
                  <div className="bg-[#181818] p-4 rounded-2xl border border-white/5 flex flex-col gap-3 shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                              <Trophy size={16} className="text-yellow-500" />
                              <span className="text-xs font-black uppercase text-white tracking-wider">Filtrar Ranking por Métrica:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                              {[
                                  { label: 'Abates (Kills)', field: 'kills', icon: Skull },
                                  { label: 'Dano Total', field: 'damage', icon: Flame },
                                  { label: 'Média Kills', field: 'avg', icon: Target },
                                  { label: 'Knocks (Deitados)', field: 'knocks', icon: Zap },
                                  { label: 'MVP', field: 'mvp', icon: AwardIcon => <Crown size={12} /> },
                                  { label: 'Assistências', field: 'assists', icon: Users },
                                  { label: 'Headshots', field: 'hs', icon: Crosshair },
                                  { label: 'Gelos', field: 'gelos', icon: Shield },
                                  { label: 'Revives', field: 'reviveu', icon: Activity },
                                  { label: 'Saldo (Diff)', field: 'diff', icon: Scale },
                                  { label: '% Contribuição', field: 'killContributionPct', icon: BarChart2 }
                              ].map(metric => {
                                  const isSorted = roleSort.field === metric.field;
                                  return (
                                      <button
                                          key={metric.field}
                                          onClick={() => handleRoleSort(metric.field)}
                                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                              isSorted
                                                  ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20 font-black'
                                                  : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                                          }`}
                                      >
                                          {typeof metric.icon === 'function' ? metric.icon() : <metric.icon size={12} />}
                                          <span>{metric.label}</span>
                                          {isSorted && (
                                              roleSort.direction === 'desc' ? <ChevronDown size={12} className="stroke-[3]" /> : <ChevronUp size={12} className="stroke-[3]" />
                                          )}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Atalhos Rápidos por Safe (Kill Feed) */}
                      {allSafeNames.length > 0 && (
                          <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-1.5 text-emerald-400 flex-shrink-0">
                                  <Disc size={13} className="text-emerald-400" />
                                  <span className="text-[11px] font-black uppercase tracking-wider">Abates por Safe (Killfeed):</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                  {allSafeNames.map(s => {
                                      const isSorted = roleSort.field === `safe_${s}`;
                                      const safeLabel = s.toUpperCase() === 'OUT' ? 'OUT / FORA' : s.toUpperCase().startsWith('S') ? s.toUpperCase() : `SAFE ${s}`;
                                      return (
                                          <button
                                              key={`safe-filter-btn-${s}`}
                                              onClick={() => handleRoleSort(`safe_${s}`)}
                                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                  isSorted
                                                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30 font-black'
                                                      : 'bg-emerald-950/30 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/40 border border-emerald-500/20'
                                              }`}
                                              title={`Ordenar ranking pelos melhores da função na Safe ${s} (Killfeed)`}
                                          >
                                              <span>{safeLabel}</span>
                                              {isSorted && (
                                                  roleSort.direction === 'desc' ? <ChevronDown size={11} className="stroke-[3]" /> : <ChevronUp size={11} className="stroke-[3]" />
                                              )}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                      {/* Agrupamento por Função */}
                      {rolesData.bestsByRole
                        .filter(group => !activeRole ? group.role === rolesData.bestsByRole[0]?.role : group.role === activeRole)
                        .map(group => {
                          const filteredPlayers = group.players.filter(p => {
                              if (!roleSearch.trim()) return true;
                              const q = roleSearch.toLowerCase();
                              return (
                                  p.name.toLowerCase().includes(q) ||
                                  (p.team && p.team.toLowerCase().includes(q)) ||
                                  (p.funcao && p.funcao.toLowerCase().includes(q))
                              );
                          });

                          return (
                          <div key={group.role} className="bg-[#161616] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col">
                              {/* Header da Função */}
                              <div className="bg-gradient-to-r from-black/80 via-black/40 to-transparent px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-2.5 h-9 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] ${group.role === 'TODAS AS FUNÇÕES' ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h3 className="text-xl font-black text-white uppercase tracking-widest italic">{group.role}</h3>
                                              <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                                  Ranking Oficial
                                              </span>
                                          </div>
                                          <p className="text-[11px] text-gray-400 mt-0.5">
                                              Clique em qualquer coluna abaixo para reordenar o ranking instantaneamente.
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-end">
                                          <span className="text-[9px] font-black text-yellow-500 tracking-widest uppercase">Efetivo Filtrado</span>
                                          <span className="text-lg font-black text-white italic leading-none">{filteredPlayers.length} / {group.players.length}</span>
                                      </div>
                                      <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 flex flex-col items-end">
                                          <span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Ordenação Atual</span>
                                          <span className="text-xs font-black text-yellow-400 uppercase leading-none mt-0.5">
                                              {roleSort.field.startsWith('safe_')
                                                  ? `SAFE ${roleSort.field.replace('safe_', '').toUpperCase()}`
                                                  : roleSort.field.toUpperCase()} ({roleSort.direction === 'desc' ? 'MAIOR' : 'MENOR'})
                                          </span>
                                      </div>
                                  </div>
                              </div>

                              {/* Destaques da Função (Cards Clicáveis para Ordenar) */}
                              <div className="bg-black/30 p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5 border-b border-white/5">
                                  {[
                                      { label: 'Top Kills', field: 'kills', best: group.bestKills, val: group.bestKills?.kills, color: 'text-red-500', icon: Skull },
                                      { label: 'Top Dano', field: 'damage', best: group.bestDamage, val: group.bestDamage?.damage?.toLocaleString(), color: 'text-orange-400', icon: Flame },
                                      { label: 'Top AVG K', field: 'avg', best: group.bestAvgKills, val: group.bestAvgKills?.avg, color: 'text-yellow-400', icon: Target },
                                      { label: 'Top Knocks', field: 'knocks', best: group.bestKnocks, val: group.bestKnocks?.knocks, color: 'text-amber-500', icon: Zap },
                                      { label: 'Top Assists', field: 'assists', best: group.bestAssists, val: group.bestAssists?.assists, color: 'text-blue-400', icon: Users },
                                      { label: 'Top HS', field: 'hs', best: group.bestHS, val: group.bestHS?.hs, color: 'text-purple-400', icon: Crosshair },
                                      { label: 'Top MVP', field: 'mvp', best: group.bestMVP, val: group.bestMVP?.mvp, color: 'text-yellow-500', icon: Crown },
                                      { label: 'Top Gelos', field: 'gelos', best: group.bestGelos, val: group.bestGelos?.gelos, color: 'text-cyan-400', icon: Shield },
                                      { label: 'Top Revives', field: 'reviveu', best: group.bestReviveu, val: group.bestReviveu?.reviveu, color: 'text-emerald-400', icon: Activity },
                                      { label: 'Top Saldo', field: 'diff', best: group.bestDiff, val: group.bestDiff?.diff > 0 ? `+${group.bestDiff?.diff}` : group.bestDiff?.diff, color: 'text-green-400', icon: Scale }
                                  ].map((b, i) => {
                                      const isCurrentSort = roleSort.field === b.field;
                                      return (
                                          <div
                                              key={i}
                                              onClick={() => handleRoleSort(b.field)}
                                              title={`Clique para ordenar o ranking por ${b.label}`}
                                              className={`flex flex-col items-center text-center p-2.5 rounded-xl cursor-pointer transition-all border ${
                                                  isCurrentSort
                                                      ? 'bg-yellow-500/10 border-yellow-500/50 shadow-md shadow-yellow-500/10 scale-105'
                                                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-yellow-500/30'
                                              }`}
                                          >
                                              <div className="flex items-center gap-1 mb-1">
                                                  <b.icon size={10} className={isCurrentSort ? 'text-yellow-400' : 'text-gray-500'} />
                                                  <span className={`text-[8px] font-black uppercase tracking-wider ${isCurrentSort ? 'text-yellow-400 font-black' : 'text-gray-400'}`}>
                                                      {b.label}
                                                  </span>
                                              </div>
                                              <span className={`text-sm font-black italic tracking-tight ${b.color}`}>
                                                  {b.val ?? '-'}
                                              </span>
                                              <span className="text-[8px] font-bold text-gray-400 uppercase truncate w-full mt-0.5">
                                                  {b.best?.name || 'N/A'}
                                              </span>
                                          </div>
                                      );
                                  })}
                              </div>

                              {/* Tabela de Ranking da Função */}
                              <div className="p-3 overflow-x-auto custom-scrollbar">
                                  {filteredPlayers.length === 0 ? (
                                      <div className="py-12 text-center text-gray-500">
                                          <Search size={32} className="mx-auto mb-2 opacity-40" />
                                          <p className="text-sm font-bold">Nenhum jogador encontrado para a busca "{roleSearch}".</p>
                                      </div>
                                  ) : (
                                      <table className="w-full text-left border-separate border-spacing-y-1.5">
                                          <thead>
                                              <tr className="text-[9px] font-black text-gray-400 uppercase tracking-wider select-none bg-black/40">
                                                  {/* Posição / Ranking */}
                                                  <th
                                                      className={`px-3 py-3 rounded-l-xl text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'kills' ? 'text-yellow-400 font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('kills')}
                                                      title="Clique para ordenar por Abates / Rank"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <Trophy size={11} className={roleSort.field === 'kills' ? 'text-yellow-400' : 'text-gray-500'} />
                                                          <span>#</span>
                                                      </div>
                                                  </th>

                                                  {/* Jogador */}
                                                  <th
                                                      className={`px-3 py-3 cursor-pointer transition-colors ${
                                                          roleSort.field === 'name' ? 'text-yellow-400 font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('name')}
                                                      title="Clique para ordenar por Nome"
                                                  >
                                                      <div className="flex items-center gap-1">
                                                          <span>Jogador</span>
                                                          {roleSort.field === 'name' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Equipe */}
                                                  <th
                                                      className={`px-3 py-3 cursor-pointer transition-colors ${
                                                          roleSort.field === 'team' ? 'text-yellow-400 font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('team')}
                                                      title="Clique para ordenar por Equipe"
                                                  >
                                                      <div className="flex items-center gap-1">
                                                          <span>Equipe</span>
                                                          {roleSort.field === 'team' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Função */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'funcao' ? 'text-yellow-400 font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('funcao')}
                                                      title="Clique para ordenar por Função"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>Função</span>
                                                          {roleSort.field === 'funcao' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Abates (K) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'kills' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('kills')}
                                                      title="Clique para ordenar por Abates (Kills)"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>K</span>
                                                          {roleSort.field === 'kills' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Saldo (S / Diff) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'diff' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('diff')}
                                                      title="Clique para ordenar por Saldo (Kills - Quedas)"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>S</span>
                                                          {roleSort.field === 'diff' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* % Contribuição */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'killContributionPct' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('killContributionPct')}
                                                      title="Clique para ordenar por % de Contribuição de Abates do Time"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>% C</span>
                                                          {roleSort.field === 'killContributionPct' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Média Kills (AVG K) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'avg' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'text-yellow-500/80 hover:text-yellow-400'
                                                      }`}
                                                      onClick={() => handleRoleSort('avg')}
                                                      title="Clique para ordenar por Média de Abates por Queda"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>AVG K</span>
                                                          {roleSort.field === 'avg' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Dano (DMG) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'damage' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('damage')}
                                                      title="Clique para ordenar por Dano Total"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>DMG</span>
                                                          {roleSort.field === 'damage' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Média Dano (AVG D) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'avgDmg' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'text-yellow-500/80 hover:text-yellow-400'
                                                      }`}
                                                      onClick={() => handleRoleSort('avgDmg')}
                                                      title="Clique para ordenar por Média de Dano por Queda"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>AVG D</span>
                                                          {roleSort.field === 'avgDmg' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Assistências (AST) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'assists' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('assists')}
                                                      title="Clique para ordenar por Assistências"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>AST</span>
                                                          {roleSort.field === 'assists' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Headshots (HS) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'hs' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('hs')}
                                                      title="Clique para ordenar por Headshots (HS)"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>HS</span>
                                                          {roleSort.field === 'hs' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Knocks (KNK) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'knocks' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('knocks')}
                                                      title="Clique para ordenar por Inimigos Deitados (Knocks)"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>KNK</span>
                                                          {roleSort.field === 'knocks' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Média Knocks (AVG KNK) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'avgKnocks' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'text-yellow-500/80 hover:text-yellow-400'
                                                      }`}
                                                      onClick={() => handleRoleSort('avgKnocks')}
                                                      title="Clique para ordenar por Média de Knocks"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>AVG KNK</span>
                                                          {roleSort.field === 'avgKnocks' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Partidas Jogadas (PJ) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'matches' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('matches')}
                                                      title="Clique para ordenar por Partidas / Quedas Jogadas"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>PJ</span>
                                                          {roleSort.field === 'matches' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Gelos Usados (GLO) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'gelos' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('gelos')}
                                                      title="Clique para ordenar por Paredes de Gelo Usadas"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>GLO</span>
                                                          {roleSort.field === 'gelos' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Gelos Destruídos (DES) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'gelosDestruidos' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('gelosDestruidos')}
                                                      title="Clique para ordenar por Paredes de Gelo Destruídas"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>DES</span>
                                                          {roleSort.field === 'gelosDestruidos' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Reviveu (REV) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'reviveu' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('reviveu')}
                                                      title="Clique para ordenar por Vezes que Reviveu Aliados"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>REV</span>
                                                          {roleSort.field === 'reviveu' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Aliados Revividos (ALR) */}
                                                  <th
                                                      className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'aliadosRevividos' ? 'text-yellow-400 bg-yellow-500/10 rounded-md font-black' : 'hover:text-white'
                                                      }`}
                                                      onClick={() => handleRoleSort('aliadosRevividos')}
                                                      title="Clique para ordenar por Total de Aliados Revividos"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>ALR</span>
                                                          {roleSort.field === 'aliadosRevividos' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* MVP */}
                                                  <th
                                                      className={`px-3 py-3 ${allSafeNames.length === 0 ? 'rounded-r-xl' : ''} text-center cursor-pointer transition-colors ${
                                                          roleSort.field === 'mvp' ? 'text-yellow-400 bg-yellow-500/10 font-black' : 'text-yellow-500/80 hover:text-yellow-400'
                                                      }`}
                                                      onClick={() => handleRoleSort('mvp')}
                                                      title="Clique para ordenar por Quantidade de MVPs"
                                                  >
                                                      <div className="flex items-center justify-center gap-1">
                                                          <span>MVP</span>
                                                          {roleSort.field === 'mvp' && (roleSort.direction === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                                                      </div>
                                                  </th>

                                                  {/* Colunas Dinamicas de Abates por Safe */}
                                                  {allSafeNames.map((s, sIdx) => {
                                                      const isLast = sIdx === allSafeNames.length - 1;
                                                      const isSorted = roleSort.field === `safe_${s}`;
                                                      const safeLabel = s.toUpperCase() === 'OUT' ? 'OUT' : s.toUpperCase().startsWith('S') ? s.toUpperCase() : `S${s}`;
                                                      return (
                                                          <th
                                                              key={`th-safe-${s}`}
                                                              className={`px-2.5 py-3 text-center cursor-pointer transition-colors ${
                                                                  isLast ? 'rounded-r-xl' : ''
                                                              } ${
                                                                  isSorted
                                                                      ? 'text-emerald-300 bg-emerald-500/20 font-black border-b-2 border-emerald-400'
                                                                      : 'text-emerald-400/90 hover:text-emerald-200 bg-black/20 hover:bg-emerald-950/30'
                                                              }`}
                                                              onClick={() => handleRoleSort(`safe_${s}`)}
                                                              title={`Clique para ordenar por Abates na Safe ${s} (Killfeed)`}
                                                          >
                                                              <div className="flex items-center justify-center gap-0.5">
                                                                  <span className="font-mono">{safeLabel}</span>
                                                                  {isSorted && (roleSort.direction === 'desc' ? <ChevronDown size={10} className="text-emerald-300" /> : <ChevronUp size={10} className="text-emerald-300" />)}
                                                              </div>
                                                          </th>
                                                      );
                                                  })}
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {filteredPlayers.map((p, idx) => {
                                                  const rank = idx + 1;
                                                  return (
                                                      <tr
                                                          key={`${group.role}-${p.name}-${idx}`}
                                                          onClick={() => {
                                                              setFilters(prev => ({ ...prev, players: [p.name] }));
                                                              setActiveTab('report');
                                                          }}
                                                          className="bg-black/40 hover:bg-white/10 transition-all cursor-pointer group rounded-xl border border-transparent hover:border-yellow-500/30"
                                                      >
                                                          {/* Rank Badge */}
                                                          <td className="px-3 py-2.5 rounded-l-xl text-center">
                                                              {rank === 1 ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-black text-xs shadow-sm">
                                                                      <Crown size={12} className="text-yellow-400" />
                                                                      #1
                                                                  </span>
                                                              ) : rank === 2 ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 font-black text-xs">
                                                                      #2
                                                                  </span>
                                                              ) : rank === 3 ? (
                                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-600/40 font-black text-xs">
                                                                      #3
                                                                  </span>
                                                              ) : (
                                                                  <span className="font-mono text-gray-500 font-bold text-xs">
                                                                      #{rank}
                                                                  </span>
                                                              )}
                                                          </td>

                                                          {/* Jogador */}
                                                          <td className="px-3 py-2.5">
                                                              <div className="flex items-center gap-2.5">
                                                                  <div className="w-8 h-8 rounded-full bg-black border border-white/10 overflow-hidden flex-shrink-0 relative group-hover:border-yellow-500/50 transition-colors">
                                                                      {p.img ? (
                                                                          <img src={p.img} className="w-full h-full object-cover" alt={p.name} referrerPolicy="no-referrer" />
                                                                      ) : (
                                                                          <div className="w-full h-full flex items-center justify-center text-gray-600 bg-black"><User size={14} /></div>
                                                                      )}
                                                                  </div>
                                                                  <div className="flex flex-col min-w-0">
                                                                      <span className="text-xs font-black text-white uppercase italic truncate group-hover:text-yellow-400 transition-colors">
                                                                          {p.name}
                                                                      </span>
                                                                      <span className="text-[8px] font-bold text-gray-500 uppercase truncate">
                                                                          {p.team}
                                                                      </span>
                                                                  </div>
                                                              </div>
                                                          </td>

                                                          {/* Equipe */}
                                                          <td className="px-3 py-2.5">
                                                              <div className="flex items-center gap-2">
                                                                  {p.teamImg && (
                                                                      <img src={p.teamImg} alt={p.team} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                                                                  )}
                                                                  <span className="text-[11px] font-bold text-gray-300 uppercase truncate max-w-[100px]">
                                                                      {p.team}
                                                                  </span>
                                                              </div>
                                                          </td>

                                                          {/* Função */}
                                                          <td className="px-2 py-2.5 text-center">
                                                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                                      p.funcao === 'CPT'
                                                                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                                                                          : p.funcao === 'RUSH'
                                                                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                                                          : p.funcao === 'SUPORTE'
                                                                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                                                          : p.funcao === 'GRANADEIRO'
                                                                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                                                                          : 'bg-gray-800 text-gray-400 border-gray-700'
                                                                  }`}>
                                                                      {p.funcao}
                                                                  </span>
                                                                  {p.funcao2 && p.funcao2 !== 'N/A' && (
                                                                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                                                                          {p.funcao2}
                                                                      </span>
                                                                  )}
                                                              </div>
                                                          </td>

                                                          {/* Abates (K) */}
                                                          <td className={`px-2 py-2.5 text-center text-xs font-black italic ${
                                                              roleSort.field === 'kills' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-red-500'
                                                          }`}>
                                                              {p.kills}
                                                          </td>

                                                          {/* Saldo (S / Diff) */}
                                                          <td className={`px-2 py-2.5 text-center text-xs font-black italic ${
                                                              roleSort.field === 'diff' ? 'bg-yellow-500/10' : ''
                                                          } ${p.diff > 0 ? 'text-green-400' : p.diff < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                                              {p.diff > 0 ? `+${p.diff}` : p.diff}
                                                          </td>

                                                          {/* % Contribuição */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'killContributionPct' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-gray-300'
                                                          }`}>
                                                              {p.killContributionPct}%
                                                          </td>

                                                          {/* AVG Kills */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black italic ${
                                                              roleSort.field === 'avg' ? 'text-yellow-300 bg-yellow-500/15 font-black' : 'text-yellow-500 bg-yellow-500/5'
                                                          }`}>
                                                              {p.avg}
                                                          </td>

                                                          {/* Dano (DMG) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'damage' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-gray-300'
                                                          }`}>
                                                              {p.damage?.toLocaleString()}
                                                          </td>

                                                          {/* AVG Dano */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black italic ${
                                                              roleSort.field === 'avgDmg' ? 'text-yellow-300 bg-yellow-500/15 font-black' : 'text-yellow-500 bg-yellow-500/5'
                                                          }`}>
                                                              {p.avgDmg}
                                                          </td>

                                                          {/* Assistências (AST) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black ${
                                                              roleSort.field === 'assists' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-blue-400'
                                                          }`}>
                                                              {p.assists}
                                                          </td>

                                                          {/* Headshots (HS) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'hs' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-purple-400'
                                                          }`}>
                                                              {p.hs}
                                                          </td>

                                                          {/* Knocks (KNK) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black ${
                                                              roleSort.field === 'knocks' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-orange-400'
                                                          }`}>
                                                              {p.knocks}
                                                          </td>

                                                          {/* AVG Knocks */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black italic ${
                                                              roleSort.field === 'avgKnocks' ? 'text-yellow-300 bg-yellow-500/15 font-black' : 'text-yellow-500 bg-yellow-500/5'
                                                          }`}>
                                                              {p.avgKnocks}
                                                          </td>

                                                          {/* Partidas (PJ) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-black ${
                                                              roleSort.field === 'matches' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-white'
                                                          }`}>
                                                              {p.matches}
                                                          </td>

                                                          {/* Gelos (GLO) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'gelos' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-cyan-400'
                                                          }`}>
                                                              {p.gelos}
                                                          </td>

                                                          {/* Gelos Destruídos (DES) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'gelosDestruidos' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-purple-400'
                                                          }`}>
                                                              {p.gelosDestruidos}
                                                          </td>

                                                          {/* Reviveu (REV) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'reviveu' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-emerald-400'
                                                          }`}>
                                                              {p.reviveu}
                                                          </td>

                                                          {/* Aliados Revividos (ALR) */}
                                                          <td className={`px-2 py-2.5 text-center text-[10px] font-mono ${
                                                              roleSort.field === 'aliadosRevividos' ? 'text-yellow-300 bg-yellow-500/10 font-black' : 'text-green-400'
                                                          }`}>
                                                              {p.aliadosRevividos}
                                                          </td>

                                                          {/* MVP */}
                                                          <td className={`px-3 py-2.5 ${allSafeNames.length === 0 ? 'rounded-r-xl' : ''} text-center text-xs font-black italic ${
                                                              roleSort.field === 'mvp' ? 'text-yellow-300 bg-yellow-500/20 font-black' : 'text-yellow-400 bg-yellow-500/5'
                                                          }`}>
                                                              {p.mvp}
                                                          </td>

                                                          {/* Celulas de Abates por Safe */}
                                                          {allSafeNames.map((s, sIdx) => {
                                                              const isLast = sIdx === allSafeNames.length - 1;
                                                              const isSorted = roleSort.field === `safe_${s}`;
                                                              const safeKillsCount = p.safeKills?.[s] ?? p[`safe_${s}`] ?? 0;
                                                              return (
                                                                  <td
                                                                      key={`td-safe-${p.name}-${s}`}
                                                                      className={`px-2.5 py-2.5 text-center text-[10px] font-mono ${
                                                                          isLast ? 'rounded-r-xl' : ''
                                                                      } ${
                                                                          isSorted
                                                                              ? 'text-emerald-300 bg-emerald-500/20 font-black border-x border-emerald-500/30'
                                                                              : safeKillsCount > 0
                                                                              ? 'text-emerald-400 font-bold bg-emerald-950/20'
                                                                              : 'text-gray-600'
                                                                      }`}
                                                                  >
                                                                      {safeKillsCount > 0 ? (
                                                                          <span className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black text-[10px]">
                                                                              {safeKillsCount}
                                                                          </span>
                                                                      ) : (
                                                                          <span className="text-gray-600 font-normal">-</span>
                                                                      )}
                                                                  </td>
                                                              );
                                                          })}
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  )}
                              </div>
                          </div>
                          );
                        })}
                  </div>
              </div>
          )}

          {activeTab === 'compare' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
                  {/* Switch entre Modos: Jogador vs Jogador / Jogador vs Time */}
                  <div className="flex justify-center">
                      <div className="bg-black/60 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 shadow-2xl backdrop-blur-md">
                          <button
                              onClick={() => setCompareMode('pvp')}
                              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                  compareMode === 'pvp'
                                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/20'
                                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                          >
                              <Swords size={16} />
                              <span>Duelo Jogador vs Jogador</span>
                          </button>
                          <button
                              onClick={() => setCompareMode('pvt')}
                              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                  compareMode === 'pvt'
                                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                          >
                              <ShieldAlert size={16} />
                              <span>Duelo Jogador vs Time</span>
                          </button>
                      </div>
                  </div>

                  {compareMode === 'pvp' && (
                      <PlayerVsPlayerCompare
                          comparePlayers={comparePlayers}
                          setComparePlayers={setComparePlayers}
                          compareData={compareData}
                          allPlayersList={allPlayersList}
                          activeHabs={filterOptions.activeHabs}
                      />
                  )}

                  {compareMode === 'pvt' && (
                      <PlayerVsTeamCompare
                          comparePvt={comparePvt}
                          setComparePvt={setComparePvt}
                          comparePvtData={comparePvtData}
                          allPlayersList={allPlayersList}
                          allTeamsList={allTeamsList}
                          activeHabs={filterOptions.activeHabs}
                      />
                  )}
              </div>
          )}

          {activeTab === 'stats' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Top Dano */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-red-500/10 rounded-lg"><Flame className="text-red-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Dano Total</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.damage - a.damage).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-red-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-red-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-red-500 italic">{p.damage.toLocaleString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top HS */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-yellow-500/10 rounded-lg"><Target className="text-yellow-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Headshots</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.hs - a.hs).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-yellow-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-yellow-500 italic">{p.hs} HS</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top Média Kills */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-blue-500/10 rounded-lg"><Zap className="text-blue-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Média de Kills</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => parseFloat(b.avg) - parseFloat(a.avg)).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-blue-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-blue-500 italic">{p.avg} AVG</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top Safe Kills */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-emerald-500/10 rounded-lg"><MapPin className="text-emerald-500" size={20} /></div>
                          <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Top Abates em Safes</h3>
                      </div>
                      <div className="space-y-3">
                          {rankingData.sort((a,b) => b.totalSafeKills - a.totalSafeKills).slice(0, 10).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                  <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-black text-gray-600 w-4">#{i+1}</span>
                                      <span className="text-[11px] font-black text-white uppercase italic group-hover:text-emerald-500 transition-colors">{p.name}</span>
                                  </div>
                                  <span className="text-xs font-black text-emerald-500 italic">{p.totalSafeKills} SAFES</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'mapKings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5 w-fit">
                    <button 
                        onClick={() => setMapKingsSubTab('maps')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mapKingsSubTab === 'maps' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Ranking por Mapa
                    </button>
                    <button 
                        onClick={() => setMapKingsSubTab('drops')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mapKingsSubTab === 'drops' ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Ranking por Queda
                    </button>
                </div>

                <div className="space-y-12">
                    {(mapKingsSubTab === 'maps' ? mapKingsData.byMap : mapKingsData.byDrop).map(group => (
                        <div key={group.name} className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
                            <div className="bg-gradient-to-r from-black/80 to-black/40 px-8 py-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    {mapKingsSubTab === 'maps' ? <MapIcon className="text-yellow-500" size={28} /> : <Target className="text-blue-500" size={28} />}
                                    {mapKingsSubTab === 'maps' ? `Mapa: ${group.name}` : `Queda: ${group.name}`}
                                </h3>
                                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest border border-white/10">
                                    {group.players.length} Jogadores
                                </span>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Highlights Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { title: "Maior Dano", player: group.topDamage, value: group.topDamage?.damage, icon: <Flame className="text-red-500" size={20} />, color: "red" },
                                        { title: "Média Kills", player: group.topAvgKills, value: group.topAvgKills?.avgKills.toFixed(2), icon: <Crosshair className="text-green-500" size={20} />, color: "green" },
                                        { title: "Mais Derruba", player: group.topKnocks, value: group.topKnocks?.knocks, icon: <AlertTriangle className="text-orange-500" size={20} />, color: "orange" },
                                        { title: "Mais HS", player: group.topHs, value: group.topHs?.hs, icon: <TargetIcon className="text-yellow-500" size={20} />, color: "yellow" },
                                        { title: "Mais Zera", player: group.topZero, value: `${group.topZero?.zeroKills} (${group.topZero?.zeroRate.toFixed(1)}%)`, icon: <Skull className="text-gray-400" size={20} />, color: "gray" },
                                        { title: "Mais Revive", player: group.topRevives, value: group.topRevives?.reviveu, icon: <Activity className="text-cyan-500" size={20} />, color: "cyan" },
                                        { title: "Aliados Rev", player: group.topAlliesRevived, value: group.topAlliesRevived?.aliadosRevividos, icon: <Shield className="text-emerald-500" size={20} />, color: "emerald" },
                                        { title: "Mais MVP", player: group.topMvp, value: group.topMvp?.mvp, icon: <Star className="text-purple-500" size={20} />, color: "purple" },
                                    ].map((h, i) => (
                                        <div key={i} className={`bg-black/40 rounded-2xl p-4 border border-${h.color}-500/20 flex items-center gap-4`}>
                                            <div className={`p-3 bg-${h.color}-500/10 rounded-xl`}>{h.icon}</div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block truncate">{h.title}</span>
                                                <span className="text-sm font-black italic uppercase text-white truncate block">{h.player?.name || "-"}</span>
                                                <span className={`text-xs font-black text-${h.color}-400 italic block`}>{h.value || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Ranking Table */}
                                <div className="overflow-x-auto rounded-xl border border-gray-800/50 bg-black/20">
                                    <table className="w-full text-sm">
                                        <thead className="bg-black text-gray-500 uppercase text-[10px] tracking-wider font-black">
                                            <tr>
                                                <th className="px-4 py-3 text-center w-16">#</th>
                                                <th className="px-4 py-3 text-left">Jogador</th>
                                                <th className="px-4 py-3 text-left">Equipe</th>
                                                <th className="px-4 py-3 text-center">Partidas</th>
                                                <th className="px-4 py-3 text-center">Kills Totais</th>
                                                <th className="px-4 py-3 text-center">Média Kills</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/50">
                                            {group.players.map((p, idx) => (
                                                <tr key={p.name} onClick={() => { setFilters(prev => ({...prev, players: [p.name]})); setActiveTab('report'); }} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                                    <td className="px-4 py-3 text-center text-gray-600 font-black">
                                                        <span className="flex items-center justify-center gap-1">
                                                            {idx === 0 ? <Crown size={14} className="text-yellow-500" /> : idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold uppercase italic flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {p.playerImg ? (
                                                                <img src={p.playerImg} alt={p.name} className={`${idx === 0 ? 'w-10 h-10 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'w-6 h-6 border-gray-800'} object-cover rounded-full border-2`} />
                                                            ) : (
                                                                <div className={`${idx === 0 ? 'w-10 h-10 border-yellow-500' : 'w-6 h-6 border-gray-800'} rounded-full bg-gray-900 border-2 flex items-center justify-center text-gray-600`}><User size={idx === 0 ? 20 : 12}/></div>
                                                            )}
                                                            <span className={idx === 0 ? 'text-yellow-500 font-black text-xl font-display flex items-center gap-2' : 'text-white'}>
                                                                {p.name}
                                                            </span>
                                                        </div>
                                                        <ChevronRight size={12} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </td>
                                                    <td className="px-4 py-3 uppercase text-[9px] tracking-widest font-bold">
                                                        <div className="flex items-center gap-2">
                                                            {p.teamImg && (
                                                                <img src={p.teamImg} alt={p.team} className="w-5 h-5 object-contain" />
                                                            )}
                                                            <span className="text-gray-400">
                                                                {p.team}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-black text-gray-300">{p.matches}</td>
                                                    <td className="px-4 py-3 text-center font-black text-yellow-500 bg-yellow-500/5">{p.kills}</td>
                                                    <td className="px-4 py-3 text-center font-mono text-cyan-400">{p.avgKills.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                    {instagramPost && (
                        <InstagramPostModal 
                            group={instagramPost.group} 
                            type={instagramPost.type} 
                            onClose={() => setInstagramPost(null)} 
                        />
                    )}
                    {(mapKingsSubTab === "maps" ? mapKingsData.byMap : mapKingsData.byDrop).length === 0 && (
                        <div className="py-12 text-center text-gray-500 font-bold">Nenhum dado encontrado para os filtros atuais.</div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Sub-tabs para Ranking Geral */}
                <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5 w-fit">
                    {[
                        { id: 'general', label: 'Estatísticas Gerais', icon: <BarChart2 size={14} /> },
                        { id: 'maps', label: 'Abates por Mapa', icon: <MapIcon size={14} /> },
                        { id: 'safes', label: 'Abates por Safe', icon: <Target size={14} /> },
                    ].map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setRankingSubTab(sub.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                rankingSubTab === sub.id
                                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {sub.icon}
                            {sub.label}
                        </button>
                    ))}
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                        <thead className="bg-[#0a0a0a] text-gray-500 text-[9px] uppercase font-bold tracking-widest sticky top-0 z-20">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center border-b border-gray-800">#</th>
                                <th className="px-4 py-4 border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Jogador
                                        {rankingSort.field === 'name' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                    </div>
                                </th>
                                <th className="px-4 py-4 border-b border-gray-800">Equipe</th>
                                <th className="px-4 py-4 text-center border-b border-gray-800">Função</th>
                                <th className="px-4 py-4 text-center border-b border-gray-800">Ativa</th>
                                
                                {rankingSubTab === 'general' && (
                                    <>
                                        {/* Colunas de Funções */}
                                        <th className="px-2 py-4 text-center text-red-500 border-b border-gray-800 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleRankingSort('kills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                K
                                                {rankingSort.field === 'kills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('diff')}>
                                            <div className="flex items-center justify-center gap-1">
                                                S
                                                {rankingSort.field === 'diff' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-blue-400 border-b border-gray-800 cursor-pointer hover:text-blue-300 transition-colors" onClick={() => handleRankingSort('killContributionPct')}>
                                            <div className="flex items-center justify-center gap-1">
                                                % C
                                                {rankingSort.field === 'killContributionPct' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG K
                                                {rankingSort.field === 'avg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-green-400 border-b border-gray-800 cursor-pointer hover:text-green-300 transition-colors" onClick={() => handleRankingSort('withKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Q. C/ KILL
                                                {rankingSort.field === 'withKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-red-500 border-b border-gray-800 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleRankingSort('zeroKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Q. ZERO
                                                {rankingSort.field === 'zeroKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('damage')}>
                                            <div className="flex items-center justify-center gap-1">
                                                DMG
                                                {rankingSort.field === 'damage' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avgDmg')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG D
                                                {rankingSort.field === 'avgDmg' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('assists')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AST
                                                {rankingSort.field === 'assists' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('hs')}>
                                            <div className="flex items-center justify-center gap-1">
                                                HS
                                                {rankingSort.field === 'hs' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('knocks')}>
                                            <div className="flex items-center justify-center gap-1">
                                                KNK
                                                {rankingSort.field === 'knocks' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('avgKnocks')}>
                                            <div className="flex items-center justify-center gap-1">
                                                AVG KNK
                                                {rankingSort.field === 'avgKnocks' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('matches')}>
                                            <div className="flex items-center justify-center gap-1">
                                                PJ
                                                {rankingSort.field === 'matches' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('gelos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                GLO
                                                {rankingSort.field === 'gelos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('gelosDestruidos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                DES
                                                {rankingSort.field === 'gelosDestruidos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('reviveu')}>
                                            <div className="flex items-center justify-center gap-1">
                                                REV
                                                {rankingSort.field === 'reviveu' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort('aliadosRevividos')}>
                                            <div className="flex items-center justify-center gap-1">
                                                ALR
                                                {rankingSort.field === 'aliadosRevividos' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('mvp')}>
                                            <div className="flex items-center justify-center gap-1">
                                                MVP
                                                {rankingSort.field === 'mvp' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                    </>
                                )}

                                {rankingSubTab === 'maps' && (
                                    <>
                                        {/* Abates por Mapa */}
                                        {filterOptions.maps.map(mapName => (
                                            <th key={mapName} className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort(`map_${mapName}`)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {mapName}
                                                    {rankingSort.field === `map_${mapName}` && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}

                                {rankingSubTab === 'safes' && (
                                    <>
                                        {/* Abates por Safe */}
                                        <th className="px-2 py-4 text-center text-yellow-500 border-b border-gray-800 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleRankingSort('totalSafeKills')}>
                                            <div className="flex items-center justify-center gap-1">
                                                TOT S
                                                {rankingSort.field === 'totalSafeKills' && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                            </div>
                                        </th>
                                        {allSafeNames.map(safeName => (
                                            <th key={safeName} className="px-2 py-4 text-center border-b border-gray-800 cursor-pointer hover:text-white transition-colors" onClick={() => handleRankingSort(`safe_${safeName}`)}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {safeName === 'OUT' ? 'OUT' : `S${safeName}`}
                                                    {rankingSort.field === `safe_${safeName}` && (rankingSort.direction === 'desc' ? <ChevronDown size={8} /> : <ChevronUp size={8} />)}
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-[11px] font-medium">
                            {rankingData.map((player, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => { setFilters(prev => ({...prev, players: [player.name]})); setActiveTab('report'); }} 
                                    className={`transition-colors cursor-pointer group ${
                                        ((player.team && player.team.toLowerCase().includes('loud')) || (player.name && player.name.toLowerCase().includes('loud')))
                                            ? 'bg-gradient-to-r from-yellow-500/25 via-amber-500/15 to-yellow-500/5 border-y border-yellow-400/80 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:from-yellow-500/35' 
                                            : 'hover:bg-yellow-900/10'
                                    }`}
                                >
                                    <td className="px-4 py-3 text-gray-600 font-mono text-center">
                                        <span className={(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) ? 'text-yellow-400 font-black text-xs flex items-center justify-center gap-0.5' : ''}>
                                            {idx + 1} {(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) && <Star size={10} className="fill-yellow-400 text-yellow-400" />}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold uppercase italic flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {player.playerImg ? (
                                                <img src={player.playerImg} alt={player.name} className="w-6 h-6 object-cover rounded-full border border-gray-800" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600"><User size={12}/></div>
                                            )}
                                            <span className={(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) ? 'text-yellow-400 font-black text-xs font-display flex items-center gap-1' : 'text-white'}>
                                                {player.name}
                                                {(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
                                            </span>
                                        </div>
                                        <ChevronRight size={12} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-4 py-3 uppercase text-[9px] tracking-widest font-bold">
                                        <div className="flex items-center gap-2">
                                            {player.teamImg && (
                                                <img src={player.teamImg} alt={player.team} className="w-5 h-5 object-contain" />
                                            )}
                                            <span className={(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) ? 'text-yellow-300 font-black flex items-center gap-1' : 'text-gray-400'}>
                                                {player.team} {(player.team?.toLowerCase().includes('loud') || player.name?.toLowerCase().includes('loud')) && '★'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className={`text-[9px] font-black uppercase italic ${player.funcao === 'CPT' ? 'text-yellow-500' : 'text-gray-400'}`}>{player.funcao}</span>
                                            {player.funcao2 !== 'N/A' && <span className="text-[7px] text-gray-600 font-bold uppercase">{player.funcao2}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {player.loadout?.hab1Img ? (
                                            <div className="flex justify-center items-center">
                                                <div className="w-6 h-6 rounded-lg bg-black border border-yellow-500/30 p-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                    <img src={player.loadout.hab1Img} className="w-full h-full object-contain" alt={player.loadout.Hab1} />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-700 font-black italic opacity-20">-</span>
                                        )}
                                    </td>
                                    
                                    {rankingSubTab === 'general' && (
                                        <>
                                            {/* Dados de Funções */}
                                            <td className="px-2 py-3 text-center text-red-400 font-black text-sm">{player.kills}</td>
                                            <td className={`px-2 py-3 text-center font-black text-sm ${player.diff > 0 ? 'text-green-500' : player.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                {player.diff > 0 ? `+${player.diff}` : player.diff}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-blue-400 italic">{player.killContributionPct}%</span>
                                                    <span className="text-[7px] text-gray-600 font-bold uppercase">DO TIME</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avg}</td>
                                            <td className="px-2 py-3 text-center w-24">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-green-400">{player.withKills}</span>
                                                    <span className="text-[8px] text-gray-500 font-bold">({player.withKillsPct}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center w-24 border-r border-gray-800/30">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-red-500">{player.zeroKills}</span>
                                                    <span className="text-[8px] text-gray-500 font-bold">({player.zeroKillsPct}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center text-gray-300 font-mono">{player.damage}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avgDmg}</td>
                                            <td className="px-2 py-3 text-center text-blue-400 font-black">{player.assists}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-mono">{player.hs}</td>
                                            <td className="px-2 py-3 text-center text-orange-500 font-black">{player.knocks}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.avgKnocks}</td>
                                            <td className="px-2 py-3 text-center text-white font-black">{player.matches}</td>
                                            <td className="px-2 py-3 text-center text-cyan-400 font-mono">{player.gelos}</td>
                                            <td className="px-2 py-3 text-center text-purple-400 font-mono">{player.gelosDestruidos}</td>
                                            <td className="px-2 py-3 text-center text-green-400 font-mono">{player.reviveu}</td>
                                            <td className="px-2 py-3 text-center text-emerald-400 font-mono">{player.aliadosRevividos}</td>
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.mvp}</td>
                                        </>
                                    )}

                                    {rankingSubTab === 'maps' && (
                                        <>
                                            {/* Abates por Mapa */}
                                            {filterOptions.maps.map(mapName => (
                                                <td key={mapName} className="px-2 py-3 text-center text-gray-400 font-mono">
                                                    {player.mapKills[mapName] || 0}
                                                </td>
                                            ))}
                                        </>
                                    )}

                                    {rankingSubTab === 'safes' && (
                                        <>
                                            {/* Abates por Safe */}
                                            <td className="px-2 py-3 text-center text-yellow-500 font-black italic bg-yellow-500/5">{player.totalSafeKills}</td>
                                            {allSafeNames.map(safeName => (
                                                <td key={safeName} className="px-2 py-3 text-center text-gray-500 font-mono">
                                                    {player.safeKills[safeName] || 0}
                                                </td>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
          )}

          {activeTab === 'auditoria' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Banner de Status do Filtro */}
                  {(filters.rodada.length > 0 || filters.queda.length > 0) && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Info size={16} className="text-yellow-500" />
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                  Recorte: {filters.rodada.length > 0 ? filters.rodada.join(', ') : 'Todas Rodadas'} 
                                  {filters.queda.length > 0 ? ` • Queda ${filters.queda.join(', ')}` : ''}
                              </span>
                          </div>
                          <button onClick={() => setFilters(p => ({...p, rodada: [], queda: []}))} className="text-[9px] font-black text-yellow-500 uppercase hover:underline">Limpar Recorte</button>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <Skull className="text-gray-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Kills em Fato</span>
                          <span className="text-3xl font-black text-white italic">{auditData.reduce((a,b) => a + b.factKills, 0)}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <Activity className="text-yellow-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Kills em Feed</span>
                          <span className="text-3xl font-black text-yellow-500 italic">{auditData.reduce((a,b) => a + b.feedKills, 0)}</span>
                      </div>
                      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                          <AlertTriangle className="text-red-500 mb-2" size={20} />
                          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Divergência Total</span>
                          <span className="text-3xl font-black text-red-500 italic">{auditData.reduce((a,b) => a + Math.abs(b.diff), 0)}</span>
                      </div>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#0a0a0a] text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Jogador / Equipe</th>
                                    <th className="px-6 py-4 text-center">Fato (Consolidado)</th>
                                    <th className="px-6 py-4 text-center">Feed (Unitário)</th>
                                    <th className="px-6 py-4 text-center">Diferença</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm font-medium">
                                {auditData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {row.playerImg ? (
                                                    <img src={row.playerImg} alt={row.name} className="w-8 h-8 object-cover rounded-full border border-gray-800" />
                                                ) : row.teamImg ? (
                                                    <img src={row.teamImg} alt={row.team} className="w-8 h-8 object-contain rounded-full border border-gray-800 p-1" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600"><User size={14}/></div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-black text-white uppercase italic">{row.name}</span>
                                                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{row.team}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-gray-300">{row.factKills}</td>
                                        <td className="px-6 py-4 text-center font-mono text-yellow-500/80">{row.feedKills}</td>
                                        <td className={`px-6 py-4 text-center font-black ${row.diff !== 0 ? 'text-red-500 scale-110' : 'text-gray-700 opacity-20'}`}>
                                            {row.diff > 0 ? `+${row.diff}` : row.diff === 0 ? '0' : row.diff}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {row.diff === 0 ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 size={12}/> OK
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                                                    <AlertCircle size={12}/> DISCREPÂNCIA
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
          )}

          {activeTab === 'chars' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-black/40 p-5 rounded-2xl border border-gray-800 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            <div className="text-yellow-500 font-black uppercase text-xs tracking-widest flex items-center gap-2"><Flame size={16} /> Habilidade Ativa:</div>
                            <select 
                                value={activeHabFilter} 
                                onChange={(e) => setActiveHabFilter(e.target.value)}
                                className="bg-black text-white p-2.5 rounded-xl border border-gray-800 text-xs font-bold uppercase outline-none focus:border-yellow-500 min-w-[200px] transition-colors"
                            >
                                <option value="All">Todas as Ativas</option>
                                {filterOptions.activeHabs.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-4 bg-black/60 px-6 py-3 rounded-2xl border border-white/5">
                            {usageStats ? (
                                <>
                                    <div className="flex flex-col items-center border-r border-white/10 pr-4">
                                        <span className="text-yellow-500 font-black text-xl leading-none">{usageStats.count}</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Jogadores</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white font-black text-xl leading-none italic">{usageStats.percent}%</span>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Popularidade Meta</span>
                                    </div>
                                    <div className="ml-2">
                                        <Activity size={24} className="text-yellow-500 animate-pulse opacity-50" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">Meta de Jogo Geral</span>
                                    <span className="text-white font-black text-sm uppercase italic">Total: {data.characters.length} Loadouts</span>
                                </div>
                            )}
                        </div>
                    </div>

                    
                    {activeHabFilter !== 'All' && activeHabStats.length > 0 && (
                        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 mb-8 overflow-hidden">
                             <h3 className="text-white font-black text-xl uppercase tracking-widest italic mb-6 flex items-center gap-3">
                                 <Activity size={24} className="text-yellow-500" />
                                 Desempenho com {activeHabFilter}
                             </h3>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-left border-collapse min-w-[600px]">
                                     <thead>
                                         <tr className="border-b border-white/10">
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest pl-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort('name')}>
                                                 <div className="flex items-center gap-1">Jogador {activeHabSort.field === 'name' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort('matches')}>
                                                 <div className="flex items-center justify-center gap-1">Quedas {activeHabSort.field === 'matches' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-yellow-500 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleHabSort('kills')}>
                                                 <div className="flex items-center justify-center gap-1">Abates {activeHabSort.field === 'kills' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-red-500 cursor-pointer hover:text-red-400 transition-colors" onClick={() => handleHabSort('dmg')}>
                                                 <div className="flex items-center justify-center gap-1">Dano {activeHabSort.field === 'dmg' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             <th className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center text-blue-500 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleHabSort('knocks')}>
                                                 <div className="flex items-center justify-center gap-1">Deitados {activeHabSort.field === 'knocks' && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                             </th>
                                             {allSafeNames.map(safeName => (
                                                 <th key={safeName} className="pb-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleHabSort(`safe_${safeName}`)}>
                                                     <div className="flex items-center justify-center gap-1">{safeName === 'OUT' ? 'OUT' : `S${safeName}`} {activeHabSort.field === `safe_${safeName}` && (activeHabSort.direction === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}</div>
                                                 </th>
                                             ))}
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {activeHabStats.map((stat, idx) => (
                                             <tr key={stat.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                 <td className="py-4 pl-4">
                                                     <div className="flex items-center gap-3">
                                                         <span className="text-gray-500 font-black text-sm w-6 text-right">#{idx+1}</span>
                                                         <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center border border-yellow-500/30 shrink-0">
                                                             {stat.img ? <img src={stat.img} className="w-full h-full object-cover"/> : <User size={20} className="text-gray-500"/>}
                                                         </div>
                                                         <div>
                                                             <div className="text-white font-black text-sm uppercase">{stat.name}</div>
                                                             <div className="text-gray-500 text-[10px] font-bold uppercase">{stat.team}</div>
                                                         </div>
                                                     </div>
                                                 </td>
                                                 <td className="py-4 text-center text-gray-400 font-bold">{stat.matches}</td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.kills}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.kills / (stat.matches || 1)).toFixed(2)}</div>
                                                     <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-0.5" title="Contribuição para os abates do time nestas quedas">
                                                         {stat.teamTotalKills > 0 ? ((stat.kills / stat.teamTotalKills) * 100).toFixed(1) : '0.0'}% TIME
                                                     </div>
                                                 </td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.dmg}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.dmg / (stat.matches || 1)).toFixed(0)}</div>
                                                 </td>
                                                 <td className="py-4 text-center">
                                                     <div className="text-white font-black text-xl">{stat.knocks}</div>
                                                     <div className="text-[10px] text-gray-500 font-mono mt-1">Média: {(stat.knocks / (stat.matches || 1)).toFixed(2)}</div>
                                                 </td>
                                                 {allSafeNames.map(safeName => (
                                                     <td key={safeName} className="py-4 text-center">
                                                         <div className={`text-sm font-black ${stat.safeKills?.[safeName] ? 'text-yellow-500' : 'text-gray-700'}`}>{stat.safeKills?.[safeName] || '-'}</div>
                                                     </td>
                                                 ))}
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {charactersData.length > 0 ? charactersData.map((char, idx) => (
                            <div key={idx} className="bg-[#0e0e11] rounded-2xl p-6 border border-gray-800/60 flex flex-col md:flex-row gap-8 items-center hover:border-yellow-500/20 transition-all shadow-2xl group">
                                <div className="w-full md:w-64 flex items-center gap-5 border-b md:border-b-0 md:border-r border-gray-800/60 pb-5 md:pb-0 pr-0 md:pr-8">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center overflow-hidden border-2 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)] p-1 flex-shrink-0 group-hover:scale-105 transition-transform">
                                        {char.playerImg ? (
                                            <img src={char.playerImg} className="w-full h-full object-cover rounded-full" alt={char.Player}/>
                                        ) : char.teamImg ? (
                                            <img src={char.teamImg} className="w-full h-full object-contain" alt={char.Time}/>
                                        ) : (
                                            <div className="bg-gray-800 w-full h-full rounded-full flex items-center justify-center">
                                                <User className="text-gray-500" size={32}/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-black text-white text-2xl truncate uppercase italic leading-none tracking-tighter group-hover:text-yellow-500 transition-colors">{char.Player}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-sm text-yellow-500 font-black uppercase tracking-widest opacity-80">{char.Time}</span>
                                            <span className="text-[10px] text-gray-600 font-mono font-bold px-2 py-0.5 bg-white/5 rounded">Q{char.Q}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 w-full flex items-center gap-3 overflow-x-auto pb-4 md:pb-0 custom-scrollbar justify-between">
                                    <PremiumLoadoutCard title="ATIVA" name={char.Hab1} img={char.hab1Img} highlight />
                                    <PremiumLoadoutCard title="HAB 2" name={char.Hab2} img={char.hab2Img} />
                                    <PremiumLoadoutCard title="HAB 3" name={char.Hab3} img={char.hab3Img} />
                                    <PremiumLoadoutCard title="HAB 4" name={char.Hab4} img={char.hab4Img} />
                                    <PremiumLoadoutCard title="PET" name={char.Pet} img={char.petImg} />
                                    <PremiumLoadoutCard title="ITEM" name={char.Item} img={char.itemImg} />
                                </div>
                            </div>
                        )) : (
                            <div className="py-24 text-center text-gray-700 font-black italic uppercase tracking-widest border border-dashed border-gray-800 rounded-3xl">
                                {data.characters.length === 0 ? "Buscando dados em fPersonagens..." : "Nenhum Loadout filtrado para esta seleção."}
                            </div>
                        )}
                    </div>
              </div>
          )}

          {activeTab === 'report' && (
              <div className="animate-in fade-in duration-300">
                  {filters.players.length === 1 ? (
                      <div className="space-y-4">
                           <button onClick={() => { setFilters(prev => ({...prev, players: []})); setActiveTab('ranking'); }} className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5 transition-colors">
                               <ArrowLeft size={14}/> Voltar para Ranking
                           </button>
                           <PlayerProfile data={data} playerName={filters.players[0]} filters={filters} characters={data.characters} rankingData={rankingData} />
                      </div>
                  ) : (
                      <div className="bg-[#1a1a1a] rounded-2xl p-24 text-center border border-gray-800 shadow-inner">
                          <User size={64} className="mx-auto text-gray-800 mb-6" />
                          <h3 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">Selecione UM jogador no Ranking para ver o Perfil</h3>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

const PremiumLoadoutCard = ({ title, name, img, highlight }: any) => {
  const displayImg = img || findDimImg([], name);
  return (
    <div className={`flex flex-col items-center flex-shrink-0 group w-[110px]`}>
      <div className={`w-full flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 ${highlight ? 'bg-yellow-500/5 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-[1.05] z-10' : 'bg-[#121215] border-gray-800/60 hover:border-gray-600'}`}>
          <span className={`text-[9px] font-black uppercase mb-4 tracking-[0.2em] ${highlight ? 'text-yellow-500/60' : 'text-gray-500'}`}>
              {title}
          </span>
          <div className={`w-14 h-14 rounded-2xl bg-black/60 border border-gray-800/80 flex items-center justify-center p-1.5 shadow-inner mb-4 overflow-hidden group-hover:scale-110 transition-transform`}>
              {displayImg ? (
                <img 
                  src={displayImg} 
                  alt={name || title} 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    const fallback = findDimImg([], name);
                    if (fallback && fallback !== displayImg) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
              ) : (
                <Zap size={16} className="text-gray-600 opacity-20" />
              )}
          </div>
          <div className="w-full text-center overflow-hidden">
              <span className={`text-[10px] font-black uppercase italic truncate block tracking-tighter ${highlight ? 'text-yellow-500 underline underline-offset-4 decoration-yellow-500/30' : 'text-gray-300'}`}>
                  {name || '-'}
              </span>
          </div>
      </div>
    </div>
  );
};


// Componente de Gráfico Radar de Atributos Competitivos (Hexágono X-Ray)
const PlayerRadarComponent: React.FC<{
  p1Stats: any;
  p2Stats?: any;
  p1Name: string;
  p2Name?: string;
  title?: string;
}> = ({ p1Stats, p2Stats, p1Name, p2Name, title }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const calcScore = (stats: any) => {
    if (!stats) return { scoreKills: 0, scoreDmg: 0, scoreHs: 0, scoreKnocks: 0, scoreAssists: 0, scoreKP: 0, raw: {} };

    const matches = parseNumber(stats.matches) || 1;
    const kills = parseNumber(stats.kills);
    const damage = parseNumber(stats.damage);
    const hs = parseNumber(stats.hs);
    const knocks = parseNumber(stats.knocks);
    const assists = parseNumber(stats.assists);
    
    // Totais acumulados da equipe (soma de todos os companheiros)
    const teamTotalKills = (stats.teamTotalKills !== undefined && stats.teamTotalKills !== null && parseNumber(stats.teamTotalKills) > 0) 
      ? parseNumber(stats.teamTotalKills) : (kills || 1);
    const teamTotalDamage = (stats.teamTotalDamage !== undefined && stats.teamTotalDamage !== null && parseNumber(stats.teamTotalDamage) > 0) 
      ? parseNumber(stats.teamTotalDamage) : (damage || 1);
    const teamTotalHS = (stats.teamTotalHS !== undefined && stats.teamTotalHS !== null && parseNumber(stats.teamTotalHS) > 0) 
      ? parseNumber(stats.teamTotalHS) : (hs || 1);
    const teamTotalKnocks = (stats.teamTotalKnocks !== undefined && stats.teamTotalKnocks !== null && parseNumber(stats.teamTotalKnocks) > 0) 
      ? parseNumber(stats.teamTotalKnocks) : (knocks || 1);
    const teamTotalAssists = (stats.teamTotalAssists !== undefined && stats.teamTotalAssists !== null && parseNumber(stats.teamTotalAssists) > 0) 
      ? parseNumber(stats.teamTotalAssists) : (assists || 1);

    // Porcentagem de participação do jogador no total da equipe
    const pctKills = teamTotalKills > 0 ? (kills / teamTotalKills) * 100 : 0;
    const pctDmg = teamTotalDamage > 0 ? (damage / teamTotalDamage) * 100 : 0;
    const pctHs = teamTotalHS > 0 ? (hs / teamTotalHS) * 100 : 0;
    const pctKnocks = teamTotalKnocks > 0 ? (knocks / teamTotalKnocks) * 100 : 0;
    const pctAssists = teamTotalAssists > 0 ? (assists / teamTotalAssists) * 100 : 0;
    const kpPct = teamTotalKills > 0 ? ((kills + assists) / teamTotalKills) * 100 : 0;

    // Escala de radar (0 a 100 pts):
    // Em uma equipe de 4 jogadores, a participação média igualitária é 25%.
    // 25% de participação no time = 50 pts no radar (linha média).
    // 50% de participação no time = 100 pts no radar (carregador absoluto).
    const scoreKills = Math.min(100, Math.max(5, Math.round(pctKills * 2)));
    const scoreDmg = Math.min(100, Math.max(5, Math.round(pctDmg * 2)));
    const scoreHs = Math.min(100, Math.max(5, Math.round(pctHs * 2)));
    const scoreKnocks = Math.min(100, Math.max(5, Math.round(pctKnocks * 2)));
    const scoreAssists = Math.min(100, Math.max(5, Math.round(pctAssists * 2)));
    const scoreKP = Math.min(100, Math.max(5, Math.round(kpPct)));

    const fmtNum = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${num}`;

    return {
      scoreKills,
      scoreDmg,
      scoreHs,
      scoreKnocks,
      scoreAssists,
      scoreKP,
      raw: {
        avgKills: `${pctKills.toFixed(1)}% do Time (${kills}/${teamTotalKills})`,
        avgDmg: `${pctDmg.toFixed(1)}% do Time (${fmtNum(damage)}/${fmtNum(teamTotalDamage)})`,
        hsPct: `${pctHs.toFixed(1)}% do Time (${hs}/${teamTotalHS})`,
        avgKnocks: `${pctKnocks.toFixed(1)}% do Time (${knocks}/${teamTotalKnocks})`,
        avgAssists: `${pctAssists.toFixed(1)}% do Time (${assists}/${teamTotalAssists})`,
        kpPct: `${kpPct.toFixed(1)}% KP (${kills + assists}/${teamTotalKills})`,
      }
    };
  };

  const p1 = calcScore(p1Stats);
  const p2 = p2Stats ? calcScore(p2Stats) : null;

  const subjects = [
    { key: 'scoreKills', rawKey: 'avgKills', label: 'Abates (% do Time)' },
    { key: 'scoreDmg', rawKey: 'avgDmg', label: 'Poder de Fogo (% Dano)' },
    { key: 'scoreHs', rawKey: 'hsPct', label: 'Precisão (% HS Time)' },
    { key: 'scoreKnocks', rawKey: 'avgKnocks', label: 'Impacto (% Deitados)' },
    { key: 'scoreAssists', rawKey: 'avgAssists', label: 'Suporte (% Assist.)' },
    { key: 'scoreKP', rawKey: 'kpPct', label: 'Participação (% KP)' },
  ];

  const radarData = subjects.map(s => {
    const item: any = {
      subject: s.label,
      p1Score: p1[s.key as keyof typeof p1],
      p1Raw: (p1.raw as any)[s.rawKey],
      fullMark: 100,
    };
    if (p2) {
      item.p2Score = p2[s.key as keyof typeof p2];
      item.p2Raw = (p2.raw as any)[s.rawKey];
    } else {
      item.score = p1[s.key as keyof typeof p1];
      item.raw = (p1.raw as any)[s.rawKey];
    }
    return item;
  });

  return (
    <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl p-6">
      <div className="bg-black/40 -mx-6 -mt-6 px-8 py-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
            <TargetIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
              {title || (p2Name ? 'Duelo de Atributos Competitivos (Hexágono X-Ray)' : 'Hexágono de Atributos do Jogador')}
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Atributos baseados na porcentagem (%) de contribuição individual sobre o TOTAL DA EQUIPE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {p2Name && (
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-wider bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5 text-yellow-500">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                {p1Name}
              </span>
              <span className="text-gray-600 text-[10px]">VS</span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                {p2Name}
              </span>
            </div>
          )}

          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              showExplanation 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <Info size={13} />
            {showExplanation ? 'Ocultar Guia' : 'Entender o Radar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Visual */}
        <div className="lg:col-span-7 h-[340px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} />
              
              <Radar
                name={p1Name}
                dataKey={p2 ? "p1Score" : "score"}
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.4}
                strokeWidth={2}
              />

              {p2 && (
                <Radar
                  name={p2Name}
                  dataKey="p2Score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              )}

              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0e0e11] border border-gray-700 p-3 rounded-xl shadow-2xl text-xs space-y-2 z-50">
                        <p className="font-black text-yellow-500 uppercase tracking-wider border-b border-white/10 pb-1">{data.subject}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-yellow-500">{p1Name}:</span>
                            <span className="font-mono font-black text-white">
                              {data.p1Score || data.score}/100 <span className="text-gray-400 font-normal">({data.p1Raw || data.raw})</span>
                            </span>
                          </div>
                          {p2Name && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-blue-400">{p2Name}:</span>
                              <span className="font-mono font-black text-white">
                                {data.p2Score}/100 <span className="text-gray-400 font-normal">({data.p2Raw})</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown de métricas no radar */}
        <div className="lg:col-span-5 space-y-2.5 bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Métricas Detalhadas do Radar
            </span>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-[9px] text-yellow-500 hover:underline font-bold uppercase tracking-wider"
            >
              {showExplanation ? 'Fechar Guia' : 'Como é calculado?'}
            </button>
          </div>

          {radarData.map((item, idx) => {
            const v1 = item.p1Score || item.score;
            const v2 = item.p2Score;
            const p1Wins = v2 !== undefined && v1 > v2;
            const p2Wins = v2 !== undefined && v2 > v1;

            return (
              <div key={idx} className="bg-black/60 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-gray-300 uppercase italic">{item.subject}</span>
                  <div className="flex items-center gap-2 font-mono font-bold">
                    <span className={p1Wins ? 'text-yellow-400 font-black' : 'text-gray-300'}>
                      {v1} <span className="text-[9px] text-gray-500">({item.p1Raw || item.raw})</span>
                    </span>
                    {v2 !== undefined && (
                      <>
                        <span className="text-gray-600">vs</span>
                        <span className={p2Wins ? 'text-blue-400 font-black' : 'text-gray-300'}>
                          {v2} <span className="text-[9px] text-gray-500">({item.p2Raw})</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden flex">
                  {v2 === undefined ? (
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full transition-all duration-700" 
                      style={{ width: `${v1}%` }}
                    ></div>
                  ) : (
                    <>
                      <div 
                        className={`h-full transition-all duration-700 ${p1Wins ? 'bg-yellow-500' : 'bg-yellow-500/50'}`} 
                        style={{ width: `${(v1 / (v1 + v2 || 1)) * 100}%` }}
                      ></div>
                      <div 
                        className={`h-full transition-all duration-700 ${p2Wins ? 'bg-blue-500' : 'bg-blue-500/50'}`} 
                        style={{ width: `${(v2 / (v1 + v2 || 1)) * 100}%` }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel Explicativo / Guia do Gráfico Radar */}
      {showExplanation && (
        <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 bg-black/50 -mx-6 -mb-6 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest italic">
                  Como Funciona o Gráfico Radar de Atributos (Hexágono X-Ray)?
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Guia de interpretação das 6 dimensões baseadas na participação (%) do atleta sobre o total da sua equipe.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowExplanation(false)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Grid de explicação dos 6 eixos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Flame size={13} className="text-red-500" /> Abates (% do Time)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Média Squad = 25%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Porcentagem de abates do jogador em relação à soma total de eliminações de todos os companheiros do seu time. Valores acima de 30% indicam protagonismo em frags.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Zap size={13} className="text-yellow-400" /> Poder de Fogo (% Dano)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Média Squad = 25%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Fatia do dano total gerado pela equipe. Mede o quanto da pressão de tiro e desgaste do adversário partiu dos disparos deste jogador.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Target size={13} className="text-orange-400" /> Precisão (% HS Time)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Média Squad = 25%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Porcentagem de tiros na cabeça fatais do time que foram efetuados por este jogador. Indica o responsável pelos HSs decisivos do squad.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Crosshair size={13} className="text-red-400" /> Impacto (% Deitados)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Média Squad = 25%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Participação do atleta nos knockdowns (deitados) da equipe. Mede a capacidade de derrubar inimigos e criar aberturas de avanço para o time.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Shield size={13} className="text-blue-400" /> Suporte (% Assist.)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Média Squad = 25%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Proporção de assistências do time fornecidas pelo atleta. Indica a contribuição do jogador ao enfraquecer oponentes para finalização dos colegas.
              </p>
            </div>

            <div className="bg-[#121215] p-3.5 rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-yellow-500 uppercase italic flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" /> Participação (% KP)
                </span>
                <span className="text-[9px] font-mono font-bold text-gray-500">Meta KP &gt; 50%</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Kill Participation Rate = (Abates + Assistências) / Total de Abates da Equipe. Mede a presença do jogador nas eliminações coletivas.
              </p>
            </div>
          </div>

          {/* Dicas de Interpretação das Formas do Hexágono */}
          <div className="bg-black/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest block">
              💡 Como Interpretar as Formas Geométricas do Radar
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-white uppercase flex items-center gap-1">
                  🗡️ Rusher / Entry
                </span>
                <span className="text-gray-400">Área estendida para Abates, Dano e Deitados. Perfil extremamente agressivo de entrada.</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-white uppercase flex items-center gap-1">
                  🎯 Sniper / Atirador
                </span>
                <span className="text-gray-400">Pico acentuado em Precisão (HS) e Dano. Especialista em combates de média a longa distância.</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-white uppercase flex items-center gap-1">
                  🛡️ Suporte / Tático
                </span>
                <span className="text-gray-400">Pico em Suporte (Assistências) e Consistência. Jogadores que garantem estabilidade ao time.</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-white uppercase flex items-center gap-1">
                  ⭐ Jogador Completo
                </span>
                <span className="text-gray-400">Hexágono uniforme e amplo cobrindo quase toda a área. Atleta de elite versátil em todas as funções.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const PlayerProfile = ({ data, playerName, filters, characters, rankingData }: any) => {
    const [profileSubTab, setProfileSubTab] = useState<'all' | 'zeradas' | 'rounds' | 'history'>('all');
    const [showDetails, setShowDetails] = useState<boolean>(true);
    const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
    const cleanKey = (s: string) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

    
    const rankings = useMemo(() => {
        if (!rankingData) return null;
        
        const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();
        const pName = normalize(playerName);
        
        // Find player's team and role
        const pData = rankingData.find((p: any) => normalize(p.name) === pName);
        if (!pData) return null;
        
        const team = normalize(pData.team);
        const role = normalize(pData.role);
        
        // Helper to get rank
        const getRanks = (field: string) => {
            const sortedDesc = [...rankingData].sort((a,b) => b[field] - a[field]);
            
            const overallRank = sortedDesc.findIndex(p => normalize(p.name) === pName) + 1;
            
            const roleSorted = sortedDesc.filter(p => normalize(p.role) === role);
            const roleRank = roleSorted.findIndex(p => normalize(p.name) === pName) + 1;
            const roleTotal = roleSorted.length;
            
            const teamSorted = sortedDesc.filter(p => normalize(p.team) === team);
            const teamRank = teamSorted.findIndex(p => normalize(p.name) === pName) + 1;
            const teamTotal = teamSorted.length;
            
            return {
                overall: overallRank,
                overallTotal: rankingData.length,
                role: roleRank,
                roleTotal,
                team: teamRank,
                teamTotal,
                value: pData[field]
            };
        };
        
        return {
            kills: getRanks('kills'),
            damage: getRanks('damage'),
            hs: getRanks('hs'),
            knocks: getRanks('knocks'),
            assists: getRanks('assists')
        };
    }, [rankingData, playerName]);

    const stats = useMemo(() => {
        const records = data.players.filter((p: PlayerData) => {
            if (normalize(p.PLAYER) !== normalize(playerName)) return false;
            if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
            if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
            return true;
        });

        const mapKillsMap: Record<string, number> = {};
        const mapDamageMap: Record<string, number> = {};
        records.forEach(r => {
            const m = r.MAPA || 'DESCONHECIDO';
            mapKillsMap[m] = (mapKillsMap[m] || 0) + parseNumber(r.Abates);
            mapDamageMap[m] = (mapDamageMap[m] || 0) + parseNumber(r.Dano);
        });
        const mapKills = Object.entries(mapKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        const mapDamage = Object.entries(mapDamageMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        const roundKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const rd = r.RD || 'N/A';
            roundKillsMap[rd] = (roundKillsMap[rd] || 0) + parseNumber(r.Abates);
        });
        const roundKills = Object.entries(roundKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const dropKillsMap: Record<string, number> = {};
        records.forEach(r => {
            const q = r.Q || 'N/A';
            dropKillsMap[q] = (dropKillsMap[q] || 0) + parseNumber(r.Abates);
        });
        const dropKills = Object.entries(dropKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => {
            const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        const playerSafeKillsMap: Record<string, number> = {};
        const topVictimsMap: Record<string, number> = {};
        data.killFeed.filter((k: any) => normalize(k.PLAYER) === normalize(playerName)).forEach((k: any) => {
             const safe = k.SAFE || 'OUT';
             playerSafeKillsMap[safe] = (playerSafeKillsMap[safe] || 0) + 1;
             
             const victim = k.VITIMA;
             if (victim) topVictimsMap[victim] = (topVictimsMap[victim] || 0) + 1;
        });
        const safeKills = Object.entries(playerSafeKillsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        const topVictims = Object.entries(topVictimsMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

        const topKillersMap: Record<string, number> = {};
        data.killFeed.filter((k: any) => normalize(k.VITIMA) === normalize(playerName)).forEach((k: any) => {
             const killer = k.PLAYER;
             if (killer) topKillersMap[killer] = (topKillersMap[killer] || 0) + 1;
        });
        const topKillers = Object.entries(topKillersMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

        const totalKills = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Abates), 0);
        const totalDamage = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Dano), 0);
        const totalHS = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.HS), 0);
        const totalKnocks = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Deitados), 0);
        const totalAssists = records.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Assistencias), 0);
        
        const totalMatches = records.length; 
        const zeroKillsMatches = records.filter((r: PlayerData) => parseNumber(r.Abates) === 0).length;
        const withKillsMatches = records.filter((r: PlayerData) => parseNumber(r.Abates) > 0).length;
        const zeroKillsPct = totalMatches > 0 ? ((zeroKillsMatches / totalMatches) * 100).toFixed(1) : '0.0';
        const withKillsPct = totalMatches > 0 ? ((withKillsMatches / totalMatches) * 100).toFixed(1) : '0.0';

        const team = records[0]?.TIME || data.players.find(p => normalize(p.PLAYER) === normalize(playerName))?.TIME || 'N/A';
        const playerImg = findDimImg(data.playersDimension, playerName);
        const teamImg = findTeamLogo(team, data.teamsReference);

        const teamRecords = data.players.filter((p: PlayerData) => {
            if (normalize(p.TIME) !== normalize(team)) return false;
            if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(p.RD))) return false;
            if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(p.MAPA))) return false;
            if (filters.queda.length > 0 && !filters.queda.some(q => normalize(q) === normalize(p.Q))) return false;
            return true;
        });
        const teamTotalKills = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Abates), 0);
        const teamTotalDamage = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Dano), 0);
        const teamTotalHS = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.HS), 0);
        const teamTotalKnocks = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Deitados), 0);
        const teamTotalAssists = teamRecords.reduce((acc: number, r: PlayerData) => acc + parseNumber(r.Assistencias), 0);
        const killContributionPct = teamTotalKills > 0 ? ((totalKills / teamTotalKills) * 100).toFixed(1) : '0.0';

        const rawLoadout = characters.find((l: any) => normalize(l.Player) === normalize(playerName));
        const currentLoadout = rawLoadout ? {
            ...rawLoadout,
            hab1Img: findDimImg(data.hab1, rawLoadout.Hab1),
            hab2Img: findDimImg(data.hab2, rawLoadout.Hab2),
            hab3Img: findDimImg(data.hab3, rawLoadout.Hab3),
            hab4Img: findDimImg(data.hab4, rawLoadout.Hab4),
            petImg: findDimImg(data.pets, rawLoadout.Pet),
            itemImg: findDimImg(data.items, rawLoadout.Item),
        } : null;

        const playerDim = data.playersDimension.find(d => normalize(d.Name) === normalize(playerName));
        const funcao = playerDim?.Funcao || 'N/A';
        const funcao2 = playerDim?.Funcao2 || 'N/A';

        const diff = totalKills - totalMatches;

        // Extração de partidas zeradas e detalhes por rodada
        const zeroKillsRecords = records.filter((r: PlayerData) => parseNumber(r.Abates) === 0).map((r: PlayerData) => {
            const rd = r.RD || 'N/A';
            const q = r.Q || 'N/A';
            const mapa = r.MAPA || 'N/A';
            const dano = parseNumber(r.Dano);
            const deitados = parseNumber(r.Deitados);
            const assistencias = parseNumber(r.Assistencias);
            const hs = parseNumber(r.HS);
            
            const teamDetail = data.details?.find((d: any) => 
                normalize(d.TIME) === normalize(team) && 
                normalize(d.RD) === normalize(rd) && 
                normalize(d.Q) === normalize(q)
            );
            const pos = teamDetail?.POS || 'N/A';
            const isBooyah = teamDetail?.POS === '1' || teamDetail?.B === '1';

            return {
                rd,
                q,
                mapa,
                dano,
                deitados,
                assistencias,
                hs,
                pos,
                isBooyah,
                confronto: r.CONFRONTO || ''
            };
        }).sort((a: any, b: any) => {
            const numRdA = parseInt(a.rd.replace(/\D/g, '')) || 0;
            const numRdB = parseInt(b.rd.replace(/\D/g, '')) || 0;
            if (numRdA !== numRdB) return numRdA - numRdB;
            const numQA = parseInt(a.q.replace(/\D/g, '')) || 0;
            const numQB = parseInt(b.q.replace(/\D/g, '')) || 0;
            return numQA - numQB;
        });

        const totalZeroDano = zeroKillsRecords.reduce((acc: number, z: any) => acc + z.dano, 0);
        const avgDamageInZeroKills = zeroKillsMatches > 0 ? (totalZeroDano / zeroKillsMatches).toFixed(0) : '0';

        // Distribuição de zeradas por Q1-Q6
        const zeroKillsByQ: Record<string, { total: number; zero: number; rate: string }> = {};
        ['Q1','Q2','Q3','Q4','Q5','Q6'].forEach(qKey => {
            zeroKillsByQ[qKey] = { total: 0, zero: 0, rate: '0.0' };
        });

        records.forEach((r: PlayerData) => {
            const qNum = r.Q ? r.Q.replace(/\D/g, '') : '';
            const qKey = qNum ? `Q${qNum}` : 'N/A';
            if (zeroKillsByQ[qKey]) {
                zeroKillsByQ[qKey].total += 1;
                if (parseNumber(r.Abates) === 0) zeroKillsByQ[qKey].zero += 1;
            }
        });

        Object.keys(zeroKillsByQ).forEach(qKey => {
            const item = zeroKillsByQ[qKey];
            if (item.total > 0) {
                item.rate = ((item.zero / item.total) * 100).toFixed(1);
            }
        });

        let topZeroDrop: { q: string; zero: number; total: number; rate: string } | null = null;
        Object.entries(zeroKillsByQ).forEach(([qName, val]) => {
            if (val.zero > 0) {
                if (!topZeroDrop || val.zero > topZeroDrop.zero || (val.zero === topZeroDrop.zero && parseFloat(val.rate) > parseFloat(topZeroDrop.rate))) {
                    topZeroDrop = { q: qName.replace('Q',''), zero: val.zero, total: val.total, rate: val.rate };
                }
            }
        });

        // Matriz de Rodadas x Quedas para o jogador
        const roundMatrixMap = new Map<string, {
            rd: string;
            totalKills: number;
            totalMatches: number;
            totalZero: number;
            totalDamage: number;
            dropsMap: Map<string, {
                q: string;
                kills: number;
                dano: number;
                mapa: string;
                deitados: number;
                assistencias: number;
                pos: string;
                isBooyah: boolean;
                isZero: boolean;
            }>;
        }>();

        records.forEach((r: PlayerData) => {
            const rd = r.RD || 'N/A';
            const q = r.Q ? r.Q.replace(/\D/g, '') : 'N/A';
            const kills = parseNumber(r.Abates);
            const dano = parseNumber(r.Dano);
            const deitados = parseNumber(r.Deitados);
            const assistencias = parseNumber(r.Assistencias);
            const mapa = r.MAPA || 'N/A';
            const isZero = kills === 0;

            const teamDetail = data.details?.find((d: any) => 
                normalize(d.TIME) === normalize(team) && 
                normalize(d.RD) === normalize(rd) && 
                normalize(d.Q) === normalize(q)
            );
            const pos = teamDetail?.POS || 'N/A';
            const isBooyah = teamDetail?.POS === '1' || teamDetail?.B === '1';

            if (!roundMatrixMap.has(rd)) {
                roundMatrixMap.set(rd, {
                    rd,
                    totalKills: 0,
                    totalMatches: 0,
                    totalZero: 0,
                    totalDamage: 0,
                    dropsMap: new Map()
                });
            }

            const rdObj = roundMatrixMap.get(rd)!;
            rdObj.totalKills += kills;
            rdObj.totalMatches += 1;
            if (isZero) rdObj.totalZero += 1;
            rdObj.totalDamage += dano;

            rdObj.dropsMap.set(q, {
                q,
                kills,
                dano,
                mapa,
                deitados,
                assistencias,
                pos,
                isBooyah,
                isZero
            });
        });

        const sortedRoundsMatrix = Array.from(roundMatrixMap.values()).sort((a, b) => {
            const numA = parseInt(a.rd.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.rd.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        // Recorde de Kills em uma Partida (Match Record)
        let maxMatchRecord: { kills: number; rd: string; q: string; mapa: string; dano: number; deitados: number; assistencias: number; isBooyah: boolean } | null = null;

        records.forEach((r: PlayerData) => {
            const k = parseNumber(r.Abates);
            const d = parseNumber(r.Dano);
            if (!maxMatchRecord || k > maxMatchRecord.kills || (k === maxMatchRecord.kills && d > maxMatchRecord.dano)) {
                const rd = r.RD || 'N/A';
                const q = r.Q ? r.Q.replace(/\D/g, '') : 'N/A';
                const teamDetail = data.details?.find((det: any) => 
                    normalize(det.TIME) === normalize(team) && 
                    normalize(det.RD) === normalize(rd) && 
                    normalize(det.Q) === normalize(q)
                );
                const isBooyah = teamDetail?.POS === '1' || teamDetail?.B === '1';

                maxMatchRecord = {
                    kills: k,
                    rd,
                    q,
                    mapa: r.MAPA || 'N/A',
                    dano: d,
                    deitados: parseNumber(r.Deitados),
                    assistencias: parseNumber(r.Assistencias),
                    isBooyah
                };
            }
        });

        // Recorde de Kills em uma Rodada (Round Record)
        let maxRoundRecord: { rd: string; kills: number; matches: number; avgKills: string; damage: number } | null = null;

        Array.from(roundMatrixMap.values()).forEach(rdObj => {
            if (!maxRoundRecord || rdObj.totalKills > maxRoundRecord.kills || (rdObj.totalKills === maxRoundRecord.kills && rdObj.totalDamage > maxRoundRecord.damage)) {
                maxRoundRecord = {
                    rd: rdObj.rd,
                    kills: rdObj.totalKills,
                    matches: rdObj.totalMatches,
                    avgKills: (rdObj.totalKills / (rdObj.totalMatches || 1)).toFixed(2),
                    damage: rdObj.totalDamage
                };
            }
        });

        return { 
            team, 
            playerImg,
            teamImg, 
            funcao,
            funcao2,
            kills: totalKills, 
            damage: totalDamage,
            hs: totalHS,
            knocks: totalKnocks,
            assists: totalAssists,
            matches: totalMatches, 
            zeroKillsMatches,
            withKillsMatches,
            zeroKillsPct,
            withKillsPct,
            diff,
            avg: totalMatches > 0 ? (totalKills / totalMatches).toFixed(2) : '0.00', 
            avgDmg: totalMatches > 0 ? (totalDamage / totalMatches).toFixed(0) : '0',
            killContributionPct,
            teamTotalKills,
            teamTotalDamage,
            teamTotalHS,
            teamTotalKnocks,
            teamTotalAssists,
            loadout: currentLoadout, 
            safeKills, 
            mapKills, 
            mapDamage,
            roundKills, 
            dropKills, 
            topVictims, 
            topKillers,
            zeroKillsRecords,
            zeroKillsByQ,
            avgDamageInZeroKills,
            topZeroDrop,
            sortedRoundsMatrix,
            maxMatchRecord,
            maxRoundRecord
        };
    }, [data, playerName, filters, characters]);

    return (
        <div className="space-y-6">
            <div className="bg-[#121215] p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none hidden xl:block">
                     <User size={220} className="text-yellow-500" />
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8 relative z-10">
                    {/* Identidade do Jogador & Equipe */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start xl:items-center gap-5 sm:gap-6 min-w-[260px] lg:min-w-[320px]">
                        {/* Avatar com Borda Dourada e Logo Flutuante da Equipe */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-yellow-500/20 via-black to-black p-1 border-2 border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center justify-center overflow-hidden">
                                {stats.playerImg ? (
                                    <img src={stats.playerImg} className="w-full h-full object-cover rounded-xl" alt={playerName} referrerPolicy="no-referrer" />
                                ) : stats.teamImg ? (
                                    <img src={stats.teamImg} className="w-full h-full object-contain p-2" alt={stats.team} referrerPolicy="no-referrer" />
                                ) : (
                                    <User className="text-gray-600" size={48} />
                                )}
                            </div>

                            {/* Badge Flutuante da Logo da Equipe */}
                            {stats.teamImg && (
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#141416] border-2 border-yellow-500/70 shadow-xl p-1 flex items-center justify-center bg-black/90 backdrop-blur-md" title={`Equipe: ${stats.team}`}>
                                    <img src={stats.teamImg} alt={stats.team} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                            )}
                        </div>

                        {/* Nome, Funções, Equipe e % de Participação */}
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                            {/* Nome + Funções */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                                <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tight truncate">
                                    {playerName}
                                </h2>
                                {stats.funcao !== 'N/A' && (
                                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                        stats.funcao === 'CPT' 
                                            ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-sm shadow-yellow-500/10' 
                                            : 'bg-white/10 border-white/15 text-gray-200'
                                    }`}>
                                        {stats.funcao === 'CPT' ? <Crown size={11} className="text-yellow-400" /> : <Shield size={11} className="text-gray-400" />}
                                        <span>{stats.funcao}</span>
                                    </span>
                                )}
                                {stats.funcao2 !== 'N/A' && (
                                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                        {stats.funcao2}
                                    </span>
                                )}
                            </div>

                            {/* Barra da Equipe com Logo e Nome */}
                            <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl shadow-inner">
                                    {stats.teamImg ? (
                                        <img src={stats.teamImg} alt={stats.team} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                    ) : (
                                        <Shield size={14} className="text-yellow-500" />
                                    )}
                                    <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">{stats.team}</span>
                                </div>

                                {parseFloat(stats.killContributionPct) > 0 && (
                                    <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-yellow-400 uppercase tracking-wider" title="Participação do atleta no total de abates da sua equipe">
                                        <Zap size={11} className="text-yellow-400" />
                                        <span>{stats.killContributionPct}% Kills Time</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Matriz Estatística Organizada (Grade Perfeita e Proporcional) */}
                    <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 lg:gap-3">
                        {/* 1. Abates */}
                        <MetricCard 
                            icon={Skull}
                            label="Abates" 
                            value={stats.kills} 
                            color="text-red-500" 
                            subtext={`Média ${stats.avg}/Q`}
                            subColor="text-red-400/80"
                            highlight="red"
                        />

                        {/* 2. Salas / Partidas */}
                        <MetricCard 
                            icon={Gamepad2}
                            label="Salas" 
                            value={stats.matches} 
                            color="text-sky-400" 
                            subtext="Quedas disputadas"
                            subColor="text-sky-400/70"
                        />

                        {/* 3. Quedas com Abate */}
                        <MetricCard 
                            icon={CheckCircle2}
                            label="Q. C/ Kill" 
                            value={stats.withKillsMatches} 
                            color="text-emerald-400" 
                            subtext={`${stats.withKillsPct}% frequência`}
                            subColor="text-emerald-400/80"
                        />

                        {/* 4. Quedas Zeradas */}
                        <MetricCard 
                            icon={AlertTriangle}
                            label="Q. Zerada" 
                            value={stats.zeroKillsMatches} 
                            color="text-rose-500" 
                            subtext={`${stats.zeroKillsPct}% sem abates`}
                            subColor="text-rose-400/80"
                        />

                        {/* 5. Saldo (Diff) */}
                        <MetricCard 
                            icon={Scale}
                            label="Saldo (S)" 
                            value={stats.diff > 0 ? `+${stats.diff}` : stats.diff} 
                            color={stats.diff > 0 ? "text-emerald-400" : stats.diff < 0 ? "text-rose-500" : "text-gray-400"} 
                            subtext="Kills - Quedas"
                            subColor="text-gray-400"
                        />

                        {/* 6. Dano Total */}
                        <MetricCard 
                            icon={Flame}
                            label="Dano Total" 
                            value={typeof stats.damage === 'number' ? stats.damage.toLocaleString('pt-BR') : stats.damage} 
                            color="text-gray-100" 
                            subtext={`Média ${stats.avgDmg}/Q`}
                            subColor="text-orange-400/80"
                        />

                        {/* 7. Headshots */}
                        <MetricCard 
                            icon={Crosshair}
                            label="Headshots" 
                            value={stats.hs} 
                            color="text-amber-400" 
                            subtext={`${stats.kills > 0 ? ((stats.hs / stats.kills) * 100).toFixed(1) : '0.0'}% taxa HS`}
                            subColor="text-amber-400/80"
                        />

                        {/* 8. Deitados (Knocks) */}
                        <MetricCard 
                            icon={Zap}
                            label="Deitados" 
                            value={stats.knocks} 
                            color="text-orange-500" 
                            subtext={`Média ${(stats.knocks / (stats.matches || 1)).toFixed(2)}/Q`}
                            subColor="text-orange-400/80"
                        />

                        {/* 9. Assistências */}
                        <MetricCard 
                            icon={Users}
                            label="Assistências" 
                            value={stats.assists} 
                            color="text-blue-400" 
                            subtext={`Média ${(stats.assists / (stats.matches || 1)).toFixed(2)}/Q`}
                            subColor="text-blue-400/80"
                        />

                        {/* 10. Média de Kills */}
                        <MetricCard 
                            icon={Target}
                            label="Média Kills" 
                            value={stats.avg} 
                            color="text-yellow-400" 
                            subtext="Kills por Queda"
                            subColor="text-yellow-400/80"
                            highlight="yellow"
                        />
                    </div>
                </div>
            </div>

            {/* Banner de Recordes Individuais do Jogador */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-red-950/40 via-black to-black p-5 rounded-2xl border border-red-500/30 shadow-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex-shrink-0">
                        <Trophy size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-0.5">RECORDE DE KILLS EM 1 PARTIDA</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white italic">{stats.maxMatchRecord ? stats.maxMatchRecord.kills : 0}</span>
                            <span className="text-xs font-bold text-red-400 uppercase">Kills</span>
                            {stats.maxMatchRecord?.isBooyah && (
                                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[9px] font-black uppercase inline-flex items-center gap-1">
                                    <Crown size={10} /> Booyah!
                                </span>
                            )}
                        </div>
                        {stats.maxMatchRecord ? (
                            <p className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                <span className="text-white font-bold">{stats.maxMatchRecord.rd} • Q{stats.maxMatchRecord.q}</span> ({stats.maxMatchRecord.mapa}) • <span className="text-amber-400 font-mono">{stats.maxMatchRecord.dano} Dano</span>
                            </p>
                        ) : (
                            <p className="text-[11px] text-gray-500 italic mt-1">Sem registros no período</p>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-950/40 via-black to-black p-5 rounded-2xl border border-yellow-500/30 shadow-xl flex items-center gap-4 relative overflow-hidden">
                    <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 flex-shrink-0">
                        <Crown size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-0.5">RECORDE DE KILLS EM 1 RODADA (RD)</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white italic">{stats.maxRoundRecord ? stats.maxRoundRecord.kills : 0}</span>
                            <span className="text-xs font-bold text-yellow-400 uppercase">Kills Acumuladas</span>
                            {stats.maxRoundRecord && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-black uppercase">
                                    Média {stats.maxRoundRecord.avgKills}/Q
                                </span>
                            )}
                        </div>
                        {stats.maxRoundRecord ? (
                            <p className="text-[11px] text-gray-400 font-medium truncate mt-1">
                                <span className="text-white font-bold">{stats.maxRoundRecord.rd}</span> ({stats.maxRoundRecord.matches} Quedas disputadas) • <span className="text-amber-400 font-mono">{stats.maxRoundRecord.damage.toLocaleString()} Dano Total</span>
                            </p>
                        ) : (
                            <p className="text-[11px] text-gray-500 italic mt-1">Sem registros no período</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Navegação de Sub-abas do Perfil */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121215] p-2.5 rounded-2xl border border-white/5 shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setProfileSubTab('all')}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            profileSubTab === 'all'
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Activity size={15} /> Visão Geral Completa
                    </button>

                    <button
                        onClick={() => setProfileSubTab('zeradas')}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            profileSubTab === 'zeradas'
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <AlertTriangle size={15} className={profileSubTab === 'zeradas' ? 'text-white' : 'text-red-400'} /> Detalhes Quedas Zeradas
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/30 text-[10px]">
                            {stats.zeroKillsMatches}
                        </span>
                    </button>

                    <button
                        onClick={() => setProfileSubTab('rounds')}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            profileSubTab === 'rounds'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <ListOrdered size={15} className={profileSubTab === 'rounds' ? 'text-white' : 'text-blue-300'} /> Detalhes por Rodada (RD x Q)
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/30 text-[10px]">
                            {stats.sortedRoundsMatrix.length} RDs
                        </span>
                    </button>

                    <button
                        onClick={() => setProfileSubTab('history')}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                            profileSubTab === 'history'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Sparkles size={15} className={profileSubTab === 'history' ? 'text-white' : 'text-amber-300'} /> Histórico Loadouts
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Botão de Mostrar / Ocultar Detalhamento */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border shadow-md ${
                            showDetails 
                                ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20' 
                                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={showDetails ? "Ocultar blocos de detalhamento" : "Exibir blocos de detalhamento"}
                    >
                        {showDetails ? (
                            <>
                                <EyeOff size={15} /> Ocultar Detalhamento
                            </>
                        ) : (
                            <>
                                <Eye size={15} /> Mostrar Detalhamento
                            </>
                        )}
                    </button>
                </div>
            </div>

            {!showDetails && (
                <div className="bg-[#121215] p-5 rounded-2xl border border-white/5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Info size={18} className="text-yellow-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">
                            O detalhamento avançado de Quedas Zeradas e Matriz por Rodada está <strong className="text-red-400">oculto</strong> no momento.
                        </span>
                    </div>
                    <button
                        onClick={() => setShowDetails(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg flex items-center gap-2 flex-shrink-0"
                    >
                        <Eye size={14} /> Expandir Detalhamento
                    </button>
                </div>
            )}

            {/* Conteúdo: Visão Geral ou Abas Específicas */}
            
            {/* Rankings Section */}
            {showDetails && profileSubTab === 'all' && rankings && (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#121215] p-6 rounded-3xl border border-yellow-500/20 shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
                    
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Trophy size={20} className="text-yellow-500" />
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Classificações do Jogador no Campeonato</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {[
                            { label: "Abates", data: rankings.kills, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
                            { label: "Dano", data: rankings.damage, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                            { label: "HS", data: rankings.hs, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                            { label: "Deitados", data: rankings.knocks, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                            { label: "Assistências", data: rankings.assists, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
                        ].map(stat => (
                            <div key={stat.label} className="bg-black/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${stat.bg}`} />
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">{stat.label}</span>
                                
                                <div className="w-full space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-bold">Geral</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`font-black italic ${stat.color}`}>#{stat.data.overall}</span>
                                            <span className="text-[9px] text-gray-600">/ {stat.data.overallTotal}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-bold">Função</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`font-black italic ${stat.color}`}>#{stat.data.role}</span>
                                            <span className="text-[9px] text-gray-600">/ {stat.data.roleTotal}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-bold">Equipe</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`font-black italic ${stat.color}`}>#{stat.data.team}</span>
                                            <span className="text-[9px] text-gray-600">/ {stat.data.teamTotal}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

{showDetails && (profileSubTab === 'all' || profileSubTab === 'zeradas') && (
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-red-900/30 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                <AlertTriangle size={20} className="text-red-500" />
                                DETALHAMENTO DE QUEDAS ZERADAS ({stats.zeroKillsMatches} PARTIDAS)
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                                Análise aprofundada de todas as partidas em que o jogador finalizou sem abates
                            </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Frequência Zerada:</span>
                            <span className="text-sm font-black text-red-500 italic">{stats.zeroKillsPct}% das Quedas</span>
                        </div>
                    </div>

                    {/* Cards Resumo das Quedas Zeradas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Total de Partidas Zeradas</span>
                            <span className="text-2xl font-black text-red-500 italic">{stats.zeroKillsMatches} / {stats.matches}</span>
                            <span className="text-[10px] text-gray-500 font-bold block mt-1">{stats.zeroKillsPct}% do Total</span>
                        </div>
                        <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Partidas com Kills</span>
                            <span className="text-2xl font-black text-green-500 italic">{stats.withKillsMatches} / {stats.matches}</span>
                            <span className="text-[10px] text-gray-500 font-bold block mt-1">{stats.withKillsPct}% de Sucesso</span>
                        </div>
                        <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Dano Médio nas Zeradas</span>
                            <span className="text-2xl font-black text-amber-400 italic">{stats.avgDamageInZeroKills}</span>
                            <span className="text-[10px] text-gray-500 font-bold block mt-1">Dano sem Finalizar Kills</span>
                        </div>
                        <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Queda C/ Mais Zeradas</span>
                            <span className="text-2xl font-black text-yellow-500 italic">
                                {stats.topZeroDrop ? `Q${stats.topZeroDrop.q}` : 'N/A'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold block mt-1">
                                {stats.topZeroDrop ? `${stats.topZeroDrop.zero} zeradas (${stats.topZeroDrop.rate}%)` : 'Sem zeradas'}
                            </span>
                        </div>
                    </div>

                    {/* Distribuição de Zeradas por Queda (Q1 a Q6) */}
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3">
                        <h4 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <TargetIcon size={14} className="text-yellow-500" /> FREQUÊNCIA DE ZERADAS POR NÚMERO DA QUEDA (Q1 A Q6)
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {['Q1','Q2','Q3','Q4','Q5','Q6'].map(qKey => {
                                const item = stats.zeroKillsByQ[qKey] || { total: 0, zero: 0, rate: '0.0' };
                                const isHigh = parseFloat(item.rate) >= 40;
                                return (
                                    <div key={qKey} className={`p-3 rounded-xl border text-center transition-all ${
                                        item.zero > 0 
                                            ? isHigh ? 'bg-red-950/30 border-red-500/50' : 'bg-amber-950/20 border-amber-500/30'
                                            : 'bg-emerald-950/20 border-emerald-500/30'
                                    }`}>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{qKey}</span>
                                        <span className={`text-lg font-black italic block my-0.5 ${item.zero > 0 ? (isHigh ? 'text-red-400' : 'text-amber-400') : 'text-emerald-400'}`}>
                                            {item.zero} <span className="text-xs text-gray-500">/ {item.total}</span>
                                        </span>
                                        <span className="text-[9px] font-bold text-gray-400 block">{item.rate}% Zerada</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabela de Partidas Zeradas */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <ListOrdered size={14} className="text-red-400" /> LISTA INDIVIDUAL DE PARTIDAS ZERADAS
                        </h4>

                        {stats.zeroKillsRecords.length > 0 ? (
                            <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/60">
                                <table className="w-full text-left text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-black/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                                            <th className="px-4 py-3 text-center">#</th>
                                            <th className="px-4 py-3">RODADA</th>
                                            <th className="px-4 py-3">QUEDA</th>
                                            <th className="px-4 py-3">MAPA</th>
                                            <th className="px-4 py-3 text-right">DANO</th>
                                            <th className="px-4 py-3 text-center">DEITADOS</th>
                                            <th className="px-4 py-3 text-center">ASSIST.</th>
                                            <th className="px-4 py-3 text-center">POS. EQUIPE</th>
                                            <th className="px-4 py-3 text-center">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono">
                                        {stats.zeroKillsRecords.map((z: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                                                <td className="px-4 py-3 text-center text-gray-500 font-bold">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-white uppercase">{z.rd}</td>
                                                <td className="px-4 py-3 text-yellow-400 font-bold">QUEDA {z.q}</td>
                                                <td className="px-4 py-3 text-gray-300 uppercase font-bold">{z.mapa}</td>
                                                <td className="px-4 py-3 text-right text-amber-400 font-black">{z.dano}</td>
                                                <td className="px-4 py-3 text-center text-orange-400 font-bold">{z.deitados}</td>
                                                <td className="px-4 py-3 text-center text-blue-400 font-bold">{z.assistencias}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {z.isBooyah ? (
                                                        <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] font-black uppercase inline-flex items-center justify-center gap-1">
                                                            <Crown size={11} /> #1 Booyah
                                                        </span>
                                                    ) : z.pos !== 'N/A' ? (
                                                        <span className="text-gray-300 font-bold">#{z.pos}</span>
                                                    ) : (
                                                        <span className="text-gray-600">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30 text-[10px] font-black uppercase">
                                                        0 KILLS {z.dano >= 400 ? '• DANO ALTO' : ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-emerald-400 font-black italic uppercase text-xs">
                                👏 O jogador não possui nenhuma queda zerada no período selecionado!
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showDetails && (profileSubTab === 'all' || profileSubTab === 'rounds') && (
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-blue-900/30 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                <ListOrdered size={20} className="text-blue-400" />
                                DETALHAMENTO DE QUEDAS POR RODADA (MATRIZ RD x Q)
                            </h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                                Desempenho partida por partida em cada rodada disputada pelo jogador
                            </p>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Rodadas:</span>
                            <span className="text-sm font-black text-white italic">{stats.sortedRoundsMatrix.length} Rodadas</span>
                        </div>
                    </div>

                    {/* Matriz Geral RD x Q Table */}
                    <div className="overflow-x-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/60 p-2">
                        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                            <thead>
                                <tr className="bg-black/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                                    <th className="px-4 py-3">RODADA</th>
                                    <th className="px-3 py-3 text-center bg-red-950/30 text-red-400">KILLS</th>
                                    <th className="px-3 py-3 text-center text-gray-300">PJ</th>
                                    <th className="px-3 py-3 text-center text-yellow-500">MÉDIA</th>
                                    <th className="px-3 py-3 text-center text-red-500">ZERADAS</th>
                                    {['Q1','Q2','Q3','Q4','Q5','Q6'].map(q => (
                                        <th key={q} className="px-3 py-3 text-center text-gray-300 min-w-[100px]">{q}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono">
                                {stats.sortedRoundsMatrix.map((rdObj: any) => {
                                    const avgRD = (rdObj.totalKills / (rdObj.totalMatches || 1)).toFixed(2);
                                    return (
                                        <tr key={rdObj.rd} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="px-4 py-3 font-black text-white uppercase italic">{rdObj.rd}</td>
                                            <td className="px-3 py-3 text-center font-black text-red-400 bg-red-950/20 text-sm">{rdObj.totalKills}</td>
                                            <td className="px-3 py-3 text-center font-bold text-gray-300">{rdObj.totalMatches}</td>
                                            <td className="px-3 py-3 text-center font-black text-yellow-500">{avgRD}</td>
                                            <td className="px-3 py-3 text-center font-black text-red-500">{rdObj.totalZero}</td>

                                            {['1','2','3','4','5','6'].map(qNum => {
                                                const dropData = rdObj.dropsMap.get(qNum) || rdObj.dropsMap.get(`Q${qNum}`);
                                                if (!dropData) {
                                                    return <td key={qNum} className="px-2 py-3 text-center text-gray-700 font-bold">-</td>;
                                                }

                                                const isZero = dropData.isZero;
                                                return (
                                                    <td key={qNum} className="px-2 py-2 text-center">
                                                        <div className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                                                            isZero 
                                                                ? 'bg-red-950/40 border-red-500/40 text-red-400' 
                                                                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                                                        }`}>
                                                            <div className="flex items-center gap-1 font-black text-xs">
                                                                {dropData.isBooyah && <Crown size={11} className="text-yellow-400" />}
                                                                <span>{isZero ? '0 Kills' : `+${dropData.kills} Kills`}</span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[90px]">
                                                                {dropData.mapa}
                                                            </span>
                                                            <span className="text-[8px] text-gray-500 font-mono">
                                                                {dropData.dano}d
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Detalhamento Card por Card de Cada Rodada */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <TargetIcon size={14} className="text-blue-400" /> RESUMO INDIVIDUAL DE CADA RODADA
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                            {stats.sortedRoundsMatrix.map((rdObj: any) => {
                                const avgRD = (rdObj.totalKills / (rdObj.totalMatches || 1)).toFixed(2);
                                return (
                                    <div key={rdObj.rd} className="bg-black/50 p-5 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs rounded-xl uppercase italic">
                                                    {rdObj.rd}
                                                </span>
                                                <span className="text-sm font-black text-white uppercase">
                                                    {rdObj.totalKills} Abates
                                                </span>
                                                <span className="text-xs text-gray-500 font-bold uppercase">
                                                    • {rdObj.totalMatches} Quedas • Média {avgRD}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="text-amber-400 font-bold">{rdObj.totalDamage.toLocaleString()} Dano Total</span>
                                                <span className={`font-black ${rdObj.totalZero > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                                    {rdObj.totalZero} Quedas Zeradas
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cards das Quedas da Rodada */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                            {Array.from(rdObj.dropsMap.values()).map((drop: any, dIdx: number) => (
                                                <div key={dIdx} className={`p-3 rounded-xl border flex flex-col justify-between ${
                                                    drop.isZero ? 'bg-red-950/20 border-red-500/30' : 'bg-black/80 border-white/10'
                                                }`}>
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[10px] font-black text-yellow-500 uppercase">Q{drop.q}</span>
                                                            {drop.isBooyah && <Crown size={12} className="text-yellow-400" />}
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-300 uppercase block truncate mb-2">{drop.mapa}</span>
                                                    </div>
                                                    <div>
                                                        <div className={`text-base font-black italic mb-1 ${drop.isZero ? 'text-red-500' : 'text-emerald-400'}`}>
                                                            {drop.kills} Kills
                                                        </div>
                                                        <div className="text-[9px] font-mono text-gray-400 flex justify-between">
                                                            <span>{drop.dano}d</span>
                                                            <span>{drop.deitados}dts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {(profileSubTab === 'all' || profileSubTab === 'overview') && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Dano Médio</span>
                    <span className="text-xl font-black text-white italic">{stats.avgDmg}</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">% Headshot</span>
                    <span className="text-xl font-black text-yellow-500 italic">
                        {stats.kills > 0 ? ((stats.hs / stats.kills) * 100).toFixed(1) : '0.0'}%
                    </span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Knocks/Kills</span>
                    <span className="text-xl font-black text-orange-500 italic">
                        {stats.kills > 0 ? (stats.knocks / stats.kills).toFixed(2) : '0.00'}
                    </span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">% Contribuição</span>
                    <span className="text-xl font-black text-blue-400 italic">{stats.killContributionPct}%</span>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Participação</span>
                    <span className="text-xl font-black text-blue-400 italic">
                        {stats.kills + stats.assists}
                    </span>
                </div>
            </div>

            <PlayerRadarComponent 
                p1Stats={stats} 
                p1Name={playerName} 
                title={`GRÁFICO RADAR DE DESEMPENHO: ${playerName}`} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><MapIcon size={16} className="text-yellow-500" /> PERFORMANCE POR MAPA</h3>
                    <div className="space-y-4 flex-1">
                         {stats.mapKills.length > 0 ? stats.mapKills.map((map, i) => {
                             const mapDmg = stats.mapDamage.find(md => md.name === map.name)?.count || 0;
                             return (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{map.name}</span>
                                     <div className="flex gap-3">
                                         <span className="text-[10px] font-black text-gray-400 italic uppercase">{mapDmg} DANO</span>
                                         <span className="text-xs font-black text-white italic">{map.count} KILLS</span>
                                     </div>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" style={{ width: `${(map.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )}) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem dados de mapas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Hash size={16} className="text-blue-400" /> ABATES POR RODADA</h3>
                    <div className="space-y-4 flex-1">
                         {stats.roundKills.length > 0 ? stats.roundKills.map((rd, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{rd.name}</span>
                                     <span className="text-xs font-black text-white italic">{rd.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${(rd.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros de rodada</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><TargetIcon size={16} className="text-yellow-400" /> ABATES POR QUEDA (Q)</h3>
                    <div className="space-y-4 flex-1">
                         {stats.dropKills.length > 0 ? stats.dropKills.map((q, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">PARTIDA {q.name}</span>
                                     <span className="text-xs font-black text-yellow-400 italic">{q.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-full" style={{ width: `${(q.count / (stats.kills || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros de quedas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Disc size={16} className="text-red-500" /> ABATES POR SAFE</h3>
                    <div className="space-y-4 flex-1">
                         {stats.safeKills.length > 0 ? stats.safeKills.map((safe, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">SAFE {safe.name}</span>
                                     <span className="text-xs font-black text-red-500 italic">{safe.count} KILLS</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(safe.count / (stats.safeKills.reduce((a,b) => a + b.count, 0) || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem registros no KillFeed</div>
                         )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Crosshair size={16} className="text-green-500" /> MAIORES VÍTIMAS</h3>
                    <div className="space-y-4 flex-1">
                         {stats.topVictims.length > 0 ? stats.topVictims.map((victim, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{victim.name}</span>
                                     <span className="text-xs font-black text-green-500 italic">{victim.count} ABATES</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${(victim.count / (stats.topVictims[0]?.count || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem vítimas registradas</div>
                         )}
                    </div>
                </div>

                <div className="bg-[#0e0e11] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Skull size={16} className="text-red-500" /> MAIORES ALGOZES</h3>
                    <div className="space-y-4 flex-1">
                         {stats.topKillers.length > 0 ? stats.topKillers.map((killer, i) => (
                             <div key={i} className="space-y-2">
                                 <div className="flex justify-between items-end">
                                     <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{killer.name}</span>
                                     <span className="text-xs font-black text-red-500 italic">{killer.count} MORTES</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(killer.count / (stats.topKillers[0]?.count || 1)) * 100}%` }}></div>
                                 </div>
                             </div>
                         )) : (
                             <div className="flex-1 flex items-center justify-center text-gray-700 font-black italic uppercase text-[10px]">Sem mortes registradas</div>
                         )}
                    </div>
                </div>
            </div>
                </>
            )}

            {/* Loadout Competitivo & Histórico Completo */}
            {(profileSubTab === 'all' || profileSubTab === 'overview' || profileSubTab === 'history') && (
                <>
                    {stats.loadout && (
                        <div className="bg-[#0e0e11] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                                <h3 className="text-sm font-black text-white uppercase flex items-center gap-3 tracking-widest"><Zap size={18} className="text-yellow-500" /> CONFIGURAÇÃO ATUAL</h3>
                                <span className="text-[10px] text-gray-500 font-mono italic">ÚLTIMA QUEDA: Q{stats.loadout.Q}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 justify-between">
                                 <PremiumLoadoutCard title="ATIVA" name={stats.loadout.Hab1} img={stats.loadout.hab1Img} highlight />
                                 <PremiumLoadoutCard title="HAB 2" name={stats.loadout.Hab2} img={stats.loadout.hab2Img} />
                                 <PremiumLoadoutCard title="HAB 3" name={stats.loadout.Hab3} img={stats.loadout.hab3Img} />
                                 <PremiumLoadoutCard title="HAB 4" name={stats.loadout.Hab4} img={stats.loadout.hab4Img} />
                                 <PremiumLoadoutCard title="PET" name={stats.loadout.Pet} img={stats.loadout.petImg} />
                                 <PremiumLoadoutCard title="ITEM" name={stats.loadout.Item} img={stats.loadout.itemImg} />
                            </div>
                        </div>
                    )}

            {/* Histórico Completo de Personagens por Queda */}
            {(() => {
                const history = getPlayerCharacterHistory(data, playerName);
                if (history.length === 0) return null;

                const hab1Counts: Record<string, number> = {};
                const petCounts: Record<string, number> = {};
                const itemCounts: Record<string, number> = {};

                history.forEach(h => {
                    if (h.hab1) hab1Counts[h.hab1] = (hab1Counts[h.hab1] || 0) + 1;
                    if (h.pet) petCounts[h.pet] = (petCounts[h.pet] || 0) + 1;
                    if (h.item) itemCounts[h.item] = (itemCounts[h.item] || 0) + 1;
                });

                const totalQuedas = history.length;

                return (
                    <div className="bg-[#0e0e11] p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-8 mt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                            <div>
                                <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                                    <Sparkles size={20} className="text-yellow-500 animate-pulse" />
                                    HISTÓRICO DE PERSONAGENS UTILIZADOS
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                                    Acompanhe a variação de habilidades ativas, passivas, pets e itens em todas as {totalQuedas} quedas disputadas pelo jogador
                                </p>
                            </div>
                            <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-2xl flex items-center gap-2">
                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">TOTAL REGISTRADO:</span>
                                <span className="text-sm font-black text-white italic">{totalQuedas} Quedas</span>
                            </div>
                        </div>

                        {/* Preferências Frequentes do Jogador */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="bg-black/60 p-3.5 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                    <Zap size={12} /> ATIVAS FAVORITAS
                                </span>
                                <div className="space-y-1.5">
                                    {Object.entries(hab1Counts).sort((a,b) => b[1] - a[1]).map(([hab, count]) => {
                                        const pct = ((count / totalQuedas) * 100).toFixed(0);
                                        return (
                                            <div key={hab} className="flex justify-between items-center text-xs">
                                                <span className="font-black text-white italic uppercase">{hab}</span>
                                                <span className="text-yellow-500 font-bold text-[10px]">{count}x ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-black/60 p-3.5 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                    <Shield size={12} /> PETS FAVORITOS
                                </span>
                                <div className="space-y-1.5">
                                    {Object.entries(petCounts).sort((a,b) => b[1] - a[1]).map(([pet, count]) => {
                                        const pct = ((count / totalQuedas) * 100).toFixed(0);
                                        return (
                                            <div key={pet} className="flex justify-between items-center text-xs">
                                                <span className="font-black text-gray-300 uppercase">{pet}</span>
                                                <span className="text-blue-400 font-bold text-[10px]">{count}x ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-black/60 p-3.5 rounded-xl border border-white/5">
                                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                                    <Flame size={12} /> ITENS FAVORITOS
                                </span>
                                <div className="space-y-1.5">
                                    {Object.entries(itemCounts).sort((a,b) => b[1] - a[1]).map(([item, count]) => {
                                        const pct = ((count / totalQuedas) * 100).toFixed(0);
                                        return (
                                            <div key={item} className="flex justify-between items-center text-xs">
                                                <span className="font-black text-gray-300 uppercase">{item}</span>
                                                <span className="text-orange-400 font-bold text-[10px]">{count}x ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Lista de Quedas com Loadouts */}
                        <div className="space-y-4">
                            {history.map((h, hIdx) => (
                                <div key={hIdx} className="bg-black/50 p-5 rounded-2xl border border-gray-800 hover:border-yellow-500/30 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center font-black text-yellow-500 text-xs flex-shrink-0">
                                            Q{h.q}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-white italic uppercase">RD {h.rd} • QUEDA {h.q}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">{h.mapa}</span>
                                            {(h.kills !== undefined || h.damage !== undefined) && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {h.kills !== undefined && <span className="text-[10px] font-black text-red-500 italic">{h.kills} Kills</span>}
                                                    {h.damage !== undefined && <span className="text-[10px] font-bold text-gray-500 italic">{h.damage} Dano</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                        <PremiumLoadoutCard title="ATIVA" name={h.hab1} img={h.hab1Img} highlight />
                                        <PremiumLoadoutCard title="HAB 2" name={h.hab2} img={h.hab2Img} />
                                        <PremiumLoadoutCard title="HAB 3" name={h.hab3} img={h.hab3Img} />
                                        <PremiumLoadoutCard title="HAB 4" name={h.hab4} img={h.hab4Img} />
                                        <PremiumLoadoutCard title="PET" name={h.pet} img={h.petImg} />
                                        <PremiumLoadoutCard title="ITEM" name={h.item} img={h.itemImg} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
                </>
            )}
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, color = "text-white", subtext, subColor = "text-gray-400", highlight }: any) => {
    const borderClass = highlight === 'red'
        ? 'border-red-500/30 hover:border-red-500/50 bg-red-950/20'
        : highlight === 'yellow'
        ? 'border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-950/20'
        : 'border-white/5 hover:border-white/15 bg-black/50';

    const valStr = String(value ?? '');
    const isLongVal = valStr.length > 5;

    return (
        <div className={`p-2.5 sm:p-3 rounded-2xl border ${borderClass} shadow-inner flex flex-col justify-between transition-all duration-200 group hover:scale-[1.02] min-h-[90px]`}>
            <div className="flex items-center justify-between gap-1">
                <span className="text-[9.5px] sm:text-[10px] font-black uppercase text-gray-400 tracking-wider whitespace-nowrap overflow-hidden">
                    {label}
                </span>
                {Icon && <Icon size={12} className="text-gray-500 group-hover:text-yellow-400 transition-colors flex-shrink-0" />}
            </div>
            <div className="my-1 overflow-hidden">
                <span 
                    title={valStr}
                    className={`block ${
                        isLongVal 
                            ? 'text-lg sm:text-xl md:text-[22px] lg:text-[24px]' 
                            : 'text-2xl sm:text-2xl md:text-3xl lg:text-[28px]'
                    } font-black italic tracking-tight ${color} leading-none whitespace-nowrap`}
                >
                    {value}
                </span>
            </div>
            {subtext ? (
                <span className={`text-[8.5px] sm:text-[9px] font-bold ${subColor} uppercase tracking-tight block truncate`} title={subtext}>
                    {subtext}
                </span>
            ) : (
                <div className="h-2" />
            )}
        </div>
    );
};

export default Players;
