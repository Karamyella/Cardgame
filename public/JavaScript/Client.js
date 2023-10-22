// Initialisierung der Serverkommuniktation.
let socket = io();
socket.emit('playerName', 'Steve');

socket.on('emitDebug', () => {
    alert('works');
});

// Stellt Verbindung zum Server her.
function initConnection() {
    socket = io();
}

// DEBUG-Stuff
let deckbutton = document.querySelector('.deckbutton');
deckbutton.addEventListener('click', (event) => {
    event.preventDefault();

    // socket.emit sendet an den Server das Event "work".
    // Dieser kann darauf mit versch. Sachen reagieren.
    socket.emit('debug');
});

// TODO Code-Snippet für Server-Antworten rausfinden
//socket.listen('hi', () => {console.log('oh hi mark');});

// DEBUG-Stuff
let startbutton = $('.startbutton');
startbutton.on('click', (event) => {
    event.preventDefault();

    initConnection();
    startbutton.off('click');
});
