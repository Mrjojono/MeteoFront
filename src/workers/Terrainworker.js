/* src/workers/terrainWorker.js
   Corrections:
   - calcul climatique réalisé avant branche eau/terre (temperature/humidity/precipitation toujours définies)
   - utilisation algorithmParams.precipitationScale pour piloter les précipitations côté UI
   - gestion d'erreurs envoyée au thread principal
*/
import { createNoise2D } from 'simplex-noise';
import { GeoCoordinates } from '../utils/coordinates';
import {
    calculateTemperature,
    calculateWind,
    calculateHumidity,
    calculatePrecipitation
} from '../utils/climateSystem';
import { RiverNetwork } from '../utils/riverSystem';
import { calculateAllRisks, getDominantRisk } from '../utils/riskZone';

let noise2D = null;
let geoCoords = null;
let riverNetwork = null;

/* error forwarding */
self.addEventListener('error', (ev) => {
    try {
        self.postMessage({ type: 'ERROR', message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno });
    } catch (err) {}
});

/* UTILS */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerpColor(c1, c2, t) {
    return [
        Math.round(lerp(c1[0], c2[0], t)),
        Math.round(lerp(c1[1], c2[1], t)),
        Math.round(lerp(c1[2], c2[2], t))
    ];
}

function calculateNoise(x, y, config) {
    const { noiseScale = 0.01, octaves = 4, persistence = 0.5, lacunarity = 2 } = config;
    let value = 0, amplitude = 1, frequency = 1, maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        const sampleX = x * noiseScale * frequency;
        const sampleY = y * noiseScale * frequency;
        const noiseValue = noise2D(sampleX, sampleY);
        value += noiseValue * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return (value / maxValue + 1) / 2;
}

/* Distance transform (multi-source BFS) for distance-to-water in pixels */
function computeDistanceToWaterMask(heights, renderWidth, renderHeight, waterLevel, maxSearch = 100) {
    const size = renderWidth * renderHeight;
    const dist = new Float32Array(size);
    const INF = 1e9;
    const qx = new Int32Array(size);
    const qy = new Int32Array(size);
    let qStart = 0, qEnd = 0;

    for (let i = 0; i < size; i++) {
        if (heights[i] < waterLevel) {
            dist[i] = 0;
            qx[qEnd] = i % renderWidth;
            qy[qEnd] = Math.floor(i / renderWidth);
            qEnd++;
        } else {
            dist[i] = INF;
        }
    }

    const steps = [[1,0],[-1,0],[0,1],[0,-1]];
    while (qStart < qEnd) {
        const x = qx[qStart];
        const y = qy[qStart];
        qStart++;
        const baseIdx = y * renderWidth + x;
        const d = dist[baseIdx];
        if (d >= maxSearch) continue;
        for (let [dx,dy] of steps) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= renderWidth || ny >= renderHeight) continue;
            const nIdx = ny * renderWidth + nx;
            if (dist[nIdx] > d + 1) {
                dist[nIdx] = d + 1;
                qx[qEnd] = nx;
                qy[qEnd] = ny;
                qEnd++;
            }
        }
    }

    return dist;
}

/* Map altitude -> palette color by biomes array (if provided) */
function colorFromPalette(altitude, biomes) {
    if (!Array.isArray(biomes) || biomes.length === 0) return null;
    for (let i = 0; i < biomes.length; i++) {
        const b = biomes[i];
        if (altitude <= b.threshold) {
            const prev = i === 0 ? 0 : biomes[i - 1].threshold;
            const denom = Math.max(1e-6, b.threshold - prev);
            const t = clamp((altitude - prev) / denom, 0, 1);
            return lerpColor(b.minColor, b.maxColor, t);
        }
    }
    return biomes[biomes.length - 1].maxColor.slice();
}

function computeBeachHalfWidthFromSlope(slope, params) {
    const { minBeach=0.01, maxBeach=0.08, slopeFactor=3.0 } = params;
    const s = clamp(slope * slopeFactor, 0, 1);
    return lerp(maxBeach, minBeach, s);
}

