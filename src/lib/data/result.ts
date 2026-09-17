/**
 * Ergebnis einer Datenoperation — Erfolg mit Wert oder Fehler mit Text.
 *
 * Bewusst kein `throw`: jede dieser Operationen kann aus ganz normalen Gründen
 * scheitern (Code abgelaufen, Passwort falsch, offline), und das ist kein
 * Ausnahmefall, sondern ein Bildschirmzustand. Als Rückgabewert kann der
 * Aufrufer ihn nicht übersehen; eine Exception könnte er schlicht nicht fangen.
 *
 * Der Fehlertext ist immer schon fertig für die Anzeige — siehe errors.ts.
 */
export type Result<T = void> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (error: string): Result<never> => ({ ok: false, error });
