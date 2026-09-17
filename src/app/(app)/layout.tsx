import { Suspense } from "react";
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
          nichts, wenn die Markierung nachkommt. */}
      <Suspense fallback={<TabBarFallback />}>
        <TabBar />
      </Suspense>
    </div>
  );
}
