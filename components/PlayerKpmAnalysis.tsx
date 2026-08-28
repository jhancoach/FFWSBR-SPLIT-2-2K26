import React, { useMemo, useState } from 'react';
import { DashboardData } from '../types';
import { Activity, Clock, Crosshair, Filter, Shield, Flame, Target, Map as MapIcon, Trophy, Users, User, ArrowUpDown, ChevronDown, ChevronUp, Search, X, TrendingUp, Zap, BarChart2, Info, HelpCircle, Eye, EyeOff, BookOpen, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface PlayerKpmAnalysisProps {
    data: DashboardData;
    selectedPlayer?: string | null;
    onSelectPlayer?: (player: string) => void;
    initialRole?: string;
    initialMap?: string;
    hideTopControls?: boolean;
    singlePlayerOnly?: boolean;
}

const SAFE_DURATIONS_SEC: Record<string, Record<number, number>> = {
    BER: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    PUR: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    KAL: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    NT:  { 1: 410, 2: 190, 3: 150, 4: 130, 5: 120, 6: 120, 7: 0, 8: 0 },
    SOL: { 1: 420, 2: 175, 3: 160, 4: 135, 5: 150, 6: 120, 7: 0, 8: 0 },
};

function getMapGroup(mapName: string): string {
    const norm = (mapName || '').toUpperCase().trim();
    if (norm.includes('BER')) return 'BER';
    if (norm.includes('PUR')) return 'PUR';
    if (norm.includes('KAL')) return 'KAL';
    if (norm.includes('NOVA') || norm === 'NT') return 'NT';
    if (norm.includes('SOL')) return 'SOL';
    return 'BER';
}

function extractSafeNumber(safeStr: string): number {
    if (!safeStr) return 1;
    const match = safeStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
}

const MAP_NAMES: Record<string, string> = {
    BER: 'Bermuda',
    PUR: 'Purgatório',
    KAL: 'Kalahari',
    NT: 'Nova Terra',
    SOL: 'Solarium'
};

const MAP_COLORS: Record<string, string> = {
    BER: '#3B82F6', // Blue
    PUR: '#F97316', // Orange
    KAL: '#EAB308', // Yellow
    NT:  '#A855F7', // Purple
    SOL: '#EF4444', // Red
};

export const PlayerKpmAnalysis: React.FC<PlayerKpmAnalysisProps> = ({ 
    data, 
    selectedPlayer, 
    onSelectPlayer,
    initialRole = 'ALL',
    initialMap = 'ALL',
    hideTopControls = false,
    singlePlayerOnly = false
}) => {
    const [sortBy, setSortBy] = useState<string>('global_kpm');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [mapFilter, setMapFilter] = useState<string>(initialMap);
    const [roleFilter, setRoleFilter] = useState<string>(initialRole);
    const [tableMode, setTableMode] = useState<'safe' | 'map'>('safe');
    const [safeColumnFilter, setSafeColumnFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activePlayer, setActivePlayer] = useState<string | null>(selectedPlayer || null);

    const isSinglePlayer = Boolean(singlePlayerOnly || selectedPlayer);

    const [showSafeExplanation, setShowSafeExplanation] = useState<boolean>(true);
    const [showMapExplanation, setShowMapExplanation] = useState<boolean>(false);
    const [showSafeTable, setShowSafeTable] = useState<boolean>(true);
    const [showMapTable, setShowMapTable] = useState<boolean>(true);
    const [showCharts, setShowCharts] = useState<boolean>(true);

    const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

    // Extract available roles
    const availableRoles = useMemo(() => {
        const set = new Set<string>();
        data.playersDimension.forEach(d => {
            if (d.Funcao && d.Funcao.trim() && d.Funcao.toUpperCase() !== 'N/A') {
                set.add(d.Funcao.trim().toUpperCase());
            }
            if (d.Funcao2 && d.Funcao2.trim() && d.Funcao2.toUpperCase() !== 'N/A') {
                set.add(d.Funcao2.trim().toUpperCase());
            }
        });
        return Array.from(set).sort();
    }, [data.playersDimension]);

    const visibleSafes = useMemo(() => {
        if (safeColumnFilter === 'EARLY') return [1, 2];
        if (safeColumnFilter === 'MID') return [3, 4];
        if (safeColumnFilter === 'LATE') return [5, 6, 7];
        if (safeColumnFilter.startsWith('S')) return [parseInt(safeColumnFilter.replace('S', ''), 10)];
        return [1, 2, 3, 4, 5, 6, 7];
    }, [safeColumnFilter]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortDirection('desc');
        }
    };

    const analysisData = useMemo(() => {
        // Player matches tracking
        const playerMatches = new Map<string, Array<{ matchId: string, mapName: string, mapGroup: string, rd?: string, q?: string }>>();
        const playerTeams = new Map<string, string>();

        data.players.forEach(p => {
            if (!p.PLAYER || !p.MAPA || !p.Q) return;
            const pName = normalize(p.PLAYER);
            if (!playerMatches.has(pName)) playerMatches.set(pName, []);
            if (p.TIME) playerTeams.set(pName, p.TIME);

            const matchId = `${p.RD || ''}-${p.Q}-${p.MAPA}`;
            const mapGroup = getMapGroup(p.MAPA);

            if (!isSinglePlayer && mapFilter !== 'ALL' && mapGroup !== mapFilter) return;

            if (!playerMatches.get(pName)!.some(m => m.matchId === matchId)) {
                playerMatches.get(pName)!.push({ matchId, mapName: p.MAPA, mapGroup, rd: p.RD, q: p.Q });
            }
        });

        // Dimensão de Jogadores e Funções
        const playerDimMap = new Map<string, { img?: string, role?: string, role2?: string }>();
        data.playersDimension.forEach(d => {
            playerDimMap.set(normalize(d.Name), {
                img: d.IMG,
                role: d.Funcao?.trim().toUpperCase(),
                role2: d.Funcao2?.trim().toUpperCase()
            });
        });

        const playerStats = new Map<string, {
            name: string;
            team: string;
            image?: string;
            teamImage?: string;
            role: string;
            role2?: string;
            killsBySafe: Record<number, number>;
            killsByMap: Record<string, number>;
            totalKills: number;
        }>();

        playerMatches.forEach((_, pName) => {
            const dim = playerDimMap.get(pName);
            const team = playerTeams.get(pName) || 'N/A';
            const teamLogo = (Array.isArray(data.teamsReference) ? data.teamsReference : []).find(tr => normalize(tr.TIME) === normalize(team))?.IMG;

            playerStats.set(pName, {
                name: pName,
                team,
                image: dim?.img,
                teamImage: teamLogo,
                role: dim?.role || 'SEM FUNÇÃO',
                role2: dim?.role2,
                killsBySafe: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
                killsByMap: { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 },
                totalKills: 0
            });
        });

        // KillFeed aggregation
        data.killFeed.forEach(k => {
            if (!k.PLAYER) return;
            const killer = normalize(k.PLAYER);
            if (!playerStats.has(killer)) return;

            const safeNum = extractSafeNumber(k.SAFE);
            const stats = playerStats.get(killer)!;

            // Map identification
            let mapGroup = 'BER';
            if (k.MAPA) {
                mapGroup = getMapGroup(k.MAPA);
            } else {
                const matchP = data.players.find(p => p.Q === k.Q && (k.RD ? p.RD === k.RD : true));
                if (matchP && matchP.MAPA) {
                    mapGroup = getMapGroup(matchP.MAPA);
                }
            }

            if (!isSinglePlayer && mapFilter !== 'ALL' && mapGroup !== mapFilter) return;

            if (stats.killsBySafe[safeNum] !== undefined) {
                stats.killsBySafe[safeNum]++;
            } else {
                stats.killsBySafe[7] = (stats.killsBySafe[7] || 0) + 1;
            }

            stats.killsByMap[mapGroup] = (stats.killsByMap[mapGroup] || 0) + 1;
            stats.totalKills++;
        });

        const rawResults = Array.from(playerStats.values()).map(stats => {
            const matches = playerMatches.get(stats.name) || [];

            let totalTimeBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
            let totalTimeByMap: Record<string, number> = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };
            let matchesByMap: Record<string, number> = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };

            matches.forEach(m => {
                const durs = SAFE_DURATIONS_SEC[m.mapGroup];
                let mapTime = 0;
                if (durs) {
                    [1, 2, 3, 4, 5, 6, 7, 8].forEach(s => {
                        const val = durs[s] !== undefined ? durs[s] : 120;
                        totalTimeBySafe[s] += val;
                        mapTime += val;
                    });
                }
                totalTimeByMap[m.mapGroup] = (totalTimeByMap[m.mapGroup] || 0) + mapTime;
                matchesByMap[m.mapGroup] = (matchesByMap[m.mapGroup] || 0) + 1;
            });

            const kpmBySafe: Record<number, number> = {};
            let totalMatchTimeSec = 0;

            [1, 2, 3, 4, 5, 6, 7].forEach(s => {
                const durationMins = totalTimeBySafe[s] / 60;
                kpmBySafe[s] = durationMins > 0 ? stats.killsBySafe[s] / durationMins : 0;
                totalMatchTimeSec += totalTimeBySafe[s];
            });
            totalMatchTimeSec += totalTimeBySafe[8];

            const s7_8_kills = stats.killsBySafe[7] + stats.killsBySafe[8];
            const s7_8_timeMins = (totalTimeBySafe[7] + totalTimeBySafe[8]) / 60;
            const s7_8_kpm = s7_8_timeMins > 0 ? s7_8_kills / s7_8_timeMins : 0;

            // Map KPM
            const kpmByMap: Record<string, number> = {};
            ['BER', 'PUR', 'KAL', 'NT', 'SOL'].forEach(m => {
                const mMins = totalTimeByMap[m] / 60;
                kpmByMap[m] = mMins > 0 ? stats.killsByMap[m] / mMins : 0;
            });

            const globalKpm = (totalMatchTimeSec / 60) > 0 ? stats.totalKills / (totalMatchTimeSec / 60) : 0;

            // Aggregated phases
            const earlyTime = (totalTimeBySafe[1] + totalTimeBySafe[2]) / 60;
            const midTime = (totalTimeBySafe[3] + totalTimeBySafe[4]) / 60;
            const lateTime = (totalTimeBySafe[5] + totalTimeBySafe[6] + totalTimeBySafe[7] + totalTimeBySafe[8]) / 60;

            const earlyKills = stats.killsBySafe[1] + stats.killsBySafe[2];
            const midKills = stats.killsBySafe[3] + stats.killsBySafe[4];
            const lateKills = stats.killsBySafe[5] + stats.killsBySafe[6] + s7_8_kills;

            return {
                ...stats,
                matchesPlayed: matches.length,
                totalTimeBySafe,
                totalTimeByMap,
                matchesByMap,
                totalMatchTimeSec,
                s7_8_kills,
                s7_8_kpm,
                kpmBySafe,
                kpmByMap,
                globalKpm,
                earlyKpm: earlyTime > 0 ? earlyKills / earlyTime : 0,
                midKpm: midTime > 0 ? midKills / midTime : 0,
                lateKpm: lateTime > 0 ? lateKills / lateTime : 0,
                earlyKills,
                midKills,
                lateKills,
            };
        }).filter(r => r.matchesPlayed > 0);

        // Filter by role if applied
        const results = rawResults.filter(r => {
            if (isSinglePlayer) return true;
            if (roleFilter === 'ALL') return true;
            return normalize(r.role) === normalize(roleFilter) || normalize(r.role2) === normalize(roleFilter);
        });

        results.sort((a, b) => {
            let diff = 0;
            if (sortBy === 'global_kpm') diff = b.globalKpm - a.globalKpm;
            else if (sortBy === 'total_kills') diff = b.totalKills - a.totalKills;
            else if (sortBy === 'matches') diff = b.matchesPlayed - a.matchesPlayed;
            else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
            else if (sortBy === 's1_kpm') diff = b.kpmBySafe[1] - a.kpmBySafe[1];
            else if (sortBy === 's2_kpm') diff = b.kpmBySafe[2] - a.kpmBySafe[2];
            else if (sortBy === 's3_kpm') diff = b.kpmBySafe[3] - a.kpmBySafe[3];
            else if (sortBy === 's4_kpm') diff = b.kpmBySafe[4] - a.kpmBySafe[4];
            else if (sortBy === 's5_kpm') diff = b.kpmBySafe[5] - a.kpmBySafe[5];
            else if (sortBy === 's6_kpm') diff = b.kpmBySafe[6] - a.kpmBySafe[6];
            else if (sortBy === 's7_kpm') diff = b.s7_8_kpm - a.s7_8_kpm;
            else if (sortBy === 'early_kpm') diff = b.earlyKpm - a.earlyKpm;
            else if (sortBy === 'mid_kpm') diff = b.midKpm - a.midKpm;
            else if (sortBy === 'late_kpm') diff = b.lateKpm - a.lateKpm;
            else if (sortBy === 'ber_kpm') diff = (b.kpmByMap['BER'] || 0) - (a.kpmByMap['BER'] || 0);
            else if (sortBy === 'pur_kpm') diff = (b.kpmByMap['PUR'] || 0) - (a.kpmByMap['PUR'] || 0);
            else if (sortBy === 'kal_kpm') diff = (b.kpmByMap['KAL'] || 0) - (a.kpmByMap['KAL'] || 0);
            else if (sortBy === 'nt_kpm') diff = (b.kpmByMap['NT'] || 0) - (a.kpmByMap['NT'] || 0);
            else if (sortBy === 'sol_kpm') diff = (b.kpmByMap['SOL'] || 0) - (a.kpmByMap['SOL'] || 0);
            else diff = b.globalKpm - a.globalKpm;

            return sortDirection === 'desc' ? diff : -diff;
        });

        // Global Averages
        let sumGlobalKpm = 0;
        let sumSafeKpm = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        let sumMapKpm = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };
        let mapCounts = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };

        results.forEach(r => {
            sumGlobalKpm += r.globalKpm;
            [1, 2, 3, 4, 5, 6].forEach(s => sumSafeKpm[s as keyof typeof sumSafeKpm] += r.kpmBySafe[s]);
            sumSafeKpm[7] += r.s7_8_kpm;

            ['BER', 'PUR', 'KAL', 'NT', 'SOL'].forEach(m => {
                if (r.kpmByMap[m] > 0 || r.matchesPlayed > 0) {
                    sumMapKpm[m as keyof typeof sumMapKpm] += r.kpmByMap[m];
                    mapCounts[m as keyof typeof mapCounts]++;
                }
            });
        });

        const numPlayers = results.length || 1;
        const avgGlobalKpm = sumGlobalKpm / numPlayers;
        const avgSafeKpm: Record<number, number> = {};
        [1, 2, 3, 4, 5, 6, 7].forEach(s => avgSafeKpm[s] = sumSafeKpm[s as keyof typeof sumSafeKpm] / numPlayers);

        const avgMapKpm: Record<string, number> = {};
        ['BER', 'PUR', 'KAL', 'NT', 'SOL'].forEach(m => {
            avgMapKpm[m] = mapCounts[m as keyof typeof mapCounts] > 0 ? sumMapKpm[m as keyof typeof sumMapKpm] / mapCounts[m as keyof typeof mapCounts] : 0;
        });

        return {
            results,
            averages: { avgGlobalKpm, avgSafeKpm, avgMapKpm }
        };
    }, [data.players, data.killFeed, data.playersDimension, data.teamsReference, sortBy, sortDirection, mapFilter, roleFilter, isSinglePlayer]);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return analysisData.results;
        const q = searchQuery.toLowerCase();
        return analysisData.results.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.team.toLowerCase().includes(q) ||
            p.role.toLowerCase().includes(q)
        );
    }, [analysisData.results, searchQuery]);

    const topGlobal = [...analysisData.results].sort((a, b) => b.globalKpm - a.globalKpm)[0];
    const topEarly = [...analysisData.results].sort((a, b) => b.earlyKpm - a.earlyKpm)[0];
    const topMid = [...analysisData.results].sort((a, b) => b.midKpm - a.midKpm)[0];
    const topLate = [...analysisData.results].sort((a, b) => b.lateKpm - a.lateKpm)[0];

    const currentFocusedPlayerName = normalize(selectedPlayer || activePlayer || analysisData.results[0]?.name || '');
    const focusedPlayerData = analysisData.results.find(p => normalize(p.name) === currentFocusedPlayerName) || analysisData.results[0];

    // Safe Progression Chart Data
    const progressionData = [1, 2, 3, 4, 5, 6, 7].map(s => {
        const obj: any = {
            name: s === 7 ? 'S7+' : `S${s}`,
            "Média Geral": parseFloat((analysisData.averages.avgSafeKpm[s] || 0).toFixed(3))
        };
        if (focusedPlayerData) {
            obj[focusedPlayerData.name] = parseFloat(((s === 7 ? focusedPlayerData.s7_8_kpm : focusedPlayerData.kpmBySafe[s]) || 0).toFixed(3));
        }
        return obj;
    });

    // Map Compare Chart Data
    const mapKeys = ['BER', 'PUR', 'KAL', 'NT', 'SOL'];
    const mapCompareData = mapKeys.map(m => {
        const obj: any = {
            name: MAP_NAMES[m] || m,
            "Média Geral": parseFloat((analysisData.averages.avgMapKpm[m] || 0).toFixed(3))
        };
        if (focusedPlayerData) {
            obj[focusedPlayerData.name] = parseFloat(((focusedPlayerData.kpmByMap[m] || 0)).toFixed(3));
        }
        return obj;
    });

    // =========================================================================
    // CASO 1: VISUALIZAÇÃO EXCLUSIVA DE UM ÚNICO JOGADOR (DENTRO DO PERFIL)
    // =========================================================================
    if (isSinglePlayer && focusedPlayerData) {
        const safeRows = [1, 2, 3, 4, 5, 6, 7].map(s => {
            const isS7 = s === 7;
            const kills = isS7 ? focusedPlayerData.s7_8_kills : (focusedPlayerData.killsBySafe[s] || 0);
            const totalSec = isS7 
                ? ((focusedPlayerData.totalTimeBySafe[7] || 0) + (focusedPlayerData.totalTimeBySafe[8] || 0))
                : (focusedPlayerData.totalTimeBySafe[s] || 0);
            const totalMins = totalSec / 60;
            const playerKpm = isS7 ? focusedPlayerData.s7_8_kpm : (focusedPlayerData.kpmBySafe[s] || 0);
            const avgKpm = analysisData.averages.avgSafeKpm[s] || 0;
            const diffPct = avgKpm > 0 ? ((playerKpm - avgKpm) / avgKpm) * 100 : 0;
            const pctOfPlayerKills = focusedPlayerData.totalKills > 0 
                ? ((kills / focusedPlayerData.totalKills) * 100)
                : 0;

            let phaseLabel = 'Early Game';
            let phaseColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            if (s === 3 || s === 4) {
                phaseLabel = 'Mid Game';
                phaseColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            } else if (s >= 5) {
                phaseLabel = 'Late Game';
                phaseColor = 'text-red-400 bg-red-500/10 border-red-500/20';
            }

            return {
                safeNum: s,
                name: isS7 ? 'Safe 7+' : `Safe ${s}`,
                phaseLabel,
                phaseColor,
                kills,
                totalMins,
                playerKpm,
                avgKpm,
                diffPct,
                pctOfPlayerKills
            };
        });

        const mapRows = ['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => {
            const mapName = MAP_NAMES[m] || m;
            const matches = focusedPlayerData.matchesByMap[m] || 0;
            const kills = focusedPlayerData.killsByMap[m] || 0;
            const timeSec = focusedPlayerData.totalTimeByMap[m] || 0;
            const totalMins = timeSec / 60;
            const playerKpm = focusedPlayerData.kpmByMap[m] || 0;
            const avgKpm = analysisData.averages.avgMapKpm[m] || 0;
            const diffPct = avgKpm > 0 ? ((playerKpm - avgKpm) / avgKpm) * 100 : 0;
            const avgKillsPerMatch = matches > 0 ? (kills / matches).toFixed(2) : '0.00';
            const pctOfPlayerKills = focusedPlayerData.totalKills > 0 ? ((kills / focusedPlayerData.totalKills) * 100) : 0;

            return {
                mapCode: m,
                mapName,
                matches,
                kills,
                totalMins,
                playerKpm,
                avgKpm,
                diffPct,
                avgKillsPerMatch,
                pctOfPlayerKills
            };
        });

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. Header do Jogador com Cards de KPM por Fase */}
                <div className="bg-[#141414] p-6 rounded-3xl border border-yellow-500/20 shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
                                <Target size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                                    Métricas de KPM (Abates por Minuto) do Jogador
                                </h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    Taxa de letalidade real de <span className="text-yellow-400 font-black">{focusedPlayerData.name}</span> calculada com base no tempo oficial de cada safe e mapa
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setShowSafeExplanation(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                    showSafeExplanation
                                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-md shadow-yellow-500/10'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <BookOpen size={14} />
                                <span>{showSafeExplanation ? 'Ocultar Guia & Explicação' : 'Como Interpretar (Guia)'}</span>
                            </button>

                            <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono font-black text-yellow-400">
                                {focusedPlayerData.matchesPlayed} Quedas • {focusedPlayerData.totalKills} Kills Totais
                            </span>
                        </div>
                    </div>

                    {/* 4 Cards de Métricas do Jogador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {/* KPM Geral */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-yellow-500/30 shadow-lg hover:border-yellow-500/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Trophy size={14} /> KPM Geral
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">Total</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-yellow-400 font-mono italic">
                                    {focusedPlayerData.globalKpm.toFixed(3)}
                                </span>
                                <span className="text-xs text-gray-400 font-bold">abates/min</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold">
                                {focusedPlayerData.totalKills} abates em {(focusedPlayerData.totalMatchTimeSec / 60).toFixed(0)} min jogados
                            </p>
                        </div>

                        {/* KPM Early Game */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/30 shadow-lg hover:border-blue-500/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock size={14} /> Early Game (S1 - S2)
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 text-[9px] font-bold border border-blue-500/20">
                                    {focusedPlayerData.totalKills > 0 ? ((focusedPlayerData.earlyKills / focusedPlayerData.totalKills) * 100).toFixed(0) : 0}% Kills
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-blue-400 font-mono italic">
                                    {focusedPlayerData.earlyKpm.toFixed(3)}
                                </span>
                                <span className="text-xs text-gray-400 font-bold">abates/min</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold">
                                {focusedPlayerData.earlyKills} abates nas safes 1 e 2
                            </p>
                        </div>

                        {/* KPM Mid Game */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-orange-500/30 shadow-lg hover:border-orange-500/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Crosshair size={14} /> Mid Game (S3 - S4)
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 text-[9px] font-bold border border-orange-500/20">
                                    {focusedPlayerData.totalKills > 0 ? ((focusedPlayerData.midKills / focusedPlayerData.totalKills) * 100).toFixed(0) : 0}% Kills
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-orange-400 font-mono italic">
                                    {focusedPlayerData.midKpm.toFixed(3)}
                                </span>
                                <span className="text-xs text-gray-400 font-bold">abates/min</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold">
                                {focusedPlayerData.midKills} abates nas safes 3 e 4
                            </p>
                        </div>

                        {/* KPM Late Game */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-red-500/30 shadow-lg hover:border-red-500/50 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Flame size={14} /> Late Game (S5 - S7+)
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 text-[9px] font-bold border border-red-500/20">
                                    {focusedPlayerData.totalKills > 0 ? ((focusedPlayerData.lateKills / focusedPlayerData.totalKills) * 100).toFixed(0) : 0}% Kills
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-red-400 font-mono italic">
                                    {focusedPlayerData.lateKpm.toFixed(3)}
                                </span>
                                <span className="text-xs text-gray-400 font-bold">abates/min</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 font-bold">
                                {focusedPlayerData.lateKills} abates no fechamento final
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Seção de Explicação & Guia Didático (Com Botão de Mostrar/Ocultar) */}
                {showSafeExplanation && (
                    <div className="bg-gradient-to-br from-[#18181b] to-[#121214] p-6 rounded-3xl border border-yellow-500/30 shadow-2xl space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
                                    <Lightbulb size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        Guia de Leitura & Interpretação das Métricas de KPM
                                    </h4>
                                    <p className="text-[11px] text-gray-400">
                                        Entenda como funcionam os cálculos, fases de jogo e o significado de cada coluna das tabelas abaixo
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSafeExplanation(false)}
                                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                title="Ocultar Guia"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Bloco 1: O que é KPM & Fórmula */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2">
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap size={13} /> O que é KPM?
                                </span>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    <strong>KPM (Kills Per Minute)</strong> mede a <span className="text-white font-bold">taxa de letalidade real por minuto</span> do jogador. Ao invés de olhar apenas o total bruto de abates, o KPM revela a eficiência do atleta pelo tempo efetivo em que esteve vivo naquela zona ou mapa.
                                </p>
                            </div>

                            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2">
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Activity size={13} /> Fórmula de Cálculo
                                </span>
                                <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
                                    <span className="font-mono text-xs font-black text-yellow-300">
                                        KPM = Abates ÷ Tempo Total (Minutos)
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 text-center">
                                    Ex: 39 abates em 89.6 min = <strong className="text-yellow-400">0.435 KPM</strong> (quase 1 abate a cada 2 min).
                                </p>
                            </div>

                            <div className="bg-black/50 p-4 rounded-2xl border border-white/5 space-y-2">
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Trophy size={13} /> Comparativo com o Torneio
                                </span>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    A <strong>Média Geral Camp</strong> e a <strong>Variação (%)</strong> servem como termômetro competitivo: valores com <span className="text-emerald-400 font-bold">+100% ou mais</span> indicam dominância de nível elite naquela fase da partida.
                                </p>
                            </div>
                        </div>

                        {/* Bloco 2: Dicionário das Colunas da Tabela */}
                        <div className="space-y-3 pt-2">
                            <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                                <BookOpen size={14} className="text-yellow-500" /> Significado das Colunas da Tabela de Safe:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="font-bold text-white block mb-1">1. Safe & Fase:</span>
                                    <span className="text-gray-400 text-[11px] leading-relaxed">
                                        Divide a partida em <strong>Early Game</strong> (S1-S2: drop/loot), <strong>Mid Game</strong> (S3-S4: rotações) e <strong>Late Game</strong> (S5-S7+: confronto final).
                                    </span>
                                </div>

                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="font-bold text-white block mb-1">2. Tempo Total (Min):</span>
                                    <span className="text-gray-400 text-[11px] leading-relaxed">
                                        Soma exata de todos os minutos oficiais que o jogador disputou dentro daquela safe somando todas as quedas do campeonato.
                                    </span>
                                </div>

                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="font-bold text-white block mb-1">3. Abates & KPM:</span>
                                    <span className="text-gray-400 text-[11px] leading-relaxed">
                                        Número de kills confirmadas exclusivamente no período daquela safe e a velocidade média de abates por minuto resultante.
                                    </span>
                                </div>

                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <span className="font-bold text-white block mb-1">4. Variação & % Kills:</span>
                                    <span className="text-gray-400 text-[11px] leading-relaxed">
                                        O quanto o atleta supera a média dos outros concorrentes (+%) e qual fatia de todos os seus abates aconteceu nessa fase.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Gráficos Comparativos do Jogador vs Média do Campeonato (com Toggle) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BarChart2 size={14} className="text-yellow-500" /> Gráficos de Desempenho Visual
                        </span>
                        <button
                            onClick={() => setShowCharts(prev => !prev)}
                            className="text-xs text-yellow-500/90 hover:text-yellow-400 font-bold flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            {showCharts ? <EyeOff size={13} /> : <Eye size={13} />}
                            <span>{showCharts ? 'Ocultar Gráficos' : 'Exibir Gráficos'}</span>
                        </button>
                    </div>

                    {showCharts && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                            {/* Gráfico 1: Curva de KPM por Safe */}
                            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={15} className="text-yellow-500" /> Curva de KPM por Safe (S1 a S7+)
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">Vs Média do Camp</span>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={progressionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                            <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                                            <YAxis stroke="#666" fontSize={11} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#101012', borderColor: '#333', borderRadius: '12px', fontSize: '11px' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Line type="monotone" dataKey="Média Geral" stroke="#6B7280" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                                            <Line type="monotone" dataKey={focusedPlayerData.name} stroke="#EAB308" strokeWidth={3} dot={{ r: 5, fill: '#EAB308' }} activeDot={{ r: 7 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Gráfico 2: KPM por Mapa */}
                            <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                    <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <MapIcon size={15} className="text-yellow-500" /> KPM por Mapa
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">Vs Média do Camp</span>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={mapCompareData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                            <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                                            <YAxis stroke="#666" fontSize={11} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#101012', borderColor: '#333', borderRadius: '12px', fontSize: '11px' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Bar dataKey="Média Geral" fill="#4B5563" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey={focusedPlayerData.name} fill="#EAB308" radius={[4, 4, 0, 0]}>
                                                {mapCompareData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#F97316', '#EAB308', '#A855F7', '#EF4444'][index % 5]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Tabela 1: Detalhamento Exclusivo de KPM por Safe (com Botões de Toggle de Seção) */}
                <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-yellow-500" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                                Detalhamento de KPM por Safe de {focusedPlayerData.name}
                            </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSafeTable(prev => !prev)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-300 transition-colors border border-white/5"
                            >
                                {showSafeTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                <span>{showSafeTable ? 'Recolher Tabela' : 'Expandir Tabela'}</span>
                            </button>
                        </div>
                    </div>

                    {showSafeTable && (
                        <div className="overflow-x-auto custom-scrollbar animate-in fade-in duration-200">
                            <table className="w-full text-left whitespace-nowrap border-collapse">
                                <thead>
                                    <tr className="bg-black/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                                        <th className="px-5 py-3.5" title="Zona segura da partida (Safe 1 até Safe 7+)">Safe</th>
                                        <th className="px-4 py-3.5 text-center" title="Estágio tático da queda (Early, Mid ou Late Game)">Fase</th>
                                        <th className="px-4 py-3.5 text-center" title="Total de minutos disputados nesta safe somando todas as partidas">Tempo Total (Min)</th>
                                        <th className="px-4 py-3.5 text-center text-red-400" title="Quantidade total de abates confirmados exclusivamente dentro desta safe">Abates no Período</th>
                                        <th className="px-5 py-3.5 text-center text-yellow-400 bg-yellow-500/10 border-x border-yellow-500/20" title="Kills Per Minute: Taxa de abates por minuto do jogador (Abates ÷ Minutos)">
                                            KPM do Jogador
                                        </th>
                                        <th className="px-4 py-3.5 text-center text-gray-400" title="Média de KPM de todos os jogadores do torneio nesta mesma safe">Média Geral Camp</th>
                                        <th className="px-4 py-3.5 text-center" title="Variação percentual do atleta em relação à média geral do campeonato">Variação vs Média</th>
                                        <th className="px-5 py-3.5 text-right" title="Percentual dos abates totais do jogador que saíram nesta safe">% dos Abates</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono text-xs">
                                    {safeRows.map(row => {
                                        const isPositive = row.diffPct >= 0;
                                        return (
                                            <tr key={row.safeNum} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3.5 font-sans font-black text-white flex items-center gap-2">
                                                    <Target size={14} className="text-yellow-500" />
                                                    {row.name}
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-sans">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${row.phaseColor}`}>
                                                        {row.phaseLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-gray-300 font-bold">
                                                    {row.totalMins.toFixed(1)}m
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-red-400 font-black">
                                                    {row.kills}
                                                </td>
                                                <td className="px-5 py-3.5 text-center text-yellow-400 font-black bg-yellow-500/5 border-x border-yellow-500/10 text-sm">
                                                    {row.playerKpm.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-gray-400">
                                                    {row.avgKpm.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`font-black text-[11px] ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {isPositive ? '+' : ''}{row.diffPct.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-white font-bold">{row.pctOfPlayerKills.toFixed(1)}%</span>
                                                        <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className="h-full bg-yellow-500 rounded-full" 
                                                                style={{ width: `${Math.min(100, row.pctOfPlayerKills)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 5. Tabela 2: Detalhamento Exclusivo de KPM por Mapa (com Botões de Toggle de Seção) */}
                <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
                        <div className="flex items-center gap-2">
                            <MapIcon size={16} className="text-yellow-500" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">
                                Detalhamento de KPM por Mapa de {focusedPlayerData.name}
                            </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowMapTable(prev => !prev)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-gray-300 transition-colors border border-white/5"
                            >
                                {showMapTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                <span>{showMapTable ? 'Recolher Tabela' : 'Expandir Tabela'}</span>
                            </button>
                        </div>
                    </div>

                    {showMapTable && (
                        <div className="overflow-x-auto custom-scrollbar animate-in fade-in duration-200">
                            <table className="w-full text-left whitespace-nowrap border-collapse">
                                <thead>
                                    <tr className="bg-black/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                                        <th className="px-5 py-3.5" title="Mapa oficial do torneio">Mapa</th>
                                        <th className="px-4 py-3.5 text-center" title="Total de quedas jogadas neste mapa">Quedas</th>
                                        <th className="px-4 py-3.5 text-center" title="Tempo total jogado neste mapa em minutos">Tempo Total (Min)</th>
                                        <th className="px-4 py-3.5 text-center text-red-400" title="Total de abates conquistados neste mapa">Abates no Mapa</th>
                                        <th className="px-4 py-3.5 text-center" title="Média de abates por partida disputada">Média Abates/Queda</th>
                                        <th className="px-5 py-3.5 text-center text-yellow-400 bg-yellow-500/10 border-x border-yellow-500/20" title="Kills Per Minute: Abates por minuto de jogo no mapa">
                                            KPM do Jogador
                                        </th>
                                        <th className="px-4 py-3.5 text-center text-gray-400" title="Média de KPM de todos os atletas do torneio neste mapa">Média Geral Camp</th>
                                        <th className="px-5 py-3.5 text-right" title="Percentual dos abates totais do jogador que saíram neste mapa">% dos Abates</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono text-xs">
                                    {mapRows.map(row => {
                                        return (
                                            <tr key={row.mapCode} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3.5 font-sans font-black text-white flex items-center gap-2">
                                                    <div 
                                                        className="w-2.5 h-2.5 rounded-full" 
                                                        style={{ backgroundColor: MAP_COLORS[row.mapCode] || '#EAB308' }} 
                                                    />
                                                    {row.mapName}
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-gray-300 font-bold">
                                                    {row.matches}
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-gray-400">
                                                    {row.totalMins.toFixed(1)}m
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-red-400 font-black">
                                                    {row.kills}
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-white font-bold">
                                                    {row.avgKillsPerMatch}
                                                </td>
                                                <td className="px-5 py-3.5 text-center text-yellow-400 font-black bg-yellow-500/5 border-x border-yellow-500/10 text-sm">
                                                    {row.playerKpm.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-gray-400">
                                                    {row.avgKpm.toFixed(3)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-white font-bold">{row.pctOfPlayerKills.toFixed(1)}%</span>
                                                        <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className="h-full bg-yellow-500 rounded-full" 
                                                                style={{ width: `${Math.min(100, row.pctOfPlayerKills)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // =========================================================================
    // CASO 2: VISUALIZAÇÃO GLOBAL (RANKING GERAL / TODAS AS ABAS GERAIS)
    // =========================================================================
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Control Bar & Filters */}
            {!hideTopControls && (
                <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-2xl space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20">
                                <Flame size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                                    Ranking de KPM por Safe & Mapa
                                    <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                        Kills / Minuto
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    Taxa de letalidade real de cada jogador baseada no tempo oficial de cada safe e mapa
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative min-w-[260px]">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar jogador, equipe ou função..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Toolbars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                        {/* Filtro por Mapa */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <MapIcon size={12} className="text-yellow-500" /> Filtrar por Mapa:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { id: 'ALL', label: 'Todos' },
                                    { id: 'BER', label: 'Bermuda' },
                                    { id: 'PUR', label: 'Purgatório' },
                                    { id: 'KAL', label: 'Kalahari' },
                                    { id: 'NT', label: 'Nova Terra' },
                                    { id: 'SOL', label: 'Solarium' },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMapFilter(m.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            mapFilter === m.id
                                                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filtro por Função */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={12} className="text-yellow-500" /> Filtrar por Função:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    onClick={() => setRoleFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                        roleFilter === 'ALL'
                                            ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                                            : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                                    }`}
                                >
                                    Todas
                                </button>
                                {availableRoles.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            roleFilter === r
                                                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/20'
                                                : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/5 border border-white/5'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Modo & Filtro de Colunas de Safes */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Filter size={12} className="text-yellow-500" /> Colunas Visíveis:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 mr-2">
                                    <button
                                        onClick={() => setTableMode('safe')}
                                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all ${
                                            tableMode === 'safe' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Safes
                                    </button>
                                    <button
                                        onClick={() => setTableMode('map')}
                                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase transition-all ${
                                            tableMode === 'map' ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        Mapas
                                    </button>
                                </div>
                                {tableMode === 'safe' && [
                                    { id: 'ALL', label: 'Todas S1-S7' },
                                    { id: 'EARLY', label: 'Early (S1-S2)' },
                                    { id: 'MID', label: 'Mid (S3-S4)' },
                                    { id: 'LATE', label: 'Late (S5-S7+)' },
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setSafeColumnFilter(c.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            safeColumnFilter === c.id
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                                : 'bg-black/30 text-gray-500 hover:text-gray-300 border border-white/5'
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Cards: Líderes em Fases da Partida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Líder Geral KPM */}
                <div 
                    onClick={() => topGlobal && setActivePlayer(topGlobal.name)}
                    className="bg-[#141414] p-4 rounded-2xl border border-yellow-500/30 hover:border-yellow-500 cursor-pointer transition-all shadow-xl flex items-center gap-4 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block">Líder Geral KPM</span>
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{topGlobal?.name || 'N/A'}</h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-black text-yellow-400 font-mono italic">{topGlobal?.globalKpm.toFixed(3) || '0.000'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{topGlobal?.totalKills} Kills • {topGlobal?.team}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Líder Early Game */}
                <div 
                    onClick={() => topEarly && setActivePlayer(topEarly.name)}
                    className="bg-[#141414] p-4 rounded-2xl border border-blue-500/30 hover:border-blue-500 cursor-pointer transition-all shadow-xl flex items-center gap-4 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Clock size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block">Líder Early (S1-S2)</span>
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{topEarly?.name || 'N/A'}</h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-black text-blue-400 font-mono italic">{topEarly?.earlyKpm.toFixed(3) || '0.000'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{topEarly?.earlyKills} Kills • {topEarly?.team}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Líder Mid Game */}
                <div 
                    onClick={() => topMid && setActivePlayer(topMid.name)}
                    className="bg-[#141414] p-4 rounded-2xl border border-orange-500/30 hover:border-orange-500 cursor-pointer transition-all shadow-xl flex items-center gap-4 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Crosshair size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block">Líder Mid (S3-S4)</span>
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{topMid?.name || 'N/A'}</h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-black text-orange-400 font-mono italic">{topMid?.midKpm.toFixed(3) || '0.000'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{topMid?.midKills} Kills • {topMid?.team}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Líder Late Game */}
                <div 
                    onClick={() => topLate && setActivePlayer(topLate.name)}
                    className="bg-[#141414] p-4 rounded-2xl border border-red-500/30 hover:border-red-500 cursor-pointer transition-all shadow-xl flex items-center gap-4 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Flame size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Líder Late (S5-S7+)</span>
                        <h4 className="text-sm font-black text-white uppercase italic truncate">{topLate?.name || 'N/A'}</h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-black text-red-400 font-mono italic">{topLate?.lateKpm.toFixed(3) || '0.000'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{topLate?.lateKills} Kills • {topLate?.team}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep-Dive Chart do Jogador Focado */}
            {focusedPlayerData && (
                <div className="bg-gradient-to-br from-[#181818] to-[#101012] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-black/60 border border-yellow-500/40 overflow-hidden flex items-center justify-center shadow-lg">
                                {focusedPlayerData.image ? (
                                    <img src={focusedPlayerData.image} alt={focusedPlayerData.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={24} className="text-gray-500" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-black text-white uppercase italic tracking-wider">{focusedPlayerData.name}</h4>
                                    <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                        {focusedPlayerData.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                    <span className="font-bold text-white">{focusedPlayerData.team}</span>
                                    <span>•</span>
                                    <span>{focusedPlayerData.matchesPlayed} Quedas</span>
                                    <span>•</span>
                                    <span className="text-red-400 font-black">{focusedPlayerData.totalKills} Abates</span>
                                    <span>•</span>
                                    <span className="text-yellow-400 font-mono font-black">KPM {focusedPlayerData.globalKpm.toFixed(3)}</span>
                                </div>
                            </div>
                        </div>

                        {onSelectPlayer && (
                            <button
                                onClick={() => onSelectPlayer(focusedPlayerData.name)}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20"
                            >
                                Ver Perfil Completo
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfico 1: KPM por Safe vs Média Geral */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} className="text-yellow-500" /> Curva de KPM por Safe (S1 a S7+)
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold">Kills por Minuto</span>
                            </div>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#666" fontSize={11} tickLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px', fontSize: '11px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                        <Line type="monotone" dataKey="Média Geral" stroke="#6B7280" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                                        <Line type="monotone" dataKey={focusedPlayerData.name} stroke="#EAB308" strokeWidth={3} dot={{ r: 5, fill: '#EAB308' }} activeDot={{ r: 7 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gráfico 2: KPM por Mapa vs Média Geral */}
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                    <MapIcon size={14} className="text-yellow-500" /> KPM por Mapa
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold">Taxa por Mapa</span>
                            </div>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mapCompareData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                        <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#666" fontSize={11} tickLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '12px', fontSize: '11px' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                        <Bar dataKey="Média Geral" fill="#4B5563" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey={focusedPlayerData.name} fill="#EAB308" radius={[4, 4, 0, 0]}>
                                            {mapCompareData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3B82F6', '#F97316', '#EAB308', '#A855F7', '#EF4444'][index % 5]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ranking Table */}
            <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
                    <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">
                            Tabela Completa de KPM dos Atletas ({filteredPlayers.length} Jogadores)
                        </h4>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                        Clique no cabeçalho de qualquer coluna para reordenar
                    </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap border-collapse">
                        <thead>
                            <tr className="bg-black/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-white/10">
                                <th className="px-4 py-3.5 text-center w-12">#</th>
                                <th 
                                    onClick={() => handleSort('name')}
                                    className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-1.5">
                                        Jogador
                                        {sortBy === 'name' && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                    </div>
                                </th>
                                <th className="px-4 py-3.5">Equipe</th>
                                <th className="px-3 py-3.5 text-center">Função</th>
                                <th 
                                    onClick={() => handleSort('matches')}
                                    className="px-3 py-3.5 text-center cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        PJ
                                        {sortBy === 'matches' && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('total_kills')}
                                    className="px-3 py-3.5 text-center cursor-pointer hover:text-red-400 text-red-400 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Kills
                                        {sortBy === 'total_kills' && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('global_kpm')}
                                    className="px-4 py-3.5 text-center cursor-pointer hover:text-yellow-400 bg-yellow-500/10 text-yellow-400 border-x border-yellow-500/20 transition-colors"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        KPM Global
                                        {sortBy === 'global_kpm' && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                    </div>
                                </th>

                                {tableMode === 'safe' && visibleSafes.map(s => {
                                    const safeSortKey = s === 7 ? 's7_kpm' : `s${s}_kpm`;
                                    const isSorted = sortBy === safeSortKey;
                                    return (
                                        <th
                                            key={`th-safe-${s}`}
                                            onClick={() => handleSort(safeSortKey)}
                                            className={`px-3 py-3.5 text-center cursor-pointer transition-colors ${
                                                isSorted ? 'bg-yellow-500/10 text-yellow-400 font-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                {s === 7 ? 'S7+' : `Safe ${s}`}
                                                {isSorted && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                            </div>
                                        </th>
                                    );
                                })}

                                {tableMode === 'map' && ['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => {
                                    const mapSortKey = `${m.toLowerCase()}_kpm`;
                                    const isSorted = sortBy === mapSortKey;
                                    return (
                                        <th
                                            key={`th-map-${m}`}
                                            onClick={() => handleSort(mapSortKey)}
                                            className={`px-3 py-3.5 text-center cursor-pointer transition-colors ${
                                                isSorted ? 'bg-yellow-500/10 text-yellow-400 font-black' : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                {m}
                                                {isSorted && (sortDirection === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />)}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                            {filteredPlayers.map((player, idx) => {
                                const isFocused = currentFocusedPlayerName === normalize(player.name);
                                return (
                                    <tr
                                        key={player.name}
                                        onClick={() => setActivePlayer(player.name)}
                                        className={`cursor-pointer transition-all ${
                                            isFocused ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : 'hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center text-gray-500 font-bold">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 font-sans">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {player.image ? (
                                                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <span className={`font-black uppercase italic ${isFocused ? 'text-yellow-400' : 'text-white'}`}>
                                                    {player.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-sans text-gray-300">
                                            <div className="flex items-center gap-2">
                                                {player.teamImage && (
                                                    <img src={player.teamImage} alt={player.team} className="w-5 h-5 object-contain" />
                                                )}
                                                <span className="font-bold text-xs uppercase">{player.team}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-sans">
                                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-gray-400">
                                                {player.role}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center font-bold text-gray-400">
                                            {player.matchesPlayed}
                                        </td>
                                        <td className="px-3 py-3 text-center font-black text-red-400">
                                            {player.totalKills}
                                        </td>
                                        <td className="px-4 py-3 text-center font-black text-yellow-400 bg-yellow-500/5 border-x border-yellow-500/10">
                                            {player.globalKpm.toFixed(3)}
                                        </td>

                                        {tableMode === 'safe' && visibleSafes.map(s => {
                                            const kpmVal = s === 7 ? player.s7_8_kpm : player.kpmBySafe[s];
                                            const killsVal = s === 7 ? player.s7_8_kills : player.killsBySafe[s];
                                            return (
                                                <td key={`cell-safe-${s}`} className="px-3 py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-black ${kpmVal > 0 ? 'text-white' : 'text-gray-600'}`}>
                                                            {kpmVal.toFixed(3)}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 font-sans">
                                                            {killsVal}k
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {tableMode === 'map' && ['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => {
                                            const kpmVal = player.kpmByMap[m] || 0;
                                            const killsVal = player.killsByMap[m] || 0;
                                            return (
                                                <td key={`cell-map-${m}`} className="px-3 py-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`font-black ${kpmVal > 0 ? 'text-white' : 'text-gray-600'}`}>
                                                            {kpmVal.toFixed(3)}
                                                        </span>
                                                        <span className="text-[9px] text-gray-500 font-sans">
                                                            {killsVal}k
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
            </div>
        </div>
    );
};

export default PlayerKpmAnalysis;
