import json
import math
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out_dir = root / "src" / "back"

times: list[str] = []
year, month = 1981, 1
while (year, month) <= (1985, 9):
    times.append(f"{year:04d}-{month:02d}-01")
    month += 1
    if month == 13:
        year += 1
        month = 1


def oni(t: str) -> float:
    y, m = int(t[:4]), int(t[5:7])
    x = y + (m - 1) / 12
    nino = 2.1 * math.exp(-(((x - 1983.0) * 12) ** 2) / (2 * 8**2))
    if x < 1982.3:
        nino *= 0.2
    if x > 1983.7:
        nino = -0.6 * math.exp(-(((x - 1984.5) * 12) ** 2) / (2 * 10**2))
    seasonal = 0.15 * math.sin(2 * math.pi * (m - 3) / 12)
    return round(nino + seasonal, 2)


def tna(t: str) -> float:
    y, m = int(t[:4]), int(t[5:7])
    x = y + (m - 1) / 12
    base = 0.35 * math.sin(2 * math.pi * (x - 1981.2) / 3.5)
    seasonal = 0.2 * math.sin(2 * math.pi * (m - 8) / 12)
    return round(base + 0.25 * oni(t) + seasonal, 2)


def gog(t: str) -> float:
    m = int(t[5:7])
    seasonal = 0.45 * math.sin(2 * math.pi * (m - 4) / 12)
    return round(seasonal + 0.2 * oni(t), 2)


series = [{"time": t, "oni": oni(t), "tna": tna(t), "gog": gog(t)} for t in times]

signals = {
    "resource": "signals",
    "contract_version": "1.0.0",
    "status": "placeholder",
    "note": (
        "Jeu factice M8 en attendant le fichier M3. Forme schematique "
        "(El Nino 1982-83, TNA, Golfe de Guinee). Ne pas citer comme observation reelle."
    ),
    "units": {"oni": "degC", "tna": "degC anomalie", "gog": "degC anomalie"},
    "labels": {
        "oni": "ONI (Pacifique / El Nino)",
        "tna": "SST Atlantique tropical nord (TNA)",
        "gog": "SST Golfe de Guinee",
    },
    "lags_months_literature": {"oni": [4, 8], "tna": [3, 6], "gog": [1, 3]},
    "series": series,
}

metrics = {
    "resource": "metrics",
    "contract_version": "1.0.0",
    "status": "partial",
    "note": (
        "RMSE/MAE/biais/skill du modele : fichier forecast mock (holdout 1985). "
        "R2, NSE, PBIAS du modele : non livrés par M7. Reference climatologie : "
        "calculee sur les 3 villes mock (pluie vs normale du mois)."
    ),
    "target": "rain_mm (et skill en anomalie)",
    "models": [
        {
            "id": "climatology",
            "label": "Climatologie (normale du mois)",
            "kind": "reference",
            "split": "observations 1981-06/1985, 3 villes",
            "n": 162,
            "on": "rain_mm vs clim_mm (cycle saisonnier inclus)",
            "rmse": 20.57,
            "mae": 11.44,
            "bias": 0.75,
            "r2": 0.858,
            "nse": 0.858,
            "pbias": 2.06,
            "skill_vs_climatology": 0,
            "comment": "Un R2 eleve ici reflete surtout le cycle saisonnier, pas une vraie prevision.",
        },
        {
            "id": "climatology-anomaly",
            "label": "Climatologie en anomalie (prevoir 0)",
            "kind": "reference",
            "split": "observations 1981-06/1985, 3 villes",
            "n": 162,
            "on": "anomaly_mm vs 0",
            "rmse": 20.57,
            "mae": 11.43,
            "bias": 0.74,
            "r2": -0.001,
            "nse": -0.001,
            "pbias": None,
            "skill_vs_climatology": 0,
            "comment": "En anomalie, prevoir la normale a un NSE ~ 0 par construction.",
        },
        {
            "id": "baseline-persistence-anomaly-v1",
            "label": "Persistance d'anomalie amortie (reference M5)",
            "kind": "baseline",
            "split": "holdout 1985, lead 1 mois, grille",
            "n": 20820,
            "on": "rain_mm (evaluation fournie par le mock forecast)",
            "rmse": 30.32,
            "mae": 15.31,
            "bias": 2.35,
            "r2": None,
            "nse": None,
            "pbias": None,
            "skill_vs_climatology": -0.001,
            "comment": "Skill negatif ou nul : le modele ne bat pas la climatologie sur le test. R2/NSE/PBIAS absents du contrat mock.",
        },
        {
            "id": "baseline-persistence-anomaly-v1-lead3",
            "label": "Persistance d'anomalie amortie, lead 3 mois",
            "kind": "baseline",
            "split": "holdout 1985, lead 3 mois, grille",
            "n": 20820,
            "on": "rain_mm",
            "rmse": 30.3,
            "mae": None,
            "bias": 3.06,
            "r2": None,
            "nse": None,
            "pbias": None,
            "skill_vs_climatology": 0.0,
            "comment": "Idem au lead 3. MAE non fournie dans le mock.",
        },
    ],
}

(out_dir / "mock-signals.json").write_text(
    json.dumps(signals, ensure_ascii=True, indent=2), encoding="utf-8"
)
(out_dir / "mock-metrics.json").write_text(
    json.dumps(metrics, ensure_ascii=True, indent=2), encoding="utf-8"
)
print("wrote", len(series), "signal months")
