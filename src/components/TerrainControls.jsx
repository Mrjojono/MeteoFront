    import React from 'react';
    import {
        Settings2,
        ZoomIn,
        Layers,
        CloudRain,
        Droplet,
        Wind,
        Sun,
        Play,
        StopCircle,
        RefreshCw
    } from 'lucide-react';

    /* Small wrapper moved outside to avoid creating a component during render */
    const Control = ({ children }) => <div className="mb-4 last:mb-0">{children}</div>;

    /**
     * TerrainControls – Tailwind, scrollable, uses lucide-react icons (no emojis)
     * Props:
     * - params: object of current params
     * - onChange(key, value)
     * - onRegenerate()
     * - onStartFlood()
     * - onStopFlood()
     * - presets: optional array of { name, values, icon? }
     */
    const TerrainControls = ({ params = {}, onChange, onRegenerate, presets = [], onStartFlood, onStopFlood }) => {
        const safeNumber = (v, d) => (typeof v === 'number' ? v : d);

        const zoomVal = safeNumber(params.zoom, 100);
        const noiseScaleVal = safeNumber(params.noiseScale, 0.008);
        const octavesVal = safeNumber(params.octaves, 4);
        const persistenceVal = safeNumber(params.persistence, 0.5);
        const lightAngleVal = safeNumber(params.lightAngle, 135);
        const lightIntensityVal = safeNumber(params.lightIntensity, 1.2);
        const shadowStrengthVal = safeNumber(params.shadowStrength, 0.4);

        const waterLevelVal = safeNumber(params.waterLevel, 0.30);
        const precipitationScaleVal = safeNumber(params.precipitationScale, 1.0);


        const runoffFactorVal = safeNumber(params.runoffFactor, 0.6);
        const flowGridDivisorVal = safeNumber(params.flowGridDivisor, 4);
        const numRiverSourcesVal = safeNumber(params.numRiverSources, 8);
        const flowThresholdVal = safeNumber(params.flowThreshold, 6);

        const adjustWater = (delta) => {
            const v = Math.max(0.0, Math.min(1.0, +(waterLevelVal + delta).toFixed(2)));
            onChange('waterLevel', v);
        };

        return (
            <div className="w-full max-w-xs bg-white/60 backdrop-blur-sm rounded-md shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <Settings2 className="text-gray-800" />
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Paramètres du Terrain</h3>
                        <p className="text-xs text-gray-600">Ajustez la génération et l'affichage</p>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="px-4 py-3 max-h-[calc(100vh-140px)] overflow-y-auto">
                    {/* Presets */}
                    {presets.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                                <Layers className="w-4 h-4" /> Presets
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(p => (
                                    <button
                                        key={p.name}
                                        onClick={() => onChange('preset', p.values)}
                                        className="text-sm px-3 py-1 rounded-md border bg-gray-50 hover:bg-gray-100 text-gray-800"
                                    >
                                        {p.icon ?? null} {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                            <ZoomIn className="w-4 h-4" /> Navigation
                        </div>
                        <Control>
                            <label className="block text-sm text-gray-700 mb-2">Zoom: <span className="font-medium">{zoomVal}</span></label>
                            <input
                                type="range" min="10" max="600" value={zoomVal}
                                onChange={(e) => onChange('zoom', parseInt(e.target.value))}
                                className="w-full"
                            />
                        </Control>
                    </div>

                    {/* Generation */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                            <Layers className="w-4 h-4" /> Génération
                        </div>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Échelle: {(noiseScaleVal * 1000).toFixed(1)}</label>
                            <input type="range" min="0.0005" max="0.08" step="0.0005" value={noiseScaleVal}
                                   onChange={(e) => onChange('noiseScale', parseFloat(e.target.value))} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Octaves: {octavesVal}</label>
                            <input type="range" min="1" max="12" value={octavesVal}
                                   onChange={(e) => onChange('octaves', parseInt(e.target.value))} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Persistance: {persistenceVal.toFixed(2)}</label>
                            <input type="range" min="0.1" max="0.95" step="0.01" value={persistenceVal}
                                   onChange={(e) => onChange('persistence', parseFloat(e.target.value))} className="w-full" />
                        </Control>
                    </div>

                    {/* Precip / Rivers */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                            <CloudRain className="w-4 h-4" /> Précipitations & Rivières
                        </div>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Échelle précipitations: {precipitationScaleVal.toFixed(2)}x</label>
                            <input type="range" min="0.2" max="4.0" step="0.05" value={precipitationScaleVal}
                                   onChange={(e) => onChange('precipitationScale', parseFloat(e.target.value))} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Runoff factor: {runoffFactorVal.toFixed(2)}</label>
                            <input type="range" min="0" max="5" step="0.05" value={runoffFactorVal}
                                   onChange={(e) => onChange('runoffFactor', parseFloat(e.target.value))} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Flow grid divisor: {flowGridDivisorVal}</label>
                            <input type="range" min="1" max="12" step="1" value={flowGridDivisorVal}
                                   onChange={(e) => onChange('flowGridDivisor', parseInt(e.target.value))} className="w-full" />
                            <p className="text-xs text-gray-500 mt-1">Plus grand = moins détaillé mais plus rapide</p>
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Sources rivières: {numRiverSourcesVal}</label>
                            <input type="range" min="1" max="100" step="1" value={numRiverSourcesVal}
                                   onChange={(e) => onChange('numRiverSources', parseInt(e.target.value))} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Seuil débit rivières: {flowThresholdVal}</label>
                            <input type="range" min="1" max="200" step="1" value={flowThresholdVal}
                                   onChange={(e) => onChange('flowThreshold', parseInt(e.target.value))} className="w-full" />
                            <p className="text-xs text-gray-500 mt-1">Augmenter pour réduire les rivières visibles</p>
                        </Control>

                        <div className="flex items-center gap-3 mt-2">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={!!params.enableRivers} onChange={(e) => onChange('enableRivers', e.target.checked)} className="rounded" />
                                <span className="text-gray-700">Activer les rivières</span>
                            </label>

                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={!!params.enableClimate} onChange={(e) => onChange('enableClimate', e.target.checked)} className="rounded" />
                                <span className="text-gray-700">Activer le climat</span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs text-gray-600 mb-1">Niveau de l'eau: {waterLevelVal.toFixed(2)}</label>
                            <div className="flex items-center gap-2">
                                <input type="range" min="0.0" max="1.0" step="0.01" value={waterLevelVal}
                                       onChange={(e) => onChange('waterLevel', parseFloat(e.target.value))} className="flex-1" />
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => adjustWater(-0.01)} className="px-2 py-1 rounded bg-gray-50 border text-gray-800">-</button>
                                    <button onClick={() => adjustWater(0.01)} className="px-2 py-1 rounded bg-gray-50 border text-gray-800">+</button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                                <button onClick={onStartFlood} className="flex-1 px-3 py-2 rounded bg-gray-100 text-gray-800 border flex items-center justify-center gap-2">
                                    <Play className="w-4 h-4" /> Inonder
                                </button>
                                <button onClick={onStopFlood} className="px-3 py-2 rounded bg-gray-100 text-gray-800 border flex items-center gap-2">
                                    <StopCircle className="w-4 h-4" /> Arrêter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lighting */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                            <Sun className="w-4 h-4" /> Éclairage
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={!!params.enableShading} onChange={(e) => onChange('enableShading', e.target.checked)} className="rounded" />
                                <span className="text-gray-700">Activer les ombres</span>
                            </label>
                        </div>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Angle: {lightAngleVal}°</label>
                            <input type="range" min="0" max="360" value={lightAngleVal}
                                   onChange={(e) => onChange('lightAngle', parseInt(e.target.value))} disabled={!params.enableShading} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Intensité: {lightIntensityVal.toFixed(2)}</label>
                            <input type="range" min="0.2" max="3.0" step="0.05" value={lightIntensityVal}
                                   onChange={(e) => onChange('lightIntensity', parseFloat(e.target.value))} disabled={!params.enableShading} className="w-full" />
                        </Control>

                        <Control>
                            <label className="block text-xs text-gray-600 mb-1">Ombres: {(shadowStrengthVal * 100).toFixed(0)}%</label>
                            <input type="range" min="0" max="1" step="0.01" value={shadowStrengthVal}
                                   onChange={(e) => onChange('shadowStrength', parseFloat(e.target.value))} disabled={!params.enableShading} className="w-full" />
                        </Control>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 mb-6">
                        <button onClick={onRegenerate} className="flex-1 px-3 py-2 rounded bg-gray-50 border text-gray-800 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Nouveau
                        </button>
                    </div>

                    {/* Tips */}
                    <div className="mt-2 text-xs text-gray-500">
                        <div className="font-semibold mb-2">Astuce</div>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Grandes îles: noiseScale ≈ 0.005</li>
                            <li>Détails fins: octaves ≈ 6–10</li>
                            <li>Moins de rivières: diminuer Sources ou augmenter Seuil</li>
                            <li>Performance: augmenter Flow grid divisor</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    export default TerrainControls;