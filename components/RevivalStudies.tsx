import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MapPin, Plus, Trash2, Edit3, Clock, Search, Filter, Percent, 
    TrendingUp, HeartPulse, Shield, Download, Upload, ZoomIn, ZoomOut, Move,
    X, Check, AlertCircle, RefreshCw, BarChart2, Layers, User, ChevronRight, Info
} from 'lucide-react';
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
    playerName?: string;
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
    const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

    // Form State
    const [formLocation, setFormLocation] = useState('');
    const [formTimeStr, setFormTimeStr] = useState('03:00');
    const [formSafeNumber, setFormSafeNumber] = useState<number>(1);
    const [formTeam, setFormTeam] = useState('');
    const [formPlayer, setFormPlayer] = useState('');
    const [formNotes, setFormNotes] = useState('');

    // Filter & Search Sidebar State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>('ALL');
    const [selectedSafeFilter, setSelectedSafeFilter] = useState<string>('ALL');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'timeAsc' | 'timeDesc' | 'recent' | 'location' | 'safeAsc'>('timeAsc');

    // Hover / Highlighting State
    const [hoveredRecordId, setHoveredRecordId] = useState<string | null>(null);

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
        if (!isAdmin) {
            alert("Faça login com a conta de admin para adicionar, editar ou remover registros de revividos.");
            return;
        }

        const prev = [...revivals];
        setRevivals(newRevivals);

        const storageKey = `studies_revives_${selectedMap.id}`;

        if (isFirebasePlaceholder) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(newRevivals));
            } catch (e) {
                console.error("Error writing local revival studies:", e);
                setRevivals(prev);
            }
            return;
        }

        try {
            await setDoc(doc(db, 'studies', `revives_${selectedMap.id}`), {
                mapId: selectedMap.id,
                revivals: JSON.stringify(newRevivals),
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error("Error saving revivals to Firestore:", error);
            setRevivals(prev);
            alert("Erro ao salvar registros no banco de dados.");
        }
    };

    // Open Modal for New Record (Map Click)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10;
        const yPercent = Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10;

        setClickCoords({ x: xPercent, y: yPercent });
        setEditingRecord(null);

        // Try to guess nearest location name or pick popular
        setFormLocation('');
        setFormTimeStr('03:00');
        setFormSafeNumber(1);
        setFormTeam('');
        setFormPlayer('');
        setFormNotes('');
        setShowModal(true);
    };

    // Open Modal for Editing Record
    const handleEditRecord = (rec: RevivalRecord, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingRecord(rec);
        setClickCoords({ x: rec.x, y: rec.y });
        setFormLocation(rec.locationName || '');
        setFormTimeStr(formatMinutesToMS(rec.timeInMinutes));
        setFormSafeNumber(rec.safeNumber || 1);
        setFormTeam(rec.teamName || '');
        setFormPlayer(rec.playerName || '');
        setFormNotes(rec.notes || '');
        setShowModal(true);
    };

    // Handle Form Submit
    const handleFormSubmit = (e: React.FormEvent) => {
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
                playerName: formPlayer.trim() || undefined,
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
                playerName: formPlayer.trim() || undefined,
                notes: formNotes.trim() || undefined,
                createdAt: Date.now()
            };
            saveRevivals([...revivals, newRec]);
        }

        setShowModal(false);
    };

    // Delete Record
    const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (window.confirm("Deseja remover este registro de revivido?")) {
            const filtered = revivals.filter(r => r.id !== id);
            saveRevivals(filtered);
        }
    };

    // Clear All
    const handleClearAll = () => {
        if (!isAdmin) {
            alert("Faça login com a conta de admin para limpar.");
            return;
        }
        if (window.confirm(`Tem certeza que deseja apagar TODOS os registros de revividos do mapa ${selectedMap.name}?`)) {
            saveRevivals([]);
        }
    };

    // Calculations & Statistics
    const totalCount = revivals.length;

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

    // Filtered & Sorted Revivals for the Lateral List
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

                            {/* Team & Player Optional Inputs */}
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
                                        Jogador Revivido (Opcional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formPlayer}
                                        onChange={e => setFormPlayer(e.target.value)}
                                        placeholder="Ex: Cauan7, Lost..."
                                        className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                                    />
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
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-emerald-500/20"
                                >
                                    {editingRecord ? 'Atualizar Registro' : 'Salvar Revivido'}
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

                            {/* Click layer */}
                            <div 
                                className="absolute inset-0 z-10" 
                                onClick={handleMapClick}
                            >
                                {revivals.map((rec) => {
                                    const isHovered = hoveredRecordId === rec.id;
                                    const teamLogo = rec.teamName ? findTeamLogo(rec.teamName, data?.teamsReference) : null;

                                    return (
                                        <div 
                                            key={rec.id}
                                            onClick={(e) => handleEditRecord(rec, e)}
                                            onMouseEnter={() => setHoveredRecordId(rec.id)}
                                            onMouseLeave={() => setHoveredRecordId(null)}
                                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-200 ${
                                                isHovered ? 'scale-125 z-30' : 'hover:scale-110'
                                            }`}
                                            style={{ left: `${rec.x}%`, top: `${rec.y}%` }}
                                        >
                                            {/* Pulse Aura */}
                                            <div className="absolute -inset-2 rounded-full bg-emerald-500/30 blur-sm animate-ping pointer-events-none"></div>

                                            {/* Pin Marker */}
                                            <div className={`relative flex items-center gap-1.5 px-2 py-1 rounded-xl border shadow-xl transition-all ${
                                                isHovered 
                                                ? 'bg-emerald-400 text-black border-white ring-2 ring-emerald-300' 
                                                : 'bg-black/90 text-emerald-400 border-emerald-500/60 hover:bg-emerald-950'
                                            }`}>
                                                {teamLogo ? (
                                                    <img src={teamLogo} alt={rec.teamName} className="w-3.5 h-3.5 object-contain rounded-full bg-black p-0.5" />
                                                ) : (
                                                    <HeartPulse size={12} className={isHovered ? 'text-black' : 'text-emerald-400'} />
                                                )}
                                                <span className="font-mono text-[10px] font-black tracking-tight">
                                                    {formatMinutesToMS(rec.timeInMinutes)}
                                                </span>
                                                <span className={`text-[8px] font-black px-1 py-0.2 rounded ${
                                                    isHovered ? 'bg-black text-yellow-300' : 'bg-yellow-400 text-black'
                                                }`}>
                                                    S{rec.safeNumber || 1}
                                                </span>
                                            </div>

                                            {/* Tooltip on Hover */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-black/95 border border-emerald-500/40 p-2.5 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40">
                                                <div className="font-black text-emerald-400 uppercase italic flex items-center justify-between gap-3">
                                                    <span>{rec.locationName}</span>
                                                    <span className="text-black bg-yellow-400 font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                                                        SAFE {rec.safeNumber || 1}
                                                    </span>
                                                </div>
                                                <div className="text-gray-300 font-mono font-bold mt-1">⏱️ {formatMinutesToMS(rec.timeInMinutes)} min</div>
                                                {rec.teamName && <div className="text-yellow-400 font-bold mt-0.5">🛡️ {rec.teamName}</div>}
                                                {rec.playerName && <div className="text-gray-400 font-medium">👤 {rec.playerName}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Tip */}
                    <div className="w-full flex items-center justify-between text-[11px] text-gray-400 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                        <span className="flex items-center gap-1.5">
                            <Info size={14} className="text-emerald-400" />
                            Clique em um ponto marcado no mapa para editar ou apagar.
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                            {revivals.length} Ponto{revivals.length !== 1 ? 's' : ''} Marcado{revivals.length !== 1 ? 's' : ''}
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
                                        setFormPlayer('');
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
                                                        {rec.playerName && (
                                                            <span className="text-gray-300 font-medium flex items-center gap-1">
                                                                <User size={10} /> {rec.playerName}
                                                            </span>
                                                        )}
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
