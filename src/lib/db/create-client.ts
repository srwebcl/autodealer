import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

// Node 22+ (Vercel) trae WebSocket global; Node 20 (local) necesita `ws`.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/** Crea un cliente Prisma sobre el driver serverless de Neon. Sin `server-only`: usable en scripts. */
export function createPrismaClient(connectionString: string) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
