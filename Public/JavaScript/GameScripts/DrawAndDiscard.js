function drawCard(forPOne) {
	if (forPOne) {
		// .splice entfernt die Karte aus dem Deck und .push fügt diese der Hand hinzu.
		pOneHand.push(pOneDeck.splice(0, 1)[0]);
		$('#pOneLibrary').html('[' + pOneDeck.length + ']');
		buildHandElements(pOneHand, $('#pOneHand'));
	} else {
		pTwoHand.push(pTwoDeck.splice(0, 1)[0]);
		$('#pTwoLibrary').html('[' + pTwoDeck.length + ']');
		buildHandElements(pTwoHand, $('#pTwoHand'));
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
	// Wenn man Spieler 1 ist und Spieler 1 am Zug ist, werden Karten gezogen und gefragt, ob man die Hand behalten will. (Gilt auch für Spieler 2!)
	if ((isPOne && whosTurn === 'Player 1') || (!isPOne && whosTurn === 'Player 2')) {
		if (forPOne) {
			pOneDeck = shuffleDeck(pOneDeck);
		} else {
			pTwoDeck = shuffleDeck(pTwoDeck);
		}

		for (let i = 0; i < 7; i++) {
			drawCard(forPOne);
		}

		setTimeout(() => {
			if (!confirm('Do you want to keep your starting-hand?')) {
				putHandBackIntoDeck(forPOne);

				// Startet Funktion von vorne.
				drawStartHand(forPOne);
			} else {
				// Wenn zufrieden, wird die nächste Phase eingeleitet.
				nextPhase();
			}
		}, 1500);
	}
}

// Wenn Spieler nicht halten will, fügt es die aktuelle Hand wieder dem Deck hinzu und leert die Hand.
function putHandBackIntoDeck(forPOne) {
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
