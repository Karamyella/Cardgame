// isPOne ist, dass der Client weiß, ob er Spieler 1 oder 2 ist.
let isPOne;
// Für den Client, welcher Spieler gerade am Zug ist.
let whosTurn = 'Player 1';
let pOneHP;
let pTwoHP;
let pOneDeck;
let pTwoDeck;
let pOneHand = [];
let pTwoHand = [];
let pOneField = [];
let pTwoField = [];
let pOneGraveyard = [];
let pTwoGraveyard = [];
let pOneMana = 0;
let pTwoMana = 0;
let pOneMaxMana = 0;
let pTwoMaxMana = 0;
let landPlayedThisTurn = false;

function initGame(room) {
	let pOne = room.gameState.boardState.p1Data;
	let pTwo = room.gameState.boardState.p2Data;

	// Setzt alle globalen Variablen/Daten die für das Spiel benötigt wurden und noch nicht gesetzt wurden.
	pOneHP = pOne.life;
	pTwoHP = pTwo.life;
	pOneDeck = pOne.library;
	pTwoDeck = pTwo.library;

	$('#currentPhase').html(room.gameState.currentPhase);

	if (isPOne) {
		$('#pTwoHand').addClass('enemyHand');
		$('#pTwoField').addClass('enemyField');
		$('.pTwoInfo').addClass('enemyInfo');
		$(document).on('contextmenu', '#pOneHand > img', (event) => {
			rightClickHandCard(event);
		});
		$(document).on('contextmenu', '#pOneField > img:not(.land):not(.played):not(.tapped)', (event) => {
			rightClickValidFieldCard(event);
		});
		$('.border-div').show();
	} else {
		$('#pOneHand').addClass('enemyHand');
		$('#pOneField').addClass('enemyField');
		$('.pOneInfo').addClass('enemyInfo');
		$(document).on('contextmenu', '#pTwoHand > img', (event) => {
			rightClickHandCard(event);
		});
		$(document).on('contextmenu', '#pTwoField > img:not(.land):not(.played):not(.tapped)', (event) => {
			rightClickValidFieldCard(event);
		});
	}

	document.onclick = hideMenu;

	$(document).on('click', '#playCard-action', () => {
		playCard();
	});
	$(document).on('click', '#attack-action', () => {
		declareAttacker();
	});
	$(document).on('click', '#block-action', () => {
		// TODO IMPL. Blocken.
	});

	// Startet die PreGame-Phase 1.
	initPreGamePhaseOne(room);
}

function initPreGamePhaseOne(room) {
	setTimeout(() => {
		drawStartHand(isPOne, room);
	}, 1000);
}

function toggleHand() {
	$('.showHand').toggle();
	$('.hideHand').toggle();

	$('.playerHand:not(.enemyHand)').toggle();
}

function hideMenu() {
	document.getElementById("contextMenu").style.display = "none";
}

function rightClickHandCard(e) {
	// Wenn man Spieler 1 und an der Reihe ist ODER man Spieler 2 und an der Reihe ist..
	if ((whosTurn === 'Player 1' && isPOne) || (whosTurn === 'Player 2' && !isPOne)) {
		rightClick(e);
		// Fügt die Aktion zum Dialog hinzu.
		$('#contextMenu > *').html('').append($('<li><button id="playCard-action">Play Card</button></li>'));
	}
}

function rightClickValidFieldCard(e) {
	// Wenn man Spieler 1 und an der Reihe ist ODER man Spieler 2 und an der Reihe ist..
	if ((whosTurn === 'Player 1' && isPOne) || (whosTurn === 'Player 2' && !isPOne)) {
		let contextMenu = $('#contextMenu > *').html('');
		let currentPhase = $('#currentPhase').html();

		rightClick(e);

		// Fügt die Aktion zum Dialog hinzu.
		if (currentPhase === 'Combatphase - Declare Attackers') {
			// Attack-Option nur möglich, wenn 'Declare Attackers'-Phase ist.
			contextMenu.append($('<li><button id="attack-action">Attack</button></li>'));
		} else if (currentPhase === 'Combatphase - Declare Blockers') {
			// Block-Option nur möglich, wenn 'Declare Blockers'-Phase ist.
			contextMenu.append($('<li><button id="block-action">Block</button></li>'));
		}
	}
}

function rightClick(e) {
	e.preventDefault();
	if (document.getElementById("contextMenu").style.display === "block") {
		hideMenu();
	} else {
		let menu = document.getElementById("contextMenu");
		menu.style.display = 'block';
		menu.style.left = e.pageX + "px";
		menu.style.top = e.pageY + "px";

		$(menu).data('targetCard', $(e.currentTarget));
	}
}

