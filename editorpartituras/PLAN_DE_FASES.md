# Partituras: plan de desarrollo por fases

Cada fase termina en una versión que puedes usar y probar, con su guía de pruebas (`PRUEBAS_FASEn.md`).
Estado a 28 de noviembre de 2026 · versión actual **11.3.1-f3** (revisión de la fase 3). Plan actualizado con tus respuestas para las fases 4 y 5.

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Cimientos | ✅ Hecha |
| 1 | Editor sin fricción | ✅ Hecha |
| 2 | Hojas y biblioteca | ✅ Hecha (11.2.1: corregida la actualización) |
| 3 | Plantillas, acordes y mástil | ✅ Hecha · **11.3.1: revisión con tus correcciones** |
| 4 | Práctica 2.0 (compases, metrónomo, cursor y bucle de compases) | ⏭ Siguiente · decisiones tomadas el 28 nov |
| 5 | Puente de Drive | Pendiente · decisiones tomadas el 28 nov |
| 6 | Atril: tablet y móvil | Pendiente |
| 7 | Interfaz sin fricción (reorganizar botones) | Pendiente · después de las funciones |
| 8 | Manual de usuario | Al final, con la app prácticamente terminada |
| Futuro | Escribir notas y tablatura | Cuando lo anterior esté pulido |

**Forma de trabajo acordada**: primero funcionalidad; la organización de la interfaz y el manual, al final. El trabajo complejo de edición se hace en el portátil; la tablet y el móvil son para tocar, ver partituras o documentos fijos y pasar páginas con el pedal Bluetooth.

---

## Fase 0 · Cimientos ✅
**Qué incluye**
- Nuevo modelo de datos: piezas → hojas → objetos, todo medido en puntos del PDF.
- PWA con las librerías en local (funciona sin conexión).
- Los PDF se guardan como archivo en IndexedDB.
- Página de ideas de mejora.
- Aviso de copia al entrar.
- Copia `.ptbak` local.

**Para ti:** lo que ya tenías, sin el fallo de la resolución y funcionando sin conexión.

## Fase 1 · Editor sin fricción ✅
**Qué incluye**
- Herramienta de selección única, con selección múltiple (recuadro, Mayús+clic, Ctrl+A).
- Mover, copiar, cortar y pegar, también entre hojas y entre piezas.
- Recortes **vectoriales** de la partitura («Cortar zona» y «Copiar zona»).
- Guías rosas y ajuste al mover.
- Barra flotante que cambia según lo que hay seleccionado.
- Deshacer y rehacer de toda la pieza.
- Lápiz, flecha, elipse y borrador; textos, acordes, dedos, técnicas y bucles.

**Para ti:** editar deja de ser una lucha.

## Fase 2 · Hojas y biblioteca ✅
**Qué incluye**
- **Organizador de hojas** con miniaturas:
  - Seleccionar y reordenar arrastrando.
  - Añadir hojas en blanco **verticales u horizontales**, duplicar, girar hojas en blanco, eliminar y mover ◀ ▶.
  - Exportar a PDF solo las hojas seleccionadas.
- **Nueva pieza con hojas seleccionadas** y **dividir una recopilación en piezas**:
  - Títulos sugeridos del texto de la hoja.
  - Etiqueta común.
  - Opción de borrar el original.
  - Cada pieza guarda solo sus páginas.
- **Liberar espacio**: quita del PDF guardado las páginas que ya no se usan.
- **Mover a hoja…**: lleva lo seleccionado a otra hoja o a una nueva.
- **Biblioteca**: filtrar tocando etiquetas, ordenar, y título y etiquetas también desde el editor.

**Además, de lo que encontraste al probar la fase 1**
- Corregido: «Copiar/Cortar zona» no funcionaba en una hoja nueva donde habías pegado trozos. Ahora copia lo que se ve en cualquier hoja.
- Hojas horizontales.
- Pegar desde fuera de la app (imágenes de webs, PDF y capturas, y texto), botón «🖼 Imagen» y arrastrar imágenes.
- Números de traste de los diagramas más grandes y separados de la 6.ª cuerda.

