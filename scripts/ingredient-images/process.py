"""
Macht aus den Rohbildern (raw/*.png, je ~200 KB) Web-Assets:
Hintergrund auf reines Weiss ziehen, freistellen, gleich gross in den Kreis
setzen, auf 192 px, WebP.

Die Bilder liegen in der App in einem Kreis. Das Modell liefert sie aber als
Quadrat mit einem Hintergrund, der nur *fast* weiss ist (meist 244-254) und
oft noch einen leichten Verlauf hat. Frueher wurde nur auf das Motiv
zugeschnitten und der Rest mit reinem Weiss aufgefuellt — dabei blieb die
Naht zwischen dem grauen Modellhintergrund und dem weissen Rand als heller
Rahmen im Kreis stehen. Deshalb hier drei Schritte:

1. Flat-Field: der Hintergrund wird als glatte Flaeche (Quadrik) geschaetzt
   und herausgerechnet. Danach ist er ueberall exakt 255 — der ganze Kreis
   ist eine Flaeche, egal wo zugeschnitten wird.
2. Freistellen: was sich kaum vom Hintergrund abhebt, wird vollends weiss.
   Der weiche Schlagschatten bleibt gedaempft stehen, er setzt das Motiv auf.
3. Zentrieren auf den *Umkreis* des Motivs, nicht auf sein Rechteck: nur so
   sitzt jede Zutat mittig im Kreis und keine Kante wird angeschnitten. Die
   Ausdehnung kommt aus den Kanten im Bild, nicht aus der Helligkeit — sonst
   zieht der Schatten die Mitte nach unten rechts, und weisse Motive
   (Knoblauch, Mozzarella, Quark) verlieren ihre halbe Silhouette.

    ~/.mflux/venv/bin/python scripts/ingredient-images/process.py
"""

import json
import math
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "scripts" / "ingredient-images" / "raw"
OUT = ROOT / "public" / "zutaten"
MAP_FILE = ROOT / "src" / "lib" / "core" / "ingredientImages.ts"

SIZE = 192       # Chip ist ~64 px, 3x fuer Retina
QUALITY = 82

# Abstand vom Weiss (0-255), ab dem ein Pixel zum Motiv zaehlt.
FADE_LO = 5.0    # darunter: Hintergrundrauschen, wird weiss
FADE_HI = 20.0   # darueber: Motiv, bleibt wie es ist
EDGE = 10.0      # Kontrastsprung, der eine Motivkante ausmacht
GROW = 14.0      # bis hierhin waechst die Silhouette in weiche Raender hinein
COVER = 0.94     # Anteil des Kreisdurchmessers, den das Motiv einnimmt

UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}


def slugify(name: str) -> str:
    out = name.lower()
    for k, v in UMLAUTS.items():
        out = out.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", out).strip("-")


