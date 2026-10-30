import type { Drivetrain, FuelType, Transmission } from "@/generated/prisma/enums";

/**
 * Extracción de datos de vehículo desde el caption de Instagram.
 *
 * Principios:
 * - Nunca inventar: si un valor es ambiguo, se omite y se deja una advertencia.
 * - Etiquetas explícitas ("Año: 2020") tienen prioridad sobre patrones libres.
 * - Cada campo registra su procedencia y confianza para revisión en el panel.
 */

export type ParsedField =
  | "make"
  | "model"
  | "version"
  | "year"
  | "mileageKm"
  | "priceClp"
  | "engine"
  | "fuelType"
  | "transmission"
  | "drivetrain"
  | "color";

export interface Provenance {
  source: "label" | "title" | "pattern";
  raw: string;
  confidence: number; // 0–1
}

export interface ParsedVehicle {
  make?: string;
  model?: string;
  version?: string;
  year?: number;
  mileageKm?: number;
  priceClp?: number;
  engine?: string;
  fuelType?: FuelType;
  transmission?: Transmission;
  drivetrain?: Drivetrain;
  color?: string;
  features: string[];
  description?: string;
}

export interface ParseResult {
  vehicle: ParsedVehicle;
  provenance: Partial<Record<ParsedField, Provenance>>;
  warnings: string[];
}

// ─── Marcas conocidas (mercado chileno) ───────────────────────────────

const BRANDS: [canonical: string, aliases: string[]][] = [
  ["Alfa Romeo", ["alfa romeo"]],
  ["Audi", ["audi"]],
  ["BAIC", ["baic"]],
  ["BMW", ["bmw"]],
  ["BYD", ["byd"]],
  ["Changan", ["changan"]],
  ["Chery", ["chery"]],
  ["Chevrolet", ["chevrolet"]],
  ["Chrysler", ["chrysler"]],
  ["Citroën", ["citroën", "citroen"]],
  ["Cupra", ["cupra"]],
  ["DFSK", ["dfsk"]],
  ["Dodge", ["dodge"]],
  ["Dongfeng", ["dongfeng"]],
  ["Fiat", ["fiat"]],
  ["Ford", ["ford"]],
  ["Foton", ["foton"]],
  ["Geely", ["geely"]],
  ["Great Wall", ["great wall"]],
  ["Haval", ["haval"]],
  ["Honda", ["honda"]],
  ["Hyundai", ["hyundai"]],
  ["Infiniti", ["infiniti"]],
  ["Isuzu", ["isuzu"]],
  ["JAC", ["jac"]],
  ["Jaguar", ["jaguar"]],
  ["Jeep", ["jeep"]],
  ["Jetour", ["jetour"]],
  ["Kia", ["kia"]],
  ["Land Rover", ["land rover"]],
  ["Lexus", ["lexus"]],
  ["Mahindra", ["mahindra"]],
  ["Maxus", ["maxus"]],
  ["Mazda", ["mazda"]],
  ["Mercedes-Benz", ["mercedes-benz", "mercedes benz", "mercedes"]],
  ["MG", ["mg"]],
  ["Mini", ["mini cooper", "mini"]],
  ["Mitsubishi", ["mitsubishi"]],
  ["Nissan", ["nissan"]],
  ["Omoda", ["omoda"]],
  ["Opel", ["opel"]],
  ["Peugeot", ["peugeot"]],
  ["Porsche", ["porsche"]],
  ["RAM", ["ram"]],
  ["Renault", ["renault"]],
  ["SEAT", ["seat"]],
  ["Skoda", ["skoda", "škoda"]],
  ["SsangYong", ["ssangyong", "ssang yong"]],
  ["Subaru", ["subaru"]],
  ["Suzuki", ["suzuki"]],
  ["Tesla", ["tesla"]],
  ["Toyota", ["toyota"]],
  ["Volkswagen", ["volkswagen", "vw"]],
  ["Volvo", ["volvo"]],
];

const LABELS: Record<ParsedField | "features", RegExp> = {
  make: /^marca$/,
  model: /^modelo$/,
  version: /^(version|versión|terminacion|terminación)$/,
  year: /^(ano|año|año modelo|modelo año)$/,
  mileageKm: /^(kilometraje|km|kms|kilometros|kilómetros|recorrido)$/,
  priceClp: /^(precio|valor|precio contado|precio final)$/,
  engine: /^(motor|cilindrada|motorizacion|motorización)$/,
  fuelType: /^(combustible|motor tipo)$/,
  transmission: /^(transmision|transmisión|caja|caja de cambios)$/,
  drivetrain: /^(traccion|tracción)$/,
  color: /^color$/,
  features: /^(equipamiento|extras|incluye|detalles)$/,
};

