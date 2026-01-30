// src/utils/riverSystem.js

/**
 * Génération de rivières réalistes avec flow accumulation
 */

export class RiverNetwork {
    constructor(getHeight, bounds) {
        this.getHeight = getHeight;
        this.bounds = bounds;
        this.rivers = [];
        this.flowMap = new Map();  // Accumulation de flux
    }

    /**
     * Générer le réseau de rivières complet
     */
    generate(config = {}) {
        const {
            numSources = 50,      // Nombre de sources
            minAltitude = 0.6,    // Altitude minimale des sources
            flowThreshold = 5,    // Flux minimum pour afficher une rivière
            waterLevel = 0.42     // Niveau de la mer
        } = config;

        // 1. Trouver les sources (points hauts)
        const sources = this.findSources(numSources, minAltitude);

        // 2. Calculer l'accumulation de flux
        this.calculateFlowAccumulation(sources, waterLevel);

        // 3. Extraire les rivières visibles
        this.extractRivers(flowThreshold);

        return this.rivers;
    }

    /**
     * Trouver des sources en altitude
     */
    findSources(numSources, minAltitude) {
        const sources = [];
        const { minX, maxX, minY, maxY } = this.bounds;

        for (let i = 0; i < numSources * 3; i++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            const h = this.getHeight(x, y);

            if (h >= minAltitude && h < 0.95) {
                sources.push({ x, y, altitude: h });
            }

            if (sources.length >= numSources) break;
        }

        return sources;
    }

    /**
     * Calculer l'accumulation de flux (flow accumulation)
     */
    calculateFlowAccumulation(sources, waterLevel) {
        this.flowMap.clear();

        for (let source of sources) {
            let current = { x: source.x, y: source.y };
            let flow = 1;  // Débit initial
            const visited = new Set();

            // Suivre la pente jusqu'à l'eau
            for (let step = 0; step < 200; step++) {
                const key = `${Math.round(current.x * 10)},${Math.round(current.y * 10)}`;

                if (visited.has(key)) break;  // Éviter les boucles
                visited.add(key);

                const h = this.getHeight(current.x, current.y);

                // Atteint l'eau → stop
                if (h < waterLevel) break;

                // Ajouter au flow map
                const currentFlow = this.flowMap.get(key) || 0;
                this.flowMap.set(key, currentFlow + flow);

                // Trouver la direction de plus grande pente
                const next = this.findLowestNeighbor(current.x, current.y, h);

                if (!next) break;  // Pas de pente → stop

                current = next;
                flow += 0.1;  // Le débit augmente légèrement
            }
        }
    }

    /**
     * Trouver le voisin le plus bas
     */
    findLowestNeighbor(x, y, currentH) {
        const step = 1.0;
        const directions = [
            [step, 0], [-step, 0], [0, step], [0, -step],
            [step, step], [-step, step], [step, -step], [-step, -step]
        ];

        let lowest = null;
        let lowestH = currentH;

        for (let [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const nh = this.getHeight(nx, ny);

            if (nh < lowestH) {
                lowestH = nh;
                lowest = { x: nx, y: ny };
            }
        }

        return lowest;
    }

    /**
     * Extraire les rivières à partir du flow map
     */
    extractRivers(threshold) {
        this.rivers = [];

        for (let [key, flow] of this.flowMap.entries()) {
            if (flow >= threshold) {
                const [x, y] = key.split(',').map(Number);
                this.rivers.push({
                    x: x / 10,
                    y: y / 10,
                    flow,  // Débit (utilisé pour largeur)
                    width: Math.min(3, 0.5 + Math.log(flow) * 0.5)
                });
            }
        }
    }

    /**
     * Vérifier si un point est une rivière
     */
    isRiver(x, y, tolerance = 1.5) {
        for (let river of this.rivers) {
            const dx = x - river.x;
            const dy = y - river.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < river.width * tolerance) {
                return { isRiver: true, flow: river.flow };
            }
        }
        return { isRiver: false, flow: 0 };
    }
}