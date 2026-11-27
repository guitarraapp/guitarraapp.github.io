# Partituras: plan de desarrollo por fases

Cada fase termina en una versión que puedes usar y probar, con su guía de pruebas (`PRUEBAS_FASEn.md`).
Estado a 27 de noviembre de 2026 · versión actual **11.3.0-f3**.

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Cimientos | ✅ Hecha |
| 1 | Editor sin fricción | ✅ Hecha |
| 2 | Hojas y biblioteca | ✅ Hecha (11.2.1: corregida la actualización) |
| 3 | Plantillas, acordes y mástil | ✅ **Entregada ahora** |
| 4 | Práctica 2.0 | ⏭ Siguiente |
| 5 | Puente de Drive | Pendiente |
| 6 | Atril móvil | Pendiente |
| Futuro | Escribir notas y tablatura | Cuando lo anterior esté pulido |

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

## Fase 3 · Plantillas, acordes y mástil ✅ (esta entrega)
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

## Fase 4 · Práctica 2.0
**Qué incluye**
- **Compases** con separadores arrastrables y detección de las barras como punto de partida (corregible a mano, porque la automática falla).
- Los compases van pegados a los recortes: si mueves un trozo, sus compases se mueven con él.
- **Metrónomo exacto** con el reloj de audio y **cursor** que avanza por los compases.
- **Etiqueta de bucle** que abre la app de bucles en el loop exacto (requiere un pequeño cambio en la app de bucles).
- ⭐ **Bucle de compases dentro de la app** (imprescindible, pedido el 27 nov 2026), para repetir y pulir los trozos difíciles:
  - Tocas un compás para elegir dónde empieza el bucle.
  - Un campo al lado indica **cuántos compases** entran: solo ese o ese y los x siguientes. El tramo se resalta en la partitura.
  - Ese tramo se repite en bucle con el metrónomo y el cursor recorriéndolo.
  - **Entrada previa**: antes de empezar suenan **1 o 2 compases de metrónomo**, a elegir, para prepararte.
  - **Entre repeticiones**: después de cada vuelta suena **al menos 1 compás de metrónomo** de preparación antes de volver a empezar. Será configurable.
  - Por concretar en la revisión: tempo propio del bucle, subida gradual de tempo opcional, contador de repeticiones y botón de parar.

**Para ti:** un cursor fiable, salto directo al vídeo y repetir en bucle los compases difíciles con tiempo para prepararte.

## Fase 5 · Puente de Drive
**Qué incluye**
- Copias **cifradas** de las piezas en `Mi unidad/Apps/Backups/partituras`, según el MD «Seguridad solo para el puente».
- Datos ya reservados: prefijo `pt`, cabecera `PTENC1`.
- Subida automática cuando toca copia; restaurar desde Drive, también en un móvil nuevo.

**Para ti:** no perder nada.

## Fase 6 · Atril móvil
**Qué incluye**
- **Modo bloqueado**: tocar la pantalla no edita.
- Biblioteca, pantalla completa, cursor, bucle y **pedal** (Bluetooth / teclas) para pasar página.

**Para ti:** practicar con el móvil o la tablet.

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
- **Zona con anotaciones a medias**: si una flecha o un texto cae medio dentro y medio fuera, solo entra cuando su centro está dentro. Si molesta, se puede afinar.
- **Pegar figuras vectoriales de otro programa**: el portapapeles entrega imágenes; las figuras de tus propias piezas sí se copian en vectorial con «⬚ Zona».
