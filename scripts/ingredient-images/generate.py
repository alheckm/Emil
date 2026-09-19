"""
Erzeugt zu jeder Zutat ein Bild — lokal, offline, ohne API-Kosten.

Warum ein eigenes Skript und nicht 350 CLI-Aufrufe: die CLI laedt das Modell
bei jedem Aufruf neu (~20 s). Einmal laden und durchlaufen spart Stunden.

Der Lauf ist abbrechbar und wiederaufnehmbar: vorhandene Dateien werden
uebersprungen. Ctrl-C ist jederzeit sicher.

    ~/.mflux/venv/bin/python scripts/ingredient-images/generate.py [--limit N] [--only NAME]
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "scripts" / "ingredient-images" / "raw"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42          # fest: gleicher Ausgangspunkt fuer alle 350 Bilder
STEPS = 4          # Turbo-Modell, mehr bringt kaum etwas
SIZE = 768         # Chips sind winzig; 768 reicht und ist deutlich schneller als 1024

UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}


def slugify(name: str) -> str:
    out = name.lower()
    for k, v in UMLAUTS.items():
        out = out.replace(k, v)
    out = re.sub(r"[^a-z0-9]+", "-", out).strip("-")
    return out


def load_ingredients() -> list[tuple[str, str]]:
    """Zutaten + Motive aus subjects.mjs holen — jede Zutat mit definiertem
    Bildmotiv, nicht nur die feste Stammdaten-Liste. Zutaten, die erst beim
    Rezept-Import entstanden sind (z. B. "Berglinsen"), stehen nur hier."""
    script = """
    import('%s/scripts/ingredient-images/subjects.mjs').then((subj) => {
      const out = Object.entries(subj.SUBJECTS).map(
        ([name, subject]) => [name, subj.buildPrompt(subject)],
      );
      console.log(JSON.stringify(out));
    });
    """ % ROOT
    raw = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return [tuple(x) for x in json.loads(raw.stdout)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="nur die ersten N Zutaten")
    ap.add_argument("--only", help="nur Zutaten, deren Name diesen Text enthaelt")
    ap.add_argument("--names", help="genau diese Zutaten, mit Komma getrennt")
    ap.add_argument("--size", type=int, default=SIZE)
    ap.add_argument("--steps", type=int, default=STEPS)
    args = ap.parse_args()

    items = load_ingredients()
    if args.names:
        wanted = [n.strip() for n in args.names.split(",")]
        missing = [n for n in wanted if n not in dict(items)]
        if missing:
            print(f"unbekannte Zutaten: {missing}")
            return 1
        items = [i for i in items if i[0] in wanted]
    if args.only:
        items = [i for i in items if args.only.lower() in i[0].lower()]
    if args.limit:
        items = items[: args.limit]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = [(n, p) for n, p in items if not (OUT_DIR / f"{slugify(n)}.png").exists()]
    done = len(items) - len(todo)
    print(f"{len(items)} Zutaten, {done} schon da, {len(todo)} zu erzeugen\n", flush=True)
    if not todo:
        return 0

    # Import erst hier: der Modell-Ladevorgang dauert, das soll nicht passieren,
    # wenn ohnehin nichts zu tun ist.
    from mflux.models.common.resolution.config_resolution import ConfigResolution
    from mflux.models.z_image.variants.z_image import ZImage

    print("lade Modell …", flush=True)
    t0 = time.time()
    # Wie die CLI: ein fremdes HF-Repo laeuft als model_path, die Geometrie
    # leitet mflux aus dem Namen ab ("...Z-Image-Turbo..." -> z-image-turbo).
    model = ZImage(
        model_config=ConfigResolution.resolve_restricted(
            MODEL_REPO, "z-image-turbo", model_path=MODEL_REPO
        ),
        model_path=MODEL_REPO,
    )
    print(f"Modell geladen in {time.time() - t0:.0f}s\n", flush=True)

    times: list[float] = []
    for i, (name, prompt) in enumerate(todo, 1):
        path = OUT_DIR / f"{slugify(name)}.png"
        t = time.time()
        try:
            image = model.generate_image(
                seed=SEED, prompt=prompt, num_inference_steps=args.steps,
                width=args.size, height=args.size,
            )
            image.save(path=str(path))
        except KeyboardInterrupt:
            print("\nabgebrochen — bereits erzeugte Bilder bleiben erhalten")
            return 130
        except Exception as exc:  # ein kaputtes Bild darf den Lauf nicht killen
            print(f"  [{i}/{len(todo)}] {name}: FEHLER {exc}", flush=True)
            continue

        times.append(time.time() - t)
        avg = sum(times) / len(times)
        eta = avg * (len(todo) - i)
        print(
            f"  [{i}/{len(todo)}] {name:<28} {times[-1]:5.1f}s   "
            f"Rest ca. {eta/60:.0f} min",
            flush=True,
        )

    print(f"\nfertig: {len(times)} Bilder in {sum(times)/60:.0f} min -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
