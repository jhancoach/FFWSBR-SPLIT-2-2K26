import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MapPin, Plus, Trash2, Edit3, Clock, Search, Filter, Percent, 
    TrendingUp, Swords, Shield, Download, Upload, ZoomIn, ZoomOut, Move,
    X, Check, AlertCircle, RefreshCw, BarChart2, Layers, User, ChevronRight, Info,
    Flame, Target, Trophy, Users
} from 'lucide-react';
import { HeatmapOverlay } from './HeatmapOverlay';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebasePlaceholder } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';

export interface FightRecord {
    id: string;
    mapId: string; // BER, PUR, KAL, NT, SOL
    x: number; // 0-100 %
    y: number; // 0-100 %
    locationName: string;
    timeInMinutes: number; // e.g. 4.25 = 4 min 15 s
    safeNumber?: number; // 1, 2, 3, 4, 5, 6, 7
    teamA?: string;
    teamB?: string;
    winnerTeam?: string;
    notes?: string;
    count?: number;
    createdAt: number;
}

const POPULAR_LOCATIONS: Record<string, string[]> = {
    BER: ['Peak', 'Bimasakti', 'Pochinok', 'Clock Tower', 'Hangar', 'Observatory', 'Mill', 'Plantation', 'Shipyard', 'Katulistiwa', 'Cape Town', 'Graveyard', 'Rim Nam Village'],
    PUR: ['Brasilia', 'Central', 'Forge', 'Moathouse', 'Marbleworks', 'Fields', 'Quarry', 'Fire Brigade', 'Campsite', 'Ski Lodge', 'Lumber Mill', 'Mt. Villa'],
    KAL: ['Refinery', 'Command Post', 'The Sub', 'Bayfront', 'Confinement', 'Mammoth', 'Foundation', 'Santa Catarina', 'Stone Ridge', 'Old Settlement'],
    NT: ['Plaza Pastora', 'Grav Labs', 'Museum', 'Decathlon', 'Zipway', 'Intellect Center', 'Farmtopia', 'Turbine', 'Rust Town'],
    SOL: ['Aurora', 'Solar Center', 'Oasis', 'Prism', 'Horizon', 'Helios', 'Vanguard', 'Eclipse']
};

interface MapItem {
    id: string;
    name: string;
    url: string;
}

interface FightStudiesProps {
    maps: MapItem[];
    selectedMap: MapItem;
    setSelectedMap: (m: MapItem) => void;
    data?: DashboardData;
    isAdmin: boolean;
    setShowAuthModal: (show: boolean) => void;
}

