import { SUPABASE_MISSING_MESSAGE, getSupabaseConfig } from "@/lib/server/env";
import { getCurrentUser, getServerSupabase } from "@/lib/server/supabase";
import { listHouseholds } from "@/lib/data/households";
import { Notice, Screen, Section } from "@/components/ui";
import { LoginForm } from "@/app/anmelden/LoginForm";
import { RegisterForm } from "@/app/registrieren/RegisterForm";
import { JoinHousehold } from "./JoinHousehold";

/**
 * Diese Route darf blockieren — und zwar dauerhaft.
 *
 * Sie entscheidet, ob jemand angemeldet ist, und leitet entsprechend weiter.
 * Diese Antwort vorab auszuliefern hieße, kurz den falschen Bildschirm zu
 * zeigen; im Standalone-Modus vom Home-Bildschirm sieht man genau das
 * besonders deutlich. Und sie wird einmal beim Start durchlaufen, nicht in der
 * Schleife aus Tippen und Warten, um die es beim Rest der App geht.
 *
 * `instant = false` schaltet deshalb nur die Prüfung ab, die sonst bei jedem
 * Entwicklungslauf einen Hinweis für etwas melden würde, das hier Absicht ist.
 */
export const instant = false;

export const metadata = { title: "Einladung" };

/**
 * Landepunkt eines geteilten Einladungslinks (WhatsApp & Co.).
 *
 * Der Code steckt im Pfad, nicht in einer Query — das ist die einzige Form,
 * die beim Teilen unbeschadet ankommt. Angemeldet und noch in keinem Haushalt
 * tritt man automatisch bei (siehe `JoinHousehold`); sonst führt die Seite
 * erst durch Anmeldung oder Registrierung und kehrt danach über `next` hierher
 * zurück.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!getSupabaseConfig()) {
    return (
      <Screen title="emil" tabbar={false}>
        <Notice tone="error">{SUPABASE_MISSING_MESSAGE}</Notice>
      </Screen>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    const next = `/beitreten/${code}`;
    return (
      <Screen
        title="Einladung"
        lead="Jemand hat dich zu seinem Haushalt bei emil eingeladen."
        tabbar={false}
      >
        <Section>
          <h2 className="font-display text-[17px] font-bold text-text">
            Konto anlegen
          </h2>
          <div className="mt-4">
            <RegisterForm next={next} />
          </div>
        </Section>

        <Section>
          <h2 className="font-display text-[17px] font-bold text-text">
            Ich habe schon ein Konto
          </h2>
          <div className="mt-4">
            <LoginForm next={next} />
          </div>
        </Section>
      </Screen>
    );
  }

  const supabase = await getServerSupabase();
  const households = supabase ? await listHouseholds(supabase) : null;
  const existing = households?.ok ? households.value : [];

  // Wer schon einen Haushalt hat, tritt trotzdem bei — Emil zeigt danach den
  // neu beigetretenen (siehe listHouseholds(): neueste Mitgliedschaft
  // zuerst). Den alten wieder loszuwerden ist Sache von
  // /einstellungen/haushalt, deshalb landet man danach genau dort statt auf
  // /liste.
  return (
    <Screen title="Einladung" tabbar={false}>
      {existing.length > 0 && (
        <Notice tone="info">
          Du bist noch in „{existing[0].name}“. Nach dem Beitritt zeigt emil
          den neuen Haushalt — den alten kannst du in den Einstellungen
          verlassen.
        </Notice>
      )}
      <JoinHousehold
        code={code}
        redirectTo={existing.length > 0 ? "/einstellungen/haushalt" : "/liste"}
      />
    </Screen>
  );
}
