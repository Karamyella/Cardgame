// Initialisierung der Serverkommuniktation.
const socket = io();

// DEBUG-Stuff
let deckbutton = document.querySelector('.deckbutton');
deckbutton.addEventListener('click', (event) => {
    event.preventDefault();

    // socket.emit sendet an den Server das Event "work".
    // Dieser kann darauf mit versch. Sachen reagieren.
    socket.emit('work');
});

// DEBUG-Stuff
let startbutton = document.querySelector('.startbutton');
startbutton.addEventListener('click', (event) => {
    event.preventDefault();

    socket.emit('yes');
});