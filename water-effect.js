
var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1;

var material1, mesh1;

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.set(0, 2, 4);
	camera.lookAt( scene.position );
	scene.add( camera );

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 1.00 );
	scene.add( ambientLight );

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: false
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top  = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;

	let geometry1 = new THREE.TorusGeometry(1.25,1.25, 64, 256); // radius, tube radius

	let loader = new THREE.TextureLoader();
	let texture = loader.load( 'images/water-2.jpg' );
	// let texture = loader.load( 'images/color-grid.png' );

	// repeat texture
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(8,2);

	// Shader-based material
	material1 = new THREE.ShaderMaterial({
		uniforms: {
			time: { value: 1.0 },
			baseTexture: { value: texture },
		},
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
		transparent: true,
	});

	mesh1 = new THREE.Mesh( geometry1, material1 );
	mesh1.rotation.x = -Math.PI/2;
	mesh1.scale.z = 0.10;

	scene.add( mesh1 );

	// floor
	let floorG = new THREE.PlaneGeometry(10,10,1,1);
	let floorT = loader.load( 'images/sand.jpg' );
	let floorM = new THREE.MeshBasicMaterial({map: floorT});
	let floor = new THREE.Mesh(floorG, floorM);
	floor.rotation.x = -Math.PI/2;
	scene.add(floor);
}

function update()
{
	material1.uniforms.time.value += deltaTime;
}

function render()
{
	renderer.render( scene, camera );
}

function animate()
{
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
