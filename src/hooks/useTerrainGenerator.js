import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * useTerrainGenerator
 * - draws final image and river overlay
 * - synchronizes view (zoom/offset) back to parent via config.onViewChange
 */
export function useTerrainGenerator(config) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const workerRef = useRef(null);

    const isDraggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });
    const renderTimeoutRef = useRef(null);
    const highResTimeoutRef = useRef(null);
    const regenRiversTimeoutRef = useRef(null);

    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);

    const stateRef = useRef({
        zoom: config.zoom || 100,
        offsetX: config.offsetX || 0,
        offsetY: config.offsetY || 0,
        lastRenderKey: null
    });

    const buildAlgorithmParams = useCallback(() => ({
        precipitationScale: config.precipitationScale ?? 1.0,
        runoffFactor: config.runoffFactor ?? 0.6,
        flowGridDivisor: config.flowGridDivisor ?? 4,
        flowAccumulationThresholdCells: config.flowAccumulationThresholdCells ?? null,
        minSlopeForRiver: config.minSlopeForRiver ?? 0.002,
        shadeScale: config.shadeScale ?? 10,
        maxDistancePixels: config.maxDistancePixels ?? null,
        desertPrecipThreshold: config.desertPrecipThreshold ?? 300,
        beachRange: config.beachRange ?? 0.04,
        mountainBaseAlt: config.mountainBaseAlt ?? 0.75,
        numRiverSources: config.numRiverSources ?? 8,
        flowThreshold: config.flowThreshold ?? 6,
        paletteWeight: config.paletteWeight ?? 0.5,
        precipitationScale: config.precipitationScale ?? 1.0,
    }), [config]);

    // Ensure canvas + overlay sizes (use CSS pixel sizes for stability)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const cssW = Math.max(1, config.width || 800);
        const cssH = Math.max(1, config.height || 600);
        if (canvas.width !== cssW || canvas.height !== cssH) {
            canvas.width = cssW;
            canvas.height = cssH;
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
        }

        const parent = canvas.parentElement;
        if (!parent) return;
        let overlay = overlayRef.current;
        if (!overlay || !parent.contains(overlay)) {
            overlay = document.createElement('canvas');
            overlay.className = 'terrain-overlay-canvas';
            overlay.style.position = 'absolute';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.pointerEvents = 'none';
            parent.style.position = parent.style.position || 'relative';
            parent.appendChild(overlay);
            overlayRef.current = overlay;
        }
        if (overlay.width !== cssW || overlay.height !== cssH) {
            overlay.width = cssW;
            overlay.height = cssH;
            overlay.style.width = `${cssW}px`;
            overlay.style.height = `${cssH}px`;
        }
    }, [config.width, config.height]);

    // Worker init (seed / center)
    useEffect(() => {
        if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }

        const w = new Worker(new URL('../workers/terrainWorker.js', import.meta.url), { type: 'module' });
        workerRef.current = w;

        w.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'READY') { renderTerrain(1.0); return; }
            if (msg.type === 'PROGRESS') { setProgress(msg.progress); return; }
            if (msg.type === 'ERROR') { console.error('Worker error:', msg.message, msg.stack || ''); setIsRendering(false); setProgress(0); return; }

            if (msg.type === 'RIVER_STATS') {
                // optional: you can surface stats to UI later
                // console.log('RIVER_STATS', msg);
                return;
            }

            if (msg.type === 'LAYER') {
                // draw river overlay only
                if (msg.layer === 'RIVER_MASK' && config.enableRivers) {
                    const overlay = overlayRef.current;
                    const canvas = canvasRef.current;
                    if (!overlay || !canvas) return;
                    const { width: layerW, height: layerH, data } = msg;

                    const tmp = document.createElement('canvas');
                    tmp.width = layerW; tmp.height = layerH;
                    const tctx = tmp.getContext('2d');
                    const img = tctx.createImageData(layerW, layerH);
                    const src = new Uint8Array(data);
                    for (let i = 0; i < layerW * layerH; i++) {
                        const v = src[i];
                        img.data[i*4] = 50;
                        img.data[i*4+1] = 150;
                        img.data[i*4+2] = 220;
                        img.data[i*4+3] = v;
                    }
                    tctx.putImageData(img, 0, 0);

                    const octx = overlay.getContext('2d');
                    octx.clearRect(0, 0, overlay.width, overlay.height);
                    octx.imageSmoothingEnabled = true;
                    octx.imageSmoothingQuality = 'high';
                    octx.drawImage(tmp, 0, 0, layerW, layerH, 0, 0, config.width, config.height);
                }
                return;
            }

            if (msg.type === 'RENDER_COMPLETE') {
                const { imageData, width, height, quality } = msg;
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d', { alpha: false });
                const image = new ImageData(new Uint8ClampedArray(imageData), width, height);

                // draw via temp canvas and scale to CSS dimensions to avoid putImageData/DPR issues
                const tmp = document.createElement('canvas');
                tmp.width = width;
                tmp.height = height;
                tmp.getContext('2d').putImageData(image, 0, 0);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(tmp, 0, 0, width, height, 0, 0, canvas.width, canvas.height);

                setIsRendering(false);
                setProgress(0);
                return;
            }
        };

        w.postMessage({ type: 'INIT_NOISE', data: { seed: config.seed || 12345, centerLat: config.centerLat, centerLong: config.centerLong } });

        return () => { if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; } };
    }, [config.seed, config.centerLat, config.centerLong, config.enableRivers]);

    // send render job
    const renderTerrain = useCallback((quality = 1.0) => {
        const w = workerRef.current;
        if (!w) return;
        const { zoom, offsetX, offsetY } = stateRef.current;
        const key = `${zoom.toFixed(1)}-${offsetX.toFixed(3)}-${offsetY.toFixed(3)}-q${quality}-s${config.seed}`;
        if (stateRef.current.lastRenderKey === key) return;
        stateRef.current.lastRenderKey = key;
        setIsRendering(true);
        const algorithmParams = buildAlgorithmParams();
        w.postMessage({
            type: 'RENDER_TERRAIN',
            data: {
                width: config.width, height: config.height, zoom, offsetX, offsetY,
                noiseScale: config.noiseScale, octaves: config.octaves, persistence: config.persistence, lacunarity: config.lacunarity,
                biomes: config.biomes, enableShading: config.enableShading, lightAngle: config.lightAngle, shadowStrength: config.shadowStrength,
                waterLevel: config.waterLevel ?? 0.42, enableRivers: config.enableRivers, enableClimate: config.enableClimate,
                showRiskZones: config.showRiskZones, quality, algorithmParams
            }
        });
    }, [config, buildAlgorithmParams]);



    // regen rivers throttled when parameters change
    useEffect(() => {
        if (!workerRef.current) return;
        if (regenRiversTimeoutRef.current) clearTimeout(regenRiversTimeoutRef.current);
        regenRiversTimeoutRef.current = setTimeout(() => {
            try { workerRef.current.postMessage({ type: 'REGENERATE_RIVERS' }); } catch (e) {}
            renderTerrain(config.flooding ? 0.25 : 1.0);
        }, 120);
        return () => { if (regenRiversTimeoutRef.current) clearTimeout(regenRiversTimeoutRef.current); };
    }, [config.waterLevel, config.enableRivers, config.flooding, config.numRiverSources, config.flowThreshold, renderTerrain]);

    // interactions
    const handleMouseDown = useCallback((e) => {
        isDraggingRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - lastPosRef.current.x;
        const dy = e.clientY - lastPosRef.current.y;
        lastPosRef.current = { x: e.clientX, y: e.clientY };

        const moveSpeed = Math.max(0.8, 1.8 * (stateRef.current.zoom / 100));
        stateRef.current.offsetX -= (dx / stateRef.current.zoom) * moveSpeed;
        stateRef.current.offsetY -= (dy / stateRef.current.zoom) * moveSpeed;

        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        if (highResTimeoutRef.current) clearTimeout(highResTimeoutRef.current);

        renderTimeoutRef.current = setTimeout(() => renderTerrain(0.25), 0);
        highResTimeoutRef.current = setTimeout(() => {
            renderTerrain(1.0);
            // sync view to parent at end of interaction
            if (typeof config.onViewChange === 'function') {
                config.onViewChange({
                    zoom: stateRef.current.zoom,
                    offsetX: stateRef.current.offsetX,
                    offsetY: stateRef.current.offsetY
                });
            }
        }, 200);
    }, [renderTerrain, config]);

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        if (highResTimeoutRef.current) clearTimeout(highResTimeoutRef.current);
        highResTimeoutRef.current = setTimeout(() => {
            renderTerrain(1.0);
            if (typeof config.onViewChange === 'function') {
                config.onViewChange({
                    zoom: stateRef.current.zoom,
                    offsetX: stateRef.current.offsetX,
                    offsetY: stateRef.current.offsetY
                });
            }
        }, 50);
    }, [renderTerrain, config]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -20 : 20;
        stateRef.current.zoom = Math.max(10, Math.min(500, stateRef.current.zoom + delta));

        if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        if (highResTimeoutRef.current) clearTimeout(highResTimeoutRef.current);

        renderTimeoutRef.current = setTimeout(() => renderTerrain(0.4), 16);
        highResTimeoutRef.current = setTimeout(() => {
            renderTerrain(1.0);
            if (typeof config.onViewChange === 'function') {
                config.onViewChange({
                    zoom: stateRef.current.zoom,
                    offsetX: stateRef.current.offsetX,
                    offsetY: stateRef.current.offsetY
                });
            }
        }, 150);
    }, [renderTerrain, config]);

    // attach listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

    // redraw on config changes (debounced)
    useEffect(() => {
        const t = setTimeout(() => renderTerrain(config.flooding ? 0.25 : 1.0), 60);
        return () => clearTimeout(t);
    }, [
        config.width, config.height, config.noiseScale, config.octaves, config.persistence, config.lacunarity,
        config.enableShading, config.lightAngle, config.shadowStrength, config.waterLevel,
        config.enableRivers, config.enableClimate, config.showRiskZones, config.precipitationScale,
        config.runoffFactor, config.flowGridDivisor, config.numRiverSources, config.flowThreshold,
        renderTerrain
    ]);

    const setZoom = useCallback((z) => {
        stateRef.current.zoom = z;
        renderTerrain(1.0);
        if (typeof config.onViewChange === 'function') {
            config.onViewChange({ zoom: stateRef.current.zoom, offsetX: stateRef.current.offsetX, offsetY: stateRef.current.offsetY });
        }
    }, [renderTerrain, config]);

    const regenerate = useCallback(() => renderTerrain(1.0), [renderTerrain]);

    return { canvasRef, overlayRef, zoom: stateRef.current.zoom, setZoom, regenerate, isRendering, progress };
}