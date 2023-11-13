function initializeGame(data) {
    alert('aaa')
    console.log(data);

    $('#pOneName').html(localStorage.getItem('PlayerName'));
    $('#pTwoName').html(localStorage.getItem('EnemyName'));
    $('#pOneHP').html(pOneHP.toString());
    $('#pTwoHP').html(pTwoHP.toString());

    // TODO Onclick-Events für die UI/Buttons (Erst wenn HTML steht.)

    loadGameData();
}

/*
* Ablauf:
* 1. Läd Spielerdeck aus Datenbank in den Cache (Globale Variable).
* 2. Das Selbe für das Gegnerdeck.
* 3. Spielstart. (startGame())
* */
function loadGameData() {


    /*
    // Holt Spielerdeck über entsprechende ID aus LocalStorage (Wurde gesetzt als das Deck auf Startseite ausgewählt wurde.)
    $.ajax({
        type: 'GET',
        url: '/deck/getDeck/' + localStorage.getItem("pOneDeckId"),
        success: function (response) {
            pOneDeck = response;

            // Wenn Spielerdeck fertig geladen, holt Gegnerdeck über selbe Logik wie oben.
            $.ajax({
                type: 'GET',
                url: '/deck/getDeck/' + localStorage.getItem("pTwoDeckId"),
                success: function (response) {
                    pTwoDeck = response;

                    // Wenn alle Daten geladen wurden, wird Spiel gestartet.
                    determineStartingPlayer();
                }
            });
        }
    });
    */
}

/*
* Ablauf:
* 1. Spieler zieht Starthand, gibt Möglichkeit neu zu ziehen.
* 2. Zieht Starthand für den Bot.
* 3. Entscheidet per Zufall wer beginnt und startet den ersten Zug.
* */
function determineStartingPlayer() {
    drawStartHand(true);
    drawStartHand(false);

    // Generiert wer anfängt. (Math.round(Math.random()) generiert "1" oder "0", wobei 1 = true & 0 = false ist.)
    let doesPOneStart = Math.round(Math.random()) === true;
    startNextPlayerTurn(doesPOneStart);
}
