

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