
var scene, camera, renderer, clock, deltaTime, totalTime, keyboard;

var mover;

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

	mover = new THREE.Group();
	mover.add( camera );
	mover.position.set(0, 2, 4);
	scene.add( mover );

	//camera.position.set(0, 2, 4);
	//camera.lookAt( scene.position );
	//scene.add( camera );

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 1.00 );
	scene.add( ambientLight );

	// let pointLight = new THREE.PointLight();
	// camera.add( pointLight );

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

	keyboard = new Keyboard();

	let loader = new THREE.TextureLoader();

	// floor
	let floorGeometry = new THREE.PlaneGeometry(10,10);
	let floorMaterial = new THREE.MeshBasicMaterial({
		map: loader.load( 'images/color-grid.png' )
	});
	let floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
	floorMesh.rotation.x = -Math.PI/2;
	scene.add( floorMesh );

	let cubeGeometry = new THREE.BoxGeometry(1,1,1);
	let materialArray = [
		new THREE.MeshBasicMaterial( { map: loader.load("images/xpos.png") } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/xneg.png") } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/ypos.png") } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/yneg.png") } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/zpos.png") } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/zneg.png") } ),
	];
	let cubeMesh = new THREE.Mesh( cubeGeometry, materialArray );
	cubeMesh.position.y = 0.5;
	scene.add( cubeMesh );
}

function update()
{
	keyboard.update();

	let translateSpeed = 0.5; // units per second
	let distance = translateSpeed * deltaTime;
	let rotateSpeed = Math.PI/6; // radians per second
	let angle = rotateSpeed * deltaTime;

	if (keyboard.isKeyPressed("W"))
		mover.translateZ( -distance );
	if (keyboard.isKeyPressed("S"))
		mover.translateZ( distance );

	if (keyboard.isKeyPressed("A"))
		mover.translateX( -distance );
	if (keyboard.isKeyPressed("D"))
		mover.translateX( distance );

	if (keyboard.isKeyPressed("R"))
		mover.translateY( distance );
	if (keyboard.isKeyPressed("F"))
		mover.translateY( -distance );

	if (keyboard.isKeyPressed("Q"))
		mover.rotateY( angle );
	if (keyboard.isKeyPressed("E"))
		mover.rotateY( -angle );

	if (keyboard.isKeyPressed("T"))
		mover.children[0].rotateX( angle );
	if (keyboard.isKeyPressed("G"))
		mover.children[0].rotateX( -angle );


	//mesh.rotation.y += 0.01;
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