def flatten_background(a: np.ndarray) -> np.ndarray:
    """Den Hintergrund als Quadrik schaetzen und auf reines Weiss ziehen."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x = (xx / w - 0.5).astype(np.float32)
    y = (yy / h - 0.5).astype(np.float32)
    basis = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)

    lum = a.min(axis=2)
    # Startannahme: die helle Mehrheit des Bildes ist Hintergrund. Danach
    # zweimal nachziehen — jetzt zaehlt nur noch, was am Modell klebt.
    fit = lum > np.percentile(lum, 60)
    model = None
    for _ in range(3):
        sample = fit[::2, ::2]
        if sample.sum() < 500:
            break
        coefficients = np.linalg.lstsq(
            basis[::2, ::2][sample], a[::2, ::2][sample], rcond=None
        )[0]
        model = basis @ coefficients
        fit = (model.min(axis=2) - lum) < 5.0
    if model is None:  # Motiv fuellt das Bild — dann eben eine flache Schaetzung
        model = np.full_like(a, float(np.percentile(lum, 90)))
    return np.clip(a * (255.0 / np.maximum(model, 1.0)), 0.0, 255.0)


def local_share(mask: np.ndarray, radius: int) -> np.ndarray:
    """Anteil gesetzter Pixel im Quadrat um jeden Punkt (Summentabelle)."""
    padded = np.pad(mask.astype(np.float32), radius + 1)
    total = padded.cumsum(0).cumsum(1)
    h, w = mask.shape
    k = 2 * radius + 1
    window = (
        total[k:k + h, k:k + w] - total[:h, k:k + w]
        - total[k:k + h, :w] + total[:h, :w]
    )
    return window / (k * k)


def silhouette(a: np.ndarray, distance: np.ndarray) -> np.ndarray:
    """Wo das Motiv liegt — ueber Kanten, damit der Schatten aussen vor bleibt."""
    h, w, _ = a.shape
    lum = a.min(axis=2)
    gradient = np.zeros_like(lum)
    gradient[:, 1:-1] = np.abs(lum[:, 2:] - lum[:, :-2])
    gradient[1:-1, :] = np.maximum(gradient[1:-1, :], np.abs(lum[2:, :] - lum[:-2, :]))

    radius = max(1, round(min(h, w) * 0.004))
    mask = local_share(gradient > EDGE, radius) > 0.15

    # Kanten allein enden bei Weiss auf Weiss zu frueh (Mozzarella, Quark).
    # Deshalb von der Kante aus so weit wachsen, wie es noch Motiv gibt.
    near = distance > GROW
    for _ in range(6):
        wider = (local_share(mask, radius + 1) > 0.0) & near
        if wider.sum() == mask.sum():
            break
        mask = wider | mask

    if not mask.any():
        mask = distance > FADE_HI
    if not mask.any():
        mask = distance > FADE_LO
    return mask


def to_chip(im: Image.Image) -> Image.Image:
    """Ein Rohbild zum fertigen Chip: weisser Grund, Motiv mittig im Kreis."""
    a = flatten_background(np.asarray(im.convert("RGB"), np.float32))
    h, w, _ = a.shape

    distance = 255.0 - a.min(axis=2)
    alpha = np.clip((distance - FADE_LO) / (FADE_HI - FADE_LO), 0.0, 1.0)
    freed = 255.0 - (255.0 - a) * alpha[..., None]

    ys, xs = np.nonzero(silhouette(a, distance))
    cx = (float(xs.min()) + float(xs.max())) / 2.0
    cy = (float(ys.min()) + float(ys.max())) / 2.0
    radius = math.sqrt(float(((xs - cx) ** 2 + (ys - cy) ** 2).max()))
    side = max(8, int(round(2 * radius / COVER)))

    canvas = np.full((side, side, 3), 255.0, np.float32)
    x0, y0 = int(round(cx - side / 2)), int(round(cy - side / 2))
    sx0, sy0 = max(0, x0), max(0, y0)
    sx1, sy1 = min(w, x0 + side), min(h, y0 + side)
    canvas[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = freed[sy0:sy1, sx0:sx1]

    chip = Image.fromarray(canvas.round().astype(np.uint8))
    return chip.resize((SIZE, SIZE), Image.LANCZOS)


def ingredient_names() -> list[str]:
    script = (
        "import('%s/scripts/ingredient-seed-data.mjs').then(m => "
        "console.log(JSON.stringify(Object.values(m.INGREDIENTS).flat())))" % ROOT
    )
    res = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def main() -> int:
    if not RAW.exists():
        print(f"keine Rohbilder unter {RAW} — erst generate.py laufen lassen")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    names = ingredient_names()
    written, missing, total_bytes = [], [], 0

    for name in names:
        slug = slugify(name)
        src = RAW / f"{slug}.png"
        if not src.exists():
            missing.append(name)
            continue
        dst = OUT / f"{slug}.webp"
        to_chip(Image.open(src)).save(dst, "WEBP", quality=QUALITY, method=6)
        total_bytes += dst.stat().st_size
        written.append((name, slug))

    # Nachschlagetabelle fuer die App. Generiert, damit Seed und Bilder nicht
    # auseinanderlaufen — von Hand gepflegt waere sie nach dem ersten neuen
    # Rezept falsch.
    entries = "\n".join(f'  {json.dumps(n, ensure_ascii=False)}: "{s}",' for n, s in written)
    MAP_FILE.write_text(
        "// Erzeugt von scripts/ingredient-images/process.py — nicht von Hand aendern.\n"
        "// Zutatenname -> Dateiname unter /zutaten/<slug>.webp\n\n"
        "export const INGREDIENT_IMAGES: Record<string, string> = {\n"
        f"{entries}\n"
        "};\n\n"
        "export function ingredientImage(name: string): string | null {\n"
        "  const slug = INGREDIENT_IMAGES[name];\n"
        "  return slug ? `/zutaten/${slug}.webp` : null;\n"
        "}\n",
        encoding="utf-8",
    )

    avg = total_bytes / len(written) / 1024 if written else 0
    print(f"{len(written)} Bilder -> {OUT}")
    print(f"gesamt {total_bytes/1024/1024:.1f} MB, im Schnitt {avg:.1f} KB")
    print(f"Tabelle -> {MAP_FILE.relative_to(ROOT)}")
    if missing:
        print(f"\nohne Rohbild ({len(missing)}): {', '.join(missing[:12])}"
              f"{' …' if len(missing) > 12 else ''}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
