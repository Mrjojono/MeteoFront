import React, { useRef, useState } from 'react';
import TerrainCanvas from '../components/TerrainCanvas';
import TerrainControls from '../components/TerrainControls';

const TERRAIN_PRESETS = [ /* tes presets */ ];

function TerrainMap() {
    const [terrainParams, setTerrainParams] = useState({
        width: 800,
        height: 600,
        zoom: 100,
        noiseScale: 0.008,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0,
        seed: Math.floor(Math.random() * 1000000),
        enableShading: true,
        lightAngle: 135,
        lightIntensity: 1.2,
        shadowStrength: 0.4,
        centerLat: 0,
        centerLong: 0,
        waterLevel: 0.30,
        enableRivers: true,
        enableClimate: true,
        showRiskZones: true,
        flooding: false,
        // algorithm knobs
        precipitationScale: 1.0,
        runoffFactor: 0.6,
        flowGridDivisor: 4,
        numRiverSources: 8,
        flowThreshold: 6,
        biomes: [ /* tes biomes */ ]
    });

    const floodIntervalRef = useRef(null);

    const handleParamChange = (key, value) => {
        if (key === 'preset') {
            setTerrainParams(prev => ({ ...prev, ...value }));
        } else {
            setTerrainParams(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleRegenerate = () => {
        setTerrainParams(prev => ({ ...prev, seed: Math.floor(Math.random() * 1000000) }));
    };

    const startFlood = () => {
        if (floodIntervalRef.current) return;
        setTerrainParams(prev => ({ ...prev, flooding: true }));
        floodIntervalRef.current = setInterval(() => {
            setTerrainParams(prev => {
                const next = Math.min(1.0, +(prev.waterLevel + 0.01).toFixed(2));
                if (next >= 1.0) {
                    clearInterval(floodIntervalRef.current);
                    floodIntervalRef.current = null;
                    return { ...prev, waterLevel: next, flooding: false };
                }
                return { ...prev, waterLevel: next };
            });
        }, 120);
    };

    const stopFlood = () => {
        if (floodIntervalRef.current) {
            clearInterval(floodIntervalRef.current);
            floodIntervalRef.current = null;
        }
        setTerrainParams(prev => ({ ...prev, flooding: false }));
    };

    // handler to receive view changes (wheel/drag) from the hook and update parent state
    const handleViewChange = ({ zoom, offsetX, offsetY }) => {
        setTerrainParams(prev => ({ ...prev, zoom, offsetX, offsetY }));
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Générateur de Terrain Procédural</h1>
                <p className="text-sm text-gray-600">Explorez des mondes infinis et uniques</p>
            </header>

            <div className="flex gap-6">
                <aside className="w-full max-w-xs sticky top-6 self-start">
                    <TerrainControls
                        params={terrainParams}
                        onChange={handleParamChange}
                        onRegenerate={handleRegenerate}
                        onStartFlood={startFlood}
                        onStopFlood={stopFlood}
                        presets={TERRAIN_PRESETS}
                    />
                </aside>

                <main className="flex-1">
                    <div className="bg-white rounded-md shadow-sm p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">Carte du Terrain</h2>
                                <p className="text-sm text-gray-600">Visualisation procédurale — ajustez les paramètres à gauche</p>
                            </div>
                            <div className="text-sm text-gray-600">Seed: {terrainParams.seed}</div>
                        </div>

                        <div className="border border-gray-100 rounded-md overflow-hidden">
                            <TerrainCanvas {...terrainParams} onViewChange={handleViewChange} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default TerrainMap;