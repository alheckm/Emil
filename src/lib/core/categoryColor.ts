/**
 * Kreisfarbe je Abteilung — Hintergrund der Foto-Kreise auf der Einkaufsliste
 * (DESIGN.md, Signature-Element), sichtbar hinter transparenten Bildkanten
 * und als Grund für den Buchstaben-Avatar ohne Foto. Der Design-Canvas hat
 * nur drei Abteilungen
 * exakt durchgefärbt (Obst & Gemüse, Milchprodukte, Trockenwaren); die echten
 * Abteilungen (`listCategories`) sind Stammdaten und können mehr oder andere
 * sein. Statt eine Zuordnung an konkrete Datenbank-IDs zu hängen, die beim
 * nächsten Seed-Update bricht, verteilt eine stabile Streuung dieselbe kleine
 * Palette gedeckter, an Lebensmittelfotografie erinnernder Töne über beliebig
 * viele Abteilungen — dieselbe Kategorie bekommt bei jedem Aufruf dieselbe
 * Farbe.
 */
export const PALETTE = [
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

/**
 * Hellt `hex` Richtung Weiß auf, bis die Helligkeit (HSL-`L`) `targetL`
 * erreicht (0–1). Dunklere Ausgangsfarben bekommen dadurch automatisch einen
 * größeren Weißanteil als hellere — alle Ergebnisse landen auf derselben
 * Ziel-Helligkeit, egal wie dunkel die Quelle war.
 */
export function lightenTo(hex: string, targetL: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const l = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  const t = Math.max(0, Math.min(1, (targetL - l) / (1 - l)));
  const mix = (channel: number) => Math.round(channel + t * (255 - channel));
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`.toUpperCase();
}
