import { normalizeText } from "./parse-caption";

/**
 * Estructura comercial de las publicaciones de AutoDealer, conservando el texto original:
 * A. titular + introducción · B. 📋 datos clave · C. 🛠️ equipamiento · D. 🤝 respaldo
 * E. 📍 visítanos (se reemplaza por los datos oficiales del sitio) · F. cierre.
 *
 * Solo se ordena y se corrige formato (espacios, saltos de línea). No se resume,
 * no se eliminan frases comerciales y no se agrega información.
 */

export interface ContentItem {
  icon?: string;
  title?: string;
  text: string;
}

export interface ContentSection {
  icon?: string;
  heading: string;
  items: ContentItem[];
}

export interface CommercialContent {
  version: 1;
  title: string[];
  intro: string[];
  keyData: { label: string; value: string }[];
  keyDataHeading?: string;
  equipment?: ContentSection;
  backing?: ContentSection;
  /** Secciones con títulos no reconocidos: se muestran tal cual. */
  extra: ContentSection[];
  closing: string[];
}

const EMOJI_PREFIX = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|⃣|‍(?:\p{Extended_Pictographic}))*\s*)+/u;
const EMOJI_SUFFIX = /(\s*(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍\p{Extended_Pictographic})*)+$/u;

function splitIcon(line: string): { icon?: string; rest: string } {
  const m = line.match(EMOJI_PREFIX);
  if (!m) return { rest: line.trim() };
  return { icon: m[0].replace(/\s+/g, "").trim(), rest: line.slice(m[0].length).trim() };
}

const letters = (s: string) => s.replace(/[^\p{L}]/gu, "");
function isUppercaseLine(s: string): boolean {
  const l = letters(s);
  return l.length >= 4 && l === l.toLocaleUpperCase("es-CL");
}

/** "📋 DATOS CLAVE" · "🛠️ EQUIPAMIENTO DESTACADO:" · "💰 VALOR CONTADO / OFERTA:" */
function asHeading(line: string): { icon?: string; heading: string } | null {
  const { icon, rest } = splitIcon(line);
  const text = rest.replace(/:\s*$/, "").trim();
  if (text.length > 70 || !isUppercaseLine(text)) return null;
  if (!icon && !rest.endsWith(":")) return null;
  return { icon, heading: text };
}

type Kind = "keyData" | "equipment" | "backing" | "visit" | "price" | "extra";
function classify(heading: string): Kind {
  const h = heading.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  if (/DATOS CLAVE|FICHA TECNICA/.test(h)) return "keyData";
  if (/EQUIPAMIENTO/.test(h)) return "equipment";
  if (/RESPALDO|FACILIDADES|SERVICIOS/.test(h)) return "backing";
  if (/VISITANOS|UBICACION|DONDE ESTAMOS/.test(h)) return "visit";
  if (/VALOR|PRECIO|OFERTA/.test(h)) return "price";
  return "extra";
}

/** "⛽ Motor CRDi Diésel: Eficiencia…" → { icon, title, text } · "Aire acondicionado" → { text } */
function toItem(line: string): ContentItem {
  const { icon, rest } = splitIcon(line);
  const m = rest.match(/^([^:]{2,60}):\s+(.+)$/);
  if (m && !/https?$/i.test(m[1])) return { ...(icon ? { icon } : {}), title: m[1].trim(), text: m[2].trim() };
  return { ...(icon ? { icon } : {}), text: rest };
}

const LABEL_VALUE = /^([\p{L} /()]{2,30}):\s*(.+)$/u;
const ADDRESS_OR_HOURS = /(balmaceda|huanhual|lun\s*-?\s*vie|lunes a viernes|s[aá]b(ado)?\s+\d|\d{1,2}:\d{2}\s*(a|-)\s*\d{1,2}:\d{2})/i;
const CALL_TO_ACTION = /(visítanos|visitanos|escríbenos|escribenos|contáctanos|contactanos|ven a verl|pruébal|pruebal|agenda tu|no aparece dos veces|tiro seguro)/i;

