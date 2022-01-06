
var scene, camera, renderer, clock, deltaTime, totalTime, keyboard;

var arToolkitSource, arToolkitContext;

var markerNames, markerArray, currentMarkerName;

var sceneGroup;

var mesh1; // rotating targets?

initialize();
animate();

function initialize()
{
	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 1.0 );
	scene.add( ambientLight );

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
	keyboard = new Keyboard();

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

	markerNames = ["kanji", "letterA", "letterB", "letterC", "letterD"];

	markerArray = [];

	for (let i = 0; i < markerNames.length; i++)
	{
		let marker = new THREE.Group();
		scene.add(marker);
		markerArray.push(marker);

		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, marker, {
			type: 'pattern', patternUrl: "data/" + markerNames[i] + ".patt",
		});

		let markerGroup = new THREE.Group();
		marker.add(markerGroup);
	}

	////////////////////////////////////////////////////////////
	// setup scene
	////////////////////////////////////////////////////////////

	sceneGroup = new THREE.Group();

	// the inside of the hole
	let geometry1	= new THREE.CubeGeometry(5*1.25, 2, 3*1.25);
	let loader = new THREE.TextureLoader();
	let texture = loader.load( 'images/tiles.jpg', render );
	let material1	= new THREE.MeshLambertMaterial({
		transparent : true,
		map: texture,
		side: THREE.BackSide
	});

	mesh1 = new THREE.Mesh( geometry1, material1 );
	mesh1.position.y = -1;

	sceneGroup.add( mesh1 );

	// the invisibility cloak (plane with a hole)
	let geometry0 = new THREE.PlaneGeometry(18,18, 9,9);
	geometry0.faces.splice(80, 2); // make hole by removing top two triangles
	geometry0.faceVertexUvs[0].splice(80, 2);

	let material0 = new THREE.MeshBasicMaterial({
	    // map: loader.load( 'images/color-grid.png' ), // for testing placement
		colorWrite: false,
		// transparent: true,
		// opacity: 0.4
		// wireframe:true
	});


	let mesh0 = new THREE.Mesh( geometry0, material0 );
	mesh0.scale.set(3,2,1);

	mesh0.rotation.x = -Math.PI/2;
	sceneGroup.add(mesh0);
}


function update()
{
	keyboard.update();

	let anyMarkerVisible = false;
	for (let i = 0; i < markerArray.length; i++)
	{
		if ( markerArray[i].visible )
		{
			anyMarkerVisible = true;
			markerArray[i].children[0].add( sceneGroup );
			if ( currentMarkerName != markerNames[i] )
			{
				currentMarkerName = markerNames[i];
				console.log("Switching to " + currentMarkerName);
			}

			let p = markerArray[i].children[0].getWorldPosition();
			let q = markerArray[i].children[0].getWorldQuaternion();
			let s = markerArray[i].children[0].getWorldScale();
			let lerpAmount = 0.2;

			scene.add(sceneGroup);
			sceneGroup.position.lerp(p, lerpAmount);
			sceneGroup.quaternion.slerp(q, lerpAmount);
			sceneGroup.scale.lerp(s, lerpAmount);

			break;
		}
	}

	if ( !anyMarkerVisible )
	{
		console.log("No marker currently visible.");
		scene.visible = false;
	}
	else
		scene.visible = true;

	let baseMarker = markerArray[0];

	// update relative positions of markers
	for (let i = 1; i < markerArray.length; i++)
	{
		let currentMarker = markerArray[i];
		let currentGroup  = currentMarker.children[0];
		if ( baseMarker.visible && currentMarker.visible )
		{
			let relativePosition = currentMarker.worldToLocal( baseMarker.position.clone() );
			currentGroup.position.copy( relativePosition );

			let relativeRotation = currentMarker.quaternion.clone().inverse().multiply( baseMarker.quaternion.clone() );
			currentGroup.quaternion.copy( relativeRotation );
		}
	}

	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
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
