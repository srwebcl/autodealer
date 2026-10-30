import type { PrismaClient } from "@/generated/prisma/client";
import { InstagramClient } from "@/lib/instagram/client";
import { getR2Env, R2Storage } from "@/lib/storage/r2";
import { getInstagramConfig, syncOptionsFrom } from "./config";
import type { SyncDeps, SyncOptions } from "./sync";

/** Construye dependencias reales desde el entorno. Lanza errores que nombran variables, nunca valores. */
export function createSyncSetup(db: PrismaClient): { deps: SyncDeps; options: SyncOptions } {
  const config = getInstagramConfig();
  const client = new InstagramClient({
    token: config.INSTAGRAM_ACCESS_TOKEN,
    userId: config.INSTAGRAM_USER_ID,
    host: config.INSTAGRAM_GRAPH_HOST,
    version: config.INSTAGRAM_GRAPH_VERSION,
  });
  const storage = new R2Storage(getR2Env());
  return { deps: { db, client, storage }, options: syncOptionsFrom(config) };
}
