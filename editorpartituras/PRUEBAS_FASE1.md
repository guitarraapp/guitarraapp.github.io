# Partituras 11.1 · Fase 1 (edición sin fricción) — Qué hay nuevo y cómo probarlo

## 1. Instalación (sustituye la versión anterior)
1. Descomprime el zip.
2. En GitHub, entra en tu carpeta de pruebas (la misma donde subiste la fase 0) y arrastra **todo el contenido** de la carpeta descomprimida. GitHub sustituye los archivos que se llamen igual.
   - Hay un archivo nuevo: `js/clips.js`.
   - Si quieres, borra `PRUEBAS_FASE0.md`; ya no hace falta.
3. Abre la app. Abajo aparecerá **«Hay una versión nueva → Actualizar»**. Si no aparece, recarga la página con Ctrl+F5.
4. Tus piezas de la fase 0 siguen ahí; no hace falta volver a importarlas.

## 2. Correcciones de lo que encontraste
- [ ] **Nombre del acorde y O / X**: ya no se pisan. Cuando el acorde tiene nombre, se deja una franja propia para O / X.
- [ ] **Grosor y tamaño después de dibujar**: selecciona una línea, flecha, elipse, trazo o texto. Los controles **Texto / Grosor / Color** muestran sus valores actuales y, al cambiarlos (escribiendo o con las flechitas), se aplica **al momento**. Si hay varios seleccionados, se aplica a todos. Los cambios seguidos cuentan como un solo paso de deshacer.
- [ ] **Eliminar hojas**: debajo de cada hoja tienes **«+ Hoja en blanco debajo»** y **«Eliminar hoja»**. Las dos se pueden deshacer con Ctrl+Z.

## 3. Herramientas nuevas de dibujo
- [ ] **✎ Lápiz (P)**: dibujo a mano alzada para rodear, por ejemplo, las cuerdas de un acorde que puedes tocar. Puedes encadenar varios trazos sin cambiar de herramienta.
- [ ] **➚ Flecha (F)**: arrastra; con Mayús queda recta.
- [ ] **◯ Elipse (O)**: para rodear; con Mayús, círculo. Solo se selecciona tocando el borde, así puedes seguir tocando lo que hay dentro.
- [ ] **⌫ Borrador (B)**: como el de Paint. El círculo muestra el tamaño; cámbialo en **«Borrador»**. Pinta del color de **«Tapar»** (blanco). Cada borrón se puede seleccionar y eliminar después si te equivocas.

## 4. Fase 1: editar sin fricción
- [ ] **Selección múltiple**: con **↖ Selec.**, arrastra en una zona vacía para seleccionar varios con un recuadro. **Mayús + clic** añade o quita elementos. **Ctrl+A** selecciona todo lo de la hoja.
- [ ] **Barra flotante abajo**: al seleccionar algo aparecen Editar, Duplicar, Copiar, Cortar, Al frente, Al fondo y Eliminar. Arriba ya no hay que buscar nada.
- [ ] **Guías al mover**: aparecen líneas rosas al alinear con los bordes o centros de otros elementos o de la hoja, y el elemento se ajusta solo. Mantén **Alt** para moverlo libremente.
- [ ] **Arrastrar a otra hoja**: arrastra lo seleccionado y suéltalo sobre otra hoja (por ejemplo, una hoja en blanco que acabas de añadir debajo).
- [ ] **✂ Cortar zona (X)**: rodea un trozo de la partitura (una línea de pentagrama y tablatura, varios compases…). Se convierte en un objeto que puedes mover, agrandar o llevar a otra hoja, y donde estaba queda en blanco. **Así puedes separar líneas para ganar espacio y meter diagramas de acordes.**
- [ ] **⧉ Copiar zona (C)**: lo mismo, pero sin quitar el original.
- [ ] **Copiar / Cortar / Pegar** (Ctrl+C / Ctrl+X / Ctrl+V): funciona entre hojas y **entre piezas distintas**. Copia en una pieza, vuelve a la biblioteca, abre otra y pega. Se pega en la hoja que estés viendo.
- [ ] **Exportar PDF**: los recortes siguen siendo **vectoriales** (nítidos y ligeros). Solo van como imagen si vienen de una hoja girada.

### Prueba recomendada (simula tu caso real)
1. Abre una partitura. Pulsa **«+ Hoja en blanco debajo»** en la hoja 1.
2. Con **✂ Cortar zona**, rodea la última línea de la hoja 1 y arrástrala a la hoja nueva.
3. Con **✂ Cortar zona**, rodea otra línea y bájala un poco para dejar hueco.
4. En ese hueco, coloca acordes con **Acordes ▾**. Rodea con **◯ Elipse** o **✎ Lápiz** las cuerdas que interesan y añade una **➚ Flecha**.
5. **Exportar PDF** y compruébalo.

## 5. Atajos
| Tecla | Acción |
|---|---|
| V · T · P · L · F · O | Selec. · Texto · Lápiz · Línea · Flecha · Elipse |
| R · B · X · C | Tapar · Borrador · Cortar zona · Copiar zona |
| Ctrl+C / X / V | Copiar / cortar / pegar |
| Ctrl+A | Seleccionar todo lo de la hoja |
| Ctrl+D | Duplicar |
| Ctrl+Z / Ctrl+Y | Deshacer / rehacer |
| Supr | Eliminar |
| Flechas (Mayús) | Mover 1 pt (5 pt) |
| Alt al arrastrar | Sin guías |
| Esc | Cancelar / deseleccionar |

## 6. Siguiente fase (2)
- **Organizador de páginas con miniaturas**: reordenar arrastrando, duplicar y borrar varias a la vez.
- **Separar una recopilación en piezas** («páginas 12–15 → nueva pieza») guardando solo esas páginas.
- **Exportar cualquier pieza** desde la biblioteca.
