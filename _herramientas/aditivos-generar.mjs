// Genera _data/aditivos.json (la página /aditivos/) con la MISMA lista de aditivos que usa
// la app al escanear (frontend/src/nutrition.ts del repo nutriapp). Así la web y la app dicen lo mismo.
// Uso: node _herramientas/aditivos-generar.mjs ../nutriapp/frontend/src/nutrition.ts
import fs from "fs";
const src = fs.readFileSync(process.argv[2] || "../nutriapp/frontend/src/nutrition.ts", "utf8");
const sulfite = src.match(/const SULFITE_TEXT = "([^"]+)"/)[1];
const block = (name) => {
  const i = src.indexOf(`const ${name}: Record<string, AdditiveInfo> = {`);
  return src.slice(i, src.indexOf("\n};", i));
};
const polyols = new Set([...src.matchAll(/\{ code: "(E\d+)", name: "[a-z]+"/g)].map((m) => m[1]));
const groups = [
  [100, "Colorante"], [200, "Conservador"], [300, "Antioxidante o regulador de acidez"],
  [400, "Espesante, gelificante o emulgente"], [500, "Regulador de acidez o antiaglomerante"],
  [600, "Potenciador del sabor"], [900, "Edulcorante, glaseante o gas"], [1000, "Otros"],
];
const group = (n) => groups.filter(([min]) => n >= min).pop()[1];
const seen = new Set();
const list = [];
for (const b of [block("ADDITIVE_INFO"), block("ADDITIVE_INFO_V50")]) {
  for (const m of b.matchAll(/^\s*(E\d+[A-Z]*):\s*\{\s*text:\s*(?:"((?:[^"\\]|\\.)*)"|SULFITE_TEXT),\s*warn:\s*(true|false)/gm)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    const text = m[2] ?? sulfite;
    const [name, ...rest] = text.split(";");
    const num = parseInt(m[1].slice(1), 10);
    const tone = m[3] === "true" ? "vigilar" : polyols.has(m[1]) ? "gases" : "normal";
    list.push({ code: m[1], num, name: name.trim(), note: rest.join(";").trim(), tone, group: group(num) });
  }
}
const sub = (c) => c.match(/[A-Z]*$/)[0];
list.sort((a, b) => a.num - b.num || sub(a.code).localeCompare(sub(b.code)));
fs.writeFileSync(new URL("../_data/aditivos.json", import.meta.url), JSON.stringify(list, null, 1) + "\n");
console.log(list.length, "aditivos;", list.filter((x) => x.tone === "vigilar").length, "a vigilar;", list.filter((x) => x.tone === "gases").length, "gases");
