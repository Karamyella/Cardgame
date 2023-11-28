// Imports
const express = require('express');
const {createServer} = require('node:http');
const {join} = require('node:path');
const {Server} = require('socket.io');
const crypto = require('crypto');

// Initialisierung d. Servers
const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 8080;

// Öffnet Server-Port.
server.listen(port, () => {});

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

/**
 * Aufführung aller Räume, die Spieler zusammen paart.
 * PlayerReady ist dafür da, wenn beide Spieler bereit sind, dass das Spiel für beide startet.
 * Aufbau:
 * @type {[
 *     {
 *         roomID: UUID,
 *         playerOne: UUID | undefined,
 *         playerTwo: UUID | undefined,
 *         playerReady: boolean,
 *         gameState: {
 * 				currentPhase: string,
 * 				isP1Turn: boolean,
 * 				lastPhase: string,
 * 				boardState: {
 * 					p1Data: {
 * 						playerName: string,
 * 						life: number,
 * 						mana: number,
 * 						library: Array,
 * 						hand: Array,
 * 						board: Array,
 * 						graveyard: Array
 * 					},
 * 					p2Data: {
 * 						playerName: string,
 * 						life: number,
 * 						mana: number,
 * 						library: Array,
 * 						hand: Array,
 * 						board: Array,
 * 						graveyard: Array
 * 					}
 * 				}
 *         }
 *     }
 * ]}
 */
let roomList = [];

/**
 * Aufführung aller Spieler.
 * PlayerDeck stellt hier das Objekt aus der Datenbank dar.
 * Aufbau:
 * @type {[
 *     {
 *         socketID: UUID,
 *         roomID: UUID,
 *         playerName: String
 *     }
 * ]}
 */
let playerList = [];

// Wird aufgerufen, wenn ein Nutzer sich zum Spielen anmeldet.
function createPlayerObject(socketID, roomID, playerName) {
	return {
		socketID: socketID,
		roomID: roomID,
		playerName: playerName
	}
}

// Findet einen freien Raum oder erstellt ggf. einen neuen. Gibt ID des Raumes zurück.
function findAvailableRoom() {
	let foundRoomId = undefined;
	if (roomList.length > 0) {
		// Schaut solange durch alle Räume, bis ein Raum mit einem freien Platz gefunden wurde.
		roomList.forEach((room) => {
			if (foundRoomId === undefined && (room.playerOne === undefined || room.playerTwo === undefined)) {
				foundRoomId = room.roomID;
			}
		});
	}

	// Wenn ein freier Raum gefunden wurde, wird dessen ID zurückgegeben, sonst wird ein neuer Raum erstellt.
	if (foundRoomId !== undefined) {
		return foundRoomId;
	} else {
		let newRoomId = crypto.randomUUID();
		roomList.push({
			roomID: newRoomId,
			playerOne: undefined,
			playerTwo: undefined,
			playerReady: false,
			gameState: {
				currentPhase: 'PreGame - Player 1',
				isP1Turn: true,
				lastPhase: undefined,
				boardState: {
					p1Data: {
						playerName: undefined,
						life: 40,
						maxMana: 0,
						currentMana: 0,
						library: undefined,
						hand: [],
						board: [],
						graveyard: []
					},
					p2Data: {
						playerName: undefined,
						life: 40,
						maxMana: 0,
						currentMana: 0,
						library: undefined,
						hand: [],
						board: [],
						graveyard: []
					}
				}
			}
		});
		return newRoomId;
	}
}

function findPlayerObjectByID(socketID) {
	let targetPlayer = undefined;
	// Bricht die Suche ab, wenn er den Spieler bereits gefunden hat.
	for (let i = 0; i < playerList.length && targetPlayer === undefined; i++) {
		if (playerList[i].socketID === socketID) {
			targetPlayer = playerList[i];
		}
	}
	return targetPlayer;
}

