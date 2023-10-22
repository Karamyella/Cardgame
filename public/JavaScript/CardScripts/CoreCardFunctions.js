// TODO
function playCard() {
    // Try to pay Mana
    // Has enough? -> put card on board.
}

// TODO
function tapCard(context, effect) {
    if (context === 'Attack') {
        socket.emit('attack', effect);
    } else if (context === 'Effect') {
        socket.emit('effect', effect);
    } else /* if (context === 'Mana') */ {
        socket.emit('mana', effect);
    }
}

// TODO
function untapCards(forPlayer) {
    if (forPlayer) {
        $('.playerCard.tapped').each((index, element) => {
            $(element).removeClass('tapped').addClass('untapped');
        });
    } else {
        $('.enemyCard.tapped').each((index, element) => {
            $(element).removeClass('tapped').addClass('untapped');
        });
    }
}
