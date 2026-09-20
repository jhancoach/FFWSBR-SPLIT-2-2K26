import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Move, Trash2, Crosshair, Layers, Compass } from 'lucide-react';
import { MAPS_CONFIG, MapMetadata, preloadAllMaps, isMapImageLoaded } from '../utils/mapPreloader';

interface FastMapViewProps {
    selectedMap: { id: string; name: string; url: string };
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    onMapClick?: (e: React.MouseEvent<HTMLDivElement>, coords: { x: number; y: number; xPercent: number; yPercent: number }) => void;
    onMapRightClick?: (e: React.MouseEvent<HTMLDivElement>, coords: { x: number; y: number; xPercent: number; yPercent: number }) => void;
    onClearMap?: () => void;
    showClearButton?: boolean;
    isAdmin?: boolean;
    children?: React.ReactNode;
    overlayLayer?: React.ReactNode;
    extraControls?: React.ReactNode;
    showLandmarks?: boolean;
}

export const FastMapView: React.FC<FastMapViewProps> = ({
    selectedMap,
    zoom,
    setZoom,
    pan,
    setPan,
    onMapClick,
    onMapRightClick,
    onClearMap,
    showClearButton = false,
    isAdmin = false,
    children,
    overlayLayer,
    extraControls,
    showLandmarks = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loadedMaps, setLoadedMaps] = useState<Record<string, boolean>>({});
    const [clickFeedback, setClickFeedback] = useState<{ x: number; y: number; id: number } | null>(null);

    useEffect(() => {
        preloadAllMaps();
        // Check which maps are already cached
        const initialStatus: Record<string, boolean> = {};
        MAPS_CONFIG.forEach(m => {
            if (isMapImageLoaded(m.url)) {
                initialStatus[m.id] = true;
            }
        });
        setLoadedMaps(prev => ({ ...prev, ...initialStatus }));
    }, []);

    const currentMeta = MAPS_CONFIG.find(m => 
        m.id === selectedMap.id ||
        m.name.toLowerCase() === selectedMap.name?.toLowerCase() ||
        m.id.toLowerCase() === selectedMap.id?.toLowerCase() ||
        m.name.toLowerCase() === selectedMap.id?.toLowerCase() ||
        (selectedMap.url && m.url === selectedMap.url)
    ) || MAPS_CONFIG[0];

    const handleImageLoad = (mapId: string) => {
        setLoadedMaps(prev => ({ ...prev, [mapId]: true }));
    };

    const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Middle button or Alt key allows dragging
        if (e.button === 1 || e.altKey) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        // Create quick visual ripple
        setClickFeedback({ x: xPercent, y: yPercent, id: Date.now() });

        if (onMapClick) {
            onMapClick(e, { x: xPercent, y: yPercent, xPercent, yPercent });
        }
    };

    const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        if (onMapRightClick) {
            onMapRightClick(e, { x: xPercent, y: yPercent, xPercent, yPercent });
        }
    };

    return (
        <div className="relative w-full max-w-[800px] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0d0d12] border-2 border-gray-800 cursor-crosshair shadow-2xl flex items-center justify-center select-none group">
            {/* Top Right Tactical Map Controls */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5 bg-black/85 p-1.5 rounded-xl border border-gray-800/80 backdrop-blur-md shadow-xl">
                <button
                    onClick={() => setZoom(z => Math.min(z + 0.4, 4))}
                    className="p-2 bg-white/5 hover:bg-white/15 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Aproximar Zoom (+)"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(z - 0.4, 1))}
                    className="p-2 bg-white/5 hover:bg-white/15 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Afastar Zoom (-)"
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                    className="p-2 bg-white/5 hover:bg-white/15 rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Centralizar e Resetar Posição"
                >
                    <Move size={18} />
                </button>

                {extraControls}

                {showClearButton && onClearMap && (
                    <>
                        <div className="h-px bg-white/10 my-0.5"></div>
                        <button
                            onClick={onClearMap}
                            className="p-2 bg-red-500/10 hover:bg-red-500/25 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title={isAdmin ? "Limpar todos os pontos deste mapa" : "Login de Admin necessário para limpar"}
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Bottom Left Tactical Compass / Scale Indicator */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Compass size={12} className="text-yellow-500 animate-spin-slow" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">
                    {selectedMap.name} • {zoom > 1 ? `${Math.round(zoom * 100)}% ZOOM` : '100%'}
                </span>
            </div>

            {/* Main Interactive Stage */}
            <div
                ref={containerRef}
                className="w-full h-full relative overflow-hidden"
                onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        setZoom(z => Math.min(z + 0.2, 4));
                    } else {
                        setZoom(z => Math.max(z - 0.2, 1));
                    }
                }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
            >
                <div
                    className="relative w-full h-full transition-transform duration-75 ease-out origin-center"
                    style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
                >
                    {/* Tactical Blueprint Grid & Landmark Contours Fallback (Always Ready in 0ms) */}
                    <div className="absolute inset-0 bg-[#08080c] pointer-events-none">
                        {/* Grid lines */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)
                                `,
                                backgroundSize: '10% 10%'
                            }}
                        />
                        {/* Radar circle */}
                        <div className="absolute inset-[15%] rounded-full border border-yellow-500/10 pointer-events-none" />
                        <div className="absolute inset-[30%] rounded-full border border-yellow-500/15 pointer-events-none" />
                        <div className="absolute inset-[45%] rounded-full border border-yellow-500/20 pointer-events-none" />

                        {/* Map Watermark Name in Background */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-4xl sm:text-6xl font-black uppercase italic tracking-[0.25em] text-white/[0.03] select-none">
                                {selectedMap.name}
                            </span>
                        </div>

                        {/* Landmark Badges (Helps user immediately locate coordinates) */}
                        {showLandmarks && currentMeta.landmarks.map((lm, idx) => (
                            <div
                                key={idx}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                                style={{ left: `${lm.x}%`, top: `${lm.y}%` }}
                            >
                                <div className="flex items-center gap-1 opacity-25 group-hover:opacity-40 transition-opacity">
                                    <div className="w-1 h-1 rounded-full bg-white/40"></div>
                                    <span className="text-[8px] font-mono font-bold tracking-wider text-white/50 uppercase whitespace-nowrap">
                                        {lm.name}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pre-rendered / Cached Map Images */}
                    {MAPS_CONFIG.map(map => {
                        const isCurrent = 
                            map.id === selectedMap.id ||
                            map.name.toLowerCase() === selectedMap.name?.toLowerCase() ||
                            map.id.toLowerCase() === selectedMap.id?.toLowerCase() ||
                            map.name.toLowerCase() === selectedMap.id?.toLowerCase() ||
                            (Boolean(selectedMap.url) && map.url === selectedMap.url);

                        return (
                            <img
                                key={map.id}
                                src={map.url}
                                alt={map.name}
                                referrerPolicy="no-referrer"
                                onLoad={() => handleImageLoad(map.id)}
                                loading="eager"
                                decoding="async"
                                draggable={false}
                                className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
                                    isCurrent ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
                                }`}
                            />
                        );
                    })}

                    {/* Fallback direct map image if selectedMap.url is custom */}
                    {selectedMap.url && !MAPS_CONFIG.some(m => m.url === selectedMap.url || m.id === selectedMap.id) && (
                        <img
                            src={selectedMap.url}
                            alt={selectedMap.name || 'Mapa'}
                            referrerPolicy="no-referrer"
                            loading="eager"
                            decoding="async"
                            draggable={false}
                            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 opacity-100"
                        />
                    )}

                    {/* Custom Overlay Layer (e.g. Heatmaps) */}
                    {overlayLayer && (
                        <div className="absolute inset-0 z-10 pointer-events-none">
                            {overlayLayer}
                        </div>
                    )}

                    {/* Interactive Click Handler Layer */}
                    <div
                        className="absolute inset-0 z-20 cursor-crosshair"
                        onClick={handleClick}
                        onContextMenu={handleRightClick}
                    >
                        {/* Dynamic Visual Click Feedback Ripple */}
                        {clickFeedback && (
                            <div
                                key={clickFeedback.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                                style={{ left: `${clickFeedback.x}%`, top: `${clickFeedback.y}%` }}
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-yellow-400 animate-ping opacity-80" />
                                <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] absolute inset-0 m-auto" />
                            </div>
                        )}

                        {/* Child Interactive Markers & Pins */}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
