import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    AlertTriangle, Plus, Trash2, Edit3, Clock, Search, Filter,
    Download, Upload, ZoomIn, ZoomOut, Move, X, Shield,
    Info, Flame, Skull, Layers, BarChart2
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebasePlaceholder } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { DashboardData } from '../types';
import { HeatmapOverlay } from './HeatmapOverlay';

export interface DangerRecord {
    id: string;
    mapId: string; // BER, PUR, KAL, NT, SOL
    x: number; // 0-100 %
    y: number; // 0-100 %
    locationName?: string;
    timeInMinutes: number; // e.g. 3.5 = 3 min 30 s
    safeNumber: number; // 1, 2, 3, 4, 5, 6, 7, 8
    count?: number; // número de ocorrências de danger no local
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

interface DangerStudiesProps {
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

export const DangerStudies: React.FC<DangerStudiesProps> = ({
    maps,
    selectedMap,
    setSelectedMap,
    data,
    isAdmin,
    setShowAuthModal
}) => {
    const [dangers, setDangers] = useState<DangerRecord[]>([]);
    
    // Zoom & Pan Map State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<DangerRecord | null>(null);
    const [selectedGroupRecords, setSelectedGroupRecords] = useState<DangerRecord[]>([]);
    const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

    // Form State
    const [formLocation, setFormLocation] = useState('');
    const [formTimeStr, setFormTimeStr] = useState('03:00');
    const [formSafeNumber, setFormSafeNumber] = useState<number>(1);
    const [formCount, setFormCount] = useState<number>(1);
    const [formNotes, setFormNotes] = useState('');

    // Filter & Search Sidebar State
    const [searchFilter, setSearchFilter] = useState('');
    const [safeFilter, setSafeFilter] = useState<number | 'ALL'>('ALL');

    // Heatmap State
    const [heatmapMode, setHeatmapMode] = useState<'both' | 'heatmap' | 'markers'>('both');
    const [heatmapRadius, setHeatmapRadius] = useState<number>(45);

    const containerRef = useRef<HTMLDivElement>(null);

    // Load and Sync Dangers
    useEffect(() => {
        try {
            const saved = localStorage.getItem('danger_studies_records');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setDangers(parsed);
            }
        } catch (e) {
            console.error('Error loading danger records from localStorage:', e);
        }

        if (isFirebasePlaceholder) return;

        const unsubscribe = onSnapshot(doc(db, 'studies', 'dangers'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data && data.records) {
                    try {
                        const parsed = JSON.parse(data.records);
                        if (Array.isArray(parsed)) {
                            setDangers(parsed);
                            localStorage.setItem('danger_studies_records', JSON.stringify(parsed));
                        }
                    } catch (e) {
                        console.error('Error parsing dangers from firestore:', e);
                    }
                }
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'studies/dangers');
        });

