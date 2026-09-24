"""
Geteilte Prompt-Logik fuer die "Marktregal"-Bildvarianten (vollbild/grau/
bold) — von zwei Skripten genutzt, damit es nie zwei konkurrierende
Formulierungen fuer denselben Job gibt:

  design-variants.py    — Design-Exploration, einzelne benannte Zutaten,
                           Ergebnis nach design/ingredients_directions/
                           (bleibt im Repo, dient dem visuellen Vergleich).
  generate-marktregal.py — Produktions-Lauf fuer die Deploy-Pipeline,
                           Ergebnis (WebP) nach public/zutaten-marktregal/.

Liest subjects.mjs (SUBJECTS, colorFor) nur lesend.
"""

import json
import re
import subprocess
import time
from pathlib import Path
from typing import Callable, Optional

ROOT = Path(__file__).resolve().parents[2]
PALETTE_FILE = Path(__file__).resolve().parent / "design-palette.json"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42
STEPS = 4
WIDTH = 768
HEIGHT = 1024

UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}

# Bewusste Entscheidung, kein Zufall: gruen/blau/rot-orange decken die drei
# Kategorien gleichen Namens direkt ab. "yellow" faellt auf "gold" (zufaellig
# derselbe Hex wie DESIGN.md --accent — in einer Kachel-Uebersicht theoretisch
# mit "aktiv/antippbar" verwechselbar, hier hingenommen). "purple" faellt auf
# "blau" statt "rot-orange" — kuehle Familie passt zu den meisten lilafarbenen
# Zutaten besser (Aubergine, Rotkohl).
CATEGORY_TO_BOLD = {
    "yellow": "gold",
    "orange": "rot-orange",
    "red": "rot-orange",
    "green": "gruen",
    "blue": "blau",
    "purple": "blau",
}

# Drei Punkte mussten gegen die Trainingsgewohnheit des Modells
# gegengesteuert werden (aus der fruehesten Fassung dieses Prompts, damals in
# subjects.mjs buildPrompt, siehe Git-Historie):
# 1. Ohne "wie ein zentriertes App-Icon"-Vergleich rutscht das Motiv immer
#    Richtung untere Bildhaelfte (gelernt aus Boden-Produktfotos) — deshalb
#    Hochformat 3:4 mit explizitem Rand oben UND unten.
# 2. Die Hintergrundfarbe muss als fertige Endfarbe benannt werden, nicht als
#    Mischanweisung ("Basis X mit Farbe Y gemischt") — das brachte sichtbar
#    Unruhe (Farbverlaeufe/Flecken) in den Hintergrund, vermutlich weil
#    "Basis + mischen" zwei widerspruechliche Anweisungen im selben Satz
#    sind. Der Palette-Text ist deshalb schon die fertige Formulierung.
# 3. "floats"/"floats in the vertical middle" (fruehere Fassung) wurde vom
#    Modell bei manchen Zutaten woertlich genommen: sichtbare Luecke
#    zwischen Motiv und Schatten, das Motiv schwebt erkennbar (z. B.
#    Paprika), waehrend andere Zutaten trotzdem geerdet blieben (z. B.
#    Tomate, Karotte) — inkonsistent innerhalb derselben Bilderreihe. Jetzt
#    steht explizit "rests on the surface" plus ein beruehrender
#    Kontaktschatten, das Wort "floats" kommt nicht mehr vor.
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


def load_subjects_and_categories(names: list[str]) -> dict[str, tuple[str, str] | None]:
    """{Zutatenname: (Motivtext, Farbkategorie) | None} — nur lesend aus subjects.mjs."""
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


def build_jobs(names: list[str]) -> tuple[list[tuple[str, str]], list[str]]:
    """-> (jobs, ohne_motiv). jobs: [(jobname, prompt)], drei pro Zutat mit
    Motiv in subjects.mjs. ohne_motiv: Namen, fuer die subjects.mjs noch
    kein SUBJECTS/COLORS hat — die muessen zuerst ergaenzt werden."""
    palette = json.loads(PALETTE_FILE.read_text())
    resolved = load_subjects_and_categories(names)

    ohne_motiv = [n for n, v in resolved.items() if v is None]

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
    return jobs, ohne_motiv


def generate_missing_pngs(
    jobs: list[tuple[str, str]],
    out_dir: Path,
    on_done: Optional[Callable[[str, Path], None]] = None,
) -> list[str]:
    """mflux-generiert jeden Job aus `jobs`, dessen PNG in `out_dir` noch
    fehlt. Ueberspringt den Modell-Ladevorgang komplett, wenn nichts fehlt.
    Gibt die Namen der tatsaechlich erzeugten Jobs zurueck.

    `on_done`, falls gesetzt, wird direkt nach jedem einzelnen Bild
    aufgerufen (nicht erst am Ende des ganzen Laufs) — damit z. B.
    generate-marktregal.py es sofort als WebP veroeffentlichen und
    committen/pushen kann, statt auf den ganzen Batch zu warten."""
    out_dir.mkdir(parents=True, exist_ok=True)
    todo = [(n, p) for n, p in jobs if not (out_dir / f"{n}.png").exists()]
    if not todo:
        return []

    from mflux.models.common.resolution.config_resolution import ConfigResolution
    from mflux.models.z_image.variants.z_image import ZImage

    print(f"{len(todo)} Rohbild(er) zu erzeugen, lade Modell …", flush=True)
    t0 = time.time()
    model = ZImage(
        model_config=ConfigResolution.resolve_restricted(
            MODEL_REPO, "z-image-turbo", model_path=MODEL_REPO
        ),
        model_path=MODEL_REPO,
    )
    print(f"Modell geladen in {time.time() - t0:.0f}s\n", flush=True)

    done = []
    times: list[float] = []
    for i, (name, prompt) in enumerate(todo, 1):
        path = out_dir / f"{name}.png"
        t = time.time()
        try:
            image = model.generate_image(
                seed=SEED, prompt=prompt, num_inference_steps=STEPS,
                width=WIDTH, height=HEIGHT,
            )
            image.save(path=str(path))
        except KeyboardInterrupt:
            print("\nabgebrochen — bereits erzeugte Bilder bleiben erhalten")
            return done
        except Exception as exc:
            print(f"  [{i}/{len(todo)}] {name}: FEHLER {exc}", flush=True)
            continue

        done.append(name)
        if on_done is not None:
            on_done(name, path)
        times.append(time.time() - t)
        avg = sum(times) / len(times)
        eta = avg * (len(todo) - i)
        print(
            f"  [{i}/{len(todo)}] {name:<28} {times[-1]:5.1f}s   Rest ca. {eta/60:.0f} min",
            flush=True,
        )

    print(f"\nfertig: {len(done)} Bilder in {sum(times)/60:.0f} min -> {out_dir}")
    return done
