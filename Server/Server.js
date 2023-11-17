// Imports
const express = require('express');
const {createServer} = require('node:http');
const {join} = require('node:path');
const {Server} = require('socket.io');

// Initialisierung d. Servers
const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 8080;

// Öffnet Server-Port.
server.listen(port, () => {});

let playerList = [];

// Filepath für Html-Datei.
app.use(express.static(join(__dirname, '/../public')));


// Seiten-Aufrufe.
app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '/../public/Startscreen.html'));
});
app.get('/deckEditor', (req, res) => {
	res.sendFile(join(__dirname, '/../public/DeckEditor.html'));
});
app.get('/arena', (req, res) => {
	res.sendFile(join(__dirname, '/../public/Arena.html'));
});

// Responses auf Aktionen der User.
io.on('connection', (socket) => {
	// Fügt neuen Spieler der Spielerliste hinzu.
	socket.on('playerConnecting', (playerInfo) => {
		playerList.push({
			playerID: socket.id,
			playerName: playerInfo.playerName,
			deckID: playerInfo.deckID,
			playerDeck: undefined
		});

		// DEBUG-STUFF
		console.log(playerList);

		if (playerList.length === 2) {
			let allPlayers = socket.server.sockets.sockets;
			allPlayers.forEach((socket) => {
				// Sagt den Clients, dass sie auf die neue Seite laden sollen.
				socket.emit('loadArena');
			});
		}
	});

	socket.on('arenaLoaded', () => {
		for (let i = 0; i < playerList.length; i++) {
			playerList[i].playerDeck = getPlayerDeck(playerList[i].deckID);
		}
		socket.emit('gameStart', playerList);
	});

	/*
	// Wenn ein Spieler aus dem Game rausgeht, bekommt der andere Spieler eine Meldung.
	socket.on('disconnect', (data) => {
		const otherPlayerConnections = socket.server.sockets.sockets;

		// Der ausgeloggte Spieler.
		let diconnectedPlayer = playerList.filter(value => value.playerID === socket.id);
		// Wirft den ausgeloggten Spieler aus der Liste raus.
		playerList = playerList.filter(value => value.playerID !== socket.id);

		otherPlayerConnections.forEach((otherSocket) => {
			otherSocket.emit('playerDisconnected', diconnectedPlayer.playerName);
		});
	});
	*/
});

/*
// Baut Verbindung zur Datenbank auf.
const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'cardgameAdmin',
	password: 'cardgamePW',
	database: 'cardgame'
});


connection.connect((error) => {
	if (error) throw error;

	const sql = "SELECT * FROM Card";

	connection.query(sql, (error, result) => {
		if (error) throw error;
		console.log(result[0]);
	});
});
*/

function getPlayerDeck(deckId) {
	return connection.connect((error) => {
		if (error) throw error;

		const statement = "SELECT c.* FROM deckcards dc inner join cards c on c.id = cd.card where cd.deck = " + deckId;

		return connection.query(statement, (error, result) => {
			if (error) throw error;

			return result;
		});
	})
}
