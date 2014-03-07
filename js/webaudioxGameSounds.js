/**
 * @namespace definition of WebAudiox
 * @type {object}
 */
var WebAudiox	= WebAudiox	|| {};

/**
 * definition of a lineOut
 * @constructor
 * @param  {AudioContext} context WebAudio API context
 */
WebAudiox.LineOut	= function(context){
	// init this.destination
	this.destination= context.destination;

	// this.destination to support muteWithVisibility
	var visibilityGain	= context.createGain();
	visibilityGain.connect(this.destination);			
	muteWithVisibility(visibilityGain);
	this.destination= visibilityGain;

	// this.destination to support webAudiox.toggleMute() and webAudiox.isMuted
	var muteGain	= context.createGain();
	muteGain.connect(this.destination);
	this.destination= muteGain;
	this.isMuted	= false;
	this.toggleMute = function(){
		this.isMuted		= this.isMuted ? false : true;
		muteGain.gain.value	= this.isMuted ? 0 : 1;
	}.bind(this);

	//  to support webAudiox.volume
	var volumeNode	= context.createGain();
	volumeNode.connect( this.destination );
	this.destination= volumeNode;
	Object.defineProperty(this, 'volume', {
		get : function(){
			return volumeNode.gain.value; 
		},
                set : function(value){
			volumeNode.gain.value	= value;
		}
	});

	return;	

	//////////////////////////////////////////////////////////////////////////////////
	//		muteWithVisibility helper					//
	//////////////////////////////////////////////////////////////////////////////////
	/**
	 * mute a gainNode when the page isnt visible
	 * @param  {Node} gainNode the gainNode to mute/unmute
	 */
	function muteWithVisibility(gainNode){
		// shim to handle browser vendor
		var eventStr	= (document.hidden !== undefined	? 'visibilitychange'	:
			(document.mozHidden	!== undefined		? 'mozvisibilitychange'	:
			(document.msHidden	!== undefined		? 'msvisibilitychange'	:
			(document.webkitHidden	!== undefined		? 'webkitvisibilitychange' :
			console.assert(false, "Page Visibility API unsupported")
		))));
		var documentStr	= (document.hidden !== undefined ? 'hidden' :
			(document.mozHidden	!== undefined ? 'mozHidden' :
			(document.msHidden	!== undefined ? 'msHidden' :
			(document.webkitHidden	!== undefined ? 'webkitHidden' :
			console.assert(false, "Page Visibility API unsupported")
		))));
		// event handler for visibilitychange event
		var callback	= function(){
			var isHidden	= document[documentStr] ? true : false;
			gainNode.gain.value	= isHidden ? 0 : 1;
		}.bind(this);
		// bind the event itself
		document.addEventListener(eventStr, callback, false);
		// destructor
		this.destroy	= function(){
			document.removeEventListener(eventStr, callback, false);
		};
	}
};

/**
 * Helper to load a buffer
 * 
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String} url     the url of the sound to load
 * @param  {Function} onLoad  callback to notify when the buffer is loaded and decoded
 * @param  {Function} onError callback to notify when an error occured
 */
WebAudiox.loadBuffer	= function(context, url, onLoad, onError){
	onLoad		= onLoad	|| function(buffer){};
	onError		= onError	|| function(){};
	var request	= new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType	= 'arraybuffer';
	// counter inProgress request
	WebAudiox.loadBuffer.inProgressCount++;
	request.onload	= function(){
		context.decodeAudioData(request.response, function(buffer){
			// counter inProgress request
			WebAudiox.loadBuffer.inProgressCount--;
			// notify the callback
			onLoad(buffer);		
			// notify
			WebAudiox.loadBuffer.onLoad(context, url, buffer);
		}, function(){
			// notify the callback
			onError();
			// counter inProgress request
			WebAudiox.loadBuffer.inProgressCount--;
		});
	};
	request.send();
};

/**
 * global onLoad callback. it is notified everytime .loadBuffer() load something
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String} url     the url of the sound to load
 * @param {[type]} buffer the just loaded buffer
 */
WebAudiox.loadBuffer.onLoad	= function(context, url, buffer){};

/**
 * counter of all the .loadBuffer in progress. usefull to know is all your sounds
 * as been loaded
 * @type {Number}
 */
