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
    <Screen title="Konto">
      <nav>
        <RowLink href="/einstellungen/haushalt" prefetch>
          <span>Haushalt</span>
          <span className="block text-[13px] text-muted">
            Mitglieder und Einladungen
          </span>
        </RowLink>
        <div className="h-px bg-border" />
        <RowLink href="/einstellungen/konto" prefetch>
          <span>Konto</span>
          <span className="block text-[13px] text-muted">
            Name, Foto, E-Mail, Abmelden, Konto löschen
          </span>
        </RowLink>
      </nav>

      <p className="text-center text-[14px]">
        <Link href="/datenschutz" className="text-muted underline underline-offset-4">
          Datenschutz
        </Link>
      </p>
    </Screen>
  );
}
