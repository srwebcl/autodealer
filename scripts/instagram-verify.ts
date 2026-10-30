/**
 * Verificación SOLO LECTURA de la conexión con la API de Instagram.
 * - Nunca imprime el token (ni en errores).
 * - No modifica nada en Instagram ni en la base.
 * Uso: npm run ig:verify [-- --dump=/ruta/captions.json]
 */
import { existsSync, writeFileSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
const IG_USER_ID = process.env.INSTAGRAM_USER_ID ?? "";
const VERSION = process.env.INSTAGRAM_GRAPH_VERSION ?? "v26.0";
const dumpArg = process.argv.find((a) => a.startsWith("--dump="))?.slice(7);

const redact = (s: string) => s.replace(TOKEN || "\u0000", "[TOKEN]").replace(/access_token=[^&\s"]+/g, "access_token=[REDACTED]");

function fail(msg: string): never {
  console.error(`✗ ${redact(msg)}`);
  process.exit(1);
}

if (!TOKEN) fail("INSTAGRAM_ACCESS_TOKEN no está definida en .env.local");
if (!/^\d+$/.test(IG_USER_ID)) fail("INSTAGRAM_USER_ID no está definida o no es numérica");

type GraphError = { error?: { message?: string; type?: string; code?: number; error_subcode?: number } };

async function graph<T>(host: string, path: string, params: Record<string, string> = {}): Promise<{ ok: boolean; status: number; body: T & GraphError }> {
  const url = new URL(`https://${host}/${VERSION}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  // Token en cabecera, no en la URL: no queda en logs de proxies.
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` }, signal: AbortSignal.timeout(15_000) });
  const body = (await res.json().catch(() => ({}))) as T & GraphError;
  return { ok: res.ok && !body.error, status: res.status, body };
}

async function follow<T>(next: string): Promise<T & GraphError & { paging?: { next?: string } }> {
  const u = new URL(next);
  if (u.protocol !== "https:" || !["graph.facebook.com", "graph.instagram.com"].includes(u.hostname)) {
    fail(`URL de paginación con host inesperado: ${u.hostname}`);
  }
  u.searchParams.delete("access_token");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${TOKEN}` }, signal: AbortSignal.timeout(15_000) });
  return (await res.json()) as T & GraphError & { paging?: { next?: string } };
}

const date = (unix?: number) => (unix ? new Date(unix * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "nunca / no informado");
const errText = (b: GraphError) => (b.error ? `${b.error.type ?? ""} código ${b.error.code}${b.error.error_subcode ? `/${b.error.error_subcode}` : ""}: ${b.error.message}` : "");

async function main() {
  console.log(`API Graph ${VERSION}`);
  const prefix = TOKEN.slice(0, 3);
  console.log(`Formato del token: ${prefix === "EAA" ? "Facebook (EAA…)" : prefix.startsWith("IG") ? "Instagram (IG…)" : "desconocido"} · longitud ${TOKEN.length}`);

  // 1) Qué host acepta el token.
  const hosts = ["graph.facebook.com", "graph.instagram.com"];
  let host = "";
  for (const h of hosts) {
    const r = await graph<{ id?: string; username?: string; media_count?: number; account_type?: string }>(h, IG_USER_ID, {
      fields: "id,username,media_count",
    });
    console.log(`\n[${h}] /{IG_USER_ID}: ${r.ok ? `OK → @${r.body.username}, ${r.body.media_count} publicaciones` : `falla (${errText(r.body) || r.status})`}`);
    if (r.ok && !host) host = h;
  }
  if (!host) fail("Ningún host aceptó el token para INSTAGRAM_USER_ID.");

  // 2) Datos del token (debug_token solo existe en graph.facebook.com).
  if (host === "graph.facebook.com") {
    const d = await graph<{ data?: Record<string, unknown> }>(host, "debug_token", { input_token: TOKEN });
    if (d.ok && d.body.data) {
      const t = d.body.data as {
        type?: string; application?: string; is_valid?: boolean; expires_at?: number; data_access_expires_at?: number;
        issued_at?: number; scopes?: string[]; granular_scopes?: { scope: string; target_ids?: string[] }[]; profile_id?: string;
      };
      console.log("\n— debug_token —");
      console.log(`tipo: ${t.type ?? "(no informado)"} · app: ${t.application} · válido: ${t.is_valid}`);
      console.log(`emitido: ${date(t.issued_at)} · expira: ${t.expires_at === 0 ? "NO EXPIRA (0)" : date(t.expires_at)}`);
      console.log(`acceso a datos expira: ${date(t.data_access_expires_at)}`);
      console.log(`permisos: ${(t.scopes ?? []).join(", ")}`);
      for (const g of t.granular_scopes ?? []) console.log(`  · ${g.scope}: ${g.target_ids ? `${g.target_ids.length} objetivo(s)` : "todos"}`);
      if (t.profile_id) console.log(`profile_id (token de página): sí`);
    } else {
      console.log(`\ndebug_token no disponible: ${errText(d.body)}`);
    }
  }

  // 3) Publicaciones: primera página con todos los campos que usará la sync.
  const fields = "id,caption,media_type,media_product_type,media_url,permalink,timestamp,children{id,media_type,media_url}";
  const first = await graph<{ data?: Media[]; paging?: { next?: string } }>(host, `${IG_USER_ID}/media`, { fields, limit: "50" });
  if (!first.ok) fail(`No se pudo leer /media: ${errText(first.body)}`);

  type Media = {
    id: string; caption?: string; media_type: string; media_product_type?: string; media_url?: string; permalink?: string;
    timestamp: string; children?: { data: { id: string; media_type: string; media_url?: string }[]; paging?: { next?: string } };
  };
  const all: Media[] = [...(first.body.data ?? [])];
  let next = first.body.paging?.next;
  while (next && all.length < 5000) {
    const page = await follow<{ data?: Media[] }>(next);
    if (page.error) fail(`Error paginando: ${errText(page)}`);
    all.push(...(page.data ?? []));
    next = page.paging?.next;
  }

  const byType = all.reduce<Record<string, number>>((acc, m) => ((acc[m.media_type] = (acc[m.media_type] ?? 0) + 1), acc), {});
  const withCaption = all.filter((m) => m.caption?.trim()).length;
  const carousels = all.filter((m) => m.media_type === "CAROUSEL_ALBUM");
  const childCounts = carousels.map((c) => c.children?.data.length ?? 0);
  const childPaged = carousels.filter((c) => c.children?.paging?.next).length;
  const missingUrl = all.filter((m) => m.media_type === "IMAGE" && !m.media_url).length;
  const mediaHosts = new Set<string>();
  for (const m of all) {
    for (const u of [m.media_url, ...(m.children?.data.map((c) => c.media_url) ?? [])]) if (u) mediaHosts.add(new URL(u).hostname.replace(/^[^.]+\./, "*."));
  }
  const times = all.map((m) => m.timestamp).sort();

  console.log("\n— Publicaciones —");
  console.log(`leídas: ${all.length} · rango: ${times[0]?.slice(0, 10)} → ${times.at(-1)?.slice(0, 10)}`);
  console.log(`por tipo: ${JSON.stringify(byType)}`);
  console.log(`con caption: ${withCaption}/${all.length}`);
  console.log(`carruseles: ${carousels.length} · hijos por carrusel: min ${childCounts.length ? Math.min(...childCounts) : 0} / máx ${childCounts.length ? Math.max(...childCounts) : 0} · con paginación de hijos: ${childPaged}`);
  console.log(`imágenes sin media_url: ${missingUrl}`);
  console.log(`hosts de medios: ${[...mediaHosts].join(", ")}`);

  const perMonth = all.reduce<Record<string, number>>((acc, m) => ((acc[m.timestamp.slice(0, 7)] = (acc[m.timestamp.slice(0, 7)] ?? 0) + 1), acc), {});
  console.log(`por mes (últimos 12): ${Object.entries(perMonth).sort().slice(-12).map(([k, v]) => `${k}:${v}`).join(" ")}`);

  console.log("\n— Muestra (3 más recientes) —");
  for (const m of all.slice(0, 3)) {
    console.log(`\n${m.timestamp} · ${m.media_type}${m.children ? ` (${m.children.data.length} hijos)` : ""} · ${m.permalink}`);
    console.log((m.caption ?? "(sin caption)").slice(0, 600));
  }

  if (dumpArg) {
    // Solo contenido público (caption, tipo, fecha, permalink). Sin URLs firmadas ni token.
    writeFileSync(dumpArg, JSON.stringify(all.map(({ id, caption, media_type, timestamp, permalink, children }) => ({
      id, caption, media_type, timestamp, permalink, children: children?.data.map((c) => ({ id: c.id, media_type: c.media_type })),
    })), null, 2));
    console.log(`\nCaptions guardados en ${dumpArg} (fuera del repositorio).`);
  }
  console.log("\n✓ Verificación terminada. No se modificó nada.");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