WebAudiox.loadBuffer.inProgressCount	= 0;



/**
 * shim to get AudioContext
 */
window.AudioContext	= window.AudioContext || window.webkitAudioContext;

//////////////////////////////////////////////////////////////////////////////////
//		for Listener							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * Set Position of the listener based on THREE.Vector3  
 * 
 * @param  {AudioContext} context  the webaudio api context
 * @param {THREE.Vector3} position the position to use
 */
WebAudiox.ListenerSetPosition	= function(context, position){
	context.listener.setPosition(position.x, position.y, position.z);
};

/**
 * Set Position and Orientation of the listener based on object3d  
 * 
 * @param {[type]} panner   the panner node
 * @param {THREE.Object3D} object3d the object3d to use
 */
WebAudiox.ListenerSetObject3D	= function(context, object3d){
	// ensure object3d.matrixWorld is up to date
	object3d.updateMatrixWorld();
	// get matrixWorld
	var matrixWorld	= object3d.matrixWorld;
	////////////////////////////////////////////////////////////////////////
	// set position
	var position	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
	context.listener.setPosition(position.x, position.y, position.z);

	////////////////////////////////////////////////////////////////////////
	// set orientation
	var mOrientation= matrixWorld.clone();
	// zero the translation
	mOrientation.setPosition({x : 0, y: 0, z: 0});
	// Compute Front vector: Multiply the 0,0,1 vector by the world matrix and normalize the result.
	var vFront= new THREE.Vector3(0,0,1);
	vFront.applyMatrix4(mOrientation);
	vFront.normalize();
	// Compute UP vector: Multiply the 0,-1,0 vector by the world matrix and normalize the result.
	var vUp= new THREE.Vector3(0,-1, 0);
	vUp.applyMatrix4(mOrientation);
	vUp.normalize();
	// Set panner orientation
	context.listener.setOrientation(vFront.x, vFront.y, vFront.z, vUp.x, vUp.y, vUp.z);
};

/**
 * update webaudio context listener with three.Object3D position
 * 
 * @constructor
 * @param  {AudioContext} context  the webaudio api context
 * @param  {THREE.Object3D} object3d the object for the listenre
 */
WebAudiox.ListenerObject3DUpdater	= function(context, object3d){	
	var prevPosition= null;
	this.update	= function(delta){
		// update the position/orientation
		WebAudiox.ListenerSetObject3D(context, object3d);

		////////////////////////////////////////////////////////////////////////
		// set velocity
		var matrixWorld	= object3d.matrixWorld;
		if( prevPosition === null ){
			prevPosition	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
		}else{
			var position	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
			var velocity	= position.clone().sub(prevPosition).divideScalar(delta);
			prevPosition.copy(position);
			context.listener.setVelocity(velocity.x, velocity.y, velocity.z);
		}
	};
};


//////////////////////////////////////////////////////////////////////////////////
//		for Panner							//
//////////////////////////////////////////////////////////////////////////////////


/**
 * Set Position of the panner node based on THREE.Vector3  
 * 
 * @param {[type]} panner   the panner node
 * @param {THREE.Vector3} position the position to use
 */
WebAudiox.PannerSetPosition	= function(panner, position){
	panner.setPosition(position.x, position.y, position.z);
};

/**
 * Set Position and Orientation of the panner node based on object3d  
 * 
 * @param {[type]} panner   the panner node
 * @param {THREE.Object3D} object3d the object3d to use
 */
WebAudiox.PannerSetObject3D	= function(panner, object3d){
	// ensure object3d.matrixWorld is up to date
	object3d.updateMatrixWorld();
	// get matrixWorld
	var matrixWorld	= object3d.matrixWorld;
	
	////////////////////////////////////////////////////////////////////////
	// set position
	var position	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
	panner.setPosition(position.x, position.y, position.z);

	////////////////////////////////////////////////////////////////////////
	// set orientation
	var vOrientation= new THREE.Vector3(0,0,1);
	var mOrientation= matrixWorld.clone();
	// zero the translation
	mOrientation.setPosition({x : 0, y: 0, z: 0});
	// Multiply the 0,0,1 vector by the world matrix and normalize the result.
	vOrientation.applyMatrix4(mOrientation);
	vOrientation.normalize();
	// Set panner orientation
	panner.setOrientation(vOrientation.x, vOrientation.y, vOrientation.z);
};

