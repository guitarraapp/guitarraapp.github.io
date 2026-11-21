# Editor PDF de partituras — Continuidad de desarrollo

## Cómo retomar en la próxima sesión

En la próxima sesión basta con adjuntar **`partituras-editor-v11.html` y este `CONTINUIDAD.md`**. No hace falta volver a explicar el historial previo: este documento recoge la arquitectura completa, los formatos de datos, las correcciones aplicadas, el estado actual y la hoja de ruta para la siguiente fase (**v12.0**). Al cerrar cada versión futura, actualiza el HTML, este `CONTINUIDAD.md` y la pestaña **Ayuda** dentro del modal de Ajustes.

---

## Objetivo y filosofía del producto

Editor y herramienta de estudio personal de partituras/tablaturas en PDF orientado a guitarra en **un único archivo `.html` autocontenido** (sin instalación ni servidor, ejecutable directamente en local mediante `file://`).
- El **PDF** es el origen (no exige MusicXML ni MIDI).
- El archivo **`.scoreproj`** conserva el PDF original (Base64), las anotaciones editables por página, los cortes de espacio añadido (`pageSpaceCuts`), los ajustes de la partitura (URL de bucles, parámetros de práctica) y la calibración de sistemas/compases junto con sus signos musicales.
- La **Biblioteca local (IndexedDB)** guarda las partituras en el navegador para abrirlas al instante sin buscar archivos cada vez, manteniendo `.scoreproj` para portabilidad entre equipos.
- El **PDF exportado** conserva vectores nítidos en modo híbrido cuando es posible (recurso automático a PNG solo en páginas con cortes o bloques), e incrusta enlaces clicables reales en las etiquetas de bucle cuando hay URL configurada.

---

## Estado actual: v11.0

Archivo principal: `partituras-editor-v11.html` (y envoltorio Vite PWA para instalación en Android/Chrome).

### Correcciones y mejoras aplicadas en v11.0

1. **Cursor verde en el último pulso del bucle (`advanceBeatTick`):**
   - Corregido el bug por el que en el último pulso del último compás del bucle (`beatIdx === beats - 1`), el redibujo de vuelta a `cursor = 0` se ejecutaba síncronamente al instante y ocultaba el último tiempo en verde.
   - Ahora los cambios de página, la parada por fin/Fine (`finishStopPending`) y la transición visual al primer compás de la siguiente vuelta se difieren al inicio del siguiente tick del metrónomo, respetando todo el tiempo del último pulso en pantalla.

2. **Limpieza total del compás marcado al apagar `🔁 Bucle` o pulsar `⏹ Reiniciar`:**
   - Al desactivar `toggleStudyLoop()` se limpian `anchorSysId = null` y `anchorMeasureIdx = 0` para que ningún compás quede marcado en naranja/verde.
   - Al pulsar **⏹ Reiniciar** (`resetPracticePlayback()`), tanto en la barra de práctica como en el HUD de pantalla completa, se limpia el ancla, se detiene la reproducción, se vuelve a la **página 1** y se desplaza la vista al inicio del documento.

3. **Apertura de partituras siempre en la página 1:**
   - Corregido `loadProjectObject()` (y el lector de PDF nuevo) para fijar siempre `state.page = 1` y ejecutar `window.scrollTo(0, 0)` al abrir un PDF, un `.scoreproj` o una partitura de la Biblioteca local, evitando arrancar en páginas intermedias como la página 2.

4. **Interfaz adaptativa para móvil y Android (sin alterar la vista de PC):**
   - Añadida barra rápida fija en pantallas estrechas (`<= 860px`, `#mobileQuickBar`) con acceso directo a **☰ Menú** (cajón desplegable `#menusHost` con el resto de controles), cambio rápido de página (`‹ 1/3 ›`), botón **Practicar / Editar**, y en *Modo Practicar* botones táctiles **▶ / ⏸**, **🔁 Bucle** y **⛶ Pantalla completa** (o **↶ Deshacer** en edición).
   - Reglas inteligentes de `touch-action` para permitir desplazamiento y pellizco natural con un dedo en la partitura cuando se estudia o con *Seleccionar* sobre el fondo blanco, reservando `touch-action: none` exclusivamente al trazar dibujos o arrastrar elementos.

5. **PWA instalable y operativa offline en Android / Chrome (sobre Vite + `vite-plugin-pwa`):**
   - Configurado Manifiesto Web (`id: '/'`, `short_name: 'Partituras'`, `display: 'standalone'`, iconos PNG `192x192`, `512x512` `any`, `512x512` `maskable` y `180x180` `apple-touch-icon.png`), Service Worker con Workbox que precachea el shell + `partituras-editor-v11.html` y cachea en `CacheFirst` las librerías `pdf.js` (`pdf.min.js`, `pdf.worker.min.js`) y `pdf-lib` desde `cdnjs.cloudflare.com`.
   - Botón in-app de instalación (`PWAInstallButton`) e indicador de estado sin conexión (`OfflineIndicator`) en la barra superior de la aplicación web. El archivo `partituras-editor-v11.html` continúa siendo 100% autocontenido para abrirse localmente con `file://` en PC.

