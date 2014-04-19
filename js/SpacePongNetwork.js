//NETWORK VARIABLES///////////////////////////////////////////////////
var pubnub = null;
var playerName = "Player";
var opponentName = "Computer";
var gameInitiator = "";
var gameAcceptor = "";
var myMessage = "";
var chatMessage = "";
var dataMessage = "";
var gameStateMessage = "";
var slicedMessage = "";
var stringSlicePoints = new Array();
var currentVar = 0;
var variableCounter = 0;

var chat2 = null;
var chat3 = null;
var chat4 = null;
var connectingToLobby = true;
var chatting = false;
var playingAndChatting = false;
var playerDivs = new Array();
var tempDiv = null;
var tempId = null;
var youAreInitiator = true;
var youAreAcceptor = false;
var matchAccepted = false;
	


function initNetwork() {

	opponentName = "Computer";
	gameInitiator = "";
	gameAcceptor = "";
	myMessage = "";
	chatMessage = "";
	chatting = true;
	playingAndChatting = false;
	runningNetworkGame = false;

	youAreInitiator = true;
	youAreAcceptor = false;
	youAreBlue = true;
	matchAccepted = false;
	
	gameReset = true;
	resetScores = true;
	ballTowardsBlue = true;

	document.getElementById('textInput').placeholder = "enter-public-chat-message";

	tempId = document.getElementById('networkHelp');
	if (tempId) {} //already exists, so do nothing
	else {
		tempDiv = document.createElement('div');
		tempDiv.id = "networkHelp";
		tempDiv.innerHTML = "Click on an opponent below to request a match";
		tempDiv.style.position = "fixed";
		tempDiv.style.top = "0%";
		tempDiv.style.right = "2%";
		tempDiv.style.color = "rgb(180,180,180)";
		tempDiv.style.fontSize = "10px";
		tempDiv.style.fontFamily = "arial";
		document.body.appendChild(tempDiv);
	}
}

function textEnterHandler(enter, event) {

	if (enter && (event.keyCode) !== 13) return;

	if (document.getElementById('textInput').value) {

		if (chatting) {

			chatMessage = playerName + ": '" + document.getElementById('textInput').value + "'";
			chatMessage = chatMessage.slice(0, 80);
			
			document.getElementById('textInput').value = "";
			document.getElementById('textInput').placeholder = "enter-public-chat-message";
			document.getElementById('submitButton').value = "Send Message";

			pubnub.publish({
				channel: "PongGameLobby",
				message: chatMessage
			});

		}

		if (playingAndChatting) {

			myMessage = playerName + ": '" + document.getElementById('textInput').value + "'";
			myMessage = myMessage.slice(0, 82);
			chatLog(myMessage);
			
			chatMessage = "C," + myMessage;
			chatMessage = chatMessage.slice(0, 80);
			
			document.getElementById('textInput').value = "";
			document.getElementById('textInput').placeholder = "enter-private-message";
			document.getElementById('submitButton').value = "Send Message";

			pubnub.publish({
				user: opponentName,
				message: chatMessage
			});

		}

		if (connectingToLobby) {

			playerName = document.getElementById('textInput').value;
			playerName = playerName.slice(0,20);
			
			document.getElementById('textInput').value = "";
			document.getElementById('textInput').placeholder = "enter-public-chat-message";
			document.getElementById('submitButton').value = "Send Message";
			document.getElementById('networkInfo').style.color = "blue";
			document.getElementById('networkInfo').innerHTML = "Connecting to lobby...";
			
			connectToLobby(playerName);

		}

	} //end if (document.getElementById('textInput').value)

} //end function textEnterHandler(enter, event)

