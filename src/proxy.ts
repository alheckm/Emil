import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/server/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Alles außer statischen Dateien: die brauchen keine Sitzung, und jeder
  // übersprungene Aufruf spart eine Runde zum Auth-Server.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js).*)",
  ],
};
