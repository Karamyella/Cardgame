let socket;

// Stellt Verbindung zum Server her.
function initConnection() {
	socket = io();

	setSocketEvents();
}

function setSocketEvents() {
	socket.on('loadArena', (data) => {
		window.location.href = '/arena';
	});

	socket.on('gameStart', (data) => {
		initializeGame(data);
	});

	// Wenn der Gegner austritt, wird die Partie beendet und der Spieler wird auf die Startseite weitergeleitet.
	socket.on('playerDisconnected', (disconnectedPlayerName) => {
		alert(disconnectedPlayerName + ' ist aus der Partie ausgetreten. Sie werden auf die Startseite weitergeleitet.');
		window.location.href = '/';
	});
}

let playerData = {
	playerName: 'Jeff',
	deckID: 'aaa'
}

// DEBUG-Stuff
$('.start-button').on('click', (event) => {
	event.preventDefault();

	initConnection();

	socket.emit('playerConnecting', playerData);
	$('.start-button').off('click');
});
