// Das Bild hängt an der Zutat (`ingredients.image_slug`), nicht am Namen —
// eine Umbenennung oder ein Plural verliert es nicht. Gepflegt wird die Spalte
// von scripts/ingredient-images/publish-map.mjs.

/** Kreis-Foto in der Einkaufsliste: `/zutaten-marktregal/<slug>-bold.webp`. */
export function ingredientImageUrl(slug: string | null | undefined): string | null {
  return slug ? `/zutaten-marktregal/${slug}-bold.webp` : null;
}
