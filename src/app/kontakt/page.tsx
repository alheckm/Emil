import Link from "next/link";
import { Section, Screen } from "@/components/ui";
import { ContactForm } from "./ContactForm";

export const metadata = {
  title: "Kontakt",
  description: "Schreib uns — als Formular oder direkt per E-Mail.",
};

/**
 * Kontaktseite. Statisch und ohne Anmeldung erreichbar, wie /impressum,
 * /datenschutz und /nutzungsbedingungen — auch das Melde- und
 * Abhilfeverfahren nach Art. 16 DSA (siehe /nutzungsbedingungen) verweist
 * hierher.
 */
export default function ContactPage() {
  return (
    <Screen
      title="Kontakt"
      lead="Frage, Feedback oder eine Meldung nach den Nutzungsbedingungen — schreib uns."
      tabbar={false}
    >
      <Section>
        <ContactForm />
      </Section>

      <p className="text-center text-[15px]">
        <Link href="/" className="text-muted underline underline-offset-4">
          Zurück
        </Link>
      </p>
    </Screen>
  );
}
