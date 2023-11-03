// Alles in dieser Funktion wird beim Laden der Seite aufgerufen.
$(() => {
    // TODO UI-Stuff
    //$('#playerName').html(localStorage.getItem('PlayerName'));
    //$('#enemyName').html(localStorage.getItem('EnemyName'));
    $('#playerHP').html('40');
    $('#enemyHP').html('40');
    $('#playerMana').html('0');
    $('#enemyMana').html('0');

    // TODO Onclick-Events für die UI/Buttons

    //loadGameData();
})

/*
* Ablauf:
* 1. Läd Spielerdeck aus Datenbank in den Cache (Globale Variable).
* 2. Das Selbe für das Gegnerdeck.
* 3. Spielstart. (startGame())
* */
function loadGameData() {
    // Holt Spielerdeck über entsprechende ID aus LocalStorage (Wurde gesetzt als das Deck auf Startseite ausgewählt wurde.)
    $.ajax({
        type: 'GET',
        url: '/deck/getDeck/' + localStorage.getItem("playerDeckId"),
        success: function (response) {
            playerDeck = response;

            // Wenn Spielerdeck fertig geladen, holt Gegnerdeck über selbe Logik wie oben.
            $.ajax({
                type: 'GET',
                url: '/deck/getDeck/' + localStorage.getItem("enemyDeckId"),
                success: function (response) {
                    enemyDeck = response;

                    // Wenn alle Daten geladen wurden, wird Spiel gestartet.
                    startGame();
                }
            });
        }
    })
}

/*
* Ablauf:
* 1. Spieler zieht Starthand, gibt Möglichkeit neu zu ziehen.
* 2. Zieht Starthand für den Bot.
* 3. Entscheidet per Zufall wer beginnt und startet den ersten Zug.
* */
function startGame() {
    drawStartHand(true);
    drawStartHand(false);

    // Generiert wer anfängt. (Math.round(Math.random()) generiert "1" oder "0", wobei 1 = true & 0 = false ist.)
    let doesPlayerStart = Math.round(Math.random()) === true;
    if (doesPlayerStart) {
        startNextPlayerTurn();
    } else {
        startNextBotTurn();
    }
}
