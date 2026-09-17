import Link from "next/link";
import { Card, Screen } from "@/components/ui";

export const metadata = {
  title: "Datenschutz",
  description: "Welche Daten Emil speichert, wo sie liegen und wie du sie löschst.",
};

/**
 * Datenschutzerklärung.
 *
 * Statisch und ohne Anmeldung erreichbar: Apple verlangt für eine App im Store
 * eine öffentlich abrufbare Adresse, und die DSGVO verlangt sie ohnehin.
 * Bewusst knapp und konkret — Emil ist eine Haushalts-App, keine Plattform.
 *
 * Die eckigen Klammern sind absichtlich stehengelassen: eine erfundene Anschrift
 * wäre schlimmer als eine sichtbare Lücke.
 */
export default function PrivacyPage() {
  return (
    <Screen
      title="Datenschutz"
      lead="Was Emil speichert, wo es liegt und wie du es wieder loswirst."
    >
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Verantwortlich
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          [Name], [Anschrift], [E-Mail-Adresse]. Emil wird privat betrieben und
          nicht kommerziell angeboten.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Welche Daten gespeichert werden
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          <li>
            <strong>Konto:</strong> E-Mail-Adresse und ein verschlüsselter
            Passwort-Hash. Das Passwort selbst wird nicht gespeichert.
          </li>
          <li>
            <strong>Inhalte:</strong> deine Rezepte samt Zutaten, hochgeladene
            Rezeptbilder, die Einkaufsliste und der Haushalt, zu dem du gehörst.
          </li>
          <li>
            <strong>Herkunft:</strong> bei importierten Rezepten die Adresse der
            Quellseite, damit nachvollziehbar bleibt, woher das Rezept stammt.
          </li>
          <li>
            <strong>Auf deinem Gerät:</strong> eine Kopie der Einkaufsliste und
            noch nicht gesendete Häkchen, damit die Liste ohne Empfang
            funktioniert. Diese Kopie verlässt das Gerät nicht und verschwindet,
            wenn du die Website-Daten löschst.
          </li>
        </ul>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Es gibt keine Analyse-, Tracking- oder Werbedienste, keine Cookies
          außer denen, die die Anmeldung braucht, und keine Weitergabe an
          Dritte.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Wo die Daten liegen
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          In einer Postgres-Datenbank bei <strong>Supabase</strong> in der
          Region Frankfurt (EU), zusammen mit den Rezeptbildern. Die Anwendung
          selbst läuft bei <strong>Vercel</strong>. Beide verarbeiten die Daten
          ausschließlich in unserem Auftrag.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Der Zugriff ist in der Datenbank selbst geregelt: Rezepte und
          Einkaufsliste sind nur für Mitglieder deines Haushalts lesbar.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Löschen
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Unter{" "}
          <Link href="/konto" className="underline underline-offset-4">
            Konto
          </Link>{" "}
          kannst du dein Konto jederzeit selbst löschen. Damit verschwinden
          deine Mitgliedschaft und — wenn du das letzte Mitglied warst — der
          Haushalt mit allen Rezepten, Bildern und Listen. Das lässt sich nicht
          rückgängig machen.
        </p>
      </Card>

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
