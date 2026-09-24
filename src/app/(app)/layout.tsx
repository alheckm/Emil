import { Suspense } from "react";
import { getMyAvatar } from "@/lib/server/profile";
import { TabBar, TabBarFallback } from "./TabBar";

/**
 * Rahmen für alles, was eine Anmeldung voraussetzt.
 *
 * Der Zweck ist Geschwindigkeit, nicht Optik: was hier steht, bleibt beim
 * Wechsel zwischen den Bereichen stehen und wird nicht neu gerendert. Vorher
 * war jeder Screen für sich allein, und jeder Wechsel baute alles neu auf.
 *
 * Hier wird bewusst **nicht** auf die Sitzung gewartet. Ein `await` auf
 * `cookies()` an dieser Stelle hielte `{children}` samt Tab-Leiste hinter dem
 * Request fest — und damit wäre die ganze App Shell wieder dahin. Die
 * Sitzungsprüfung passiert in den Seiten, hinter ihren eigenen
 * Suspense-Grenzen.
 *
 * `group` und `has-data-pending:` zusammen sind die Rückmeldung beim
 * Tab-Wechsel: die Leiste meldet über `data-pending`, dass eine Navigation
 * läuft, und der Inhalt darüber wird blass. Kein Koordinationsaufwand, reines
 * CSS über `:has()`.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="group flex min-h-full flex-1 flex-col">
      <div className="flex-1 transition-opacity duration-150 group-has-data-pending:opacity-50">
        {children}
      </div>
      {/* Die Leiste liest die Adresse und hängt deshalb hinter einer eigenen
          Grenze — sonst hielte sie den ganzen Rahmen aus der App Shell heraus.
          Der Platzhalter ist dieselbe Leiste ohne Hervorhebung, also springt
          nichts, wenn die Markierung nachkommt. Sie ist `fixed` (TabBar.tsx)
          und braucht deshalb keinen Platz im Fluss — Inhalt weicht ihr über
          `pb-tabbar` (components/ui.tsx) aus. */}
      <Suspense fallback={<TabBarFallback />}>
        <TabBarForUser />
      </Suspense>
    </div>
  );
}

/**
 * Holt den echten Nutzer-Avatar für den Konto-Tab (DESIGN.md: „Konto zeigt
 * den echten Nutzer-Avatar, kein generisches Icon"). Ein eigener, kleiner
 * Server-Baustein, weil `TabBar` selbst clientseitig ist (`usePathname`) und
 * Session-Daten nicht dorthin exportieren kann.
 */
async function TabBarForUser() {
  const { initial, avatarUrl } = await getMyAvatar();
  return <TabBar avatarInitial={initial} avatarUrl={avatarUrl} />;
}
