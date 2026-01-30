import React from 'react';
import { useTerrainGenerator } from '../hooks/useTerrainGenerator';

/**
 * Tailwind-adapted TerrainCanvas (remplace l'ancien CSS)
 * - Ne modifie pas la logique : useTerrainGenerator reste utilisé tel quel
 * - Remplace les styles CSS par des classes Tailwind proches du rendu original
 * - Aucune "modification bizarre" : structure HTML identique
 */

const BiomeLegend = ({ biomes }) => {
    if (!Array.isArray(biomes)) return null;
    return (
        <div className="absolute top-3 right-3 z-20  text-white      rounded-md text-xs max-w-[220px]">
            {biomes.map((b, i) => {
                const color = b.minColor || [120, 120, 120];
                const css = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                return (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-3 rounded-sm border" style={{ background: css, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <div className="truncate opacity-95">{b.name} (≤ {b.threshold})</div>
                    </div>
                );
            })}
        </div>
    );
};

const TerrainCanvas = (props) => {
    // forward onViewChange and all params to hook
    const { onViewChange, ...rest } = props;
    const { canvasRef } = useTerrainGenerator({ ...rest, onViewChange });

    const width = props.width ?? 800;
    const height = props.height ?? 600;

    return (
        <div
            className="relative"
            style={{ width: width, height: height, background: '#111827', padding: 12 }}
        >
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="block w-full max-w-[1100px] h-auto rounded-md cursor-grab select-none"
                style={{ imageRendering: 'pixelated' }}
                aria-label="Terrain canvas"
            />

            {/* Biome legend (overlay top-right) */}
            <BiomeLegend biomes={props.biomes} />

            {/* Info overlay bottom-left */}
            <div className="absolute left-4 bottom-4 z-20 bg-black/60 text-white px-3 py-2 rounded-md text-sm">
                <div className="flex items-center gap-4">
                    <div className="text-xs">
                        <div className="font-medium">🌍 Seed:</div>
                        <div className="text-xs text-gray-200">{props.seed}</div>
                    </div>

                    <div className="text-xs">
                        <div className="font-medium">📊 Octaves:</div>
                        <div className="text-xs text-gray-200">{props.octaves}</div>
                    </div>
                </div>

                <div className="mt-2 text-xs text-gray-200">💡 Glisser pour déplacer • Molette pour zoom</div>

                {props.flooding && (
                    <div className="mt-2 font-semibold text-sky-400">🌊 Inondation en cours...</div>
                )}
            </div>
        </div>
    );
};

export default TerrainCanvas;