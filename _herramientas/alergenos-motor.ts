// Motor de la herramienta /restaurantes/alergenos/: usa el MISMO detector de alérgenos, buscador
// de platos y lector de cartas que la app (repo nutriapp, frontend/src). Se empaqueta con
// _herramientas/alergenos-generar.mjs en assets/js/alergenos.js. Todo corre en el navegador.
import { findAllergenMatches } from "../../nutriapp/frontend/src/nutrition";
import { makeCatalogSearch, nameMatches, preferredName } from "../../nutriapp/frontend/src/catalogSearch";
import { planRestaurantDish, isFried } from "../../nutriapp/frontend/src/restaurantDish";
import { splitMenuItems, cleanDishName } from "../../nutriapp/frontend/src/menuScan";

// Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011, anexo II), en su orden.
export const EU = [
  { key: "gluten", label: "Gluten", icon: "🌾" },
  { key: "crustaceos", label: "Crustáceos", icon: "🦐" },
  { key: "huevo", label: "Huevo", icon: "🥚" },
  { key: "pescado", label: "Pescado", icon: "🐟" },
  { key: "cacahuete", label: "Cacahuetes", icon: "🥜" },
  { key: "soja", label: "Soja", icon: "🫛" },
  { key: "leche", label: "Leche", icon: "🥛" },
  { key: "frutos secos", label: "Frutos de cáscara", icon: "🌰" },
  { key: "apio", label: "Apio", icon: "🥬" },
  { key: "mostaza", label: "Mostaza", icon: "🟡" },
  { key: "sesamo", label: "Sésamo", icon: "⚪" },
  { key: "sulfitos", label: "Sulfitos", icon: "🍷" },
  { key: "altramuces", label: "Altramuces", icon: "🟠" },
  { key: "moluscos", label: "Moluscos", icon: "🦑" },
];
const APP_KEYS = ["gluten", "huevo", "pescado", "cacahuete", "soja", "leche", "frutos secos", "apio", "mostaza", "sesamo", "sulfitos", "altramuces", "marisco"];

export function fold(t: string): string {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
const words = (list: string[]) => new RegExp(`\\b(${list.join("|")})(s|es)?\\b`);
const CRUSTACEOS = words(["crustaceo", "gamba", "gambita", "langostino", "camaron", "cangrejo", "langosta", "bogavante", "cigala", "necora", "buey de mar", "centollo", "centolla", "carabinero", "quisquilla", "krill", "percebe", "jaiba", "cangrejo de rio", "surimi", "shrimp", "prawn", "crab", "lobster"]);
const MOLUSCOS = words(["molusco", "mejillon", "calamar", "calamare", "chipiron", "chopito", "puntilla", "pulpo", "pulpito", "pulpino", "sepia", "choco", "almeja", "chirla", "coquina", "tellina", "navaja", "ostra", "vieira", "zamburina", "berberecho", "bigaro", "caracol", "caracole", "cabrilla", "pota", "rabas", "choro", "ostion", "concha de abanico", "tinta de calamar", "squid", "mussel", "oyster", "clam", "octopus"]);
// En un bar, el vinagre de vino y los encurtidos con vinagre se declaran como sulfitos.
const SULFITOS_EXTRA = /\b(vinagre|vinagreta|escabeche|encurtid[oa]s?|pepinillos?|alcaparras?|banderillas?|gildas?|frutas? desecadas?|orejones|pasas)\b/;

export type Item = { name: string; n: string; q: string; in?: string; ag?: string[]; i: number; sv?: number };
let items: Item[] = [];
let search: (q: string, limit?: number) => Item[] = () => [];
export function load(raw: { n: string; q: string; in?: string; ag?: string[]; i: number; sv?: number }[]): number {
  items = raw.map((r) => ({ ...r, name: r.n }));
  search = makeCatalogSearch(items);
  return items.length;
}

const isDish = (o: Item) => o.i >= 900000;
const tools = {
  search: (q: string, limit: number) => search(q, limit),
  isDish,
  servingOf: (o: Item) => o.sv,
  matches: nameMatches,
  preferred: preferredName,
};

// Ingredientes propuestos para un plato escrito por el dueño. Si es un plato del catálogo, sus
// ingredientes; si no, se trocea ("Secreto con patatas y pimientos") y se busca cada parte.
// Nombres de bar que el catálogo no conoce por ese nombre.
const BAR_NAMES: [RegExp, string][] = [
  [/\brabas\b/, "calamares a la andaluza"],
  [/\bchocos?\b/, "sepia"],
  [/\bpuntillas\b/, "puntillitas"],
  [/\bpescaito\b/, "pescado frito"],
  [/\bmontaditos?\b/, "montadito"],
];
const COOKING_WORDS = /^(con|del|las|los|una|frit[oa]s?|complet[oa]s?|caser[oa]s?|plancha|brasa|parrilla|horno|asad[oa]s?|especial|abuela|casa|tradicional|nuestr[oa]s?|tipic[oa]s?|estilo|grande|pequen[oa]|racion|media|tapa|variad[oa]s?|mixt[oa]s?|vegan[oa]s?|vegetal(es)?)$/;
export function suggest(name: string): { ingredients: string; known: string | null; unknown: string[]; similar: string | null } {
  let said = cleanDishName(name);
  for (const [re, to] of BAR_NAMES) said = fold(said).replace(re, to);
  if (!said.trim() || !items.length) return { ingredients: "", known: null, unknown: [], similar: null };
  const plan = planRestaurantDish(said, tools).filter((p) => p.role !== "aceite");
  const out: string[] = [];
  const unknown: string[] = [];
  let known: string | null = null;
  let similar: string | null = null;
  for (const p of plan) {
    let o = p.options.find((x) => nameMatches(x.name, p.query));
    // No se conoce entero ("Hamburguesa completa"): un plato de la misma familia, para revisar.
    // Se quitan los ingredientes que dan nombre al plato parecido ("gambas" en "Revuelto de
    // gambas") y se añade lo escrito ("setas").
    if (!o && p.role === "principal") {
      const qw = fold(p.query).replace(/[^a-z0-9 ]/g, " ").split(" ").filter((w) => w.length > 2);
      const first = qw[0] || "";
      const stem = first.replace(/(es|s)$/, "");
      const family = first.length >= 4 ? search(first, 30).filter((x) => isDish(x) && x.in && fold(x.name).startsWith(stem) && (!/\b(vegetal|vegan[oa]|sin)\b/.test(fold(x.name)) || /\b(vegetal|vegan[oa]|sin)\b/.test(fold(p.query)))) : [];
      const score = (x: Item) => qw.filter((w) => fold(`${x.name} ${x.in}`).includes(w.replace(/(es|s)$/, ""))).length;
      const nw = (x: Item) => fold(x.name).replace(/\([^)]*\)/g, "").trim().split(/\s+/).length;
      family.sort((a, b) => score(b) - score(a) || nw(a) - nw(b) || (a.in || "").length - (b.in || "").length);
      const fam = family[0];
      if (fam) {
        similar = fam.name;
        const own = fold(fam.name).replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9 ]/g, " ").split(" ")
          .filter((w) => w.length > 3 && !fold(p.query).includes(w.replace(/(es|s)$/, "")) && !w.startsWith(stem));
        const kept = (fam.in || "").split(/,(?![^()]*\))/).map((x) => x.trim())
          .filter((x) => !own.some((w) => fold(x).includes(w.replace(/(es|s)$/, ""))));
        const extra = qw.slice(1).filter((w) => !COOKING_WORDS.test(w) && search(w, 5).some((x) => nameMatches(x.name, w)) && !fold(fam.in || "").includes(w.replace(/(es|s)$/, "")));
        out.push([...kept, ...(extra.length ? [extra.join(" ")] : [])].join(", "));
        continue;
      }
    }
    if (!o) {
      unknown.push(p.text);
      out.push(p.text);
      continue;
    }
    if (!known && isDish(o)) known = o.name;
    if (o.in) out.push(o.in);
    else {
      // Alimento sin lista de ingredientes: su nombre, y lo que dicen sus etiquetas de alérgenos
      // ("Flan de huevo" → leche, huevo).
      const base = o.name.replace(/\s*\([^)]*\)/g, "").trim();
      const tags = (o.ag || []).filter((a) => APP_KEYS.includes(a) && !detect(base).includes(a === "marisco" ? "moluscos" : a));
      out.push(tags.length ? `${base} (${tags.join(", ")})` : base);
    }
  }
  const seen = new Set<string>();
  const list = out
    .join(", ")
    .split(/,(?![^()]*\))/)
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(fold(s)) && seen.add(fold(s)));
  return { ingredients: list.join(", "), known: similar ? null : known, unknown, similar };
}

