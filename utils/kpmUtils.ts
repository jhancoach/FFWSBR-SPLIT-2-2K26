export const SAFE_DURATIONS_SEC: Record<string, Record<number, number>> = {
    BER: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    PUR: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    KAL: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    NT: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
    SOL: { 1: 410, 2: 190, 3: 140, 4: 125, 5: 90, 6: 30, 7: 110, 8: 120 },
};

export const getMapGroup = (mapName: string | undefined): string => {
    if (!mapName) return 'BER';
    const n = mapName.trim().toUpperCase();
    if (n.includes('BER')) return 'BER';
    if (n.includes('PUR')) return 'PUR';
    if (n.includes('KAL')) return 'KAL';
    if (n.includes('NOV') || n.includes('NT')) return 'NT';
    if (n.includes('SOL')) return 'SOL';
    return 'BER';
};

export const calculateMapDurationSec = (mapName: string | undefined): number => {
    const group = getMapGroup(mapName);
    const durs = SAFE_DURATIONS_SEC[group];
    if (!durs) return 120 * 8; // fallback
    let total = 0;
    for (let i = 1; i <= 8; i++) {
        total += durs[i] || 120;
    }
    return total;
};

export const calculateMapKpm = (kills: number, matchesCount: number, mapName: string): number => {
    if (matchesCount === 0) return 0;
    const durationMins = (calculateMapDurationSec(mapName) * matchesCount) / 60;
    return durationMins > 0 ? kills / durationMins : 0;
};

export const calculateOverallKpmFromMapStats = (
    kills: number, 
    mapStats: Map<string, { matches: number }>
): number => {
    let totalSec = 0;
    mapStats.forEach((stats, mapName) => {
        totalSec += calculateMapDurationSec(mapName) * stats.matches;
    });
    const totalMins = totalSec / 60;
    return totalMins > 0 ? kills / totalMins : 0;
};

export const calculateOverallKpm = (kills: number, matches: { mapName: string }[]): number => {
    if (matches.length === 0) return 0;
    let totalSec = 0;
    matches.forEach(m => {
        totalSec += calculateMapDurationSec(m.mapName);
    });
    const totalMins = totalSec / 60;
    return totalMins > 0 ? kills / totalMins : 0;
};
