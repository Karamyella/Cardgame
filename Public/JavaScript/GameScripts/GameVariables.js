let pOneDeck = [];
let pTwoDeck = [];
let pOneHP = 40;
let pTwoHP = 40;
let pOneTurn = true;
let pOneMana = 0;
let pTwoMana = 0;
let pOneHand = [];
let pTwoHand = [];
let pOneField = [];
let pTwoField = [];
let pOneGraveyard = [];
let pTwoGraveyard = [];

function updatePlayerMana(pOne, increase, cost) {
	if (pOne) {
		if (increase) {
			pOneMana++;
		} else {
			pOneMana = pOneMana - cost;
		}
		document.querySelector('#pOneMana').innerHTML = pOneMana.toString();
	} else {
		if (increase) {
			pTwoMana++;
		} else {
			pTwoMana = pTwoMana - cost;
		}
		document.querySelector('#pTwoMana').innerHTML = pTwoMana.toString();
	}
}