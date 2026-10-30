import "server-only";
import { getDatabaseEnv } from "@/lib/env";
import { createPrismaClient } from "./create-client";

type Client = ReturnType<typeof createPrismaClient>;

// Reutiliza la instancia entre recargas en desarrollo y entre invocaciones calientes.
const globalForPrisma = globalThis as unknown as { prisma?: Client };

export const db: Client = globalForPrisma.prisma ?? createPrismaClient(getDatabaseEnv().DATABASE_URL);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