/* main worker */
self.onmessage = function(e) {
    try {
        const { type, data } = e.data;

        if (type === 'INIT_NOISE') {
            const { seed, centerLat, centerLong } = data;
            const alea = () => {
                let s = seed || 1;
                return function() { s = Math.sin(s) * 10000; return s - Math.floor(s); };
            };
            noise2D = createNoise2D(alea());
            geoCoords = new GeoCoordinates(centerLat || 0, centerLong || 0, 1);
            riverNetwork = null;
            self.postMessage({ type: 'READY' });
            return;
        }

        if (type === 'RENDER_TERRAIN') {
            const {
                width, height, zoom, offsetX, offsetY,
                noiseScale = 0.008, octaves = 4, persistence = 0.5, lacunarity = 2.0,
                enableShading = true, lightAngle = 135, shadowStrength = 0.4,
                waterLevel = 0.42, enableRivers = true, enableClimate = true,
                showRiskZones = false, quality = 1.0,
                biomes = [], algorithmParams = {}
            } = data;

            const renderWidth = Math.max(1, Math.floor(width * quality));
            const renderHeight = Math.max(1, Math.floor(height * quality));
            const pixelCount = renderWidth * renderHeight;
            const out = new Uint8ClampedArray(pixelCount * 4);
            const noiseCfg = { noiseScale, octaves, persistence, lacunarity };

            const heights = new Float32Array(pixelCount);
            for (let py = 0; py < renderHeight; py++) {
                for (let px = 0; px < renderWidth; px++) {
                    const canvasX = px / quality;
                    const canvasY = py / quality;
                    const worldX = (canvasX - width / 2) / zoom + offsetX;
                    const worldY = (canvasY - height / 2) / zoom + offsetY;
                    const h = calculateNoise(worldX, worldY, noiseCfg);
                    heights[py * renderWidth + px] = h;
                }
            }

            const maxSearchPixels = algorithmParams.maxDistancePixels || Math.floor(Math.max(renderWidth, renderHeight) / 6);
            const distToWaterPixels = computeDistanceToWaterMask(heights, renderWidth, renderHeight, waterLevel, maxSearchPixels);

            if (enableRivers && !riverNetwork) {
                const getHeight = (x, y) => calculateNoise(x, y, noiseCfg);
                const bounds = {
                    minX: offsetX - (width / 2) / zoom,
                    maxX: offsetX + (width / 2) / zoom,
                    minY: offsetY - (height / 2) / zoom,
                    maxY: offsetY + (height / 2) / zoom
                };
                riverNetwork = new RiverNetwork(getHeight, bounds);
                riverNetwork.generate({
                    numSources: algorithmParams.numRiverSources || 40,
                    minAltitude: algorithmParams.riverMinAltitude || 0.6,
                    flowThreshold: algorithmParams.flowThreshold || 3,
                    waterLevel
                });
            }

            const deepColor = algorithmParams.deepWaterColor || [10, 50, 120];
            const shallowColor = algorithmParams.shallowWaterColor || [30, 100, 180];
            const beachColor = algorithmParams.beachColor || [240, 230, 140];

            const progressStep = Math.max(1, Math.floor(renderHeight / 10));
            for (let py = 0; py < renderHeight; py++) {
                for (let px = 0; px < renderWidth; px++) {
                    const idx = py * renderWidth + px;
                    const canvasX = px / quality;
                    const canvasY = py / quality;
                    const worldX = (canvasX - width / 2) / zoom + offsetX;
                    const worldY = (canvasY - height / 2) / zoom + offsetY;
                    const altitude = heights[idx];

                    let rightH = altitude, downH = altitude, leftH = altitude, upH = altitude;
                    if (px < renderWidth - 1) rightH = heights[idx + 1];
                    if (px > 0) leftH = heights[idx - 1];
                    if (py < renderHeight - 1) downH = heights[idx + renderWidth];
                    if (py > 0) upH = heights[idx - renderWidth];

                    const dx = (rightH - leftH) * 0.5;
                    const dy = (downH - upH) * 0.5;
                    const slope = Math.sqrt(dx * dx + dy * dy);

                    const beachParams = {
                        minBeach: algorithmParams.minBeach || 0.01,
                        maxBeach: algorithmParams.maxBeach || 0.08,
                        slopeFactor: algorithmParams.slopeFactor || 3.0
                    };
                    const beachHalfWidth = computeBeachHalfWidthFromSlope(slope, beachParams);

                    const riverInfo = enableRivers && riverNetwork ? riverNetwork.isRiver(worldX, worldY) : { isRiver: false, flow: 0 };

                    // --- CLIMATE CALCULATION MOVED BEFORE branching ---
                    const latitude = geoCoords.getNormalizedLatitude(worldY);
                    const temperature = enableClimate ? calculateTemperature(latitude, altitude, 0.5) : 0.5;
                    const wind = enableClimate ? calculateWind(latitude, worldX / 100) : { strength: 0.5, direction: 0 };
                    const distPx = distToWaterPixels[idx];
                    const distNormalized = clamp(distPx / Math.max(1, maxSearchPixels), 0, 1);
                    const distanceToWaterNorm = 1 - distNormalized;
                    const humidity = enableClimate ? calculateHumidity({
                        distanceToWater: 1 - distanceToWaterNorm,
                        altitude,
                        temperature,
                        windStrength: wind.strength,
                        windFromOcean: false,
                        isRiver: riverInfo.isRiver,
                        nearRiver: clamp(1 - distPx / 6, 0, 1)
                    }) : 0.5;
                    let precipitation = enableClimate ? calculatePrecipitation(humidity, temperature, wind.strength) : 500;
                    // apply UI scale if provided
                    const precipScale = clamp(algorithmParams.precipitationScale ?? 1.0, 0.0, 10.0);
                    precipitation = precipitation * precipScale;

                    // --- COLORING ---
                    let rgb;
                    if (altitude < waterLevel) {
                        const depthNorm = clamp((waterLevel - altitude) / Math.max(1e-6, waterLevel), 0, 1);
                        const d = Math.sqrt(depthNorm);
                        rgb = lerpColor(shallowColor, deepColor, d);
                    } else if (riverInfo.isRiver) {
                        rgb = [50, 150, 220];
                    } else {
                        const mountainBaseAlt = algorithmParams.mountainBaseAlt || 0.75;
                        const snowTempThreshold = algorithmParams.snowTempThreshold || 0.4;
                        if (altitude > mountainBaseAlt) {
                            rgb = (temperature < snowTempThreshold) ? [255,255,255] : [120,100,80];
                        } else if (precipitation < (algorithmParams.desertPrecipThreshold || 300)) {
                            rgb = altitude > 0.6 ? [200,180,140] : [230,200,150];
                        } else if (temperature > 0.7 && humidity > 0.7) {
                            rgb = [20,120,20];
                        } else if (humidity > 0.5) {
                            rgb = (temperature < 0.45) ? [34,100,34] : [40,160,40];
                        } else if (humidity < 0.5 && temperature > 0.5) {
                            rgb = [180,160,80];
                        } else {
                            rgb = [80,180,80];
                        }

                        const paletteColor = colorFromPalette(altitude, biomes);
                        if (paletteColor) {
                            const paletteWeight = clamp(algorithmParams.paletteWeight ?? 0.5, 0, 1);
                            rgb = [
                                Math.round(rgb[0] * (1 - paletteWeight) + paletteColor[0] * paletteWeight),
                                Math.round(rgb[1] * (1 - paletteWeight) + paletteColor[1] * paletteWeight),
                                Math.round(rgb[2] * (1 - paletteWeight) + paletteColor[2] * paletteWeight)
                            ];
                        }

                        const shoreRange = beachHalfWidth;
                        if (altitude >= waterLevel && altitude < waterLevel + shoreRange) {
                            const t = clamp((altitude - waterLevel) / Math.max(1e-6, shoreRange), 0, 1);
                            rgb = lerpColor(beachColor, rgb, t);
                        }
                    }

                    if (showRiskZones && altitude >= waterLevel) {
                        const distPxLocal = distToWaterPixels[idx];
                        const distToWater = Math.min(1, distPxLocal / Math.max(1, maxSearchPixels));
                        const risks = calculateAllRisks({
                            altitude,
                            distanceToRiver: distToWater * 10,
                            riverFlow: riverInfo.flow || 0,
                            precipitation,
                            slope,
                            humidity,
                            temperature,
                            distanceToWater: 1 - distToWater
                        });
                        const dominant = getDominantRisk(risks, 0.35);
                        if (dominant.type) {
                            const riskIntensity = clamp(dominant.severity, 0, 1);
                            rgb = [
                                Math.round(rgb[0] * (1 - riskIntensity * 0.5) + 255 * riskIntensity * 0.5),
                                Math.round(rgb[1] * (1 - riskIntensity * 0.7)),
                                Math.round(rgb[2] * (1 - riskIntensity * 0.7))
                            ];
                        }
                    }

                    if (enableShading) {
                        const offsetFactor = algorithmParams.shadeScale || 10;
                        const rightH_sh = (px < renderWidth - 1) ? heights[idx + 1] : rightH;
                        const downH_sh = (py < renderHeight - 1) ? heights[idx + renderWidth] : downH;
                        const ddx = (altitude - rightH_sh) * offsetFactor;
                        const ddy = (altitude - downH_sh) * offsetFactor;
                        const lightRad = (lightAngle * Math.PI) / 180;
                        const lightX = Math.cos(lightRad);
                        const lightY = Math.sin(lightRad);
                        const dot = ddx * lightX + ddy * lightY;
                        const shadeFactor = clamp(1.0 + dot * shadowStrength, 0.5, 1.5);
                        rgb = rgb.map(c => Math.round(clamp(c * shadeFactor, 0, 255)));
                    }

                    const outIdx = idx * 4;
                    out[outIdx] = rgb[0];
                    out[outIdx + 1] = rgb[1];
                    out[outIdx + 2] = rgb[2];
                    out[outIdx + 3] = 255;
                }

                if (py % progressStep === 0) {
                    self.postMessage({ type: 'PROGRESS', progress: (py / renderHeight) * 100 });
                }
            }

            self.postMessage({
                type: 'RENDER_COMPLETE',
                imageData: out.buffer,
                width: renderWidth,
                height: renderHeight,
                quality
            }, [out.buffer]);

            return;
        }

        if (type === 'REGENERATE_RIVERS') {
            riverNetwork = null;
            self.postMessage({ type: 'RIVERS_RESET' });
        }
    } catch (err) {
        try { self.postMessage({ type: 'ERROR', message: err.message, stack: err.stack }); } catch (e) {}
    }
};