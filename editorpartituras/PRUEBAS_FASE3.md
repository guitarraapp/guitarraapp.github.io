# Partituras 11.3 · Fase 3 (pautas, acordes y mástil): qué hay nuevo y cómo probarlo

## Cómo instalarla
1. Descomprime el zip. Sale la carpeta `partituras-f3`.
2. En GitHub, entra en la carpeta `editorpartituras` y pulsa **Add file → Upload files**.
3. Desde el explorador de Windows, **arrastra todo lo que hay dentro** de `partituras-f3`: las carpetas `js`, `css`, `vendor` e `icons` y los archivos sueltos. No uses «choose your files», porque no sube carpetas. Pulsa **Commit changes**.
   - Si prefieres borrar la carpeta y volver a crearla, como la otra vez: cambia el nombre de `partituras-f3` a `editorpartituras` y arrástrala entera en la página principal del repositorio.
4. Comprobación: espera 1 o 2 minutos y abre `https://guitarraapp.github.io/editorpartituras/js/util.js`. En la segunda línea debe poner **11.3.0-f3**.
5. Abre la app y pulsa **Actualizar**. Junto a «Partituras» debe salir **11.3.0-f3**.
   - Si no, ve a **Más → Ajustes → Forzar actualización**.

Tus piezas no se tocan. Hay dos archivos nuevos en `js`: `vector.js` y `tools3.js`.

---

## 1. Correcciones de lo que encontraste

### 1.1 «Pinche donde pinche se selecciona el último trozo»
**Causa**: un trozo recortado de una captura respondía a los clics como si fuera la captura entera. Un trozo de 6 × 4 cm ocupaba en realidad 21 × 14 cm invisibles.
**Prueba**:
1. Pega una captura.
2. Añade una hoja.
3. Corta un trozo de la captura y pégalo en la hoja nueva.
4. Toca en blanco alrededor del trozo: no debe seleccionarse nada.
5. Toca el trozo: se selecciona solo él.

### 1.2 Cortar ya quita de verdad (adiós a los rectángulos blancos y a las copias superpuestas)
Antes, «Cortar zona» dejaba la figura original entera y le ponía encima un rectángulo blanco. Además colocaba la copia encima, así que se acumulaban capas. Ahora cortar abre un **hueco** en el original, sea el fondo del PDF, una captura, un trozo o un tapado.
**Prueba con tu figura de 8 diagramas**:
1. Pega la figura y elige **⬚ Zona** (tecla **M**).
2. Rodea el primer diagrama y **arrástralo** a su sitio.
3. Repite con los demás.
4. Pasa **Alt+clic** por donde estaban: debajo no hay nada escondido. El aviso dice «Ahí solo hay un elemento» o cuántas capas hay.
5. Ctrl+Z deshace cada movimiento, y el hueco desaparece con él.

**Piezas antiguas**: los rectángulos blancos y las copias que se hicieron con la versión anterior siguen ahí. Para limpiarlos: **Alt+clic** sobre la zona, ve bajando capas hasta el sobrante y pulsa **Supr**.

### 1.3 Una sola herramienta de zona, como en Paint
«✂ Cortar zona» y «⧉ Copiar zona» se sustituyen por **⬚ Zona (M)**.
- **Marca un rectángulo** sobre lo que sea. Abajo aparece la barra de la zona.
- **Arrastrar** la zona = cortar y mover, también a otra hoja.
- **Ctrl + arrastrar** = copiar y mover.
- **Ctrl+C** copia, **Ctrl+X** corta, **Supr** borra y **Ctrl+D** pone una copia encima. Después, **Ctrl+V** pega en cualquier hoja o pieza.
- Tras mover, el trozo queda seleccionado y puedes reajustarlo sin cambiar de herramienta. Para marcar otra zona, arrastra en otro sitio.
- Con **↖ Selec.**, si arrastras sobre la partitura donde no hay elementos, el recuadro se convierte en una zona. No hace falta cambiar de herramienta.
- **Esc** quita la zona.

### 1.4 Alt+clic: seleccionar lo que hay debajo
Con **↖ Selec.**, cada **Alt+clic** baja una capa en ese punto. El aviso dice «Capa 2 de 3».

---

## 2. Fase 3

### 2.1 𝄚 Pauta
1. Pulsa **𝄚 Pauta** y elige el tipo: tablatura, pentagrama o los dos. Puedes ajustar:
   - compases por línea;
   - número de líneas o «Llenar hasta abajo»;
   - clave de sol y TAB al principio;
   - hueco para acordes encima;
   - separación de las líneas.
   La vista previa cambia al momento.
