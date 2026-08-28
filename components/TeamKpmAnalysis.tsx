import React, { useMemo, useState } from 'react';
import { DashboardData } from '../types';
import { Activity, Clock, Crosshair, Filter, Shield, Flame, Target, Map as MapIcon, Trophy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface TeamKpmAnalysisProps {
    data: DashboardData;
    selectedTeam: string | null;
    onSelectTeam: (team: string) => void;
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

const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];
const MAP_COLORS: Record<string, string> = {
    BER: '#3B82F6', // Blue
    PUR: '#F97316', // Orange
    KAL: '#EAB308', // Yellow
    NT:  '#A855F7', // Purple
    SOL: '#EF4444', // Red
};

export const TeamKpmAnalysis: React.FC<TeamKpmAnalysisProps> = ({ data, selectedTeam, onSelectTeam }) => {
    const [sortBy, setSortBy] = useState<string>('global_kpm');
    const [mapFilter, setMapFilter] = useState<string>('ALL');
    const [tableMode, setTableMode] = useState<'safe' | 'map'>('safe');
    const [safeColumnFilter, setSafeColumnFilter] = useState<string>('ALL');

    const visibleSafes = useMemo(() => {
        if (safeColumnFilter === 'EARLY') return [1, 2];
        if (safeColumnFilter === 'MID') return [3, 4];
        if (safeColumnFilter === 'LATE') return [5, 6, 7];
        if (safeColumnFilter.startsWith('S')) return [parseInt(safeColumnFilter.replace('S', ''))];
        return [1, 2, 3, 4, 5, 6, 7];
    }, [safeColumnFilter]);

    const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

    const analysisData = useMemo(() => {
        const teamMatches = new Map<string, Array<{ matchId: string, mapName: string, mapGroup: string }>>();
        
        data.details.forEach(d => {
            if (!d.TIME || !d.MAPA || !d.Q) return;
            const t = normalize(d.TIME);
            if (!teamMatches.has(t)) teamMatches.set(t, []);
            
            const matchId = `${d.Q}-${d.MAPA}-${d.CONFRONTO || ''}`;
            const mapGroup = getMapGroup(d.MAPA);
            
            if (mapFilter !== 'ALL' && mapGroup !== mapFilter) return;

            if (!teamMatches.get(t)!.some(m => m.matchId === matchId)) {
                teamMatches.get(t)!.push({ matchId, mapName: d.MAPA, mapGroup });
            }
        });

        const teamStats = new Map<string, {
            name: string;
            image?: string;
            killsBySafe: Record<number, number>;
            killsByMap: Record<string, number>;
            totalKills: number;
        }>();

        teamMatches.forEach((_, t) => {
            teamStats.set(t, {
                name: t,
                image: (Array.isArray(data.teamsReference) ? data.teamsReference : []).find(tr => normalize(tr.TIME) === t)?.IMG,
                killsBySafe: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
                killsByMap: { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 },
                totalKills: 0
            });
        });

        data.killFeed.forEach(k => {
            if (!k.PLAYER) return;
            
            let team = '';
            const pData = data.players.find(p => normalize(p.PLAYER) === normalize(k.PLAYER));
            if (pData && pData.TIME) {
                team = normalize(pData.TIME);
            } else {
                const dData = data.details.find(d => normalize(d.TIME) === normalize(k.PLAYER)); 
                if (dData) team = normalize(dData.TIME);
            }

            if (!team || !teamStats.has(team)) return;

            const safeNum = extractSafeNumber(k.SAFE);
            const stats = teamStats.get(team)!;
            
            if (stats.killsBySafe[safeNum] !== undefined) {
                stats.killsBySafe[safeNum]++;
            } else {
                stats.killsBySafe[7] = (stats.killsBySafe[7] || 0) + 1;
            }

            // Find map using the match Q from killfeed
            let mapGroup = 'BER';
            if (k.MAPA) {
                mapGroup = getMapGroup(k.MAPA);
            } else {
                // fallback to finding the map from team matches based on Q
                // Note: we need to find the map from original details if it was filtered out
                const dDataMatch = data.details.find(d => d.Q === k.Q);
                if (dDataMatch) mapGroup = getMapGroup(dDataMatch.MAPA);
            }
            
            if (mapFilter !== 'ALL' && mapGroup !== mapFilter) return;
            stats.killsByMap[mapGroup] = (stats.killsByMap[mapGroup] || 0) + 1;
            stats.totalKills++;
        });

        const results = Array.from(teamStats.values()).map(stats => {
            const matches = teamMatches.get(stats.name) || [];
            
            let totalTimeBySafe: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
            let totalTimeByMap: Record<string, number> = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };
            
            matches.forEach(m => {
                const durs = SAFE_DURATIONS_SEC[m.mapGroup];
                let mapTime = 0;
                if (durs) {
                    [1,2,3,4,5,6,7,8].forEach(s => {
                        const val = durs[s] !== undefined ? durs[s] : 120;
                        totalTimeBySafe[s] += val;
                        mapTime += val;
                    });
                }
                totalTimeByMap[m.mapGroup] += mapTime;
            });

            const kpmBySafe: Record<number, number> = {};
            let totalMatchTimeSec = 0;

            [1,2,3,4,5,6,7].forEach(s => {
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
                s7_8_kills,
                s7_8_kpm,
                kpmBySafe,
                kpmByMap,
                globalKpm,
                earlyKpm: earlyTime > 0 ? earlyKills / earlyTime : 0,
                midKpm: midTime > 0 ? midKills / midTime : 0,
                lateKpm: lateTime > 0 ? lateKills / lateTime : 0,
            };
        }).filter(r => r.matchesPlayed > 0);

        results.sort((a, b) => {
            if (sortBy === 'global_kpm') return b.globalKpm - a.globalKpm;
            if (sortBy === 'total_kills') return b.totalKills - a.totalKills;
            if (sortBy === 's1_kpm') return b.kpmBySafe[1] - a.kpmBySafe[1];
            if (sortBy === 's2_kpm') return b.kpmBySafe[2] - a.kpmBySafe[2];
            if (sortBy === 's3_kpm') return b.kpmBySafe[3] - a.kpmBySafe[3];
            if (sortBy === 's4_kpm') return b.kpmBySafe[4] - a.kpmBySafe[4];
            if (sortBy === 's5_kpm') return b.kpmBySafe[5] - a.kpmBySafe[5];
            if (sortBy === 's6_kpm') return b.kpmBySafe[6] - a.kpmBySafe[6];
            if (sortBy === 's7_kpm') return b.s7_8_kpm - a.s7_8_kpm;
            if (sortBy === 'ber_kpm') return (b.kpmByMap['BER']||0) - (a.kpmByMap['BER']||0);
            if (sortBy === 'pur_kpm') return (b.kpmByMap['PUR']||0) - (a.kpmByMap['PUR']||0);
            if (sortBy === 'kal_kpm') return (b.kpmByMap['KAL']||0) - (a.kpmByMap['KAL']||0);
            if (sortBy === 'nt_kpm') return (b.kpmByMap['NT']||0) - (a.kpmByMap['NT']||0);
            if (sortBy === 'sol_kpm') return (b.kpmByMap['SOL']||0) - (a.kpmByMap['SOL']||0);
            return b.globalKpm - a.globalKpm;
        });

        // Global Averages Calculation
        let sumGlobalKpm = 0;
        let sumSafeKpm = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        let sumMapKpm = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };
        let mapCounts = { BER: 0, PUR: 0, KAL: 0, NT: 0, SOL: 0 };
        
        results.forEach(r => {
            sumGlobalKpm += r.globalKpm;
            [1,2,3,4,5,6].forEach(s => sumSafeKpm[s as keyof typeof sumSafeKpm] += r.kpmBySafe[s]);
            sumSafeKpm[7] += r.s7_8_kpm;
            
            ['BER', 'PUR', 'KAL', 'NT', 'SOL'].forEach(m => {
                if (r.kpmByMap[m] > 0 || r.matchesPlayed > 0) { // proxy to check if map was played
                    sumMapKpm[m as keyof typeof sumMapKpm] += r.kpmByMap[m];
                    mapCounts[m as keyof typeof mapCounts]++;
                }
            });
        });

        const numTeams = results.length || 1;
        const avgGlobalKpm = sumGlobalKpm / numTeams;
        const avgSafeKpm: Record<number, number> = {};
        [1,2,3,4,5,6,7].forEach(s => avgSafeKpm[s] = sumSafeKpm[s as keyof typeof sumSafeKpm] / numTeams);
        
        const avgMapKpm: Record<string, number> = {};
        ['BER', 'PUR', 'KAL', 'NT', 'SOL'].forEach(m => avgMapKpm[m] = mapCounts[m as keyof typeof mapCounts] > 0 ? sumMapKpm[m as keyof typeof sumMapKpm] / mapCounts[m as keyof typeof mapCounts] : 0);

        return {
            results,
            averages: { avgGlobalKpm, avgSafeKpm, avgMapKpm }
        };

    }, [data.details, data.killFeed, data.players, data.teamsReference, sortBy, mapFilter]);

    const displayData = selectedTeam ? analysisData.results.filter(d => d.name === normalize(selectedTeam)) : analysisData.results;
    const topGlobal = [...analysisData.results].sort((a,b) => b.globalKpm - a.globalKpm)[0];
    const topEarly = [...analysisData.results].sort((a,b) => b.earlyKpm - a.earlyKpm)[0];
    const topMid = [...analysisData.results].sort((a,b) => b.midKpm - a.midKpm)[0];
    const topLate = [...analysisData.results].sort((a,b) => b.lateKpm - a.lateKpm)[0];

    // Progression Chart Data
    const progressionData = [1, 2, 3, 4, 5, 6, 7].map(s => {
        const obj: any = { 
            name: s === 7 ? 'S7+' : `S${s}`,
            "Média Lobby": parseFloat(analysisData.averages.avgSafeKpm[s].toFixed(2))
        };
        if (selectedTeam) {
            const tData = analysisData.results.find(t => t.name === normalize(selectedTeam));
            if (tData) {
                obj[tData.name] = parseFloat((s === 7 ? tData.s7_8_kpm : tData.kpmBySafe[s]).toFixed(2));
            }
        }
        return obj;
    });

    // Map Compare Chart Data
    const mapKeys = ['BER', 'PUR', 'KAL', 'NT', 'SOL'];
    const mapCompareData = mapKeys.map(m => {
        const obj: any = {
            name: m,
            "Média Lobby": parseFloat(analysisData.averages.avgMapKpm[m].toFixed(2))
        };
        if (selectedTeam) {
            const tData = analysisData.results.find(t => t.name === normalize(selectedTeam));
            if (tData) {
                obj[tData.name] = parseFloat(tData.kpmByMap[m].toFixed(2));
            }
        }
        return obj;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-4 rounded-3xl border border-gray-800 shadow-xl">
                <div className="flex items-center gap-3 text-emerald-500 font-black italic tracking-widest">
                    <Activity size={24} />
                    KPM POR SAFE
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><MapIcon size={14} className="inline mr-1" /> Mapa:</span>
                        <select 
                            value={mapFilter}
                            onChange={(e) => setMapFilter(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                        >
                            <option value="ALL">TODOS OS MAPAS</option>
                            <option value="BER">Bermuda</option>
                            <option value="PUR">Purgatório</option>
                            <option value="KAL">Kalahari</option>
                            <option value="NT">Nova Terra</option>
                            <option value="SOL">Solara</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><Filter size={14} className="inline mr-1" /> Ordenar por:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                        >
                            <option value="global_kpm">KPM Global (Maior)</option>
                            <option value="total_kills">Total Kills (Maior)</option>
                            <optgroup label="Por Fase">
                                <option value="s1_kpm">Safe 1 KPM (Maior)</option>
                                <option value="s2_kpm">Safe 2 KPM (Maior)</option>
                                <option value="s3_kpm">Safe 3 KPM (Maior)</option>
                                <option value="s4_kpm">Safe 4 KPM (Maior)</option>
                                <option value="s5_kpm">Safe 5 KPM (Maior)</option>
                                <option value="s6_kpm">Safe 6 KPM (Maior)</option>
                                <option value="s7_kpm">Safe 7+ KPM (Maior)</option>
                            </optgroup>
                            <optgroup label="Por Mapa">
                                <option value="ber_kpm">Bermuda KPM (Maior)</option>
                                <option value="pur_kpm">Purgatório KPM (Maior)</option>
                                <option value="kal_kpm">Kalahari KPM (Maior)</option>
                                <option value="nt_kpm">Nova Terra KPM (Maior)</option>
                                <option value="sol_kpm">Solara KPM (Maior)</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {/* Highlights Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] rounded-3xl p-5 border border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Activity size={14} className="text-emerald-500" /> KPM GLOBAL
                        </span>
                        <div className="flex-grow flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {topGlobal?.image ? <img src={topGlobal.image} className="w-8 h-8 object-contain drop-shadow-md" alt="" /> : <Shield size={24} className="text-gray-600" />}
                                <span className="font-black italic text-lg text-white">{topGlobal?.name || '-'}</span>
                            </div>
                            <span className="text-2xl font-black text-emerald-400">{topGlobal?.globalKpm.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#1a1a1a] rounded-3xl p-5 border border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Target size={14} className="text-yellow-500" /> EARLY GAME (S1-S2)
                        </span>
                        <div className="flex-grow flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {topEarly?.image ? <img src={topEarly.image} className="w-8 h-8 object-contain drop-shadow-md" alt="" /> : <Shield size={24} className="text-gray-600" />}
                                <span className="font-black italic text-lg text-white">{topEarly?.name || '-'}</span>
                            </div>
                            <span className="text-2xl font-black text-yellow-400">{topEarly?.earlyKpm.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-3xl p-5 border border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Crosshair size={14} className="text-orange-500" /> MID GAME (S3-S4)
                        </span>
                        <div className="flex-grow flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {topMid?.image ? <img src={topMid.image} className="w-8 h-8 object-contain drop-shadow-md" alt="" /> : <Shield size={24} className="text-gray-600" />}
                                <span className="font-black italic text-lg text-white">{topMid?.name || '-'}</span>
                            </div>
                            <span className="text-2xl font-black text-orange-400">{topMid?.midKpm.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-3xl p-5 border border-gray-800 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Flame size={14} className="text-red-500" /> LATE GAME (S5-S7+)
                        </span>
                        <div className="flex-grow flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {topLate?.image ? <img src={topLate.image} className="w-8 h-8 object-contain drop-shadow-md" alt="" /> : <Shield size={24} className="text-gray-600" />}
                                <span className="font-black italic text-lg text-white">{topLate?.name || '-'}</span>
                            </div>
                            <span className="text-2xl font-black text-red-500">{topLate?.lateKpm.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progression Chart */}
                <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-2 mb-6">
                        <Clock size={18} className="text-emerald-500" />
                        Progressão KPM por Fase (Safes)
                    </h3>
                    <div className="flex-grow min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}
                                    itemStyle={{ fontWeight: 900 }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} iconType="circle" />
                                <Line type="monotone" dataKey="Média Lobby" stroke="#666" strokeWidth={3} dot={{ r: 4, fill: '#666', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                {selectedTeam && (
                                    <Line type="monotone" dataKey={normalize(selectedTeam)} stroke="#10B981" strokeWidth={4} dot={{ r: 5, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 7 }} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Comparador Chart */}
                <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 shadow-xl flex flex-col">
                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-2 mb-6">
                        <MapIcon size={18} className="text-emerald-500" />
                        Comparador de KPM por Mapa
                    </h3>
                    <div className="flex-grow min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mapCompareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={0}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="Média Lobby" fill="#444" radius={[4, 4, 0, 0]} />
                                {selectedTeam && (
                                    <Bar dataKey={normalize(selectedTeam)} fill="#10B981" radius={[4, 4, 0, 0]} />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

                    <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-xl overflow-hidden flex flex-col">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <h3 className="text-white font-black text-sm uppercase italic tracking-widest flex items-center gap-2">
                        <Activity size={20} className="text-emerald-500" />
                        TABELA DE KPM DETALHADA
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {tableMode === 'safe' && (
                            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1"><Filter size={12} className="inline mr-1" /> Colunas:</span>
                                <select 
                                    value={safeColumnFilter}
                                    onChange={(e) => setSafeColumnFilter(e.target.value)}
                                    className="bg-black/60 border border-gray-700 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-emerald-500 transition-colors font-bold cursor-pointer"
                                >
                                    <option value="ALL">Todas as Safes</option>
                                    <option value="EARLY">Early Game (S1-S2)</option>
                                    <option value="MID">Mid Game (S3-S4)</option>
                                    <option value="LATE">Late Game (S5-S7+)</option>
                                    <option value="S1">Safe 1</option>
                                    <option value="S2">Safe 2</option>
                                    <option value="S3">Safe 3</option>
                                    <option value="S4">Safe 4</option>
                                    <option value="S5">Safe 5</option>
                                    <option value="S6">Safe 6</option>
                                    <option value="S7">Safe 7+</option>
                                </select>
                            </div>
                        )}
                        <div className="flex items-center bg-black/40 rounded-xl border border-white/5 p-1">
                            <button 
                                onClick={() => setTableMode('safe')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'safe' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR SAFE
                        </button>
                        <button 
                            onClick={() => setTableMode('map')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tableMode === 'map' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}`}
                        >
                            POR MAPA
                        </button>
                    </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto whitespace-nowrap min-w-[1000px]">
                        <thead className="bg-black/80 text-[10px] text-gray-500 uppercase font-black tracking-widest border-b-2 border-gray-800">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">#</th>
                                <th className="px-4 py-3">Equipe</th>
                                <th className="px-4 py-3 text-center border-r border-white/5" title="Partidas Analisadas">Partidas</th>
                                
                                {tableMode === 'safe' ? (
                                    <>
                                        {visibleSafes.map(s => (
                                            <th key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white">SAFE {s === 7 ? '7+' : s}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => (
                                            <th key={m} className="px-4 py-3 text-center border-r border-white/5">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-white" style={{color: MAP_COLORS[m]}}>{m}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </>
                                )}

                                <th className="px-4 py-3 text-center bg-emerald-500/5">
                                    <div className="flex flex-col items-center">
                                        <span className="text-emerald-400">GLOBAL</span>
                                        <span className="text-[8px] text-gray-600">KPM</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40 text-xs font-medium">
                            {displayData.map((team, tIdx) => {
                                const isSelected = selectedTeam && normalize(selectedTeam) === team.name;
                                return (
                                    <tr 
                                        key={team.name} 
                                        className={`transition-colors group ${isSelected ? 'bg-emerald-900/20' : 'hover:bg-white/5 cursor-pointer'}`}
                                        onClick={() => !isSelected && onSelectTeam(team.name)}
                                    >
                                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-[10px]">
                                            {tIdx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 bg-black rounded-lg border p-0.5 flex-shrink-0 flex items-center justify-center shadow-lg transition-colors ${isSelected ? 'border-emerald-500' : 'border-gray-800 group-hover:border-emerald-500/50'}`}>
                                                    {team.image ? (
                                                        <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={14} className="text-gray-600" />
                                                    )}
                                                </div>
                                                <span className={`font-black uppercase italic tracking-wider transition-colors ${isSelected ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}`}>
                                                    {team.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-500 border-r border-white/5">
                                            {team.matchesPlayed}
                                        </td>
                                        
                                        {tableMode === 'safe' ? (
                                            <>
                                                {visibleSafes.map(s => {
                                                    const kills = s === 7 ? team.s7_8_kills : team.killsBySafe[s] || 0;
                                                    const kpm = s === 7 ? team.s7_8_kpm : team.kpmBySafe[s] || 0;
                                                    return (
                                                        <td key={s} className="px-4 py-3 text-center border-r border-white/5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{kills}</span>
                                                                <span className="text-[10px] text-gray-700">|</span>
                                                                <span className={`font-black text-sm w-8 text-left ${kpm > 0.5 ? 'text-amber-400' : kpm > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                                    {kpm.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <>
                                                {['BER', 'PUR', 'KAL', 'NT', 'SOL'].map(m => (
                                                    <td key={m} className="px-4 py-3 text-center border-r border-white/5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="text-[10px] text-gray-500 font-bold w-4 text-right">{team.killsByMap[m] || 0}</span>
                                                            <span className="text-[10px] text-gray-700">|</span>
                                                            <span className={`font-black text-sm w-8 text-left ${team.kpmByMap[m] > 0.5 ? 'text-amber-400' : team.kpmByMap[m] > 0.2 ? 'text-white' : 'text-gray-600'}`}>
                                                                {team.kpmByMap[m].toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                ))}
                                            </>
                                        )}

                                        <td className="px-4 py-3 text-center bg-emerald-500/5">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-[10px] text-emerald-500/60 font-bold w-4 text-right">{team.totalKills}</span>
                                                <span className="text-[10px] text-emerald-500/30">|</span>
                                                <span className="font-black text-sm w-8 text-left text-emerald-400">
                                                    {team.globalKpm.toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayData.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-gray-500 italic font-bold uppercase tracking-widest">
                                        Nenhum dado encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
