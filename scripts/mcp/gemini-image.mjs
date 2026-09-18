#!/usr/bin/env node
/**
 * MCP-Server fuer Gemini-Bildgenerierung ("Nano Banana").
 *
 * Ohne Abhaengigkeiten: Node bringt fetch mit, das JSON-RPC ueber stdio sind
 * ein paar Zeilen. Der Schluessel steht in `.env.local` (gitignored) und wird
 * nur hier gelesen — weder `.mcp.json` noch das Shell-Profil kennen ihn.
 *
 * Bilder landen unter `public/generated/`, Pfade ausserhalb des Projekts
 * lehnt der Server ab.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, relative, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const DEFAULT_DIR = "public/generated";

function apiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    const match = env.match(/^[ \t]*(?:export[ \t]+)?GEMINI_API_KEY[ \t]*=[ \t]*(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // .env.local fehlt — die Fehlermeldung unten sagt, was zu tun ist.
  }
  return null;
}

function safeOutputPath(candidate) {
  const abs = resolve(ROOT, candidate);
  if (abs !== ROOT && !abs.startsWith(ROOT + "/")) {
    throw new Error(`Zielpfad liegt ausserhalb des Projekts: ${candidate}`);
  }
  return abs;
}

function defaultPath(prompt) {
  const slug =
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "bild";
  return join(ROOT, DEFAULT_DIR, `${slug}-${Date.now()}.png`);
}

function imagePart(path) {
  const abs = safeOutputPath(path);
  const ext = extname(abs).toLowerCase();
  const mimeType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return { inlineData: { mimeType, data: readFileSync(abs).toString("base64") } };
}

async function callGemini(parts, aspectRatio) {
  const key = apiKey();
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY fehlt. Zeile `GEMINI_API_KEY=...` in .env.local eintragen.",
    );
  }
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
      },
    }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${raw.slice(0, 600)}`);

  const json = JSON.parse(raw);
  const parts_out = json?.candidates?.[0]?.content?.parts ?? [];
  const image = parts_out.find((part) => part.inlineData?.data);
  if (!image) {
    const why =
      parts_out.map((part) => part.text).filter(Boolean).join(" ") ||
      json?.promptFeedback?.blockReason ||
      "kein Bild in der Antwort";
    throw new Error(`Modell lieferte kein Bild: ${why}`);
  }
  return {
    data: Buffer.from(image.inlineData.data, "base64"),
    mimeType: image.inlineData.mimeType ?? "image/png",
  };
}

function save(abs, buffer, mimeType) {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buffer);
  return `${relative(ROOT, abs)} (${mimeType}, ${Math.round(buffer.length / 1024)} KB)`;
}

const ASPECT = {
  type: "string",
  description: "Seitenverhaeltnis, z. B. 1:1, 16:9, 9:16, 4:3, 3:4. Ohne Angabe waehlt das Modell.",
};

const TOOLS = [
  {
    name: "generate_image",
    description:
      "Erzeugt ein Bild aus einem Textprompt mit Gemini 2.5 Flash Image und legt es im Projekt ab. Gibt den relativen Pfad zurueck.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Bildbeschreibung. Ausfuehrlich beschreiben zahlt sich aus." },
        output_path: {
          type: "string",
          description: `Zielpfad relativ zum Projekt. Ohne Angabe: ${DEFAULT_DIR}/<slug>-<zeit>.png`,
        },
        aspect_ratio: ASPECT,
      },
      required: ["prompt"],
    },
  },
  {
    name: "edit_image",
    description:
      "Bearbeitet vorhandene Bilder nach Textanweisung (Retusche, Stilwechsel, Komposition mehrerer Vorlagen) und speichert das Ergebnis als neue Datei.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Was geaendert werden soll." },
        input_paths: {
          type: "array",
          items: { type: "string" },
          description: "Ein oder mehrere Bildpfade relativ zum Projekt.",
        },
        output_path: { type: "string", description: "Zielpfad relativ zum Projekt." },
        aspect_ratio: ASPECT,
      },
      required: ["prompt", "input_paths"],
    },
  },
];

async function runTool(name, args) {
  const { prompt, output_path, aspect_ratio } = args;
  if (!prompt) throw new Error("prompt fehlt");

  if (name === "generate_image") {
    const { data, mimeType } = await callGemini([{ text: prompt }], aspect_ratio);
    return save(output_path ? safeOutputPath(output_path) : defaultPath(prompt), data, mimeType);
  }

  if (name === "edit_image") {
    const inputs = args.input_paths;
    if (!inputs?.length) throw new Error("input_paths braucht mindestens ein Bild");
    const parts = [...inputs.map(imagePart), { text: prompt }];
    const { data, mimeType } = await callGemini(parts, aspect_ratio);
    return save(output_path ? safeOutputPath(output_path) : defaultPath(prompt), data, mimeType);
  }

  throw new Error(`Unbekanntes Tool: ${name}`);
}

const send = (message) => process.stdout.write(JSON.stringify(message) + "\n");

async function handle(request) {
  const { id, method, params } = request;
  const hasId = id !== undefined && id !== null;
  const reply = (result) => hasId && send({ jsonrpc: "2.0", id, result });

  try {
    switch (method) {
      case "initialize":
        return reply({
          protocolVersion: params?.protocolVersion ?? "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "gemini-image", version: "1.0.0" },
        });
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call":
        return reply({
          content: [{ type: "text", text: await runTool(params?.name, params?.arguments ?? {}) }],
        });
      case "ping":
        return reply({});
      default:
        if (hasId) send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unbekannte Methode: ${method}` } });
    }
  } catch (error) {
    if (!hasId) return;
    // Tool-Fehler kommen als Inhalt zurueck, damit das Modell sie lesen und reagieren kann.
    if (method === "tools/call") {
      send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Fehler: ${error.message}` }], isError: true } });
    } else {
      send({ jsonrpc: "2.0", id, error: { code: -32603, message: error.message } });
    }
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) handle(JSON.parse(line));
  }
});
