# Web de nutribot.eu

Web estática hecha con **Jekyll**, que GitHub Pages compila solo. No hay que instalar nada para publicar.

## 1. Publicar en GitHub Pages

1. Crea un repositorio público en GitHub (por ejemplo `nutribot-web`).
2. Sube todos estos archivos a la raíz del repositorio (botón *Add file → Upload files* sirve).
3. En el repositorio: **Settings → Pages → Build and deployment**
   - *Source*: **Deploy from a branch**
   - *Branch*: `main` y carpeta `/ (root)` → **Save**.
4. En unos minutos estará en `https://TU-USUARIO.github.io/nutribot-web/`.

## 2. Conectar el dominio nutribot.eu

El archivo `CNAME` ya contiene `nutribot.eu`.

En el panel DNS de tu proveedor del dominio (donde lo compraste):

| Tipo  | Nombre / Host | Valor                 |
|-------|---------------|-----------------------|
| A     | @             | 185.199.108.153       |
| A     | @             | 185.199.109.153       |
| A     | @             | 185.199.110.153       |
| A     | @             | 185.199.111.153       |
| AAAA  | @             | 2606:50c0:8000::153   |
| AAAA  | @             | 2606:50c0:8001::153   |
| AAAA  | @             | 2606:50c0:8002::153   |
| AAAA  | @             | 2606:50c0:8003::153   |
| CNAME | www           | TU-USUARIO.github.io  |

**No borres** los registros TXT, MX ni los CNAME de Resend (DKIM/SPF/DMARC): son los del correo. Solo añade estos y quita los A/AAAA antiguos de `@` si los había.

Después, en **Settings → Pages → Custom domain** escribe `nutribot.eu`, guarda y, cuando el DNS propague (de minutos a unas horas), marca **Enforce HTTPS**.

Recomendado: en **Settings (de tu perfil) → Pages → Add a domain** verifica `nutribot.eu` para que nadie más pueda usarlo en GitHub.

## 3. Escribir un artículo nuevo

1. Entra en la carpeta `_posts/` en GitHub y pulsa *Add file → Create new file*.
2. Nombre: `AAAA-MM-DD-titulo-con-guiones.md`, por ejemplo `2026-11-02-como-leer-una-etiqueta.md`.
3. Contenido:

```markdown
---
title: "Cómo leer una etiqueta en 30 segundos"
description: "Una frase que resuma el artículo (sale en Google y en la portada)."
tema: Etiquetas          # Etiquetas, Alergias, FODMAP o Hábitos (se cambian en _config.yml)
destacado: true          # opcional: aparece en "Empieza aquí" del blog
keywords: [cómo leer etiquetas, alérgenos etiqueta]   # opcional: búsquedas que quieres captar
---

Tu texto aquí. **Negrita**, *cursiva*, [enlaces](https://ejemplo.com).

## Un subtítulo

- Listas
- Así

![Texto alternativo](/assets/img/mi-imagen.jpg)
```

4. *Commit changes*. En un par de minutos aparece en `/blog/` y en la portada (los 3 últimos).

## 4. Añadir enlaces

Edita `enlaces.md` y añade una línea `- [Texto](https://dirección)`.

## 5. Capturas de la app

Sube a `assets/img/` estas imágenes (PNG, mejor en vertical) y aparecerán solas en la portada (mientras no estén, ese hueco no se muestra):
`pista.jpg`, `prueba-guiada.jpg`, `resumen.jpg`, `informes.jpg`, `alertas.jpg`, `comparador.jpg`, `ficha.jpg` (y `calendario.jpg` en la cabecera; `patrones.jpg` se usa en la página /fodmap).

## Opiniones de usuarios

Edita `_data/opiniones.yml` (dentro del archivo hay un ejemplo). Mientras esté vacío, el apartado "Opiniones" no sale en la portada. Pon solo opiniones reales y con permiso de quien las escribe.

## SEO

- El título y la descripción de cada artículo son lo que más cuenta para Google: escribe el título como lo buscaría la gente ("qué significa puede contener trazas").
- Da de alta la web en [Google Search Console](https://search.google.com/search-console) (verificación por DNS: añades un registro TXT en Namecheap) y envía `https://nutribot.eu/sitemap.xml`.

## 6. Ajustes generales

En `_config.yml`: enlace de Google Play, precio, días de prueba, email de contacto.

## Pendiente antes de publicar

- Revisar el artículo de ejemplo de `_posts/`.

## Verla en tu ordenador (opcional)

Con Ruby instalado: `bundle install` y `bundle exec jekyll serve`, y abre http://localhost:4000.