const MIN_YEAR = 1950;
const maxYear = () => new Date().getFullYear() + 1;
const MIN_PRICE = 300_000;
const MAX_PRICE = 1_000_000_000;

// ─── Utilidades de normalización ──────────────────────────────────────

/** Convierte letras "decorativas" Unicode (𝗔𝗕𝗖, 𝘈𝘉𝘊…) a ASCII y normaliza espacios. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ");
}

/** Quita viñetas y emojis del inicio de una línea. */
function stripBullet(line: string): string {
  return line.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Component}•·▪︎▫︎►▶︎➡️✔✓☑✅🔹🔸\-–—*+>|]+/u, "").trim();
}

const deaccent = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** "113.118" → 113118 · "113 mil" → 113000 · "113k" → 113000. Devuelve null si es ambiguo. */
export function parseChileanInteger(raw: string): number | null {
  const s = deaccent(raw).replace(/\s+/g, " ").trim();
  const mil = s.match(/^(\d{1,3}(?:[.,]\d{1,3})?)\s*(mil|k)\b/);
  if (mil) return Math.round(Number(mil[1].replace(",", ".")) * 1000);
  const millones = s.match(/^(\d{1,3}(?:[.,]\d{1,3})?)\s*(millones|millon|mm|m)\b/);
  if (millones) return Math.round(Number(millones[1].replace(",", ".")) * 1_000_000);
  const grouped = s.match(/^\d{1,3}(?:[.\s]\d{3})+(?!\d)/);
  if (grouped) return Number(grouped[0].replace(/[.\s]/g, ""));
  const plain = s.match(/^\d+(?![.,]\d)/);
  if (plain) return Number(plain[0]);
  return null;
}

export function parseYear(raw: string): number | null {
  const m = raw.match(/\b(19[5-9]\d|20\d{2})\b/);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= MIN_YEAR && y <= maxYear() ? y : null;
}

export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/^[^\d$]*/, "").replace(/^\$\s*/, "");
  const n = parseChileanInteger(cleaned);
  return n !== null && n >= MIN_PRICE && n <= MAX_PRICE ? n : null;
}

export function parseMileage(raw: string): number | null {
  const n = parseChileanInteger(raw.replace(/^[^\d]*/, ""));
  // Un kilometraje con forma de año (p. ej. "2020") sin unidad es ambiguo.
  if (n === null || n > 2_000_000) return null;
  return n;
}

function matchKeyword<T extends string>(text: string, table: [RegExp, T][]): T | null {
  const t = deaccent(text);
  const hits = new Set(table.filter(([re]) => re.test(t)).map(([, v]) => v));
  return hits.size === 1 ? [...hits][0] : null; // varias categorías = ambiguo
}

const FUEL_TABLE: [RegExp, FuelType][] = [
  [/\b(hibrido enchufable|phev|plug-?in)\b/, "PLUG_IN_HYBRID"],
  [/\b(hibrido|hev|hybrid|mild hybrid)\b/, "HYBRID"],
  [/\b(diesel|petrolero|crdi|tdi|hdi|dci)\b/, "DIESEL"],
  [/\b(bencina|gasolina|nafta)\b/, "GASOLINE"],
  [/\b(electrico|100% electrico)\b/, "ELECTRIC"],
  [/\b(glp|gnc|a gas)\b/, "GAS"],
];

const TRANSMISSION_TABLE: [RegExp, Transmission][] = [
  [/\b(automatica|automatico|aut\.?|at|cvt|dsg|tiptronic|steptronic|secuencial)\b/, "AUTOMATIC"],
  [/\b(manual|mecanica|mecanico|mt)\b/, "MANUAL"],
];

const DRIVETRAIN_TABLE: [RegExp, Drivetrain][] = [
  [/\b(4x4|4wd)\b/, "FOUR_WD"],
  [/\b(awd|4motion|quattro|xdrive|4matic|all-?grip)\b/, "AWD"],
  [/\b(4x2|fwd|traccion delantera)\b/, "FWD"],
  [/\b(rwd|traccion trasera)\b/, "RWD"],
];

function findBrand(text: string): { canonical: string; index: number; length: number } | null {
  const t = deaccent(text);
  let best: { canonical: string; index: number; length: number } | null = null;
  for (const [canonical, aliases] of BRANDS) {
    for (const alias of aliases) {
      const re = new RegExp(`(^|[^a-z0-9])${alias.replace(/[-\s]/g, "[-\\s]")}(?=$|[^a-z0-9])`);
      const m = re.exec(t);
      if (m) {
        const index = m.index + m[1].length;
        // Prioriza la aparición más temprana y, a igualdad, el alias más largo ("mini cooper" > "mini").
        if (!best || index < best.index || (index === best.index && alias.length > best.length)) {
          best = { canonical, index, length: alias.length };
        }
      }
    }
  }
  return best;
}