function connectToLobby(playerName) {

	initNetwork();
	document.getElementById('textInput').placeholder = "enter-public-chat-message";
	//init PubNub object
	pubnub = PUBNUB.init({
		publish_key: "pub-c-697ba66a-fbbc-49bd-a270-f96befbde57d",
		subscribe_key: "sub-c-8c9caafa-a993-11e3-a5cd-02ee2ddab7fe",
		uuid: playerName
	});
	// Subscribe to a channel
	pubnub.subscribe({
		channel: "PongGameLobby",
		callback: function(message) {
			if (message.type) {
				if (message.type === "gameRequest") {
					gameInitiator = message.sender;
					gameAcceptor = message.receiver;
					if (gameAcceptor === playerName) {
						youAreAcceptor = true;
						youAreInitiator = false;
						for (i = 0; i < playerDivs.length; i++) {
							if(playerDivs[i].id !== gameInitiator){
								tempId = document.getElementById(playerDivs[i].id);
								if(tempId) tempId.style.color = "orange";
							}
						} 
					}
					else if (gameInitiator === playerName) {
						youAreInitiator = true;
						youAreAcceptor = false;
						for (i = 0; i < playerDivs.length; i++) {
							tempId = document.getElementById(playerDivs[i].id);
							if(tempId) tempId.style.color = "orange";
						} 
					}
					else{
						document.getElementById(gameInitiator).style.color = "brown";
						document.getElementById(gameAcceptor).style.color = "brown";
					}
					chatLog(message.text);
				}
				if (message.type === "ifAccept") {
					if (message.receiver === playerName) {
						document.getElementById('networkInfo').innerHTML = message.text;
						runningAcceptTimer = true;
						acceptTimer.reset();
					}
				}
				if (message.type === "gameAccepted") {
					if (message.receiver === playerName) {
						document.getElementById('networkInfo').innerHTML = message.text;
						matchAccepted = true;
						runningAcceptTimer = false;
						runningNetworkGame = true;
						connectToOpponent(opponentName);
					}
				}
				if (message.type === "nowInGame") {
					document.getElementById(message.player1).style.color = "purple";//purple = already playing
					document.getElementById(message.player2).style.color = "purple";//purple = already playing
					chatLog(message.text);
				}
				if (message.type === "whoIsPlaying"){
					document.getElementById(message.player).style.color = "purple";//purple = already playing
				}
				if (message.type === "returningToLobby"){
					if (message.player === playerName)
						document.getElementById(message.player).style.color = "orange";
					else document.getElementById(message.player).style.color = "yellow";
					chatLog(message.player + " is returning to the lobby.");
				}
			}//end if (message.type)
			else chatLog(message);
		}, //end callback:
		presence: function(presMessage, env, channel) {

			if (presMessage.action === 'join') {
				myMessage = presMessage.uuid + " is in " + channel;
				chatLog(myMessage);
				tempId = document.getElementById(presMessage.uuid);
				if (tempId) {} //already exists, so do nothing
				else {
					tempDiv = document.createElement('div');
					tempDiv.id = presMessage.uuid;
					document.body.appendChild(tempDiv);
					if (presMessage.uuid !== playerName) {
						document.getElementById(tempDiv.id).onclick = function() {
							opponentClickHandler(this.id);
						};
					}
				}
				if (playerName === gameInitiator || playerName === gameAcceptor){
					pubnub.publish({
						channel: "PongGameLobby",
						message: {
							type: "whoIsPlaying",
							player: playerName
						}
					});
				}
			}
			if (presMessage.action === 'join' && presMessage.uuid === playerName) {
				myMessage = "Hi " + presMessage.uuid + ", welcome to " + channel + "!";
				document.getElementById('networkInfo').innerHTML = myMessage;
			}
			if (presMessage.action === 'leave') {
				myMessage = presMessage.uuid + " has left " + channel;
				chatLog(myMessage);

				tempId = document.getElementById(presMessage.uuid);
				document.body.removeChild(tempId);
			}
			if (presMessage.action === 'timeout') {
				myMessage = presMessage.uuid + " has timed out.";
				chatLog(myMessage);
				
				tempId = document.getElementById(presMessage.uuid);
				document.body.removeChild(tempId);
			}
			runningHereNow = true;
			hereNowTimer.reset();
		} //end presence:
	}); //end pubnub.subscribe({

	connectingToLobby = false;
	chatting = true;

} //end connectToLobby(playerName)