### Resumen de mejoras de v10.0 mantenidas

1. **Zoom centrado al ampliar o reducir (`−` / `+`):**
   - Corregido `transform-origin` en `#stage` (`top left` en lugar de `top center`) dentro de `#stageFrame` (`margin: 18px auto 48px` con dimensiones exactas escaladas por `state.viewZoom`), evitando que el documento quede desplazado hacia la derecha al hacer zoom inferior al 100%.

2. **Bucle de estudio de 1 o varios compases (`Bucle estudio`) + Tempo en vivo / progresivo:**
   - Nuevo botón **🔁 Bucle: Sí/No** (`#practiceLoopBtn` en la barra de práctica y `#fsLoopBtn` en el HUD de pantalla completa), selector de **Comp.** (`#practiceLoopCount`, de `1` a `32`, por defecto `1`) y selector opcional **+BPM** (`#practiceProgBpm`: `+0`, `+2`, `+4`, `+6`) para subir automáticamente el tempo al completar cada vuelta del ciclo (tope `240` BPM).
   - Al llegar al final del ciclo elegido, el cursor vuelve al primer compás seleccionado sin repetir la cuenta atrás (mantiene el pulso), cruzando automáticamente de sistema o de página si el bucle abarca varios sistemas o cambia de página.
   - El campo **BPM** sigue editable en tiempo real durante la reproducción (`restartPracticeTimerIfRunning()`).

3. **Selección y arranque directo desde cualquier compás (`startFromMeasure`):**
   - En *Modo Practicar* (cuando no se está calibrando), todos los compases calibrados tienen zona clicable con indicador visual (`▶ c.X` o `🔁 c.X–Y`).
   - Hacer clic sobre un compás fija el ancla de inicio/bucle (`anchorSysId`, `anchorMeasureIdx`); si ya está sonando, salta o reconstruye el bucle en caliente sin detener el metrónomo.
   - Si una etiqueta de bucle externa (`L23`) con URL configurada coincide sobre el área de un compás, el clic sobre la etiqueta prioriza abrir la URL externa configurada.

4. **Detección asistida de sistemas desde la imagen PDF (`Detectar sistemas`):**
   - Nueva función `detectStaffSystemsOnCurrentPage()` que analiza localmente el canvas PDF (`bgCanvas`) mediante proyección horizontal de filas de tinta (detectando líneas de pentagrama/tablatura y uniendo pares bimodales partitura+tablatura cuando corresponda, con respaldo por densidad de tinta).
   - El botón **Detectar sistemas** (`#autoDetectSystemsBtn`) propone al instante las cajas calibradas de la página actual y abre *Calibrar sistemas* para revisar o ajustar compases y signos (con confirmación inline de 2 clics si ya existían cajas en esa página).

5. **Anotaciones rápidas de técnica guitarrística (`Técnica ▾`):**
   - Selector `#techSymbolSelect` en el grupo *Insertar* con símbolos listos para colocar con un clic: `H`, `P`, `sl.`, `~~~`, `Arm. ◇`, `↓`, `↑`, `C.II`, `C.V`, `Intro`, `Estribillo`, `Solo`. Se insertan como nodos `<text>` editables, redimensionables y exportables en PDF vectorial.

---

## Arquitectura y formatos de datos (referencia técnica)

### Modelo de acorde (`CHORD_LIBRARY` y `data-chord-model`)
```json
{
  "nombre": "Am7",
  "traste": 1,
  "frets": 5,
  "pos": [[-1], [0], [2], [0], [1], [0]],
  "hollowPos": [[], [0], [], [], [], []],
  "cejillas": [{ "traste": 1, "desde": 1, "hasta": 6 }]
}
```
Dimensiones vectoriales (`ED`): `W = 102`, `left = 21`, `right = 91`, `top = 25`, `strings = 6`, `fGap = 16`, `sGap = 14`.

### Formato `.scoreproj` (v5, retrocompatible con v1–v4)
```json
{
  "format": "partituras-editor-project",
  "version": 5,
  "sourcePdfName": "cancion.pdf",
  "sourcePdfBase64": "...",
  "page": 1,
  "scale": 3,
  "settings": {
    "loopTargetUrl": "https://mi-app-bucles.com/cancion",
    "practice": {
      "timeSig": "4/4",
      "bpm": 90,
      "countInBars": 2,
      "metronome": true,
      "viewMode": "full",
      "advanceMode": "auto",
      "pedalKey": "arrows_pagedown",
      "loopCount": 1,
      "progBpmStep": 0
    }
  },
  "practicePages": {
    "1": {
      "manualOrder": false,
      "systems": [
        {
          "id": "sys-...",
          "x": 80, "y": 140, "w": 1500, "h": 180,
          "measures": 4,
          "repeatCount": 2,
          "measureMarks": {
            "0": { "repeatStart": true, "segno": true },
            "2": { "volta": 1, "repeatEnd": true, "repeatCount": 2 },
            "3": { "volta": 2, "toCoda": true }
          }
        }
      ]
    }
  },
  "pageSpaceCuts": {
    "1": [{ "id": "cut-...", "y": 420, "delta": 90 }]
  },
  "pages": {
    "1": "<rect class=\"block-hole\" ... /><g class=\"chord-diagram\" ...>...</g>"
  }
}
```

