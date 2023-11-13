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

let playerList = [];

// Filepath für Html-Datei.
app.use(express.static(join(__dirname, '/../public')));


// Seiten-Aufrufe.
app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '/../public/Startscreen.html'));
});

// TODO TESTPAGE: DELETE AFTER DONE.
app.get('/DeckEditor', (req, res) => {
	res.sendFile(join(__dirname, '/../public/DeckEditor.html'));
});

// TODO URL ggf. anpassen.
app.get('/arena', (req, res) => {
	res.sendFile(join(__dirname, '/../public/Arena.html'));
});


// Responses auf Aktionen der User.
io.on('connection', (socket) => {
	// DEBUG-STUFF
	//console.log('User \'' + socket.id + '\' connected.');
	console.log(socket);

	// Fügt neuen Spieler der Spielerliste hinzu.
	socket.on('playerName', (data) => {
		playerList.push({
			playerID: socket.id,
			playerName: data
		});

		// DEBUG-STUFF
		console.log('PlayerList:');
		console.log(playerList);
	});

	// DEBUG-STUFF
	socket.on('debug', (data) => {
		socket.emit('emitDebug');
		console.log('data: ' + data);
	});

	// Wenn ein Spieler aus dem Game rausgeht, bekommt der andere Spieler eine Meldung.
	socket.on('disconnect', (data) => {
		const otherPlayerConnections = socket.server.sockets.sockets;

		// Der ausgeloggte Spieler.
		let diconnectedPlayer = playerList.filter(value => value.playerID === socket.id);
		// Wirft den ausgeloggten Spieler aus der Liste raus.
		playerList = playerList.filter(value => value.playerID !== socket.id);

		otherPlayerConnections.forEach((socket) => {
			socket.emit('playerDisconnected', diconnectedPlayer.playerName);
		});
	});
});

// DEBUG-Stuff
server.listen(port, () => {
	console.log(`Server is up on port ${port}.`);
});


// Aktuell auskommentiert, da Datenbank lokal noch aufgesetzt werden muss.
// Baut Verbindung zur Datenbank auf.
/* const mysql = require('mysql');
const connection = mysql.createConnection({
	host: 'localhost',
	user: 'cardgameAdmin',
	password: 'cardgamePassword',
	database: 'cardgame'
});

// DEBUG-Stuff
connection.connect((error) => {
	if (error) throw error;
	console.log('Database-Connection works.');

	const sql = "SELECT * FROM Cards";

	connection.query(sql, (error, result) => {
		if (error) throw error;
		console.log(result[0]);
	});
});
 */