/**
 * update panner position based on a object3d position
 * 
 * @constructor
 * @param  {[type]} panner   the panner node to update
 * @param  {THREE.Object3D} object3d the object from which we take the position
 */
WebAudiox.PannerObject3DUpdater	= function(panner, object3d){
	var prevPosition= null;
	// set the initial position
	WebAudiox.PannerSetObject3D(panner, object3d);
	// the update function
	this.update	= function(delta){
		// update the position/orientation
		WebAudiox.PannerSetObject3D(panner, object3d);

		////////////////////////////////////////////////////////////////////////
		// set velocity
		var matrixWorld	= object3d.matrixWorld;
		if( prevPosition === null ){
			prevPosition	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
		}else{
			var position	= new THREE.Vector3().setFromMatrixPosition(matrixWorld);
			var velocity	= position.clone().sub(prevPosition).divideScalar(delta);
			prevPosition.copy( position );
			panner.setVelocity(velocity.x, velocity.y, velocity.z);
		}
	};
};


/**
 * a specific helpers for gamedevs to make WebAudio API easy to use for their case
 */
WebAudiox.GameSounds	= function(){
	// create WebAudio API context
	var context	= new AudioContext();
	this.context	= context;

	// Create lineOut
	var lineOut	= new WebAudiox.LineOut(context);
	this.lineOut	= lineOut;
	
	var bank	= [];
	this.bank	= bank;
	
	/**
	 * show if the Web Audio API is detected or not
	 * 
	 * @type {boolean}
	 */
	this.webAudioDetected	= AudioContext ? true : false;

	//////////////////////////////////////////////////////////////////////////////////
	//		update loop							//
	//////////////////////////////////////////////////////////////////////////////////

	/**
	 * the update function
	 * 
	 * @param  {Number} delta seconds since the last iteration
	 */
	this.update	= function(delta){
		if( this.listenerUpdater ){
			this.listenerUpdater.update(delta);
		}
		// update each bank
		Object.keys(bank).forEach(function(label){
			var sound	= bank[label];
			sound.update(delta);
		});
	};

	//////////////////////////////////////////////////////////////////////////////////
	//		create Sound							//
	//////////////////////////////////////////////////////////////////////////////////
			
	/**
	 * create a sound from this context
	 * @param  {Object} options the default option for this sound, optional
	 * @return {WebAudiox.GameSound}	the created sound
	 */
	this.createSound	= function(options){
		return new WebAudiox.GameSound(this, options);
	};
	

	//////////////////////////////////////////////////////////////////////////////////
	//		handle .listenerAt						//
	//////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Set the listener position
	 * @param  {THREE.Vector3|THREE.Object3D} position the position to copy
	 * @return {WebAudiox.GameSounds} the object itself for linked API
	 */
	this.listenerAt	= function(position){
		if( position instanceof THREE.Vector3 ){
			WebAudiox.ListenerSetPosition(context, position);	
		}else if( position instanceof THREE.Object3D ){
			WebAudiox.ListenerSetObject3D(context, position);	
		}else	console.assert(false);
		return this;
	};

	//////////////////////////////////////////////////////////////////////////////////
	//		handle .follow/.unFollow					//
	//////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Make the listener follow a three.js THREE.Object3D
	 * 
	 * @param  {THREE.Object3D} object3d the object to follow
	 * @return {WebAudiox.GameSounds} the object itself for linked API
	 */
	this.listenerFollow	= function(object3d){
		// put a ListenerObject3DUpdater
		var listenerUpdater	= new WebAudiox.ListenerObject3DUpdater(context, object3d);
		this.listenerUpdater	= listenerUpdater;
		return this;
	};
	
	/**
	 * Make the listener Stop Following the object 
	 * @return {WebAudiox.GameSounds} the object itself for linked API
	 */
	this.listenerStopFollow	= function(){
		context.listener.setVelocity(0,0,0);
		this.listenerUpdater	= null;
		return this;
	};
};

