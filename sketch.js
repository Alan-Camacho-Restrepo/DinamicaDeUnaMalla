// Variables para las condiciones de la malla
const SIZE = 5;
// Dibujar cada particula como cuadrado, con valor de lado SIZE
const SIZE_D2 = SIZE / 2.0;
const STEPS = 4;

const TTYPE_DRAG = 0;

// Tamaño de cuadricula del fondo de pagina
const GRID_SIZE = 40;

// Variable que se usaran inicializadas como nulos
var grid_w, grid_h;
var grid = null;

var particles = null;
var constraints = null;
var physics = null;

// Valores de pasos para simular la gravedad 
var initGravityX = 0;
var initGravityY = 0.1;
var gravity = null;

var pointDragging = false;
var dragDist = 150;
var currP = null;

var drawFill = true;
var drawPoints = false;
var showDebugText = true;
var mouseInsideSketch = true;
var isPaused = false;
var toolType = TTYPE_DRAG;

// Parametros de la malla
let clothWidth = 25;
let clothHeight = 20;
let clothSpacing = 16;
let clothConstraintLength = 20;
let clothAttachPoints = 1;

let clothXMargin = null;

// Funcion que es ejecutado una vez cuando el programa empieza.
function setup() {
	// Crear un lienzo en canvas, con ancho y altura como parametros
	let canvas = createCanvas(windowWidth, windowHeight);
	// Lienzo en el elemento HTML que tiene id 'sketch'
	canvas.parent("#sketch");
	// Este atributo asegura que cuando un usuario hace click derecho en el canvas, 
	// no se despliega el menú contextual del navegador.
	canvas.attribute('oncontextmenu', 'return false;');

	init();
	initSettingsUI();
}

// Corre continuamente de arriba abajo hasta que el programa es detenido.
function draw() {
	// Color del fondo en el canvas
	background(125);
	// Actualizacion de las posiciones de cada particula
	updateParticles();
	for (let i = 0; i < STEPS; i++) {
		updateConstraints();
		constrainPoints();
	}
	
	buildGrid();
	
	// Comportamiento de arrastre de puntos en la simulación
	if (pointDragging) {
		if (currP) {
			// Establece la coordenada x, y de la partícula actual 
			// a la posición horizontal y vertical del cursor del ratón
			currP.x = mouseX;
			currP.y = mouseY;
		} else {
			currP = getParticleAt(mouseX, mouseY);
		}
	} else {
		currP = null;
	}

	// Color de lineas
	stroke(100);
	// Lineas verticales
	for (let x = 0; x < grid_w; x++) {
		line(x * GRID_SIZE, 0, x * GRID_SIZE, height);
	}
	// Lineas horizontales
	for (let y = 0; y < grid_h; y++) {
		line(0, y * GRID_SIZE, width, y * GRID_SIZE);
	}
	
	// Lineas negras de las ligaduras entre las particulas
	stroke(0);
	for (let i = 0; i < constraints.length; i++) {
		let c = constraints[i];
		line(c.p1.x, c.p1.y, c.p2.x, c.p2.y);
	}
	noStroke();

	// Dibujar las particulas amarillas si se activa drawPoints
	if (drawPoints) {
		fill(255, 255, 0);
		for (let i = 0; i < particles.length; i++) {
			rect(particles[i].x - SIZE_D2, particles[i].y - SIZE_D2,  SIZE, SIZE);
		}
	}

	// Mostrar parametros de la malla en pantalla
	if (showDebugText) {
		fill(255);
		text('Particulas: ' + particles.length + ' | Ligaduras: ' + constraints.length, 12, 12);
		text('Gravedad: ' + gravity.x + ', ' + gravity.y, 12, 24);
		text('Arrastrando: ' + pointDragging, 12, 38);
	}
}

function init() {
	grid = []
	// Arreglo para contener cada particula de la malla
	particles = [];
	// Arreglo con las ligaduras para cada particula de la malla
	constraints = [];
	// bodies = [];

	// Manejar la simulacion fisica
	physics = new Physics();
	// Vector de fuerza de la gravedad
	gravity = createVector(initGravityX, initGravityY);
	// Calcula el margen horizontal  
	// necesario para centrar el tejido (cloth) en el lienzo.
	clothXMargin = (width - (clothWidth * clothSpacing)) / 2;
	
	// Crear mallas con los arreglos de particulas y ligaduras
	createClothSim();
	// Ligaduras para la malla
	constrainPoints();

}

function mousePressed() {
	// verifica si el evento de clic del mouse ocurrió fuera del área 
	// del lienzo o si el cursor del mouse está fuera de los límites del lienzo
	if (!mouseInsideSketch ||
		mouseX < 0 || mouseX >= width ||
		mouseY < 0 || mouseY >= height)
		return;
	
	if (isPaused)
		redraw();
}

