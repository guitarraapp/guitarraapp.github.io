// Texto de ayuda (estático, sin datos del usuario)
export const HELP_HTML = `
<section class="panel help">
<h3>Qué hay en esta versión (fase 0: cimientos)</h3>
<ul>
<li><b>Biblioteca</b>: cada partitura es una <i>pieza</i>. Importa uno o varios PDF (botón o arrastrándolos), o crea una pieza en blanco. Búsqueda, favoritas ★ y etiquetas (menú ⋯ de cada pieza).</li>
<li><b>Vista continua</b>: todas las páginas una debajo de otra, siempre nítidas a cualquier zoom (Ctrl + rueda, Ctrl +/−, «Ajustar»).</li>
<li><b>Todo se guarda solo</b> (arriba verás «Guardado ✓»). No hay botón de guardar.</li>
<li><b>Coordenadas en puntos de página</b>: lo que anotas no se mueve aunque cambies el zoom o la pantalla.</li>
<li><b>🔒 Solo ver</b>: bloquea la edición; tocar una etiqueta de bucle abre su vídeo.</li>
<li><b>+ Hoja</b>: añade una hoja A4 en blanco al final (el organizador de páginas llega en la fase 2).</li>
<li><b>Exportar PDF</b>: vectorial y ligero; las etiquetas de bucle quedan como enlaces.</li>
<li><b>Funciona sin conexión</b> una vez abierta (se puede instalar como app).</li>
</ul>
<h3>Herramientas de edición</h3>
<ul>
<li><b>↖ Selec. (V)</b>: toca un elemento para seleccionarlo y arrástralo para moverlo. El círculo de la esquina cambia el tamaño. Doble toque o <span class="kbd">Enter</span> para editarlo. Mayúsculas al arrastrar = solo horizontal o vertical.</li>
<li><b>T Texto (T)</b>: toca donde quieras y escribe; <span class="kbd">Enter</span> guarda, <span class="kbd">Esc</span> cancela.</li>
<li><b>╱ Línea (L)</b> y <b>▭ Tapar (R)</b>: arrastra. «Tapar» sirve para borrar errores del PDF con un rectángulo del color elegido (blanco por defecto).</li>
<li><b>Acordes ▾</b>: biblioteca con buscador. <b>Nuevo acorde</b>: editor con nombre, texto debajo (p. ej. <i>[E]-[C]</i>), traste inicial, nº de trastes, puntos negros/huecos y cejillas.</li>
<li><b>Dedo 1-4</b>, <b>Bucle</b> y <b>Técnica ▾</b>: elige y toca la página para colocar.</li>
<li>Al cambiar <b>Texto, Grosor o Color</b> con algo seleccionado, se aplica a ese elemento.</li>
</ul>
<h3>Atajos</h3>
<ul>
<li><span class="kbd">Ctrl+Z</span> / <span class="kbd">Ctrl+Y</span> deshacer / rehacer (de toda la pieza) · <span class="kbd">Ctrl+D</span> duplicar · <span class="kbd">Supr</span> eliminar</li>
<li>Flechas: mover 1 pt (con <span class="kbd">Mayús</span> 5 pt) · <span class="kbd">Esc</span>: cancelar / deseleccionar</li>
</ul>
<h3>Copias</h3>
<p>En <b>Más → Copias</b>: copia completa en un archivo <code>.ptbak</code> (los PDF van dentro en binario, sin inflar). Cada pieza se puede exportar sola desde su menú ⋯. Al entrar, la app te propone copia según lo que configures en Ajustes.</p>
<h3>Aún no está (llega en las siguientes fases)</h3>
<ul>
<li>Fase 1: selección múltiple, copiar/pegar, recortes de la partitura original y guías.</li>
<li>Fase 2: organizador de páginas, separar recopilaciones.</li>
<li>Fase 3: plantillas de pautas, filas de acordes escribiendo «Am G F E», mástil.</li>
<li>Fase 4: modo práctica con cursor y metrónomo (mientras, usa la v10).</li>
</ul>
</section>`;
