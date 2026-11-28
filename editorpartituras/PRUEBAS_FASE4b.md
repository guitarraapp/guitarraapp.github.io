# Partituras 11.5 · Fase 4b (repeticiones, saltos, cursor por pulsos, rasgueos y cajas): cómo probarla

## Cómo instalarla
1. En GitHub, entra en `editorpartituras` y pulsa **⋯ → Delete directory → Commit changes**.
2. Descomprime el zip. La carpeta ya se llama **`editorpartituras`**.
3. En la página principal del repositorio, pulsa **Add file → Upload files**, **arrastra la carpeta entera** y pulsa **Commit changes**.
4. Espera 1 o 2 minutos y abre `https://guitarraapp.github.io/editorpartituras/js/util.js`. En la segunda línea debe poner **11.5.0-f4b**.
5. Abre la app y pulsa **Actualizar** (o Más → Ajustes → Forzar actualización).

Hay dos archivos nuevos, `js/music.js` y `js/tools4.js`. Tus piezas no se tocan: los bucles que ya tenías siguen igual.

---

## 1. Cajas de acordes (tus apuntes de Perfidia)
1. Crea una pieza **Nueva en blanco** (o abre una hoja vacía).
2. Pulsa **▦ Cajas** (grupo de Acordes).
   - **Texto encima**: `SOLO INTRO`.
   - **Acordes, una caja tras otra**: `Do/Lam Rem/Sol`. El número de cajas se pone solo (2).
   - Mira la **vista previa** y pulsa **Colocar**.
3. Con esa fila **todavía seleccionada**, pulsa otra vez **▦ Cajas**: la nueva fila va **debajo y con el mismo ancho**.
   - `INTRO CANTADA` · `Dom/Do7 Fam Sol7 Dom Do7 Fam Re7 Sol#/Sol7`
4. Sigue igual con las estrofas:
   - `ESTROFA I (Mujer…)` · `Do/Lam Rem/Sol7 Do/Lam Rem/Sol7 Do/Lam Rem Mi Rem/Sol7`
   - `ESTROFA III (Te he buscado…)` · `Rem Rem Mi Mi Rem Fa Mi Sol7`
5. Reglas del texto rápido:
   - **Espacio** separa una caja de la siguiente.
   - **`/`** pone dos acordes en la misma caja con **diagonal** (el de arriba a la izquierda suena primero). Con tres o cuatro (`Rem/Mi/Fa/Sol`) salen en **columnas**.
   - **`-`** deja la caja vacía y **`%`** repite la anterior.
6. **Doble clic en una caja** (con Selec.):
   - Elige el tipo con los dibujos: un acorde, dos con diagonal, dos, tres o cuatro en columnas.
   - Escribe los acordes (te sugiere los de tu biblioteca).
   - **Nota pequeña**: por ejemplo `(1 vez)`, como en la última caja de Perfidia.
   - Con **◀ Anterior / Siguiente ▶** pasas a la caja de al lado sin cerrar la ventana.
7. **Doble clic en el texto de encima** (o botón **Editar**): ventana de la fila entera (texto, número de cajas, alto, todos los acordes de golpe, rasgueos).
8. La esquina de la fila cambia el ancho y el alto. Ctrl+D la duplica.

**Comprueba**: la diagonal va de abajo a la izquierda hacia arriba a la derecha, como en tu cuaderno, y los nombres no se salen de las cajas.

## 2. Rasgueos
### Figura suelta
1. Pulsa **↓↑ Rasgueo**.
2. Elige el **compás** (4/4, 3/4, 2/4, 6/8…) y las **casillas** (corcheas = un par ↓↑ por pulso).
3. Toca cada casilla: **↓ → ↑ → ✕ (apagado) → nada**. Clic derecho va al revés.
   - También puedes escribir `D-DU-UDU` (D abajo, U arriba, X apagado, - nada).
   - O elegir un patrón en **Patrones ▾**.
4. **Guardar en mis rasgueos**: le pones nombre (por ejemplo «Bolero») y aparece en «Mis rasgueos» en todas tus piezas.
5. «Poner el conteo debajo» añade `1 y 2 y 3 y 4 y`.
6. Pulsa **Colocar** y toca la hoja. Doble clic para editarla; la esquina cambia el tamaño.

**Comprueba**: solo se dibujan las flechas que se tocan; las casillas vacías no dejan nada.

