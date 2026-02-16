# PWA Icons - Instrucciones

Los iconos PWA no pudieron generarse automáticamente. Por favor, crea los siguientes archivos:

## Iconos Requeridos

1. **icon-192.png** (192x192 px)
2. **icon-512.png** (512x512 px)
3. **favicon.ico** (32x32 px)

## Diseño Sugerido

- Fondo: Gradiente morado (#8b5cf6 a #6d28d9)
- Símbolo: Estrellas/destellos blancos (✨) representando lo esotérico
- Estilo: Flat design, moderno, minimalista

## Herramientas para Crear Iconos

### Opción 1: Usar un generador online
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

### Opción 2: Crear manualmente
1. Diseña un icono cuadrado de 512x512 px en Figma/Photoshop/Canva
2. Exporta como PNG
3. Redimensiona a 192x192 px para el segundo icono
4. Convierte a .ico para el favicon

### Opción 3: Usar placeholders temporales
Puedes usar este SVG como placeholder:

\`\`\`svg
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6d28d9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)"/>
  <text x="256" y="300" font-size="200" text-anchor="middle" fill="white">✨</text>
</svg>
\`\`\`

Guarda este SVG y conviértelo a PNG usando:
- https://cloudconvert.com/svg-to-png
- O cualquier editor de imágenes

## Ubicación de los Archivos

Coloca los iconos en:
- `public/icon-192.png`
- `public/icon-512.png`
- `public/favicon.ico`

Una vez creados, la PWA estará completamente funcional.
