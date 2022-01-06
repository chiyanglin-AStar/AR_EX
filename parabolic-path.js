
var scene, camera, renderer, clock, deltaTime, totalTime;

var arToolkitSource, arToolkitContext;

var markerRoot1;

var material1, mesh1;

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 640, 480 );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;

	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()
		arToolkitSource.copySizeTo(renderer.domElement)
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
		}
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});

	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});

	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});

	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	markerRootA = new THREE.Group();
	scene.add(markerRootA);
	let markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRootA, {
		type: 'pattern', patternUrl: "data/letterA.patt",
	});

	markerRootB = new THREE.Group();
	scene.add(markerRootB);
	let markerControls2 = new THREEx.ArMarkerControls(arToolkitContext, markerRootB, {
		type: 'pattern', patternUrl: "data/letterB.patt",
	});

	////////////////////////////////////////////////////////////
	// setup scene
	////////////////////////////////////////////////////////////

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	let loader = new THREE.TextureLoader();

	sceneGroup = new THREE.Group();
	markerRootA.add(sceneGroup);

	let floorGeometry = new THREE.PlaneGeometry( 20,20 );
	let floorMaterial = new THREE.ShadowMaterial();
	floorMaterial.opacity = 0.3;
	let floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
	floorMesh.rotation.x = -Math.PI/2;
	floorMesh.receiveShadow = true;
	sceneGroup.add( floorMesh );

	ballMesh = new THREE.Mesh(
		new THREE.SphereGeometry(0.25, 32, 32),
		new THREE.MeshLambertMaterial({
			map: loader.load("images/basketball-gray.png"),
			color: 0xff8800
		})
	);
	ballMesh.castShadow = true;
	scene.add( ballMesh );

	let light = new THREE.PointLight( 0xffffff, 1, 100 );
	light.position.set( 0,4,0 ); // default; light shining from top
	light.castShadow = true;
	sceneGroup.add( light );

	let lightSphere = new THREE.Mesh(
		new THREE.SphereGeometry(0.1),
		new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.8
		})
	);
	lightSphere.position.copy( light.position );
	sceneGroup.add( lightSphere );

	let ambientLight = new THREE.AmbientLight( 0x666666 );
	sceneGroup.add( ambientLight );
	// let helper = new THREE.CameraHelper( light.shadow.camera );
	// sceneGroup.add( helper );

	// default normal of a plane is 0,0,1. Apply mesh rotation to it.
	let clipPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
		new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0) );
	renderer.clippingPlanes = [clipPlane];
}

function update()
{
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );

	if ( markerRootA.visible && markerRootB.visible )
	{
		// align clipping plane to scene.
		renderer.clippingPlanes[0].setFromNormalAndCoplanarPoint(
			new THREE.Vector3(0,1,0).applyQuaternion(sceneGroup.getWorldQuaternion()),
			sceneGroup.getWorldPosition()
		);

		let p = parabolicPath( markerRootA.getWorldPosition(), markerRootB.getWorldPosition(), (totalTime/1) % 4 - 1 );
		ballMesh.position.copy( p );
		ballMesh.rotation.z += 0.1
	}
}

// create a function p() that passes through the points (0,p0), (1,p1), (2,p2)
//  and evaluate that function at time t.
function parabolaEvaluate(p0, p1, p2, t)
{
	return ( 0.5*(p0 - 2*p1 + p2) )*t*t + ( -0.5*(3*p0 - 4*p1 + p2) )*t + ( p0 );
}

function parabolicPath( pointStart, pointEnd, time )
{
	let pointMiddle = new THREE.Vector3().addVectors( pointStart, pointEnd ).multiplyScalar(0.5).add( new THREE.Vector3(0,2,0) );
	return new THREE.Vector3(
		parabolaEvaluate( pointStart.x, pointMiddle.x, pointEnd.x, time ),
		parabolaEvaluate( pointStart.y, pointMiddle.y, pointEnd.y, time ),
		parabolaEvaluate( pointStart.z, pointMiddle.z, pointEnd.z, time )
	);
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
