import React, { useState, useEffect, useRef } from 'react';
import { Map, Trash2, Crosshair, ZoomIn, ZoomOut, Move, LogIn, LogOut, X, Download, Upload, Tv, Play, Plus, ExternalLink, Youtube, Film, Info, Shield } from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, isFirebasePlaceholder } from '../firebase';
import { OperationType, handleFirestoreError } from '../utils/firestoreError';
import { DashboardData } from '../types';
import { findTeamLogo } from '../utils/teamUtils';
import { getRestedTeamsInRound, parseRoundNumber } from '../utils/scheduleData';

const MAPS = [
    { id: 'BER', name: 'Bermuda', url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png' },
    { id: 'PUR', name: 'Purgatório', url: 'https://i.ibb.co/G4sGkqk1/image.png' },
    { id: 'KAL', name: 'Kalahari', url: 'https://i.ibb.co/7t4mHjWy/image.png' },
    { id: 'NT', name: 'Nova Terra', url: 'https://i.ibb.co/vC4pT91L/image.png' },
    { id: 'SOL', name: 'Solara', url: 'https://i.ibb.co/sdQ8hqbM/image.png' }
];

interface MapStreamItem {
    id: string;
    rodada: string;
    title: string;
    url: string;
    description?: string;
}

const DEFAULT_MAPSTREAMS: MapStreamItem[] = [
    {
        id: 'rd1',
        rodada: 'RD 1',
        title: 'RODADA 1 - Transmissão MapStream',
        url: 'https://www.youtube.com/live/x_HOvz_TI5c?si=lA4VLKWgJVqQLxK_',
        description: 'Transmissão tática / MapStream oficial da Rodada 1'
    },
    {
        id: 'rd2',
        rodada: 'RD 2',
        title: 'RODADA 2 - Transmissão MapStream',
        url: 'https://www.youtube.com/live/bKs_eLy4IbI?si=lE2_Nl_l_oCs-yTJ',
        description: 'Transmissão tática / MapStream oficial da Rodada 2'
    }
];

const getYouTubeVideoId = (url: string): string => {
    if (!url) return '';
    const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]+)/);
    if (liveMatch && liveMatch[1]) return liveMatch[1];
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];
    const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) return embedMatch[1];
    return '';
};

const getYouTubeEmbedUrl = (url: string): string => {
    const id = getYouTubeVideoId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    return url;
};

// Resolving clicking into a relative coordinate (0-100% of width/height).
// Or we can use a grid. Let's use a 50x50 grid.
const GRID_SIZE = 50; 

interface SafePoint {
    x: number;
    y: number;
    count: number;
}

interface StudiesProps {
    data?: DashboardData;
}