// Los alérgenos (claves de EU) que hay en el nombre del plato y sus ingredientes.
export function detect(text: string): string[] {
  const found = new Set(findAllergenMatches(text, APP_KEYS));
  const t = ` ${fold(text).replace(/[^a-z0-9]+/g, " ")} `;
  if (SULFITOS_EXTRA.test(t)) found.add("sulfitos");
  if (found.has("marisco")) {
    const c = CRUSTACEOS.test(t);
    const m = MOLUSCOS.test(t);
    if (c || !m) found.add("crustaceos");
    if (m || !c) found.add("moluscos");
    found.delete("marisco");
  }
  return EU.map((e) => e.key).filter((k) => found.has(k));
}

// ¿Va a la freidora? ¿A la plancha?
const NOT_FRIED = /\b(a la plancha|plancha|al horno|horno|asad[oa]s?|a la brasa|brasa|parrilla|al vapor|cocid[oa]s?|hervid[oa]s?|guisad[oa]s?|en salsa|al ajillo|a la gallega|crud[oa]s?)\b/;
const FRIED_DISH = /\b(fritos?|fritas?|frituras?|rebozad[oa]s?|empanad[oa]s?|empanadillas?|croquetas?|tempura|a la romana|a la andaluza|adobo|chopitos|puntillitas?|puntillas?|rabas|churros?|porras|bunuelos?|torrijas?|patatas? bravas|bravas|nuggets?|fingers?|tequenos?|san jacobos?|flamenquin(es)?|cachopos?|aros de cebolla|alitas|chicharrones|pescaito|tortitas?|crujientes?|calamares)\b/;
export function fried(name: string, ingredients: string): boolean {
  const n = fold(name);
  if (NOT_FRIED.test(n) && !/\bfrit/.test(n)) return false;
  return FRIED_DISH.test(n) || isFried(name) || /\b(patatas fritas|rebozad[oa]s?|frit[oa] en|frit[oa]s? en)\b/.test(fold(ingredients));
}
export function grilled(name: string): boolean {
  return /\b(plancha|parrilla|brasa|a la piedra)\b/.test(fold(name));
}

// Texto pegado de una carta → nombres de platos (sin precios, secciones ni direcciones).
export function splitCarta(text: string): { name: string; desc: string; section: string | null }[] {
  return splitMenuItems(text).map((l) => ({ name: l.text, desc: l.desc || "", section: l.section }));
}
