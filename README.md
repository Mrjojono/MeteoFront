#  Station Météo IoT & Dashboard Big Data

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

##  Présentation du Projet

**SkyNode** est une solution complète de monitoring météorologique conçue pour l'écosystème Big Data. Le projet intègre une chaîne IoT complète, de l'acquisition des données (capteurs physiques ou sources satellitaires NASA) jusqu'à leur visualisation dynamique sur un dashboard haute performance.

Ce système répond aux enjeux de scalabilité et de traitement en temps réel des données environnementales pour des secteurs clés comme l'agriculture de précision, la gestion énergétique et l'éducation.

---

##  Architecture du Système

Le projet repose sur une architecture en 4 couches :

1.  **Acquisition** : Collecte des paramètres (Température, Humidité, Pression, Pluie) via capteurs IoT ou API NASA POWER/Earthdata.
2.  **Transmission** : Acheminement sécurisé des flux de données vers le Cloud (Protocoles MQTT / HTTP).
3.  **Stockage & Traitement** : Architecture Big Data scalable permettant de conserver l'historique massif et d'analyser les tendances.
4.  **Visualisation** : Interface Web moderne (React/TSX) offrant des vues temps réel et historiques.

---

##  Fonctionnalités Clés

-   ** Monitoring Temps Réel** : Visualisation instantanée des flux de données entrants.
-   ** Analyse Historique** : Consultation de données sur de longues périodes pour identifier des cycles météo.
-   ** Géolocalisation** : Chaque mesure est indexée par date, heure et coordonnées géographiques.
-   ** Dashboard Haute Performance** : Interface fluide développée avec Vite + React + TypeScript.
-   ** Cas d'Usages Intégrés** : Préréglages pour l'Agriculture, l'Énergie (solaire/éolien) et les infrastructures scolaires.

---

## 🛠️ Stack Technique

-   **Frontend** : React 18, TypeScript, Tailwind CSS.
-   **Build Tool** : Vite (HMR activé).
-   **Visualisation** : Lucide React (Icônes), Recharts/Chart.js (Graphiques).
-   **Data Source** : NASA POWER API / Sensors IoT.
-   **Architecture** : Système distribué orienté flux.

---

##  Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Un gestionnaire de paquets (npm, pnpm ou yarn)

### Étapes
1. **Cloner le projet**
   ```bash
   git clone https://github.com/votre-compte/skynode-iot.git
   cd skynode-iot
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'application en mode développement**
   ```bash
   npm run dev
   ```

---

##  Cas d'Usage (Business Intelligence)

| Secteur | Application |
| :--- | :--- |
| **Agriculture** | Optimisation de l'arrosage en fonction de l'humidité du sol et des prévisions de pluie. |
| **Énergie** | Analyse de l'ensoleillement et du vent pour le rendement des parcs photovoltaïques. |
| **Éducation** | Support pédagogique pour l'étude des changements climatiques en milieu scolaire. |

---

---
*Ce projet a été réalisé dans le cadre du module Big Data.*
