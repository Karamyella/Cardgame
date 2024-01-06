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
server.listen(port, () => {
});

// Filepath für Html-Datei.
app.use(express.static(join(__dirname, '/../public')));


// Seiten-Aufrufe.
app.get('/', (req, res) => {
	res.sendFile(join(__dirname, '/../public/Global.html'));
});
// DEBUG
app.get('/deckEditor', (req, res) => {
	res.sendFile(join(__dirname, '/../public/DeckEditor.html'));
});
// DEBUG
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
 * 				whosTurn: string,
 * 				lastPhase: string,
 * 				boardState: {
 * 					p1Data: {
 * 						playerName: string,
 * 						life: number,
 * 						currentMana: number,
 * 						maxMana: number,
 * 						library: Array,
 * 						hand: Array,
 * 						board: Array,
 * 						graveyard: Array
 * 					},
 * 					p2Data: {
 * 						playerName: string,
 * 						life: number,
 * 						currentMana: number,
 * 						maxMana: number,
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
			if (foundRoomId === undefined && !room.playerReady && (room.playerOne === undefined || room.playerTwo === undefined)) {
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
				whosTurn: 'Player 1',
				lastPhase: undefined,
				boardState: {
					p1Data: {
						playerName: undefined,
						life: 20,
						currentMana: 0,
						maxMana: 0,
						library: undefined,
						hand: [],
						board: [],
						graveyard: []
					},
					p2Data: {
						playerName: undefined,
						life: 20,
						currentMana: 0,
						maxMana: 0,
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
	if (playerRoom.playerOne === socket.id || playerRoom.playerOne === undefined) {
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
			getPlayerDeck(playerInfo.playerDeck).then((result) => {
				room.gameState.boardState.p1Data.library = result;

				socket.emit('isPOne', true);
				if (room.playerTwo === undefined) {
					socket.emit('roomData', room);
				} else {
					sendDataToBothPlayers(socket, 'roomData', room);
				}
			});
		} else if (room.playerTwo === undefined) {
			room.playerTwo = socket.id;
			room.gameState.boardState.p2Data.playerName = player.playerName;
			getPlayerDeck(playerInfo.playerDeck).then((result) => {
				room.gameState.boardState.p2Data.library = result;

				socket.emit('isPOne', false);
				sendDataToBothPlayers(socket, 'roomData', room);
			});
		} else {
			// Errorhandler.
			socket.emit('roomIsFull');
			// Bei Fehlschlag muss der grade hinzugefügte Spieler nochmal entfernt werden.
			playerList.pop();
		}
	});

	socket.on('disconnect', () => {
		let disconnectedPlayer = findPlayerObjectByID(socket.id);
		// Wenn der Spieler in der Spielerliste gefunden wurde, dann war er in einem Match.
		// Falls nicht, war er im Deckbau-Modus, was keinerlei Reaktion benötigt.
		if (disconnectedPlayer !== undefined) {
			let room = findRoomByID(disconnectedPlayer.roomID);

			// Wenn das Spiel bereits begonnen hat..
			/* TODO (BUG) Aktuell ist der Fall nicht abgedeckt, wo das Spiel grade gestartet hat und
			 * TODO ein Spieler in der ersten Phase 'disconnected'. Hier ändert sich der Name des Spielers inkorrekt. */
			if (room.gameState.currentPhase !== 'PreGame - Player 1') {
				// ..und wenn im Raum noch ein zweiter Spieler war, wird dieser benachrichtigt und das Spiel pausiert..
				if (room.playerOne !== undefined && room.playerTwo !== undefined) {
					room.gameState.lastPhase = room.gameState.currentPhase;
					room.gameState.currentPhase = 'PAUSED';

					// Entfernt Spieler aus Raum.
					if (room.playerOne === socket.id) {
						room.playerOne = undefined;
					} else {
						room.playerTwo = undefined;
					}

					// Sendet ein Meldung und den aktuellen Raum an den übrigen Spieler.
					// TODO Man könnte auch statt des Raums ein Disconnect-Grund senden und einfach durch den Event-Trigger das Spiel pausieren..
					sendDataToOtherPlayer(socket, 'enemyDisconnected', room);
				} else {
					// ..aber wenn der Spieler der einzige im Raum war oder noch kein Spiel am Laufen war, wird der Raum auch gelöscht.
					roomList.splice(roomList.indexOf(room), 1);
				}
			} else {
				// Aber wenn das Spiel noch nicht begonnen hat, muss der andere Spieler darauf aufmerksam gemacht werden.
				if (room.playerOne === socket.id) {
					room.playerOne = undefined;
					room.gameState.boardState.p1Data.playerName = undefined;
					room.gameState.boardState.p1Data.library = undefined
				} else {
					room.playerTwo = undefined;
					room.gameState.boardState.p2Data.playerName = undefined;
					room.gameState.boardState.p2Data.library = undefined
				}
				room.playerReady = false;

				sendDataToOtherPlayer(socket, 'roomData', room);
			}

			// Das Spieler-Objekt wird immmer gelöscht.
			playerList.splice(playerList.indexOf(disconnectedPlayer), 1);
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
			if (foundRoom.playerOne === undefined) {
				foundRoom.playerOne = socket.id;
			} else if (foundRoom.playerTwo === undefined) {
				foundRoom.playerTwo = socket.id;
			}
			// .. und das Spiel an der letzten Stelle fortgesetzt werden.
			foundRoom.gameState.currentPhase = foundRoom.gameState.lastPhase;
			foundRoom.gameState.lastPhase = undefined;

			// Der beigetretende Spieler muss das komplette Board laden.
			socket.emit('loadGameState', foundRoom.gameState);

			// Der andere Spieler bekommt nur die Info, dass sein Spiel wieder vorgesetzt wird.
			sendDataToOtherPlayer(socket, 'resumeGame', foundRoom.gameState.currentPhase);
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
			sendDataToBothPlayers(socket, 'loadGame', room);
		}
	});

	socket.on('askForPlayerDecks', (playerName) => {
		getAllValidDecks(playerName).then((result) => {
			socket.emit('receivePlayerDecks', result);
		});
	});
	// Ist theoretisch redundant, macht aber die Lesbarkeit und Übersichtlichkeit an anderen Stellen leichter..
	socket.on('editorGetAllPlayerDecks', (playerName) => {
		getAllPlayerDecks(playerName).then((result) => {
			socket.emit('editorDeckResults', result);
		});
	});

	// Gibt alle Karten zurück, auf die die Farbe und ggf. den Namen passen.
	socket.on('cardRequest', (filter) => {
		getCardsForColorAndName(filter.color, filter.cardName).then((result) => {
			socket.emit('editorCardResults', result);
		});
	});

	socket.on('askForNewDeckID', () => {
		socket.emit('receiveNewDeckId', crypto.randomUUID());
	});

	socket.on('editorSaveDeckViaPrompt', (deckData) => {
		saveDeckToDatabase(deckData).then((saved) => {
			socket.emit('deckSavedFromPrompt', saved);
		});
	});
	// Ist theoretisch redundant, aber durch das andere Event kann nicht auf die Startseite geladen werden.. TODO Ggf. Zusammenfassen..
	socket.on('editorSaveDeckViaButton', (deckData) => {
		saveDeckToDatabase(deckData).then((saved) => {
			socket.emit('deckSavedFromButton', saved);
		}).catch((err) => {
			console.log(err);
		});
	});

	socket.on('loadSelectedDeck', (deckId) => {
		getPlayerDeck(deckId).then((playerDeck) => {
			socket.emit('editorLoadSelectedDeck', playerDeck);
		});
	});

	socket.on('playSorcery', (htmlElement) => {
		sendDataToBothPlayers(socket, 'showSorcery', htmlElement);
	})

	socket.on('playerAction', (gameState) => {
		sendDataToOtherPlayer(socket, 'loadGameState', gameState);
	});

	/* TODO Testen, ob Änderungen am Raum per REF bereits übernommen werden oder ob manuelles Speichern erforderlich ist.
	 * TODO Muss dann ggf. den Code an jeder Stelle nochmals anpassen.. */
	socket.on('phaseChange', (gameState) => {
		let roomData = findRoomByPlayerID(socket.id);

		saveRoomChanges(roomData, gameState);

		switch (gameState.currentPhase) {
			/*case 'Upkeep':
				// Currently Skipped!
				break;*/
			case 'Mainphase 1':
				gameState.currentPhase = 'Combatphase - Declare Attackers';

				break;
			case 'Combatphase - Declare Attackers':
				// Wenn keine Kreaturen angreifen, wird der Rest der Combat-Phase übersprungen.
				// TODO Überlegen, wie man an die zum Angriff deklarierten Kreaturen kommt.
				if (gameState.attackingCreatures !== undefined) {
					// Sendet dem anderen Spieler, welche Kreaturen zum Angriff deklariert wurden.
					// TODO [^]..
					sendDataToOtherPlayer(socket, 'attackersDeclared', gameState.attackingCreatures);
					gameState.currentPhase = 'Combatphase - Declare Blockers';
					// Der andere Spieler ist jetzt mit Blockern dran.
					gameState.whosTurn === 'Player 1' ? gameState.whosTurn = 'Player 2' : gameState.whosTurn = "Player 1";
				} else {
					gameState.currentPhase = 'Mainphase 2';
				}
				break;
			case 'Combatphase - Declare Blockers':
				// "OtherPlayer" ist in dem Falle der Spieler dessen Zug eigentlich gerade ist..!
				// Sendet dem anderen Spieler, welche Kreaturen zum Blocken deklariert wurden.
				// TODO Überlegen, wie man an die zum Blocken deklarierten Kreaturen kommt.
				sendDataToOtherPlayer(socket, 'blockersDeclared', gameState.blockingCreatures);
				gameState.currentPhase = 'Combatphase - Damage Step';
				// Der andere Spieler hat reagiert, also bekommt der "aktuelle" Spieler wieder Kontrolle.
				gameState.whosTurn === 'Player 1' ? gameState.whosTurn = 'Player 2' : gameState.whosTurn = "Player 1";
				break;
			case 'Combatphase - Damage Step':
				resolveDamageStep(gameState.boardState, gameState.attackingCreatures)
				let newBoardState; // TODO = resolveDamageStep(gameState.boardState, gameState.attackingCreatures, gameState.blockingCreatures);
				gameState.boardState = newBoardState;
				gameState.currentPhase = 'Mainphase 2';
				break;
			case 'Mainphase 2':
				// Fordert den Spieler dazu auf, Karten abzuwerfen, wenn seine Hand zu voll ist.
				socket.emit('discardStep');
				gameState.currentPhase = 'Endstep';
				break;
			case 'Endstep':
				gameState.currentPhase = 'Upkeep';
				gameState.whosTurn === 'Player 1' ? gameState.whosTurn = 'Player 2' : gameState.whosTurn = "Player 1";

				// Der Spieler der jetzt dran ist, bekommt sein volles Mana.
				if (gameState.whosTurn === 'Player 1') {
					gameState.boardState.p1Data.currentMana = gameState.boardState.p1Data.maxMana;
				} else {
					gameState.boardState.p2Data.currentMana = gameState.boardState.p2Data.maxMana;
				}
				break;
			case 'PreGame - Player 1':
				gameState.currentPhase = 'PreGame - Player 2';
				gameState.whosTurn = 'Player 2';
				break;
			case 'PreGame - Player 2':
				gameState.currentPhase = 'Upkeep';
				gameState.whosTurn = 'Player 1';
				break;
		}

		// Sendet beiden Spielern alle Änderungen.
		sendDataToBothPlayers(socket, 'phaseChange', gameState);
	});

	/**
	 * Mainfunktion für Kartenlogik.
	 * Ruft entprechend der eventData den entsprechenden Handler auf, der den Effekt verarbeitet.
	 * Aufbau von eventData = {
	 * 		action: 'Effect' | 'Attack',
	 *		effect: '(cardEffect)' | undefined,
	 *		cardID: 'UUID',
	 *		whosTurn: 'Player 1' | 'Player 2'
	 * }
	 * */
	socket.on('resolveCard', (eventData) => {

	});
});

// Übernimmt alle 'gameState'-Veränderungen und speichert diese im Raum ab.
function saveRoomChanges(roomData, gameState) {
	roomData.gameState
}


// Baut Verbindung zur Datenbank auf.
const mysql = require('mysql');
// FIXME Was ist das?^^
const {rejects} = require('node:assert');
const connection = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: 'cardgamePW',
	database: 'cardgame'
});
connection.connect();

