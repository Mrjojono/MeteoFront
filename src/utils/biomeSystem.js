// src/utils/biomeSystem.js

/**
 * Système de biomes basé sur latitude et altitude
 * Inspiré de la vraie géographie terrestre
 */

/**
 * Calculer la température en fonction de la latitude et l'altitude
 * @param {number} latitude - Entre -1 (pôle sud) et 1 (pôle nord)
 * @param {number} altitude - Entre 0 (niveau mer) et 1 (sommet)
 * @returns {number} Température normalisée (0 = très froid, 1 = très chaud)
 */
export function calculateTemperature(latitude, altitude) {
    // La température diminue avec la latitude (plus froid aux pôles)
    const latitudeFactor = 1 - Math.abs(latitude);  // 1 à l'équateur, 0 aux pôles

    // La température diminue avec l'altitude (refroidissement adiabatique ~6.5°C/km)
    const altitudeFactor = 1 - altitude * 0.7;  // Perd 70% de chaleur au sommet

    // Combiner les facteurs
    const temperature = latitudeFactor * 0.7 + altitudeFactor * 0.3;

    return Math.max(0, Math.min(1, temperature));
}

/**
 * Calculer l'humidité en fonction de la proximité de l'eau et l'altitude
 * @param {number} distanceToWater - Distance à l'eau la plus proche (0-1)
 * @param {number} altitude - Altitude (0-1)
 * @param {number} isRiver - 1 si c'est une rivière, 0 sinon
 * @returns {number} Humidité (0 = désert, 1 = jungle)
 */
export function calculateHumidity(distanceToWater, altitude, isRiver) {
    // Plus on est proche de l'eau, plus c'est humide
    const waterProximity = 1 - distanceToWater;

    // Les rivières apportent beaucoup d'humidité
    const riverBonus = isRiver * 0.5;

    // L'altitude influence (les montagnes bloquent l'humidité)
    const altitudeEffect = altitude < 0.6 ? 1.0 : (1 - (altitude - 0.6) * 2);

    const humidity = (waterProximity * 0.6 + riverBonus) * altitudeEffect;

    return Math.max(0, Math.min(1, humidity));
}

/**
 * Déterminer le biome en fonction de température, humidité et altitude
 */
export function getBiomeFromClimate(height, temperature, humidity, isRiver) {
    // Eau
    if (height < 0.42) {
        if (height < 0.30) {
            return {
                name: 'Océan Profond',
                color: temperature > 0.6
                    ? [10, 50, 120]   // Océan tropical (plus clair)
                    : [5, 20, 80],    // Océan arctique (plus foncé)
                isWater: true
            };
        } else {
            return {
                name: 'Océan',
                color: temperature > 0.6
                    ? [30, 100, 180]   // Mer tropicale
                    : [20, 70, 140],   // Mer tempérée
                isWater: true
            };
        }
    }

    // Rivières (priorité absolue)
    if (isRiver) {
        return {
            name: 'Rivière',
            color: [50, 150, 220],
            isWater: true,
            isRiver: true
        };
    }

    // Plage
    if (height < 0.45) {
        return {
            name: 'Plage',
            color: temperature > 0.7
                ? [240, 230, 140]   // Plage tropicale (sable doré)
                : [200, 200, 180],  // Plage tempérée (sable gris)
            isWater: false
        };
    }

    // Zones polaires (très froid)
    if (temperature < 0.25) {
        if (height > 0.65) {
            return {
                name: 'Glacier',
                color: [240, 250, 255],  // Glace bleutée
                isWater: false
            };
        } else {
            return {
                name: 'Toundra',
                color: [180, 190, 170],  // Gris-vert
                isWater: false
            };
        }
    }

    // Zones froides (tempérées)
    if (temperature < 0.45) {
        if (height > 0.75) {
            return {
                name: 'Sommet Neigeux',
                color: [255, 255, 255],
                isWater: false
            };
        } else if (humidity > 0.5) {
            return {
                name: 'Forêt Boréale',
                color: [34, 100, 34],    // Vert foncé
                isWater: false
            };
        } else {
            return {
                name: 'Prairie Tempérée',
                color: [100, 180, 80],
                isWater: false
            };
        }
    }

    // Zones chaudes
    if (temperature > 0.45) {
        // Déserts (faible humidité)
        if (humidity < 0.3) {
            return {
                name: 'Désert',
                color: height > 0.6
                    ? [200, 180, 140]   // Désert rocheux
                    : [230, 200, 150],  // Désert de sable
                isWater: false
            };
        }

        // Jungles (haute humidité + chaleur)
        if (humidity > 0.6 && temperature > 0.65) {
            return {
                name: 'Jungle Tropicale',
                color: [20, 120, 20],   // Vert très foncé
                isWater: false
            };
        }

        // Savane
        if (humidity < 0.6) {
            return {
                name: 'Savane',
                color: [180, 160, 80],
                isWater: false
            };
        }

        // Forêt tropicale
        return {
            name: 'Forêt Tropicale',
            color: [40, 160, 40],
            isWater: false
        };
    }

    // Zones montagneuses
    if (height > 0.70) {
        if (temperature < 0.4) {
            return {
                name: 'Montagne Enneigée',
                color: [255, 255, 255],
                isWater: false
            };
        } else {
            return {
                name: 'Montagne Rocheuse',
                color: [120, 100, 80],
                isWater: false
            };
        }
    }

    // Par défaut : plaine
    return {
        name: 'Plaine',
        color: [80, 180, 80],
        isWater: false
    };
}

/**
 * Calculer la distance approximative à l'eau la plus proche
 * (Utilisé pour l'humidité)
 */
export function estimateDistanceToWater(worldX, worldY, getHeight, searchRadius = 10) {
    const currentHeight = getHeight(worldX, worldY);

    // Si on est déjà dans l'eau
    if (currentHeight < 0.42) return 0;

    let minDistance = searchRadius;
    const step = 2;

    // Recherche en spirale
    for (let r = step; r <= searchRadius; r += step) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const checkX = worldX + Math.cos(angle) * r;
            const checkY = worldY + Math.sin(angle) * r;
            const checkHeight = getHeight(checkX, checkY);

            if (checkHeight < 0.42) {
                minDistance = Math.min(minDistance, r);
            }
        }
    }

    return minDistance / searchRadius;  // Normaliser entre 0-1
}