**Para ti:** tu recopilación de 30 canciones convertida en 30 piezas independientes.

## Fase 3 · Plantillas, acordes y mástil ✅
**Qué incluye**
- **Pautas vectoriales**: tablatura, pentagrama o ambos, con N compases por línea, clave de sol y TAB, y hueco para acordes.
  - Se colocan **debajo de lo seleccionado y con su ancho**; la esquina cuadra el ancho y la separación de las líneas.
- **Herramienta Traste (N)**: números sobre las líneas de la tablatura, uno tras otro.
- **Fila de acordes escribiendo «Am G F E»**: uno por compás de la pauta o repartidos. Los que no están en la biblioteca salen vacíos con su nombre.
- **Diagrama de mástil**:
  - marcas con texto y color;
  - relleno automático de tríadas, acordes 7, escalas, pentatónicas y blues;
  - **formas CAGED C-A-G-E-D**, con intervalos o nombres de nota.
- **Ver notas**: panel de consulta con todas las notas del mástil.
- **Plantillas e impresión**: hojas de tablatura, pentagrama, ambos, diagramas de acordes o mástiles en blanco, desde «Nueva en blanco» o «+ Plantilla…».
- Todo sale **vectorial** en el PDF exportado.

**Además, de lo que encontraste al probar la fase 2**
- Corregido: un trozo de captura pegado en otra hoja se seleccionaba al tocar cualquier sitio.
- **Cortar quita de verdad**: hueco en el original, sin rectángulos blancos ni copias superpuestas.
- **⬚ Zona (M)** como en Paint, en lugar de «Cortar zona» y «Copiar zona»:
  - arrastrar mueve y Ctrl+arrastrar copia;
  - Ctrl+C, Ctrl+X, Supr y Ctrl+D;
  - con Selec., arrastrar sobre la partitura vacía también marca una zona.
- **Alt+clic** selecciona lo que hay debajo.
- La portada de la biblioteca se actualiza al salir del editor, también en piezas en blanco.

**Para ti:** apuntes CAGED en minutos, tablaturas bajo la partitura e impresos de práctica.

## Revisión 11.3.1 (28 nov 2026) ✅
**Lo que encontraste al probar la fase 3**
- **Zona en hojas con plantilla o con mástil**: decía que no había nada. Ahora la zona corta cualquier elemento partido (pautas, mástiles, acordes, textos, trazos), además de PDF, capturas y recortes.
- **Pauta en hoja nueva**: «Llenar hasta abajo» venía marcado y bloqueaba el número de líneas. Ahora nunca viene marcado y, si lo marcas, muestra cuántas líneas caben.
- **Traste**: la caja de escritura es del tamaño del número y está justo en el traste. Los números se arrastran por la cuerda o a otra cuerda (se encajan solos), y ↑ ↓ los cambian de cuerda.
- **Mástil**: el texto y el color de la marca están ahora encima del mástil, explicados, y se aplican al momento a la última marca tocada.
- **Fila de acordes**: con una o varias pautas seleccionadas pone un **diagrama vacío e independiente en cada compás**. Los nombres son opcionales.
- **Pauta**: opción «Diagramas de acordes vacíos (uno por compás)».
- **Plantillas nuevas**: «Tablatura + diagramas vacíos» y «Pentagrama + tablatura + diagramas vacíos», uno por compás.
- **Piezas sueltas `.ptbak`**: «Importar PDF o pieza» en la biblioteca acepta PDF y `.ptbak`, varios a la vez o arrastrados. Si ya tienes la pieza, eliges sustituir o añadir como copia.
- **Datos**: comprobado que la app solo usa su base `pt_partituras_db` y sus cachés `partituras-app-…`, y no toca otras apps del mismo sitio. En Más → Copias se avisa del único riesgo: borrar los datos del sitio al desinstalar desde Chrome afecta a todas las apps de `guitarraapp.github.io`.
- **Revisión automática**: 34 comprobaciones de toda la app en Chrome, todas correctas y sin errores en la consola.

