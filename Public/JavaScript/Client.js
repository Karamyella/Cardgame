// Wenn die Seite vollständig geladen ist, wird die Index-Seite eingefaded.
$(() => {
	pageTransition($('#empty-page'), $('#index'), 'Index');
});

let socket;

// Stellt Verbindung zum Server her und wartet auf Anweisungen vom Server.
function initConnection() {
	if (socket === undefined) {
		socket = io();

		// Läd alle Funktionen für den Client, die dann auf die Events vom Server reagieren.
		initSocketEvents();
	}
}

// Nimmt den Namen an und sendet eine Request an den Server, welche Decks dem angegebenen Spielernamen gehören und
// fordert ihn gleich dazu auf, ein Deck auszuwählen. Der Name und die DeckID wird dann später nochmals zum Server gesendet.
function submitName() {
	let playerName = $('input.playerName').val();
	if (playerName !== '') {
		socket.emit('askForPlayerDecks', playerName);
	}
}

// Sendet Spielernamen und DeckID an den Server zum Matchmaking.
function submitNameAndDeck() {
	let deckID = undefined;
	let selectedStandardDeck = $('.basic-deck-menu input:checked');
	let selectedOwnDeck = $('#own-deck-selector').val();

	// Ermittelt, welches der Decks ausgewählt wurde. (Gibt vllt. noch ne schönere Lösung aber was solls^^)
	if (selectedStandardDeck.length > 0) {
		deckID = selectedStandardDeck.val();
	} else if (selectedOwnDeck !== '') {
		deckID = selectedOwnDeck;
	} else {
		alert('Fehler: Es wurde kein Deck ausgewählt.');
		return;
	}

	let playerInfo = {
		playerName: $('input.playerName').val(),
		playerDeck: deckID
	};

	socket.emit('initMatchmaking', playerInfo);
}

function deckmenu() {
	$('#defaultmenu').hide();
	$('#deckmenu').show();
}

function togglecolor(className) {
	$('#defaultmenu').show();
	$('#deckmenu').hide();
	$('.menu-color').children().hide(); //hide all icons
	$(`#${className}`).show();  //show only the right color
}

function startRegistration() {
	initConnection();
	$('#start-game-menu').show();

	// Setzt für den Button das Event, den Spieler zu einem Spiel anzumelden.
	$('.start-game-button').on('click', () => {
		submitName();
	});
}

function enterArena() {
	socket.emit('playerIsReady');
	$('#enter-arena-btn').hide();
	$('#player-ready-text').show();
}

function sendCardRequest() {
	let cardData = {
		cardName: $('#search-input').val(),
		color: $('#editor-color-picker').val()
	}
	socket.emit('cardRequest', cardData);
}

// Sendet den jetzigen GameState zum Server für den Phasenwechsel. Darf nur vom aktuellen Spieler genutzt werden.
function nextPhase() {
	// Wenn man Spieler 1 und an der Reihe ist ODER man Spieler 2 und an der Reihe ist..
	if ((whosTurn === 'Player 1' && isPOne) || (whosTurn === 'Player 2' && !isPOne)) {
		socket.emit('phaseChange', collectGameData());
	}
}

// Handler für den Übergang zwischen Index und Arena.
function pageTransition(hideElement, showElement, toWhatPage) {
	if (toWhatPage === 'Arena') {
		// Versteckt die beiden Elemente, damit diese ein paar Frames weniger während der Transition zu sehen sind..
		$('#enemy-ready-text').hide();
		$('#player-ready-text').hide();

		$('#border-bottom').css('top', document.body.clientHeight - 8);
		document.title = 'Cardgame Arena';
	} else if (toWhatPage === 'Editor') {
		document.title = 'Cardgame Deckeditor';
	} else /* if (toWhatPage === 'Index') */ {
		document.title = 'Cardgame Startmenu';
	}

	showElement.show();
	// Animation, die eine Seite ausblendet/versteckt und die Andere anzeigt/einblendet.
	hideElement[0].animate({
		opacity: [1, 0]
	}, 500).onfinish = () => {
		hideElement.hide();
	};
	showElement[0].animate({
		opacity: [0, 0, 1]
	}, 1000).onfinish = () => {
		showElement.css('opacity', 1);
	};
}