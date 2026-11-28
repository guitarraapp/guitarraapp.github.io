# Partituras 11.4 · Fase 4 (compases y práctica): cómo probarla

## Cómo instalarla
1. En GitHub, entra en `editorpartituras` y pulsa **⋯ → Delete directory → Commit changes**.
2. Descomprime el zip. La carpeta ya se llama **`editorpartituras`**.
3. En la página principal del repositorio, pulsa **Add file → Upload files**, **arrastra la carpeta entera** y pulsa **Commit changes**.
4. Espera 1 o 2 minutos y abre `https://guitarraapp.github.io/editorpartituras/js/util.js`. En la segunda línea debe poner **11.4.0-f4**.
5. Abre la app y pulsa **Actualizar** (o Más → Ajustes → Forzar actualización).

Hay un archivo nuevo, `js/practice.js`. Tus piezas no se tocan.

---

## 1. Marcar los compases
1. Abre una partitura y elige **Compases** (tecla **C**).
2. **Arrastra un rectángulo** sobre la primera línea, desde un poco antes de la primera barra hasta un poco después de la última y cubriendo el pentagrama o la tablatura.
   - Si es una **pauta de la app** o un **PDF con barras claras**, te dice «He encontrado N compases» y los coloca en las barras. Acepta.
   - Si no, escribe cuántos compases tiene la línea y se reparten a partes iguales.
3. Repite con cada línea. Los compases se **numeran solos**: hoja a hoja, de arriba abajo y, si hay dos filas a la misma altura, de izquierda a derecha.
4. **Ajustar**: arrastra cada separador azul a su barra de compás. Los bordes izquierdo y derecho también se arrastran. Arrastrar el interior de la fila la mueve entera.
5. **Toca un compás** (sin arrastrar) para sus opciones:
   - **Desde aquí, compás**: por ejemplo `3/4`, para un cambio a mitad de pieza.
   - **Desde aquí, tempo**: por ejemplo `90`.
   - El cambio se ve en naranja dentro del compás.
   - **Partir en dos**, **Unir con el siguiente**, **Borrar la fila** y **Practicar desde aquí**.
6. Los compases solo se ven con la herramienta Compases o con la práctica abierta. **No salen en el PDF exportado.**
7. Si mueves un trozo de partitura (con Zona o con Selec.), sus compases se mueven con él.

## 2. Practicar
1. Pulsa **▶ Práctica**. Abajo se abre el panel y la partitura muestra los compases.
2. **Toca un compás** de la partitura: será el inicio. Se resalta en naranja.
3. Marca **Bucle de** y escribe cuántos compases, por ejemplo 2. Se resalta el tramo.
4. Ajusta **Tempo** y **Compás** de la pieza. El tempo cuenta la figura de abajo del compás: la negra en 4/4 y la corchea en 6/8.
5. En **Opciones**:
   - **Entrada**: compases de clics antes de empezar (de 0 a 4).
   - **Entre vueltas**: compases de clics para prepararte antes de repetir.
   - **Volumen**.
   - **Subir el tempo en el bucle**: empezar al __ %, subir __ % cada __ vueltas hasta el __ %.
6. Pulsa **▶ Tocar** o la **barra espaciadora**:
   - Durante la entrada, el panel dice «Entrada: 1 de 4…» y el compás de inicio parpadea.
   - Después, el **cursor rojo** recorre los compases y la página se desplaza sola a la línea que suena.
   - Entre vueltas, el panel dice «Prepárate para la vuelta 2…».
   - El panel muestra el compás, el tempo real, la vuelta y el %, con puntos para cada pulso.
   - El primer clic de cada compás suena **más agudo y fuerte**. En 6/8, 9/8 y 12/8 también se marca cada grupo de tres.
7. **Espacio** o **■ Parar** para terminar. Sin bucle, se para solo al final de la pieza.
8. Los ajustes de práctica se guardan con la pieza y viajan en las copias.

## 3. Comprobaciones rápidas
- [ ] Junto a «Partituras» pone 11.4.0-f4.
- [ ] Una hoja con plantilla de tablatura: Compases sobre una línea propone 4 compases exactos.
- [ ] En un PDF real: la propuesta de barras acierta o se corrige rápido arrastrando los separadores.
- [ ] Cambio a 3/4 en un compás: al tocar, ese compás dura 3 clics.
- [ ] Bucle de 2 compases con 2 de entrada y 1 entre vueltas: se oye la preparación entre cada vuelta.
- [ ] Subida de tempo 70 % → 100 %, +10 % cada vuelta: el panel muestra 70, 80, 90 y 100 %.
- [ ] La página sigue al cursor al cambiar de línea y de hoja.
- [ ] Exportar PDF: no aparecen los compases.

## 4. Pendiente
- **Etiqueta de bucle → app de bucles en el loop exacto**: necesito el código actual de tu app de bucles (`loop/index.html`) para que acepte abrirse en un vídeo y un loop concretos. Mientras tanto, la etiqueta abre el vídeo de la pieza como antes.

Si algo no va como esperas, apúntalo en **Más → Ideas de mejora** o cuéntamelo con una captura.
