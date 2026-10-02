"""Erzeugt ein Rezeptfoto lokal mit mflux (4-Bit-Modell wie bei den Zutatenbildern).

Der CLI-Aufruf `mflux-generate --model z-image-turbo` findet im Standardmodell
`text_encoder_2` nicht und bricht ab; dieses Skript lädt dasselbe Modell wie
scripts/ingredient-images/marktregal_prompts.py.

    ~/.mflux/venv/bin/python scripts/rezept-pflege/rezeptbild.py \
        --prompt "<Gericht von oben, natürliches Licht, ruhiger Hintergrund>" \
        --output scripts/rezept-pflege/tmp/<slug>.jpg
"""

import argparse

from mflux.models.common.resolution.config_resolution import ConfigResolution
from mflux.models.z_image.variants.z_image import ZImage

REPO = "filipstrand/Z-Image-Turbo-mflux-4bit"

parser = argparse.ArgumentParser()
parser.add_argument("--prompt", required=True)
parser.add_argument("--output", required=True)
parser.add_argument("--seed", type=int, default=7)
args = parser.parse_args()

model = ZImage(
    model_config=ConfigResolution.resolve_restricted(
        REPO, "z-image-turbo", model_path=REPO
    ),
    model_path=REPO,
)
image = model.generate_image(
    seed=args.seed,
    prompt=args.prompt,
    num_inference_steps=4,
    width=1024,
    height=1024,
)
image.save(path=args.output)
print(f"gespeichert: {args.output}")
