"""
Einmaliger Stil-Test: Erdbeere, Banane, Brot in 5 Referenzstilen
(public/references/*.jpg) generieren, um die Prompts pro Stil zu finden,
bevor irgendetwas an der echten Zutatenbilder-Pipeline geaendert wird.

Kein Teil von find-missing.mjs / subjects.mjs — reines Explorations-Skript.
Ergebnis liegt unter scripts/ingredient-images/style-tests/out/ (gitignored).

    ~/.mflux/venv/bin/python scripts/ingredient-images/style-tests/generate.py
"""

import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = Path(__file__).resolve().parent / "out"
MODEL_REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"
SEED = 42
STEPS = 4
SIZE = 768

SUBJECTS = {
    "erdbeere": "a single ripe red strawberry with its green leafy calyx, stem pointing up",
    "banane": "a single ripe yellow banana, slightly curved, with a short stem visible at one end",
    "brot": "a rustic round loaf of crusty bread with a floured, cracked crust",
}

# style 1 — "moebeer" Pantry-Index: watercolor botanical illustration on cream card
STYLE_1 = (
    "Hand-painted watercolor botanical illustration of {subject}, centered in "
    "frame, viewed from a gentle three-quarter front angle at eye level (not "
    "from above), painted on a flat matte warm ivory-cream paper background "
    "(uniform pale beige, no gradient, no visible objects besides faint paper "
    "grain). Soft muted painterly shadow directly beneath the subject. Visible "
    "watercolor brush texture with a thin fine ink outline, slightly desaturated "
    "realistic colours, botanical field-guide illustration style, no text, no "
    "labels, no props, no other objects."
)

# style 2 — Pantone-circle photograph on light grey
STYLE_2 = (
    "Photorealistic studio product photograph of {subject}, standing upright "
    "and positioned centered-low in frame as if resting on a surface, "
    "photographed from the front at a slight eye-level angle (not from above). "
    "Isolated on a flat, uniform light warm grey background (no gradient). A "
    "soft-edged flat pastel {circle_color} circle sits directly behind the "
    "subject like a colour swatch, partially visible around its edges. Soft "
    "realistic shadow directly beneath the subject on the grey background. "
    "Natural studio lighting, sharp focus, high detail, no text, no labels, no "
    "hands, no other objects."
)

# style 3 — pastel colour-block flat lay
STYLE_3 = (
    "Photorealistic overhead flat-lay product photograph of {subject}, shot "
    "directly from above at a 90-degree top-down angle, centered in frame, "
    "isolated on a completely flat, uniform pastel {panel_color} background "
    "with absolutely no gradient — one single flat pastel colour fills the "
    "entire background edge to edge. Soft minimal realistic shadow directly "
    "beneath the subject. Clean minimalist studio lighting, sharp focus, high "
    "detail, natural colours, no text, no labels, no hands, no props, no other "
    "objects."
)

# style 4 — pale app-style flat lay with faint gradient tint
STYLE_4 = (
    "Photorealistic overhead flat-lay product photograph of {subject}, shot "
    "directly from above at a 90-degree top-down angle, positioned in the "
    "upper-center of the frame with empty space below it. Isolated on an "
    "almost-white background with a very faint, subtle soft gradient tint of "
    "pale {tint_color} fading into white, barely visible, no hard edges, no "
    "visible objects. Soft directional realistic shadow beneath the subject, "
    "extending slightly downward. Clean bright minimalist studio lighting, "
    "sharp focus, high detail, natural colours, no text, no labels, no hands, "
    "no props, no other objects, no phone frame, no screen, no user interface."
)

# style 5 — moody editorial still life with long hard-edged coloured shadow
STYLE_5 = (
    "Editorial still-life photorealistic product photograph of {subject}, "
    "positioned off-center in the frame toward the {side} third, photographed "
    "from a slightly elevated angle. Isolated on a completely flat, uniform "
    "warm cream eggshell background (no gradient, no visible objects). A "
    "single hard directional studio light from one side casts a long, "
    "hard-edged, high-contrast shadow in a dark teal-blue tint, stretching "
    "diagonally across the background behind the subject. Dramatic minimal "
    "editorial food photography, sharp focus, high detail, rich natural "
    "colours, no text, no labels, no hands, no props, no other objects."
)

ITEMS: list[tuple[str, str]] = []
for name, subject in SUBJECTS.items():
    ITEMS.append((f"{name}-1-moebeer", STYLE_1.format(subject=subject)))

circle_color = {"erdbeere": "coral-red", "banane": "soft yellow", "brot": "warm wheat-amber"}
for name, subject in SUBJECTS.items():
    ITEMS.append(
        (f"{name}-2-pantone-circle", STYLE_2.format(subject=subject, circle_color=circle_color[name]))
    )

panel_color = {"erdbeere": "dusty rose pink", "banane": "warm cream beige", "brot": "light stone oat"}
for name, subject in SUBJECTS.items():
    ITEMS.append(
        (f"{name}-3-colorblock-flatlay", STYLE_3.format(subject=subject, panel_color=panel_color[name]))
    )

tint_color = {"erdbeere": "blush pink", "banane": "warm cream yellow", "brot": "warm beige"}
for name, subject in SUBJECTS.items():
    ITEMS.append(
        (f"{name}-4-app-flatlay", STYLE_4.format(subject=subject, tint_color=tint_color[name]))
    )

side = {"erdbeere": "left", "banane": "right", "brot": "left"}
for name, subject in SUBJECTS.items():
    ITEMS.append(
        (f"{name}-5-editorial-shadow", STYLE_5.format(subject=subject, side=side[name]))
    )


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
                width=SIZE, height=SIZE,
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
            f"  [{i}/{len(todo)}] {name:<28} {times[-1]:5.1f}s   Rest ca. {eta/60:.1f} min",
            flush=True,
        )

    print(f"\nfertig: {len(times)} Bilder in {sum(times)/60:.1f} min -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
