"""
Produktions-Lauf der "Marktregal"-Bildpipeline (siehe DESIGN.md, noch nicht
im echten App-Code, aber die Assets sollen schon bereitstehen, wenn die
Oberflaeche kommt): erzeugt vollbild/grau/bold fuer die uebergebenen Zutaten
und veroeffentlicht sie als WebP unter public/zutaten-marktregal/.

Nimmt an, dass subjects.mjs fuer jede Zutat schon ein Bildmotiv (SUBJECTS)
und eine Farbkategorie (COLORS) hat — das zu pruefen/ergaenzen ist Aufgabe
des Skills (Modus 3), nicht dieses Skripts. Bricht ab, wenn das fehlt.

Rohbild-Wiederverwendung, damit nichts doppelt durch mflux muss:
  1. schon als WebP unter public/zutaten-marktregal/ -> ueberspringen.
  2. sonst: Rohbild schon in design/ingredients_directions/ vorhanden
     (Design-Exploration, ggf. bereits vom Menschen geprueft) -> uebernehmen.
  3. sonst: Rohbild schon in raw-marktregal/ (Rest eines frueheren,
     unterbrochenen Laufs) -> uebernehmen.
  4. sonst: frisch per mflux generieren, landet in raw-marktregal/ (wie
     scripts/ingredient-images/raw/ bei der Pastell-Pipeline: gitignored,
     nur die kleinen WebPs unter public/ gehoeren ins Repo).

Keine Groessenanpassung, kein Zuschnitt — die Oberflaeche, die diese Bilder
konsumiert, gibt es noch nicht. Reine Formatkonvertierung (WebP statt PNG),
das ist der einzige verlustarme, reversible Schritt, der jetzt schon Sinn
ergibt. Zuschnitt/Groesse kommt, wenn die Kachel-UI gebaut wird.

Veroeffentlichen heisst hier: sobald ein einzelnes Bild fertig ist (egal ob
wiederverwendet oder frisch generiert), wird es direkt als WebP geschrieben,
committed und gepusht (`publish_and_push`) — nicht erst am Ende des ganzen
Laufs gesammelt. So landet jedes Bild binnen Sekunden im Repo/Deploy, auch
wenn der Lauf mittendrin abbricht. Ein Push pro Bild bedeutet entsprechend
viele Vercel-Deploys bei einem groesseren Batch — das ist der bewusste
Kompromiss fuer "sofort da", nicht ein Bug.

    ~/.mflux/venv/bin/python scripts/ingredient-images/generate-marktregal.py --names Erdbeeren,Brot
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

from marktregal_prompts import ROOT, build_jobs, generate_missing_pngs

DESIGN_DIR = ROOT / "design" / "ingredients_directions"
RAW_DIR = Path(__file__).resolve().parent / "raw-marktregal"
PUBLIC_DIR = ROOT / "public" / "zutaten-marktregal"
ALIASES_FILE = Path(__file__).resolve().parent / "aliases.json"

QUALITY = 88


def resolve_aliases(names: list[str]) -> list[str]:
    """Alias-Quellnamen (z. B. 'Gemüsebrühepulver') haben keinen eigenen
    SUBJECTS-Eintrag — sie teilen sich die Bilder des Ziels aus aliases.json.
    Loest sie hier auf und dedupliziert, damit das Ziel nicht doppelt
    generiert wird, egal ob Quell- oder Zielname uebergeben wurde."""
    aliases = json.loads(ALIASES_FILE.read_text()).get("aliases", {})
    resolved = [aliases.get(n, n) for n in names]
    return sorted(set(resolved), key=resolved.index)


def find_raw(name: str) -> Path | None:
    for d in (DESIGN_DIR, RAW_DIR):
        p = d / f"{name}.png"
        if p.exists():
            return p
    return None


def to_webp(src: Path, dst: Path) -> None:
    from PIL import Image

    dst.parent.mkdir(parents=True, exist_ok=True)
    Image.open(src).convert("RGB").save(dst, "WEBP", quality=QUALITY, method=6)


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


def publish_and_push(name: str, src: Path) -> bool:
    """Ein einzelnes Rohbild als WebP veroeffentlichen und sofort committen
    + pushen — nicht erst am Ende des ganzen Laufs sammeln. Damit landet ein
    fertiges Bild binnen Sekunden im deployten Stand, nicht erst Stunden
    spaeter, wenn irgendwer an den Push vom ganzen Batch denkt."""
    dst = PUBLIC_DIR / f"{name}.webp"
    to_webp(src, dst)
    rel = str(dst.relative_to(ROOT))

    add = git("add", "--", rel)
    if add.returncode != 0:
        print(f"  git add fehlgeschlagen fuer {rel}: {add.stderr.strip()}", flush=True)
        return False

    staged = git("diff", "--cached", "--name-only", "--", rel)
    if not staged.stdout.strip():
        print(f"  {rel} unveraendert, nichts zu committen", flush=True)
        return True

    commit = git("commit", "-m", f"Marktregal-Bild: {name}", "--", rel)
    if commit.returncode != 0:
        print(f"  git commit fehlgeschlagen fuer {rel}: {commit.stderr.strip()}", flush=True)
        return False

    push = git("push")
    if push.returncode != 0:
        print(
            f"  git push fehlgeschlagen (Bild bleibt lokal committed, "
            f"naechster Push nimmt es mit): {push.stderr.strip()}",
            flush=True,
        )
        return True  # committet ist es, nur der Push haengt — kein Bild verloren

    print(f"  -> {rel} committed + gepusht", flush=True)
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--names", required=True, help="Zutaten aus subjects.mjs, mit Komma getrennt")
    args = ap.parse_args()

    names = resolve_aliases([n.strip() for n in args.names.split(",")])
    jobs, ohne_motiv = build_jobs(names)
    if ohne_motiv:
        print(
            f"Abbruch — kein Bildmotiv in subjects.mjs fuer: {ohne_motiv}\n"
            "Erst SUBJECTS + COLORS dort ergaenzen (siehe zutatenbilder-Skill, Modus 3)."
        )
        return 1

    to_publish = [(n, p) for n, p in jobs if not (PUBLIC_DIR / f"{n}.webp").exists()]
    already_published = len(jobs) - len(to_publish)
    print(f"{len(jobs)} Bilder, {already_published} schon veroeffentlicht, {len(to_publish)} offen\n", flush=True)
    if not to_publish:
        return 0

    published, still_missing = 0, []

    to_generate = []
    for name, prompt in to_publish:
        src = find_raw(name)
        if src is None:
            to_generate.append((name, prompt))
            continue
        if publish_and_push(name, src):
            published += 1
        else:
            still_missing.append(name)

    reused = len(to_publish) - len(to_generate)
    if reused:
        print(f"{reused} Rohbild(er) schon vorhanden (design/ oder raw-marktregal/) — sofort veroeffentlicht", flush=True)

    def on_done(name: str, path: Path) -> None:
        nonlocal published
        if publish_and_push(name, path):
            published += 1
        else:
            still_missing.append(name)

    generate_missing_pngs(to_generate, RAW_DIR, on_done=on_done)

    print(f"\n{published} WebP(s) veroeffentlicht -> {PUBLIC_DIR}")
    if still_missing:
        print(f"fehlgeschlagen ({len(still_missing)}): {still_missing}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
