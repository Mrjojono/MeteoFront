#  Station Météo IoT & Dashboard Big Data

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

##  Présentation du Projet

il s'agit d'une solution complète de monitoring météorologique conçue pour l'écosystème Big Data. Le projet intègre une chaîne IoT complète, de l'acquisition des données (capteurs physiques ou sources satellitaires NASA) jusqu'à leur visualisation dynamique sur un dashboard haute performance.

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

##  Stack Technique

-   **Frontend** : React 19, TypeScript, Tailwind CSS.
-   **Build Tool** : Vite (HMR activé).
-   **Visualisation** : Lucide React (Icônes), Recharts (Graphiques), Leaflet (Carte).
-   **Backend** : FastAPI (Python), XGBoost, prévision de pluie mensuelle Sahel.
-   **Data Source** : CHIRPS v3.0, NOAA CPC (indices ENSO), ERSST v6.
-   **Architecture** : API FastAPI ↔ React, proxy Vite en développement.

---

##  Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Python 3.10+ avec les dépendances du backend (FastAPI, XGBoost, pandas, netCDF4)

### Étapes

1. **Lancer le backend (API FastAPI)**
   ```bash
   cd Nasa
   .venv/Scripts/python api.py --host 127.0.0.1 --port 8000
   ```
   Endpoints : `/api/meta`, `/api/frames`, `/api/forecast`, `/api/point`, `/api/alerts`, `/api/signals`, `/api/metrics`.

2. **Installer les dépendances frontend**
   ```bash
   cd MeteoFront
   npm install
   ```

3. **Lancer le frontend en mode développement**
   ```bash
   npm run dev
   ```
   Le proxy Vite (`vite.config.ts`) forward `/api` → `http://localhost:8000`. L'URL de base est configurable via `VITE_API_BASE_URL` dans `.env`.

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
