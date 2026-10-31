/**
 * Búsqueda "inteligente" del inventario: una sola caja de texto que entiende marca, modelo,
 * versión, tipo de vehículo (según la descripción), combustible, transmisión, tracción, año,
 * precio ("hasta 15 millones") y kilometraje ("menos de 80 mil km"), con sinónimos y
 * tolerancia a errores de tipeo. Código puro: lo usan el buscador del inicio (en el navegador)
 * y el catálogo (en el servidor), así ambos muestran lo mismo.
 */

export interface SearchDoc {
  /** Marca y modelo. */
  p: string;
  /** Versión. */
  s: string;
  /** Año, combustible, transmisión, tracción, color, motor (con sinónimos canónicos). */
  a: string;
  /** Tipo de vehículo deducido del inicio de la descripción. */
  b: string;
  /** Resto de palabras de la descripción. */
  t: string;
}

export interface SearchItem {
  slug: string;
  make: string;
  model: string;
  version: string | null;
  year: number | null;
  priceClp: number | null;
  mileageKm: number | null;
  fuelType: string | null;
  transmission: string | null;
  status: string;
  image: { src: string; alt: string } | null;
  doc: SearchDoc;
}

export interface ParsedQuery {
  tokens: string[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMax?: number;
}

/** Quita tildes, pasa a minúsculas y deja solo letras/números ("F-150" → "f150 f 150"). */
export function normalize(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const joined = base.replace(/([a-z0-9])[-/.]([a-z0-9])/g, "$1$2");
  const spaced = base.replace(/[^a-z0-9]+/g, " ");
  const words = new Set(`${joined.replace(/[^a-z0-9]+/g, " ")} ${spaced}`.split(" ").filter(Boolean));
  return [...words].join(" ");
}

const STOP = new Set(
  (
    "de del la las el los lo un una unos unas con sin para por que y o u en mi me se te tu su sus al a es " +
    "quiero busco buscas necesito auto autos vehiculo vehiculos carro carros precio ano anos " +
    "este esta estos estas muy mas tenemos tiene tienen ideal todo toda todos todas nuestro nuestra " +
    "autodealer serena hola"
  ).split(" "),
);

/** Grupos de sinónimos (normalizados). Una palabra del grupo encuentra a cualquiera de las otras. */
const SYNONYMS: string[][] = [
  ["camioneta", "pickup", "pick"],
  ["suv", "todoterreno", "crossover"],
  ["hatchback", "hatch"],
  ["sedan"],
  ["furgon", "van", "utilitario", "furgoneta"],
  ["automatica", "automatico", "at", "aut"],
  ["manual", "mecanica", "mecanico", "mt"],
  ["diesel", "petrolero", "petroleo"],
  ["bencina", "gasolina", "bencinero", "nafta"],
  ["hibrido", "hibrida"],
  ["electrico", "electrica"],
  ["4x4", "4wd", "traccion"],
  ["4x2", "2wd"],
];
const SYNONYM_OF = new Map<string, string[]>();
for (const group of SYNONYMS) for (const w of group) SYNONYM_OF.set(w, group);

/** Tipos que se buscan en la primera frase de la descripción ("¿Buscas una SUV…?"). */
const BODY_TYPES = ["camioneta", "pickup", "suv", "hatchback", "sedan", "furgon", "citycar", "coupe", "station"];
/** Palabras de tipo: solo se comparan con modelo, versión y tipo (no con todo el texto). */
const BODY_WORDS = new Set(["camioneta", "pickup", "pick", "suv", "todoterreno", "crossover", "hatchback", "hatch", "sedan", "furgon", "van", "utilitario", "furgoneta"]);
/** Modelos conocidos del mercado chileno por tipo, por si la descripción no lo menciona. */
const MODEL_BODY: Record<string, string> = Object.fromEntries([
  ...["hilux", "ranger", "f150", "np300", "navara", "frontier", "l200", "t60", "t90", "t8", "landtrek", "oroch", "amarok", "dmax", "bt50", "tacoma", "tundra", "colorado", "s10", "montana", "poer", "wingle", "kaiyi"].map((m) => [m, "camioneta"]),
  ...["tucson", "sportage", "rav4", "cx5", "cx30", "cx3", "cx9", "escape", "explorer", "zs", "hs", "g05", "lx", "txl", "creta", "kona", "santafe", "seltos", "sorento", "qashqai", "xtrail", "kicks", "duster", "captur", "koleos", "jolion", "h6", "tiggo", "outlander", "asx", "vitara", "jimny", "territory", "2008", "3008", "5008"].map((m) => [m, "suv"]),
]);

/** Formas a buscar: la palabra (y su singular) admite prefijo; los sinónimos cortos, solo palabra exacta. */
function variants(token: string): { alt: string; prefix: boolean }[] {
  const singular = token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token;
  const own = [...new Set([token, singular])];
  const syn = [...new Set([...(SYNONYM_OF.get(token) ?? []), ...(SYNONYM_OF.get(singular) ?? [])])].filter((w) => !own.includes(w));
  return [...own.map((alt) => ({ alt, prefix: alt.length >= 2 })), ...syn.map((alt) => ({ alt, prefix: alt.length >= 4 }))];
}

/** Arma el documento de búsqueda de un vehículo (en el servidor). */
export function buildSearchDoc(v: {
  make: string;
  model: string;
  version?: string | null;
  year?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  color?: string | null;
  engine?: string | null;
  description?: string | null;
}): SearchDoc {
  const desc = normalize(v.description ?? "").split(" ");
  // Primera frase ("¿Buscas una SUV espaciosa…?"): más adelante se usan términos sueltos
  // ("una de las camionetas familiares más vendidas") que confundirían el tipo.
  const firstSentence = (v.description ?? "").split(/[?.!\n]/).find((x) => x.trim()) ?? "";
  const lead = new Set(normalize(firstSentence.slice(0, 220)).split(" "));
  const body = BODY_TYPES.filter((b) => lead.has(b) || lead.has(`${b}s`) || (b === "pickup" && lead.has("pick")));
  for (const w of normalize(v.model).split(" ")) if (MODEL_BODY[w] && !body.includes(MODEL_BODY[w])) body.push(MODEL_BODY[w]);
  const keep = (w: string) => (w.length >= 3 || /\d/.test(w)) && !STOP.has(w);
  return {
    p: normalize(`${v.make} ${v.model}`),
    s: normalize(v.version ?? ""),
    a: normalize([v.year, v.fuelType, v.transmission, v.drivetrain, v.color, v.engine].filter(Boolean).join(" ")),
    b: body.join(" "),
    t: [...new Set(desc.filter(keep))].join(" "),
  };
}

const WORD_NUM = String.raw`(\d+(?:[.,]\d+)*)`;
const PRICE_RE = new RegExp(
  String.raw`(?:(hasta|menos de|bajo|max|maximo|tope|sobre|mas de|desde|min|minimo)\s+)?\$?\s?${WORD_NUM}\s?(millones|millon|mill|mm|m|palos|lucas)?(?=\s|$)`,
  "g",
);
const KM_RE = new RegExp(String.raw`(?:(hasta|menos de|bajo|max|maximo)\s+)?${WORD_NUM}\s?(mil)?\s?(?:km|kms|kilometros)(?=\s|$)`, "g");

function toNumber(raw: string): number {
  if (/^\d{1,3}(\.\d{3})+$/.test(raw)) return Number(raw.replace(/\./g, ""));
  return Number(raw.replace(",", "."));
}

const isMin = (w?: string) => w === "sobre" || w === "mas de" || w === "desde" || w === "min" || w === "minimo";

/** Separa del texto los rangos de precio, año y kilometraje; el resto son palabras. */
export function parseQuery(raw: string): ParsedQuery {
  let text = ` ${raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!,;:()]/g, " ")
    .replace(/\s+/g, " ")} `;
  const out: ParsedQuery = { tokens: [] };

  text = text.replace(KM_RE, (_m, dir: string | undefined, num: string, mil: string | undefined) => {
    out.kmMax = Math.round(toNumber(num) * (mil ? 1000 : 1));
    void dir;
    return " ";
  });

  text = text.replace(PRICE_RE, (m, dir: string | undefined, num: string, unit: string | undefined) => {
    const n = toNumber(num);
    let value: number | null = null;
    if (unit === "lucas") value = n * 1000;
    else if (unit) value = n * 1_000_000;
    else if (n >= 1_000_000) value = n;
    else if (dir && n > 0 && n < 200) value = n * 1_000_000; // "hasta 15" → 15 millones
    else if (dir && Number.isInteger(n) && n >= 1980 && n <= 2035) {
      if (isMin(dir)) out.yearMin = n;
      else out.yearMax = n;
      return " ";
    }
    if (value === null) return m; // número suelto: modelo ("208", "NP300") o año exacto
    if (isMin(dir)) out.priceMin = Math.round(value);
    else out.priceMax = Math.round(value);
    return " ";
  });

  out.tokens = [...new Set(normalize(text).split(" "))].filter((w) => w && !STOP.has(w) && (w.length > 1 || /\d/.test(w)));
  return out;
}

/** Una letra de más, de menos, cambiada o dos letras vecinas invertidas ("hyundia"). */
function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length === b.length) {
    const k = [...a].findIndex((ch, idx) => ch !== b[idx]);
    if (k >= 0 && a[k] === b[k + 1] && a[k + 1] === b[k] && a.slice(k + 2) === b.slice(k + 2)) return true;
  }
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

