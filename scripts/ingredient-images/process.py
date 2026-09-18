"""
Macht aus den Rohbildern (raw/*.png, je ~200 KB) Web-Assets:
freistellen, gleich gross zentrieren, auf 192 px, WebP.

Warum zuschneiden: das Modell setzt die Motive in leicht unterschiedlicher
Groesse ins Bild. Nebeneinander in einer Reihe Kreise faellt das sofort auf.
Zuschneiden auf das Motiv und mit gleichem Rand neu zentrieren macht die Reihe
ruhig — das ist der Unterschied zwischen „Bilder" und „Icons".

    ~/.mflux/venv/bin/python scripts/ingredient-images/process.py
"""

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "scripts" / "ingredient-images" / "raw"
OUT = ROOT / "public" / "zutaten"
MAP_FILE = ROOT / "src" / "lib" / "core" / "ingredientImages.ts"

SIZE = 192       # Chip ist ~64 px, 3x fuer Retina
PAD = 0.08       # Rand um das Motiv, als Anteil der laengeren Kante
QUALITY = 82
UMLAUTS = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "é": "e", "è": "e", "ê": "e"}


def slugify(name: str) -> str:
    out = name.lower()
    for k, v in UMLAUTS.items():
        out = out.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "-", out).strip("-")


def trim_and_center(im: Image.Image) -> Image.Image:
    """Auf das Motiv zuschneiden, quadratisch mit gleichem Rand zentrieren."""
    grey = im.convert("L")
    white = Image.new("L", im.size, 255)
    # Schwelle 12: der weiche Schlagschatten soll mit ins Bild, das Rauschen nicht.
    diff = ImageChops.difference(grey, white).point(lambda p: 255 if p > 12 else 0)
    box = diff.getbbox()
    if box:
        im = im.crop(box)
    side = int(max(im.size) * (1 + 2 * PAD))
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return canvas


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
        img = trim_and_center(Image.open(src)).resize((SIZE, SIZE), Image.LANCZOS)
        dst = OUT / f"{slug}.webp"
        img.save(dst, "WEBP", quality=QUALITY, method=6)
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
