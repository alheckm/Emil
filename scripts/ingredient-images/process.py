"""
Macht aus den Rohbildern (raw/*.png, je ~200 KB) Web-Assets:
Hintergrund auf die feste Pastellfarbe der Zutat ziehen, freistellen, gleich
gross in den Kreis setzen, auf 192 px, WebP.

Die Bilder liegen in der App in einem Kreis. Das Modell liefert sie aber als
Quadrat mit einem Hintergrund, der nur *fast* die Zielfarbe trifft und oft
noch ein leichtes Rauschen oder einen Verlauf hat. Deshalb hier drei Schritte:

1. Hintergrund schaetzen: eine glatte Flaeche (Quadrik), angesetzt am
   Bildrand — dort steht laut Prompt garantiert nur Hintergrund, gleich
   welche Farbe er hat. Das ersetzt die frühere Annahme "Hintergrund ist
   hell", die nur fuer Weiss galt.
2. Freistellen: nur was nah an dieser geschaetzten Flaeche liegt, wird auf
   die Zielfarbe gezogen. Das Motiv selbst wird NICHT umgerechnet, nur der
   Hintergrund ersetzt — sonst faerbt jeder Wechsel der Zielfarbe (z. B. von
   Weiss frueher auf Pastellrot heute) das ganze Bild mit ein, statt nur den
   Grund zu tauschen. Der weiche Schlagschatten bleibt gedaempft stehen und
   blendet dabei sanft in die neue Grundfarbe.
3. Zentrieren auf den *Umkreis* des Motivs, nicht auf sein Rechteck: nur so
   sitzt jede Zutat mittig im Kreis und keine Kante wird angeschnitten. Die
   Ausdehnung kommt aus den Kanten im Bild, nicht aus der Helligkeit — sonst
   zieht der Schatten die Mitte nach unten rechts, und helle Motive
   (Knoblauch, Mozzarella, Quark) verlieren ihre halbe Silhouette.

Funktioniert unabhaengig davon, ob ein Rohbild schon mit Pastellgrund erzeugt
wurde oder noch aus der alten reinweissen Generation stammt — beide Faelle
laufen durch dieselbe Schaetzung und landen auf derselben Zielfarbe.

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

# Abstand von der geschaetzten Hintergrundflaeche (0-255), ab dem ein Pixel
# zum Motiv zaehlt statt zum Grund.
FADE_LO = 5.0    # darunter: Hintergrundrauschen, wird zur Zielfarbe
FADE_HI = 20.0   # darueber: Motiv, bleibt Original-Pixel
EDGE = 10.0      # Kontrastsprung, der eine Motivkante ausmacht
GROW = 14.0      # bis hierhin waechst die Silhouette in weiche Raender hinein
COVER = 0.94     # Anteil des Kreisdurchmessers, den das Motiv einnimmt

UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}


def slugify(name: str) -> str:
    out = name.lower()
    for k, v in UMLAUTS.items():
        out = out.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", out).strip("-")


def fit_background(a: np.ndarray) -> np.ndarray:
    """Den Hintergrund als glatte Flaeche (Quadrik) schaetzen — unabhaengig
    von seiner Farbe. Start ist der Bildrand: jedes Motiv steht laut Prompt
    zentriert mit Rand, dort ist garantiert nur Hintergrund. Frueher war die
    Startannahme "hell = Hintergrund", das setzte Weiss voraus."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    x = (xx / w - 0.5).astype(np.float32)
    y = (yy / h - 0.5).astype(np.float32)
    basis = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)

    border = max(1, round(min(h, w) * 0.06))
    fit = np.zeros((h, w), bool)
    fit[:border, :] = fit[-border:, :] = fit[:, :border] = fit[:, -border:] = True

    model = None
    for _ in range(4):
        sample = fit[::2, ::2]
        if sample.sum() < 500:
            break
        coefficients = np.linalg.lstsq(
            basis[::2, ::2][sample], a[::2, ::2][sample], rcond=None
        )[0]
        model = basis @ coefficients
        fit = np.abs(a - model).max(axis=2) < 6.0
    if model is None:  # Motiv fuellt das Bild — dann eben eine flache Schaetzung
        model = np.full_like(a, np.median(a.reshape(-1, 3), axis=0))
    return model


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


