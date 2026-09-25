import Link from "next/link";
import { Section, Screen } from "@/components/ui";

export const metadata = {
  title: "Datenschutz",
  description: "Welche Daten emil speichert, wo sie liegen und wie du sie löschst.",
};

/**
 * Datenschutzerklärung nach Art. 13 DSGVO.
 *
 * Statisch und ohne Anmeldung erreichbar: Apple verlangt für eine App im Store
 * eine öffentlich abrufbare Adresse, und die DSGVO verlangt sie ohnehin.
 * emil ist öffentlich registrierbar, also gilt die volle Informationspflicht —
 * die frühere „privat betrieben"-Kürzung passt nicht mehr.
 *
 * Bewusst konkret statt generisch: jeder genannte Dienst (Supabase, Vercel)
 * ist tatsächlich im Einsatz, siehe next.config.ts und src/app/layout.tsx.
 * Kein Tracking, keine Werbung — das stimmt erst seit Speed Insights entfernt
 * wurde (src/app/layout.tsx), sonst wäre der Satz unten falsch.
 */
export default function PrivacyPage() {
  return (
    <Screen
      title="Datenschutz"
      lead="Was emil speichert, wo es liegt und wie du es wieder loswirst."
      tabbar={false}
    >
      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Verantwortlicher
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Alexander Heckmann, Herzenstr. 15, 78315 Radolfzell.
          <br />
          E-Mail:{" "}
          <a href="mailto:alexander.heckmann@outlook.com" className="underline underline-offset-4">
            alexander.heckmann@outlook.com
          </a>
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Welche Daten gespeichert werden — und warum
        </h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">
          <li>
            <strong>Konto:</strong> E-Mail-Adresse und ein verschlüsselter
            Passwort-Hash. Das Passwort selbst wird nicht gespeichert.
            Grundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — ohne
            Konto kein Zugang).
          </li>
          <li>
            <strong>Profil:</strong> Klarname und Profilfoto, freiwillig
            hinterlegt unter Konto. Beides ist für die Mitglieder deines
            Haushalts sichtbar — etwa bei zugewiesenen Aufgaben. Grundlage:
            Art. 6 Abs. 1 lit. b.
          </li>
          <li>
            <strong>Inhalte:</strong> deine Rezepte samt Zutaten, hochgeladene
            Rezeptbilder, die Einkaufsliste und der Haushalt, zu dem du
            gehörst. Grundlage: Art. 6 Abs. 1 lit. b.
          </li>
          <li>
            <strong>Herkunft:</strong> bei importierten Rezepten die Adresse
            der Quellseite, damit nachvollziehbar bleibt, woher das Rezept
            stammt. Grundlage: Art. 6 Abs. 1 lit. b.
          </li>
          <li>
            <strong>Anmelde-E-Mails:</strong> Bestätigungs- und
            Passwort-Zurücksetzen-Mails, versendet über unseren
            Auftragsverarbeiter Supabase. Grundlage: Art. 6 Abs. 1 lit. b.
          </li>
          <li>
            <strong>Server- und Zugriffsprotokolle:</strong> beim Aufruf der
            Anwendung erfassen Vercel und Supabase automatisch technische
            Daten wie IP-Adresse, Zeitpunkt und aufgerufene Adresse, zur
            Fehlersuche und Missbrauchsabwehr. Grundlage: Art. 6 Abs. 1 lit. f
            (berechtigtes Interesse an einem sicheren Betrieb).
          </li>
          <li>
            <strong>Auf deinem Gerät:</strong> eine Kopie der Einkaufsliste und
            noch nicht gesendete Häkchen, damit die Liste ohne Empfang
            funktioniert. Diese Kopie verlässt das Gerät nicht und verschwindet,
            wenn du die Website-Daten löschst. Grundlage: §25 Abs. 2 Nr. 2
            TDDDG (unbedingt erforderlich), keine Einwilligung nötig.
          </li>
        </ul>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Es gibt keine Analyse-, Tracking- oder Werbedienste und keine
          Cookies außer denen, die die Anmeldung technisch braucht.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Wo die Daten liegen und wer sie verarbeitet
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          In einer Postgres-Datenbank bei <strong>Supabase</strong> in der
          Region Frankfurt (EU), zusammen mit den Rezeptbildern. Die Anwendung
          selbst läuft bei <strong>Vercel</strong>, mit Serverfunktionen
          ebenfalls in Frankfurt. Dein Browser verbindet sich für die
          Echtzeit-Synchronisation der Einkaufsliste direkt mit den Servern
          von Supabase.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Beide Unternehmen haben ihren Sitz in den USA (Supabase Inc.,
          Vercel Inc.) und verarbeiten die Daten ausschließlich in unserem
          Auftrag (Art. 28 DSGVO), teils auch außerhalb der EU — abgesichert
          über EU-Standardvertragsklauseln und, soweit zertifiziert, das
          EU-US Data Privacy Framework.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Der Zugriff ist zusätzlich in der Datenbank selbst geregelt: Rezepte
          und Einkaufsliste sind nur für Mitglieder deines Haushalts lesbar.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Wie lange die Daten bleiben
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Konto- und Inhaltsdaten bleiben gespeichert, bis du dein Konto
          löschst. Server- und Zugriffsprotokolle werden nach der bei Vercel
          und Supabase üblichen kurzen Frist automatisch gelöscht.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Deine Rechte
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
          Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
          Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21) gegen
          Verarbeitungen, die auf einem berechtigten Interesse beruhen.
          Wende dich dafür an obige E-Mail-Adresse. Du kannst dich außerdem
          bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77), z. B.
          beim{" "}
          <a
            href="https://www.baden-wuerttemberg.datenschutz.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Landesbeauftragten für den Datenschutz und die
            Informationsfreiheit Baden-Württemberg
          </a>
          .
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Mindestalter
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          emil richtet sich an Personen ab 16 Jahren.
        </p>
      </Section>

      <Section>
        <h2 className="text-[12px] font-bold tracking-[0.06em] text-muted uppercase">
          Löschen
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">
          Unter{" "}
          <Link
            href="/einstellungen/konto/loeschen"
            className="underline underline-offset-4"
          >
            Konto löschen
          </Link>{" "}
          kannst du dein Konto jederzeit selbst löschen. Damit verschwinden
          deine Mitgliedschaft und — wenn du das letzte Mitglied warst — der
          Haushalt mit allen Rezepten, Bildern und Listen. Das lässt sich nicht
          rückgängig machen.
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
