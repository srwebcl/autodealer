import type { PrismaClient } from "@/generated/prisma/client";
import { InstagramClient } from "@/lib/instagram/client";
import { parseEncryptionKey } from "@/lib/security/crypto";
import { getR2Env, R2Storage } from "@/lib/storage/r2";
import { getInstagramConfig, syncOptionsFrom } from "./config";
import type { SyncDeps, SyncOptions } from "./sync";
import { InstagramTokenManager, type RefreshOutcome } from "./token";

export function createTokenManager(db: PrismaClient) {
  const config = getInstagramConfig();
  return new InstagramTokenManager({
    db,
    key: parseEncryptionKey(process.env.TOKEN_ENCRYPTION_KEY),
    userId: config.INSTAGRAM_USER_ID,
    envToken: config.INSTAGRAM_ACCESS_TOKEN,
    log: (level, eventType, message, details) =>
      db.syncLog.create({ data: { level, eventType, message, details: details as object | undefined } }),
  });
}

/**
 * Dependencias reales desde el entorno. El token sale de Neon (cifrado) y se renueva
 * si corresponde ANTES de sincronizar; si la renovación falla se sigue con el vigente.
 * Los errores nombran variables, nunca valores.
 */
export async function createSyncSetup(
  db: PrismaClient,
): Promise<{ deps: SyncDeps; options: SyncOptions; tokenRefresh: RefreshOutcome }> {
  const config = getInstagramConfig();
  const tokens = createTokenManager(db);
  const tokenRefresh = await tokens.refreshIfDue();
  const token = await tokens.getToken();
  const client = new InstagramClient({
    token,
    userId: config.INSTAGRAM_USER_ID,
    host: config.INSTAGRAM_GRAPH_HOST,
    version: config.INSTAGRAM_GRAPH_VERSION,
  });
  const storage = new R2Storage(getR2Env());
  return { deps: { db, client, storage }, options: syncOptionsFrom(config), tokenRefresh };
}
