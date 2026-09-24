/**
 * Ring-/Kachelfarbe je Abteilung — Story-Ring-Mechanik der Einkaufsliste
 * (DESIGN.md, Signature-Element). Der Design-Canvas hat nur drei Abteilungen
 * exakt durchgefärbt (Obst & Gemüse, Milchprodukte, Trockenwaren); die echten
 * Abteilungen (`listCategories`) sind Stammdaten und können mehr oder andere
 * sein. Statt eine Zuordnung an konkrete Datenbank-IDs zu hängen, die beim
 * nächsten Seed-Update bricht, verteilt eine stabile Streuung dieselbe kleine
 * Palette gedeckter, an Lebensmittelfotografie erinnernder Töne über beliebig
 * viele Abteilungen — dieselbe Kategorie bekommt bei jedem Aufruf dieselbe
 * Farbe.
 */
const PALETTE = [
  "#8C9A7B", // Salbeigrün — Obst & Gemüse
  "#C9BBA0", // Sandbeige — Milchprodukte
  "#B3927A", // Terrakotta — Trockenwaren
  "#A8998C", // Warmgrau
  "#9C8CA0", // Gedecktes Violett
  "#B79A6B", // Ocker
  "#8FA3A8", // Salbeiblau
  "#AD8A87", // Altrosa
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function categoryRingColor(categoryId: string | null): string {
  if (!categoryId) return PALETTE[0];
  return PALETTE[hash(categoryId) % PALETTE.length];
}
