// isPOne ist, dass der Client weiß, ob er Spieler 1 oder 2 ist.
let isPOne;
// Für den Client, welcher Spieler gerade am Zug ist.
let pOneTurn = true;
let pOneHP;
let pTwoHP;
let pOneDeck = [];
let pTwoDeck = [];
let pOneHand = [];
let pTwoHand = [];
let pOneField = [];
let pTwoField = [];
let pOneGraveyard = [];
let pTwoGraveyard = [];
let pOneMana = 0;
let pTwoMana = 0;

function initGame(room) {
    let pOne = room.gameState.boardState.p1Data;
    let pTwo = room.gameState.boardState.p2Data;

    // Setzt alle globalen Variablen/Daten die für das Spiel benötigt wurden und noch nicht gesetzt wurden.
    pOneHP = pOne.life;
    pTwoHP = pTwo.life;
    pOneDeck = pOne.library; // TODO Nicht den Namen, sondern nur die Karten..
    pTwoDeck = pTwo.library; // ^
    $('#currentPhase').html(room.gameState.currentPhase);

    // TODO Onclick-Events für die UI/Buttons (Erst wenn HTML steht.)

    // Startet die PreGame-Phase 1.
    initPreGamePhaseOne(room);
}

/*
// Könnte man vllt. noch gebrauchen..
function determineStartingPlayer() {
    drawStartHand(true);
    drawStartHand(false);

    // Generiert wer anfängt. (Math.round(Math.random()) generiert "1" oder "0", wobei 1 = true & 0 = false ist.)
    let doesPOneStart = Math.round(Math.random()) === true;
    startNextPlayerTurn(doesPOneStart);
}
*/

function initPreGamePhaseOne(room) {
    drawStartHand(isPOne, room);
}