import Link from "next/link";
import { Section, Screen } from "@/components/ui";

export const metadata = {
  title: "Nutzungsbedingungen",
  description: "Wie emil genutzt werden darf und wer für welche Inhalte verantwortlich ist.",
};

/**
 * Nutzungsbedingungen.
 *
 * Bewusst kurz — emil ist kostenlos, ohne Werbung und ohne eigene
 * Inhaltemoderation durch Dritte. Der Abschnitt „Melden" erfüllt Art. 16 DSA
 * (Melde- und Abhilfeverfahren für Hosting-Dienste): emil speichert
 * Nutzerinhalte (Rezepte, Bilder) und ist damit Hosting-Anbieter im Sinne des
 * DSA, auch als Kleinstunternehmen ohne Transparenzberichtspflicht.
 *
 * Statisch und ohne Anmeldung erreichbar, wie /datenschutz und /impressum.
 */
export default function TermsPage() {
  return (
    <Screen
      title="Nutzungsbedingungen"
      lead="Kurz gefasst: kostenlos, ohne Garantie, deine Inhalte bleiben deine."
      tabbar={false}
    >
      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Leistung
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          emil ist ein kostenloses Angebot von Alexander Heckmann (siehe{" "}
          <Link href="/impressum" className="underline underline-offset-4">
            Impressum
          </Link>
          ) zum gemeinsamen Sammeln von Rezepten und Führen einer
          Einkaufsliste im Haushalt. Es besteht kein Anspruch auf ständige
          Verfügbarkeit oder Fehlerfreiheit.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Mindestalter
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Ein Konto darf anlegen, wer mindestens 16 Jahre alt ist.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Deine Inhalte
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Für Rezepte, Bilder und Texte, die du einträgst, importierst oder
          hochlädst, bist du selbst verantwortlich — insbesondere dafür, dass
          du zu ihrer Nutzung berechtigt bist. Du räumst emil das Recht ein,
          diese Inhalte zu speichern, umzurechnen und an dein Haushalt
          weiterzugeben, ausschließlich zum Betrieb der Anwendung.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Melden rechtswidriger Inhalte (Art. 16 DSA)
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Hältst du einen Inhalt in emil für rechtswidrig, melde ihn per
          E-Mail an{" "}
          <a href="mailto:writeemil@outlook.com" className="underline underline-offset-4">
            writeemil@outlook.com
          </a>{" "}
          oder über das{" "}
          <Link href="/kontakt" className="underline underline-offset-4">
            Kontaktformular
          </Link>{" "}
          mit einer Begründung, dem Fundort (z. B. der Rezept-Adresse) und
          deiner Kontaktmöglichkeit. Meldungen werden geprüft; betroffene
          Konten können bei klaren Verstößen gesperrt werden.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Sperrung und Kündigung
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Du kannst dein Konto jederzeit unter{" "}
          <Link href="/einstellungen/konto/loeschen" className="underline underline-offset-4">
            Konto löschen
          </Link>{" "}
          beenden. Bei Verstößen gegen diese Bedingungen oder geltendes Recht
          kann ein Konto mit Begründung gesperrt oder gelöscht werden.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Haftung
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Die Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt,
          außer bei Schäden aus der Verletzung des Lebens, des Körpers oder
          der Gesundheit. Es gilt deutsches Recht.
        </p>
      </Section>

      <p className="text-[12.5px] text-muted">Stand: 25. September 2026.</p>

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
