var pubnub = null;
var playerName = "";
var myMessage = "";
var chatMessage = "";
var connectingToLobby = true;
var chatting = false;
var playerDivs = new Array();

function textEnterHandler(enter, event) {

	if (enter && (event.keyCode) !== 13) return;

	if (document.getElementById('textInput').value) {

		if (chatting) {

			chatMessage = playerName + ": " + document.getElementById('textInput').value;
			document.getElementById('textInput').value = "";
			document.getElementById('textInput').placeholder = "enter-chat-message";
			document.getElementById('submitButton').value = "Send Message";

			pubnub.publish({
				channel: "PongGameLobby",
				message: chatMessage
			});

		}

		if (connectingToLobby) {

			playerName = document.getElementById('textInput').value;
			document.getElementById('textInput').value = "";
			document.getElementById('textInput').placeholder = "enter-chat-message";
			document.getElementById('submitButton').value = "Send Message";

			connectToLobby(playerName);

		}

	}

}

function connectToLobby(playerName) {

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
			chatLog(message);
		},
		presence: function(presMessage, env, channel) {
			if (presMessage.action === 'join' && presMessage.uuid === playerName) {
				myMessage = "Hi " + presMessage.uuid + ", welcome to " + channel + "!";
				chatLog(myMessage);
			}
			if (presMessage.action === 'join' && presMessage.uuid !== playerName) {
				myMessage = presMessage.uuid + " has entered " + channel;
				chatLog(myMessage);
				for (i = 0; i < playerDivs.length; i++) {
					var tempDiv = document.getElementById(playerDivs[i].id);
					tempDiv.innerHTML = "";
				}
			}
			if (presMessage.action === 'leave') {
				myMessage = presMessage.uuid + " has left " + channel;
				chatLog(myMessage);
				for (i = 0; i < playerDivs.length; i++) {
					var tempDiv = document.getElementById(playerDivs[i].id);
					tempDiv.innerHTML = "";
				}
				var tempId = document.getElementById(presMessage.uuid);
				document.body.removeChild(tempId);
			}
			if (presMessage.action === 'timeout') {
				myMessage = presMessage.uuid + " has timed out.";
				chatLog(myMessage);
			}
			runningPresence = true; 
			presenceTimer.reset();
		} //end presence:
	}); //end pubnub.subscribe({

	connectingToLobby = false;
	chatting = true;

} //end connectToLobby(playerName)

function runPresence() {

	pubnub.here_now({
		channel: "PongGameLobby",
		callback: function(m) {
			myMessage = "There are now " + m.uuids.length + " players in the lobby.";
			chatLog(myMessage);                  //chatLog(JSON.stringify(m.uuids));

			                 
			for (i = 0; i < m.uuids.length; i++) {                       
				playerDivs[i] = document.createElement('div');
				playerDivs[i].id = m.uuids[i];
				playerDivs[i].innerHTML = m.uuids[i];
				playerDivs[i].style.position = "fixed";
				playerDivs[i].style.top = (i + 1) * 2 + "%";
				playerDivs[i].style.right = "2%";
				if (m.uuids[i] === playerName)
					playerDivs[i].style.color = "rgb(55,55,55)";
				else playerDivs[i].style.color = "rgb(255,255,0)";
				playerDivs[i].style.fontSize = "10px";
				playerDivs[i].style.fontFamily = "arial";
				document.body.appendChild(playerDivs[i]);

				                       
			}
		}
	});

}

function chatLog(message) {

	var chat2 = document.getElementById('chatLine2');
	var chat3 = document.getElementById('chatLine3');
	var chat4 = document.getElementById('chatLine4');

	document.getElementById('chatLine1').innerHTML = chat2.innerHTML;
	document.getElementById('chatLine2').innerHTML = chat3.innerHTML;
	document.getElementById('chatLine3').innerHTML = chat4.innerHTML;
	document.getElementById('chatLine4').innerHTML = message;

}
/*
		var opponent = null;
		pubnub.subscribe({
			user: "",
			callback: function (message) {
    				console.log(opponent, ":", message);
  			},
  			connect: function (uuid, peerConnection) {
    				console.log("Now connected to", uuid);
				opponent = uuid;
  			},
  			disconnect: function (uuid, peerConnection) {
    				console.log(opponent, "has disconnected");
  			}
		});
		
		pubnub.publish({
  			user: opponent, 
  			message: [player, "says: Hello there," opponent, "- good luck!" ] 
		});
		
		*/
