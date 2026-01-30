// src/utils/climateSystem.js

/**
 * Système climatique réaliste avec vent, humidité, température
 */

/**
 * Calculer la température en fonction de plusieurs facteurs
 */
export function calculateTemperature(latitude, altitude, season = 0.5) {
    // Température de base selon latitude
    const latEffect = 1 - Math.abs(latitude);  // 1 à l'équateur, 0 aux pôles

    // Refroidissement avec l'altitude (-6.5°C par km)
    const altEffect = Math.max(0, 1 - altitude * 0.7);

    // Variation saisonnière (-1 à 1)
    const seasonEffect = Math.sin(season * Math.PI * 2) * 0.3;

    // Température normalisée (0 = très froid, 1 = très chaud)
    let temp = (latEffect * 0.6 + altEffect * 0.4) + seasonEffect;

    return Math.max(0, Math.min(1, temp));
}

/**
 * Calculer la direction et force du vent
 * Basé sur les cellules de Hadley (vents dominants)
 */
export function calculateWind(latitude, longitude) {
    const absLat = Math.abs(latitude);

    // Zones de vent selon latitude
    if (absLat < 0.2) {
        // Zone équatoriale : Alizés (vents faibles, ascendants)
        return {
            direction: longitude * 15,  // Rotation terrestre
            strength: 0.3,
            type: 'DOLDRUMS'
        };
    } else if (absLat < 0.4) {
        // Zone tropicale : Alizés (vents d'est constants)
        return {
            direction: latitude > 0 ? 45 : -45,  // NE ou SE
            strength: 0.7,
            type: 'TRADE_WINDS'
        };
    } else if (absLat < 0.6) {
        // Zone tempérée : Vents d'ouest (Westerlies)
        return {
            direction: latitude > 0 ? 270 : 90,  // Ouest
            strength: 0.8,
            type: 'WESTERLIES'
        };
    } else {
        // Zone polaire : Vents d'est
        return {
            direction: latitude > 0 ? 90 : 270,
            strength: 0.6,
            type: 'POLAR_EASTERLIES'
        };
    }
}

/**
 * Calculer l'humidité avec tous les facteurs
 */
export function calculateHumidity(config) {
    const {
        distanceToWater,    // 0-1 (0 = dans l'eau, 1 = loin)
        altitude,           // 0-1
        temperature,        // 0-1
        windStrength,       // 0-1
        windFromOcean,      // boolean
        isRiver,           // boolean
        nearRiver          // 0-1
    } = config;

    let humidity = 0;

    // Base : proximité de l'eau
    humidity += (1 - distanceToWater) * 0.4;

    // Rivières apportent beaucoup d'humidité
    if (isRiver) humidity += 0.6;
    else humidity += (1 - nearRiver) * 0.3;

    // Température chaude → plus d'évaporation
    humidity += temperature * 0.2;

    // Vent depuis l'océan → humidité
    if (windFromOcean) {
        humidity += windStrength * 0.3;
    }

    // Altitude → moins d'humidité (effet de foehn)
    humidity *= Math.max(0.3, 1 - altitude * 0.5);

    return Math.max(0, Math.min(1, humidity));
}

/**
 * Calculer les précipitations annuelles (mm)
 */
export function calculatePrecipitation(humidity, temperature, windStrength) {
    // Plus d'humidité + température élevée = fortes pluies
    const base = humidity * 2000;  // Max 2000mm
    const tempBonus = temperature > 0.7 ? temperature * 500 : 0;  // Pluies tropicales
    const windBonus = windStrength * 300;  // Vent apporte humidité

    return base + tempBonus + windBonus;
}