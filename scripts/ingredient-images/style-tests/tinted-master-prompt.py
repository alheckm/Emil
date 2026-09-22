"""
Variante zu master-prompt.py: derselbe Master-Prompt trifft den
Hintergrundton nicht zuverlaessig gleich, egal welche Zutat generiert wird
(Farbe ist im Prompt fix beschrieben, aber das Modell mischt sie je nach
Motiv leicht anders). Statt gegen dieses Rauschen anzukaempfen, wird der
Hintergrund hier bewusst zutatenabhaengig gemacht — ein ganz leichter Hauch
der Eigenfarbe der Zutat auf fast-weiss (Basis App-Hintergrund #F7F6F2),
nicht aufdringlich, klar heller Ton, kein Farbblock.

Master-Prompt bleibt EIN Prompt-Template mit zwei Platzhaltern: {subject}
(Motiv) und {tint} (die Farbkategorie der Zutat — dieselben Kategorien wie
in subjects.mjs COLORS, damit spaeter jede Zutat einfach eingehaengt werden
kann).

Ersetzt NICHT master-prompt.py / dessen out/*-9-final.png (beiger,
einheitlicher Ton) — das bleibt die andere Variante zum Vergleich.

Kein Teil der echten Pipeline (find-missing.mjs / subjects.mjs / process.py) —
reines Explorations-Skript. Ergebnis unter
scripts/ingredient-images/style-tests/out/ (gitignored).

    ~/.mflux/venv/bin/python scripts/ingredient-images/style-tests/tinted-master-prompt.py
"""

import sys
import time
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "out"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42
STEPS = 4
WIDTH = 768
HEIGHT = 1024  # 3 breit : 4 hoch

TAG = "10-tinted"

SUBJECTS = {
    "banane": "a single ripe yellow banana, slightly curved, with a short stem visible at one end",
    "erdbeere": "a single ripe red strawberry with its green leafy calyx, stem pointing up",
    "brot": "a rustic round loaf of crusty bread with a floured, cracked crust",
    "blaubeeren": "a small pile of fresh blueberries with a soft powdery bloom on the skin",
}

# Farbkategorie je Zutat — dieselbe Zuordnung wie COLORS in subjects.mjs
# (Banane/Erdbeeren/Blaubeeren/Brot dort ebenfalls yellow/red/blue/beige).
TINTS = {
    "banane": "warm yellow",
    "erdbeere": "soft red-pink",
    "brot": "warm beige-tan",
    "blaubeeren": "cool blue-grey",
}

# Der Master-Prompt: einzige freie Platzhalter sind {subject} und {tint}.
MASTER_PROMPT = (
    "Photorealistic studio product photograph of {subject}, composed like a "
    "centered app icon: the subject occupies the middle third of the frame "
    "vertically, with an empty, equally wide band of background above it "
    "and an equal empty band of background below it — NOT resting near the "
    "bottom edge, NOT a floor-level product shot, the subject floats in "
    "the vertical middle of the image with generous background margin on "
    "all four sides. Photographed from the front at a slight eye-level "
    "angle (not from above), portrait orientation. The entire background "
    "is one completely flat, uniform, matte colour filling the frame edge "
    "to edge: an almost-white studio backdrop (hex F7F6F2) with only the "
    "faintest possible {tint} tint mixed in — barely perceptible, still "
    "reads as near-white and airy, not a pastel colour block, not vivid, "
    "not saturated, just the gentlest whisper of colour. No gradient, no "
    "vignette, no darkened corners, no texture, no visible objects besides "
    "the subject. A soft, realistic, naturally soft-edged, compact shadow "
    "sits directly beneath the subject only. Natural studio lighting, "
    "sharp focus, high detail, realistic colours and textures, no text, no "
    "labels, no hands, no props, no other objects, no frame, no border."
)

ITEMS = [
    (f"{name}-{TAG}", MASTER_PROMPT.format(subject=subject, tint=TINTS[name]))
    for name, subject in SUBJECTS.items()
]


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = [(n, p) for n, p in ITEMS if not (OUT_DIR / f"{n}.png").exists()]
    done = len(ITEMS) - len(todo)
    print(f"{len(ITEMS)} Bilder, {done} schon da, {len(todo)} zu erzeugen\n", flush=True)
    if not todo:
        return 0

    from mflux.models.common.resolution.config_resolution import ConfigResolution
    from mflux.models.z_image.variants.z_image import ZImage

    print("lade Modell …", flush=True)
    t0 = time.time()
    model = ZImage(
        model_config=ConfigResolution.resolve_restricted(
            MODEL_REPO, "z-image-turbo", model_path=MODEL_REPO
        ),
        model_path=MODEL_REPO,
    )
    print(f"Modell geladen in {time.time() - t0:.0f}s\n", flush=True)

    times: list[float] = []
    for i, (name, prompt) in enumerate(todo, 1):
        path = OUT_DIR / f"{name}.png"
        t = time.time()
        try:
            image = model.generate_image(
                seed=SEED, prompt=prompt, num_inference_steps=STEPS,
                width=WIDTH, height=HEIGHT,
            )
            image.image.save(path)
        except KeyboardInterrupt:
            print("\nabgebrochen — bereits erzeugte Bilder bleiben erhalten")
            return 130
        except Exception as exc:
            print(f"  [{i}/{len(todo)}] {name}: FEHLER {exc}", flush=True)
            continue

        times.append(time.time() - t)
        avg = sum(times) / len(times)
        eta = avg * (len(todo) - i)
        print(
            f"  [{i}/{len(todo)}] {name:<28} {times[-1]:5.1f}s   Rest ca. {eta/60:.1f} min",
            flush=True,
        )

    print(f"\nfertig: {len(times)} Bilder in {sum(times)/60:.1f} min -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