const Studies: React.FC<StudiesProps> = ({ data }) => {
    const [activeMainTab, setActiveMainTab] = useState<'safe' | 'mapstream'>('safe');

    // Safe Studies State
    const [selectedMap, setSelectedMap] = useState(MAPS[0]);
    const [points, setPoints] = useState<SafePoint[]>([]);
    
    // Zoom and Pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isAdmin, setIsAdmin] = useState(false);

    // MapStream State
    const [mapStreams, setMapStreams] = useState<MapStreamItem[]>(() => {
        try {
            const saved = localStorage.getItem('mapstreams_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Error loading mapstreams:", e);
        }
        return DEFAULT_MAPSTREAMS;
    });
    const [selectedStreamId, setSelectedStreamId] = useState<string>(() => DEFAULT_MAPSTREAMS[0]?.id || '');
    const [showAddStreamModal, setShowAddStreamModal] = useState(false);
    const [newRodada, setNewRodada] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // Auth Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authMessage, setAuthMessage] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);

    const saveMapStreamsData = async (streams: MapStreamItem[]) => {
        setMapStreams(streams);
        try {
            localStorage.setItem('mapstreams_data', JSON.stringify(streams));
        } catch (e) {
            console.error("Error saving mapstreams:", e);
        }

        if (!isFirebasePlaceholder) {
            try {
                await setDoc(doc(db, 'studies', 'mapstreams'), {
                    mapId: 'mapstreams',
                    streams: JSON.stringify(streams),
                    pin: '221120'
                });
            } catch (error) {
                console.error("Error syncing mapstreams to Firestore:", error);
            }
        }
    };

    useEffect(() => {
        if (isFirebasePlaceholder) return;

        const unsubscribe = onSnapshot(doc(db, 'studies', 'mapstreams'), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data && data.streams) {
                    try {
                        const parsed = JSON.parse(data.streams);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setMapStreams(parsed);
                        }
                    } catch (e) {
                        console.error("Error parsing mapstreams from firestore:", e);
                    }
                }
            } else {
                setDoc(doc(db, 'studies', 'mapstreams'), {
                    mapId: 'mapstreams',
                    streams: JSON.stringify(DEFAULT_MAPSTREAMS),
                    pin: '221120'
                }).catch(err => console.error("Error initializing mapstreams in firestore:", err));
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'studies/mapstreams');
        });

        return () => unsubscribe();
    }, []);

    const handleAddStream = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        const rdNum = mapStreams.length + 1;
        const streamItem: MapStreamItem = {
            id: 'rd_' + Date.now(),
            rodada: newRodada.trim() || `RD ${rdNum}`,
            title: newTitle.trim() || `RODADA ${rdNum} - MapStream`,
            url: newUrl.trim(),
            description: newDesc.trim() || `Transmissão MapStream - ${newRodada.trim() || 'Rodada ' + rdNum}`
        };
        const updated = [...mapStreams, streamItem];
        saveMapStreamsData(updated);
        setSelectedStreamId(streamItem.id);
        setNewRodada('');
        setNewTitle('');
        setNewUrl('');
        setNewDesc('');
        setShowAddStreamModal(false);
    };

    const handleDeleteStream = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Deseja realmente remover esta transmissão de MapStream?")) {
            const updated = mapStreams.filter(s => s.id !== id);
            saveMapStreamsData(updated);
            if (selectedStreamId === id && updated.length > 0) {
                setSelectedStreamId(updated[0].id);
            }
        }
    };

    useEffect(() => {
        setPoints([]);
        setZoom(1);
        setPan({ x: 0, y: 0 });

        if (isFirebasePlaceholder) {
            try {
                const saved = localStorage.getItem('studies_' + selectedMap.id);
                if (saved) {
                    setPoints(JSON.parse(saved));
                } else {
                    setPoints([]);
                }
            } catch (e) {
                console.error("Error reading local studies data:", e);
                setPoints([]);
            }
            return; // Exit early, no snapshot needed
        }

        const unsubscribeSnapshot = onSnapshot(doc(db, 'studies', selectedMap.id), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data && data.points) {
                    try {
                        const parsed = JSON.parse(data.points);
                        setPoints(parsed);
                    } catch (e) {
                        setPoints([]);
                    }
                } else {
                    setPoints([]);
                }
            } else {
                setPoints([]);
            }
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, `studies/${selectedMap.id}`);
        });

        return () => unsubscribeSnapshot();
    }, [selectedMap]);

    const savePoints = async (newPoints: SafePoint[]) => {
        if (!isAdmin) {
            alert("Faça login com a conta de admin para adicionar ou remover marcações.");
            return;
        }

        const previousPoints = [...points];
        setPoints(newPoints); // Optimistic UI update

        if (isFirebasePlaceholder) {
            try {
                localStorage.setItem('studies_' + selectedMap.id, JSON.stringify(newPoints));
            } catch (e) {
                console.error("Error writing local studies data:", e);
                setPoints(previousPoints);
                alert("Erro ao salvar pontos localmente.");
            }
            return;
        }

        try {
            await setDoc(doc(db, 'studies', selectedMap.id), {
                mapId: selectedMap.id,
                points: JSON.stringify(newPoints),
                pin: '221120'
            });
        } catch (error) {
            console.error(error);
            setPoints(previousPoints); // Revert on failure
            alert("Permissão negada ou erro ao salvar pontos.");
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setAuthMessage('');
        
        if (authPassword === '221120') {
            setIsAdmin(true);
            setShowAuthModal(false);
            setAuthPassword('');
        } else {
            setAuthError("Senha incorreta!");
        }
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return; // Prevent adding points when dragging
        
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Compute click coordinates relative to the original image dimensions without zoom
        // rect width and height are the visual size (including zoom if transformed, but we attach click to the inner container or image)
        
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        // Snap to grid or just use coordinate points and cluster them visually
        // Clustering visually via overlapping radial gradients is smoother, 
        // but user asked "numero de vezes em que a safe fechou ao clicar... vai acrescentando a quantidade".
        // Let's quantize the coordinates to 2% blocks (e.g. 50x50 grid)
        const cellX = Math.floor(xPercent / 2) * 2;
        const cellY = Math.floor(yPercent / 2) * 2;

        const existingPointIndex = points.findIndex(p => p.x === cellX && p.y === cellY);

        if (existingPointIndex >= 0) {
            const newPoints = [...points];
            newPoints[existingPointIndex].count += 1;
            savePoints(newPoints);
        } else {
            savePoints([...points, { x: cellX, y: cellY, count: 1 }]);
        }
    };

    const handleMapRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        const cellX = Math.floor(xPercent / 2) * 2;
        const cellY = Math.floor(yPercent / 2) * 2;

        const existingPointIndex = points.findIndex(p => p.x === cellX && p.y === cellY);

        if (existingPointIndex >= 0) {
            const newPoints = [...points];
            if (newPoints[existingPointIndex].count > 1) {
                newPoints[existingPointIndex].count -= 1;
            } else {
                newPoints.splice(existingPointIndex, 1);
            }
            savePoints(newPoints);
        }
    }

    const handleClear = () => {
        if (!isAdmin) {
            alert("Faça login com a conta de admin para usar esta função.");
            return;
        }
        if (window.confirm("Deseja realmente limpar todos os pontos deste mapa?")) {
            savePoints([]);
        }
    };

    const handleExportJSON = () => {
        try {
            const exportData: Record<string, SafePoint[]> = {};
            MAPS.forEach(m => {
                const saved = localStorage.getItem('studies_' + m.id);
                if (saved) {
                    try {
                        exportData[m.id] = JSON.parse(saved);
                    } catch (e) {
                        exportData[m.id] = [];
                    }
                } else if (m.id === selectedMap.id) {
                    exportData[m.id] = points;
                }
            });

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estudos_safe_${selectedMap.id}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Erro ao exportar JSON:", e);
            alert("Erro ao exportar dados.");
        }
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const importedData = JSON.parse(content);

                if (importedData[selectedMap.id] && Array.isArray(importedData[selectedMap.id])) {
                    await savePoints(importedData[selectedMap.id]);
                } else if (Array.isArray(importedData)) {
                    await savePoints(importedData);
                } else {
                    Object.keys(importedData).forEach(mapId => {
                        if (Array.isArray(importedData[mapId])) {
                            if (isFirebasePlaceholder) {
                                localStorage.setItem('studies_' + mapId, JSON.stringify(importedData[mapId]));
                            }
                        }
                    });
                    if (importedData[selectedMap.id]) {
                        setPoints(importedData[selectedMap.id]);
                    }
                }
                alert("Estudos de Safe importados com sucesso!");
            } catch (err) {
                console.error("Erro ao importar arquivo JSON:", err);
                alert("Formato de arquivo JSON de estudos inválido.");
            }
        };
        reader.readAsText(file);
    };

    const maxCount = Math.max(...points.map(p => p.count), 1);
    const activeStream = mapStreams.find(s => s.id === selectedStreamId) || mapStreams[0];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 relative">
            
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button 
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-black uppercase italic tracking-widest text-white mb-6">Autenticação</h2>
                        
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Senha de Administrador</label>
                                <input 
                                    type="password" 
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                    required
                                    autoFocus
                                    placeholder="Digite a senha..."
                                />
                            </div>

                            {authError && <div className="text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{authError}</div>}
                            {authMessage && <div className="text-green-500 text-sm font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20">{authMessage}</div>}

                            <div className="flex flex-col gap-3 pt-4">
                                <button type="submit" className="w-full bg-yellow-500 text-black font-black uppercase tracking-widest py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddStreamModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
                        <button 
                            onClick={() => setShowAddStreamModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-2xl border border-yellow-500/20">
                                <Tv size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-widest text-white">Adicionar MapStream</h2>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cadastre a transmissão do YouTube para cada rodada</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddStream} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Identificador da Rodada (Ex: RD 3)</label>
                                <input 
                                    type="text" 
                                    value={newRodada}
                                    onChange={e => setNewRodada(e.target.value)}
                                    placeholder="Ex: RD 3 - RODADA 3"
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Título do Vídeo / Transmissão</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    placeholder="Ex: Rodada 3 - Visão Tática Completa"
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Link do YouTube (Live ou Vídeo)</label>
                                <input 
                                    type="url" 
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/live/..."
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-sm font-mono"
                                    required
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block">Funciona com links não listados ou públicos do YouTube.</span>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Descrição / Observações (Opcional)</label>
                                <textarea 
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Anotações sobre as partidas da rodada..."
                                    rows={3}
                                    className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 text-sm resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddStreamModal(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase tracking-widest py-3 rounded-xl transition-colors text-xs"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest py-3 rounded-xl transition-colors text-xs shadow-lg shadow-yellow-500/20"
                                >
                                    Salvar Transmissão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Top Navigation Tabs: Estudos de Safe vs MapStream */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-800 pb-4">
                <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5 shadow-inner w-full md:w-auto">
                    <button
                        onClick={() => setActiveMainTab('safe')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeMainTab === 'safe'
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-102'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Crosshair size={16} />
                        Estudos de Safe
                    </button>
                    <button
                        onClick={() => setActiveMainTab('mapstream')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeMainTab === 'mapstream'
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-102'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Tv size={16} />
                        MapStream
                        <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                            {mapStreams.length}
                        </span>
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                    <a
                        href="https://drive.google.com/drive/folders/1jEmQK1mLpQf8aler6-KlsTgd4CIWaK3k?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/30 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
                    >
                        <Film size={16} />
                        <span>DRIVE DE REPLAYS DA FFWSBR 2026</span>
                        <ExternalLink size={14} />
                    </a>

                    {activeMainTab === 'mapstream' ? (
                        <button
                            onClick={() => setShowAddStreamModal(true)}
                            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-500/20"
                        >
                            <Plus size={16} /> Adicionar MapStream
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            {isAdmin ? (
                                <button onClick={() => setIsAdmin(false)} className="text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors border border-red-500/20">
                                    <LogOut size={12} /> Sair (Admin)
                                </button>
                            ) : (
                                <button onClick={() => setShowAuthModal(true)} className="text-xs font-bold text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors border border-yellow-500/20">
                                    <LogIn size={12} /> Login Admin
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* TAB 1: ESTUDOS DE SAFE */}
            {activeMainTab === 'safe' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black uppercase italic tracking-widest text-white shadow-sm flex flex-wrap items-center gap-4">
                                Fechamento de Safes
                                {isFirebasePlaceholder && (
                                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 uppercase tracking-widest h-fit">
                                        Modo Local (Offline)
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Clique no mapa para registrar onde a safe fechou. Botão direito remove.</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                                {MAPS.map(map => (
                                    <button 
                                        key={map.id}
                                        onClick={() => setSelectedMap(map)}
                                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                            selectedMap.id === map.id 
                                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
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
                                    className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                                    title="Baixar arquivo dos estudos para compartilhar"
                                >
                                    <Download size={14} className="text-yellow-400" /> Exportar JSON
                                </button>

                                <label className="bg-white/5 hover:bg-white/10 text-white border border-gray-800 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer">
                                    <Upload size={14} className="text-emerald-400" /> Importar JSON
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

                    <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 p-6 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
                        {/* Controls */}
                        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2 bg-black/80 p-2 rounded-xl border border-gray-800 backdrop-blur-sm">
                            <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom In">
                                <ZoomIn size={20} />
                            </button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Zoom Out">
                                <ZoomOut size={20} />
                            </button>
                            <button onClick={() => {setZoom(1); setPan({x:0,y:0})}} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Reset">
                                <Move size={20} />
                            </button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={handleClear} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors" title="Limpar Mapa">
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div 
                            className="relative w-full max-w-[800px] aspect-square rounded-2xl overflow-hidden bg-[#0a0a0a] border-2 border-gray-800 cursor-crosshair shadow-inner flex items-center justify-center"
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
                                    className="w-full h-full object-cover select-none pointer-events-none opacity-80" 
                                    draggable={false}
                                />

                                <div 
                                    className="absolute inset-0 z-10" 
                                    onClick={handleMapClick}
                                    onContextMenu={handleMapRightClick}
                                >
                                    {points.map((p, i) => {
                                        const intensity = p.count / maxCount;
                                        
                                        let bgColor = 'bg-yellow-400';
                                        if (intensity > 0.3) bgColor = 'bg-orange-500';
                                        if (intensity > 0.6) bgColor = 'bg-red-500';
                                        if (intensity > 0.8) bgColor = 'bg-red-600';

                                        return (
                                            <div 
                                                key={i}
                                                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                                                style={{ left: `${p.x + 1}%`, top: `${p.y + 1}%` }}
                                            >
                                                <div className={`absolute w-12 h-12 rounded-full ${bgColor} blur-md opacity-40 mix-blend-screen`}></div>
                                                <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                                                    <div className="bg-black/80 rounded-sm border border-white/20 px-1 py-0.5 shadow-xl text-center flex flex-col items-center min-w-[20px]">
                                                        <span className={`text-[10px] font-black text-white leading-none`}>{p.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6 bg-black/40 px-8 py-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Crosshair size={18} className="text-yellow-500" />
                                <div>
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total de Fechamentos Marcados</span>
                                    <span className="block text-xl font-black text-white italic leading-none">{points.reduce((acc, p) => acc + p.count, 0)}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-gray-800 mx-2"></div>
                            <div className="flex items-center gap-3">
                                <Map size={18} className="text-blue-500" />
                                <div>
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">Zonas Distintas</span>
                                    <span className="block text-xl font-black text-white italic leading-none">{points.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MAPSTREAM */}
            {activeMainTab === 'mapstream' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-3">
                                <Tv className="text-yellow-500" size={28} />
                                MapStream - Transmissões por Rodada
                            </h1>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                                Assista e analise a visão tática MapStream de cada rodada da competição
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
                            <Youtube className="text-red-500" size={18} />
                            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                                {mapStreams.length} Transmissão{mapStreams.length !== 1 ? 'ões' : ''} Cadastrada{mapStreams.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Video Player Container */}
                        <div className="lg:col-span-8 space-y-4">
                            {activeStream ? (
                                (() => {
                                    const activeRoundNum = parseRoundNumber(activeStream.rodada) || parseRoundNumber(activeStream.title) || parseRoundNumber(activeStream.id);
                                    const activeRestedTeams = activeRoundNum ? getRestedTeamsInRound(activeRoundNum) : [];

                                    return (
                                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-yellow-500 text-black font-black text-xs px-3 py-1 rounded-lg uppercase tracking-wider shadow-md">
                                                        {activeStream.rodada}
                                                    </span>
                                                    <h3 className="text-lg font-black text-white uppercase italic tracking-wider">
                                                        {activeStream.title}
                                                    </h3>
                                                </div>
                                                <a 
                                                    href={activeStream.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-xl transition-all"
                                                >
                                                    <ExternalLink size={14} /> Abrir no YouTube
                                                </a>
                                            </div>

                                            {/* Video Embed Iframe */}
                                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-inner">
                                                {getYouTubeVideoId(activeStream.url) ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(activeStream.url)}
                                                        title={activeStream.title}
                                                        className="w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    ></iframe>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6 bg-gradient-to-b from-gray-900 to-black">
                                                        <Youtube size={48} className="text-red-500 opacity-80" />
                                                        <div>
                                                            <p className="text-white font-bold text-sm">Não foi possível gerar player automático</p>
                                                            <p className="text-gray-500 text-xs mt-1">Acesse diretamente pelo link oficial do YouTube</p>
                                                        </div>
                                                        <a 
                                                            href={activeStream.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
                                                        >
                                                            <Play size={14} /> Assistir no YouTube
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Rested Teams Block for Active Round */}
                                            {activeRoundNum && (
                                                <div className="bg-[#121215] border border-yellow-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                                                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/10">
                                                        <div className="flex items-center gap-2">
                                                            <Shield size={18} className="text-yellow-500" />
                                                            <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400">
                                                                Times que Folgaram ({activeStream.rodada || `Rodada ${activeRoundNum}`})
                                                            </h4>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">
                                                            {activeRestedTeams.length} {activeRestedTeams.length === 1 ? 'Time' : 'Times'} em Folga
                                                        </span>
                                                    </div>

                                                    {activeRestedTeams.length > 0 ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {activeRestedTeams.map((teamName) => {
                                                                const logo = findTeamLogo(teamName, data?.teamsReference);
                                                                return (
                                                                    <div
                                                                        key={teamName}
                                                                        className="flex items-center gap-3 bg-black/60 border border-white/10 hover:border-yellow-500/40 p-3 rounded-xl transition-all shadow-inner"
                                                                    >
                                                                        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-md">
                                                                            {logo ? (
                                                                                <img src={logo} alt={teamName} className="w-full h-full object-contain" />
                                                                            ) : (
                                                                                <Shield size={18} className="text-yellow-500/60" />
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className="text-xs font-black text-white uppercase italic truncate block">
                                                                                {teamName}
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-yellow-400/90 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                                                                Folga Oficial
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 italic">Nenhum time em folga nesta rodada.</p>
                                                    )}
                                                </div>
                                            )}

                                            {activeStream.description && (
                                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-300 space-y-1">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Sobre esta transmissão</span>
                                                    <p className="leading-relaxed font-medium">{activeStream.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-12 text-center space-y-4">
                                    <Film size={48} className="text-gray-600 mx-auto" />
                                    <p className="text-white font-bold text-base">Nenhuma transmissão selecionada</p>
                                    <p className="text-gray-500 text-xs">Adicione um novo link de MapStream para começar a estudar as rodadas.</p>
                                </div>
                            )}
                        </div>

                        {/* Stream List / Selector Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-5 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Film className="text-yellow-500" size={18} />
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Rodadas Cadastradas</h4>
                                    </div>
                                    <button
                                        onClick={() => setShowAddStreamModal(true)}
                                        className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 hover:bg-yellow-500/20 px-2.5 py-1 rounded-lg border border-yellow-500/20 transition-all flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Novo Link
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                                    {mapStreams.map((stream) => {
                                        const videoId = getYouTubeVideoId(stream.url);
                                        const isSelected = stream.id === selectedStreamId;
                                        const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
                                        const roundNum = parseRoundNumber(stream.rodada) || parseRoundNumber(stream.title) || parseRoundNumber(stream.id);
                                        const restedTeams = roundNum ? getRestedTeamsInRound(roundNum) : [];

                                        return (
                                            <div
                                                key={stream.id}
                                                onClick={() => setSelectedStreamId(stream.id)}
                                                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                                                    isSelected
                                                    ? 'bg-yellow-500/10 border-yellow-500 shadow-lg shadow-yellow-500/10'
                                                    : 'bg-black/30 border-white/5 hover:border-gray-700 hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Thumbnail preview */}
                                                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 flex items-center justify-center">
                                                        {thumbUrl ? (
                                                            <img src={thumbUrl} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        ) : (
                                                            <Youtube size={24} className="text-red-500 opacity-60" />
                                                        )}
                                                        <div className={`absolute inset-0 flex items-center justify-center ${isSelected ? 'bg-yellow-500/30' : 'bg-black/40 group-hover:bg-black/20'} transition-all`}>
                                                            <Play size={18} className={isSelected ? 'text-yellow-400 fill-yellow-400' : 'text-white opacity-80'} />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                        <div>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                                isSelected ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-300'
                                                            }`}>
                                                                {stream.rodada}
                                                            </span>
                                                            <h5 className="text-xs font-bold text-white uppercase italic truncate mt-1">
                                                                {stream.title}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
                                                            <span className="truncate">YouTube Stream</span>
                                                            <button
                                                                onClick={(e) => handleDeleteStream(stream.id, e)}
                                                                className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                                                                title="Remover vídeo"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rested teams badge inside list card */}
                                                {restedTeams.length > 0 && (
                                                    <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                                                            <Shield size={10} /> Folgam:
                                                        </span>
                                                        {restedTeams.map((team) => (
                                                            <span
                                                                key={team}
                                                                className="text-[9px] font-bold text-gray-300 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 truncate max-w-[120px]"
                                                                title={team}
                                                            >
                                                                {team}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <a
                                href="https://drive.google.com/drive/folders/1jEmQK1mLpQf8aler6-KlsTgd4CIWaK3k?usp=sharing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border border-blue-500/30 hover:border-blue-400/60 rounded-2xl p-4 transition-all shadow-xl hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0 group-hover:scale-110 transition-transform">
                                        <Film size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 text-blue-400 font-black text-[11px] uppercase tracking-wider">
                                            <span>DRIVE DE REPLAYS DA FFWSBR 2026</span>
                                            <ExternalLink size={12} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                                            Acesse o diretório completo com replays e arquivos de vídeo
                                        </p>
                                    </div>
                                </div>
                            </a>

                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
                                <div className="flex items-center gap-2 text-yellow-500 font-bold">
                                    <Info size={14} /> Dica de Estudo
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-500">
                                    Os vídeos do MapStream mostram a transmissão ao vivo não listada das rodadas da Copa. Adicione links de novas rodadas a qualquer momento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Studies;

