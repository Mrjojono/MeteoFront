---
version: 1
slug: "src-components-dashboard-guidepanel-tsx"
primary_target: "src/components/dashboard/GuidePanel.tsx"
related_targets: ["src/pages/Dashboard.tsx"]
---

# Guide — En clair

Mode: Operate

Audience: personne non technique sur le dashboard. Tâche: comprendre la couche, la prévision et un cas d’usage sans quitter la carte. Contrainte: le dashboard (sidebar, carte, onglets) reste l’outil principal. Le guide est une colonne, pas une nouvelle page.

## Direction contract

THESIS: Une lecture vivante de l’écran, collée à la carte. Le guide refuse le chatbot générique qui salue puis attend : la première chose visible est ce que la carte dit maintenant.

OWN-WORLD: Même bleu de travail `#154a7a`, fond blanc, coins 12px, texte système. La lecture en cours est un bandeau pâle tiré du fond de carte `#d7ecef`. Pas de nouvelle palette.

STORY: La personne ouvre « En clair », lit la situation du lieu et de la couche, puis demande le sens d’un mot ou un cas pratique. Changer de couche met à jour la lecture sans nouvelle question.

FIRST VIEWPORT: La carte reste à gauche. À droite, une colonne d’environ 30rem : titre « En clair », bandeau de lecture, trois pistes, puis la conversation et le champ en bas. Fermée, il ne reste qu’un rail avec le même titre.

FORM: Extension locale du dashboard, sans nouveau monde visuel. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
