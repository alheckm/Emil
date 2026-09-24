"""
Design-Exploration fuer die "Marktregal"-Richtung (siehe DESIGN.md, noch
nicht im echten App-Code): erzeugt zu einzelnen, namentlich angegebenen
Zutaten drei Bildvarianten zum Vergleich, Ergebnis landet unter
design/ingredients_directions/ (bleibt im Repo — dient dem visuellen
Vergleich, nicht der Deploy-Pipeline). Fuer den automatisierten Produktions-
Lauf siehe generate-marktregal.py stattdessen.

Drei Varianten pro Zutat — Details und Prompt-Formulierung in
marktregal_prompts.py:
  1. vollbild — Motiv fuellt den ganzen Rahmen, kein Hintergrund sichtbar.
  2. grau     — Motiv freigestellt auf hellgrauem Studio-Grund.
  3. bold     — Motiv freigestellt auf kraeftigem Farbgrund (eine von vier
                Farben, automatisch nach Eigenfarben-Kategorie gewaehlt).

    ~/.mflux/venv/bin/python scripts/ingredient-images/design-variants.py --names Erdbeeren,Brot
"""

import argparse
import sys

from marktregal_prompts import ROOT, build_jobs, generate_missing_pngs

OUT_DIR = ROOT / "design" / "ingredients_directions"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--names", required=True, help="Zutaten aus subjects.mjs, mit Komma getrennt")
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",")]
    jobs, ohne_motiv = build_jobs(names)
    if ohne_motiv:
        print(f"kein Bildmotiv in subjects.mjs fuer: {ohne_motiv} — uebersprungen")

    already = sum(1 for n, _ in jobs if (OUT_DIR / f"{n}.png").exists())
    print(f"{len(jobs)} Bilder, {already} schon da, {len(jobs) - already} zu erzeugen\n", flush=True)

    generate_missing_pngs(jobs, OUT_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main())
