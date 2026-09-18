import Link from "next/link";
import { RowLink, Screen } from "@/components/ui";

export const metadata = { title: "Einstellungen" };

/**
 * Die Einstellungen.
 *
 * Vorher waren Konto und Haushalt zwei eigene Tabs. Sie sind hier
 * zusammengezogen, weil sie dasselbe beantworten — „wer bin ich, mit wem teile
 * ich" — und weil beides selten angefasst wird. Unten bleiben damit die zwei
 * Bereiche, in denen wirklich gearbeitet wird.
 *
 * Die Seite ist vollständig statisch: nur Verweise, keine Daten. Sie steht
 * deshalb sofort, und die Zahlen dahinter lädt erst, wer hineingeht.
 */
export default function SettingsPage() {
  return (
    <Screen title="Einstellungen">
      <nav className="space-y-2">
        <RowLink href="/einstellungen/haushalt" prefetch>
          <span className="font-medium">Haushalt</span>
          <span className="block text-[13px] text-muted">
            Mitglieder und Einladungen
          </span>
        </RowLink>
        <RowLink href="/einstellungen/konto" prefetch>
          <span className="font-medium">Konto</span>
          <span className="block text-[13px] text-muted">
            E-Mail, Abmelden, Konto löschen
          </span>
        </RowLink>
      </nav>

      <p className="text-center text-[15px]">
        <Link
          href="/datenschutz"
          className="text-muted underline underline-offset-4"
        >
          Datenschutz
        </Link>
      </p>
    </Screen>
  );
}
