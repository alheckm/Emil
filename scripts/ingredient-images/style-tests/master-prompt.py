"""
Arbeitsstand fuer EINEN Master-Prompt, der nur noch die Zutat (als englische
Motiv-Beschreibung) uebergeben bekommt und daraus zuverlaessig ein Bild im
Pantone-Foto-Stil (siehe style-tests/generate.py Stil 2) erzeugt — aber ohne
den Farbkreis, im Hochformat 3:4, Zutat mittig im Bild, Hintergrund so nah wie
moeglich an #F0EDE6, unifarben ohne Verlauf. Keine Nachbearbeitung der
Hintergrundfarbe — die Farbe muss allein aus dem Prompt kommen.

Kein Teil der echten Pipeline (find-missing.mjs / subjects.mjs / process.py) —
reines Explorations-Skript. Ergebnis unter
scripts/ingredient-images/style-tests/out/ (gitignored).

    ~/.mflux/venv/bin/python scripts/ingredient-images/style-tests/master-prompt.py
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

TAG = "9-final"

SUBJECTS = {
    "banane": "a single ripe yellow banana, slightly curved, with a short stem visible at one end",
    "erdbeere": "a single ripe red strawberry with its green leafy calyx, stem pointing up",
    "brot": "a rustic round loaf of crusty bread with a floured, cracked crust",
    "blaubeeren": "a small pile of fresh blueberries with a soft powdery bloom on the skin",
}

# Der Master-Prompt: einziger freier Platzhalter ist {subject}. Zwei Punkte
# mussten gegen die Trainingsgewohnheit des Modells gegengesteuert werden:
# 1. Ohne "wie ein zentriertes App-Icon"-Vergleich rutscht das Motiv immer
#    Richtung untere Bildhaelfte (gelernt aus Boden-Produktfotos).
# 2. Die Farbbeschreibung ist bimodal, kein Kontinuum: "near-white, extremely
#    desaturated" trifft F0EDE6 fast exakt (Diff ~2-6), aber wirkt zu hell/
#    papieren. Jede waermere Beschreibung ("putty", "linen", "warm grey",
#    "oat", "ivory" — auch mit "not tan/cream" verneint) kippt zuverlaessig
#    auf einen satteren, sichtbar dunkleren Tanton (Diff ~20-32) — ueber
#    4 Wortvarianten UND 4 Seeds getestet, nie dazwischen. Entscheidung war
#    dann bewusst dieser waermere, praesente Ton statt des papierweissen.
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
    "to edge: a pale warm putty beige-grey, like unbleached linen or warm "
    "eggshell paper (hex F0EDE6, RGB 240 237 230). No gradient, no "
    "vignette, no darkened corners, no texture, no visible objects besides "
    "the subject. A soft, realistic, naturally soft-edged, compact shadow "
    "sits directly beneath the subject only. Natural studio lighting, "
    "sharp focus, high detail, realistic colours and textures, no text, no "
    "labels, no hands, no props, no other objects, no frame, no border."
)

ITEMS = [(f"{name}-{TAG}", MASTER_PROMPT.format(subject=subject)) for name, subject in SUBJECTS.items()]


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
