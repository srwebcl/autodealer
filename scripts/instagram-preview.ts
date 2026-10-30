/**
 * Vista previa SOLO LECTURA: lee publicaciones reales, aplica el extractor y muestra
 * qué se publicaría, qué quedaría pendiente y por qué. No escribe en Neon ni en R2.
 * Uso: npm run ig:preview [-- --all] [--json=/ruta/reporte.json]
 */
import { existsSync, writeFileSync } from "node:fs";
import { InstagramClient } from "../src/lib/instagram/client";
import { looksLikeVehicle, parseCaption, publishBlockers } from "../src/lib/instagram/parse-caption";
import { formatClp } from "../src/lib/utils/format";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const all = process.argv.includes("--all");
const jsonOut = process.argv.find((a) => a.startsWith("--json="))?.slice(7);
const since = all ? new Date(0) : new Date(`${process.env.INSTAGRAM_SYNC_SINCE ?? "1970-01-01"}T00:00:00-03:00`);

async function main() {
  const client = new InstagramClient({
    token: process.env.INSTAGRAM_ACCESS_TOKEN ?? "",
    userId: process.env.INSTAGRAM_USER_ID ?? "",
    host: (process.env.INSTAGRAM_GRAPH_HOST as "graph.facebook.com" | "graph.instagram.com") ?? "graph.facebook.com",
    version: process.env.INSTAGRAM_GRAPH_VERSION ?? "v26.0",
  });
  const rows: Record<string, unknown>[] = [];
  const counts = { publicable: 0, pendiente: 0, omitida: 0 };
  outer: for await (const page of client.listMedia()) {
    for (const m of page) {
      if (new Date(m.timestamp) < since) break outer;
      const r = parseCaption(m.caption);
      const images = m.media_type === "IMAGE" ? 1 : (m.children?.data.filter((c) => c.media_type === "IMAGE").length ?? 0);
      let estado: keyof typeof counts;
      let motivo = "";
      if (m.media_type === "VIDEO") [estado, motivo] = ["omitida", "video"];
      else if (!looksLikeVehicle(r)) [estado, motivo] = ["omitida", "no parece vehículo"];
      else {
        const b = publishBlockers(r.vehicle, images);
        [estado, motivo] = b.length ? ["pendiente", b.join("; ")] : ["publicable", ""];
      }
      counts[estado]++;
      const v = r.vehicle;
      rows.push({
        fecha: m.timestamp.slice(0, 10),
        tipo: m.media_type === "CAROUSEL_ALBUM" ? `carrusel(${images})` : m.media_type.toLowerCase(),
        marca: v.make ?? "",
        modelo: v.model ?? "",
        version: v.version ?? "",
        año: v.year ?? "",
        km: v.mileageKm ?? "",
        precio: formatClp(v.priceClp) ?? "",
        estado,
        motivo,
        avisos: r.warnings.join(" | "),
        permalink: m.permalink,
        caption: m.caption,
      });
    }
  }
  const table = rows.map((r) => {
    const copy = { ...r };
    delete copy.caption;
    delete copy.permalink;
    delete copy.avisos;
    return copy;
  });
  console.table(table);
  console.log(counts);
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify(rows, null, 2));
    console.log(`Reporte completo (con captions) en ${jsonOut}`);
  }
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
