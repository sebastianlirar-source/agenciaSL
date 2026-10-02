# Landing · Ítalo Luque, Personal Trainer

Sitio estático (HTML + Tailwind vía CDN + JS vanilla). Sin build.

- `index.html` — página completa
- `main.js` — links de WhatsApp, menú móvil, FAQ, animaciones
- `img/` — imágenes (hoy son placeholders con el tamaño correcto)

## Probar en local
    npx serve .        # o: python3 -m http.server 8080

## Antes de publicar
1. Reemplazar `https://italoluque.vercel.app` por el dominio final (index.html, robots.txt, sitemap.xml).
2. Reemplazar las fotos de `img/` (mismos nombres y proporciones).
3. Completar los testimonios, las respuestas de las FAQ, la bio y el link de Facebook (buscar `[` y `TODO`).

## Publicar en Vercel
Importar el repo en vercel.com → New Project → **Root Directory: `italo-luque`** → Framework: Other → Deploy.
