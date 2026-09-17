/**
 * Gepufferte Häkchen über den zuletzt bekannten Serverstand legen.
 *
 * Der Fall, für den es gebaut ist: zwei Handys im Supermarkt, eines ohne Netz.
 * Wer zuletzt getippt hat, gewinnt — und zwar nach derselben Regel wie
 * `set_entry_checked` in der Datenbank, damit Anzeige und gespeicherter Stand
 * nicht auseinanderlaufen.
 *
 * Pur gehalten (kein IndexedDB, kein Supabase): das hier ist die Regel, nicht
 * ihre Speicherung.
 */

export interface TogglableEntry {
  id: string;
  checked: boolean;
  /** Zeitpunkt der letzten Serveränderung, wie er mit der Zeile kam. */
  updatedAt: string;
}

export interface PendingToggle {
  entryId: string;
  checked: boolean;
  /** Zeitpunkt des Antippens auf diesem Gerät. */
  clientUpdatedAt: string;
}

/**
 * Zeitstempel vergleichen.
 *
 * Bewusst über `Date.parse` und nicht als Textvergleich: Postgres liefert
 * „2026-09-17T15:40:28.123456+00:00", der Browser erzeugt
 * „2026-09-17T15:40:28.123Z". Lexikografisch verglichen wäre das Ergebnis
 * schlicht falsch — gleiche Zeit, andere Schreibweise.
 */
function isAtLeastAsNew(candidate: string, reference: string): boolean {
  const a = Date.parse(candidate);
  const b = Date.parse(reference);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return a >= b;
}

/** Puffereinträge, die der Server inzwischen überholt hat. */
export function stalePendingToggles(
  entries: readonly TogglableEntry[],
  pending: readonly PendingToggle[],
): string[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return pending
    .filter((toggle) => {
      const entry = byId.get(toggle.entryId);
      if (!entry) return false; // Zeile unbekannt: hier nicht entscheidbar.
      return !isAtLeastAsNew(toggle.clientUpdatedAt, entry.updatedAt);
    })
    .map((toggle) => toggle.entryId);
}

/**
 * Serverstand plus eigene, noch nicht gesendete Häkchen.
 *
 * Ein Puffereintrag wird übergangen, sobald der Server für dieselbe Zeile
 * etwas Neueres kennt — dann hat das andere Handy später getippt.
 */
export function applyPendingToggles<T extends TogglableEntry>(
  entries: readonly T[],
  pending: readonly PendingToggle[],
): T[] {
  if (pending.length === 0) return [...entries];
  const byId = new Map(pending.map((toggle) => [toggle.entryId, toggle]));

  return entries.map((entry) => {
    const toggle = byId.get(entry.id);
    if (!toggle) return entry;
    if (!isAtLeastAsNew(toggle.clientUpdatedAt, entry.updatedAt)) return entry;
    if (toggle.checked === entry.checked) return entry;
    return { ...entry, checked: toggle.checked };
  });
}
