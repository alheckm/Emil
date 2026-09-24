"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { redeemAndSwitchHousehold } from "@/lib/server/householdActions";
import { Button, Notice } from "@/components/ui";

/**
 * Wird nur gerendert, wenn die Seite schon geprüft hat, dass jemand
 * angemeldet ist. Der Beitritt läuft deshalb ohne weiteren Klick, sobald die
 * Komponente steht — `useRef` verhindert einen zweiten Aufruf, falls der
 * Effekt (Entwicklungsmodus, ein erneuter Render) doppelt feuert.
 *
 * `redeemAndSwitchHousehold()` (Server Action, householdActions.ts) löst den
 * Code ein und setzt den neuen Haushalt explizit als aktiven
 * (0026_aktiver_haushalt.sql) — bisherige Haushalte bleiben bestehen, man
 * kann später im Konto zwischen ihnen wechseln statt sie verlassen zu
 * müssen. Beides zusammen in einer Server Action, weil nur die
 * `loadHousehold()`s Zwischenspeicher per `updateTag()` sofort veralten
 * lassen kann — sonst zeigte `/liste` gleich danach noch den alten Haushalt.
 */
export function JoinHousehold({ code }: { code: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const result = await redeemAndSwitchHousehold(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
      router.replace("/liste");
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <Notice tone="error">{error}</Notice>
        <Link
          href="/haushalt/start"
          className="block text-center text-[15px] text-accent underline underline-offset-4"
        >
          Stattdessen einen eigenen Haushalt anlegen
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-[15px] leading-relaxed text-muted">
        Du trittst dem Haushalt bei …
      </p>
      <Button variant="secondary" loading disabled>
        Beitreten
      </Button>
    </div>
  );
}
