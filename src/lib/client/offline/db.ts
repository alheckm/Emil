"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { Category, ListEntry } from "@/lib/data/shoppingList";

/**
 * Lokaler Spiegel der Einkaufsliste plus Puffer für noch nicht gesendete
 * Häkchen.
 *
 * Zweck ist der Supermarkt mit einem Balken Empfang: die Liste muss sichtbar
 * bleiben und Abhaken muss sich sofort anfühlen, auch wenn gerade nichts
 * rausgeht. Was hier liegt, ist eine Kopie — die Wahrheit steht weiterhin in
 * der Datenbank.
 *
 * Bewusst klein gehalten: ein Schnappschuss je Liste und höchstens ein
 * offener Häkchen-Wunsch je Zeile. Mehrfaches Antippen derselben Zeile
 * überschreibt sich, statt eine Warteschlange aufzustauen, die am Ende doch
 * nur den letzten Stand bedeutet.
 */

const DB_NAME = "emil";
const DB_VERSION = 1;
const SNAPSHOTS = "snapshots";
const OUTBOX = "outbox";

export interface ListSnapshot {
  listId: string;
  entries: ListEntry[];
  categories: Category[];
  savedAt: string;
}

export interface PendingToggle {
  entryId: string;
  checked: boolean;
  /** Zeitpunkt des Antippens — der Server verwirft damit veraltete Puffer. */
  clientUpdatedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  // Private Fenster und abgeschaltete Website-Daten: IndexedDB kann fehlen
  // oder werfen. Die App muss dann ohne Spiegel weiterlaufen, nicht abstürzen.
  if (typeof indexedDB === "undefined") return null;
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SNAPSHOTS)) {
        db.createObjectStore(SNAPSHOTS, { keyPath: "listId" });
      }
      if (!db.objectStoreNames.contains(OUTBOX)) {
        db.createObjectStore(OUTBOX, { keyPath: "entryId" });
      }
    },
  });
  return dbPromise;
}

export async function saveSnapshot(snapshot: ListSnapshot): Promise<void> {
  try {
    const db = await getDb();
    await db?.put(SNAPSHOTS, snapshot);
  } catch {
    // Kein Spiegel ist unschön, aber kein Grund, das Abhaken zu verhindern.
  }
}

export async function loadSnapshot(listId: string): Promise<ListSnapshot | null> {
  try {
    const db = await getDb();
    return (await db?.get(SNAPSHOTS, listId)) ?? null;
  } catch {
    return null;
  }
}

export async function queueToggle(toggle: PendingToggle): Promise<void> {
  try {
    const db = await getDb();
    await db?.put(OUTBOX, toggle);
  } catch {
    // Nichts zu retten — die Oberfläche meldet den Fehlschlag ohnehin.
  }
}

export async function pendingToggles(): Promise<PendingToggle[]> {
  try {
    const db = await getDb();
    return ((await db?.getAll(OUTBOX)) ?? []) as PendingToggle[];
  } catch {
    return [];
  }
}

export async function clearToggle(entryId: string): Promise<void> {
  try {
    const db = await getDb();
    await db?.delete(OUTBOX, entryId);
  } catch {
    // s. o.
  }
}
