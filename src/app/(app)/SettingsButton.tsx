import Link from "next/link";

/**
 * Der Weg in die Einstellungen: ein runder Knopf oben rechts.
 *
 * Warum dort und nicht als dritter Tab: Tabs sind für Orte, an denen
 * gearbeitet wird. Konto und Haushalt fasst man dreimal im Jahr an — ein
 * Viertel der wertvollsten Fläche der App dafür zu reservieren, wäre
 * verschwendet. Der heutige Standard für genau diesen Fall ist der runde Knopf
 * in der Kopfzeile; Gmail, YouTube und Spotify machen es alle so.
 *
 * Eine Person und kein Zahnrad, weil dahinter Konto **und** Haushalt liegen:
 * beides ist „wer bin ich, mit wem teile ich". Ein Zahnrad verspricht
 * Schalter und versteckt die Haushalts-Idee.
 *
 * Bewusst ohne Initialen: dafür müsste die Sitzung abgewartet werden, und
 * damit hinge die Kopfzeile am Request statt in der App Shell zu stehen. Der
 * Knopf ist dieselbe Entscheidung wie die Tab-Leiste — er ist sofort da.
 */
export function SettingsButton() {
  return (
    <Link
      href="/einstellungen"
      aria-label="Einstellungen"
      className="flex h-11 w-11 items-center justify-center rounded-pill border border-border bg-surface text-muted press tap-target"
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden>
        <path
          fill="currentColor"
          d="M12 12.4a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z"
        />
        <path
          fill="currentColor"
          d="M12 14.1c-3.9 0-7.1 2.2-7.1 4.9 0 .6.5 1 1.1 1h12c.6 0 1.1-.4 1.1-1 0-2.7-3.2-4.9-7.1-4.9Z"
        />
      </svg>
    </Link>
  );
}