const WEIGHTS: [keyof SearchDoc, number][] = [
  ["p", 10],
  ["s", 6],
  ["b", 6],
  ["a", 5],
  ["t", 1],
];

/** Puntaje de una palabra en un documento (0 = no aparece). */
function tokenScore(doc: SearchDoc, token: string): number {
  const alts = variants(token);
  const numeric = /^\d+$/.test(token);
  const bodyWord = alts.some(({ alt }) => BODY_WORDS.has(alt));
  let best = 0;
  for (const [field, weight] of WEIGHTS) {
    if (!doc[field] || (bodyWord && (field === "a" || field === "t"))) continue;
    // Tipeo: en marca/modelo/versión desde 4 letras ("fors" → "ford"); en el resto, desde 5.
    const typoMin = field === "p" || field === "s" ? 4 : 5;
    for (const word of doc[field].split(" ")) {
      for (const { alt, prefix } of alts) {
        let s = 0;
        if (word === alt) s = weight * 1.2;
        else if (!numeric && prefix && word.startsWith(alt)) s = weight;
        else if (!numeric && prefix && alt.length >= typoMin && (editDistanceAtMostOne(alt, word) || editDistanceAtMostOne(alt, word.slice(0, alt.length))))
          s = weight * 0.5;
        if (s > best) best = s;
      }
    }
  }
  return best;
}