function findRoomByID(roomID) {
	let targetRoom = undefined;
	// Bricht die Suche ab, wenn er den Raum bereits gefunden hat.
	for (let i = 0; i < roomList.length && targetRoom === undefined; i++) {
		if (roomList[i].roomID === roomID) {
			targetRoom = roomList[i];
		}
	}
	return targetRoom;
}

// Nur verwenden, wenn man sich sicher ist, dass Spieler & Raumobjekt auch vorhanden sind.
function findRoomByPlayerID(socketID) {
	let roomID = findPlayerObjectByID(socketID).roomID;
	return findRoomByID(roomID);
}

// Sucht die Lobby in der beide Spieler sind über die Id des ersten Spielers.
// Dann wird die Id des zweiten Spielers ermittelt und dem Socket mit dieser ID das Event gesendet.
function sendDataToOtherPlayer(socket, eventName, data) {
	// Findet den sendenden Spieler und ermittelt dessen Raum.
	let currentPlayer = findPlayerObjectByID(socket.id);
	let playerRoom = findRoomByID(currentPlayer.roomID);
	// Aus dem ermittelten Raum wird der zweite Spieler ermittelt.
	let otherPlayerID;
	if (playerRoom.playerOne === socket.id) {
		otherPlayerID = playerRoom.playerTwo;
	} else {
		otherPlayerID = playerRoom.playerOne;
	}

	// TODO Könnte ggf. optimiert werden, dass nicht immer alle durch alle Sockets gegangen werden muss.
	// Geht durch alle Sockets durch und nur beim Socket des "playerTwo" wird das mitgegebene Event ausgeführt.
	let allSockets = socket.server.sockets.sockets;
	allSockets.forEach((socket) => {
		if (socket.id === otherPlayerID) {
			socket.emit(eventName, data);
		}
	});
}

function sendDataToBothPlayers(socket, eventName, data) {
	socket.emit(eventName, data);
	sendDataToOtherPlayer(socket, eventName, data);
}