### Rasgueo debajo de las cajas
1. Doble clic en una caja → marca **Poner un rasgueo debajo de esta caja** y elige las flechas.
2. Marca **Usar este rasgueo en todas las cajas de la fila** si es el mismo en toda la línea.
3. Desde la ventana de la fila también puedes elegir **El mismo rasgueo en todas las cajas** o **Sin rasgueos**, y el conteo debajo.

## 3. Repeticiones y saltos
1. Elige **Compases** (tecla **C**) y **toca un compás**: de una fila de compases sobre la partitura o de una caja.
2. La ventana tiene cuatro apartados:
   - **Compás y tempo**: cambios desde ese compás, como antes.
   - **Repeticiones**: ‖: inicio, :‖ final con el número de **veces**, **casilla de vez** y **%** (igual que el anterior).
   - **Saltos**: Segno, Coda (empieza la coda), To Coda, Fine y, al final del compás, D.C., D.C. al Fine, D.C. al Coda, D.S., D.S. al Fine o D.S. al Coda.
   - **Calderón** (pulsos de más) y **rit. / accel.** (durante cuántos compases y hasta qué %).
3. Prueba con SOLO INTRO de Perfidia: toca la 2.ª caja, marca **:‖ Termina la repetición** con 2 veces y guarda. Aparece **:‖** y **×2**, como en tu cuaderno.
4. **Casillas de 1.ª y 2.ª vez**: escribe `1` en el compás (o compases) de la primera vez y `2` en los de la segunda. Si una casilla ocupa varios compases, pon el mismo número en todos.
5. Los símbolos se dibujan sobre la partitura y salen en el **PDF exportado**.
   - En un PDF que ya los trae impresos, desmarca **Dibujar los símbolos de esta fila**: no se dibujan, pero siguen valiendo para tocar (con Compases o la práctica abierta se ven en gris).

## 4. Tocar la pieza de principio a fin
1. Abre **▶ Práctica**. En el desplegable de al lado de «Desde el compás» elige:
   - **Bucle de N compases**: como en la 11.4.
   - **Hasta el final, con repeticiones y saltos**.
   - **Hasta el final, sin repeticiones**: cada compás una vez.
2. Con repeticiones, debajo aparece el **orden real** de la pieza (por ejemplo `1–2, 1–18`). Comprueba que es el que esperas.
3. Pulsa **▶ Tocar** (o espacio). El cursor salta donde toca, también a otra hoja.
   - Al volver con D.C. o D.S. no se repite y se toca la última casilla (lo habitual). En **Opciones** puedes pedir que sí se repita.
   - El **calderón** espera los pulsos de más sin clics. Con **rit.** el tempo baja poco a poco y luego vuelve.
4. Si empiezas desde un compás que se toca varias veces, empieza por la primera vez que suena.

## 5. Cursor por pulsos
1. En **Cursor**, elige **Pulsos: avanza a saltos con cada clic**.
2. Elige un color pastel (amarillo, verde, azul, rosa, naranja o lila).
3. Toca: el compás se divide en sus partes (3 en 3/4, 4 en 4/4, 6 en 6/8) y una franja traslúcida salta con cada clic. Las notas y los números de la tablatura se siguen viendo debajo.
4. Prueba un compás con cambio a 3/4: la franja pasa a ocupar un tercio del compás.
5. El cursor de línea sigue disponible; la elección se guarda con la pieza.

## 6. Técnica ▾
Nuevas marcas que solo se dibujan: P.M., let ring, vib., gliss., tr, rasg., Tambora, Golpe, Puente y Final. Las repeticiones y saltos ya no van aquí, sino en Compases, porque cambian lo que suena.

---

## Revisión automática hecha (en Chrome)
- Cajas: texto rápido, diagonal, columnas, «%» y «-», fila debajo de la seleccionada, doble clic en una caja, ◀ ▶, nota pequeña, rasgueo por caja y en toda la fila.
- Rasgueo suelto: patrones, colocar, editar.
- Orden de reproducción comprobado con repeticiones simples, repetición ×3, casillas 1.ª/2.ª, casillas «1,2» y «3», D.C. al Fine, D.S. al Coda y D.C. con y sin repeticiones al volver.
- Práctica con repeticiones sobre cajas y sobre una pauta con compases; cambio a 3/4 con cursor por pulsos; rit.; calderón.
- PDF exportado con cajas, rasgueos y símbolos (vectorial). Copias: las piezas nuevas salen idénticas al restaurarlas.
- Pauta, fila de acordes, mástil, duplicar, deshacer, organizador, biblioteca: siguen bien. Sin errores en la consola.
- Corregido de paso: al marcar compases sobre una pauta de la app, la clave contaba como un compás.
