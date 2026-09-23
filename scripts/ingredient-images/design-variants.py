"""
Design-Exploration fuer die "Marktregal"-Richtung (siehe DESIGN.md, noch
nicht im echten App-Code): erzeugt zu einer Zutat drei Bildvarianten, lokal
per mflux, Ergebnis landet unter design/ingredients_directions/ — NICHT in
der Produktions-Pipeline (public/zutaten/, ingredientImages.ts, palette.json
und subjects.mjs' buildPrompt/PALETTE bleiben unberuehrt). Motiv und Bewegung
lesen wir aus subjects.mjs (SUBJECTS, colorFor), lesend, nicht schreibend.

Drei Varianten pro Zutat:
  1. vollbild — Motiv fuellt den ganzen Rahmen, kein Hintergrund sichtbar
     (Kachel-Kandidat fuer echte Zutatenfotografie in der Einkaufsliste).
  2. grau     — Motiv freigestellt auf hellgrauem Studio-Grund (E8E8E8, das
                Feld der Marktregal-Richtung).
  3. bold     — Motiv freigestellt auf kraeftigem Farbgrund, automatisch aus
                genau vier Toenen gewaehlt (design-palette.json), passend
                zur Eigenfarben-Kategorie der Zutat (subjects.mjs COLORS).

Farbwahl bold (bewusste Entscheidung, kein Zufall):
  gruen/blau/rot-orange decken die drei Kategorien gleichen Namens direkt ab.
  "yellow" (Zwiebel, Milchprodukte, Reis, …) faellt auf "gold" — das ist
  zufaellig derselbe Hex wie DESIGN.md's --accent (F2F1B1); in einer
  Kachel-Uebersicht koennte das mit "aktiv/antippbar" verwechselt werden.
  Fuer diese Design-Exploration ist das hinnehmbar, fuer eine Produktions-
  Entscheidung waere das ein eigener Punkt. "purple" (Aubergine, Rotkohl,
  Trauben) faellt auf "blau" (A5B4BB) statt auf das waermere "rot-orange" —
  kuehle Farbfamilie passt zu den meisten lilafarbenen Zutaten besser.

    ~/.mflux/venv/bin/python scripts/ingredient-images/design-variants.py --names Erdbeeren,Brot
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "design" / "ingredients_directions"
PALETTE_FILE = Path(__file__).resolve().parent / "design-palette.json"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42
STEPS = 4
WIDTH = 768
HEIGHT = 1024

UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}

CATEGORY_TO_BOLD = {
    "yellow": "gold",
    "orange": "rot-orange",
    "red": "rot-orange",
    "green": "gruen",
    "blue": "blau",
    "purple": "blau",
}

CENTERED_BASE = (
    "Photorealistic studio product photograph of {subject}, composed like a "
    "centered app icon: the subject rests naturally on the same flat "
    "backdrop surface as the background, in full contact with it — not "
    "floating, not suspended in mid-air, no gap between the subject and "
    "the surface. Positioned in the vertical middle of the frame with an "
    "empty, equally wide band of background above it and an equal empty "
    "band below it around its shadow — NOT shoved down to the bottom "
    "edge, NOT a cropped floor-level product shot. Photographed from the "
    "front at a slight eye-level angle (not from above), portrait "
    "orientation. The entire background is one completely flat, uniform, "
    "matte colour filling the frame edge to edge: {tint}. No gradient, no "
    "vignette, no darkened corners, no texture, no visible objects besides "
    "the subject. A soft, realistic, naturally soft-edged contact shadow "
    "touches the subject directly where it meets the surface, anchoring it "
    "firmly in place — never a visible gap between the subject and its "
    "shadow. Natural studio lighting, sharp focus, high detail, realistic "
    "colours and textures, no text, no labels, no hands, no props, no "
    "other objects, no frame, no border."
)

FULLSCREEN_TEMPLATE = (
    "Extreme close-up macro photograph of {subject}. Show several of them "
    "together, piled up and overlapping in a densely packed cluster that "
    "fills the entire frame edge to edge — pieces of the subject must "
    "reach into and fill all four corners of the frame. A single isolated "
    "item surrounded by background is wrong even if cropped close: this "
    "must be several pieces packed tightly enough that absolutely no "
    "background or backdrop is visible anywhere in the frame, not even a "
    "sliver at the corners or edges. Photographed from a slightly elevated "
    "angle with natural studio lighting, sharp focus, high detail, "
    "realistic colours and textures, no text, no labels, no hands, no "
    "props, no other objects, no frame, no border, no vignette."
)


def slugify(name: str) -> str:
    out = name.lower()
    for k, v in UMLAUTS.items():
        out = out.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", out).strip("-")


def load_subjects_and_categories(names: list[str]) -> dict[str, tuple[str, str]]:
    """{Zutatenname: (Motivtext, Farbkategorie)} — nur lesend aus subjects.mjs."""
    script = """
    import('%s/scripts/ingredient-images/subjects.mjs').then((subj) => {
      const names = %s;
      const out = Object.fromEntries(names.map((n) => {
        const subject = subj.SUBJECTS[n];
        if (!subject) return [n, null];
        return [n, [subject, subj.colorFor(n)]];
      }));
      console.log(JSON.stringify(out));
    });
    """ % (ROOT, json.dumps(names))
    raw = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(raw.stdout)


def build_jobs(names: list[str]) -> list[tuple[str, str]]:
    palette = json.loads(PALETTE_FILE.read_text())
    resolved = load_subjects_and_categories(names)

    missing = [n for n, v in resolved.items() if v is None]
    if missing:
        print(f"kein Bildmotiv in subjects.mjs fuer: {missing} — uebersprungen")

    jobs = []
    for name, value in resolved.items():
        if value is None:
            continue
        subject, category = value
        slug = slugify(name)
        bold_key = CATEGORY_TO_BOLD[category]

        jobs.append((f"{slug}-vollbild", FULLSCREEN_TEMPLATE.format(subject=subject)))
        jobs.append((f"{slug}-grau", CENTERED_BASE.format(subject=subject, tint=palette["gray"]["prompt"])))
        jobs.append((f"{slug}-bold", CENTERED_BASE.format(subject=subject, tint=palette[bold_key]["prompt"])))
    return jobs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--names", required=True, help="Zutaten aus subjects.mjs, mit Komma getrennt")
    args = ap.parse_args()

    names = [n.strip() for n in args.names.split(",")]
    jobs = build_jobs(names)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    todo = [(n, p) for n, p in jobs if not (OUT_DIR / f"{n}.png").exists()]
    print(f"{len(jobs)} Bilder, {len(jobs) - len(todo)} schon da, {len(todo)} zu erzeugen\n", flush=True)
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
            image.save(path=str(path))
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
            f"  [{i}/{len(todo)}] {name:<28} {times[-1]:5.1f}s   Rest ca. {eta/60:.0f} min",
            flush=True,
        )

    print(f"\nfertig: {len(times)} Bilder in {sum(times)/60:.0f} min -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
