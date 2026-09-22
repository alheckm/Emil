"""
Variante zu master-prompt.py: derselbe Master-Prompt trifft den
Hintergrundton nicht zuverlaessig gleich, egal welche Zutat generiert wird
(Farbe ist im Prompt fix beschrieben, aber das Modell mischt sie je nach
Motiv leicht anders). Statt gegen dieses Rauschen anzukaempfen, wird der
Hintergrund hier bewusst zutatenabhaengig gemacht — ein leichter, klar
sichtbarer Hauch der Eigenfarbe der Zutat auf fast-weiss (Basis
App-Hintergrund #F7F6F2), nicht aufdringlich, klar heller Ton, kein
Farbblock.

Ein Zwischenstand hatte versucht, dem Modell die Regel "Hintergrundfarbe =
blasse Version der Zutatenfarbe" direkt im Prompt-Text mitzugeben und die
Farbe selbst aus der {subject}-Beschreibung ableiten zu lassen (nur noch
{subject} als Platzhalter, keine Tabelle mehr). Das hat NICHT funktioniert:
die Erdbeere (rot) bekam einen gelb-cremigen statt rosa Hintergrund — ein
Diffusionsmodell kann offenbar keine "wenn Farbe X, dann Ton Y"-Liste aus
einem einzigen Prompt zuverlaessig anwenden, es mischt stattdessen alle
genannten Beispielfarben zu einem Mittelwert.

Deshalb wieder ein expliziter {tint}-Platzhalter — aber die Farbe kommt
nicht mehr aus einer von Hand gepflegten Zutat->Farbe-Tabelle, sondern aus
COLORS in subjects.mjs (via colorFor(), derselbe Subprocess-Aufruf wie in
process.py/generate.py). COLORS kennt nur 6 Kategorien (yellow/red/green/
orange/purple/blue — "beige" wurde als eigene Kategorie gestrichen, siehe
subjects.mjs) und hat fuer jede der ~350 Zutaten UND jede kuenftige (Default
"yellow") schon einen Eintrag — TINT_PHRASES unten muss nur diese 6
Kategorien abdecken, nicht jede Zutat einzeln. Skaliert also automatisch
mit, ohne dass hier je etwas nachgepflegt werden muss.

Ersetzt NICHT master-prompt.py / dessen out/*-9-final.png (beiger,
einheitlicher Ton) — das bleibt die andere Variante zum Vergleich.

Kein Teil der echten Pipeline (find-missing.mjs / subjects.mjs / process.py) —
reines Explorations-Skript. Ergebnis unter
scripts/ingredient-images/style-tests/out/ (gitignored).

    ~/.mflux/venv/bin/python scripts/ingredient-images/style-tests/tinted-master-prompt.py
"""

import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = Path(__file__).resolve().parent / "out"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42
STEPS = 4
WIDTH = 768
HEIGHT = 1024  # 3 breit : 4 hoch

TAG = "12-category-tint"

SUBJECTS = {
    "banane": "a single ripe yellow banana, slightly curved, with a short stem visible at one end",
    "erdbeere": "a single ripe red strawberry with its green leafy calyx, stem pointing up",
    "brot": "a rustic round loaf of crusty bread with a floured, cracked crust",
    "blaubeeren": "a small pile of fresh blueberries with a soft powdery bloom on the skin",
}

# Deutscher Zutatenname fuer den colorFor()-Lookup in subjects.mjs.
GERMAN_NAME = {
    "banane": "Banane",
    "erdbeere": "Erdbeeren",
    "brot": "Brot",
    "blaubeeren": "Blaubeeren",
}

# Deckt alle 6 Kategorien aus COLORS in subjects.mjs ab — nicht pro Zutat,
# sondern pro Kategorie, damit jede kuenftige Zutat automatisch eine davon
# erbt, sobald sie einen COLORS-Eintrag hat (oder per Default "yellow").
# Etwas praesenter als der erste Versuch ("barely perceptible" wirkte laut
# Rueckmeldung zu schwach) — weiterhin blass, aber deutlich sichtbar.
#
# Formuliert als fertige Hintergrundfarbe, nicht als Mischanweisung: ein
# frueherer Versuch liess das Modell "F7F6F2 als Basis mit {tint} vermischt"
# umsetzen ("... with {tint} mixed in") — das Mischen selbst brachte
# sichtbar Unruhe in den Hintergrund (leichte Farbverlaeufe/Flecken statt
# einer einzigen flachen Flaeche), vermutlich weil "Basis X + Farbe Y
# mischen" zwei widerspruechliche Anweisungen im selben Satz sind. Jetzt
# wird direkt die gewuenschte Endfarbe benannt.
#
# Kein Eintrag "beige" mehr: die Kategorie wurde in subjects.mjs komplett
# gestrichen, jede vormals "beige" markierte Zutat laeuft jetzt ueber
# "yellow" oder "orange" — colorFor() kann "beige" also nie mehr liefern.
TINT_PHRASES = {
    "yellow": "a soft pastel warm yellow, almost white but clearly tinted",
    "red": "a soft pastel rose-red, almost white but clearly tinted",
    "green": "a soft pastel sage-green, almost white but clearly tinted",
    "orange": "a soft pastel peachy orange, almost white but clearly tinted",
    "purple": "a soft pastel mauve-purple, almost white but clearly tinted",
    "blue": "a soft pastel powder-blue, almost white but clearly tinted",
}


def color_categories() -> dict[str, str]:
    script = (
        "import('%s/scripts/ingredient-images/subjects.mjs').then(m => "
        "console.log(JSON.stringify(Object.fromEntries("
        "Object.keys(m.COLORS).map(n => [n, m.colorFor(n)])))))" % ROOT
    )
    res = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


# Der Master-Prompt: freie Platzhalter sind {subject} und {tint}.
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
    "to edge: {tint} studio backdrop colour — a gentle pastel wash, more "
    "than just a whisper of colour, but still light and airy, not vivid, "
    "not saturated, not a bold colour block. No gradient, no "
    "vignette, no darkened corners, no texture, no visible objects besides "
    "the subject. A soft, realistic, naturally soft-edged, compact shadow "
    "sits directly beneath the subject only. Natural studio lighting, "
    "sharp focus, high detail, realistic colours and textures, no text, no "
    "labels, no hands, no props, no other objects, no frame, no border."
)

_categories = color_categories()
ITEMS = [
    (
        f"{name}-{TAG}",
        MASTER_PROMPT.format(
            subject=subject,
            tint=TINT_PHRASES[_categories[GERMAN_NAME[name]]],
        ),
    )
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
