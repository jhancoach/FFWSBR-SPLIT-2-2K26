import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MapPin, Plus, Trash2, Edit3, Clock, Search, Filter, Percent, 
    TrendingUp, HeartPulse, Shield, Download, Upload, ZoomIn, ZoomOut, Move,
    X, Check, AlertCircle, RefreshCw, BarChart2, Layers, User, ChevronRight, Info, Flame
} from 'lucide-react';
import { HeatmapOverlay } from './HeatmapOverlay';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebasePlaceholder } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';

export interface RevivalRecord {
    id: string;
    mapId: string; // BER, PUR, KAL, NT, SOL
    x: number; // 0-100 %
    y: number; // 0-100 %
    locationName: string;
    timeInMinutes: number; // e.g. 3.5 = 3 min 30 s
    safeNumber?: number; // 1, 2, 3, 4, 5, 6, 7
    teamName?: string;
    revivalCount?: number;
    notes?: string;
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

interface RevivalStudiesProps {
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

export const RevivalStudies: React.FC<RevivalStudiesProps> = ({
    maps,
    selectedMap,
    setSelectedMap,
    data,
    isAdmin,
    setShowAuthModal
}) => {
    const [revivals, setRevivals] = useState<RevivalRecord[]>([]);
    
    // Zoom & Pan Map State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<RevivalRecord | null>(null);
    const [selectedGroupRecords, setSelectedGroupRecords] = useState<RevivalRecord[]>([]);
    const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

    // Form State
    const [formLocation, setFormLocation] = useState('');
    const [formTimeStr, setFormTimeStr] = useState('03:00');
    const [formSafeNumber, setFormSafeNumber] = useState<number>(1);
    const [formTeam, setFormTeam] = useState('');
    const [formRevivalCount, setFormRevivalCount] = useState<number>(1);
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

        const storageKey = `studies_revives_${selectedMap.id}`;

        if (isFirebasePlaceholder) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    setRevivals(JSON.parse(saved));
                } else {
                    setRevivals([]);
                }
            } catch (e) {
                console.error("Error reading local revival studies:", e);
                setRevivals([]);
            }
            return;
        }

        const docRef = doc(db, 'studies', `revives_${selectedMap.id}`);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                const snapData = snapshot.data();
                if (snapData && snapData.revivals) {
                    try {
                        const parsed = JSON.parse(snapData.revivals);
                        setRevivals(parsed);
                    } catch (e) {
                        setRevivals([]);
                    }
                } else {
                    setRevivals([]);
                }
            } else {
                setRevivals([]);
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `studies/revives_${selectedMap.id}`);
        });

        return () => unsubscribe();
    }, [selectedMap]);

    // Save Records Helper
    const saveRevivals = async (newRevivals: RevivalRecord[]) => {
        setRevivals(newRevivals);
        const storageKey = `studies_revives_${selectedMap.id}`;

        try {
            localStorage.setItem(storageKey, JSON.stringify(newRevivals));
        } catch (e) {
            console.error("Error writing local revival studies:", e);
        }

        if (!isFirebasePlaceholder) {
            try {
                await setDoc(doc(db, 'studies', `revives_${selectedMap.id}`), {
                    mapId: selectedMap.id,
                    revivals: JSON.stringify(newRevivals),
                    updatedAt: Date.now(),
                    pin: '221120'
                });
            } catch (error) {
                console.error("Error saving revivals to Firestore:", error);
            }
        }
    };

    // Filtered & Sorted Revivals for Map and List
    const filteredRevivals = useMemo(() => {
        return revivals.filter(r => {
            if (selectedLocationFilter !== 'ALL' && r.locationName !== selectedLocationFilter) return false;
            if (selectedTeamFilter !== 'ALL' && r.teamName !== selectedTeamFilter) return false;
            if (selectedSafeFilter !== 'ALL' && String(r.safeNumber || 1) !== selectedSafeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchLoc = r.locationName.toLowerCase().includes(q);
                const matchTeam = r.teamName?.toLowerCase().includes(q);
                const matchPlayer = r.playerName?.toLowerCase().includes(q);
                const matchTime = formatMinutesToMS(r.timeInMinutes).includes(q);
                const matchSafe = `safe ${r.safeNumber || 1}`.includes(q) || `s${r.safeNumber || 1}`.includes(q);
                if (!matchLoc && !matchTeam && !matchPlayer && !matchTime && !matchSafe) return false;
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
    }, [revivals, selectedLocationFilter, selectedTeamFilter, selectedSafeFilter, searchQuery, sortBy]);

    // Group revivals for map rendering (Quantity and %) using filtered list so map updates when Safe filter changes
    const groupedRevivals = useMemo(() => {
        const groups: {
            id: string;
            x: number;
            y: number;
            locationName: string;
            count: number;
            pct: string;
            items: RevivalRecord[];
        }[] = [];

        const total = filteredRevivals.reduce((acc, r) => acc + (r.revivalCount || 1), 0);

        filteredRevivals.forEach(rec => {
            const qty = rec.revivalCount || 1;
            const existing = groups.find(g => 
                (rec.locationName && g.locationName.toLowerCase().trim() === rec.locationName.toLowerCase().trim()) ||
                (Math.abs(g.x - rec.x) <= 3 && Math.abs(g.y - rec.y) <= 3)
            );

            if (existing) {
                existing.count += qty;
                existing.items.push(rec);
            } else {
                groups.push({
                    id: rec.id,
                    x: rec.x,
                    y: rec.y,
                    locationName: rec.locationName || 'Ponto',
                    count: qty,
                    pct: '0',
                    items: [rec]
                });
            }
        });

        groups.forEach(g => {
            g.pct = total > 0 ? ((g.count / total) * 100).toFixed(1) : '0';
        });

        return groups;
    }, [filteredRevivals]);

    const heatmapPoints = useMemo(() => {
        return groupedRevivals.map(g => ({
            x: g.x,
            y: g.y,
            weight: g.count
        }));
    }, [groupedRevivals]);

    // Map Click Action (Opens modal to specify Safe, Game Time and details)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        if (!isAdmin) { setShowAuthModal(true); return; }

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10;
        const yPercent = Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10;

        const locName = `Ponto ${Math.round(xPercent)},${Math.round(yPercent)}`;

        // Find existing group nearby
        const existingGroup = groupedRevivals.find(g => 
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
            setFormTimeStr('03:00');
            setFormSafeNumber(defaultSafe);
            setFormTeam('');
            setFormRevivalCount(1);
            setFormNotes('');
            setShowModal(true);
        }
    };

    // Marker Click (Opens modal for viewing and adding records with custom Safe & Game Time)
    const handleMarkerClick = (group: typeof groupedRevivals[0], e: React.MouseEvent) => {
        e.stopPropagation();

        handleEditRecord(group.items[0], group.items, e);
    };

    // Marker Right Click (Decrements -1 or removes)
    const handleMarkerRightClick = (group: typeof groupedRevivals[0], e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdmin) { setShowAuthModal(true); return; }

        const mainRec = group.items[0];
        const currentCount = mainRec.revivalCount || 1;

        if (currentCount > 1) {
            const updated = revivals.map(r => r.id === mainRec.id ? {
                ...r,
                revivalCount: currentCount - 1
            } : r);
            saveRevivals(updated);
        } else {
            const updated = revivals.filter(r => r.id !== mainRec.id);
            saveRevivals(updated);
        }
    };

    // Open Modal for Editing/Viewing Group Records
    const handleEditRecord = (rec: RevivalRecord, groupItems?: RevivalRecord[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingRecord(rec);
        setSelectedGroupRecords(groupItems && groupItems.length > 0 ? groupItems : [rec]);
        setClickCoords({ x: rec.x, y: rec.y });
        setFormLocation(rec.locationName || '');
        setFormTimeStr(formatMinutesToMS(rec.timeInMinutes));
        setFormSafeNumber(rec.safeNumber || 1);
        setFormTeam(rec.teamName || '');
        setFormRevivalCount(rec.revivalCount || 1);
        setFormNotes(rec.notes || '');
        setShowModal(true);
    };

    // Save as a NEW record at the current spot
    const handleSaveAsNewRecord = (e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.preventDefault();
        const minutes = parseMSToMinutes(formTimeStr);
        if (minutes <= 0) {
            alert("Por favor, digite um tempo válido em minutos/segundos (Ex: 03:30 ou 3.5).");
            return;
        }

        const locName = formLocation.trim() || 'Zona ' + (clickCoords ? `${Math.round(clickCoords.x)},${Math.round(clickCoords.y)}` : 'Geral');

        if (clickCoords) {
            const newRec: RevivalRecord = {
                id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamName: formTeam.trim() || undefined,
                revivalCount: formRevivalCount,
                notes: formNotes.trim() || undefined,
                createdAt: Date.now()
            };
            saveRevivals([...revivals, newRec]);
        }
        setShowModal(false);
    };

    // Handle Form Submit
    const handleFormSubmit = (e: React.FormEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        e.preventDefault();
        const minutes = parseMSToMinutes(formTimeStr);
        if (minutes <= 0) {
            alert("Por favor, digite um tempo válido em minutos/segundos (Ex: 03:30 ou 3.5).");
            return;
        }

        const locName = formLocation.trim() || 'Zona ' + (clickCoords ? `${Math.round(clickCoords.x)},${Math.round(clickCoords.y)}` : 'Geral');

        if (editingRecord) {
            const updated = revivals.map(r => r.id === editingRecord.id ? {
                ...r,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamName: formTeam.trim() || undefined,
                revivalCount: formRevivalCount,
                notes: formNotes.trim() || undefined,
            } : r);
            saveRevivals(updated);
        } else if (clickCoords) {
            const newRec: RevivalRecord = {
                id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: locName,
                timeInMinutes: minutes,
                safeNumber: formSafeNumber,
                teamName: formTeam.trim() || undefined,
                revivalCount: formRevivalCount,
                notes: formNotes.trim() || undefined,
                createdAt: Date.now()
            };
            saveRevivals([...revivals, newRec]);
        }

        setShowModal(false);
    };

    // Delete Record
    const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.stopPropagation();
        if (window.confirm("Deseja remover este registro de revivido?")) {
            const filtered = revivals.filter(r => r.id !== id);
            saveRevivals(filtered);
        }
    };

    // Clear All
    const handleClearAll = () => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (window.confirm(`Tem certeza que deseja apagar TODOS os registros de revividos do mapa ${selectedMap.name}?`)) {
            saveRevivals([]);
        }
    };

    // Calculations & Statistics
    const totalCount = useMemo(() => {
        return revivals.reduce((acc, r) => acc + (r.revivalCount || 1), 0);
    }, [revivals]);

    const avgTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        const sum = revivals.reduce((acc, r) => acc + r.timeInMinutes, 0);
        return sum / totalCount;
    }, [revivals, totalCount]);

    const minTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        return Math.min(...revivals.map(r => r.timeInMinutes));
    }, [revivals, totalCount]);

    const maxTimeMinutes = useMemo(() => {
        if (totalCount === 0) return 0;
        return Math.max(...revivals.map(r => r.timeInMinutes));
    }, [revivals, totalCount]);

    // Location Groupings with Counts, Percentage, and Average Time per Location
    const locationStats = useMemo(() => {
        const map: Record<string, { name: string; count: number; totalMinutes: number; percent: number }> = {};
        
        revivals.forEach(r => {
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
    }, [revivals, totalCount]);

    // Safe Zone breakdown
    const safeStats = useMemo(() => {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        revivals.forEach(r => {
            const s = r.safeNumber || 1;
            counts[s] = (counts[s] || 0) + 1;
        });
        return [1, 2, 3, 4, 5, 6, 7].map(num => ({
            safe: num,
            count: counts[num] || 0,
            percent: totalCount > 0 ? ((counts[num] || 0) / totalCount) * 100 : 0
        }));
    }, [revivals, totalCount]);

    // Team List extracted for filter
    const availableTeams = useMemo(() => {
        const set = new Set<string>();
        revivals.forEach(r => {
            if (r.teamName) set.add(r.teamName);
        });
        return Array.from(set).sort();
    }, [revivals]);

    // JSON Export / Import
    const handleExportJSON = () => {
        try {
            const exportData = {
                mapId: selectedMap.id,
                mapName: selectedMap.name,
                exportedAt: new Date().toISOString(),
                totalRevivals: revivals.length,
                averageTimeFormatted: formatMinutesToMS(avgTimeMinutes),
                revivals
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estudos_revividos_${selectedMap.id}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erro ao exportar JSON:", e);
            alert("Erro ao exportar dados de revividos.");
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

                let listToImport: RevivalRecord[] = [];
                if (Array.isArray(imported)) {
                    listToImport = imported;
                } else if (imported.revivals && Array.isArray(imported.revivals)) {
                    listToImport = imported.revivals;
                }

                if (listToImport.length > 0) {
                    await saveRevivals(listToImport);
                    alert(`${listToImport.length} registros de revividos importados com sucesso!`);
                } else {
                    alert("Nenhum registro válido de revividos encontrado no JSON.");
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
            {/* Modal for Registering / Editing Revival */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-6 sm:p-8 rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                                <HeartPulse size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-widest text-white">
                                    {editingRecord ? 'Editar Registro de Revivido' : 'Registrar Ocorrência de Revivido'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    Mapa: <span className="text-yellow-400">{selectedMap.name}</span> {clickCoords && `(X: ${Math.round(clickCoords.x)}%, Y: ${Math.round(clickCoords.y)}%)`}
                                </p>
                            </div>
                        </div>

                        {/* Existing Records Selector at this spot */}
                        {selectedGroupRecords.length > 0 && (
                            <div className="mb-4 p-3 bg-black/60 rounded-2xl border border-white/10">
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Registros neste local ({selectedGroupRecords.reduce((acc, r) => acc + (r.revivalCount || 1), 0)} revividos):</span>
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
                                                setFormTeam(r.teamName || '');
                                                setFormRevivalCount(r.revivalCount || 1);
                                                setFormNotes(r.notes || '');
                                            }}
                                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                editingRecord?.id === r.id
                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                : 'bg-black/80 text-emerald-400 border-emerald-500/30 hover:border-emerald-500'
                                            }`}
                                        >
                                            #{i + 1} S{r.safeNumber || 1} ({formatMinutesToMS(r.timeInMinutes)}) - {r.revivalCount || 1}x
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRecord(null);
                                            setFormTimeStr('03:00');
                                            setFormSafeNumber(1);
                                            setFormTeam('');
                                            setFormRevivalCount(1);
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
                                    placeholder="Ex: Peak, Pochinok, Bimasakti..."
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
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
                                                    ? 'bg-emerald-500 text-black border-emerald-400 font-black' 
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
                                        Tempo Decorrido do Revivido (MM:SS)
                                    </label>
                                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                        {parseMSToMinutes(formTimeStr).toFixed(2)} minutos decorridos
                                    </span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={formTimeStr}
                                        onChange={e => setFormTimeStr(e.target.value)}
                                        placeholder="Ex: 03:30, 04:15, 2.5"
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 pl-10 text-emerald-400 font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                    <Clock size={18} className="absolute left-3 top-3 text-emerald-500" />
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 block">
                                    Digite o tempo em minutos e segundos (Ex: 03:45 para 3 minutos e 45 segundos)
                                </span>

                                {/* Quick Time Buttons */}
                                <div className="grid grid-cols-6 gap-1.5 mt-2">
                                    {['01:30', '02:30', '03:30', '04:30', '05:30', '06:30'].map(tStr => (
                                        <button
                                            key={tStr}
                                            type="button"
                                            onClick={() => setFormTimeStr(tStr)}
                                            className={`py-1 text-[11px] font-mono font-bold rounded-lg border transition-all ${
                                                formTimeStr === tStr
                                                ? 'bg-emerald-500 text-black border-emerald-400 font-black'
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
                                    <span className="text-emerald-400 font-black font-mono text-xs bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
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
                                                ? 'bg-emerald-500 text-black border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20'
                                                : 'bg-black/50 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="text-[9px] uppercase font-bold opacity-75">Safe</span>
                                            <span className="text-sm font-black">{num}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Team & Revival Count Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                        Equipe (Opcional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formTeam}
                                        onChange={e => setFormTeam(e.target.value)}
                                        placeholder="Ex: LOUD, Pain..."
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                        Quantidade de Revividos
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            min="1"
                                            max="50"
                                            value={formRevivalCount}
                                            onChange={e => setFormRevivalCount(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-emerald-400 font-mono text-sm font-black focus:outline-none focus:border-emerald-500"
                                        />
                                        <div className="flex gap-1 shrink-0">
                                            {[1, 2, 3, 4].map(num => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => setFormRevivalCount(num)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black border transition-all ${
                                                        formRevivalCount === num
                                                        ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                                                        : 'bg-black/40 text-gray-400 border-white/5 hover:text-white'
                                                    }`}
                                                >
                                                    {num}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Input */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">
                                    Observações / Circunstância (Opcional)
                                </label>
                                <textarea 
                                    value={formNotes}
                                    onChange={e => setFormNotes(e.target.value)}
                                    placeholder="Ex: Revivido por Vending Machine após troca na safe..."
                                    rows={2}
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-xs resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest py-3 rounded-xl transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                {editingRecord && (
                                    <button 
                                        type="button"
                                        onClick={handleSaveAsNewRecord}
                                        className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-yellow-400/20"
                                    >
                                        + Salvar Como Novo Registro
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    {editingRecord ? 'Atualizar Este Registro' : 'Salvar Revivido Neste Local'}
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
                        <HeartPulse className="text-emerald-500 animate-pulse" size={28} />
                        Estudo de Jogadores Revividos
                    </h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Clique no mapa para registrar o local e o tempo (em minutos) onde ocorreram os revividos.
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
                            title="Exportar dados de revividos para JSON"
                        >
                            <Download size={14} className="text-emerald-400" /> Exportar
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
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <HeartPulse size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total de Revividos</span>
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
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mais Rápido</span>
                        <span className="block text-2xl font-black text-cyan-400 font-mono">
                            {totalCount > 0 ? formatMinutesToMS(minTimeMinutes) : '00:00'} <span className="text-xs text-gray-500 font-sans">min</span>
                        </span>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <BarChart2 size={20} />
                    </div>
                    <div>
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mais Tardio</span>
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
                            <MapPin size={16} className="text-emerald-500" />
                            <span className="text-xs font-black text-white uppercase italic tracking-wider">
                                {selectedMap.name} - Clique em qualquer ponto para marcar revivido
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
                            <Flame size={15} className="text-emerald-400 animate-pulse" />
                            <span className="font-bold text-gray-300">Modo de Visão:</span>
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setHeatmapMode('both')}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                        heatmapMode === 'both'
                                        ? 'bg-emerald-500 text-black font-black'
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
                                        ? 'bg-emerald-500 text-black font-black'
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
                                        ? 'bg-emerald-500 text-black font-black'
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
                                    <span className="font-mono text-xs font-bold text-emerald-400">{heatmapRadius}px</span>
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
                                palette="emerald"
                                radius={heatmapRadius}
                                opacity={0.8}
                            />

                            {/* Click layer */}
                            <div 
                                className="absolute inset-0 z-10" 
                                onClick={handleMapClick}
                            >
                                {groupedRevivals.map((group) => {
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
                                            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 blur-sm animate-ping pointer-events-none"></div>

                                            {/* Pin Marker - ONLY QUANTITY NUMBER */}
                                            <div className={`relative flex items-center justify-center rounded-full border-2 shadow-2xl transition-all ${
                                                isHovered 
                                                ? 'bg-yellow-400 text-black border-white ring-4 ring-yellow-400/50 scale-110' 
                                                : 'bg-black/95 text-yellow-400 border-yellow-400 hover:bg-black'
                                            } min-w-[32px] h-8 px-2 font-mono text-xs font-black`}>
                                                {group.count}
                                            </div>

                                            {/* Tooltip on Hover */}
                                            <div className={`absolute left-1/2 -translate-x-1/2 ${
                                                group.y > 65 ? 'bottom-full mb-2' : 'top-full mt-2'
                                            } bg-[#111111]/98 backdrop-blur-md border border-emerald-500/50 p-3 rounded-2xl text-[11px] text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 pointer-events-auto min-w-[240px] max-w-[320px]`}>
                                                <div className="font-black text-emerald-400 uppercase italic flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
                                                    <span className="truncate">{group.locationName}</span>
                                                    <span className="text-black bg-yellow-400 font-black text-[9px] px-2 py-0.5 rounded-full uppercase shrink-0 shadow-sm">
                                                        {group.count} {group.count > 1 ? 'REVIVIDOS' : 'REVIVIDO'}
                                                    </span>
                                                </div>

                                                <div className="mt-1.5 flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 select-text scrollbar-thin">
                                                    {group.items.map((rec, idx) => (
                                                        <div 
                                                            key={rec.id || idx} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditRecord(rec, group.items, e);
                                                            }}
                                                            className="text-gray-300 hover:text-white font-mono text-[10px] bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5 cursor-pointer transition-colors flex items-center justify-between gap-1.5"
                                                            title="Clique para editar este registro"
                                                        >
                                                            <div className="flex items-center gap-1.5 truncate">
                                                                <span className="font-bold text-yellow-400 shrink-0">#{idx + 1}</span>
                                                                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-bold shrink-0">Safe {rec.safeNumber || 1}</span>
                                                                <span className="text-gray-400 shrink-0">{formatMinutesToMS(rec.timeInMinutes)}</span>
                                                                {rec.teamName && (
                                                                    <span className="text-white font-sans text-[10px] truncate ml-0.5">
                                                                        {rec.teamName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[9px] text-emerald-400 font-mono font-bold shrink-0">
                                                                +{rec.revivalCount || 1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-2.5 border-t border-white/10 pt-2 flex items-center justify-between gap-1.5 text-[10px] font-semibold">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleMarkerClick(group, e)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1 shrink-0"
                                                    >
                                                        <Plus size={11} /> +1 Rápido
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleEditRecord(group.items[0], group.items, e)}
                                                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition-all flex items-center gap-1 shrink-0"
                                                    >
                                                        📝 Ver / + Novo
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
                            <Info size={14} className="text-emerald-400 shrink-0" />
                            <span>
                                <strong className="text-white">Clique Esquerdo:</strong> +1 no local &nbsp;|&nbsp; 
                                <strong className="text-white"> Botão Direito:</strong> -1 &nbsp;|&nbsp; 
                                <strong className="text-white"> Shift + Clique:</strong> Detalhes
                            </span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold shrink-0">
                            {totalCount} Revivido{totalCount !== 1 ? 's' : ''} em {revivals.length} Ponto{revivals.length !== 1 ? 's' : ''}
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
                                    <Percent size={16} className="text-emerald-400" />
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
                                                    <span className="text-emerald-400 font-black">
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
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(stat.percent, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic text-center py-2">
                                    Nenhuma ocorrência registrada ainda para calcular porcentagens.
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
                                    <BarChart2 size={18} className="text-yellow-500" />
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                                        Lista de Revividos ({filteredRevivals.length})
                                    </h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingRecord(null);
                                        setClickCoords({ x: 50, y: 50 });
                                        setFormLocation('');
                                        setFormTimeStr('03:00');
                                        setFormSafeNumber(1);
                                        setFormTeam('');
                                        setFormRevivalCount(1);
                                        setFormNotes('');
                                        setShowModal(true);
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-md transition-all"
                                >
                                    <Plus size={12} /> Novo Registro
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
                                        className="w-full bg-black/50 border border-gray-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                                    />
                                    <Search size={14} className="absolute left-2.5 top-2 text-gray-500" />
                                </div>

                                {/* Sort Select */}
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="bg-black/50 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
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
                                            ? 'bg-emerald-500 text-black font-black'
                                            : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                        }`}
                                    >
                                        Todos Times
                                    </button>
                                    {availableTeams.map(tName => (
                                        <button
                                            key={tName}
                                            onClick={() => setSelectedTeamFilter(tName)}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 ${
                                                selectedTeamFilter === tName
                                                ? 'bg-emerald-500 text-black font-black'
                                                : 'bg-black/40 text-gray-400 border border-white/5 hover:text-white'
                                            }`}
                                        >
                                            {tName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* List Items Scrollable Area */}
                        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredRevivals.length > 0 ? (
                                filteredRevivals.map((rec) => {
                                    const logo = rec.teamName ? findTeamLogo(rec.teamName, data?.teamsReference) : null;
                                    const locStat = locationStats.find(s => s.name === rec.locationName);
                                    const percent = locStat ? locStat.percent : (totalCount > 0 ? (1 / totalCount) * 100 : 0);

                                    return (
                                        <div
                                            key={rec.id}
                                            onMouseEnter={() => setHoveredRecordId(rec.id)}
                                            onMouseLeave={() => setHoveredRecordId(null)}
                                            onClick={() => handleEditRecord(rec)}
                                            className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                hoveredRecordId === rec.id
                                                ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                                                : 'bg-black/30 border-white/5 hover:border-gray-700 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Team logo or Icon */}
                                                <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                                                    {logo ? (
                                                        <img src={logo} alt={rec.teamName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <HeartPulse size={18} className="text-emerald-400" />
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
                                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                                            {percent.toFixed(1)}% do mapa
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1 flex-wrap">
                                                        {rec.teamName && (
                                                            <span className="text-yellow-400 font-bold flex items-center gap-1">
                                                                <Shield size={10} /> {rec.teamName}
                                                            </span>
                                                        )}
                                                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                            <HeartPulse size={10} /> {rec.revivalCount || 1} Revivido{ (rec.revivalCount || 1) > 1 ? 's' : '' }
                                                        </span>
                                                        {rec.notes && (
                                                            <span className="text-gray-500 italic truncate max-w-[140px]">
                                                                "{rec.notes}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right side: Time Badge & Delete */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-center">
                                                    <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">Tempo</span>
                                                    <span className="block text-xs font-black text-emerald-400 font-mono mt-0.5">
                                                        {formatMinutesToMS(rec.timeInMinutes)}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDeleteRecord(rec.id, e)}
                                                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Remover registro"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500 space-y-2">
                                    <HeartPulse size={32} className="mx-auto opacity-40 text-emerald-500" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Nenhum revivido encontrado</p>
                                    <p className="text-[11px] text-gray-600">Clique no mapa ao lado para registrar o primeiro ponto de revivido.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