function runHereNow() {

	document.getElementById('networkInfo').innerHTML = "";
	pubnub.here_now({
		channel: "PongGameLobby",
		callback: function(m) {
			myMessage = "There are now " + m.uuids.length + " players in the lobby.";
			chatLog(myMessage);
			//chatLog(JSON.stringify(m.uuids));

			for (i = 0; i < m.uuids.length; i++) {
				playerDivs[i] = document.getElementById(m.uuids[i]);
				playerDivs[i].id = m.uuids[i];
				playerDivs[i].innerHTML = m.uuids[i];
				playerDivs[i].style.position = "fixed";
				playerDivs[i].style.top = (i + 1) * 3 + "%";
				playerDivs[i].style.right = "2%";
				if (m.uuids[i] === gameInitiator || m.uuids[i] === gameAcceptor)
					playerDivs[i].style.color = "purple";
				else if (document.getElementById(m.uuids[i]).style.color === "purple")//purple = already playing
					playerDivs[i].style.color = "purple";//disable button for players who are already playing
				else if (m.uuids[i] === playerName || playerName === gameAcceptor || playerName === gameInitiator)
					playerDivs[i].style.color = "orange";
				else playerDivs[i].style.color = "yellow";
				playerDivs[i].style.fontSize = "12px";
				playerDivs[i].style.fontFamily = "arial";
			} //end for
		} //end callback:
	}); //end pubnub.here_now

} //end function runHereNow()

function chatLog(message) {

	chat2 = document.getElementById('chatLine2');
	chat3 = document.getElementById('chatLine3');
	chat4 = document.getElementById('chatLine4');

	document.getElementById('chatLine1').innerHTML = chat2.innerHTML;
	document.getElementById('chatLine2').innerHTML = chat3.innerHTML;
	document.getElementById('chatLine3').innerHTML = chat4.innerHTML;
	document.getElementById('chatLine4').innerHTML = message;

}

function opponentClickHandler(id) {

	if (document.getElementById(id).style.color === "yellow") {
	
		if (youAreInitiator) {

			document.getElementById('networkInfo').innerHTML = "Requesting a game with " + id + "...";
			document.getElementById(id).style.color = "brown";
			myMessage = playerName + " wants to play a game with " + id;
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "gameRequest",
					sender: playerName,
					receiver: id,
					text: myMessage
				}
			});


			myMessage = playerName + " wants to play. If you accept, click on the name " + playerName + " -->";
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "ifAccept",
					sender: playerName,
					receiver: id,
					text: myMessage
				}
			});

			opponentName = id;
			
			runningAcceptTimer = true;
			acceptTimer.reset();



		} //end if (youAreInitiator)

		if (youAreAcceptor && id === gameInitiator) {

			document.getElementById('networkInfo').innerHTML = "Connecting to " + id + " ...";
			document.getElementById(id).style.color = "brown";
			myMessage = playerName + " and " + id + " are now in a game.";
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "nowInGame",
					player1: playerName,
					player2: id,
					text: myMessage
				}
			});

			myMessage = playerName + " has accepted!  Connecting...";
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "gameAccepted",
					sender: playerName,
					receiver: id,
					text: myMessage
				}
			});
			
			youAreBlue = false;
			matchAccepted = true;
			opponentName = id;
			runningNetworkGame = true;
			connectToOpponent(id);

		} //end if (youAreAcceptor)
		
	} //end if (document.getElementById(id).style.color === "yellow")
	
} //end function opponentClickHandler(id)


