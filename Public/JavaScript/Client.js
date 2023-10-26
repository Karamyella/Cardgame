// Initialisierung der Serverkommuniktation. (Später soll dafür initConnection() genutzt werden.)
let socket = io();

// DEBUG-STUFF
socket.emit('playerName', name);
socket.on('emitDebug', () => {
    alert('Server says: Got your event, here is another event.');
});

// Wenn der Gegner austritt, wird die Partie beendet und der Spieler wird auf die Startseite weitergeleitet.
socket.on('playerDisconnected', (disconnectedPlayerName) => {
   alert(disconnectedPlayerName + ' ist aus der Partie ausgetreten. Sie werden auf die Startseite weitergeleitet.');
   window.location.href = '/';
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

// DEBUG-Stuff
let startbutton = document.querySelector('.startbutton');
startbutton.addEventListener('click', (event) => {
    event.preventDefault();

    initConnection();
    startbutton.off('click');
});
