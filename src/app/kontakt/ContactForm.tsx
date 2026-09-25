"use client";

import { useState } from "react";
import { Button, Field, Textarea } from "@/components/ui";

const CONTACT_ADDRESS = "writeemil@outlook.com";

/**
 * Kontaktformular ohne eigenen Versand: emil hat keinen E-Mail-Dienst im
 * Betrieb (PRODUCT.md — kein API-Key, keine laufenden Kosten) und soll auch
 * für ein Formular keinen dazubekommen. Beim Absenden baut der Browser
 * stattdessen einen `mailto:`-Link aus den Feldern und übergibt ihn an die
 * Mail-App des Geräts — die Nachricht verlässt zu keinem Zeitpunkt einen
 * Server von emil.
 *
 * Voraussetzung: eine eingerichtete Mail-App. Ohne eine öffnet sich sichtbar
 * nichts — dagegen hilft nur der direkte `mailto:`-Link auf /impressum und
 * /nutzungsbedingungen, der immer als Rückweg bestehen bleibt.
 */
export function ContactForm() {
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [absenderMail, setAbsenderMail] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = absenderMail
      ? `${nachricht}\n\n—\nMeine E-Mail für eine Antwort: ${absenderMail}`
      : nachricht;

    const url =
      `mailto:${CONTACT_ADDRESS}` +
      `?subject=${encodeURIComponent(betreff || "Nachricht über emil")}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = url;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Betreff"
        name="betreff"
        value={betreff}
        onChange={(event) => setBetreff(event.target.value)}
        placeholder="Worum geht's?"
        required
      />
      <Field
        label="Deine E-Mail-Adresse (optional)"
        name="absender"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        value={absenderMail}
        onChange={(event) => setAbsenderMail(event.target.value)}
        placeholder="Falls wir zurückschreiben sollen"
        hint="Ohne Angabe steht in der Mail nur, was deine Mail-App als Absender einträgt."
      />
      <Textarea
        label="Nachricht"
        name="nachricht"
        rows={6}
        value={nachricht}
        onChange={(event) => setNachricht(event.target.value)}
        placeholder="Deine Nachricht"
        required
      />
      <Button type="submit">In der Mail-App öffnen</Button>
      <p className="text-[12.5px] leading-relaxed text-muted">
        Öffnet deine Mail-App mit einer vorausgefüllten Nachricht an{" "}
        {CONTACT_ADDRESS} — emil verschickt selbst keine E-Mails und
        speichert diese Eingaben nirgends.
      </p>
    </form>
  );
}
