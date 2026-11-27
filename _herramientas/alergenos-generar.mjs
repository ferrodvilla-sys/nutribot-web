// Genera la herramienta /restaurantes/alergenos/ a partir del código de la app (repo nutriapp):
//  - assets/js/alergenos-motor.js: detector de alérgenos, buscador de platos y lector de cartas.
//  - assets/data/alergenos-platos.json: platos y alimentos del catálogo (nombre, ingredientes).
// Uso (con los dos repos uno al lado del otro): node _herramientas/alergenos-generar.mjs
import fs from "fs";
import { execFileSync } from "child_process";
const web = new URL("..", import.meta.url).pathname;
const app = process.argv[2] || `${web}../nutriapp/frontend/src`;
execFileSync("npx", ["--yes", "esbuild@0.28.2", `${web}_herramientas/alergenos-motor.ts`, "--bundle", "--minify",
  "--format=iife", "--global-name=Alergenos", "--target=es2019", `--outfile=${web}assets/js/alergenos-motor.js`], { stdio: "inherit" });
const raw = JSON.parse(fs.readFileSync(`${app}/data/foods.json`, "utf8"));
// Solo lo que hace falta: sin bebidas alcohólicas sueltas ni nutrientes.
const keep = raw.map((r) => {
  const o = { i: r.i, n: r.n, q: r.q };
  if (r.in) o.in = r.in;
  if (r.ag && r.ag.length) o.ag = r.ag.filter((a) => !["fodmap", "lactosa", "histamina"].includes(a));
  if (o.ag && !o.ag.length) delete o.ag;
  if (r.sv) o.sv = r.sv;
  return o;
});
fs.mkdirSync(`${web}assets/data`, { recursive: true });
fs.writeFileSync(`${web}assets/data/alergenos-platos.json`, JSON.stringify(keep));
console.log(keep.length, "alimentos;", keep.filter((x) => x.i >= 900000).length, "platos");
