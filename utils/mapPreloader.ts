// High-performance Map Preloader and Instant Caching for Estudos and Map Visualizers

export interface MapMetadata {
    id: string;
    name: string;
    url: string;
    accentColor: string;
    landmarks: { name: string; x: number; y: number }[];
}

export const MAPS_CONFIG: MapMetadata[] = [
    {
        id: 'BER',
        name: 'Bermuda',
        url: 'https://i.ibb.co/q34yct8f/BERMUDA-MAPA.png',
        accentColor: '#eab308',
        landmarks: [
            { name: 'Peak', x: 48, y: 49 },
            { name: 'Bimasakti', x: 52, y: 60 },
            { name: 'Pochinok', x: 41, y: 70 },
            { name: 'Clock Tower', x: 34, y: 57 },
            { name: 'Hangar', x: 32, y: 46 },
            { name: 'Observatory', x: 18, y: 36 },
            { name: 'Mill', x: 77, y: 38 },
            { name: 'Plantation', x: 33, y: 36 },
            { name: 'Shipyard', x: 48, y: 20 },
            { name: 'Katulistiwa', x: 44, y: 38 },
            { name: 'Cape Town', x: 86, y: 75 },
            { name: 'Graveyard', x: 30, y: 27 },
            { name: 'Rim Nam', x: 14, y: 65 },
            { name: 'Mars Electric', x: 50, y: 88 },
            { name: 'Factory', x: 56, y: 68 }
        ]
    },
    {
        id: 'PUR',
        name: 'Purgatório',
        url: 'https://i.ibb.co/G4sGkqk1/image.png',
        accentColor: '#f97316',
        landmarks: [
            { name: 'Brasilia', x: 51, y: 48 },
            { name: 'Central', x: 50, y: 72 },
            { name: 'Forge', x: 66, y: 65 },
            { name: 'Moathouse', x: 75, y: 32 },
            { name: 'Marbleworks', x: 33, y: 36 },
            { name: 'Fields', x: 38, y: 55 },
            { name: 'Quarry', x: 24, y: 65 },
            { name: 'Fire Brigade', x: 68, y: 48 },
            { name: 'Campsite', x: 60, y: 23 },
            { name: 'Ski Lodge', x: 78, y: 20 },
            { name: 'Lumber Mill', x: 82, y: 54 },
            { name: 'Mt. Villa', x: 22, y: 85 }
        ]
    },
    {
        id: 'KAL',
        name: 'Kalahari',
        url: 'https://i.ibb.co/7t4mHjWy/image.png',
        accentColor: '#eab308',
        landmarks: [
            { name: 'Refinery', x: 51, y: 47 },
            { name: 'Command Post', x: 45, y: 36 },
            { name: 'The Sub', x: 32, y: 56 },
            { name: 'Bayfront', x: 68, y: 52 },
            { name: 'Confinement', x: 35, y: 32 },
            { name: 'Mammoth', x: 68, y: 30 },
            { name: 'Foundation', x: 50, y: 75 },
            { name: 'Santa Catarina', x: 22, y: 45 },
            { name: 'Stone Ridge', x: 70, y: 72 },
            { name: 'Old Settlement', x: 32, y: 72 }
        ]
    },
    {
        id: 'NT',
        name: 'Nova Terra',
        url: 'https://i.ibb.co/vC4pT91L/image.png',
        accentColor: '#06b6d4',
        landmarks: [
            { name: 'Plaza Pastora', x: 49, y: 48 },
            { name: 'Grav Labs', x: 65, y: 35 },
            { name: 'Museum', x: 35, y: 65 },
            { name: 'Decathlon', x: 65, y: 65 },
            { name: 'Zipway', x: 35, y: 35 },
            { name: 'Intellect Center', x: 50, y: 25 },
            { name: 'Farmtopia', x: 25, y: 50 },
            { name: 'Turbine', x: 75, y: 50 },
            { name: 'Rust Town', x: 50, y: 75 }
        ]
    },
    {
        id: 'SOL',
        name: 'Solara',
        url: 'https://i.ibb.co/sdQ8hqbM/image.png',
        accentColor: '#a855f7',
        landmarks: [
            { name: 'Aurora', x: 48, y: 48 },
            { name: 'Solar Center', x: 50, y: 30 },
            { name: 'Oasis', x: 30, y: 65 },
            { name: 'Prism', x: 70, y: 65 },
            { name: 'Horizon', x: 30, y: 35 },
            { name: 'Helios', x: 70, y: 35 },
            { name: 'Vanguard', x: 50, y: 70 },
            { name: 'Eclipse', x: 20, y: 50 }
        ]
    }
];

// Global in-memory cache to hold loaded image elements
const imageCache: Map<string, HTMLImageElement> = new Map();
const loadedUrls: Set<string> = new Set();
let isPreloadingStarted = false;

/**
 * Preloads all competitive maps in background immediately.
 */
export function preloadAllMaps(): void {
    if (typeof window === 'undefined' || isPreloadingStarted) return;
    isPreloadingStarted = true;

    MAPS_CONFIG.forEach(map => {
        if (loadedUrls.has(map.url)) return;

        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            loadedUrls.add(map.url);
            imageCache.set(map.url, img);
        };
        img.onerror = () => {
            console.warn(`[MapPreloader] Error preloading map: ${map.name} (${map.url})`);
        };
        img.src = map.url;

        // Also add <link rel="preload"> to browser head for browser HTTP-level caching
        try {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = map.url;
            document.head.appendChild(link);
        } catch {
            // ignore
        }
    });
}

/**
 * Checks whether a specific map image is fully cached in memory.
 */
export function isMapImageLoaded(url: string): boolean {
    return loadedUrls.has(url) || (imageCache.has(url) && (imageCache.get(url)?.complete ?? false));
}

// Auto-trigger preloading on module evaluation
if (typeof window !== 'undefined') {
    preloadAllMaps();
}