2. **Debajo de tu partitura**: selecciona antes el trozo de partitura y pulsa **Pauta**. Sale justo debajo y con su mismo ancho.
3. **Cuadrarla**: arrastra el círculo de la esquina. En horizontal cambia el ancho; en vertical cambia la separación de las líneas.
4. **Doble clic** sobre la pauta para cambiar sus opciones.

### 2.2 Traste (N): escribir números en la tablatura
1. Elige **Traste** (tecla **N**).
2. Toca sobre una línea de la tablatura, escribe el número (o «7h9», «x»…) y pulsa **Enter**.
3. Toca la siguiente posición: no hace falta cambiar de herramienta.
4. El número queda centrado en la línea y la corta, como en una tablatura impresa.
5. Toca un número ya escrito para cambiarlo. Si lo dejas vacío, se borra.

### 2.3 Fila de acordes
1. Selecciona una pauta y pulsa **Fila de acordes**.
2. Escribe `C Am F G7` y pulsa **Colocar**. Sale un diagrama centrado en cada compás. Si hay más acordes que compases, siguen en la línea siguiente.
3. Si la pauta tiene **hueco para acordes**, los diagramas se ajustan al hueco y no pisan las líneas.
4. Sin pauta seleccionada, los acordes se reparten a lo ancho de la hoja.
5. Un acorde que no está en tu biblioteca (por ejemplo `Cmaj7`) sale vacío con su nombre. Rellénalo con doble clic.

### 2.4 Mástil (para tus apuntes CAGED)
1. Pulsa **Mástil**.
2. En «Rellenar automáticamente», elige **Tónica**, **Qué** (tríada mayor o menor, 7, maj7, m7, escalas, pentatónicas, blues…), **Dónde** (todo el tramo o **Forma C, A, G, E o D**) y **Texto** (intervalos R 3 5, nombres de nota o nada).
3. Pulsa **Rellenar**.
   - Ejemplo: tónica Do, tríada mayor, Forma C. Sale entre los trastes 0 y 3 con R, 3 y 5, la tónica en rojo y el título «Forma C · C».
4. **A mano**: elige texto y color de marca y toca casillas para ponerlas o quitarlas. «Hueco» es el círculo blanco.
5. «Añadir a lo que hay» suma marcas sin borrar las anteriores, por ejemplo la tríada más una nota de paso en otro color.
6. Al insertarlo, su ancho depende del número de trastes. La esquina cambia ancho y alto, y el doble clic lo edita.
7. **Prueba CAGED completa**: haz los 5 mástiles de Do (C, A, G, E, D) en una hoja, uno debajo de otro, y **Exporta PDF**.

### 2.5 Ver notas
**Ver notas** abre abajo un panel con todas las notas del mástil, hasta el traste 15. No bloquea, así que puedes seguir escribiendo con él abierto. Al pasar el ratón ves la cuerda, el traste y la nota. «Resaltar» marca una escala o un acorde desde la tónica que elijas, y «Insertar en la hoja» lo convierte en un diagrama de mástil.

### 2.6 Hojas para imprimir y plantillas
- **Nueva en blanco** (biblioteca) ahora permite elegir **plantilla** y **orientación**:
  - en blanco;
  - tablatura;
  - pentagrama;
  - pentagrama + tablatura;
  - tablatura con hueco para acordes;
  - diagramas de acordes en blanco;
  - mástiles en blanco.
  También puedes poner un encabezado.
- Debajo de cada hoja hay un botón nuevo, **+ Plantilla…**, que añade una hoja con plantilla.
- Pulsa **Exportar PDF** e imprímela. Todo sale **vectorial**, también la clave de sol, así que se imprime nítido a cualquier tamaño.

---

## 3. Comprobaciones rápidas
- [ ] Junto a «Partituras» pone 11.3.0-f3.
- [ ] Pegar una captura, cortar un trozo con Zona y llevarlo a otra hoja: el trozo solo se selecciona donde se ve.
- [ ] Mover un trozo deja hueco en el original. Alt+clic en el hueco: no hay nada debajo.
- [ ] Ctrl+Z y Ctrl+Y deshacen y rehacen también los huecos del fondo PDF.
- [ ] Pauta debajo de un trozo de partitura, con el mismo ancho. La esquina la cuadra.
- [ ] Traste: tres números seguidos sin cambiar de herramienta.
- [ ] Fila de acordes «C Am F G7» sobre una pauta con hueco para acordes.
- [ ] Mástil con Forma C de Do. Exportar PDF: se ve igual que en pantalla.
- [ ] Nueva en blanco con plantilla «Diagramas de acordes en blanco» → Exportar PDF → imprimir.
- [ ] Copia completa y restaurar en otra pestaña: los huecos, las pautas y los mástiles se conservan.

Si algo no va como esperas, apúntalo en **Más → Ideas de mejora** o cuéntamelo con una captura.