## Fase 4 · Práctica 2.0 ⏭ (siguiente)
**Decisiones (28 nov 2026)**
- **Compás y tempo**: lo normal es uno por pieza, pero **debe admitir cambios** de compás o de tempo a mitad de pieza.
- **Marcar compases**: arrastrar sobre una línea de la partitura y repartirla en N compases, y después **ajustar cada separador a mano**. Se elegirá la forma más intuitiva.
- **Metrónomo**: **clic**, con la primera parte del compás **acentuada**.
- **Entrada**: 1 o 2 compases solo de clics antes de empezar, configurable.
- **Subida de tempo**: opcional. Tú decides si se activa, cuánto sube y **hasta qué límite**.
- **Repeticiones**: el bucle sigue **hasta que lo pares**, con contador de vueltas.

**Qué incluye**
1. **Compases**
   - Herramienta «Compases»: arrastras sobre una línea de partitura, eliges cuántos compases tiene y aparecen los separadores.
   - Cada separador se arrastra por separado; se pueden añadir, quitar y renumerar.
   - Si la partitura tiene barras de compás claras, la app propondrá dónde están; siempre se podrá corregir.
   - Los compases van pegados al trozo de partitura: si lo mueves con Zona, se mueven con él.
   - **Cambios de compás y de tempo**: en cualquier compás se puede indicar «desde aquí 3/4» o «desde aquí ♩ = 90».
2. **Metrónomo exacto**
   - Usa el reloj de audio del navegador, así no se retrasa aunque el equipo vaya cargado.
   - Clic con la primera parte acentuada y volumen ajustable.
3. **Cursor**: una barra que avanza por los compases al ritmo del metrónomo y pasa de línea y de hoja sola.
4. ⭐ **Bucle de compases** (imprescindible):
   - Tocas el compás de inicio y en un campo al lado pones **cuántos compases** entran. El tramo se resalta.
   - **Entrada**: 1 o 2 compases de clics antes de empezar (configurable).
   - **Entre vueltas**: al menos 1 compás de clics para prepararte antes de repetir (configurable).
   - Se repite **hasta que pares**, con contador de vueltas.
   - **Subida de tempo opcional**: tempo de inicio, cuánto sube, cada cuántas vueltas y tempo máximo. Ejemplo: del 70 % al 100 %, un 5 % cada 2 vueltas.
   - Atajos: espacio para empezar o parar.
5. **Etiqueta de bucle** que abre la app de bucles en el loop exacto (requiere un pequeño cambio en la app de bucles).

**Para ti:** repetir los pasajes difíciles con el metrónomo, con tiempo para prepararte entre vueltas y subiendo el tempo cuando quieras.

## Fase 5 · Puente de Drive
**Decisiones (28 nov 2026)**
- Son archivos musicales, sin datos personales: **no se cifran** (ni la copia general, ni las piezas sueltas, ni los PDF). Así se evita la carga de cifrar archivos pesados. Es una excepción consciente al MD «Seguridad solo para el puente», que se mantiene para el acceso a Drive: permisos mínimos, solo la carpeta de la app y ninguna clave guardada en el código.
- **Tres carpetas** dentro de `Mi unidad/Apps/Backups/partituras`:
  - `general/`: copias completas.
  - `piezas/`: piezas sueltas `.ptbak`.
  - `pdf/`: PDF exportados, para ver o imprimir.
- **Al cargar cualquier archivo** (general o pieza) se **comprueba el formato** antes de tocar la base de datos, como ya se hace con los `.ptbak` locales:
  - cabecera y versión;
  - que cada PDF e imagen esté completo y sea válido;
  - que cada pieza esté saneada.
  Si algo falla, no se escribe nada. Antes de sustituir piezas se guarda una copia previa.

**Copia general: propuesta** (para no subir nada con cada cambio)
- **Nada automático con cada cambio.** La copia general se sube:
  - **a petición**, con un botón «Copia a Drive»;
  - **o como mucho una vez al día y solo si ha habido cambios**, al abrir o al cerrar la app. Configurable: manual, diaria o semanal.