function getPlayerDeck(deckId) {
	return queryResolver('SELECT pd.name as deckname, c.* FROM deckcards dc inner join cards c on c.id = dc.card inner join playerdeck pd on pd.id = dc.deck where dc.deck = "' + deckId + '";');
}

function queryResolver(statement) {
	return new Promise((resolve, reject) => {
		connection.query(statement, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}

function getCardsForColorAndName(color, name) {
	let query;
	if (color) {
		if (name) {
			query = 'SELECT * FROM cards WHERE color = "' + color + '" AND name like "%' + name + '%";';
		} else {
			query = 'SELECT * FROM cards WHERE color = "' + color + '";';
		}
	} else {
		query = 'SELECT * FROM cards;';
	}

	return queryResolver(query);
}

function getAllPlayerDecks(playerName) {
	return queryResolver('SELECT * FROM playerdeck WHERE player = "' + playerName + '" ORDER BY name DESC;');
}

function saveDeckToDatabase(deckData) {
	let query = '';
	return queryResolver('SELECT id FROM playerdeck WHERE id = "' + deckData.deckId + '";').then((deckId) => {
		if (deckId.length === 0) {
			query = 'INSERT INTO playerdeck (id, name, player) VALUES("' + deckData.deckId + '","' + deckData.deckName + '","' + deckData.playerName + '");';
			return queryResolver(query).then(() => {
				return saveDeckChanges(deckData);
			}).catch((err) => {
				return (err);
			})
				;
		} else {
			return saveDeckChanges(deckData);
		}
	}).catch((err) => {
		console.log(err);
	});
}

function saveDeckChanges(deckData) {
	for (let add of deckData.additions) {
		queryResolver('INSERT INTO deckcards (deck, card) VALUES("' + deckData.deckId + '",' + add.id + ');');
	}
	for (let sub of deckData.subtractions) {
		queryResolver('DELETE FROM deckcards WHERE deck = "' + deckData.deckId + '" AND card = ' + sub.id + ' LIMIT 1;');
	}
}

function getAllValidDecks(playerName) {
	return queryResolver('SELECT d.* FROM playerdeck d INNER JOIN (SELECT count(card) as count, deck FROM deckcards group by 2) as dc ON d.id = dc.deck WHERE d.player = "' + playerName + '" AND dc.count = 60;');
}