// Se activa cuando el usuario arrastra el mouse
function mouseDragged() {
	if (!mouseInsideSketch ||
		mouseX < 0 || mouseX >= width ||
		mouseY < 0 || mouseY >= height)
		return;

	if (toolType == TTYPE_DRAG) {
		pointDragging = true;
	}
}

function mouseReleased() {
	mouseInsideSketch = true;
	// Esto indica que se ha dejado de arrastrar un punto en la simulación.
	pointDragging = false;
}

// Esta funcion redimensiona el lienzo al tamaño de la ventana del 
// navegador (windowWidth y windowHeight). Esto asegura que el lienzo 
// siempre tenga el mismo tamaño que la ventana del navegador.
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	buildGrid();
}


/*
La función buildGrid se encarga de crear una 
cuadrícula espacial para organizar las partículas en la simulación
y organiza las partículas en una cuadrícula espacial para facilitar 
la detección de colisiones y otras interacciones entre las partículas en 
la simulación
*/
function buildGrid() {
	grid = [];
	grid_w = Math.ceil(width / GRID_SIZE);
	grid_h = Math.ceil(height / GRID_SIZE);
	// Itera a través de todas las celdas de la cuadrícula
	for (let i = 0; i < grid_w * grid_h; i++)
		grid.push([]);
	
	for (let i = 0; i < particles.length; i++) {
		// Coordenadas de la celda en la que se encuentra la partícula actual 
		let cx = floor(particles[i].x / GRID_SIZE);
		let cy = floor(particles[i].y / GRID_SIZE);
		// Por fuera de los límites de la cuadrícula
		if (cx < 0 || cx >= grid_w || cy < 0 || cy >= grid_h)
			continue;
		// Agrega la partícula actual a la celda correspondiente en la cuadrícula
		grid[cx + cy * grid_w].push(particles[i]);
	}
}

/*
 Esta función busca y devuelve la partícula más cercana a una posición (x, y) 
 dada, utilizando una estructura de cuadrícula para acelerar la búsqueda. 
 Si ninguna partícula está lo suficientemente cerca, la función retorna null
*/

function getParticleAt(x, y) {
	let cx = floor(x / GRID_SIZE);
	let cy = floor(y / GRID_SIZE);
	// Itera sobre las celdas circundantes a la celda calculada en el paso anterior.
	for (let x0 = cx - 1; x0 < cx + 1; x0++) {
		for (let y0 = cy - 1; y0 < cy + 1; y0++) {
			if (x0 < 0 || x0 >= grid_w || y0 < 0 || y0 >= grid_h)
				continue;
			// Obtiene la lista de partículas en la celda actual
			let cell = grid[x0 + y0 * grid_w];
			for (let i = 0; i < cell.length; i++) {
				// Distancia en las coordenadas x e y entre la partícula actual y el punto dado 
				let pDistX = (cell[i].x - x);
				let pDistY = (cell[i].y - y);
				if (pDistX * pDistX + pDistY * pDistY < dragDist)
					return cell[i];
			}
		}
	}
	// Si no se encuentra ninguna partícula en la ubicación dada, la función retorna null.
	return null;
}

// Función responsable de actualizar la posición de las partículas en la simulación.
function updateParticles() {
	for (let i = 0; i < particles.length; i++) {
		let p = particles[i];
		let old_x = p.x;
		let old_y = p.y;
		
		// Particulas con masa inversa mayor a 0, no inmoviles
		if (p.invmass > 0) {
			// Simulacion de la influencia de la gravedad en cada particula
			p.x += gravity.x;
			p.y += gravity.y;
			// Actualizacion de la posicion al sumar la diferencia entre
			// su posicion actual y su posicion anterior
			p.x += (p.x - p.px);
			p.y += (p.y - p.py);
		}
		p.px = old_x;
		p.py = old_y;
	}
}


/*
Esta funcion aplica fuerzas a las partículas conectadas por la restricción 
para mantener la restricción a la longitud deseada. Si la restricción está estirada, 
aplica una fuerza para acortarla, y si está comprimida, aplica una fuerza para alargarla. 
Esto contribuye a la simulación del comportamiento físico de la tela u otro material flexible 
en la simulación.
*/ 

