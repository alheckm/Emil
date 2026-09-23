"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/client/supabase";
import { createHousehold, redeemInvite } from "@/lib/data/households";
import { Button, Section, Field, Notice } from "@/components/ui";

/**
 * Der erste Bildschirm nach der Anmeldung: Haushalt anlegen oder beitreten.
 *
 * Beides nebeneinander statt hintereinander — wer den Code des Partners schon
 * abgetippt bereithält, soll nicht erst durch „Anlegen" hindurch müssen und
 * danach zwei Haushalte haben.
 */
export function StartForms() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  async function run(
    kind: "create" | "join",
    action: (supabase: NonNullable<ReturnType<typeof getBrowserSupabase>>) => Promise<
      { ok: true; value: string } | { ok: false; error: string }
    >,
  ) {
    setError("");
    setBusy(kind);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setBusy(null);
      return;
    }

    const result = await action(supabase);
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
      return;
    }

    router.refresh();
    router.replace("/haushalt");
  }

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      <Section>
        <h2 className="text-[20px] font-extrabold uppercase">Haushalt anlegen</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Du wirst Eigentümer und kannst danach jemanden einladen.
        </p>
        {/* method="post": siehe LoginForm — ohne JS darf der Einladungscode
            nicht in der Adresszeile landen. */}
        <form
          method="post"
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const name = String(new FormData(event.currentTarget).get("name") ?? "");
            void run("create", (supabase) => createHousehold(supabase, name));
          }}
        >
          <Field
            label="Name"
            name="name"
            required
            maxLength={60}
            placeholder="Zuhause"
            autoComplete="off"
          />
          <Button type="submit" disabled={busy !== null} loading={busy === "create"}>
            {busy === "create" ? "Einen Moment" : "Anlegen"}
          </Button>
        </form>
      </Section>

      <Section>
        <h2 className="text-[20px] font-extrabold uppercase">Einladung einlösen</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          Acht Zeichen vom anderen Handy. Groß- und Kleinschreibung egal.
        </p>
        {/* method="post": siehe LoginForm — ohne JS darf der Einladungscode
            nicht in der Adresszeile landen. */}
        <form
          method="post"
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const code = String(new FormData(event.currentTarget).get("code") ?? "");
            void run("join", (supabase) => redeemInvite(supabase, code));
          }}
        >
          <Field
            label="Einladungscode"
            name="code"
            required
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABCD2345"
            className="font-mono"
          />
          <Button type="submit" variant="secondary" disabled={busy !== null} loading={busy === "join"}>
            {busy === "join" ? "Einen Moment" : "Beitreten"}
          </Button>
        </form>
      </Section>
    </>
  );
}
