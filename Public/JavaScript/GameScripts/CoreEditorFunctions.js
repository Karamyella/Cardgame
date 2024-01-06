let deckAdditions = []
let deckSubtractions = []

$(() => {
	// Wenn man per $(document).on() Events an Elemente anhängt, werden auch alle zukünftigen Elemente passen
	// auf den Descriptor berücksichtig. Bei $('#abc').on() wird nur dieses Element berücksichtigt.
	// Würde dieses '#abc' gelöscht und neu eingefügt werden, hat es das angehangene Onclick nicht mehr.

	// Event-Handler fürs Hinzufügen von Karten ins Deck.
	$(document).on('dblclick', '#card-result-container > img', (event) => {
		let deckContainer = $('#editor-deck-container');
		let cardsInDeck = deckContainer.children();
		// Maximale Anzahl an Karten pro Deck ist 60.
		if (cardsInDeck.length < 60) {
			// Muss kopiert werden, sonst wird die Karte von der Suchliste in die Deckliste rübergezogen.
			let clickedCardCopy = $(event.currentTarget).clone(true, true);
			let cardID = clickedCardCopy.data('cardID');
			let cardName = clickedCardCopy.data('cardName');
			let amountOfTimesInDeck = 0;

			// Schaut durch die Liste der Elemente in der .HTML-Seite und findet heraus,
			// wie oft die angeklickte Karte bereits im Deck ist.
			for (let i = 0; i < cardsInDeck.length; i++) {
				if (cardsInDeck.eq(i).data('cardID') === cardID) {
					amountOfTimesInDeck++;
				}
			}

			// Jede Karte darf nur 4x im Deck sein, außer es sind Basic-Lands.
			if (amountOfTimesInDeck >= 4 && (cardName !== 'Plains' && cardName !== 'Island' &&
				cardName !== 'Forest' && cardName !== 'Mountain' && cardName !== 'Swamp')) {
				alert('You can only select this card up to 4 times.');
			} else {
				let subtractionFound = false;

				// Geht solange durch alle Subtractions durch, und sucht nach der zu entfernende Karte, bis etwas gefunden wurde.
				for (let i = 0; i < deckSubtractions.length; i++) {
					if (deckSubtractions[i].id === cardID) {
						subtractionFound = true;
						// Entfernt diese dann aus den Subtractions und endet die Schleife.
						deckSubtractions.splice(i, 1);
						i = deckSubtractions.length;
					}
				}

				// Wenn die Karte nicht in den Subtractions gefunden wurde, dann wird diese in die Additions eingetragen.
				if (!subtractionFound) {
					deckAdditions.push({
						id: cardID
					});
				}

				// Fügt die neue Karte dem Frontend hinzu.
				clickedCardCopy.appendTo(deckContainer);

				// Updatet den Karten-Counter im Frontend.
				let cardCounter = $('#card-counter');
				cardCounter.html(Number(cardCounter.html()) + 1);
			}
		} else {
			alert('You can only have a maximum of 60 cards in your deck.');
		}
	});

	// Event-Handler fürs Entfernen von Karten aus dem Deck.
	$(document).on('dblclick', '#editor-deck-container > img', (event) => {
		let removeCard = $(event.currentTarget);
		let removeCardID = removeCard.data('cardID');
		let additionFound = false;

		// Geht solange durch alle Additions durch, und sucht nach der zu entfernenden Karte, bis etwas gefunden wurde.
		for (let i = 0; i < deckAdditions.length; i++) {
			if (deckAdditions[i].id === removeCardID) {
				additionFound = true;
				// Entfernt diese dann aus den Additions und endet die Schleife.
				deckAdditions.splice(i, 1);
				i = deckAdditions.length;
			}
		}

		// Wenn die Karte nicht in den Additions gefunden wurde, dann wird diese in die Subtractions eingetragen.
		if (!additionFound) {
			deckSubtractions.push({
				id: removeCardID
			});
		}

		// Entfernt Karte aus dem Frontend.
		removeCard.remove();

		// Updatet den Karten-Counter im Frontend.
		let cardCounter = $('#card-counter');
		cardCounter.html(Number(cardCounter.html()) - 1);
	});
});

function registerForEditor() {
	$('#start-game-menu').show();

	// Setzt für den Button das Event, den Spieler zu einem Spiel anzumelden.
	$('.start-game-button').on('click', () => {
		enterEditor();
	});
}

// Übernimmt alle nötigen Änderungen an der Seite, wenn auf den Editor gewechselt wird.
function enterEditor() {
	let playerName = $('.playerName').val();
	if (playerName !== '') {
		// Der Button darf nur einmal erfolgreich geklickt werden.
		$('.start-game-button').off('click');

		$('#start-game-menu').hide();
		$('#pName').html(playerName);

		// Stellt Verbindung zum Server her, damit Datenbank-Abfragen sofort gesendet werden können.
		initConnection();

		pageTransition($('#index'), $('#editor'), 'Editor');

		// Nach 250ms wird eine Anfrage an den Server gesendet, die alle Decks des Spielers läd und zur Auswahl zur Verfügung stellt.
		setTimeout(() => {
			socket.emit('editorGetAllPlayerDecks', playerName);
		}, 250);

		// Setzt Events, wenn bei der Deckauswahl eine Änderung vorkommt.
		$('#editor-deck-selector').on('change', () => {
			if (confirm('Do you want to save your changes to the current deck?\nYour unsaved changed will be lost!')) {
				saveDeck(false);

				// Ausführen der Funktion wird gestoppt und nach dem Speichern wird changeToOtherDeck() via "deckSavedFromPrompt" in SocketEvents.js ausgeführt.
				return;
			} else {
				changeToOtherDeck($('#editor-deck-selector').val());
			}
		});
	}
}

function changeToOtherDeck(deckId) {
	if (deckId !== '') {
		if (deckId === 'new') {
			promptNewDeckCreation();
		} else {
			editorLoadSelectedDeck(deckId);
		}
	}
}

function promptNewDeckCreation() {
	$('#new-deck-menu').show();
}

function createNewDeck() {
	if ($('#deck-name').val() !== '') {
		$('#new-deck-menu').hide();
		// Wir brauchen eine UUID für unser neues Deck. Diese UUID lassen wir von unserem Server generieren, da wir ein Modul dafür haben.
		socket.emit('askForNewDeckID');

		deckAdditions = [];
		deckSubtractions = [];
	}
}

function editorLoadSelectedDeck(deckId) {
	socket.emit('loadSelectedDeck', deckId);

	deckAdditions = [];
	deckSubtractions = [];
}

function saveDeck(viaButton) {
	let deckInfo = $('#editor-deck-selector option:selected');
	let deckData = {
		playerName: $('#pName').html(),
		deckId: deckInfo.val(),
		deckName: deckInfo.text(),
		additions: deckAdditions,
		subtractions: deckSubtractions
	}

	if (viaButton) {
		socket.emit('editorSaveDeckViaButton', deckData);
	} else {
		socket.emit('editorSaveDeckViaPrompt', deckData);
	}

	deckAdditions = [];
	deckSubtractions = [];
}