def silhouette(a: np.ndarray, dist: np.ndarray) -> np.ndarray:
    """Wo das Motiv liegt — ueber Kanten, damit der Schatten aussen vor bleibt.

    Die Kante wird auf allen drei Kanaelen gesucht, nicht nur auf der
    Helligkeit: eine rote Erdbeere vor pastellrotem Grund unterscheidet sich
    kaum in der Helligkeit, aber deutlich im Farbton."""
    h, w, _ = a.shape
    gradient = np.zeros((h, w), np.float32)
    gradient[:, 1:-1] = np.abs(a[:, 2:] - a[:, :-2]).max(axis=2)
    gradient[1:-1, :] = np.maximum(
        gradient[1:-1, :], np.abs(a[2:, :] - a[:-2, :]).max(axis=2)
    )

    radius = max(1, round(min(h, w) * 0.004))
    mask = local_share(gradient > EDGE, radius) > 0.15

    # Kanten allein enden bei aehnlichen Farben (Mozzarella auf Beige,
    # Knoblauch auf Weiss) zu frueh. Deshalb von der Kante aus so weit
    # wachsen, wie es noch Motiv gibt.
    near = dist > GROW
    for _ in range(6):
        wider = (local_share(mask, radius + 1) > 0.0) & near
        if wider.sum() == mask.sum():
            break
        mask = wider | mask

    if not mask.any():
        mask = dist > FADE_HI
    if not mask.any():
        mask = dist > FADE_LO
    return mask


def to_chip(im: Image.Image, target: np.ndarray) -> Image.Image:
    """Ein Rohbild zum fertigen Chip: Motiv mittig im Kreis.

    Erste Version hat hier den Hintergrund aktiv auf `target` umgerechnet
    (und den Schlagschatten dabei weggebuegelt — er ist ja per Definition
    dunkler als der Hintergrund, also verschwand er beim Glattziehen in der
    hellen Pastellfarbe). Der Prompt in subjects.mjs verlangt die Zielfarbe
    aber schon vom Modell selbst, mit neun Schritten liefert es sie zuverlaessig
    flach UND mit einem sauberen dunklen Schatten mit — also wird hier nur
    noch zugeschnitten, nicht mehr umgefaerbt. `target` bleibt nur als
    Fuellfarbe fuer den (seltenen) Rand ausserhalb des Rohbilds stehen."""
    a = np.asarray(im.convert("RGB"), np.float32)
    h, w, _ = a.shape

    model = fit_background(a)
    dist = np.abs(a - model).max(axis=2)

    ys, xs = np.nonzero(silhouette(a, dist))
    cx = (float(xs.min()) + float(xs.max())) / 2.0
    cy = (float(ys.min()) + float(ys.max())) / 2.0
    radius = math.sqrt(float(((xs - cx) ** 2 + (ys - cy) ** 2).max()))
    side = max(8, int(round(2 * radius / COVER)))

    canvas = np.tile(target, (side, side, 1)).astype(np.float32)
    x0, y0 = int(round(cx - side / 2)), int(round(cy - side / 2))
    sx0, sy0 = max(0, x0), max(0, y0)
    sx1, sy1 = min(w, x0 + side), min(h, y0 + side)
    canvas[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = a[sy0:sy1, sx0:sx1]

    chip = Image.fromarray(canvas.round().astype(np.uint8))
    return chip.resize((SIZE, SIZE), Image.LANCZOS)


def ingredient_colors() -> dict[str, str]:
    """Jede Zutat mit definiertem Bildmotiv -> Ziel-Hex ihrer Pastellkategorie
    (siehe subjects.mjs: COLORS/PALETTE/hexFor)."""
    script = (
        "import('%s/scripts/ingredient-images/subjects.mjs').then(m => "
        "console.log(JSON.stringify(Object.fromEntries("
        "Object.keys(m.SUBJECTS).map(n => [n, m.hexFor(n)])))))" % ROOT
    )
    res = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def hex_to_rgb(hex_code: str) -> np.ndarray:
    hex_code = hex_code.lstrip("#")
    return np.array([int(hex_code[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def main() -> int:
    if not RAW.exists():
        print(f"keine Rohbilder unter {RAW} — erst generate.py laufen lassen")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    colors = ingredient_colors()
    written, missing, total_bytes = [], [], 0

    for name, hex_code in colors.items():
        slug = slugify(name)
        src = RAW / f"{slug}.png"
        if not src.exists():
            missing.append(name)
            continue
        dst = OUT / f"{slug}.webp"
        target = hex_to_rgb(hex_code)
        to_chip(Image.open(src), target).save(dst, "WEBP", quality=QUALITY, method=6)
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
