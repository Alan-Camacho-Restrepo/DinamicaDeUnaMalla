Visitar la simulación aquí: https://dinamica-de-una-malla.vercel.app/

Descripción de la física de la simulación.

La simulación física interactiva que representa una malla flexible, como una tela, utilizando p5.js para
la visualización. Aquí hay una descripción detallada de la física y la lógica detrás de la simulación:

1. Entorno de Simulación y Partículas:
- La simulación opera en un espacio bidimensional representado por el lienzo (canvas) de p5.js.
- Cada punto de la malla se modela como una partícula con propiedades físicas como posición,
velocidad (inferida de las posiciones actuales y anteriores), y masa (usando masa inversa para manejar
objetos inmóviles).
- Las partículas pueden interactuar entre sí mediante restricciones que simulan las fuerzas de tensión
en una tela.

2. Fuerzas y Movimiento:
- La gravedad es una fuerza constante aplicada a todas las partículas, influenciando su movimiento a
lo largo del eje Y.
- La simulación permite la interacción del usuario, donde las partículas pueden ser arrastradas,
emulando una fuerza externa aplicada.

3. Restricciones y Tela:
- La "tela" se crea conectando partículas adyacentes con restricciones que simulan la conexión física
entre ellas, como hilos en una tela.
- Estas restricciones están diseñadas para mantener una distancia fija entre cada par de partículas
conectadas, simulando la propiedad de la tela de resistir la compresión y la expansión.
- Cuando una partícula se mueve, afecta a las partículas conectadas, lo que puede llevar a una
reacción en cadena de movimientos en la tela, un fenómeno conocido como propagación de
restricciones.

4. Detección de Colisiones y Respuesta:
- La simulación incluye una forma básica de detección de colisiones, evitando que las partículas se
muevan fuera de los límites del lienzo.
- Cuando una partícula alcanza el borde, su movimiento se ajusta para permanecer dentro de los
límites, y se aplica fricción si toca el borde inferior.

5. Renderización y Visualización:
- La malla se visualiza dibujando líneas entre partículas conectadas y opcionalmente las propias
partículas como cuadrados.
- La cuadrícula en el fondo es puramente para referencia visual y no afecta la física de la simulación.
- Hay opciones para visualizar información de depuración, como la cantidad de partículas y
restricciones, y los valores de fuerzas aplicadas como la gravedad.

6. Interactividad y Control del Usuario:
- Los usuarios pueden interactuar con la simulación arrastrando partículas, pausando la simulación, y
ajustando parámetros como la gravedad y las dimensiones de la tela.
- Estos controles permiten al usuario experimentar con diferentes comportamientos físicos y observar
cómo la tela responde a varias condiciones y fuerzas.
