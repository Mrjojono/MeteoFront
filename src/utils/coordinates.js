// src/utils/coordinates.js

/**
 * Système de coordonnées géographiques réaliste
 * Permet de placer la carte n'importe où sur Terre
 */

export class GeoCoordinates {
    constructor(centerLat = 0, centerLong = 0, scale = 1) {
        this.centerLat = centerLat;    // -90 à 90 (Sud à Nord)
        this.centerLong = centerLong;  // -180 à 180 (Ouest à Est)
        this.scale = scale;            // km par unité
    }

    /**
     * Convertir position monde → coordonnées géographiques
     */
    worldToGeo(worldX, worldY) {
        // 1 unité monde ≈ scale km
        const lat = this.centerLat + (worldY * this.scale) / 111;  // 111 km par degré
        const long = this.centerLong + (worldX * this.scale) / (111 * Math.cos(this.centerLat * Math.PI / 180));

        return { lat, long };
    }

    /**
     * Obtenir la latitude normalisée (-1 à 1)
     * -1 = Pôle Sud, 0 = Équateur, 1 = Pôle Nord
     */
    getNormalizedLatitude(worldY) {
        const { lat } = this.worldToGeo(0, worldY);
        return lat / 90;  // Normaliser entre -1 et 1
    }

    /**
     * Calculer la distance à l'équateur (0-1)
     */
    getEquatorDistance(worldY) {
        return Math.abs(this.getNormalizedLatitude(worldY));
    }
}

/**
 * Configurations prédéfinies
 */
export const GEO_PRESETS = {
    EQUATOR: { lat: 0, long: 0, name: 'Équateur (Amazonie)' },
    TROPICAL: { lat: 20, long: -80, name: 'Caraïbes' },
    TEMPERATE: { lat: 45, long: 5, name: 'Europe tempérée' },
    POLAR: { lat: 70, long: 0, name: 'Arctique' },
    DESERT: { lat: 25, long: 30, name: 'Sahara' },
    MEDITERRANEAN: { lat: 40, long: 10, name: 'Méditerranée' }
};