- **Copia ligera**: los PDF originales casi nunca cambian. Cada PDF se sube **una sola vez** a `general/pdf-originales/` (se reconoce por su identificador) y la copia general solo lleva las piezas, anotaciones, imágenes, acordes, ideas y ajustes. Así la primera copia es grande y las siguientes ocupan muy poco y se suben en segundos. Al restaurar se descargan solo los PDF que falten.
- Se conservan las **últimas 5 copias generales** (configurable). Las antiguas se borran solas; los PDF originales que ya no use ninguna copia también.

**Piezas sueltas y PDF**
- **A petición**: «Guardar pieza en Drive» en el menú ⋯ de la pieza y «Exportar PDF a Drive» junto a «Exportar PDF».
- **Cargar**: pantalla «Drive» con la lista de copias generales y piezas (nombre, fecha y tamaño) y un botón para cargar. Las piezas que ya tienes preguntan si se sustituyen o se añaden como copia, igual que ahora.

**Para ti:** no perder nada, llevar piezas a la tablet sin cables y no tener la conexión ocupada con cada cambio.

## Fase 6 · Atril: tablet y móvil
**Qué incluye**
- **Entra en modo lectura** en tablet y móvil: tocar la pantalla no edita. Para editar hay un botón explícito.
- Biblioteca sencilla, pantalla completa y paso de página con el **pedal Bluetooth** (normalmente envía flechas o AvPág/RePág; se probará con el tuyo).
- Cursor, metrónomo y bucle de compases de la fase 4 adaptados al dedo.
- Ver documentos fijos (apuntes CAGED, ejercicios) igual que las partituras.

**Para ti:** practicar con la tablet en el atril pasando páginas con el pie.

## Fase 7 · Interfaz sin fricción
**Qué incluye** (cuando las funciones estén completas)
- Reorganizar los botones: pocos visibles y el resto agrupado por tareas («Escribir», «Música», «Trozos», «Hoja»…), con barras que cambian según lo que hagas.
- Revisar nombres, atajos y ayudas emergentes para que cada función se encuentre a la primera.
- Diseño distinto para PC (edición completa) y para tablet o móvil (lectura y práctica).

## Fase 8 · Manual de usuario
**Qué incluye** (al final, con la app prácticamente terminada)
- Qué hace cada **botón y zona de botones**, con capturas.
- **Tareas habituales paso a paso**: importar una partitura y separarla en piezas, hacer una hoja de apuntes CAGED, poner tablatura bajo una partitura, practicar un pasaje en bucle, hacer copias y pasarlas a la tablet, imprimir.
- Atajos de teclado y preguntas frecuentes.

## Futuro
- Escribir en la tablatura y que salgan las notas en el pentagrama.
- Más adelante, notación completa.

---

## Ideas apuntadas para más adelante
Surgidas al desarrollar las fases 2 y 3. No hacen falta ahora; las dejo aquí para que decidas si entran en alguna fase:
- **Agrupar**: unir varios trozos (por ejemplo, un diagrama y su texto) para moverlos como uno.
- **Mástil vertical** y mástiles con otras afinaciones (Drop D, DADGAD).
- **Escribir notas en el pentagrama** a partir de los números de la tablatura: es el «Futuro» del plan.
- **Ajustar la zona** con tiradores en los bordes, antes de moverla (hoy se vuelve a marcar).
- **Unir piezas**: el inverso de separar, por ejemplo para montar un repertorio de concierto con varias piezas.
- **Arrastrar hojas en pantallas táctiles**. En el móvil, el orden se cambia ahora con ◀ ▶; arrastrar con el dedo necesitaría una pulsación larga. Encaja en la fase 6.
- **Títulos en PDF escaneados**: hoy, sin texto en el PDF no hay sugerencia. Reconocer texto en imágenes (OCR) es pesado; mejor escribirlos.
- **Pegar figuras vectoriales de otro programa**: el portapapeles entrega imágenes; las figuras de tus propias piezas sí se copian en vectorial con «⬚ Zona».
