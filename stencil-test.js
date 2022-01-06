
var scene, camera, renderer, clock, deltaTime, totalTime, keyboard, stats;

var mover, plane;

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );

	mover = new THREE.Group();
	mover.add( camera );
	mover.position.set(0, 2, 8);
	scene.add( mover );

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

	stats = new Stats();
	document.body.appendChild( stats.dom );

	keyboard = new Keyboard();

	let loader = new THREE.TextureLoader();

	// textures from http://www.humus.name/
	let skyMaterialArray1 = [
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/posx.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/negx.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/posy.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/negy.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/posz.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("images/beach/negz.jpg"), side: THREE.BackSide } ),
	];
	let skyMesh1 = new THREE.Mesh(
		new THREE.CubeGeometry(500,500,500),
		skyMaterialArray1 );
	scene.add(skyMesh1);

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

	plane = new THREE.Mesh(
		new THREE.PlaneGeometry(2,2),
		new THREE.MeshBasicMaterial({
			map: loader.load("images/sphere-colored.png"),
			side: THREE.DoubleSide
		})
	);
	plane.position.set(1, 1, 2);
	scene.add(plane);

	plane.layers.set(1);
	camera.layers.enable(1);
}

function update()
{
	stats.update();
	keyboard.update();

	let translateSpeed = 1.0; // units per second
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
}

function render()
{
	let gl = renderer.context;

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.STENCIL_TEST);

	// do not clear buffers before each render
	renderer.autoClear = false;
	// clear buffers now: color, depth, stencil
	renderer.clear(true,true,true);

	// goal: write 1s to stencil buffer in position of plane

	// activate only layer 1, which only contains the plane
	camera.layers.set(1);

	/*
	glStencilFunc specifies a test to apply to each pixel of the stencil buffer

	glStencilFunc(OP, ref, mask)
	creates the test: (ref & mask) OP (stencil & mask)
	parameters:
		OP: GL_NEVER, GL_ALWAYS, GL_EQUAL, GL_NOTEQUAL,
		    GL_LESS, GL_LEQUAL, GL_GEQUAL, GL_GREATER
		ref: a fixed integer used in the comparison
		mask: a mask applied to both ref and the stencil pixel; use 0xFF to disable
	*/
	// always true (always passes); ref = 1.
	gl.stencilFunc(gl.ALWAYS, 1, 0xff);

	/*
	glStencilOp specifies the action to apply depending on the test results from glStencilFunc

	glStencilOp(sFail, sPass_dFail, sPass_dPassOrDisabled)
	sFail: the test from glStencilFunc failed
	sPass_dFail: the test from glStencilFunc passed, but the depth buffer test failed
	sPass_dPassOrDisabled: the test from glStencilFunc passed, and the depth buffer passed or is disabled
	*/
	gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
	gl.stencilMask(0xff);

	// during render, do not modify the color or depth buffers (thus only the stencil buffer will be affected)
	gl.colorMask(false,false,false,false);
	gl.depthMask(false);

	renderer.render( scene, camera );

	// SECOND PASS

	// need to clear the depth buffer, in case of occlusion by other objects
	renderer.clear(false, true, false);

	// now modify all the buffers again
	gl.colorMask(true,true,true,true);
	gl.depthMask(true);

	// just draw where stencil buffer = 1
	// fragments are only rendered if they pass both the depth test
	//  *and* the stencil test (as specified by glStencilFunc)
	gl.stencilFunc(gl.EQUAL, 1, 0xff);

	gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

	camera.layers.set(0); // layer 0 contains everything but plane
	renderer.render(scene,camera);
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
	// camera.aspect = window.innerWidth / window.innerHeight;
	// camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
