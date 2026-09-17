"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/server/env";

/**
 * Supabase-Client für den Browser.
 *
 * Der anon-Key darf hier stehen: er kommt nur durch die RLS-Policies hindurch,
 * und die liegen in der Datenbank. Die Zugriffsgrenze ist nicht dieser Key.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  const config = getSupabaseConfig();
  if (!config) return null;
  client ??= createBrowserClient(config.url, config.anonKey);
  return client;
}