const cleanLine = (l: string) => l.replace(/\s+/g, " ").trim();

export function parseCommercialContent(caption: string | null | undefined): CommercialContent | null {
  if (!caption?.trim()) return null;
  const lines = normalizeText(caption)
    .split("\n")
    .map(cleanLine)
    // Hashtags al final o en líneas propias no forman parte de la descripción.
    .map((l) => l.replace(/(?:^|\s)#[\p{L}\d_]+/gu, "").trim())
    .filter(Boolean);

  const content: CommercialContent = { version: 1, title: [], intro: [], keyData: [], extra: [], closing: [] };

  // A. Titular: líneas iniciales en mayúsculas (puede ocupar 1–2 líneas).
  let i = 0;
  while (i < lines.length && i < 3 && isUppercaseLine(lines[i]) && !asHeading(lines[i])?.heading.match(/DATOS|FICHA/)) {
    content.title.push(lines[i]);
    i++;
  }

  let kind: Kind | "intro" = "intro";
  let current: ContentSection | null = null;
  const sectionFor = (k: Kind, h: { icon?: string; heading: string }): ContentSection | null => {
    if (k === "equipment") return (content.equipment ??= { ...h, items: [] });
    if (k === "backing") return (content.backing ??= { ...h, items: [] });
    if (k === "extra") {
      const s = { ...h, items: [] };
      content.extra.push(s);
      return s;
    }
    return null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const heading = asHeading(line);
    if (heading) {
      kind = classify(heading.heading);
      if (kind === "keyData") content.keyDataHeading = heading.heading;
      if (kind === "price") {
        // "💰 VALOR CONTADO / OFERTA:" + monto en la línea siguiente → dato clave.
        const value = lines[i + 1] && !asHeading(lines[i + 1]) ? lines[i + 1].replace(EMOJI_SUFFIX, "").trim() : "";
        if (value) {
          const label = heading.heading.charAt(0) + heading.heading.slice(1).toLocaleLowerCase("es-CL");
          content.keyData.push({ label, value });
          i++;
        }
        kind = "extra";
        current = null;
        continue;
      }
      current = sectionFor(kind, heading);
      continue;
    }

    const lv = line.match(LABEL_VALUE);
    if ((kind === "keyData" || kind === "intro") && lv && !splitIcon(line).icon) {
      content.keyData.push({ label: lv[1].trim(), value: lv[2].trim() });
      continue;
    }
    if (kind === "intro") {
      content.intro.push(line);
      continue;
    }
    if (kind === "visit") {
      // Dirección y horario del caption se reemplazan por el bloque oficial; el resto es cierre.
      if (!ADDRESS_OR_HOURS.test(line)) content.closing.push(line);
      continue;
    }
    if (ADDRESS_OR_HOURS.test(line) && !CALL_TO_ACTION.test(line)) continue;

    const item = toItem(line);
    // Cierre: invitación final (últimas líneas, sin formato "Título: texto").
    if (!item.title && CALL_TO_ACTION.test(line) && i >= lines.length - 3) {
      content.closing.push(line);
      continue;
    }
    if (!current) current = sectionFor("extra", { heading: "" });
    current!.items.push(item);
  }

  content.extra = content.extra.filter((s) => s.items.length > 0);
  return content;
}

/** Texto plano para metadatos y búsqueda: titular + introducción. */
export function plainDescription(c: CommercialContent): string | undefined {
  const text = c.intro.join("\n\n").trim();
  return text ? text.slice(0, 4000) : undefined;
}

/** Ítems de equipamiento como lista corta (títulos o textos), sin inventar nada. */
export function featureList(c: CommercialContent): string[] {
  return (c.equipment?.items ?? []).map((it) => (it.title ?? it.text).slice(0, 80)).slice(0, 40);
}
