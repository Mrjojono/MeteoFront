# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personnes non techniques qui regardent le dashboard MeteoFront et doivent comprendre les termes (couche, anomalie, prévision, fourchette) et ce qu’on peut en faire concrètement. Confirmé par la demande du 15 novembre 2026.

## Product Purpose

Rendre lisible une démonstration de pluie prévue sur l’Afrique de l’Ouest / Sahel : expliquer l’écran en cours et relier les chiffres à des cas d’usage (agriculture, énergie, éducation). Succès : une réponse juste, courte, et immédiate, sans que la personne ait à connaître la météo.

## Positioning

Le guide lit les chiffres déjà affichés (lieu, période, couche, alerte, fourchette) et répond dans le navigateur. Une API d’IA peut compléter plus tard ; elle n’est pas requise, et aucun fournisseur n’est choisi.

## Operating Context

Dashboard Vite déjà lancé en local. Les données sont un jeu de démonstration calé sur 1981–1985 (écran par défaut : juin 1985), pas une prévision du jour. Le panneau Limites dit déjà que l’outil n’est pas une alerte opérationnelle.

## Capabilities and Constraints

- Le guide explique les couches affichées : pluie, anomalie en mm, écart en %, anomalie standardisée, probabilité d’être plus humide que la normale.
- Il propose des cas d’usage à partir du signal en cours.
- Les réponses locales n’inventent pas de chiffre hors des JSON du front.
- SPI 3 mois est décrit dans les métadonnées mais non disponible à l’écran.
- Branchement optionnel : `VITE_GUIDE_API_URL` reçoit la question et un résumé court, et doit renvoyer `{ "answer": "..." }`. Sans URL, seule la réponse locale est utilisée.
- Fournisseur, modèle et clé d’API : non décidés.

## Brand Commitments

Nom à l’écran : MeteoFront. Langue : français. Le guide s’ajoute au dashboard existant (bleu `#154a7a`, carte, onglets) sans le remplacer.

## Evidence on Hand

- `src/data/mockApi.ts` et JSON dans `src/back/`
- Alerte juin 1985 : anomalie régionale −24,3 %, niveau modéré, 71,9 % de la zone sous la normale
- Modèle : persistance d’anomalie amortie, skill contre la climatologie ≈ 0 sur le test 1985
- Pas de témoignage, client, ni prévision temps réel à inventer

## Product Principles

- D’abord la phrase simple, ensuite le terme technique.
- Un chiffre affiché vient des données du dashboard.
- Dire ce que la prévision ne sait pas faire.
- La réponse locale apparaît tout de suite ; l’API ne fait qu’enrichir.
- Le cas d’usage dépend du signal en cours, pas d’un exemple générique.
