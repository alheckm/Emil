"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { createInvite, revokeInvite } from "@/lib/data/households";
import { Button, Notice } from "@/components/ui";
import { ShareIcon } from "@/components/icons";

interface OpenInvite {
  code: string;
  expiresAt: string;
}

/**
 * Einladungscodes erzeugen und wieder zurücknehmen.
 *
 * Der Code wird groß und in Monospace gezeigt: er wird vom anderen Handy
 * abgetippt, nicht kopiert. Das Alphabet der Codes lässt 0/O/1/I/l bewusst aus
 * (siehe create_invite in 0005_funktionen.sql) — genau die verwechselt man
 * dabei.
 */
export function InviteSection({
  householdId,
  invites,
}: {
  householdId: string;
  invites: OpenInvite[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  async function withSupabase(action: (supabase: NonNullable<ReturnType<typeof getBrowserSupabase>>) => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(false);
      return;
    }
    const result = await action(supabase);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Das hat nicht geklappt.");
      return;
    }
    router.refresh();
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
    } catch {
      // Ohne HTTPS oder ohne Erlaubnis gibt es keine Zwischenablage. Kein
      // Grund für eine Fehlermeldung — der Code steht ja lesbar da.
    }
  }

  /**
   * Teilt den Link, nicht den nackten Code — wer draufklickt, ist danach im
   * Haushalt, ohne acht Zeichen abzutippen.
   *
   * `navigator.share()` steht direkt im Klick-Handler, ohne `await` davor:
   * iOS erlaubt den Freigabedialog nur innerhalb der Geste, die ihn ausgelöst
   * hat — ein Netzwerk-Zwischenschritt (etwa ein neuer Code) davor ließe ihn
   * mit „NotAllowedError" scheitern.
   */
  function share(code: string) {
    const url = `${window.location.origin}/beitreten/${code}`;
    const text = "Tritt unserem Haushalt bei emil bei:";

    if (navigator.share) {
      navigator.share({ title: "emil – Einladung", text, url }).catch(() => {
        // Abgebrochener Freigabedialog ist kein Fehler.
      });
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      "_blank",
    );
  }

  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}

      {invites.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-muted">
          Noch keine offene Einladung.
        </p>
      ) : (
        <ul className="space-y-3">
          {invites.map((invite) => (
            <li key={invite.code} className="rounded-card bg-soft p-4">
              <p className="font-mono text-2xl tracking-[0.2em]">{invite.code}</p>
              <p className="mt-1 text-[13px] text-muted">
                gültig bis{" "}
                {new Date(invite.expiresAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => share(invite.code)}
                >
                  <ShareIcon className="h-4 w-4" />
                  Teilen
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copy(invite.code)}
                  >
                    {copied === invite.code ? "Kopiert" : "Code kopieren"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void withSupabase((supabase) => revokeInvite(supabase, invite.code))
                    }
                  >
                    Zurücknehmen
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        disabled={busy}
        loading={busy}
        onClick={() =>
          void withSupabase((supabase) => createInvite(supabase, householdId))
        }
      >
        {busy ? "Einen Moment" : "Neuen Code erzeugen"}
      </Button>
    </div>
  );
}
