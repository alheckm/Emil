/**
 * Die paar Bausteine, aus denen alle Formulare bestehen.
 *
 * Bewusst klein gehalten und ohne Bibliothek: Emil hat eine Handvoll Screens,
 * und ein Design-System für zwei Nutzer wäre mehr Pflege als Nutzen.
 *
 * Zwei Maße stehen hier nicht zufällig:
 * - Eingabefelder haben mindestens 16 px Schrift. Darunter zoomt iOS Safari
 *   beim Antippen ins Feld hinein und der Screen sitzt schief.
 * - Knöpfe und Felder sind mindestens 44 px hoch — Apples Mindestgröße für
 *   etwas, das man mit dem Daumen trifft, und die App wird im Supermarkt
 *   einhändig bedient.
 */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <input
        {...props}
        className={
          "mt-1 block h-12 w-full rounded-xl border border-border bg-bg px-3 text-base " +
          "text-text outline-none placeholder:text-muted/60 " +
          "focus:border-accent focus:ring-2 focus:ring-accent/30 " +
          className
        }
      />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "quiet" | "danger" }) {
  const look = {
    primary: "bg-accent text-accent-text",
    quiet: "border border-border bg-surface text-text",
    danger: "border border-accent text-accent",
  }[variant];

  return (
    <button
      {...props}
      className={
        "inline-flex h-12 w-full items-center justify-center rounded-xl px-4 " +
        "text-base font-medium transition-opacity active:opacity-70 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        look
      }
    />
  );
}

/**
 * Meldung über einem Formular.
 *
 * `role="alert"` ist kein Beiwerk: ohne die Ansage liest VoiceOver einen
 * Fehler, der nach dem Absenden erscheint, schlicht nicht vor — der Nutzer
 * wartet dann auf etwas, das längst da ist.
 */
export function Notice({
  tone,
  children,
}: {
  tone: "error" | "ok" | "info";
  children: ReactNode;
}) {
  const look = {
    error: "border-accent/40 bg-accent/10 text-text",
    ok: "border-ok/40 bg-ok/10 text-text",
    info: "border-border bg-bg text-muted",
  }[tone];

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={"rounded-xl border px-4 py-3 text-[15px] leading-relaxed " + look}
    >
      {children}
    </p>
  );
}

/** Rahmen für alles unterhalb des Logins: eine Spalte, Daumenbreite. */
export function Screen({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 px-safe pt-safe pb-safe">
      <div className="mx-auto w-full max-w-md py-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {lead && (
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{lead}</p>
        )}
        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </main>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & { label: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <select
        {...props}
        className={
          "mt-1 block h-12 w-full appearance-none rounded-xl border border-border " +
          "bg-bg px-3 text-base text-text outline-none " +
          "focus:border-accent focus:ring-2 focus:ring-accent/30 " +
          className
        }
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  hint,
  className = "",
  ...props
}: ComponentProps<"textarea"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <textarea
        {...props}
        className={
          "mt-1 block w-full rounded-xl border border-border bg-bg p-3 text-base " +
          "text-text outline-none placeholder:text-muted/60 " +
          "focus:border-accent focus:ring-2 focus:ring-accent/30 " +
          className
        }
      />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

/**
 * Zeile einer Liste, die auf einen Bildschirm führt.
 *
 * Als eigener Baustein, weil die Trefferfläche sonst je nach Screen anders
 * ausfällt — und im Supermarkt wird einhändig und in Bewegung getippt.
 */
export function RowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-[15px] active:opacity-70"
    >
      <span className="min-w-0">{children}</span>
      <span aria-hidden className="shrink-0 text-muted">
        ›
      </span>
    </Link>
  );
}