// TODO Kommentare
function shuffleDeck(array) {
	let currentIndex = array.length;
	let randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex > 0) {

		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

// Nimmt alle aktuellen Spieldaten auf und gibt diese zurück.
function collectGameData() {
	return {
		currentPhase: $('#currentPhase').html(),
		whosTurn: whosTurn,
		lastPhase: undefined,
		boardState: {
			p1Data: {
				playerName: $('#pOneName').html(),
				life: pOneHP,
				currentMana: pOneMana,
				maxMana: pOneMaxMana,
				library: pOneDeck,
				hand: pOneHand,
				board: pOneField,
				graveyard: pOneGraveyard
			},
			p2Data: {
				playerName: $('pTwoName').html(),
				life: pTwoHP,
				currentMana: pTwoMana,
				maxMana: pTwoMaxMana,
				library: pTwoDeck,
				hand: pTwoHand,
				board: pTwoField,
				graveyard: pTwoGraveyard
			}
		}
	}
}

// Übernimmt alle mitgegebenen Änderungen und baut ggf. alles nochmals neu auf. (Sehr resourcenintensiv, aber zeitlich keine bessere Lösung gefunden..!)
function updateGameState(newGameState) {
	if (newGameState !== undefined) {

		// Welche Phase dran ist.
		if (newGameState.currentPhase !== undefined) {
			$('#currentPhase').html(newGameState.currentPhase);

			if (newGameState.currentPhase === 'PAUSED') {
				$('#freeze-game').show();
			}
		}

		// Wer dran ist.
		if (whosTurn !== undefined) {
			whosTurn = newGameState.whosTurn;
			// Highlighted die Border um den Screen für den Spieler der grade dran ist.
			if ((isPOne && whosTurn === 'Player 1') || (!isPOne && whosTurn === 'Player 2')) {
				$('.border-div').show();
			} else {
				$('.border-div').hide();
			}
			// Highlighted den Border um die Spielerinfo des Spielers der grade dran ist..
			if (whosTurn === 'Player 1') {
				$('.pOneInfo').css('border-color', 'white');
				$('.pTwoInfo').css('border-color', 'black');
			} else {
				$('.pTwoInfo').css('border-color', 'white');
				$('.pOneInfo').css('border-color', 'black');
			}
		}

		let pOneData = newGameState.boardState.p1Data;
		let pTwoData = newGameState.boardState.p2Data;

		if (pOneData.life !== undefined) {
			pOneHP = pOneData.life;
			$('#pOneHP').html(pOneData.life);

			if (pOneHP <= 0) {
				promptWin(false);
				return;
			}
		}
		if (pTwoData.life !== undefined) {
			pTwoHP = pTwoData.life;
			$('#pTwoHP').html(pTwoData.life);

			if (pTwoHP <= 0) {
				promptWin(true);
				return;
			}
		}

		if (pOneData.currentMana !== undefined && pOneData.maxMana !== undefined) {
			pOneMana = pOneData.currentMana;
			pOneMaxMana = pOneData.maxMana;
			$('#pOneMana').html(pOneData.currentMana + '/' + pOneData.maxMana);
		}
		if (pTwoData.currentMana !== undefined && pTwoData.maxMana !== undefined) {
			pTwoMana = pTwoData.currentMana;
			pTwoMaxMana = pTwoData.maxMana;
			$('#pTwoMana').html(pTwoData.currentMana + '/' + pTwoData.maxMana);
		}

		if (pOneData.library !== undefined) {
			pOneDeck = pOneData.library;
			$('#pOneLibrary').html('[' + pOneData.library.length + ']');
		}
		if (pTwoData.library !== undefined) {
			pTwoDeck = pTwoData.library;
			$('#pTwoLibrary').html('[' + pTwoData.library.length + ']');
		}

		if (pOneData.graveyard !== undefined) {
			pOneGraveyard = pOneData.graveyard;
			$('#pOneGraveyard').html('[' + pOneData.graveyard.length + ']').data('content', pOneData.graveyard);
		}
		if (pTwoData.graveyard !== undefined) {
			pTwoGraveyard = pTwoData.graveyard;
			$('#pTwoGraveyard').html('[' + pTwoData.graveyard.length + ']').data('content', pTwoData.graveyard);
		}

		if (pOneData.hand !== undefined) {
			pOneHand = pOneData.hand;
			buildHandElements(pOneData.hand, $('#pOneHand'));
		}
		if (pTwoData.hand !== undefined) {
			pTwoHand = pTwoData.hand;
			buildHandElements(pTwoData.hand, $('#pTwoHand'));
		}

		if (pOneData.board !== undefined) {
			pOneField = pOneData.board;
			buildBoardElements(pOneData.board, $('#pOneField'));
		}
		if (pTwoData.board !== undefined) {
			pTwoField = pTwoData.board;
			buildBoardElements(pTwoData.board, $('#pTwoField'));
		}
	}
}

function buildHandElements(handData, container) {
	container.html('');

	for (let i = 0; i < handData.length; i++) {
		let card = handData[i];
		$('<img>').addClass(card.type)
			.attr('src', card.image)
			.data('manaCost', card.mana)
			.data('effect', card.effect)
			.data('data', card)
			.appendTo(container);
	}
}

function buildBoardElements(boardData, container) {
	container.html('');

	for (let i = 0; i < boardData.length; i++) {
		let card = boardData[i];
		let img = $('<img>').addClass(card.type)
			.attr('src', card.image)
			.data('manaCost', card.mana)
			.data('effect', card.effect)
			.data('data', card);

		if (card.token !== undefined) {
			img.addClass('token');
		}
		if (card.justPlayed !== undefined) {
			img.addClass('played');
		}
		if (card.tapped !== undefined) {
			img.addClass('tapped');
		}
		if (card.vigilance !== undefined) {
			img.addClass('vigilance');
		}
		if (card.flying !== undefined) {
			img.addClass('flying');
		}
		if (card.lifelink !== undefined) {
			img.addClass('lifelink');
		}

		img.appendTo(container);
	}
}

function promptWin(forPOne) {
	// Wenn Spieler 1 gewinnt wirds für ihn ausgelöst, für Spieler 2, wenn er gewinnt.
	if ((isPOne && forPOne) || (!isPOne && !forPOne)) {
		if (confirm('You have won the game! Congratulations ^-^\nDo you want to start a new match? :)')) {
			pageTransition($('#arena'), $('#empty-page'), '');
			setTimeout(() => {
				window.location.reload();
			}, 500);
		}
	}
}