export const formatMinutesToMS = (timeInMinutes: number): string => {
    if (isNaN(timeInMinutes) || timeInMinutes < 0) return '00:00';
    const totalSeconds = Math.round(timeInMinutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const parseMSToMinutes = (input: string): number => {
    if (!input) return 0;
    const clean = input.trim().replace(',', '.');
    if (clean.includes(':')) {
        const parts = clean.split(':');
        const m = parseFloat(parts[0]) || 0;
        const s = parseFloat(parts[1]) || 0;
        return m + (s / 60);
    }
    return parseFloat(clean) || 0;
};

export const FightStudies: React.FC<FightStudiesProps> = ({
    maps,
    selectedMap,
    setSelectedMap,
    data,
    isAdmin,
    setShowAuthModal
}) => {
    const [fights, setFights] = useState<FightRecord[]>([]);
    
    // Zoom & Pan Map State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FightRecord | null>(null);
    const [selectedGroupRecords, setSelectedGroupRecords] = useState<FightRecord[]>([]);
    const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

    // Form State
    const [formLocation, setFormLocation] = useState('');
    const [formTimeStr, setFormTimeStr] = useState('04:00');
    const [formSafeNumber, setFormSafeNumber] = useState<number>(1);
    const [formTeamA, setFormTeamA] = useState('');
    const [formTeamB, setFormTeamB] = useState('');
    const [formWinner, setFormWinner] = useState('');
    const [formNotes, setFormNotes] = useState('');

    // Filter & Search Sidebar State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
    const [selectedSafeFilter, setSelectedSafeFilter] = useState<string>('ALL');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'timeAsc' | 'timeDesc' | 'recent' | 'location' | 'safeAsc'>('timeAsc');

    // Hover / Highlighting State
    const [hoveredRecordId, setHoveredRecordId] = useState<string | null>(null);

    // Heatmap State
    const [heatmapMode, setHeatmapMode] = useState<'both' | 'heatmap' | 'markers'>('both');
    const [heatmapRadius, setHeatmapRadius] = useState<number>(45);

    const containerRef = useRef<HTMLDivElement>(null);

    // Load Data from Firestore or LocalStorage for current map
    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });

        const storageKey = `studies_fights_${selectedMap.id}`;

        if (isFirebasePlaceholder) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    setFights(JSON.parse(saved));
                } else {
                    setFights([]);
                }
            } catch (e) {
                console.error("Error reading local fight studies:", e);
                setFights([]);
            }
            return;
        }

        const docRef = doc(db, 'studies', `fights_${selectedMap.id}`);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const snapData = snapshot.data();
                if (snapData && snapData.fights) {
                    try {
                        const parsed = JSON.parse(snapData.fights);
                        setFights(parsed);
                    } catch (e) {
                        setFights([]);
                    }
                } else {
                    setFights([]);
                }
            } else {
                setFights([]);
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `studies/fights_${selectedMap.id}`);
        });

        return () => unsubscribe();
    }, [selectedMap]);

    // Save Records Helper
    const saveFights = async (newFights: FightRecord[]) => {
        setFights(newFights);
        const storageKey = `studies_fights_${selectedMap.id}`;

        try {
            localStorage.setItem(storageKey, JSON.stringify(newFights));
        } catch (e) {
            console.error("Error writing local fight studies:", e);
        }

        if (!isFirebasePlaceholder) {
            try {
                await setDoc(doc(db, 'studies', `fights_${selectedMap.id}`), {
                    mapId: selectedMap.id,
                    fights: JSON.stringify(newFights),
                    updatedAt: Date.now(),
                    pin: '221120'
                });
            } catch (error) {
                console.error("Error saving fights to Firestore:", error);
            }
        }
    };

    // Filtered & Sorted Fights for Map and List
    const filteredFights = useMemo(() => {
        return fights.filter(r => {
            if (selectedLocationFilter !== 'ALL' && r.locationName !== selectedLocationFilter) return false;
            if (selectedTeamFilter !== 'ALL' && r.teamA !== selectedTeamFilter && r.teamB !== selectedTeamFilter && r.winnerTeam !== selectedTeamFilter) return false;
            if (selectedSafeFilter !== 'ALL' && String(r.safeNumber || 1) !== selectedSafeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLoc = r.locationName.toLowerCase().includes(q);
                const matchTeamA = r.teamA?.toLowerCase().includes(q);
                const matchTeamB = r.teamB?.toLowerCase().includes(q);
                const matchWinner = r.winnerTeam?.toLowerCase().includes(q);
                const matchTime = formatMinutesToMS(r.timeInMinutes).includes(q);
                const matchSafe = `safe ${r.safeNumber || 1}`.includes(q) || `s${r.safeNumber || 1}`.includes(q);
                const matchNotes = r.notes?.toLowerCase().includes(q);
                if (!matchLoc && !matchTeamA && !matchTeamB && !matchWinner && !matchTime && !matchSafe && !matchNotes) return false;
            }
            return true;
        }).sort((a, b) => {
            if (sortBy === 'timeAsc') return a.timeInMinutes - b.timeInMinutes;
            if (sortBy === 'timeDesc') return b.timeInMinutes - a.timeInMinutes;
            if (sortBy === 'safeAsc') return (a.safeNumber || 1) - (b.safeNumber || 1);
            if (sortBy === 'recent') return b.createdAt - a.createdAt;
            if (sortBy === 'location') return a.locationName.localeCompare(b.locationName);
            return 0;
        });
    }, [fights, selectedLocationFilter, selectedTeamFilter, selectedSafeFilter, searchQuery, sortBy]);

    // Group fights for map rendering (Quantity and %) using filtered list so map updates when Safe filter changes
    const groupedFights = useMemo(() => {
        const groups: {
            id: string;
            x: number;
            y: number;
            locationName: string;
            count: number;
            pct: string;
            items: FightRecord[];
        }[] = [];

        const total = filteredFights.length;

        filteredFights.forEach(rec => {
            const existing = groups.find(g => 
                (rec.locationName && g.locationName.toLowerCase().trim() === rec.locationName.toLowerCase().trim()) ||
                (Math.abs(g.x - rec.x) <= 3 && Math.abs(g.y - rec.y) <= 3)
            );

            if (existing) {
                existing.count += 1;
                existing.items.push(rec);
            } else {
                groups.push({
                    id: rec.id,
                    x: rec.x,
                    y: rec.y,
                    locationName: rec.locationName || 'Ponto',
                    count: 1,
                    pct: '0',
                    items: [rec]
                });
            }
        });

        groups.forEach(g => {
            g.pct = total > 0 ? ((g.count / total) * 100).toFixed(1) : '0';
        });

        return groups;
    }, [filteredFights]);

    const heatmapPoints = useMemo(() => {
        return groupedFights.map(g => ({
            x: g.x,
            y: g.y,
            weight: g.count
        }));
    }, [groupedFights]);

    // Map Click Action (Opens modal to specify Safe, Game Time and details)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        if (!isAdmin) { setShowAuthModal(true); return; }

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10;
        const yPercent = Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10;

        const locName = `Ponto ${Math.round(xPercent)},${Math.round(yPercent)}`;

        // Find existing group nearby
        const existingGroup = groupedFights.find(g => 
            Math.abs(g.x - xPercent) <= 4 && Math.abs(g.y - yPercent) <= 4
        );

        if (existingGroup && existingGroup.items.length > 0) {
            handleEditRecord(existingGroup.items[0], existingGroup.items);
        } else {
            const defaultSafe = selectedSafeFilter !== 'ALL' ? parseInt(selectedSafeFilter) : 1;
            setEditingRecord(null);
            setSelectedGroupRecords([]);
            setClickCoords({ x: xPercent, y: yPercent });
            setFormLocation(locName);
            setFormTimeStr('04:00');
            setFormSafeNumber(defaultSafe);
            setFormTeamA('');
            setFormTeamB('');
            setFormWinner('');
            setFormNotes('');
            setShowModal(true);
        }
    };

    // Marker Click (Opens modal for viewing and adding records with custom Safe & Game Time)
    const handleMarkerClick = (group: typeof groupedFights[0], e: React.MouseEvent) => {
        e.stopPropagation();

        handleEditRecord(group.items[0], group.items, e);
    };

    // Marker Right Click (-1 or delete)
    const handleMarkerRightClick = (group: typeof groupedFights[0], e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdmin) { setShowAuthModal(true); return; }

        const mainRec = group.items[0];
        const currentCount = mainRec.count || 1;

        if (currentCount > 1) {
            const updated = fights.map(r => r.id === mainRec.id ? {
                ...r,
                count: currentCount - 1
            } : r);
            saveFights(updated);
        } else {
            const updated = fights.filter(r => r.id !== mainRec.id);
            saveFights(updated);
        }
    };

    // Open Modal for Editing Record / Viewing Group Records
    const handleEditRecord = (rec: FightRecord, groupItems?: FightRecord[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingRecord(rec);
        setSelectedGroupRecords(groupItems && groupItems.length > 0 ? groupItems : [rec]);
        setClickCoords({ x: rec.x, y: rec.y });
        setFormLocation(rec.locationName || '');
        setFormTimeStr(formatMinutesToMS(rec.timeInMinutes));
        setFormSafeNumber(rec.safeNumber || 1);
        setFormTeamA(rec.teamA || '');
        setFormTeamB(rec.teamB || '');
        setFormWinner(rec.winnerTeam || '');
        setFormNotes(rec.notes || '');
        setShowModal(true);
    };

    // Save as a NEW record at the current spot
    const handleSaveAsNewRecord = (e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.preventDefault();
        const minutes = parseMSToMinutes(formTimeStr);
        if (minutes <= 0) {
            alert("Por favor, digite um tempo válido em minutos/segundos (Ex: 04:15 ou 4.25).");
            return;
        }

        const locName = formLocation.trim() || 'Zona ' + (clickCoords ? `${Math.round(clickCoords.x)},${Math.round(clickCoords.y)}` : 'Geral');

        if (clickCoords) {
            const newRec: FightRecord = {
                id: 'fight_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamA: formTeamA.trim() || undefined,
                teamB: formTeamB.trim() || undefined,
                winnerTeam: formWinner.trim() || undefined,
                notes: formNotes.trim() || undefined,
                createdAt: Date.now()
            };
            saveFights([...fights, newRec]);
        }
        setShowModal(false);
    };

    // Handle Form Submit
    const handleFormSubmit = (e: React.FormEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        e.preventDefault();
        const minutes = parseMSToMinutes(formTimeStr);
        if (minutes <= 0) {
            alert("Por favor, digite um tempo válido em minutos/segundos (Ex: 04:15 ou 4.25).");
            return;
        }

        const locName = formLocation.trim() || 'Zona ' + (clickCoords ? `${Math.round(clickCoords.x)},${Math.round(clickCoords.y)}` : 'Geral');

        if (editingRecord) {
            const updated = fights.map(r => r.id === editingRecord.id ? {
                ...r,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamA: formTeamA.trim() || undefined,
                teamB: formTeamB.trim() || undefined,
                winnerTeam: formWinner.trim() || undefined,
                notes: formNotes.trim() || undefined,
            } : r);
            saveFights(updated);
        } else if (clickCoords) {
            const newRec: FightRecord = {
                id: 'fight_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamA: formTeamA.trim() || undefined,
                teamB: formTeamB.trim() || undefined,
                winnerTeam: formWinner.trim() || undefined,
                notes: formNotes.trim() || undefined,
                createdAt: Date.now()
            };
            saveFights([...fights, newRec]);
        }

        setShowModal(false);
    };

    // Delete Record
    const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.stopPropagation();
        if (window.confirm("Deseja remover este registro de trocação?")) {
            const filtered = fights.filter(r => r.id !== id);
            saveFights(filtered);
        }
    };

    // Clear All
    const handleClearAll = () => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (window.confirm(`Tem certeza que deseja apagar TODOS os registros de trocações do mapa ${selectedMap.name}?`)) {
            saveFights([]);
        }
    };

    // Calculations & Statistics
    const totalCount = fights.length;

    const avgTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        const sum = fights.reduce((acc, r) => acc + r.timeInMinutes, 0);
        return sum / totalCount;
    }, [fights, totalCount]);

    const minTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        return Math.min(...fights.map(r => r.timeInMinutes));
    }, [fights, totalCount]);

    const maxTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        return Math.max(...fights.map(r => r.timeInMinutes));
    }, [fights, totalCount]);

    // Location Groupings with Counts, Percentage, and Average Time per Location
    const locationStats = useMemo(() => {
        const map: Record<string, { name: string; count: number; totalMinutes: number; percent: number }> = {};
        
        fights.forEach(r => {
            const loc = r.locationName.trim() || 'Desconhecida';
            if (!map[loc]) {
                map[loc] = { name: loc, count: 0, totalMinutes: 0, percent: 0 };
            }
            map[loc].count += 1;
            map[loc].totalMinutes += r.timeInMinutes;
        });

        const list = Object.values(map).map(item => ({
            ...item,
            avgMinutes: item.count > 0 ? item.totalMinutes / item.count : 0,
            percent: totalCount > 0 ? (item.count / totalCount) * 100 : 0
        }));

        list.sort((a, b) => b.count - a.count);
        return list;
    }, [fights, totalCount]);

    // Safe Zone breakdown (1-7)
    const safeStats = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        fights.forEach(r => {
            const s = r.safeNumber || 1;
            counts[s] = (counts[s] || 0) + 1;
        });
        return [1, 2, 3, 4, 5, 6, 7].map(num => ({
            safe: num,
            count: counts[num] || 0,
            percent: totalCount > 0 ? ((counts[num] || 0) / totalCount) * 100 : 0
        }));
    }, [fights, totalCount]);

    // Team List extracted for filter
    const availableTeams = useMemo(() => {
        const set = new Set<string>();
        fights.forEach(r => {
            if (r.teamA) set.add(r.teamA);
            if (r.teamB) set.add(r.teamB);
            if (r.winnerTeam) set.add(r.winnerTeam);
        });
        return Array.from(set).sort();
    }, [fights]);

    // JSON Export / Import
    const handleExportJSON = () => {
        try {
            const exportData = {
                mapId: selectedMap.id,
                mapName: selectedMap.name,
                exportedAt: new Date().toISOString(),
                totalFights: fights.length,
                averageTimeFormatted: formatMinutesToMS(avgTimeMinutes),
                fights
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estudos_trocacoes_${selectedMap.id}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erro ao exportar JSON:", e);
            alert("Erro ao exportar dados de trocações.");
        }
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const imported = JSON.parse(content);

                let listToImport: FightRecord[] = [];
                if (Array.isArray(imported)) {
                    listToImport = imported;
                } else if (imported.fights && Array.isArray(imported.fights)) {
                    listToImport = imported.fights;
                }

                if (listToImport.length > 0) {
                    await saveFights(listToImport);
                    alert(`${listToImport.length} registros de trocações importados com sucesso!`);
                } else {
                    alert("Nenhum registro válido de trocações encontrado no JSON.");
                }
            } catch (err) {
                console.error("Erro ao importar JSON:", err);
                alert("Formato de JSON inválido.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Modal for Registering / Editing Fight */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
                                <Swords size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-widest text-white">
                                    {editingRecord ? 'Editar Registro de Trocação' : 'Registrar Ocorrência de Trocação'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    Mapa: <span className="text-yellow-400">{selectedMap.name}</span> {clickCoords && `(X: ${Math.round(clickCoords.x)}%, Y: ${Math.round(clickCoords.y)}%)`}
                                </p>
                            </div>
                        </div>

                        {/* Group Selection Pills */}
                        {selectedGroupRecords.length > 0 && (
                            <div className="bg-black/40 p-3 rounded-2xl border border-white/10 mb-4 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span>Trocações neste local ({selectedGroupRecords.length}):</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedGroupRecords.map((r, i) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => {
                                                setEditingRecord(r);
                                                setFormLocation(r.locationName || '');
                                                setFormTimeStr(formatMinutesToMS(r.timeInMinutes));
                                                setFormSafeNumber(r.safeNumber || 1);
                                                setFormTeamA(r.teamA || '');
                                                setFormTeamB(r.teamB || '');
                                                setFormWinner(r.winnerTeam || '');
                                                setFormNotes(r.notes || '');
                                            }}
                                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                editingRecord?.id === r.id
                                                ? 'bg-red-500 text-white border-red-400 font-black'
                                                : 'bg-black/80 text-red-400 border-red-500/30 hover:border-red-500'
                                            }`}
                                        >
                                            #{i + 1} S{r.safeNumber || 1} ({formatMinutesToMS(r.timeInMinutes)})
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRecord(null);
                                            setFormTimeStr('04:00');
                                            setFormSafeNumber(1);
                                            setFormTeamA('');
                                            setFormTeamB('');
                                            setFormWinner('');
                                            setFormNotes('');
                                        }}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                            editingRecord === null
                                            ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20'
                                        }`}
                                    >
                                        <Plus size={12} /> + Adicionar Outro Registro
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Location Name Input & Shortcuts */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                                    Localização / Ponto no Mapa
                                </label>
                                <input 
                                    type="text" 
                                    value={formLocation}
                                    onChange={e => setFormLocation(e.target.value)}
                                    placeholder="Ex: Brasilia, Peak, Refinery..."
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-sm font-semibold"
                                    required
                                />
                                {POPULAR_LOCATIONS[selectedMap.id] && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase py-0.5 mr-1">Sugestões:</span>
                                        {POPULAR_LOCATIONS[selectedMap.id].slice(0, 8).map(loc => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => setFormLocation(loc)}
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                                    formLocation === loc 
                                                    ? 'bg-red-500 text-white border-red-400 font-black' 
                                                    : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Time Input in Minutes & Seconds */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        Tempo Decorrido da Trocação (MM:SS)
                                    </label>
                                    <span className="text-[10px] text-red-400 font-mono font-bold">
                                        {parseMSToMinutes(formTimeStr).toFixed(2)} minutos decorridos
                                    </span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={formTimeStr}
                                        onChange={e => setFormTimeStr(e.target.value)}
                                        placeholder="Ex: 04:15, 06:30, 3.5"
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 pl-10 text-red-400 font-mono font-bold text-base focus:outline-none focus:border-red-500"
                                        required
                                    />
                                    <Clock size={18} className="absolute left-3 top-3 text-red-500" />
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 block">
                                    Digite o tempo em minutos e segundos (Ex: 04:30 para 4 minutos e 30 segundos)
                                </span>

                                {/* Quick Time Buttons */}
                                <div className="grid grid-cols-6 gap-1.5 mt-2">
                                    {['02:00', '04:00', '06:00', '08:00', '10:00', '12:00'].map(tStr => (
                                        <button
                                            key={tStr}
                                            type="button"
                                            onClick={() => setFormTimeStr(tStr)}
                                            className={`py-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                                                formTimeStr === tStr
                                                ? 'bg-red-500 text-white border-red-400 font-black'
                                                : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {tStr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Safe Zone Selection (1, 2, 3, 4, 5, 6, 7) */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    <span>Número da Safe Zone</span>
                                    <span className="text-yellow-400 font-black font-mono text-xs bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-lg">
                                        SAFE {formSafeNumber}
                                    </span>
                                </label>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setFormSafeNumber(num)}
                                            className={`py-2 text-xs font-black rounded-xl border transition-all flex flex-col items-center justify-center ${
                                                formSafeNumber === num
                                                ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/20'
                                                : 'bg-black/50 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="text-[9px] uppercase font-bold opacity-75">Safe</span>
                                            <span className="text-sm font-black">{num}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Teams Involved Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                        Equipe A (Opcional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formTeamA}
                                        onChange={e => setFormTeamA(e.target.value)}
                                        placeholder="Ex: LOUD, Pain..."
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                        Equipe B (Opcional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formTeamB}
                                        onChange={e => setFormTeamB(e.target.value)}
                                        placeholder="Ex: Fluxo, Alpha..."
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-xs font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Winner Team Input */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                    Vencedora da Trocação (Opcional)
                                </label>
                                <input 
                                    type="text" 
                                    value={formWinner}
                                    onChange={e => setFormWinner(e.target.value)}
                                    placeholder="Ex: LOUD (Wipe), Pain..."
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-yellow-400 placeholder-gray-600 focus:outline-none focus:border-red-500 text-xs font-semibold"
                                />
                            </div>

                            {/* Notes Input */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                    Observações / Detalhes do Confronto
                                </label>
                                <textarea 
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="Ex: Trocação de Pixel com Granadas de Gel, interferência de 3º time..."
                                    rows={2}
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-xs resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest py-3 rounded-xl transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-red-600/20"
                                >
                                    {editingRecord ? 'Atualizar Registro' : 'Salvar Trocação'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header Controls & Map Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-3">
                        <Swords className="text-red-500 animate-pulse" size={28} />
                        Estudo de Trocações / Confrontos
                    </h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Clique no mapa para registrar locais, tempos e safes onde ocorreram as trocações.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Map Buttons */}
                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                        {maps.map(map => (
                            <button 
                                key={map.id}
                                onClick={() => setSelectedMap(map)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                    selectedMap.id === map.id 
                                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {map.name}
                            </button>
                        ))}
                    </div>

                    {/* Import / Export JSON */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleExportJSON}
                            className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                            title="Exportar dados de trocações para JSON"
                        >
                            <Download size={14} className="text-red-400" /> Exportar
                        </button>

                        <label className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer">
                            <Upload size={14} className="text-yellow-400" /> Importar
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImportJSON} 
                                className="hidden" 
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* KPI Summary Header Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                        <Swords size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total de Trocações</span>
                        <span className="block text-2xl font-black text-white italic">{totalCount}</span>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
                        <Clock size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Média de Tempo</span>
                        <span className="block text-2xl font-black text-yellow-400 font-mono">
                            {totalCount > 0 ? formatMinutesToMS(avgTimeMinutes) : '00:00'} <span className="text-xs text-gray-500 font-sans">min</span>
                        </span>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                        <Flame size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mais Rápida</span>
                        <span className="block text-2xl font-black text-orange-400 font-mono">
                            {totalCount > 0 ? formatMinutesToMS(minTimeMinutes) : '00:00'} <span className="text-xs text-gray-500 font-sans">min</span>
                        </span>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <BarChart2 size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mais Tardia</span>
                        <span className="block text-2xl font-black text-purple-400 font-mono">
                            {totalCount > 0 ? formatMinutesToMS(maxTimeMinutes) : '00:00'} <span className="text-xs text-gray-500 font-sans">min</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid Layout: Map (Left 7 cols) & Lateral List (Right 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* MAP AREA (7 Cols) */}
                <div className="lg:col-span-7 bg-[#1a1a1a] rounded-3xl border border-gray-800 p-5 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                    
                    {/* Controls Bar */}
                    <div className="w-full flex items-center justify-between z-20 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-red-500" />
                            <span className="text-xs font-black text-white uppercase italic tracking-wider">
                                {selectedMap.name} - Clique no ponto para marcar a trocação
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom In">
                                <ZoomIn size={16} />
                            </button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom Out">
                                <ZoomOut size={16} />
                            </button>
                            <button onClick={() => {setZoom(1); setPan({x:0,y:0})}} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Reset Vision">
                                <Move size={16} />
                            </button>
                            <div className="w-px h-4 bg-white/10"></div>
                            <button onClick={handleClearAll} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Limpar tudo">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Safe Zone Quick Filter Bar above Map */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/60 p-2.5 rounded-2xl border border-white/10 z-20">
                        <div className="flex items-center gap-2 shrink-0">
                            <Shield size={16} className="text-yellow-400 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-gray-200">
                                Mostrar no Mapa:
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center">
                            <button
                                type="button"
                                onClick={() => setSelectedSafeFilter('ALL')}
                                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    selectedSafeFilter === 'ALL'
                                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 font-black'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                Todas Safes
                            </button>
                            {[1, 2, 3, 4, 5, 6, 7].map(sNum => (
                                <button
                                    key={sNum}
                                    type="button"
                                    onClick={() => setSelectedSafeFilter(selectedSafeFilter === String(sNum) ? 'ALL' : String(sNum))}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                        selectedSafeFilter === String(sNum)
                                        ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20 ring-2 ring-yellow-400/50'
                                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span>Safe</span>
                                    <span className="font-mono font-black">{sNum}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Heatmap Control Toolbar */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-black/40 p-2 rounded-xl border border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                            <Flame size={15} className="text-red-500 animate-pulse" />
                            <span className="font-bold text-gray-300">Modo de Visão:</span>
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setHeatmapMode('both')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                        heatmapMode === 'both'
                                        ? 'bg-red-500 text-white font-black'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Heatmap + Pinos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHeatmapMode('heatmap')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                        heatmapMode === 'heatmap'
                                        ? 'bg-red-500 text-white font-black'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Apenas Heatmap
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHeatmapMode('markers')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                        heatmapMode === 'markers'
                                        ? 'bg-red-500 text-white font-black'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Apenas Pinos
                                </button>
                            </div>
                        </div>

                        {heatmapMode !== 'markers' && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Raio Calor:</span>
                                    <button
                                        type="button"
                                        onClick={() => setHeatmapRadius(r => Math.max(25, r - 10))}
                                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono font-bold text-gray-200"
                                    >
                                        -
                                    </button>
                                    <span className="font-mono text-xs font-bold text-red-400">{heatmapRadius}px</span>
                                    <button
                                        type="button"
                                        onClick={() => setHeatmapRadius(r => Math.min(90, r + 10))}
                                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono font-bold text-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Map Canvas Container */}
                    <div 
                        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0a0a0a] border-2 border-gray-800 cursor-crosshair shadow-inner flex items-center justify-center select-none"
                        ref={containerRef}
                        onWheel={(e) => {
                            e.preventDefault();
                            if (e.deltaY < 0) {
                                setZoom(z => Math.min(z + 0.2, 4));
                            } else {
                                setZoom(z => Math.max(z - 0.2, 1));
                            }
                        }}
                        onMouseDown={(e) => {
                            if (e.button === 1 || e.altKey) {
                                e.preventDefault();
                                setIsDragging(true);
                                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                            }
                        }}
                        onMouseMove={(e) => {
                            if (isDragging) {
                                setPan({
                                    x: e.clientX - dragStart.x,
                                    y: e.clientY - dragStart.y
                                });
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                    >
                        <div 
                            className="relative w-full h-full transition-transform duration-75 ease-out origin-center"
                            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
                        >
                            <img 
                                src={selectedMap.url} 
                                alt={selectedMap.name} 
                                className="w-full h-full object-cover select-none pointer-events-none opacity-85" 
                                draggable={false}
                            />

                            {/* Heatmap Layer */}
                            <HeatmapOverlay
                                points={heatmapPoints}
                                visible={heatmapMode !== 'markers'}
                                palette="fire"
                                radius={heatmapRadius}
                                opacity={0.8}
                            />

                            {/* Click layer */}
                            <div 
                                className="absolute inset-0 z-10" 
                                onClick={handleMapClick}
                            >
                                {groupedFights.map((group) => {
                                    const isHovered = hoveredRecordId === group.id;

                                    return (
                                        <div 
                                            key={group.id}
                                            onClick={(e) => handleMarkerClick(group, e)}
                                            onContextMenu={(e) => handleMarkerRightClick(group, e)}
                                            onMouseEnter={() => setHoveredRecordId(group.id)}
                                            onMouseLeave={() => setHoveredRecordId(null)}
                                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-200 ${
                                                heatmapMode === 'heatmap' ? 'opacity-40 hover:opacity-100 scale-90' : ''
                                            } ${
                                                isHovered ? 'scale-125 z-30' : 'hover:scale-110'
                                            }`}
                                            style={{ left: `${group.x}%`, top: `${group.y}%` }}
                                            title="Clique para +1 | Botão Direito para -1 | Shift+Clique para Editar"
                                        >
                                            {/* Pulse Aura */}
                                            <div className="absolute -inset-2 rounded-full bg-red-500/30 blur-sm animate-ping pointer-events-none"></div>

                                            {/* Pin Marker - ONLY QUANTITY NUMBER */}
                                            <div className={`relative flex items-center justify-center rounded-full border-2 shadow-2xl transition-all ${
                                                isHovered 
                                                ? 'bg-yellow-400 text-black border-white ring-4 ring-yellow-400/50 scale-110' 
                                                : 'bg-black/95 text-red-400 border-red-500 hover:bg-black'
                                            } min-w-[32px] h-8 px-2 font-mono text-xs font-black`}>
                                                {group.count}
                                            </div>

                                            {/* Tooltip on Hover */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-black/95 border border-red-500/40 p-2.5 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                                                <div className="font-black text-red-400 uppercase italic flex items-center justify-between gap-3">
                                                    <span>{group.locationName}</span>
                                                    <span className="text-black bg-yellow-400 font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                                                        {group.count} TROCAÇÃO{group.count > 1 ? 'ÕES' : 'ÃO'}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-col gap-1 max-h-32 overflow-y-auto">
                                                    {group.items.map((rec, idx) => (
                                                        <div key={rec.id || idx} className="text-gray-300 font-mono text-[9px] border-t border-white/10 pt-0.5">
                                                            ⚔️ {rec.teamA || 'Time 1'} vs {rec.teamB || 'Time 2'} {rec.winnerTeam ? `(Vencedor: ${rec.winnerTeam})` : ''} | ⏱️ {formatMinutesToMS(rec.timeInMinutes)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 border-t border-white/10 pt-1.5 flex items-center justify-between gap-2 text-[9px] font-semibold text-gray-400">
                                                    <span>⚡ Clique: +1 | 🖱️ Dir: -1</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleEditRecord(group.items[0], e)}
                                                        className="text-yellow-400 hover:underline font-bold"
                                                    >
                                                        ⚙️ Editar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="flex items-center gap-1.5">
                            <Info size={14} className="text-red-400 shrink-0" />
                            <span>
                                <strong className="text-white">Clique Esquerdo:</strong> +1 no local &nbsp;|&nbsp; 
                                <strong className="text-white"> Botão Direito:</strong> -1 &nbsp;|&nbsp; 
                                <strong className="text-white"> Shift + Clique:</strong> Detalhes
                            </span>
                        </span>
                        <span className="font-mono text-red-400 font-bold shrink-0">
                            {fights.reduce((a, b) => a + (b.count || 1), 0)} Trocações em {fights.length} Ponto{fights.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* LATERAL LIST & STATS SIDEBAR (5 Cols) */}
                <div className="lg:col-span-5 space-y-4 flex flex-col">
                    
                    {/* Top Location & Safe Breakdown % */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4">
                        {/* Porcentagem por Safe Zone */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-yellow-400" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                        Distribuição por Safe Zone (1-7)
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    Safes 1 a 7
                                </span>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {safeStats.map(stat => (
                                    <button
                                        key={stat.safe}
                                        onClick={() => setSelectedSafeFilter(selectedSafeFilter === String(stat.safe) ? 'ALL' : String(stat.safe))}
                                        className={`p-1.5 rounded-xl border text-center transition-all ${
                                            selectedSafeFilter === String(stat.safe)
                                            ? 'bg-yellow-400 text-black border-yellow-300 font-black ring-2 ring-yellow-400/40'
                                            : stat.count > 0
                                                ? 'bg-black/60 text-yellow-400 border-yellow-500/30 hover:border-yellow-400'
                                                : 'bg-black/30 text-gray-600 border-white/5'
                                        }`}
                                    >
                                        <span className="block text-[8px] uppercase font-bold opacity-75">Safe</span>
                                        <span className="block text-xs font-black font-mono">{stat.safe}</span>
                                        <span className="block text-[9px] font-bold opacity-90 mt-0.5">{stat.count}x</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Porcentagem por Território / Zona */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between pb-1">
                                <div className="flex items-center gap-2">
                                    <Percent size={16} className="text-red-400" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                        Porcentagem por Território / Zona
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                    Top Locais
                                </span>
                            </div>

                            {locationStats.length > 0 ? (
                                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                    {locationStats.map((stat) => (
                                        <div key={stat.name} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-white uppercase italic truncate max-w-[140px]">
                                                    {stat.name}
                                                </span>
                                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                                    <span className="text-red-400 font-black">
                                                        {stat.count}x ({stat.percent.toFixed(1)}%)
                                                    </span>
                                                    <span className="text-gray-500">
                                                        • Média: {formatMinutesToMS(stat.avgMinutes)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                <div 
                                                    className="bg-gradient-to-r from-red-600 to-orange-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(stat.percent, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic text-center py-2">
                                    Nenhuma trocação registrada ainda para calcular porcentagens.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Main Lateral List Panel */}
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-2xl flex-1 space-y-4">
                        
                        {/* Panel Header & Controls */}
                        <div className="space-y-3 pb-3 border-b border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Swords size={18} className="text-red-500" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                        Lista de Trocações ({filteredFights.length})
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingRecord(null);
                                        setClickCoords({ x: 50, y: 50 });
                                        setFormLocation('');
                                        setFormTimeStr('04:00');
                                        setFormSafeNumber(1);
                                        setFormTeamA('');
                                        setFormTeamB('');
                                        setFormWinner('');
                                        setFormNotes('');
                                        setShowModal(true);
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-black text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-md transition-all"
                                >
                                    <Plus size={12} /> Registrar Trocação
                                </button>
                            </div>

                            {/* Search & Sorting Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* Search */}
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Buscar local, time, safe..."
                                        className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                                    />
                                    <Search size={14} className="absolute left-2.5 top-2 text-gray-500" />
                                </div>

                                {/* Sort Select */}
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="bg-black/50 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                                >
                                    <option value="timeAsc">Ordem por Tempo (Menor &rarr; Maior)</option>
                                    <option value="timeDesc">Ordem por Tempo (Maior &rarr; Menor)</option>
                                    <option value="safeAsc">Ordem por Safe Zone (1 &rarr; 7)</option>
                                    <option value="recent">Mais Recentes Primeiro</option>
                                    <option value="location">Por Nome da Localização</option>
                                </select>
                            </div>

                            {/* Safe Zone Filter Pills */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                                <span className="text-[10px] text-gray-500 font-bold uppercase mr-1 shrink-0">Safe:</span>
                                <button
                                    onClick={() => setSelectedSafeFilter('ALL')}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                                        selectedSafeFilter === 'ALL'
                                        ? 'bg-yellow-400 text-black font-black'
                                        : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                    }`}
                                >
                                    Todas Safes
                                </button>
                                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setSelectedSafeFilter(selectedSafeFilter === String(num) ? 'ALL' : String(num))}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                                            selectedSafeFilter === String(num)
                                            ? 'bg-yellow-400 text-black font-black'
                                            : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                        }`}
                                    >
                                        Safe {num}
                                    </button>
                                ))}
                            </div>

                            {/* Team Filter Pills if Teams available */}
                            {availableTeams.length > 0 && (
                                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase mr-1 shrink-0">Time:</span>
                                    <button
                                        onClick={() => setSelectedTeamFilter('ALL')}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                                            selectedTeamFilter === 'ALL'
                                            ? 'bg-red-600 text-white font-black'
                                            : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                        }`}
                                    >
                                        Todos
                                    </button>
                                    {availableTeams.map(tName => (
                                        <button
                                            key={tName}
                                            onClick={() => setSelectedTeamFilter(tName)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                                                selectedTeamFilter === tName
                                                ? 'bg-red-600 text-white font-black'
                                                : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                            }`}
                                        >
                                            {tName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* List Items */}
                        {filteredFights.length > 0 ? (
                            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                {filteredFights.map(rec => {
                                    const logoA = rec.teamA ? findTeamLogo(rec.teamA, data?.teamsReference) : null;
                                    const logoB = rec.teamB ? findTeamLogo(rec.teamB, data?.teamsReference) : null;
                                    const isHovered = hoveredRecordId === rec.id;
                                    const locCount = locationStats.find(s => s.name === rec.locationName)?.count || 1;
                                    const percent = totalCount > 0 ? (locCount / totalCount) * 100 : 0;

                                    return (
                                        <div 
                                            key={rec.id}
                                            onMouseEnter={() => setHoveredRecordId(rec.id)}
                                            onMouseLeave={() => setHoveredRecordId(null)}
                                            onClick={() => handleEditRecord(rec)}
                                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isHovered 
                                                ? 'bg-red-950/40 border-red-500/60 shadow-lg scale-[1.01]' 
                                                : 'bg-black/40 border-gray-800/80 hover:border-gray-700 hover:bg-black/60'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {/* Team Logos or Sword Icon */}
                                                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0 flex items-center justify-center">
                                                    {logoA || logoB ? (
                                                        <div className="flex -space-x-1.5">
                                                            {logoA && <img src={logoA} alt={rec.teamA} className="w-5 h-5 object-contain rounded-full bg-black p-0.5 border border-red-500/40" />}
                                                            {logoB && <img src={logoB} alt={rec.teamB} className="w-5 h-5 object-contain rounded-full bg-black p-0.5 border border-red-500/40" />}
                                                        </div>
                                                    ) : (
                                                        <Swords size={16} className="text-red-400" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-black text-white uppercase italic truncate">
                                                            {rec.locationName}
                                                        </span>
                                                        <span className="text-[9px] font-black text-black bg-yellow-400 px-1.5 py-0.2 rounded uppercase">
                                                            Safe {rec.safeNumber || 1}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.2 rounded">
                                                            {percent.toFixed(1)}% do mapa
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-0.5 flex-wrap">
                                                        <span className="text-red-400 font-bold">
                                                            ⏱️ {formatMinutesToMS(rec.timeInMinutes)} min
                                                        </span>
                                                        {(rec.teamA || rec.teamB) && (
                                                            <span className="text-gray-300 font-sans font-semibold">
                                                                • {rec.teamA || 'Time 1'} vs {rec.teamB || 'Time 2'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {rec.winnerTeam && (
                                                        <span className="block text-[10px] text-yellow-400 font-bold mt-0.5">
                                                            🏆 Vencedor: {rec.winnerTeam}
                                                        </span>
                                                    )}

                                                    {rec.notes && (
                                                        <p className="text-[10px] text-gray-500 italic truncate mt-0.5">
                                                            "{rec.notes}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => handleEditRecord(rec, e)}
                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteRecord(rec.id, e)}
                                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Apagar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 italic text-xs border border-dashed border-gray-800 rounded-2xl">
                                Nenhuma trocação encontrada com os filtros selecionados.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