// Responses auf Aktionen des Users.
io.on('connection', (socket) => {
	// Wenn Spieler spielen mag, wird ein freier Raum gesucht, der Spieler wird hinzugefügt.
	// Wenn ein zweiter Spieler für einem Raum gefunden wurde, dann startet für Beide das Spiel.
	socket.on('initMatchmaking', (playerInfo) => {
		let availableRoomID = findAvailableRoom();
		let player = createPlayerObject(socket.id, availableRoomID, playerInfo.playerName);
		let room = findRoomByID(availableRoomID);

		// Errorhandler.
		if (room === undefined) {
			socket.emit('roomNotFound');
			return;
		}

		playerList.push(player);

		// Fügt Spieler dem Raum hinzu und sendet alle aktuellen Raumdaten.
		if (room.playerOne === undefined) {
			room.playerOne = socket.id;
			room.gameState.boardState.p1Data.playerName = player.playerName;
			room.gameState.boardState.p1Data.library = getPlayerDeck(playerInfo.deckID);

			socket.emit('isP1', true);
			socket.emit('roomData', room);
		} else if (room.playerTwo === undefined) {
			room.playerTwo = socket.id;
			room.gameState.boardState.p2Data.playerName = player.playerName;
			room.gameState.boardState.p2Data.library = getPlayerDeck(playerInfo.deckID);

			socket.emit('isP1', false);
			sendDataToBothPlayers(socket, 'roomData', room);
		} else {
			// Errorhandler.
			socket.emit('roomIsFull');
			// Bei Fehlschlag muss der grade hinzugefügte Spieler nochmal entfernt werden.
			playerList.pop();
		}
	});

	socket.on('disconnect', (reason, description) => {
		let disconnectedPlayer = findPlayerObjectByID(socket.id);
		// Wenn der Spieler in der Spielerliste gefunden wurde, dann war er in einem Match.
		// Falls nicht, war er im Deckbau-Modus, was keinerlei Reaktion benötigt.
		if (disconnectedPlayer !== undefined) {
			let room = findRoomByID(disconnectedPlayer.roomID);

			// Das Spieler-Objekt wird gelöscht.
			playerList.splice(playerList.indexOf(disconnectedPlayer), 1);

			// Wenn im Raum noch ein zweiter Spieler war, wird dieser benachrichtigt und das Spiel pausiert.
			if (room.playerOne !== undefined && room.playerTwo !== undefined) {
				room.gameState.lastPhase = room.gameState.currentPhase;
				room.gameState.currentPhase = 'PAUSED';

				// TODO Könnte erweitert werden, dass der Grund des Disconnects noch genauer angezeigt wird.
				sendDataToOtherPlayer(socket, 'enemyDisconnected', reason);

				// Entfernt Spieler aus Raum.
				if (room.playerOne === socket.id) {
					room.playerOne = undefined;
				} else {
					room.playerTwo = undefined;
				}
			} else {
				// Wenn der Spieler der einzige im Raum war, wird der Raum auch gelöscht.
				roomList.splice(roomList.indexOf(room), 1);
			}
		}
	});

	// Der Spieler darf nur einem Raum (wieder) beitreten, wenn er seinen und den Namen seines Gegner richtig eingibt.
	socket.on('reconnect', (authorizationInfo) => {
		let foundRoom = undefined;
		roomList.forEach((currentRoom) => {
			// Nur Räume, in denen das Spiel bereits gestartet hat und ein Spieler fehlt, bestehen den Test.
			if (foundRoom === undefined && currentRoom.playerReady &&
				(currentRoom.playerOne === undefined || currentRoom.playerTwo === undefined)) {
				let roomPlayers = currentRoom.gameState.boardState;
				// Der Spieler muss nur noch die Namen beider Spieler richtig eingeben, dann darf er beitreten.
				if ((authorizationInfo.myName === roomPlayers.p1Data.playerName ||
						authorizationInfo.myName === roomPlayers.p2Data.playerName) &&
					(authorizationInfo.enemyName === roomPlayers.p1Data.playerName ||
						authorizationInfo.enemyName === roomPlayers.p2Data.playerName)) {
					foundRoom = currentRoom;
				}
			}
		});
		// Wenn der Raum gefunden wurde, muss..
		if (foundRoom !== undefined) {
			// .. ein das Spieler-Objekt (wieder) erstellt werden,..
			playerList.push(createPlayerObject(socket.id, foundRoom.roomID, authorizationInfo.myName));
			// .. die fehlende Spielerinfo des Raum geupdatet werden,..
			foundRoom.playerOne === undefined ? foundRoom.playerOne = socket.id : foundRoom.playerTwo = socket.id;
			// .. und das Spiel an der letzten Stelle fortgesetzt werden.
			foundRoom.gameState.currentPhase = foundRoom.gameState.lastPhase;
			foundRoom.gameState.lastPhase = undefined;
			socket.emit('loadGameState', foundRoom);
			sendDataToOtherPlayer(socket, 'resumeGame');
		} else {
			socket.emit('roomNotFound');
		}
	});

	// Gibt dem anderen Spieler bescheid, dass man bereit ist. Wenn beide bereit sind, wird gestartet.
	socket.on('playerIsReady', () => {
		let room = findRoomByPlayerID(socket.id);
		if (!room.playerReady) {
			room.playerReady = true;
			sendDataToOtherPlayer(socket, 'otherPlayerIsReady');
		} else {
			sendDataToBothPlayers(socket, 'startGame');
		}
	});

	// Gibt alle Karten zurück, auf die die Farbe und ggf. den Namen passen.
	socket.on('editorGetCards', (filter) => {
		let resultSet;
		if (filter.cardName !== undefined) {
			// TODO getCardsForColorAndName(color, cardName);
			resultSet = getCardsForColorAndName(filter.color, filter.cardName);
		} else {
			resultSet = getCardsForColor(filter.color);
		}
		socket.emit('editorCardResult', resultSet);
	});

	socket.on('editorGetAllPlayerDecks', (playerName) => {
		// TODO getAllDecksOfPlayer(playerName);
		socket.emit('editorAllDecksResult', getAllDecksOfPlayer(playerName));
	});

	socket.on('editorSaveDeck', (deckData) => {
		// TODO saveDeckToDatabase(deckData);
		saveDeckToDatabase(deckData);
	});

	/* TODO Testen, ob Änderungen am Raum per REF bereits übernommen werden oder ob manuelles Speichern erforderlich ist.
	 * TODO Muss dann ggf. den Code an jeder Stelle nochmals anpassen.. */
	socket.on('phaseChange', () => {
		let room = findRoomByPlayerID(socket.id);
		let gameState = room.gameState;
		// Optimierung, dass nicht mit jeder Änderungen der ganzen Raum ständig hin und her gesendet werden muss..
		let updateInfo = {
			gameState: {
				currentPhase: undefined
			}
		}

		switch (gameState.currentPhase) {
			case 'Upkeep':
				if (gameState.isP1Turn) {
					// TODO Alle Karten für den Spieler untappen..
					gameState.boardState.p1Data.currentMana = gameState.boardState.p1Data.maxMana;
					updateInfo.gameState.boardState.p1Data.currentMana = gameState.boardState.p1Data.maxMana;
				} else {
					// TODO [^]..
					gameState.boardState.p2Data.currentMana = gameState.boardState.p2Data.maxMana;
					updateInfo.gameState.boardState.p2Data.currentMana = gameState.boardState.p2Data.maxMana;
				}

				// TODO Schaut durch den Boardstate nach Upkeep-Triggern..
				// ...

				// Aktueller Spieler zieht am Ende des Upkeeps "immer" eine Karte.
				socket.emit('drawCard');
				gameState.currentPhase = 'Mainphase 1';
				updateInfo.gameState.currentPhase = 'Mainphase 1';
				break;
			case 'Mainphase 1':
				gameState.currentPhase = 'Combatphase - Declare Attackers';
				updateInfo.gameState.currentPhase = 'Combatphase - Declare Attackers';
				break;
			case 'Combatphase - Declare Attackers':
				// Wenn keine Kreaturen angreifen, wird der Rest der Combat-Phase übersprungen.
				// TODO Überlegen, wie man an die zum Angriff deklarierten Kreaturen kommt.
				if (gameState.attackingCreatures !== undefined) {
					// Sendet dem anderen Spieler, welche Kreaturen zum Angriff deklariert wurden.
					// TODO [^]..
					sendDataToOtherPlayer(socket, 'attackersDeclared', gameState.attackingCreatures);
					gameState.currentPhase = 'Combatphase - Declare Blockers';
					updateInfo.gameState.currentPhase = 'Combatphase - Declare Blockers';
					// Der andere Spieler ist jetzt mit Blockern dran.
					gameState.isP1Turn = !gameState.isP1Turn;
					updateInfo.gameState.isP1Turn = !gameState.isP1Turn;
				} else {
					gameState.currentPhase = 'Mainphase 2';
					updateInfo.gameState.currentPhase = 'Mainphase 2';
				}
				break;
			case 'Combatphase - Declare Blockers':
				// "OtherPlayer" ist in dem Falle der Spieler dessen Zug eigentlich gerade ist..!
				// Sendet dem anderen Spieler, welche Kreaturen zum Blocken deklariert wurden.
				// TODO Überlegen, wie man an die zum Blocken deklarierten Kreaturen kommt.
				sendDataToOtherPlayer(socket, 'blockersDeclared', gameState.blockingCreatures);
				gameState.currentPhase = 'Combatphase - Damage Step';
				updateInfo.gameState.currentPhase = 'Combatphase - Damage Step';
				// Der andere Spieler hat reagiert, also bekommt der "aktuelle" Spieler wieder Kontrolle.
				gameState.isP1Turn = !gameState.isP1Turn;
				updateInfo.gameState.isP1Turn = !gameState.isP1Turn;
				break;
			case 'Combatphase - Damage Step':
				let newBoardState; // TODO = resolveDamageStep(gameState.boardState, gameState.attackingCreatures, gameState.blockingCreatures);
				gameState.boardState = newBoardState;
				updateInfo.gameState.boardState = newBoardState;
				gameState.currentPhase = 'Mainphase 2';
				updateInfo.gameState.currentPhase = 'Mainphase 2';
				break;
			case 'Mainphase 2':
				// Fordert den Spieler dazu auf, Karten abzuwerfen, wenn seine Hand zu voll ist.
				socket.emit('discardStep');
				gameState.currentPhase = 'Endstep';
				updateInfo.gameState.currentPhase = 'Endstep';
				break;
			case 'Endstep':
				gameState.currentPhase = 'Upkeep';
				updateInfo.gameState.currentPhase = 'Upkeep';
				gameState.isP1Turn = !gameState.isP1Turn;
				updateInfo.gameState.isP1Turn = !gameState.isP1Turn;
				break;
			case 'PreGame - Player 1':
				socket.emit('drawStarthand');
				gameState.currentPhase = 'PreGame - Player 2';
				updateInfo.gameState.currentPhase = 'PreGame - Player 2';
				gameState.isP1Turn = !gameState.isP1Turn;
				updateInfo.gameState.isP1Turn = !gameState.isP1Turn;
				break;
			case 'PreGame - Player 2':
				socket.emit('drawStarthand');
				gameState.currentPhase = 'Upkeep';
				updateInfo.gameState.currentPhase = 'Upkeep';
				gameState.isP1Turn = !gameState.isP1Turn;
				updateInfo.gameState.isP1Turn = !gameState.isP1Turn;
				break;
		}
		// Sendet beiden Spielern alle Änderungen.
		sendDataToBothPlayers(socket, 'phaseChange', updateInfo);
	});

	/**
	 * Mainfunktion für Kartenlogik.
	 * Ruft entprechend der eventData den entsprechenden Handler auf, der den Effekt verarbeitet.
	 * Aufbau von eventData = {
	 * 		action: 'Effect' | 'Attack',
	 *		effect: '(cardEffect)' | undefined,
	 *		cardID: 'UUID',
	 *		isP1Turn: true | false
	 * }
	 * */
	socket.on('resolveCard', (eventData) => {

	});
});

