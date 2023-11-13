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

function drawStartHand(forPOne) {
    for (let i = 0; i < 7; i++) {
        drawCard(forPOne);
    }

    if (forPOne) {
        if (!confirm('Möchten Sie diese Hand behalten?')) {
            // Wenn Spieler nicht halten will, fügt es die aktuelle Hand wieder dem Deck hinzu und leert die Hand.
            pOneDeck = pOneDeck.concat(pOneHand);
            pOneHand = [];

            // Zieht erneut.
            drawStartHand(true);
        }
    }
}

// TODO (cardCount wäre eine mögliche Erweiterung, falls mehrere Karten abgeworfen werden müssen.. aber idk obs dazu kommen würde^^)
// Spieler wird aufgefordert Karten abzuwerfen. (Bsp.: Spieler hat zu viele Karten am Ende des Zugs.
function promptDiscard(/*cardCount*/) {

}