function connectToOpponent(opponent) {

	pubnub.subscribe({
		user: opponent,
		callback: function(message) {
		
			switch ( message.charAt(0) ) {
				case "D":
					for (var i = 0, stringPos = 0; stringPos < message.length; stringPos++) {
						if(message.charAt(stringPos) == ","){
							stringSlicePoints[i] = stringPos;
							i++;
							commaCounter = i;
						}
					}
					for (i = 0; i < commaCounter; i++) {
						
						if(i === 0) {
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							if (youAreBlue) redPaddle.position.x = parseFloat(slicedMessage, 10);
							else bluePaddle.position.x = parseFloat(slicedMessage, 10);
						}	
						if(i === 1){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							if (youAreBlue) redPaddle.position.y = parseFloat(slicedMessage, 10);
							else bluePaddle.position.y = parseFloat(slicedMessage, 10);
						}
						if( (youAreBlue && !ballTowardsBlue) || (!youAreBlue && ballTowardsBlue) ) {
							
							if(i === 2){
								slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
								ball.position.x = parseFloat(slicedMessage, 10);
							}
							if(i === 3){
								slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
								ball.position.y = parseFloat(slicedMessage, 10);

							}
							if(i === 4){
								slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
								ball.position.z = parseFloat(slicedMessage, 10);
							}
							if(i === 5){
								slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
								ballDirection.x = parseFloat(slicedMessage, 10);
							}
							if(i === 6){
								slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
								ballDirection.y = parseFloat(slicedMessage, 10);
							}
							if(i === 7){
								slicedMessage = message.slice(1 + stringSlicePoints[i]);
								ballDirection.z = parseFloat(slicedMessage, 10);
								if(ballDirection.z < 0) ballTowardsBlue = false;
								if(ballDirection.z > 0) ballTowardsBlue = true;
							}
							
						}// end if( (youAreBlue && !ballTowardsBlue) || (!youAreBlue && ballTowardsBlue) )
						
					}//end for (i = 0; i < commaCounter; i++) {

					break;
				case "C":
					chatLog( message.slice(2) );
					break;
				case "G":
					for (i = 0, stringPos = 0; stringPos < message.length; stringPos++) {
						if(message.charAt(stringPos) == ","){
							stringSlicePoints[i] = stringPos;
							i++;
							commaCounter = i;
						}
					}
					for (i = 0; i < commaCounter; i++) {
						
						if(i === 0){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							ballTowardsBlue = !!JSON.parse(String(slicedMessage));
						}
						if(i === 1) {
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							bluePaddleMissed = !!JSON.parse(String(slicedMessage));
						}	
						if(i === 2) {
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							redPaddleMissed = !!JSON.parse(String(slicedMessage));
						}	
						if(i === 3){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							blueWins = !!JSON.parse(String(slicedMessage));
							if (blueWins) {
								document.getElementById("winner").style.color = "rgb(0,0,255)";
								if (youAreBlue) winnerName = playerName;
								else winnerName = opponentName;
								//document.getElementById("winner").innerHTML = winnerName + " WINS!";
							}
						}
						if(i === 4){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							redWins = !!JSON.parse(String(slicedMessage));
							if (redWins) {
								document.getElementById("winner").style.color = "rgb(255,0,0)";
								if (youAreBlue) winnerName = opponentName;
								else winnerName = playerName;
								//document.getElementById("winner").innerHTML = winnerName + " WINS!";
							}
						}
						if(i === 5){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							winnerCutScene = !!JSON.parse(String(slicedMessage));
						}
						if(i === 6){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							blueScore = parseInt(slicedMessage, 10);
							document.getElementById("bluescore").innerHTML = blueScore;
						}
						if(i === 7){
							slicedMessage = message.slice(1 + stringSlicePoints[i], stringSlicePoints[i+1]);
							redScore = parseInt(slicedMessage, 10);
							document.getElementById("redscore").innerHTML = redScore;
						}
						if(i === 8){
							slicedMessage = message.slice(1 + stringSlicePoints[i]);
							gameReset = !!JSON.parse(String(slicedMessage));
						}
						
					}//end for (i = 0; i < commaCounter; i++) {
					break;
				default:
					chatLog( message.slice(2) );
			}
			
		},
		connect: function(uuid, peerConnection) {
			//myMessage = "Begin!";
			//document.getElementById('networkInfo').innerHTML = myMessage;
		},
		disconnect: function(uuid, peerConnection) {
			pubnub.unsubscribe({
				user: opponent
			});
			myMessage = opponent + " has disconnected from you. Going back to Lobby...";
			document.getElementById('networkInfo').innerHTML = myMessage;
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "returningToLobby",
					player: playerName
				}
			});

			initNetwork();
			runningNetworkGame = false;
			runningHereNow = true;
			hereNowTimer.reset();
		}
	});

	myMessage = "C," + playerName + ": 'Hello, " + opponent + " - good luck!'";

	pubnub.publish({
		user: opponent,
		message: myMessage
	});

	document.getElementById('textInput').placeholder = "enter-private-message";
	myMessage = "Begin!";
	document.getElementById('networkInfo').innerHTML = myMessage;
	gameReset = true;
	resetScores = true;
	blueScore = 0;
	redScore = 0;
	ballTowardsBlue = true;
	beginBannerTimer.reset();
	showingBeginBanner = true;
	networkTimer.reset();		
	matchAccepted = true;
	runningNetworkGame = true;
	chatting = false;
	playingAndChatting = true;

} //end function connectToOpponent(opponent)


