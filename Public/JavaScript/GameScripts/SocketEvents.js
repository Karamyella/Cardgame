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
	// Updatet die Infos der Spieler im Warteraum, wenn einer in die Lobby reingeht oder verlässt.
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

		$('#start-game-menu').hide();
		$('.waiting-menu').show();

		// Wenn beide Spieler anwesend sind, wird der "Bereit"-Button für beide angezeigt.
		if (pOne.playerName !== undefined && pTwo.playerName !== undefined) {
			$('#enter-arena-btn').show();
		}
	});
	socket.on('otherPlayerIsReady', () => {
		$('#enemy-ready-text').show();
	});
	socket.on('loadGame', (roomData) => {
		pageTransition($('#index'), $('#arena'), 'Arena');
		initGame(roomData);
	});

	// Hängt Spielerdecks und Events an Elemente, damit die Deckauswahl reibungslos funktioniert.
	socket.on('receivePlayerDecks', (decks) => {
		// Wenn für den Spieler eigene Decks gefunden wurden, werden diese als weitere <Option> in "Meine Decks" hinzugefügt.
			console.log(decks);
		if (decks.length > 0) {
			let standardOption = $('#own-deck-selector option');
			for (let i = 0; i < decks.length; i++) {
				standardOption.after($('<option value="' + decks[i].id + '">').html(decks[i].name));
			}

			/* Wir wollen nur ein Deck mitsenden, also wählen die Radios und die Select-Options sich
			* gegenseitig ab, damit nur ein einziges Deck übergeben werden kann. Der 'deck-submit-button'
			* wird erst freigeschaltet, sobald eine der Optionen ausgewählt wurden. */
			$(document).on('click', '.basic-deck-selector input', () => {
				// Ändert bei "Meine Decks" die ausgewählte Option auf die 'null'-Option.
				$('#null-deck-option').prop('selected', true);
				$('#deck-submit-button').prop('disabled', false);
			});
			$(document).on('change', '#own-deck-selector', () => {
				// Ändert bei "Standartdecks", dass keines der Decks mehr ausgewählt ist.
				$('.basic-deck-menu input:checked').prop('checked', false);

				// Wenn das ausgewählte eigene Deck die 'null'-Option ist, soll der Submit-Button wieder disabled werden.
				if ($('#own-deck-selector').val() !== '') {
					$('#deck-submit-button').prop('disabled', false);
				} else {
					$('#deck-submit-button').prop('disabled', true);
				}
			});
		} else {
			// Versteckt die eigene Deckauswahl und zeigt Meldung an, dass der Spieler keine eigenen Decks hat.
			$('.own-deck-menu').hide();
			$('.no-own-deck').show();

			// Enabled nach Auswahl eines Standarddecks den Submit-Button.
			$(document).on('click', '.basic-deck-selector input', () => {
				$('#deck-submit-button').prop('disabled', false);
			});
		}

		$('#start-game-menu').hide();
		$('#choose-deck-menu').show();
	});

	// Fügt der Deckauswahl im Editor alle Decks des Spielers als Option hinzu, wobei die Deck-ID das Value ist.
	socket.on('editorDeckResults', (decks) => {
		let lastDeckSelectorOption = $('#editor-deck-selector').children().last();
		if (decks.length > 0) {
			for (let i = 0; i < decks.length; i++) {
				lastDeckSelectorOption.after($('<option value="' + decks[i].id + '">').html(decks[i].name));
			}
		}
	});

	// Erstellt ein neues Deck für den Spieler. Damit es in der Datenbank existiert, muss aber zuerst gespeichert werden.
	socket.on('receiveNewDeckId', (uuid) => {
		let deckSelector = $('#editor-deck-selector');
		let newDeckNameInput = $('#deck-name');

		// Erstellt eine neue Option mit dem neuen Deck als letzte verfügbare Option.
		deckSelector.children().last().after($('<option value="' + uuid + '">').html(newDeckNameInput.val()));

		// Wählt die neu erstellte Option aus.
		deckSelector.val(uuid);

		// Leert den Inhalt des Inputs für den Decknamen für erneuten gebrauch.
		newDeckNameInput.val('');
	});

	// Fügt im Editor alle Karten rechts in die Auswahl ein.
	socket.on('editorCardResults', (cards) => {
		let mainDiv = $('#card-result-container');
		mainDiv.html('');
		for (let i = 0; i < cards.length; i++) {
			$('<img>').attr('src', cards[i].image)
				.data('cardID', cards[i].id)
				.data('cardName', cards[i].name)
				.appendTo(mainDiv);
		};
	});

	// Wird ausgeführt, wenn man sein Deck wechseln wollte, aber seine Änderungen aber erst per Prompt speichern lässt.
	socket.on('deckSavedFromPrompt', (saved) => {
		if (saved) {
			changeToOtherDeck($('#editor-deck-selector').val());
		} else {
			// TODO Warnung/Info anzeigen, dass Decks nicht gespeichert werden konnten..
		}
	});

	// Nachdem man auf Speichern geklickt hat und das Speichern erfolgreich war, kommt eine Prompt um auf die Startseite zurückkehren.
	socket.on('deckSavedFromButton', (saved) => {
		if (saved) {
			if (confirm('Your deck has been saved successfully.\nDo you want to return to the starting-page?')) {
				window.location.reload();
			}
		} else {
			// TODO Warnung/Info anzeigen, dass Decks nicht gespeichert werden konnten..
		}
	});

	socket.on('editorLoadSelectedDeck', (cards) => {
		let mainDiv = $('#editor-deck-container');
		mainDiv.html('');
		for (let i = 0; i < cards.length; i++) {
			$('<img>').attr('src', cards[i].image)
				.data('cardID', cards[i].id)
				.data('cardName', cards[i].name)
				.appendTo(mainDiv);
		};
	});
}