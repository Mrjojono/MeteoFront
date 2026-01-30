// src/utils/riskZones.js

/**
 * Identification des zones à risque
 */

export const RISK_TYPES = {
    FLOOD: 'FLOOD',           // Inondation
    DROUGHT: 'DROUGHT',       // Sécheresse
    LANDSLIDE: 'LANDSLIDE',   // Glissement de terrain
    EROSION: 'EROSION',       // Érosion
    FIRE: 'FIRE'             // Feu de forêt
};

/**
 * Évaluer le risque d'inondation
 */
export function evaluateFloodRisk(config) {
    const {
        altitude,
        distanceToRiver,
        riverFlow,
        precipitation,
        slope
    } = config;

    let risk = 0;

    // Faible altitude + proche rivière = risque
    if (altitude < 0.50 && distanceToRiver < 5) {
        risk += (1 - altitude) * 0.4;
        risk += (1 - distanceToRiver / 5) * 0.3;
    }

    // Forte précipitation
    if (precipitation > 1500) {
        risk += (precipitation - 1500) / 1000 * 0.2;
    }

    // Rivière à fort débit
    risk += Math.min(riverFlow / 20, 0.3);

    // Faible pente (eau stagne)
    if (slope < 0.1) {
        risk += 0.2;
    }

    return Math.min(1, risk);
}

/**
 * Évaluer le risque de sécheresse
 */
export function evaluateDroughtRisk(config) {
    const {
        humidity,
        temperature,
        precipitation,
        distanceToWater
    } = config;

    let risk = 0;

    // Faible humidité
    risk += (1 - humidity) * 0.4;

    // Haute température
    if (temperature > 0.7) {
        risk += (temperature - 0.7) * 0.3;
    }

    // Faibles précipitations
    if (precipitation < 400) {
        risk += (400 - precipitation) / 400 * 0.3;
    }

    // Loin de l'eau
    risk += distanceToWater * 0.2;

    return Math.min(1, risk);
}

/**
 * Évaluer le risque de glissement de terrain
 */
export function evaluateLandslideRisk(config) {
    const {
        altitude,
        slope,
        precipitation,
        soilType
    } = config;

    let risk = 0;

    // Forte pente
    if (slope > 0.4) {
        risk += (slope - 0.4) * 1.5;
    }

    // En montagne
    if (altitude > 0.6) {
        risk += (altitude - 0.6) * 0.3;
    }

    // Fortes pluies
    if (precipitation > 1200) {
        risk += (precipitation - 1200) / 1500 * 0.4;
    }

    return Math.min(1, risk);
}

/**
 * Calculer tous les risques pour un point
 */
export function calculateAllRisks(config) {
    return {
        flood: evaluateFloodRisk(config),
        drought: evaluateDroughtRisk(config),
        landslide: evaluateLandslideRisk(config),
        // ... autres risques
    };
}

/**
 * Obtenir le risque dominant
 */
export function getDominantRisk(risks, threshold = 0.3) {
    let max = 0;
    let dominant = null;

    for (let [type, value] of Object.entries(risks)) {
        if (value > max && value >= threshold) {
            max = value;
            dominant = type;
        }
    }

    return { type: dominant, severity: max };
}