function checkIfMatchAccepted() {

	if (youAreInitiator) {
		if (matchAccepted === false) {
			myMessage = opponentName + " did not accept the match. Going back to Lobby...";
			document.getElementById('networkInfo').innerHTML = myMessage;
			//document.getElementById(opponentName).style.color = "yellow";
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "returningToLobby",
					player: playerName
				}
			});
			initNetwork();
			runningNetworkGame = false;
			runningHereNow = true;
			hereNowTimer.reset();
		}
	}
	if (youAreAcceptor) {
		if (matchAccepted === false) {
			myMessage = "You did not accept the match. Going back to Lobby...";
			document.getElementById('networkInfo').innerHTML = myMessage;
			pubnub.publish({
				channel: "PongGameLobby",
				message: {
					type: "returningToLobby",
					player: playerName
				}
			});
			initNetwork();
			runningNetworkGame = false;
			runningHereNow = true;
			hereNowTimer.reset();
		}
	}
	
}// end function checkIfMatchAccepted()


function updateNetwork() {
	

	//if you are blue paddle and ball going away from you, only send your paddle pos to red player
	///if(youAreBlue && !ballTowardsBlue)
	///	dataMessage = "D," + bluePaddle.position.x + "," + bluePaddle.position.y;
	//if you are blue paddle and ball coming towards you, send ball position and direction to red player also
	///if(youAreBlue && ballTowardsBlue) {
	if(youAreBlue){
		dataMessage = "D," + bluePaddle.position.x + "," + bluePaddle.position.y + "," + 
			ball.position.x + "," + ball.position.y + "," + ball.position.z + "," +
				ballDirection.x + "," + ballDirection.y + "," + ballDirection.z;
		
	}
	
	//if you are red paddle and ball going away from you, only send your paddle pos to blue player
	///if(!youAreBlue && ballTowardsBlue)
	///	dataMessage = "D," + redPaddle.position.x + "," + redPaddle.position.y;
	//if you are red paddle and ball coming towards you, send ball position and direction to blue player also
	///if(!youAreBlue && !ballTowardsBlue) {
	if(!youAreBlue){
		dataMessage = "D," + redPaddle.position.x + "," + redPaddle.position.y + "," + 
			ball.position.x + "," + ball.position.y + "," + ball.position.z + "," +
				ballDirection.x + "," + ballDirection.y + "," + ballDirection.z;
		
	}
	
	pubnub.publish({
		user: opponentName,
		message: dataMessage
	});
	
	networkTimer.reset();

}//end function updateNetwork()


function sendGameState() {
	
	gameStateMessage = "G," + ballTowardsBlue + "," + bluePaddleMissed + "," + redPaddleMissed + "," + 
		blueWins + "," + redWins + "," + winnerCutScene + "," + blueScore + "," + redScore + "," + gameReset;		
	
	pubnub.publish({
		user: opponentName,
		message: gameStateMessage
	});
	
}
