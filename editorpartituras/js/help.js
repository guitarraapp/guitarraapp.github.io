// Texto de ayuda (estático, sin datos del usuario)
export const HELP_HTML = `
<section class="panel help">
<h3>Novedades de la fase 4b: repeticiones, saltos, cursor por pulsos, rasgueos y cajas</h3>
<ul>
<li><b>Repeticiones y saltos</b>: con <b>Compases (C)</b>, toca un compás. Además del cambio de compás o de tempo, puedes poner <b>‖: inicio</b> y <b>:‖ final de repetición</b> (con el número de veces), <b>casilla de 1.ª / 2.ª vez</b> (pon «1» en los compases de la primera y «2» en los de la segunda), <b>Segno</b>, <b>Coda</b>, <b>To Coda</b>, <b>Fine</b>, <b>D.C. / D.S.</b> (al Fine, al Coda), <b>calderón</b> (pulsos de más), <b>rit. / accel.</b> (el tempo baja o sube poco a poco durante unos compases) y <b>%</b> (igual que el anterior). Se dibujan sobre la partitura y salen en el PDF; si la partitura ya los trae impresos, desmarca «Dibujar los símbolos» y seguirán valiendo para tocar.</li>
<li><b>▶ Práctica</b>: elige «Bucle de N compases», «Hasta el final, con repeticiones y saltos» o «Hasta el final, sin repeticiones». Con repeticiones, el panel muestra el <b>orden real</b> (por ejemplo 1–8, 1–6, 9–12) y el cursor salta donde toca, también a otra hoja. Al volver con D.C. o D.S. no se repite (se toca la última casilla); en Opciones puedes pedir que sí.</li>
<li><b>Cursor por pulsos</b>: en «Cursor», elige «Pulsos». El compás se divide en sus partes (3 en 3/4, 4 en 4/4…) y una franja de color pastel traslúcido salta con cada clic, dejando ver las notas. Hay seis colores.</li>
<li><b>↓↑ Rasgueo</b>: figura de flechas según el compás (4 pares en 4/4, 3 en 3/4…). Toca cada casilla para ↓, ↑, ✕ (apagado) o nada, o escribe «D-DU-UDU». Hay patrones habituales y puedes guardar los tuyos. Doble clic para editarla.</li>
<li><b>▦ Cajas</b>: una fila de cajas, una por compás, con el acorde dentro. Escribe «Do/Lam Rem/Sol7 Do Mi» y se rellena: con «/» la caja lleva <b>diagonal</b> y dos acordes (el de arriba suena primero); con tres o cuatro, columnas. «-» deja una caja vacía y «%» repite la anterior. <b>Doble clic en una caja</b> para cambiar su tipo, sus acordes, una nota pequeña y el <b>rasgueo de debajo</b> (con ◀ ▶ pasas a la caja de al lado). Con una fila seleccionada, «Cajas» pone la siguiente debajo con el mismo ancho. Las cajas cuentan como compases: el cursor y el metrónomo las recorren, y con «Compases» les pones repeticiones y saltos.</li>
</ul>
<h3>Fase 4: compases y práctica</h3>
<ul>
<li><b>Compases (C)</b>: arrastra un rectángulo sobre una línea de la partitura. Si la línea es una pauta de la app o un PDF con barras claras, la app propone los compases por sus barras; si no, los reparte a partes iguales. Después <b>arrastra cada separador</b> (o los bordes) a su barra. Toca un compás para sus opciones: <b>cambio de compás o de tempo desde ahí</b>, partirlo en dos, unirlo con el siguiente, borrar la fila o practicar desde ahí. Los compases se numeran solos y van pegados a su trozo de partitura si lo mueves.</li>
<li><b>▶ Práctica</b>: abre el panel de abajo. Toca un compás de la partitura para empezar desde él. <b>Bucle de N compases</b>, tempo y compás de la pieza. <span class="kbd">Espacio</span> toca o para.</li>
<li>Metrónomo exacto con <b>clic acentuado</b> en la primera parte. En «Opciones»: compases de <b>entrada</b> antes de empezar, compases de <b>preparación entre vueltas</b>, volumen y <b>subida de tempo</b> (empezar al 70 %, subir 5 % cada 2 vueltas hasta el 100 %…). El bucle sigue hasta que lo pares y cuenta las vueltas.</li>
<li>El cursor rojo recorre los compases y la página se desplaza sola a la línea que suena. Los compases no salen en el PDF exportado.</li>
</ul>
<h3>Fase 3: pautas, acordes y mástil</h3>
<ul>
<li><b>⬚ Zona (M)</b>, como la selección de Paint: marca un rectángulo sobre la partitura, una captura o lo que sea, y <b>arrástralo</b> para moverlo (con <span class="kbd">Ctrl</span> se copia). También <span class="kbd">Ctrl+C</span>, <span class="kbd">Ctrl+X</span>, <span class="kbd">Supr</span> o <span class="kbd">Ctrl+D</span> (copia encima). Cortar <b>quita de verdad</b>: deja un hueco en el original, sin rectángulos blancos ni copias superpuestas. Con <b>↖ Selec.</b>, arrastrar sobre la partitura sin elementos también marca una zona.</li>
<li><b>Alt+clic</b> selecciona lo que hay <b>debajo</b>; cada Alt+clic baja una capa más.</li>
<li><b>𝄚 Pauta</b>: tablatura, pentagrama o los dos, con compases, clave/TAB y hueco para acordes. Si hay algo seleccionado (un trozo de partitura) se pone <b>debajo y con su mismo ancho</b>. Arrastra la esquina: en horizontal cambia el ancho y en vertical la separación de las líneas, para cuadrarla con la partitura. Doble clic para cambiar compases, líneas, etc.</li>
<li><b>Traste (N)</b>: toca una línea de la tablatura, escribe el número en la cajita y Enter; sigue tocando para el siguiente. El número corta la línea como en una tablatura impresa. Toca uno ya escrito para cambiarlo, o <b>arrástralo</b> a lo largo de la cuerda o a otra cuerda (se encaja solo). Seleccionado, <span class="kbd">↑</span> <span class="kbd">↓</span> lo pasan a la cuerda de arriba o de abajo.</li>
<li><b>Fila de acordes</b>: selecciona una o varias pautas y pulsa el botón: se pone un <b>diagrama vacío e independiente en cada compás</b> (doble clic para rellenarlo). Si escribes nombres («Am G F E») se usan en orden. Sin pauta seleccionada, los nombres se reparten a lo ancho de la hoja. En la ventana de <b>Pauta</b> también puedes marcar «Diagramas de acordes vacíos (uno por compás)».</li>
<li><b>Mástil</b>: diagrama horizontal del mástil. Elige arriba el texto y el color de la marca y <b>toca casillas</b> para ponerlas (lo que cambies se aplica a la última marca tocada; tócala otra vez para quitarla), o <b>rellénalo</b> con una tríada, acorde o escala desde cualquier tónica, en todo el tramo o en una <b>forma CAGED</b> (C, A, G, E, D), con intervalos (R 3 5) o nombres de nota.</li>
<li><b>Ver notas</b>: panel con todas las notas del mástil para consultar mientras escribes; puede resaltar una escala o acorde e insertarlo en la hoja.</li>
<li><b>Plantillas</b>: «Nueva en blanco» y «+ Plantilla…» bajo cada hoja crean hojas con tablatura, pentagrama, ambos, <b>con diagramas de acordes vacíos en cada compás</b>, diagramas sueltos o mástiles en blanco, listas para imprimir con «Exportar PDF».</li>
<li><b>Zona</b> corta cualquier cosa que quede partida: partitura, capturas, pautas, mástiles, acordes, textos o trazos.</li>
<li><b>Importar PDF o pieza</b> (biblioteca): admite PDF y piezas guardadas <code>.ptbak</code>, varias a la vez o arrastrándolas. Si ya tienes una pieza, eliges sustituirla o añadirla como copia.</li>
</ul>
<h3>Fase 2: hojas y biblioteca</h3>
<ul>
<li><b>📑 Hojas</b> (arriba en el editor, o «Hojas…» en el menú ⋯ de la pieza): miniaturas de todas las hojas. Toca para seleccionar (Mayús = rango, Ctrl+A todas) y <b>arrastra</b> para cambiar el orden. Botones para añadir hojas <b>verticales u horizontales</b>, duplicar, girar hojas en blanco, eliminar, ◀ ▶ mover, <b>«Nueva pieza con estas…»</b> y <b>«Exportar PDF de estas»</b>. ↗ te lleva a esa hoja. Todo se deshace con Ctrl+Z.</li>
<li><b>✂ Dividir en piezas</b> (en Hojas, o «Separar en piezas…» en el menú ⋯): toca la primera hoja de cada canción. Los títulos se sugieren del texto más grande de la hoja (si el PDF tiene texto). Cada pieza nueva guarda <b>solo sus páginas</b>, con todo lo que hayas anotado.</li>
<li><b>Liberar espacio</b>: si borras o separas hojas, Hojas te avisa de las páginas del PDF que ya no se usan y las quita.</li>
<li><b>📋 Pegar desde fuera</b>: copia una imagen de una web, de un PDF o una captura (Win+Mayús+S) y pulsa Ctrl+V o «📋 Pegar». También pega texto. <b>🖼 Imagen</b> añade un archivo, y puedes arrastrar imágenes sobre la hoja.</li>
<li><b>Mover a hoja…</b> (barra de abajo al seleccionar): lleva lo seleccionado a otra hoja o a una nueva.</li>
<li><b>Biblioteca</b>: filtra tocando una etiqueta, ordena por fecha o título. El título de la pieza (arriba en el editor) también permite poner etiquetas.</li>
<li>Diagramas de acordes: el número de traste es más grande y está separado de la 6.ª cuerda.</li>
</ul>
<h3>Lo básico</h3>
<ul>
<li><b>Biblioteca</b>: cada partitura es una <i>pieza</i>. Importa uno o varios PDF (botón o arrastrándolos), o crea una pieza en blanco.</li>
<li><b>Todo se guarda solo</b> («Guardado ✓»). <b>🔒 Solo ver</b> bloquea la edición. <b>Exportar PDF</b>: vectorial y ligero, con enlaces en las etiquetas de bucle. Funciona sin conexión.</li>
</ul>
<h3>Herramientas de edición</h3>
<ul>
<li><b>↖ Selec. (V)</b>: toca un elemento para seleccionarlo y arrástralo. <b>Arrastra en una zona vacía</b> para seleccionar varios con un recuadro; <b>Mayús + clic</b> añade o quita. <span class="kbd">Ctrl+A</span> selecciona todo lo de la hoja. El círculo de la esquina cambia el tamaño (con un solo elemento seleccionado). Doble toque o <span class="kbd">Enter</span> para editar.</li>
<li>Al mover aparecen <b>guías rosas</b> que ajustan el elemento a los bordes y centros de los demás y de la hoja (pulsa <span class="kbd">Alt</span> mientras arrastras para moverlo sin ajustar). Mayús = solo horizontal o vertical.</li>
<li><b>Arrastrar a otra hoja</b>: suelta lo seleccionado sobre otra hoja y pasa a ella.</li>
<li><b>T Texto (T)</b>, <b>✎ Lápiz (P)</b> a mano alzada, <b>╱ Línea (L)</b>, <b>➚ Flecha (F)</b> y <b>◯ Elipse (O)</b> para rodear (Mayús = círculo).</li>
<li><b>▭ Tapar (R)</b>: rectángulo del color «Tapar». <b>⌫ Borrador (B)</b>: como el de Paint, pinta del color «Tapar» con el tamaño «Borrador». Lo borrado se puede seleccionar y eliminar después.</li>
<li><b>⬚ Zona (M)</b>: rodea un trozo de la partitura o de una captura y arrástralo (Ctrl = copia), o usa Ctrl+C / Ctrl+X / Supr. El trozo pasa a ser un elemento que puedes mover, cambiar de tamaño o llevar a otra hoja; en el PDF exportado sigue siendo vectorial.</li>
<li><b>Copiar / Cortar / Pegar</b> (<span class="kbd">Ctrl+C</span>, <span class="kbd">Ctrl+X</span>, <span class="kbd">Ctrl+V</span>): funciona entre hojas y entre piezas distintas. Se pega en la hoja que estás viendo.</li>
<li><b>Texto, Grosor, Color, Tapar y Borrador</b>: si hay algo seleccionado, el cambio se aplica a lo seleccionado al momento; si no, es el valor para lo próximo que dibujes.</li>
<li>Bajo cada hoja: <b>+ Hoja vertical</b>, <b>+ Hoja horizontal</b> y <b>Eliminar hoja</b> (se puede deshacer).</li>
<li><b>Acordes ▾</b>, <b>Nuevo acorde</b>, <b>Dedo 1-4</b>, <b>Bucle</b> y <b>Técnica ▾</b>: elige y toca la página para colocar.</li>
</ul>
<h3>Atajos</h3>
<ul>
<li><span class="kbd">Ctrl+Z</span> / <span class="kbd">Ctrl+Y</span> deshacer / rehacer · <span class="kbd">Ctrl+D</span> duplicar · <span class="kbd">Supr</span> eliminar · <span class="kbd">Esc</span> cancelar</li>
<li>Herramientas: V selec. · M zona · T texto · N traste · C compases · P lápiz · L línea · F flecha · O elipse · R tapar · B borrador</li>
<li><span class="kbd">Espacio</span> tocar / parar (con la práctica abierta)</li>
<li><span class="kbd">Alt+clic</span> seleccionar lo de debajo</li>
<li>Flechas: mover 1 pt (con <span class="kbd">Mayús</span> 5 pt)</li>
</ul>
<h3>Copias</h3>
<p>En <b>Más → Copias</b>: copia completa en un archivo <code>.ptbak</code> (los PDF van dentro en binario, sin inflar). Cada pieza se puede exportar sola desde su menú ⋯. Al entrar, la app te propone copia según lo que configures en Ajustes.</p>
<h3>Aún no está (llega en las siguientes fases)</h3>
<ul>
<li>Fase 5: copias a Drive. Fase 6: atril en tablet y móvil con pedal Bluetooth.</li>
</ul>
</section>`;
