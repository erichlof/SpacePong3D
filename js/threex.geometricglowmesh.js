var THREEx	= THREEx || {};

THREEx.GeometricGlowMesh	= function(mesh){
	var object3d	= new THREE.Object3D();
	var geometry	= mesh.geometry.clone();
	var material	= THREEx.createAtmosphereMaterial();
	material.uniforms.glowColor.value	= new THREE.Color( 'cyan' );
	material.uniforms.coeficient.value	= 1.1;
	material.uniforms.power.value = 1.4;
        material.side	= THREE.BackSide;
	var outsideMesh	= new THREE.Mesh( geometry, material );
	//outsideMesh.scale.set( 1.09, 1.09, 1.3 );
	object3d.add( outsideMesh );

	material	= THREEx.createAtmosphereMaterial();
	material.uniforms.glowColor.value	= new THREE.Color( 'cyan' );
	material.uniforms.coeficient.value	= 0.1;
	material.uniforms.power.value		= 1.2;
	var insideMesh	= new THREE.Mesh( geometry, material );
	//insideMesh.scale.set( 1.0, 1.0, 1.0 );
	object3d.add( insideMesh );
	
	// expose a few variables
	this.object3d	= object3d;
	this.insideMesh	= insideMesh;
	this.outsideMesh= outsideMesh;
};

/**
 * from http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
 * @return {[type]} [description]
 */
THREEx.createAtmosphereMaterial	= function(){
	var vertexShader	= [
		'varying vec3	vVertexWorldPosition;',
		'varying vec3	vVertexNormal;',

		'varying vec4	vFragColor;',

		'void main(){',
		'	vVertexNormal	= normalize(normalMatrix * normal);',

		'	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;',

		'	// set gl_Position',
		'	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
		'}'

		].join('\n');
	var fragmentShader	= [
		'uniform vec3	glowColor;',
		'uniform float	coeficient;',
		'uniform float	power;',

		'varying vec3	vVertexNormal;',
		'varying vec3	vVertexWorldPosition;',

		'varying vec4	vFragColor;',

		'void main(){',
		'	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;',
		'	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;',
		'	viewCameraToVertex	= normalize(viewCameraToVertex);',
		'	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
		'	gl_FragColor		= vec4(glowColor, intensity);',
		'}'
	].join('\n');

	// create custom material from the shader code above
	//   that is within specially labeled script tags
	var material	= new THREE.ShaderMaterial({
		uniforms: { 
			coeficient	: {
				type	: "f", 
				value	: 1.0
			},
			power		: {
				type	: "f",
				value	: 2
			},
			glowColor	: {
				type	: "c",
				value	: new THREE.Color('pink')
			}
			//viewVector      : { 
				//type: "v3", 
				//value: camera.position }
		},
		vertexShader	: vertexShader,
		fragmentShader	: fragmentShader,
		blending	: THREE.AdditiveBlending,
		transparent	: true,
		depthWrite	: false //false
	});
	return material;
};