export function canonicalBrand(raw: string): string | null {
  const b = findBrand(raw);
  return b && b.index === 0 ? b.canonical : null;
}

const titleCase = (s: string) => s.replace(/\S+/g, (w) => (/\d/.test(w) || w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()));

// ─── Parser principal ─────────────────────────────────────────────────

export function parseCaption(caption: string | null | undefined): ParseResult {
  const vehicle: ParsedVehicle = { features: [] };
  const provenance: ParseResult["provenance"] = {};
  const warnings: string[] = [];
  if (!caption?.trim()) return { vehicle, provenance, warnings: ["Caption vacío"] };

  const text = normalizeText(caption);
  const lines = text.split("\n").map((l) => l.trim());
  const set = <K extends ParsedField>(field: K, value: ParsedVehicle[K] | null | undefined, p: Provenance) => {
    if (value === null || value === undefined || value === "" || vehicle[field] !== undefined) return;
    vehicle[field] = value;
    provenance[field] = p;
  };

  const consumed = new Set<number>();
  let inFeatures = false;

  // 1) Etiquetas explícitas "Clave: valor".
  lines.forEach((rawLine, i) => {
    const line = stripBullet(rawLine);
    const hasBullet = line !== rawLine.trim();
    // "Clave: valor" o "Clave:" (valor en las líneas siguientes, p. ej. Equipamiento).
    const m = line.match(/^([\p{L} ]{2,25}?)\s*(?:[:：]\s*(.*)|[\-–]\s*(.+))$/u);
    if (!m) {
      // En una lista de equipamiento, solo las líneas con viñeta son ítems.
      if (inFeatures && hasBullet && line && !line.startsWith("#")) {
        vehicle.features.push(line);
        consumed.add(i);
      } else inFeatures = false;
      return;
    }
    const label = deaccent(m[1].trim());
    const value = (m[2] ?? m[3] ?? "").trim();
    const field = (Object.keys(LABELS) as (keyof typeof LABELS)[]).find((k) => LABELS[k].test(label));
    if (!field) {
      inFeatures = false;
      return;
    }
    if (!value && field !== "features") return;
    consumed.add(i);
    const p: Provenance = { source: "label", raw: line, confidence: 0.95 };
    switch (field) {
      case "make": {
        const brand = canonicalBrand(value);
        if (!brand) warnings.push(`Marca no reconocida: "${value}"`);
        set("make", brand ?? titleCase(value), { ...p, confidence: brand ? 0.95 : 0.6 });
        break;
      }
      case "model":
        set("model", value, p);
        break;
      case "version":
        set("version", value, p);
        break;
      case "year": {
        const y = parseYear(value);
        if (y === null) warnings.push(`Año no válido: "${value}"`);
        set("year", y, p);
        break;
      }
      case "mileageKm": {
        const km = parseMileage(value);
        if (km === null) warnings.push(`Kilometraje no interpretable: "${value}"`);
        set("mileageKm", km, p);
        break;
      }
      case "priceClp": {
        const price = parsePrice(value);
        if (price === null) warnings.push(`Precio no interpretable: "${value}"`);
        set("priceClp", price, p);
        break;
      }
      case "engine":
        set("engine", value, p);
        set("fuelType", matchKeyword(value, FUEL_TABLE), { ...p, confidence: 0.8 });
        break;
      case "fuelType":
        set("fuelType", matchKeyword(value, FUEL_TABLE), p);
        break;
      case "transmission":
        set("transmission", matchKeyword(value, TRANSMISSION_TABLE), p);
        break;
      case "drivetrain":
        set("drivetrain", matchKeyword(value, DRIVETRAIN_TABLE), p);
        break;
      case "color":
        set("color", titleCase(value), p);
        break;
      case "features":
        inFeatures = true;
        value
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((f) => vehicle.features.push(f));
        break;
    }
  });

  // 2) Título (primera línea con contenido): "TOYOTA HILUX 2.4 SRV 4X4 2020".
  const titleIndex = lines.findIndex((l) => stripBullet(l).length > 0 && !stripBullet(l).startsWith("#"));
  const title = titleIndex >= 0 ? stripBullet(lines[titleIndex]) : "";
  const brand = title ? findBrand(title) : null;
  if (brand && brand.index <= 2) {
    const p: Provenance = { source: "title", raw: title, confidence: 0.8 };
    set("make", brand.canonical, p);
    if (vehicle.make === brand.canonical && !vehicle.model) {
      // Lo que sigue a la marca, hasta el año: primera palabra = modelo, resto = versión.
      const rest = title.slice(brand.index + brand.length).replace(/^[\s\-–:|]+/, "");
      const beforeYear = rest.split(/\b(?:19[5-9]\d|20\d{2})\b/)[0].replace(/[\s\-–|,.]+$/, "").trim();
      const tokens = beforeYear.split(/\s+/).filter(Boolean);
      if (tokens.length > 0 && /[\p{L}\d]/u.test(tokens[0])) {
        set("model", titleCase(tokens[0]), { ...p, confidence: 0.7 });
        if (tokens.length > 1) set("version", tokens.slice(1).join(" ").toUpperCase(), { ...p, confidence: 0.6 });
      }
    }
    set("year", parseYear(title), { ...p, confidence: 0.85 });
    if (titleIndex >= 0) consumed.add(titleIndex);
  }

  // 3) Patrones libres en todo el texto (solo si no vinieron por etiqueta).
  const body = lines.filter((l) => !l.startsWith("#")).join("\n");
  if (vehicle.priceClp === undefined) {
    const prices = [...body.matchAll(/\$\s?\d{1,3}(?:[.\s]\d{3}){1,3}(?!\d)/g)].map((m) => parsePrice(m[0])).filter((n): n is number => n !== null);
    const unique = [...new Set(prices)];
    if (unique.length === 1) set("priceClp", unique[0], { source: "pattern", raw: `$${unique[0]}`, confidence: 0.75 });
    else if (unique.length > 1) warnings.push(`Varios precios en el caption (${unique.length}); se omite el precio`);
  }
  if (vehicle.mileageKm === undefined) {
    const kms = [...body.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d{1,7})\s*(?:mil\s*)?(?:km|kms|kilometros|kilómetros)\b/gi)]
      .map((m) => parseMileage(m[0].replace(/\s*(km|kms|kil[oó]metros)$/i, "")))
      .filter((n): n is number => n !== null);
    const unique = [...new Set(kms)];
    if (unique.length === 1) set("mileageKm", unique[0], { source: "pattern", raw: `${unique[0]} km`, confidence: 0.75 });
    else if (unique.length > 1) warnings.push("Varios kilometrajes en el caption; se omite");
  }
  const kp: Provenance = { source: "pattern", raw: "palabras clave", confidence: 0.6 };
  if (vehicle.fuelType === undefined) set("fuelType", matchKeyword(body, FUEL_TABLE), kp);
  if (vehicle.transmission === undefined) set("transmission", matchKeyword(body, TRANSMISSION_TABLE), kp);
  if (vehicle.drivetrain === undefined) set("drivetrain", matchKeyword(body, DRIVETRAIN_TABLE), kp);

  // 4) Descripción: texto libre restante, sin hashtags ni líneas ya interpretadas.
  const free = lines
    .filter((l, i) => !consumed.has(i) && l && !/^#/.test(l) && !/^(@|https?:\/\/)/.test(l))
    .map((l) => l.replace(/(?:^|\s)#[\p{L}\d_]+/gu, "").trim())
    .filter(Boolean);
  if (free.length) vehicle.description = free.join("\n").slice(0, 4000);

  vehicle.features = [...new Set(vehicle.features.map((f) => f.slice(0, 80)))].slice(0, 40);
  return { vehicle, provenance, warnings };
}

// ─── Reglas de publicación ────────────────────────────────────────────

export const REQUIRED_FOR_PUBLISH = ["make", "model", "year", "priceClp"] as const;

const FIELD_LABELS: Record<(typeof REQUIRED_FOR_PUBLISH)[number], string> = {
  make: "marca",
  model: "modelo",
  year: "año",
  priceClp: "precio",
};

/** Motivos por los que no se publica automáticamente (vacío = publicable). */
export function publishBlockers(v: ParsedVehicle, imageCount: number): string[] {
  const missing = REQUIRED_FOR_PUBLISH.filter((f) => v[f] === undefined).map((f) => FIELD_LABELS[f]);
  const out = missing.length ? [`Faltan datos obligatorios: ${missing.join(", ")}`] : [];
  if (imageCount === 0) out.push("Sin imágenes almacenadas");
  return out;
}

/** Heurística: ¿la publicación parece un vehículo a la venta? (sin marca ni precio/año → no). */
export function looksLikeVehicle(r: ParseResult): boolean {
  const v = r.vehicle;
  return Boolean(v.make && (v.model || v.year || v.priceClp));
}
