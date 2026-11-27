// Texto de ayuda (estático, sin datos del usuario)
export const HELP_HTML = `
<section class="panel help">
<h3>Novedades de la fase 2: hojas y biblioteca</h3>
<ul>
<li><b>📑 Hojas</b> (arriba en el editor, o «Hojas…» en el menú ⋯ de la pieza): miniaturas de todas las hojas. Toca para seleccionar (Mayús = rango, Ctrl+A todas) y <b>arrastra</b> para cambiar el orden. Botones para añadir hojas <b>verticales u horizontales</b>, duplicar, girar hojas en blanco, eliminar, ◀ ▶ mover, <b>«Nueva pieza con estas…»</b> y <b>«Exportar PDF de estas»</b>. ↗ te lleva a esa hoja. Todo se deshace con Ctrl+Z.</li>
<li><b>✂ Dividir en piezas</b> (en Hojas, o «Separar en piezas…» en el menú ⋯): toca la primera hoja de cada canción. Los títulos se sugieren del texto más grande de la hoja (si el PDF tiene texto). Cada pieza nueva guarda <b>solo sus páginas</b>, con todo lo que hayas anotado.</li>
<li><b>Liberar espacio</b>: si borras o separas hojas, Hojas te avisa de las páginas del PDF que ya no se usan y las quita.</li>
<li><b>Copiar / Cortar zona en cualquier hoja</b>: copia lo que se ve en la zona (partitura, recortes, imágenes, tapados y lo anotado dentro), también en hojas en blanco donde pegaste trozos.</li>
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
<li>Al mover aparecen <b>guías rosas</b> que ajustan el elemento a los bordes y centros de los demás y de la hoja (mantén <span class="kbd">Alt</span> para moverlo sin ajustar). Mayús = solo horizontal o vertical.</li>
<li><b>Arrastrar a otra hoja</b>: suelta lo seleccionado sobre otra hoja y pasa a ella.</li>
<li><b>T Texto (T)</b>, <b>✎ Lápiz (P)</b> a mano alzada, <b>╱ Línea (L)</b>, <b>➚ Flecha (F)</b> y <b>◯ Elipse (O)</b> para rodear (Mayús = círculo).</li>
<li><b>▭ Tapar (R)</b>: rectángulo del color «Tapar». <b>⌫ Borrador (B)</b>: como el de Paint, pinta del color «Tapar» con el tamaño «Borrador». Lo borrado se puede seleccionar y eliminar después.</li>
<li><b>✂ Cortar zona (X)</b>: rodea un trozo de la partitura (por ejemplo una línea entera) y se convierte en un objeto que puedes mover, cambiar de tamaño o llevar a otra hoja. Donde estaba queda en blanco. <b>⧉ Copiar zona (C)</b>: igual pero sin quitar el original. En el PDF exportado siguen siendo vectoriales.</li>
<li><b>Copiar / Cortar / Pegar</b> (<span class="kbd">Ctrl+C</span>, <span class="kbd">Ctrl+X</span>, <span class="kbd">Ctrl+V</span>): funciona entre hojas y entre piezas distintas. Se pega en la hoja que estás viendo.</li>
<li><b>Texto, Grosor, Color, Tapar y Borrador</b>: si hay algo seleccionado, el cambio se aplica a lo seleccionado al momento; si no, es el valor para lo próximo que dibujes.</li>
<li>Bajo cada hoja: <b>+ Hoja vertical</b>, <b>+ Hoja horizontal</b> y <b>Eliminar hoja</b> (se puede deshacer).</li>
<li><b>Acordes ▾</b>, <b>Nuevo acorde</b>, <b>Dedo 1-4</b>, <b>Bucle</b> y <b>Técnica ▾</b>: elige y toca la página para colocar.</li>
</ul>
<h3>Atajos</h3>
<ul>
<li><span class="kbd">Ctrl+Z</span> / <span class="kbd">Ctrl+Y</span> deshacer / rehacer · <span class="kbd">Ctrl+D</span> duplicar · <span class="kbd">Supr</span> eliminar · <span class="kbd">Esc</span> cancelar</li>
<li>Herramientas: V selec. · T texto · P lápiz · L línea · F flecha · O elipse · R tapar · B borrador · X cortar zona · C copiar zona</li>
<li>Flechas: mover 1 pt (con <span class="kbd">Mayús</span> 5 pt)</li>
</ul>
<h3>Copias</h3>
<p>En <b>Más → Copias</b>: copia completa en un archivo <code>.ptbak</code> (los PDF van dentro en binario, sin inflar). Cada pieza se puede exportar sola desde su menú ⋯. Al entrar, la app te propone copia según lo que configures en Ajustes.</p>
<h3>Aún no está (llega en las siguientes fases)</h3>
<ul>
<li>Fase 3: plantillas de pautas, filas de acordes escribiendo «Am G F E», mástil.</li>
<li>Fase 4: modo práctica con cursor y metrónomo (mientras, usa la v10).</li>
</ul>
</section>`;
