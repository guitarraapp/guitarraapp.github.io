# Partituras 11.2.1 · Fase 2 (hojas y biblioteca): qué hay nuevo y cómo probarlo

## 0. Corrección 11.2.1 (lo que falló con la 11.2.0)
- **Causa**: al actualizar, la app recogía sus archivos a través de la caché del navegador. GitHub Pages deja cada archivo 10 minutos en esa caché, así que se colaban archivos de la fase 1 en la fase 2.
  - Se veía la versión antigua.
  - «🖼 Imagen» no hacía nada.
  - Ctrl+V no pegaba capturas ni imágenes de webs.
- **Arreglo**: ahora cada archivo se pide siempre al servidor al actualizar.
  - Además, si alguna vez la versión instalada no coincide con la publicada, sale **«La actualización se quedó a medias → Reparar ahora»**.
  - En **Más → Ajustes → Versión** hay un botón **«Forzar actualización»**. Vuelve a descargar la app sin tocar tus piezas.
- **Pegar**: si copiabas algo dentro de la app y el navegador no dejaba marcarlo, desde ese momento Ctrl+V pegaba siempre lo de la app y nunca la captura. Ahora una imagen o un texto de fuera ganan siempre en ese caso.
- Comprobado en Chrome simulando tu caso: fase 1 → fase 2 a medias → 11.2.1. Termina en 11.2.1 con todo funcionando.


## 1. Instalación (sustituye la fase 1)
1. Descomprime el zip.
2. En GitHub, entra en tu carpeta de pruebas y arrastra **todo el contenido** de la carpeta descomprimida. Se sustituyen los archivos que se llamen igual.
   - Archivos nuevos: `js/images.js`, `js/thumbs.js`, `js/split.js` y `js/organizer.js`.
   - Puedes borrar `PRUEBAS_FASE1.md`.
3. Abre la app. Abajo aparecerá **«Hay una versión nueva → Actualizar»**. Púlsalo.
   - Si no aparece, recarga con Ctrl+F5 y vuelve a recargar normal.
   - Comprueba que arriba, junto a «Partituras», pone **11.2.1-f2**.
   - Si no, ve a **Más → Ajustes → Forzar actualización**.
   - Si la app está abierta en **otra pestaña**, ciérrala antes: la base de datos se amplía (para las imágenes) y no puede hacerlo con dos pestañas abiertas.
4. Tus piezas de la fase 1 siguen igual. Está comprobado: se instaló la fase 1 con datos, se publicó la 2 encima y todo quedó idéntico.
5. Recomendado: antes de empezar, en **Más → Copias** descarga una copia completa.

## 2. Lo que encontraste en la fase 1
- [ ] **Copiar de una hoja nueva** (el fallo). «⧉ Copiar zona» y «✂ Cortar zona» copian **lo que se ve** en la zona, en cualquier hoja: la partitura de fondo, los trozos que pegaste (recortados justo a la zona), imágenes, tapados y lo que hayas anotado dentro.
  - Prueba: pega un trozo en una hoja en blanco y, en esa misma hoja, haz «Copiar zona» sobre una parte del trozo. Sale solo esa parte.
- [ ] **Hojas horizontales**: bajo cada hoja tienes **«+ Hoja vertical»** y **«+ Hoja horizontal»**. En el organizador puedes **girar** una hoja en blanco vacía. Las hojas de partitura mantienen su orientación.
- [ ] **Pegar lo copiado fuera de la app**:
  - Copia una imagen de una web (botón derecho → Copiar imagen), una captura (Win+Mayús+S) o una figura de otro PDF.
  - Vuelve a la app y pulsa **Ctrl+V** o **«📋 Pegar»**. Aparece en la hoja que estás viendo; muévela y cambia su tamaño desde la esquina (mantiene la proporción).
  - También pega **texto**: cada línea queda como un texto.
  - **«🖼 Imagen»** añade una imagen desde un archivo, y puedes **arrastrar** imágenes sobre una hoja.
  - Si copias algo **dentro** de la app y luego pulsas Ctrl+V, se pega lo de la app. Si después copias algo fuera, Ctrl+V pega lo de fuera. Siempre gana lo último que copiaste.
  - Con «Copiar zona» puedes quedarte con solo un trozo de una imagen pegada.
  - Lo que se pega desde otro programa es una **imagen**. Si la figura está en una partitura de tu biblioteca, cópiala con «Copiar zona» desde esa pieza: así sigue siendo vectorial.
- [ ] **Diagramas de acordes**: el número de traste es **más grande** (17 en vez de 14) y está **separado de la 6.ª cuerda**, así ya no se pisa con un punto o un círculo. Los acordes que ya tenías se ven igual, solo un poco desplazados a la derecha para dejar ese hueco.