//////////////////////////////////////////////////////////////////////////////////
//		WebAudiox.GameSound						//
//////////////////////////////////////////////////////////////////////////////////

/**
 * a sound from WebAudiox.GameSounds
 * @param {WebAudiox.GameSounds} gameSounds     
 * @param {Object} defaultOptions the default play options
 */
WebAudiox.GameSound	= function(gameSounds, defaultOptions){
	this.gameSounds		= gameSounds	|| console.assert(false);
	this.defaultOptions	= defaultOptions|| {};

	//////////////////////////////////////////////////////////////////////////////////
	//		register/unregister in gameSound				//
	//////////////////////////////////////////////////////////////////////////////////
		
	this.label	= null;	
	this.register	= function(label){
		console.assert(gameSounds.bank[label] === undefined, 'label already defined');
		gameSounds.bank[label]	= this;
		return this;
	};
	this.unregister	= function(){
		if( this.label === null )	return;
		delete gameSounds.bank[label];
		return this;
	};
	
	//////////////////////////////////////////////////////////////////////////////////
	//		update loop							//
	//////////////////////////////////////////////////////////////////////////////////
	
	var updateFcts	= [];
	this.update	= function(delta){
		updateFcts.forEach(function(updateFct){
			updateFct(delta);
		});
	};

	//////////////////////////////////////////////////////////////////////////////////
	//		load url							//
	//////////////////////////////////////////////////////////////////////////////////
	
	this.load	= function(url, onLoad, onError){
		this.loaded	= false;
		this.buffer	= null;
		WebAudiox.loadBuffer(gameSounds.context, url, function(decodedBuffer){
			this.loaded	= true;
			this.buffer	= decodedBuffer;
			onLoad	&& onLoad(this);
		}.bind(this), onError);
		return this;
	};

	//////////////////////////////////////////////////////////////////////////////////
	//		play								//
	//////////////////////////////////////////////////////////////////////////////////
	
// TODO change play in createUtterance

	this.play	= function(options){
		options		= options || this.defaultOptions;

		var utterance	= {};
		var context	= gameSounds.context;
		var destination	= gameSounds.lineOut.destination;

		// honor .position: vector3
		if( options.position !== undefined ){
			// init AudioPannerNode if needed
			if( utterance.pannerNode === undefined ){
				var panner	= context.createPanner();
				panner.connect(destination);
				utterance.pannerNode	= panner;
				destination		= panner;				
			}
			// set the value
			if( options.position instanceof THREE.Vector3 ){
				WebAudiox.PannerSetPosition(panner, options.position);			
			}else if( options.position instanceof THREE.Object3D ){
				WebAudiox.PannerSetObject3D(panner, options.position);			
			}else	console.assert(false, 'invalid type for .position');
		}

		// honor .follow: mesh
		if( options.follow !== undefined ){
			// init AudioPannerNode if needed
			if( utterance.pannerNode === undefined ){
				var panner	= context.createPanner();
				panner.connect(destination);
				utterance.pannerNode	= panner;
				destination		= panner;				
			}
			// put a PannerObject3DUpdater
			var pannerUpdater	= new WebAudiox.PannerObject3DUpdater(panner, options.follow);//mesh
			utterance.pannerUpdater	= pannerUpdater;
			utterance.stopFollow	= function(){
				updateFcts.splice(updateFcts.indexOf(updatePannerUpdater), 1);
				delete	utterance.pannerUpdater;
			};
			function updatePannerUpdater(delta, now){
				pannerUpdater.update(delta, now);
			}			
			updateFcts.push(updatePannerUpdater);
		}

		// honor .volume = 0.3
		if( options.volume !== undefined ){
			var gain	= context.createGain();
			gain.gain.value	= options.volume;
			gain.connect(destination);
			destination	= gain;		
			utterance.gainNode	= gain;
		}

		// init AudioBufferSourceNode
		var source	= context.createBufferSource();
		source.buffer	= this.buffer;
		source.connect(destination);
		destination	= source;

		if( options.loop !== undefined )	source.loop	= options.loop;

		// start the sound now
		source.start(0);

		utterance.sourceNode	= source;
		utterance.stop		= function(delay){
			source.stop(delay);
			if( this.stopFollow )	this.stopFollow();
		};
		
		return utterance;
	};
};