/*
// Baut Verbindung zur Datenbank auf.
const mysql = require('mysql');
const connection = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'cardgamePW',
	database: 'cardgame'
});

// DEBUG
connection.connect((error) => {
	if (error) throw error;

	const sql = "SELECT * FROM cards";

	connection.query(sql, (error, result) => {
		if (error) throw error;
		console.log(result[0]);
	});
});
*/

function getPlayerDeck(deckId) {
	// DEBUG
	return '';
	return connection.connect((error) => {
		if (error) throw error;

		const statement = "SELECT c.* FROM deckcards dc inner join cards c on c.id = cd.card where cd.deck = " + deckId;

		return connection.query(statement, (error, result) => {
			if (error) throw error;

			return result;
		});
	});
}

function getCardsForColor(color) {
	return connection.connect((error) => {
		if (error) throw error;

		let statement;
		switch (color) {
			case 'red':
				statement = "SELECT * FROM cards WHERE color = 'red'";
				break;
			case 'blue':
				statement = "SELECT * FROM cards WHERE color = 'blue'";
				break;
			case 'green':
				statement = "SELECT * FROM cards WHERE color = 'green'";
				break;
			case 'black':
				statement = "SELECT * FROM cards WHERE color = 'black'";
				break;
			case 'white':
				statement = "SELECT * FROM cards WHERE color = 'white'";
				break;
			default:
				statement = "SELECT * FROM cards";
				break;
		}

		return connection.query(statement, (error, result) => {
			if (error) throw error;
			return result;
		});
	});
}