function updateConstraints() {
	for (let i = 0; i < constraints.length; i++) {
		let c = constraints[i];
		// Verifica si alguna de las partículas asociadas 
		// a la restricción (p1 o p2) es null
		if (!c.p1 || !c.p2)
			continue;
		
		// Calcula las diferencias en coordenadas 
		// x e y entre las dos partículas conectadas por la restricción.
		let dx = c.p1.x - c.p2.x;
		let dy = c.p1.y - c.p2.y;
		// Si ambas diferencias son cero (lo que significa que las partículas están en la misma posición), 
		// se les agrega una pequeña cantidad aleatoria para evitar divisiones por cero en cálculos posteriores.
		if (dx == 0 && dy == 0) {
			dx += Math.random() * 0.1;
			dy += Math.random() * 0.1;
		}
		
		// Cuadrado de la distancia entre las dos partículas conectadas por la restricción.
		let dSq = (dx * dx) + (dy * dy);
		if (!c.pushing && dSq < c.lSq)
			continue;
		// Factor de ajuste basado en la 
		// Diferencia entre el cuadrado de la distancia actual entre las partículas (dSq) y el cuadrado de la longitud de la restricción
		let percent = ((dSq - c.lSq) *
						 (c.p1.invmass + c.p2.invmass)) /
						 dSq;
		// La idea es que si la restricción está estirada (distancia actual mayor que la longitud deseada), 
		// percent será positivo, y si está comprimida, será negativo
		dx *= percent;
		dy *= percent;
		
		// Se ajusta la posición de la primera partícula (c.p1) en la dirección x, y
		// restando el desplazamiento ajustado multiplicado por la inversa de su masa 
		c.p1.x -= dx * c.p1.invmass;
		c.p1.y -= dy * c.p1.invmass;
		// Se ajusta la posición de la segunda partícula (c.p2) en la dirección x, y 
		// sumando el desplazamiento ajustado multiplicado por la inversa de su masa 
		c.p2.x += dx * c.p2.invmass;
		c.p2.y += dy * c.p2.invmass;
		
	}
}

function constrainPoints() {
	// Barrer por acada particula dentro de la malla
	for (let i = 0; i < particles.length; i++) {
		let p = particles[i];
		// previene que las partículas se muevan fuera del lado izquierdo del lienzo.
		if (p.x < SIZE) {
			p.x = SIZE;
		//  se ajusta su posición x para que no exceda el lado derecho del lienzo.
		} else if (p.x >= width - SIZE) {
			p.x = width - SIZE;
		}
		// previene que las partículas se muevan fuera del borde superior del lienzo.
		if (p.y < SIZE) {
			p.y = SIZE;
		// 
		} else if (p.y >= height - SIZE) {
			// Aplicar una fuerza de fricción en la dirección x de la partícula
			p.x -= (p.y - height + SIZE) * (p.x - p.px) * this.physics.friction;
			p.y = height - SIZE;
		}
	}
}

// Funcion para crear y definir las posiciones de una particula puntual
function Particle(x, y) {
	this.x = x;
	this.y = y;
	// Posiciones pasadas o anteriores
	this.px = x;
	this.py = y;
	// masa inversa, es decir, masa = 0 sigmnifica inmovil
	// para evitar manejar infinitos
	this.invmass = 0.3;
}

function Constraint(p1, p2, l, pushing = true) {
	// Particula 1
	this.p1 = p1;
	// Particula 2
	this.p2 = p2;
	// Longitud de restriccion
	this.l = l;
	//  Cuadrado de la longitud de restriccion
	this.lSq = l * l;
	// Establece si la restriccion es "pushing" (empujando)
	this.pushing = pushing;
}

// Funcion para agregar las particulas con sus respectivas ligaduras
// en la malla o tela simulada
function createClothSim() {
	for (let y = 0; y < clothHeight; y += 1) {
		for (let x = 0; x < clothWidth; x += 1) {
			// Se crea una nueva particula 
			let p = new Particle(x * clothSpacing + clothXMargin,
								y + 50);
			// Valor aleatorio entre -2.5 y 2.5 para añadir una
			// perturbacion inicial a cada particula en el eje x					
			p.px += random() * 5 - 2.5;
			// Si x > 0, se agrega una restricción 
			// entre la partícula actual y la partícula a su izquierda
			if (x > 0) {
				constraints.push(new Constraint(
					particles[x - 1 + y * clothWidth],
					p,
					clothConstraintLength, false));
			}
			// Si y > 0, se agrega una restricción entre la partícula actual 
			// y la partícula encima de ella. Estas restricciones mantendrán la estructura de la tela.
			if (y > 0) {
				constraints.push(new Constraint(
					particles[x + (y - 1) * clothWidth],
					p,
					clothConstraintLength, false));
			} else {
				// Particulas fijas en la parte superior, masa inversa = 0
				// particulas ancladas
				if (y == 0 && x % clothAttachPoints == 0)
					p.invmass = 0;
			}

			// Agregar cada particula de la malla dentro de la lista vacia
			particles.push(p);
		}
	}
}


