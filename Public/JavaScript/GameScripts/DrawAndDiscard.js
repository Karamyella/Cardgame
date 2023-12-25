function drawCard(forPOne) {
	// Zufällige Zahl zwischen [0 - Decksize], die bestimmt, welche Karte aus dem Deck gezogen wird.
	let drawPosition = Math.floor(Math.random() * pOneDeck.length);
	if (forPOne) {
		// .splice entfernt die Karte aus dem Deck und .push fügt diese der Hand hinzu.
		pOneHand.push(pOneDeck.splice(drawPosition, 1)[0]);
	} else {
		pTwoHand.push(pTwoDeck.splice(drawPosition, 1)[0]);
	}
}

function discardCard(forPOne, cardPosition) {
	if (forPOne) {
		// Wirft ausgewählte Karte d. Spielers ab.
		pOneGraveyard.push(pOneHand.splice(cardPosition, 1)[0]);
	} else {
		// Wirft automatisch die 1. Karte d. Bots ab.
		pTwoGraveyard.push(pTwoHand.splice(cardPosition, 1)[0]);
	}
}

/**
 * Im ersten Zug des gradigen Spielers werden 7 Karten gezogen. Wenn er seine Hand nicht behalten möchte, zieht er 7 neue Karten.
 * @param forPOne Gibt an, für wen die Karten gezogen werden sollen.
 * */
function drawStartHand(forPOne) {
	for (let i = 0; i < 7; i++) {
		drawCard(forPOne);
	}

	// Wenn man Spieler 1 ist und Spieler 1 am Zug ist, wird man gefragt, ob man die Hand behalten will. (Gilt auch für Spieler 2!)
	if (forPOne === isPOne) {
		if (!confirm('Do you want to keep your starting-hand?')) {
			redrawStartHand(forPOne);

			// Teilt dem Gegner mit, dass man eine neue Hand zieht.
			socket.emit('enemyDrawsNewHand');

			// Startet Funktion von vorne.
			drawStartHand(forPOne);
		}
	}
}

// Wenn Spieler nicht halten will, fügt es die aktuelle Hand wieder dem Deck hinzu und leert die Hand.
function redrawStartHand(forPOne) {
	if (forPOne) {
		pOneDeck = pOneDeck.concat(pOneHand);
		pOneHand = [];
	} else {
		pTwoDeck = pTwoDeck.concat(pTwoHand);
		pOneHand = [];
	}
}

// TODO (cardCount wäre eine mögliche Erweiterung, falls mehrere Karten abgeworfen werden müssen.. aber idk obs dazu kommen würde^^)
// Spieler wird aufgefordert Karten abzuwerfen. (Bsp.: Spieler hat zu viele Karten am Ende des Zugs.
function promptDiscard(/*cardCount*/) {

}
