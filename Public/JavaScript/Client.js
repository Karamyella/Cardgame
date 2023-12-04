let socket;

// Stellt Verbindung zum Server her.
function initConnection() {
	if (socket === undefined) {
		socket = io();

		setSocketEvents();
	}
}

function setSocketEvents() {
	socket.on('dataOfOtherPlayer', (dataOfOpponent) => {
		console.log(dataOfOpponent);
		//alert('');
	});

	socket.on('loadArena', (data) => {
		window.location.href = '/arena';
	});

	socket.on('gameStart', (data) => {
		initializeGame(data);
	});

	// Wenn der Gegner austritt, wird die Partie beendet und der Spieler wird auf die Startseite weitergeleitet.
	socket.on('playerDisconnected', (disconnectedPlayerName) => {
		alert(disconnectedPlayerName + ' ist aus der Partie ausgetreten. Sie werden auf die Startseite weitergeleitet.');
		//window.location.href = '/';
	});


	socket.on('isPOne', (data) => {
		isPOne = data;
	});

	socket.on('roomData', (data) => {
		let pOne = data.gameState.boardState.p1Data;
		let pTwo = data.gameState.boardState.p2Data;
		$('#pOneName').html(pOne.playerName);
		if (pTwo.playerName != undefined) {
			$('#pTwoName').html(pTwo.playerName);
		}
		$('.start-game').hide();
		$('.waiting').show();

		if (pOne.playerName != undefined && pTwo.playerName != undefined) {
			$(".enterArena").show();
		}
	});

	socket.on('startGame', () => {
		window.location.href = "/Arena";
	});

	socket.on('editorCardResult', (data) => {
		let mainDiv = $('.generatedCards');
		mainDiv.html('');
		for(let i = 0; i < data.length; i++) {
			$('<img>').attr('src', data[i].image).appendTo(mainDiv);
		}
	});
}

function submitName() {
	let playerName = $('input.playerName').val();
	if (playerName != "") {
		let playerInfo = {
			playerName: playerName,
			playerDeck: undefined
		};
		socket.emit('initMatchmaking', playerInfo);
	}
}

function deckmenu() {
	$("#defaultmenu").hide();
	$("#deckmenu").show();
}

function togglecolor(className) {
	$("#defaultmenu").show();
	$("#deckmenu").hide();
	$(".menu-color").children().hide(); //hide all icons
	$(`#${className}`).show();  //show only the right color
}

function startselection() {
	initConnection();
	$('.start-game').show();
}

function enterArena() {
	socket.emit("playerIsReady");
}

function sendCardRequest() {
	initConnection();

	let data = {
		cardName: $('.name').val(),
		color: $('.color').val()
	}
	socket.emit("cardRequest", data);
}
