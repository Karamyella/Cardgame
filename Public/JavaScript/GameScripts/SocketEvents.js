function initSocketEvents() {
	socket.on('enemyDisconnected', (roomData) => {
		let arenaPage = $('#arena');
		// Wenn der andere Spieler disconnected..
		// ..und die Arena-Seite geladen wurde, wird man darauf hingewiesen und das Spiel wird pausiert.
		if (arenaPage.css('display') !== 'none') {
			// TODO Umsetzung:
			// TODO - Meldung an Spieler
			// TODO - Verhindern aller Spiele-Aktionen, aka. Pausieren des Spiels
		} else {
			// ..und die Arena-Seite noch nicht geladen wurde, wird der rausgegangene Spieler entfernt.
			// TODO Wenn Decks exisieren, dann soll der Deckname wieder entfernt werden..
			let pOne = roomData.gameState.boardState.p1Data;
			let pTwo = roomData.gameState.boardState.p2Data;

			console.log(pOne);

			if (pOne.playerName === undefined) {
				$('#pOneName').html('Waiting for second player');
			}
			if (pTwo.playerName === undefined) {
				$('#pTwoName').html('Waiting for second player');
			}
			$('#enemy-ready-text').hide();
			$('#player-ready-text').hide();
			$('#enter-arena-btn').hide();
		}
	});
	// ### Index -> Lobby-Events ###
	socket.on('isPOne', (bool) => {
		isPOne = bool;
	});
	socket.on('roomData', (roomData) => {
		// TODO Wenn Decks exisieren, dann soll der Deckname auch angezeigt werden..
		let pOne = roomData.gameState.boardState.p1Data;
		let pOneNameElement = $('.pOneName');
		let pOneDeckElement = $('#pOneDeck');
		let pTwo = roomData.gameState.boardState.p2Data;
		let pTwoNameElement = $('.pTwoName');
		let pTwoDeckElement = $('#pTwoDeck');

		if (pOne.playerName !== undefined) {
			pOneNameElement.html(pOne.playerName);
			pOneDeckElement.html(pOne.library);
		} else {
			pOneNameElement.html('Waiting for other player');
			pOneDeckElement.html('');
		}
		if (pTwo.playerName !== undefined) {
			pTwoNameElement.html(pTwo.playerName);
			pTwoDeckElement.html(pTwo.library)
		} else {
			pTwoNameElement.html('Waiting for second player');
			pTwoDeckElement.html('');
		}

		$('.start-game-menu').hide();
		$('.waiting-menu').show();

		// Wenn beide Spieler anwesend sind, wird der "Bereit"-Button für beide angezeigt.
		if (pOne.playerName !== undefined && pTwo.playerName !== undefined) {
			$('#enter-arena-btn').show();
		}
	});
	socket.on('otherPlayerIsReady', () => {
		$('#enemy-ready-text').show();
	});
	socket.on('startGame', (roomData) => {
		pageTransition($('#index'), $('#arena'), 'Arena');
		initGame(roomData);
	});

	socket.on()

	socket.on('editorCardResult', (data) => {
		let mainDiv = $('#card-result-container');
		mainDiv.html('');
		for(let i = 0; i < data.length; i++) {
			$('<img>').attr('src', data[i].image).appendTo(mainDiv);
		}
	});
}