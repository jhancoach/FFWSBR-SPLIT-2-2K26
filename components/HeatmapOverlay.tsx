import React, { useEffect, useRef } from 'react';

export interface HeatmapPoint {
    x: number; // Percentage 0 - 100
    y: number; // Percentage 0 - 100
    weight: number; // Count / Intensity
}

export type HeatmapPaletteType = 'fire' | 'emerald' | 'danger' | 'amber';

interface HeatmapOverlayProps {
    points: HeatmapPoint[];
    visible?: boolean;
    palette?: HeatmapPaletteType;
    radius?: number; // In pixels (default ~45)
    opacity?: number; // 0.1 to 1.0 (default 0.75)
    blur?: number; // Optional blur factor
    maxWeight?: number;
    className?: string;
}

// Generate a 256-color gradient Lookup Table (LUT)
function createPalette(paletteType: HeatmapPaletteType): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8ClampedArray(1024);

    const grad = ctx.createLinearGradient(0, 0, 256, 0);

    if (paletteType === 'fire') {
        // Cool blue -> Cyan -> Green -> Yellow -> Orange -> Red -> White Hot
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.15, 'rgba(0, 100, 255, 0.6)');
        grad.addColorStop(0.35, 'rgba(0, 230, 200, 0.8)');
        grad.addColorStop(0.55, 'rgba(100, 255, 50, 0.9)');
        grad.addColorStop(0.75, 'rgba(255, 200, 0, 0.95)');
        grad.addColorStop(0.90, 'rgba(255, 50, 0, 1.0)');
        grad.addColorStop(1.0, 'rgba(255, 255, 220, 1.0)');
    } else if (paletteType === 'emerald') {
        // Dark Cyan -> Emerald -> Lime -> Gold -> Orange -> Magenta / White
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.15, 'rgba(16, 185, 129, 0.5)'); // Emerald 500
        grad.addColorStop(0.40, 'rgba(52, 211, 153, 0.8)'); // Emerald 400
        grad.addColorStop(0.65, 'rgba(234, 179, 8, 0.9)');   // Yellow 500
        grad.addColorStop(0.85, 'rgba(249, 115, 22, 0.95)'); // Orange 500
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');
    } else if (paletteType === 'danger') {
        // Deep Violet -> Crimson -> Flame Red -> Bright Yellow -> White
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.15, 'rgba(124, 58, 237, 0.5)'); // Purple
        grad.addColorStop(0.35, 'rgba(225, 29, 72, 0.8)');   // Rose/Red
        grad.addColorStop(0.60, 'rgba(249, 115, 22, 0.9)');  // Orange
        grad.addColorStop(0.85, 'rgba(250, 204, 21, 0.95)'); // Yellow
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');
    } else {
        // Amber / Warm
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.20, 'rgba(217, 119, 6, 0.5)');
        grad.addColorStop(0.50, 'rgba(245, 158, 11, 0.8)');
        grad.addColorStop(0.80, 'rgba(252, 211, 77, 0.95)');
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
    return ctx.getImageData(0, 0, 256, 1).data;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
    points,
    visible = true,
    palette = 'fire',
    radius = 45,
    opacity = 0.75,
    maxWeight: customMaxWeight,
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!visible || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth || 800;
        const height = parent.clientHeight || 800;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        if (points.length === 0) return;

        // Calculate max weight
        const maxW = customMaxWeight || Math.max(1, ...points.map(p => p.weight));

        // Create Offscreen Alpha Canvas
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) return;

        // Draw radial alpha spots for each point
        points.forEach(pt => {
            const px = (pt.x / 100) * width;
            const py = (pt.y / 100) * height;
            const intensity = Math.min(1.0, Math.max(0.1, pt.weight / maxW));

            // Scaled radius based on intensity and requested radius
            const ptRadius = radius * (0.7 + intensity * 0.5);

            const radGrad = offCtx.createRadialGradient(px, py, 0, px, py, ptRadius);
            // Alpha mask gradient
            radGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1.0, 0.35 + intensity * 0.65)})`);
            radGrad.addColorStop(0.5, `rgba(0, 0, 0, ${Math.min(0.8, intensity * 0.4)})`);
            radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            offCtx.fillStyle = radGrad;
            offCtx.beginPath();
            offCtx.arc(px, py, ptRadius, 0, Math.PI * 2);
            offCtx.fill();
        });

        // Colorize offscreen canvas with palette LUT
        const shadowData = offCtx.getImageData(0, 0, width, height);
        const shadowPixels = shadowData.data;
        const lut = createPalette(palette as HeatmapPaletteType);

        const coloredData = ctx.createImageData(width, height);
        const coloredPixels = coloredData.data;

        for (let i = 0; i < shadowPixels.length; i += 4) {
            // Alpha channel from offscreen canvas
            const alpha = shadowPixels[i + 3];

            if (alpha > 0) {
                // Map alpha value 0-255 to LUT index
                const lutIdx = alpha * 4;
                coloredPixels[i] = lut[lutIdx];         // R
                coloredPixels[i + 1] = lut[lutIdx + 1]; // G
                coloredPixels[i + 2] = lut[lutIdx + 2]; // B
                // Final alpha scaled by overall opacity and palette alpha
                coloredPixels[i + 3] = Math.round((lut[lutIdx + 3] * (alpha / 255)) * opacity * 255);
            }
        }

        ctx.putImageData(coloredData, 0, 0);

    }, [points, visible, palette, radius, opacity, customMaxWeight]);

    if (!visible) return null;

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 pointer-events-none z-15 w-full h-full mix-blend-screen transition-opacity duration-300 ${className}`}
            style={{ opacity }}
        />
    );
};
