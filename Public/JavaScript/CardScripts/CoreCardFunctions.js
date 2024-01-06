function playCard() {
	let cardElement = $('#contextMenu').data('targetCard');
	if (cardElement.hasClass('land')) {
		// Es darf nur eine Landkarte pro Zug gespielt werden.
		if (!landPlayedThisTurn) {
			// Wenn Spieler 1 dran ist, wird aus dessen Hand die gespielte Karte gesucht, sonst Spieler 2.
			let playerHand = whosTurn === 'Player 1' ? pOneHand : pTwoHand;

			// Geht durch die Hand und sucht die gespielte Karte.
			for (let i = 0; i < playerHand.length; i++) {
				// Wenn die Karten-Ids sich überschneiden..
				if (playerHand[i].id === cardElement.data('data').id) {
					// ..auf der Oberfläche aus der Hand entfernt.
					cardElement.remove();

					// ..wird dem Spieler die Karte auf Feld gesetzt und das Mana um 1 erhöht.
					if (whosTurn === 'Player 1') {
						pOneField.push(playerHand[i]);
						pOneMana++;
						pOneMaxMana++;
						$('#pOneMana').html(pOneMana + '/' + pOneMaxMana);
						$('#pOneField').append(cardElement);
					} else {
						pTwoField.push(playerHand[i]);
						pTwoMana++;
						pTwoMaxMana++;
						$('#pTwoMana').html(pTwoMana + '/' + pTwoMaxMana);
						$('#pTwoField').append(cardElement);
					}

					// ..wird diese aus dem Hand-Array entfernt.
					playerHand.splice(i, 1);

					landPlayedThisTurn = true;

					// Sendet zum anderen Spieler, dass der Spieler etwas gemacht hat.
					socket.emit('playerAction', collectGameData());

					// Endet die Schleife.
					i = playerHand.length + 1;
				}
			}
		} else {
			alert('You already played a land-card this turn.');
		}
	} else {
		// Das Mana des Spielers, der grade dran ist.
		let currentManaPool = whosTurn === 'Player 1' ? pOneMana : pTwoMana;
		let manaCost = cardElement.data('manaCost');
		if (currentManaPool >= manaCost) {
			// Wenn Spieler 1 dran ist, wird aus dessen Hand die gespielte Karte gesucht, sonst Spieler 2.
			let playerHand = whosTurn === 'Player 1' ? pOneHand : pTwoHand;
			let forPOne = whosTurn === 'Player 1';

			// Geht durch die Hand und sucht die gespielte Karte.
			for (let i = 0; i < playerHand.length; i++) {
				// Wenn die Karten-Ids sich überschneiden..
				if (playerHand[i].id === cardElement.data('data').id) {
					currentManaPool -= manaCost;

					if (forPOne) {
						$('#pOneMana').html(currentManaPool + '/' + pOneMaxMana);
					} else {
						$('#pTwoMana').html(currentManaPool + '/' + pTwoMaxMana);
					}

					cardElement = handleCardEffects(cardElement, playerHand[i]);

					// ..auf der Oberfläche aus der Hand entfernt.
					cardElement.remove();

					// ..kommen alle Kartentypen außer "Sorceries" aufs Feld.
					if (!cardElement.hasClass('sorcery')) {
						if (forPOne) {
							pOneField.push(playerHand[i]);
							$('#pOneField').append(cardElement);
						} else {
							pTwoField.push(playerHand[i]);
							$('#pTwoField').append(cardElement);
						}
					} else {
						// Bei Sorceries kommen die Karten dann in den Graveyard.
						if (forPOne) {
							pOneGraveyard.push(playerHand[i]);
							$('#pOneGraveyard').html('[' + pOneGraveyard.length + ']').data('content', pOneGraveyard);
						} else {
							pTwoGraveyard.push(playerHand[i]);
							$('#pTwoGraveyard').html('[' + pTwoGraveyard.length + ']').data('content', pTwoGraveyard);
						}

						// Und eine Animation wird angestoßen, die zeigt, welche Sorcery grade gespielt wurde.
						socket.emit('playSorcery', cardElement);
					}

					// ..wird diese aus dem Hand-Array entfernt.
					playerHand.splice(i, 1);

					// Sendet zum anderen Spieler, dass der Spieler etwas gemacht hat.
					socket.emit('playerAction', collectGameData());

					// Endet die Schleife.
					i = playerHand.length + 1;
				}
			}
		} else {
			alert('You don\'t have enough mana to play this card.');
		}
	}
}

