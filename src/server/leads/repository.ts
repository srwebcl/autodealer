import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { LEAD_FORMS, type ParsedLead } from "@/lib/leads/schema";

type Db = PrismaClient | Prisma.TransactionClient;

/** Máximo de solicitudes por visitante (hash de IP) en la ventana. */
export const LEAD_RATE_LIMIT = { max: 5, windowMs: 60 * 60_000 };

export async function isRateLimited(db: Db, ipHash: string | null, now = new Date()): Promise<boolean> {
  if (!ipHash) return false;
  const since = new Date(now.getTime() - LEAD_RATE_LIMIT.windowMs);
  const recent = await db.lead.count({ where: { ipHash, createdAt: { gte: since } } });
  return recent >= LEAD_RATE_LIMIT.max;
}

export async function createLead(db: Db, lead: ParsedLead, meta: { page?: string | null; ipHash?: string | null }) {
  const { nombre, telefono, email, ...details } = lead.data;
  return db.lead.create({
    data: {
      type: LEAD_FORMS[lead.form],
      name: nombre,
      phone: telefono,
      email: email ?? null,
      details: details as Prisma.InputJsonValue,
      page: meta.page ?? null,
      ipHash: meta.ipHash ?? null,
    },
    select: { id: true },
  });
}