## 3. Fase 2: organizador de hojas (📑 Hojas)
Se abre con **«📑 Hojas»** arriba en el editor, o con **⋯ → Hojas…** en la biblioteca.
- [ ] Miniaturas de todas las hojas, con su número y si es vertical u horizontal.
- [ ] **Seleccionar**: toca una hoja (se marca ✓). **Mayús + clic** selecciona un rango, **Ctrl+A** todas, y «Todas/Ninguna».
- [ ] **Cambiar el orden arrastrando** con el ratón; una raya rosa indica dónde caerá. Si arrastras una seleccionada, se mueven todas las seleccionadas. También funcionan **◀ Antes / Después ▶**.
- [ ] **+ Vertical / + Horizontal**: añade una hoja en blanco detrás de la selección, o al final si no hay nada seleccionado.
- [ ] **Duplicar**, **⟳ Girar** (hojas en blanco vacías) y **Eliminar** (también con Supr).
- [ ] **↗** en una miniatura: cierra el organizador y te lleva a esa hoja.
- [ ] **Todo se deshace con Ctrl+Z** (también el botón ↶ del organizador).
- [ ] **«Exportar PDF de estas»**: descarga un PDF solo con las hojas seleccionadas.
- [ ] **«Nueva pieza con estas…»**: crea una pieza independiente con las hojas seleccionadas.
  - Propone el título a partir del texto más grande de la hoja.
  - Opción: **quitarlas de la pieza actual**.
  - La pieza nueva guarda **solo sus páginas**, en un PDF propio y ligero, con todo lo que hayas anotado y los trozos que hubieras pegado de otras hojas.
- [ ] **«Mover a hoja…»** (barra de abajo al seleccionar elementos): lleva lo seleccionado a otra hoja o a una hoja nueva vertical u horizontal. Más cómodo que arrastrar en piezas largas.

## 4. Fase 2: separar una recopilación en piezas
1. En la biblioteca, **⋯ → Separar en piezas…** (o «✂ Dividir en piezas…» dentro de Hojas).
2. Toca la **primera hoja de cada canción**: aparece **✂ Pieza N**. «Cada hoja, una pieza» las marca todas.
3. Arriba se van rellenando los **títulos** con el texto más grande de esa hoja.
   - Funciona cuando el PDF tiene texto. Si es un escaneo, verás «Título 1, 2…»: escríbelos tú.
4. Pon una **etiqueta común** (por defecto, el nombre de la recopilación) para encontrarlas juntas.
5. Si quieres, marca **«Borrar la recopilación cuando estén creadas»**. Se crean primero las piezas y te vuelve a preguntar antes de borrar.
6. **«Crear N pieza(s)»**. Cada una guarda **solo sus páginas** y lo que anotaste.

### Liberar espacio
Si borras hojas o las separas sin borrar el original, el PDF guardado sigue conteniendo páginas que ya no se usan. El organizador te avisa: **«💾 … página(s) que ya no usa → Liberar espacio»**. Lo que ves no cambia; el historial de deshacer se vacía.

## 5. Biblioteca
- [ ] **Etiquetas**: aparecen como botones bajo la búsqueda. Toca una para filtrar; tócala otra vez para quitar el filtro.
- [ ] **Ordenar**: más recientes, título A-Z o fecha de creación.
- [ ] **Título y etiquetas** desde el editor: toca el título de arriba.
- [ ] **Exportar a PDF cualquier pieza**: ⋯ → Exportar PDF (y en Hojas, solo las seleccionadas).

## 6. Prueba recomendada (tu caso real)
1. Importa tu recopilación de 30 canciones.
2. ⋯ → **Separar en piezas…** Marca dónde empieza cada canción y revisa los títulos. Etiqueta: el nombre de la recopilación. Marca «Borrar la recopilación». Crear.
3. En la biblioteca, toca la etiqueta: verás las 30 piezas. Abre una y comprueba que se ve bien.
4. En una pieza: «+ Hoja horizontal», copia con «Copiar zona» una línea de la partitura, llévala con «Mover a hoja…» y vuelve a copiar un trozo **desde esa hoja nueva**.
5. Copia una figura de una web, pégala con Ctrl+V y recórtala con «Copiar zona».
6. Exportar PDF.

## 7. Pruebas automáticas superadas (Chrome real)
- **Editor (15 comprobaciones)**: el fallo de copiar en la hoja nueva, «Cortar zona», hoja horizontal, «Mover a hoja…», pegar imagen y texto de fuera, copiar dentro y pegar dentro, botón «📋 Pegar», «🖼 Imagen», recortar una imagen, números de traste, exportar (hoja horizontal e imágenes) y sin errores.
- **Organizador y piezas (28)**: miniaturas, duplicar, deshacer, arrastrar, ◀ ▶, horizontal, girar, eliminar, nueva pieza con hojas (con recorte de otra hoja reapuntado), títulos sugeridos, liberar espacio, exportar selección, dividir en 5 piezas borrando el original sin dejar PDF huérfanos, etiquetas, orden, y abrir una pieza separada (incluida una página girada).
- **Actualización y copias (10)**:
  - De la fase 1 a la 2: aviso «Actualizar», datos idénticos y piezas antiguas que se abren y se pueden separar.
  - Copia `.ptbak` con imágenes, restaurada en otro navegador.
- Se encontró y corrigió un fallo durante las pruebas: tras «Duplicar» y Ctrl+Z, el organizador podía insertar una hoja nueva al principio.

## 8. Atajos
| Dónde | Tecla | Acción |
|---|---|---|
| Editor | Ctrl+V | Pegar (de la app, o imagen o texto de fuera) |
| Editor | V · T · P · L · F · O · R · B · X · C | Herramientas, como en la fase 1 |
| Hojas | Clic · Mayús+clic · Ctrl+A | Seleccionar · rango · todas |
| Hojas | Arrastrar | Cambiar el orden |
| Hojas | Supr · Ctrl+Z · Esc | Eliminar · deshacer · quitar selección / salir |

## 9. Siguiente: fase 3 (plantillas, acordes y mástil)
Pautas vectoriales: pentagrama, tablatura, ambos, fila de acordes y N compases por línea, con anchos ajustables para cuadrar con la partitura. Fila de acordes escribiendo «Am G F E». Panel del mástil con las notas. Hojas para imprimir.