// Führt "On-Cast"-Effekte aus.
// Fügt außerdem dem HTML-Element die statischen Karten-Effekte hinzu.
// Kreaturen kommen zusätzlich "schlafend" rein.
function handleCardEffects(cardElement, handCard) {
	let cardEffects = handCard.effect.split('|');

	// Fügt jeden Karteneffect als Klasse dem Element hinzu.
	for (let i = 0; i < cardEffects.length; i++) {
		let currentCardEffect = cardEffects[i];
		let forPOne = whosTurn === 'Player 1';
		let playerBoard = forPOne ? $('#pOneField') : $('#pTwoField');
		let value;
		let effectSplit = currentCardEffect.split('(')[1];
		switch (currentCardEffect) {
			case 'vigilance()':
				cardElement.addClass('vigilance');
				break;
			case 'fly()':
				cardElement.addClass('flying');
				break;
			case 'lifelink()':
				cardElement.addClass('lifelink');
				break;
			case `drawCards(${effectSplit}`:
				value = Number(getEffectValue(currentCardEffect));

				// Der, der dran ist, zieht x Karten.
				for (let i = 0; i < value; i++) {
					drawCard(forPOne);
				}
				break;
			case `gainLife(${effectSplit}`:
				value = Number(getEffectValue(currentCardEffect));

				if (forPOne) {
					pOneHP += value;
					$('#pOneHP').html(pOneHP);
				} else {
					pTwoHP += value;
					$('#pTwoHP').html(pTwoHP);
				}
				break;
			case `createToken(${effectSplit}`:
				let tokenAttributes = currentCardEffect.split('`')[1].split(',');
				let board = forPOne ? pOneField : pTwoField;
				value = Number(tokenAttributes[4]);

				// Baut den createToken-String auseinander und baut daraus Creature-Tokens.
				for (let i = 0; i < value; i++) {
					let src = tokenAttributes[3].substring(2, tokenAttributes[3].length - 1);
					$('<img>').attr('src', src)
						.addClass('creature')
						.addClass('token')
						.addClass('played')
						.data('data', {
							'attack': tokenAttributes[1].trim(),
							'hp': tokenAttributes[2].trim()
						})
						.appendTo(playerBoard);

					board.push({
						attack: tokenAttributes[1].trim(),
						hp: tokenAttributes[2].trim(),
						image: src,
						type: 'creature',
						token: true,
						justPlayed: true
					})
				}

				break;
			case `gainLifePerCardInHand(${effectSplit}`:
				value = Number(getEffectValue(currentCardEffect));

				// Fügt pro Kartenhand x HP hinzu.
				if (forPOne) {
					pOneHP = pOneHP + (pOneHand.length * value);
					$('#pOneHP').html(pOneHP);
				} else {
					pTwoHP = pTwoHP + (pTwoHand.length * value);
					$('#pTwoHP').html(pTwoHP);
				}

				break;
			case `enemyDrawsCards(${effectSplit}`:
				value = Number(getEffectValue(currentCardEffect));

				// Der "Gegner" zieht x Karten.
				for (let i = 0; i < value; i++) {
					drawCard(!forPOne);
				}

				break;
			case `millCards(${effectSplit}`:
				value = Number(getEffectValue(currentCardEffect));

				// Holt aus dem Deck des Spielers x Karten raus und tut diese in den Graveyard. Updated auch die UI.
				if (isPOne) {
					for (let i = 0; i < value; i++) {
						pOneGraveyard.push(pOneDeck.splice(0, 1)[0]);
					}
					$('#pOneLibrary').html('[' + pOneDeck.length + ']');
					$('#pOneGraveyard').html('[' + pOneGraveyard.length + ']').data('content', pOneGraveyard);
				} else {
					for (let i = 0; i < value; i++) {
						pTwoGraveyard.push(pTwoDeck.splice(0, 1)[0]);
					}
					$('#pTwoLibrary').html('[' + pTwoDeck.length + ']');
					$('#pTwoGraveyard').html('[' + pTwoGraveyard.length + ']').data('content', pTwoGraveyard);
				}

				break;
			case `destoryAll(${effectSplit}`:
				value = getEffectValue(currentCardEffect);

				// Zerstört alles vom Typen in value auf beiden Feldern.
				$('#pOneField > img, #pTwoField > img').each((index, element) => {
					let $e = $(element);
					if ($e.hasClass(value)) {
						$e.remove();

						// Alles außer Tokens kommen in den Graveyard.
						if (!$e.hasClass('token')) {
							// TODO
						}
					}
				});

				break;
		}
	}

	return cardElement;
}

function getEffectValue(effect) {
	return effect.split('(')[1].substring(0, 1);
}

function untapCards(forPOne) {
	if (forPOne) {
		$('#pOneField > img').each((index, element) => {
			$(element).removeClass('tapped').removeClass('played').addClass('untapped');
		});
	} else {
		$('#pTwoField > img').each((index, element) => {
			$(element).removeClass('tapped').removeClass('played').addClass('untapped');
		});
	}
}
