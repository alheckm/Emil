import Link from "next/link";
import { Section, Screen } from "@/components/ui";

export const metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung nach §5 DDG.",
};

/**
 * Impressum — Anbieterkennzeichnung nach §5 Digitale-Dienste-Gesetz (DDG,
 * löste 2024 das TMG ab) und Verantwortlichkeit nach §18 Abs. 2 MStV.
 *
 * Statisch und ohne Anmeldung erreichbar, wie /datenschutz: emil ist im
 * App Store und für die Registrierung offen, damit reicht die frühere
 * „privat betrieben"-Ausnahme nicht mehr.
 */
export default function ImprintPage() {
  return (
    <Screen
      title="Impressum"
      lead="Anbieterkennzeichnung nach §5 DDG."
      tabbar={false}
    >
      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Angaben gemäß §5 DDG
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Alexander Heckmann
          <br />
          Herzenstr. 15
          <br />
          78315 Radolfzell
          <br />
          Deutschland
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Kontakt
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          E-Mail:{" "}
          <a href="mailto:writeemil@outlook.com" className="underline underline-offset-4">
            writeemil@outlook.com
          </a>
          <br />
          Oder über das{" "}
          <Link href="/kontakt" className="underline underline-offset-4">
            Kontaktformular
          </Link>
          .
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Verantwortlich für den Inhalt nach §18 Abs. 2 MStV
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Alexander Heckmann (Anschrift wie oben).
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Streitschlichtung
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Wir sind nicht verpflichtet und nicht bereit, an einem
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Meldestelle nach dem Digital Services Act
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Hinweise auf rechtswidrige Inhalte richtest du bitte an obige
          E-Mail-Adresse. Näheres unter{" "}
          <Link href="/nutzungsbedingungen" className="underline underline-offset-4">
            Nutzungsbedingungen
          </Link>
          .
        </p>
      </Section>

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