### Dependencias externas (CDN)
- `pdf.js` `3.11.174`
- `pdf-lib` `1.17.1`

---

## Validación y pruebas

- **v11.0:**
  - Sintaxis JS completa verificada con Node (`vm.Script`, 0 errores en 5.066 líneas inline).
  - Batería automatizada de **5 bloques de prueba** en Node (preservación del último pulso verde antes de volver al compás inicial del bucle, visibilidad del último pulso antes de fin/Fine, limpieza de ancla y retorno a pág. 1 al apagar bucle o pulsar Reiniciar, apertura en pág. 1 aunque el `.scoreproj` guardase `page: 2`, y regresión de repeticiones `1./2.`, `D.C.`, `D.S.`, `Segno`, `Coda` y `Fine`).
  - Compilación TypeScript + Vite PWA (`tsc --noEmit` + `vite build`) y ESLint verificados al cerrar la versión.
- **v10.0:**
  - Sintaxis JS completa verificada con Node (`vm.Script`, 0 errores en 4.962 líneas inline).
  - Batería automatizada de **17 pruebas unitarias** en Node -> **17/17 OK**.

---

## Hoja de ruta: próxima fase (v12.0)

### Fase v12.0 — Estudio inteligente y afinación sobre móvil/escritorio
1. **Aceleración progresiva con metas y contador de vueltas:** mostrar objetivo de BPM (ej. `90 → 120 BPM`) y detener o mantener al llegar a la meta elegida durante el bucle.
2. **Afinador cromático por micrófono (Web Audio FFT) / diapasón de referencia:** referencia rápida de cuerdas `E A D G B E` o detección de altura opcional integrada en *Modo Practicar*.
3. **Compartir / exportar lote de Biblioteca:** exportar e importar en bloque varias partituras favoritas desde la Biblioteca local en un solo `.zip`/JSON para copias de seguridad rápidas entre PC y Android.

---

## Registro de bugs e ideas

| Versión / Fecha | Idea o bug | Estado |
|---|---|---|
| v2 · 2026-11-20 | Bloque dejaba el original intacto | Resuelto (`block-hole` + `block-rect`) |
| v5 · 2026-11-20 | Doble clic y caja de selección inestables con zoom | Resuelto con matrices SVG (`getScreenCTM`) y botón Editar |
| v5 · 2026-11-20 | Puntos huecos para tónica/octavas en acordes | Resuelto (`hollowPos`) |
| v6 · 2026-11-20 | Bug cejilla, `?` sin nombre, trastes hasta 15, Ajustes y Bucles web/PDF | Resuelto en v6.0 |
| v7 · 2026-11-20 | Acorde oculto bajo hueco/bloque desplazado con *Cortar y mover* | Resuelto (`ensureOverlayLayers`) |
| v7 · 2026-11-20 | Acorde nuevo se insertaba en sitio fijo en vez de donde se hace clic | Resuelto (`pendingCustomChord`) |
| v7 · 2026-11-20 | Modo Practicar, metrónomo Web Audio, calibración, repeticiones, tramos y pedal | Implementado en v7.0 |
| v8 · 2026-11-20 | Herencia nº compases al calibrar, cuenta atrás 2 compases, signos completos (`1./2./3.`, `D.C.`, `D.S.`, `Segno`, `Coda`, `Fine`) y Pantalla completa | Implementado en v8.0 |
| v9 · 2026-11-20 | Bug cambio traste inicial en acordes + nº traste pequeño | Resuelto en v9.0 (traslación delta + fuente 14 negrita) |
| v9 · 2026-11-20 | Cajas de compases reproducían desordenadas, numeración reiniciaba por pág. y input compases se reseteaba | Resuelto en v9.0 (orden 2D + numeración global continua + `Orden pág.`) |
| v9 · 2026-11-20 | Casillas `1./2.` y avance automático / paso de página fallaban en reproducción | Resuelto en v9.0 (`buildPracticePlaybackPlan` + scroll/cambio pág. serializado) |
| v9 · 2026-11-20 | Biblioteca local IndexedDB, herramienta *Añadir espacio* y exportación PDF vectorial híbrida | Implementado en v9.0 |
| v10 · 2026-11-20 | Al reducir zoom (`−`/`+`) el documento se quedaba pegado a la derecha | Resuelto en v10.0 (`transform-origin: top left` en `#stage`) |
| v10 · 2026-11-20 | Bucle de estudio (1 o N compases desde clic) + tempo en vivo/+BPM progresivo, detección asistida de sistemas y símbolos rápidos de técnica | Implementado en v10.0 |
| v11 · 2026-11-20 | Cursor último pulso del bucle, limpieza de ancla en Bucle/Reiniciar, apertura siempre en pág. 1, UI móvil/Android adaptativa + PWA instalable offline | Implementado en v11.0 |
| v12 · Pendiente | Meta de BPM en bucle progresivo, diapasón/afinador rápido y respaldo en lote de Biblioteca | Planificado para v12.0 |