export function hasCriteria(q: ParsedQuery): boolean {
  return q.tokens.length > 0 || [q.priceMin, q.priceMax, q.yearMin, q.yearMax, q.kmMax].some((v) => v !== undefined);
}

/**
 * Vehículos que cumplen todas las palabras y rangos, del más al menos relevante.
 * El orden de entrada (más recientes primero) desempata.
 */
export function searchVehicles<T extends Pick<SearchItem, "doc" | "priceClp" | "year" | "mileageKm">>(items: T[], raw: string) {
  const query = parseQuery(raw);
  if (!hasCriteria(query)) return { query, results: [] as T[] };
  const scored: { item: T; score: number; i: number }[] = [];
  items.forEach((item, i) => {
    if (query.priceMax !== undefined && !(item.priceClp != null && item.priceClp <= query.priceMax)) return;
    if (query.priceMin !== undefined && !(item.priceClp != null && item.priceClp >= query.priceMin)) return;
    if (query.yearMin !== undefined && !(item.year != null && item.year >= query.yearMin)) return;
    if (query.yearMax !== undefined && !(item.year != null && item.year <= query.yearMax)) return;
    if (query.kmMax !== undefined && !(item.mileageKm != null && item.mileageKm <= query.kmMax)) return;
    let score = 1;
    for (const token of query.tokens) {
      const s = tokenScore(item.doc, token);
      if (!s) return;
      score += s;
    }
    scored.push({ item, score, i });
  });
  scored.sort((x, y) => y.score - x.score || x.i - y.i);
  return { query, results: scored.map((s) => s.item) };
}

const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

/** Rangos entendidos, para mostrarlos como etiquetas ("Hasta $15.000.000"). */
export function describeQuery(q: ParsedQuery): string[] {
  const out: string[] = [];
  if (q.priceMin !== undefined) out.push(`Desde ${clp.format(q.priceMin)}`);
  if (q.priceMax !== undefined) out.push(`Hasta ${clp.format(q.priceMax)}`);
  if (q.yearMin !== undefined) out.push(`Año ${q.yearMin} o más nuevo`);
  if (q.yearMax !== undefined) out.push(`Año ${q.yearMax} o anterior`);
  if (q.kmMax !== undefined) out.push(`Hasta ${q.kmMax.toLocaleString("es-CL")} km`);
  return out;
}