        return () => unsubscribe();
    }, []);

    // Save Dangers
    const saveDangers = async (records: DangerRecord[]) => {
        setDangers(records);
        try {
            localStorage.setItem('danger_studies_records', JSON.stringify(records));
        } catch (e) {
            console.error('Error saving danger records:', e);
        }

        if (!isFirebasePlaceholder) {
            try {
                await setDoc(doc(db, 'studies', 'dangers'), {
                    mapId: 'dangers',
                    records: JSON.stringify(records),
                    updatedAt: Date.now()
                });
            } catch (error) {
                console.error('Error syncing dangers to Firestore:', error);
            }
        }
    };

    // Filtered records for current map
    const mapDangers = useMemo(() => {
        return dangers.filter(r => r.mapId === selectedMap.id);
    }, [dangers, selectedMap]);

    // Total Count of Dangers
    const totalDangerCount = useMemo(() => {
        return mapDangers.reduce((acc, item) => acc + (item.count || 1), 0);
    }, [mapDangers]);

    // Filtered Dangers for map rendering and sidebar list
    const filteredDangers = useMemo(() => {
        return mapDangers.filter(r => {
            const matchesSearch = !searchFilter || (r.locationName && r.locationName.toLowerCase().includes(searchFilter.toLowerCase())) || (r.notes && r.notes.toLowerCase().includes(searchFilter.toLowerCase()));
            const matchesSafe = safeFilter === 'ALL' || r.safeNumber === safeFilter || (safeFilter === 1 && !r.safeNumber);
            return matchesSearch && matchesSafe;
        });
    }, [mapDangers, searchFilter, safeFilter]);

    // Grouping nearby danger points (distance threshold ~ 3.5%) using filtered list
    const groupedDangers = useMemo(() => {
        const groups: {
            id: string;
            x: number;
            y: number;
            locationName: string;
            count: number;
            pct: string;
            items: DangerRecord[];
        }[] = [];

        const total = filteredDangers.reduce((acc, item) => acc + (item.count || 1), 0);

        filteredDangers.forEach(record => {
            const currentCount = record.count || 1;
            const existing = groups.find(g => Math.abs(g.x - record.x) <= 3.5 && Math.abs(g.y - record.y) <= 3.5);
            if (existing) {
                existing.count += currentCount;
                existing.items.push(record);
            } else {
                groups.push({
                    id: record.id,
                    x: record.x,
                    y: record.y,
                    locationName: record.locationName || 'Local Desconhecido',
                    count: currentCount,
                    pct: '0',
                    items: [record]
                });
            }
        });

        groups.forEach(g => {
            g.pct = total > 0 ? ((g.count / total) * 100).toFixed(1) : '0';
        });

        return groups;
    }, [filteredDangers]);

    const heatmapPoints = useMemo(() => {
        return groupedDangers.map(g => ({
            x: g.x,
            y: g.y,
            weight: g.count
        }));
    }, [groupedDangers]);

    // Map Click Action (Opens modal to specify Safe, Game Time and details)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        if (!isAdmin) { setShowAuthModal(true); return; }

        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10;
        const yPercent = Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10;

        const locName = `Ponto ${Math.round(xPercent)},${Math.round(yPercent)}`;

        // Find existing group nearby
        const existingGroup = groupedDangers.find(g => 
            Math.abs(g.x - xPercent) <= 3.5 && Math.abs(g.y - yPercent) <= 3.5
        );

        if (existingGroup && existingGroup.items.length > 0) {
            handleEditRecord(existingGroup.items[0], existingGroup.items);
        } else {
            const defaultSafe = safeFilter !== 'ALL' ? (typeof safeFilter === 'number' ? safeFilter : parseInt(String(safeFilter))) : 1;
            setEditingRecord(null);
            setSelectedGroupRecords([]);
            setClickCoords({ x: xPercent, y: yPercent });
            setFormLocation(locName);
            setFormTimeStr('03:00');
            setFormSafeNumber(defaultSafe);
            setFormCount(1);
            setFormNotes('');
            setShowModal(true);
        }
    };

    // Marker Click (Opens modal for viewing and adding records with custom Safe & Game Time)
    const handleMarkerClick = (group: typeof groupedDangers[0], e: React.MouseEvent) => {
        e.stopPropagation();

        handleEditRecord(group.items[0], group.items, e);
    };

    // Marker Right Click (-1 or delete)
    const handleMarkerRightClick = (group: typeof groupedDangers[0], e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdmin) { setShowAuthModal(true); return; }

        const mainRec = group.items[0];
        const currentCount = mainRec.count || 1;

        if (currentCount > 1) {
            const updated = dangers.map(r => r.id === mainRec.id ? {
                ...r,
                count: currentCount - 1
            } : r);
            saveDangers(updated);
        } else {
            const updated = dangers.filter(r => r.id !== mainRec.id);
            saveDangers(updated);
        }
    };

    // Open Modal for Editing Record / Viewing Group Records
    const handleEditRecord = (record: DangerRecord, groupItems?: DangerRecord[], e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingRecord(record);
        setSelectedGroupRecords(groupItems && groupItems.length > 0 ? groupItems : [record]);
        setClickCoords({ x: record.x, y: record.y });
        setFormLocation(record.locationName || '');
        setFormTimeStr(formatMinutesToMS(record.timeInMinutes));
        setFormSafeNumber(record.safeNumber || 1);
        setFormCount(record.count || 1);
        setFormNotes(record.notes || '');
        setShowModal(true);
    };

    // Save as a NEW record at the current spot
    const handleSaveAsNewRecord = (e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.preventDefault();
        const timeInMin = parseMSToMinutes(formTimeStr);

        if (clickCoords) {
            const newRec: DangerRecord = {
                id: 'danger_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: formLocation || 'Local Desconhecido',
                timeInMinutes: timeInMin,
                safeNumber: formSafeNumber,
                count: Math.max(1, formCount),
                notes: formNotes,
                createdAt: Date.now()
            };
            saveDangers([...dangers, newRec]);
        }
        setShowModal(false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        e.preventDefault();
        const timeInMin = parseMSToMinutes(formTimeStr);

        if (editingRecord) {
            const updated = dangers.map(r => r.id === editingRecord.id ? {
                ...r,
                locationName: formLocation || 'Local Desconhecido',
                timeInMinutes: timeInMin,
                safeNumber: formSafeNumber,
                count: Math.max(1, formCount),
                notes: formNotes
            } : r);
            saveDangers(updated);
        } else if (clickCoords) {
            const newRec: DangerRecord = {
                id: 'danger_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                mapId: selectedMap.id,
                x: clickCoords.x,
                y: clickCoords.y,
                locationName: formLocation || 'Local Desconhecido',
                timeInMinutes: timeInMin,
                safeNumber: formSafeNumber,
                count: Math.max(1, formCount),
                notes: formNotes,
                createdAt: Date.now()
            };
            saveDangers([...dangers, newRec]);
        }
        setShowModal(false);
    };

    const handleDeleteRecord = (id: string, e?: React.MouseEvent) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        if (e) e.stopPropagation();
        if (confirm('Deseja excluir esta zona de danger?')) {
            const updated = dangers.filter(r => r.id !== id);
            saveDangers(updated);
            if (editingRecord?.id === id) setShowModal(false);
        }
    };

    const handleClearMap = () => {
        if (confirm(`Tem certeza que deseja apagar TODOS os dados de Dangers no mapa ${selectedMap.name}?`)) {
            const updated = dangers.filter(r => r.mapId !== selectedMap.id);
            saveDangers(updated);
        }
    };

    // Export & Import JSON
    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dangers, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `estudos_dangers_${selectedMap.id}_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAdmin) { setShowAuthModal(true); return; }
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (Array.isArray(parsed)) {
                    saveDangers(parsed);
                    alert(`${parsed.length} registros de Danger importados com sucesso!`);
                } else {
                    alert('Arquivo JSON inválido.');
                }
            } catch (err) {
                alert('Erro ao importar JSON.');
            }
        };
        reader.readAsText(file);
    };

    // Safe Statistics
    const safeStats = useMemo(() => {
        const stats: Record<number, number> = {};
        for (let i = 1; i <= 7; i++) stats[i] = 0;

        mapDangers.forEach(r => {
            const s = r.safeNumber || 1;
            stats[s] = (stats[s] || 0) + (r.count || 1);
        });

        return stats;
    }, [mapDangers]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-3">
                        <AlertTriangle className="text-amber-500 animate-pulse" size={28} />
                        Estudos de Dangers (Zonas de Perigo)
                    </h1>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        Clique em qualquer ponto do mapa para marcar a zona de danger com Safe e Tempo de Jogo
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Map Switcher */}
                    <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                        {maps.map(map => (
                            <button 
                                key={map.id}
                                onClick={() => setSelectedMap(map)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                    selectedMap.id === map.id 
                                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {map.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleExportJSON}
                            className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                            title="Exportar dados de Dangers em JSON"
                        >
                            <Download size={14} className="text-amber-400" /> Exportar
                        </button>

                        <label className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer">
                            <Upload size={14} className="text-emerald-400" /> Importar
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

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Map Display (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-4 sm:p-6 flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
                        
                        {/* Map Controls Floating Overlay */}
                        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 bg-black/80 p-2 rounded-xl border border-gray-800 backdrop-blur-sm">
                            <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Aumentar Zoom">
                                <ZoomIn size={18} />
                            </button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Diminuir Zoom">
                                <ZoomOut size={18} />
                            </button>
                            <button onClick={() => {setZoom(1); setPan({x:0,y:0})}} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Resetar Posição">
                                <Move size={18} />
                            </button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={handleClearMap} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors" title="Limpar Dangers Deste Mapa">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Safe Zone Quick Filter Bar above Map */}
                        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-black/60 p-2.5 rounded-2xl border border-white/10 z-20">
                            <div className="flex items-center gap-2 shrink-0">
                                <Shield size={16} className="text-amber-400 shrink-0" />
                                <span className="text-xs font-black uppercase tracking-wider text-gray-200">
                                    Mostrar no Mapa:
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center">
                                <button
                                    type="button"
                                    onClick={() => setSafeFilter('ALL')}
                                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                        safeFilter === 'ALL'
                                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-black'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    Todas Safes
                                </button>
                                {[1, 2, 3, 4, 5, 6, 7].map(sNum => (
                                    <button
                                        key={sNum}
                                        type="button"
                                        onClick={() => setSafeFilter(safeFilter === sNum ? 'ALL' : sNum)}
                                        className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                            safeFilter === sNum
                                            ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/50'
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
                                <Flame size={15} className="text-amber-500 animate-pulse" />
                                <span className="font-bold text-gray-300">Modo de Visão:</span>
                                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setHeatmapMode('both')}
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                            heatmapMode === 'both'
                                            ? 'bg-amber-500 text-black font-black'
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
                                            ? 'bg-amber-500 text-black font-black'
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
                                            ? 'bg-amber-500 text-black font-black'
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
                                        <span className="font-mono text-xs font-bold text-amber-400">{heatmapRadius}px</span>
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

                        {/* Interactive Canvas Container */}
                        <div 
                            className="relative w-full aspect-square max-w-[800px] rounded-2xl overflow-hidden bg-[#0a0a0a] border-2 border-amber-500/30 cursor-crosshair shadow-inner flex items-center justify-center select-none"
                            ref={containerRef}
                            onWheel={(e) => {
                                e.preventDefault();
                                if (e.deltaY < 0) setZoom(z => Math.min(z + 0.2, 4));
                                else setZoom(z => Math.max(z - 0.2, 1));
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
                                    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                                }
                            }}
                            onMouseUp={() => setIsDragging(false)}
                            onMouseLeave={() => setIsDragging(false)}
                        >
                            <div 
                                className="relative w-full h-full transition-transform duration-75 ease-out origin-center"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                                }}
                            >
                                {/* Map Background Image */}
                                <img 
                                    src={selectedMap.url} 
                                    alt={selectedMap.name} 
                                    className="w-full h-full object-cover pointer-events-none"
                                />

                                {/* Heatmap Layer */}
                                <HeatmapOverlay
                                    points={heatmapPoints}
                                    visible={heatmapMode !== 'markers'}
                                    palette="danger"
                                    radius={heatmapRadius}
                                    opacity={0.8}
                                />

                                {/* Click layer */}
                                <div 
                                    className="absolute inset-0 z-10" 
                                    onClick={handleMapClick}
                                >

                                {/* Render Danger Pins */}
                                {groupedDangers.map((group) => {
                                    return (
                                        <div 
                                            key={group.id}
                                            onClick={(e) => handleMarkerClick(group, e)}
                                            onContextMenu={(e) => handleMarkerRightClick(group, e)}
                                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-200 ${
                                                heatmapMode === 'heatmap' ? 'opacity-40 hover:opacity-100 scale-90' : ''
                                            }`}
                                            style={{ left: `${group.x}%`, top: `${group.y}%` }}
                                            title="Clique para +1 | Botão Direito para -1 | Shift+Clique para Editar"
                                        >
                                            {/* Pulse Aura */}
                                            <div className="absolute -inset-2 rounded-full bg-amber-500/30 blur-sm animate-ping pointer-events-none"></div>

                                            {/* Pin Marker - Number inside Danger badge */}
                                            <div className="relative flex items-center justify-center rounded-full border-2 shadow-2xl transition-all bg-black/95 text-amber-400 border-amber-500 hover:bg-black group-hover:scale-110 group-hover:ring-4 group-hover:ring-amber-400/50 min-w-[32px] h-8 px-2 font-mono text-xs font-black">
                                                <AlertTriangle size={11} className="mr-1 text-amber-500 shrink-0" />
                                                {group.count}
                                            </div>

                                            {/* Tooltip on Hover (pointer-events-none so it doesn't block map clicks) */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-black/95 border border-amber-500/40 p-2.5 rounded-xl text-[10px] text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40 min-w-[180px]">
                                                <div className="font-black text-amber-400 uppercase italic flex items-center justify-between gap-3">
                                                    <span>{group.locationName}</span>
                                                    <span className="text-black bg-amber-400 font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                                                        {group.count} DANGER{group.count > 1 ? 'S' : ''}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-col gap-1 max-h-32 overflow-y-auto">
                                                    {group.items.map((rec, idx) => (
                                                        <div key={rec.id || idx} className="text-gray-300 font-mono text-[9px] border-t border-white/10 pt-0.5 flex justify-between">
                                                            <span>⏱️ {formatMinutesToMS(rec.timeInMinutes)} | Safe {rec.safeNumber}</span>
                                                            <span className="text-amber-400">x{rec.count || 1}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 border-t border-white/10 pt-1.5 flex items-center justify-between gap-2 text-[9px] font-semibold text-gray-400">
                                                    <span>⚡ Clique: +1 | 🖱️ Dir: -1</span>
                                                    <span className="text-amber-400 font-bold">Shift+Clique Editar</span>
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
                                <Info size={14} className="text-amber-400 shrink-0" />
                                <span>
                                    <strong className="text-white">Clique Esquerdo:</strong> +1 no local &nbsp;|&nbsp; 
                                    <strong className="text-white"> Botão Direito:</strong> -1 &nbsp;|&nbsp; 
                                    <strong className="text-white"> Shift + Clique:</strong> Detalhes
                                </span>
                            </span>
                            <span className="font-mono text-amber-400 font-bold shrink-0">
                                {totalDangerCount} Danger{totalDangerCount !== 1 ? 's' : ''} em {mapDangers.length} Ponto{mapDangers.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Analytics & Records (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                    
                    {/* Safe Breakdown Stats */}
                    <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-5 shadow-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <BarChart2 size={16} className="text-amber-400" />
                                Dangers por Safe
                            </h3>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                Total: {totalDangerCount}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {[1, 2, 3, 4, 5, 6, 7].map((sNum) => {
                                const count = safeStats[sNum] || 0;
                                const isSelected = safeFilter === sNum;
                                return (
                                    <button
                                        key={sNum}
                                        onClick={() => setSafeFilter(isSelected ? 'ALL' : sNum)}
                                        className={`p-2 rounded-xl border text-center transition-all ${
                                            isSelected 
                                            ? 'bg-amber-500 text-black border-amber-400 font-black' 
                                            : count > 0 
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                                            : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="text-[9px] font-bold uppercase tracking-wider">Safe {sNum}</div>
                                        <div className="text-sm font-black font-mono">{count}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Records List & Search */}
                    <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-5 shadow-2xl space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">
                                Locais ({filteredDangers.length})
                            </h3>
                            {safeFilter !== 'ALL' && (
                                <button 
                                    onClick={() => setSafeFilter('ALL')}
                                    className="text-[10px] text-amber-400 hover:underline font-bold"
                                >
                                    Limpar Filtro Safe
                                </button>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Buscar por local ou nota..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        {/* List items */}
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredDangers.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-500 font-semibold">
                                    Nenhum registro de danger encontrado.
                                </div>
                            ) : (
                                filteredDangers.map((rec) => (
                                    <div 
                                        key={rec.id}
                                        className="bg-black/40 border border-white/5 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 group transition-all"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-white truncate">
                                                    {rec.locationName || 'Local Desconhecido'}
                                                </span>
                                                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                                                    Safe {rec.safeNumber}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3 mt-1">
                                                <span>⏱️ {formatMinutesToMS(rec.timeInMinutes)}</span>
                                                <span>⚡ {rec.count || 1}x Danger</span>
                                            </div>
                                            {rec.notes && (
                                                <p className="text-[10px] text-gray-500 italic mt-0.5 truncate">
                                                    "{rec.notes}"
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                                            <button 
                                                onClick={(e) => handleEditRecord(rec, e)}
                                                className="p-1.5 bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 rounded-lg transition-colors"
                                                title="Editar Registro"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteRecord(rec.id, e)}
                                                className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                                title="Excluir Registro"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for Detailed Editing */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-black uppercase italic tracking-wider text-amber-400 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                {editingRecord ? 'Editar Registro de Danger' : 'Novo Registro de Danger'}
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Group Selection Pills */}
                        {selectedGroupRecords.length > 0 && (
                            <div className="bg-black/40 p-3 rounded-2xl border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                                    <span>Zonas de Danger neste local ({selectedGroupRecords.length}):</span>
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
                                                setFormCount(r.count || 1);
                                                setFormNotes(r.notes || '');
                                            }}
                                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                                editingRecord?.id === r.id
                                                ? 'bg-amber-500 text-black border-amber-400 font-black'
                                                : 'bg-black/80 text-amber-400 border-amber-500/30 hover:border-amber-500'
                                            }`}
                                        >
                                            #{i + 1} Safe {r.safeNumber || 1} ({formatMinutesToMS(r.timeInMinutes)}) - {r.count || 1}x
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingRecord(null);
                                            setFormTimeStr('03:00');
                                            setFormSafeNumber(1);
                                            setFormCount(1);
                                            setFormNotes('');
                                        }}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                            editingRecord === null
                                            ? 'bg-yellow-400 text-black border-yellow-300 font-black'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20'
                                        }`}
                                    >
                                        <Plus size={12} /> + Outro Registro Neste Local
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Location Name */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Nome do Local
                                </label>
                                <input 
                                    type="text"
                                    value={formLocation}
                                    onChange={(e) => setFormLocation(e.target.value)}
                                    placeholder="Ex: Peak, Brasilia, Central..."
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                                {POPULAR_LOCATIONS[selectedMap.id] && (
                                    <div className="flex flex-wrap gap-1 mt-2 max-h-16 overflow-y-auto">
                                        {POPULAR_LOCATIONS[selectedMap.id].map(loc => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => setFormLocation(loc)}
                                                className="text-[9px] font-bold bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-400 px-2 py-0.5 rounded border border-white/5"
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Safe Number & Game Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                        Em qual Safe ocorreu?
                                    </label>
                                    <select
                                        value={formSafeNumber}
                                        onChange={(e) => setFormSafeNumber(Number(e.target.value))}
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s}>Safe {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                        Tempo de Jogo (mm:ss)
                                    </label>
                                    <input 
                                        type="text"
                                        value={formTimeStr}
                                        onChange={(e) => setFormTimeStr(e.target.value)}
                                        placeholder="03:00"
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Count of Dangers */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Quantidade no Local
                                </label>
                                <input 
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={formCount}
                                    onChange={(e) => setFormCount(Number(e.target.value))}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                    Observações Táticas
                                </label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Detalhes adicionais sobre a zona de perigo..."
                                    rows={2}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-4 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest py-3 rounded-xl transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-amber-500/20"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