function initSettingsUI() {

	let settingsCont = select('.settings-container');
	// Cuando se hace clic en la configuración, se establece la variable 
	// global mouseInsideSketch como false. Esto indica que el mouse 
	// ya no está dentro de la simulación
	settingsCont.mousePressed(function() {
		mouseInsideSketch = false;
	});

	// Sliders and input
	// Gravity
	gravityXSlider = select('#wind-range').value(initGravityX);
	gravityXInput = select('#wind-input').value(initGravityX);

	gravityYSlider = select('#gravity-range').value(initGravityY);
	gravityYInput = select('#gravity-input').value(initGravityY);

	gravityXSlider.changed(function() {
		gravityXInput.value(gravityXSlider.value());
		gravity.x = gravityXSlider.value();
	});
	gravityXInput.changed(function() {
		gravityXSlider.value(gravityXInput.value());
		gravity.x = gravityXSlider.value();
	});

	gravityYSlider.changed(function() {
		gravityYInput.value(gravityYSlider.value());
		gravity.y = gravityYSlider.value();
	});
	gravityYInput.changed(function() {
		gravityYSlider.value(gravityYInput.value());
		gravity.y = gravityYSlider.value();
	});

	// Cloth Width
	let clothWidthSlider = select('#cloth-width-range').value(clothWidth);
	let clothWidthInput = select('#cloth-width-input').value(clothWidth);

	clothWidthSlider.changed(function() {
		clothWidthInput.value(clothWidthSlider.value());
		clothWidth = clothWidthSlider.value();
	});
	clothWidthInput.changed(function() {
		clothWidthSlider.value(clothWidthInput.value());
		clothWidth = clothWidthSlider.value();
	});

	// Cloth Height
	let clothHeightSlider = select('#cloth-height-range').value(clothHeight);
	let clothHeightInput = select('#cloth-height-input').value(clothHeight);

	clothHeightSlider.changed(function() {
		clothHeightInput.value(clothHeightSlider.value());
		clothHeight = clothHeightSlider.value();
	});
	clothHeightInput.changed(function() {
		clothHeightSlider.value(clothHeightInput.value());
		clothHeight = clothHeightSlider.value();
	});

	// Puntos o particulas ancladas
	let attachedPointsSlider = select('#attached-points-range').value(clothAttachPoints);
	let attachedPointsInput = select('#attached-points-input').value(clothAttachPoints);

	attachedPointsSlider.changed(function() {
		attachedPointsInput.value(attachedPointsSlider.value());
		clothAttachPoints = attachedPointsSlider.value();
	});
	attachedPointsInput.changed(function() {
		attachedPointsSlider.value(attachedPointsInput.value());
		clothAttachPoints = attachedPointsSlider.value();
	});

	// Botones
	let drawPointsBtn = select('#draw-points');
	if (!drawPoints) drawPointsBtn.addClass('inactive');
	drawPointsBtn.mousePressed(function() {
		drawPoints = !drawPoints;
		drawPointsBtn.toggleClass('inactive');
	});

	let showDebugBtn = select('#show-debug');
	if (!showDebugText) showDebugBtn.addClass('inactive');
	showDebugBtn.mousePressed(function() {
		showDebugText = !showDebugText;
		showDebugBtn.toggleClass('inactive');
	});

	let pauseBtn = select('#pause');
	pauseBtn.mousePressed(function(event) {
		console.log(event);
		if (isPaused)
			loop();
		else
			noLoop();
		isPaused = !isPaused;
	});

	let resetBtn = select('#reset');
	resetBtn.mousePressed(function() {
		init();
		if (isPaused) {
			redraw();
		}
	});


	let containerHider = select('#container-hider');
	select('.inside').toggleClass('hidden');
	containerHider.toggleClass('active');
	containerHider.mousePressed(function() {
		select('.inside').toggleClass('hidden');
		containerHider.toggleClass('active');

		if (containerHider.hasClass('active'))
			containerHider.html('Mostrar controles');
		else
			containerHider.html('Esconder');
	});

	let toolTypeButtons = selectAll('.tool-type-btn');
	toolTypeButtons.forEach(function(e, i) {
		if (i != toolType)
			e.addClass('inactive');
		e.mousePressed(function() {
			toolTypeButtons[toolType].addClass('inactive');
			e.removeClass('inactive');
			toolType = toolTypeButtons.indexOf(e);
		});
	});
}


/*
Implementación en JavaScript de un sistema de simulación física, 
específicamente de detección y resolución de colisiones entre cuerpos rígidos
*/

class Physics {
    // Constructor de la clase
	constructor() {
		// Propiedades para almacenar información sobre la colisión
		this.depth = 0;            // Profundidad de la colisión
		this.normal = createVector();   // Vector normal a la superficie de colisión
		this.constraint;           // Constraint (una restricción de contacto)
		this.body;                // Cuerpo involucrado en la colisión
		this.vertex = createVector();  // Vértice de colisión
		this.tangent = createVector();  // Vector tangente a la superficie de colisión
		this.relVel = createVector();   // Velocidad relativa
		this.friction = 0.2;       // Coeficiente de fricción
	}
}
