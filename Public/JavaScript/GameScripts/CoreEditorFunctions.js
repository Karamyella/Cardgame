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
			for (let i = 0; i < cardsInDeck.length; i++) {
				// Wenn die ID der i'ten Karte gleich der ID der angeklickten Karte ist, dann wird der Counter erhöht.
				if (cardsInDeck.eq(i).data('cardID') === cardID) {
					amountOfTimesInDeck++;
				}
			}

			// Jede Karte darf nur 4x im Deck sein, außer es sind Basic-Lands.
			if (amountOfTimesInDeck >= 4 && (cardName !== 'Plains' || cardName !== 'Island' ||
				cardName !== 'Forest' || cardName !== 'Mountain' || cardName !== 'Swamp')) {
				alert('You can only select this card up to 4 times.');
			} else {
				// Fügt die neue Karte dem Frontend hinzu.
				clickedCardCopy.appendTo(deckContainer);
				// Fügt die neue Karte im Hintergrund der Liste hinzu.
				newDeck.cards.push({
					id: cardID
				});
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
		// Entfernt Karte aus dem Frontend.
		removeCard.remove();

		// Entfernt aus den Hintergrund-Daten die grade entfernte Karte.
		for (let i = 0; i < newDeck.cards.length; i++) {
			if (newDeck.cards[i].id === removeCardID) {
				newDeck.cards.splice(i, 1);
				i = newDeck.cards.length;
			}
		}

		// Updatet den Karten-Counter im Frontend.
		let cardCounter = $('#card-counter');
		cardCounter.html(Number(cardCounter.html()) - 1);
	});
});

/* newDeck ist ein Vermerk im Hintergrund, welche Karten nach den Änderungen im aktuellen Deck
* befinden, damit beim Speichern nicht alle Karten nochmal neu ausgelesen werden müssen. */
let newDeck = {};
// Aktuell ungenutzt..
let deckHasBeenChanged = false;

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
			// TODO Die Kommentare sind für falls man vor dem Speichern überprüfen möchte, ob Änderungen an einem Deck gemacht wurden.
			//if (deckHasBeenChanged) {
			if (confirm('Do you want to save your changes to the current deck?\nYour unsaved changed will be lost!')) {
				saveDeck(false);

				// Hier wird das Ausführen der Funktion gestoppt, und nach dem Speichern wird changeToOtherDeck() wieder ausgeführt.
				return;
			} else {
				//newDeck = {};
				changeToOtherDeck($('#editor-deck-selector').val());
			}
			//}

			//changeToOtherDeck($('#editor-deck-selector').val());
		});
	}
}

function changeToOtherDeck(selectedValue) {
	if (selectedValue !== '') {
		if (selectedValue === 'new') {
			promptNewDeckCreation();
		} else {
			editorLoadSelectedDeck();
		}
	} else {
		newDeck = {};
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
	}
}

function editorLoadSelectedDeck() {
	// TODO
}

function saveDeck(viaButton) {
	if (viaButton) {
		socket.emit('editorSaveDeckViaButton', newDeck);
	} else {
		socket.emit('editorSaveDeckViaPrompt', newDeck);
	}
}