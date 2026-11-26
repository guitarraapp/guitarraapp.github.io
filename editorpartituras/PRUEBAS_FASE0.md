# Partituras 11.0 · Fase 0 (cimientos) — Cómo instalarla y probarla

## 1. Instalación
1. Descomprime el zip. Dentro está la carpeta de la app (index.html, sw.js, manifest, css/, js/, vendor/, icons/).
2. Súbela **entera** a tu GitHub Pages en una carpeta nueva, por ejemplo `guitarraapp.github.io/partituras-nueva/`.
   No toques la carpeta donde tienes la v10: así puedes comparar las dos.
3. Ábrela en Chrome. En la barra de direcciones aparecerá el icono de **Instalar** (opcional, pero ayuda a que el navegador no borre los datos).
4. Al publicar una versión nueva, la app mostrará abajo «Hay una versión nueva → Actualizar».

> No funciona abriendo el index.html con doble clic desde el disco (los módulos JS necesitan servidor). Desde GitHub Pages va bien.

**Datos:** se guardan en este navegador (IndexedDB `pt_partituras_db`). No usa localStorage ni nada de la v10, así que no se pisan. Cuando más adelante la pases a `/partituras`, los datos seguirán ahí porque es el mismo dominio.

**Librerías:** pdf.js 6.2 y pdf-lib 1.17 van **dentro** de `vendor/`; la app no carga nada de internet. Además lleva una política de seguridad (CSP) que solo permite código de la propia carpeta. Así no se pone en riesgo el futuro puente de Drive.

## 2. Pruebas recomendadas (unos 15 minutos)

### Biblioteca
- [ ] Pulsa **Importar PDF** y elige uno o varios PDF (también puedes arrastrarlos sobre la biblioteca). Si importas uno solo, se abre directamente.
- [ ] Vuelve con **← Biblioteca**: verás la miniatura, el número de páginas y la fecha.
- [ ] En el menú **⋯**: cambia título y etiquetas, duplica, exporta PDF, exporta la pieza (.ptbak) y elimina una copia.
- [ ] Prueba el **buscador** y **★ favoritas**.
- [ ] **Nueva en blanco**: crea una hoja A4 vacía (para apuntes como tu página de CAGED).

### Editor
- [ ] Zoom con **− / +**, **Ajustar** y **Ctrl + rueda**. Comprueba que la partitura se ve **nítida** a cualquier zoom y que las anotaciones **no se mueven** (era el fallo de la v10).
- [ ] **T Texto**: toca la página y escribe. Enter guarda, Esc cancela. Doble clic sobre un texto para cambiarlo.
- [ ] **╱ Línea** (Mayús = recta) y **▭ Tapar** (para tapar errores del PDF).
- [ ] **Acordes ▾** → elige uno → toca la página. Usa el buscador del panel.
- [ ] **Nuevo acorde**: prueba el nombre, el texto de **«Debajo»** (p. ej. `[E]-[C]`), el traste inicial, el número de trastes, los puntos negros y huecos, O/X y las cejillas. «Guardar en biblioteca» lo guarda y te deja colocarlo.
- [ ] Doble clic sobre un acorde colocado → edítalo → «Aplicar cambios».
- [ ] **Dedo 1-4**, **Bucle** (escribe 23 → L23) y **Técnica ▾**.
- [ ] Selecciona algo: muévelo arrastrando, cámbiale el tamaño con el **círculo de la esquina**, usa las flechas (1 pt; con Mayús 5 pt) y prueba **Duplicar**, **Al frente / Al fondo** y **Eliminar**.
- [ ] Con algo seleccionado, cambia **Texto / Grosor / Color**: se aplica a ese elemento.
- [ ] **Ctrl+Z / Ctrl+Y**: deshacer y rehacer (ahora funcionan en toda la pieza, no por página).
- [ ] Arriba debe poner **«Guardado ✓»** sin que pulses nada. Cierra la pestaña, vuelve a abrir la app y comprueba que está todo.
- [ ] **Vídeo**: pon la dirección del vídeo de la pieza. En una etiqueta de bucle (doble clic) puedes poner otro vídeo solo para ella.
- [ ] **🔓 Editando → 🔒 Solo ver**: ya no se puede editar y, al tocar una etiqueta L.., se abre su vídeo. En modo edición, Ctrl+clic sobre la etiqueta también lo abre.
- [ ] **+ Hoja**: añade una A4 en blanco al final (se puede deshacer).
- [ ] **Exportar PDF**: debe salir **vectorial** (nítido y ligero) con las etiquetas de bucle clicables. Si usas símbolos como ↓ ↑ ◇, ese elemento concreto va como imagen; te lo dice el aviso.

### Más
- [ ] **Copias → Descargar copia completa (.ptbak)**. Los PDF van dentro en binario, sin el 33 % extra de antes.
- [ ] **Restaurar**: elige el .ptbak. Antes de restaurar se descarga sola una **copia previa**. Restaurar no borra nada: añade piezas o actualiza las que tengan el mismo identificador.
- [ ] **Ajustes**: los días y los cambios para el aviso de copia, y los tamaños iniciales.
- [ ] Al entrar con cambios sin copiar aparece el aviso amarillo **«Hacer copia ahora / Más tarde»**.
- [ ] **Ideas de mejora**: añadir (admite varias líneas), editar, marcar como implementada y borrar.
- [ ] **Sin conexión**: con la app abierta una vez, desconecta la wifi y recarga. Debe seguir funcionando.

## 3. Qué todavía NO hace (a propósito)
- Selección múltiple, copiar/pegar, recortes de la partitura original y guías → **fase 1**.
- Organizador de páginas (borrar, reordenar, mover) y separar recopilaciones → **fase 2**.
- Plantillas de pautas, fila de acordes escribiendo «SIm FA# LA MI» y ayuda del mástil → **fase 3**.
- Modo práctica con cursor, metrónomo y enlace a la app de bucles con el número de loop → **fase 4** (mientras tanto, sigue usando la v10 para practicar).
- Copia cifrada a Drive (carpeta `partituras`, prefijo `pt`, cabecera `PTENC1`) → **fase 5**.

## 4. Estructura (para mantenerla)
| Archivo | Qué hace |
|---|---|
| `js/app.js` | Arranque, biblioteca, página «Más», service worker |
| `js/editor.js` | Vista de páginas, herramientas, selección, historial, guardado automático |
| `js/objects.js` | Dibujo y geometría de textos, líneas, rectángulos, acordes, dedos y bucles |
| `js/chords.js` | Biblioteca y editor de acordes |
| `js/model.js` | Modelo de datos (piezas → páginas → objetos, en puntos) e importación |
| `js/exportpdf.js` | Exportación a PDF vectorial |
| `js/backup.js` | Copias .ptbak, restauración y aviso de copia |
| `js/db.js` | IndexedDB y ajustes |
| `js/pdfjs.js` | pdf.js local |
| `js/ideas.js`, `js/help.js` | Ideas de mejora y ayuda |
| `sw.js` | Funcionamiento sin conexión. Solo borra sus propias cachés (`partituras-app-<carpeta>-`) |
