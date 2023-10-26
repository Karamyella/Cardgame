// TODO Generelle Planung + Ablauf-Doku + Code

/*
* Ablauf:
* 1. Board für Spieler wird untapt.
* 2. Spieler zieht Karte.
* 3. Nächste Aktionen über UI verfügbar.
* */
function startNextPlayerTurn() {
    untapCards(true);
    drawCard(true);
}

// TODO
function endPlayerTurn() {
    if (playerHand.length > 7) {
        /* for (let i = playerHand.length; i > 7; i--) {
            // TODO: promptDiscard();
        } */
    }

    // TODO startNextBotTurn();
}
