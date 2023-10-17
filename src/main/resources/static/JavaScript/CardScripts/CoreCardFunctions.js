// TODO
function playCard() {
    // Try to pay Mana
    // Has enough? -> put card on board.
}

// TODO
function tapCard(context) {
    if (context === 'Attack') {

    } else if (context === 'Effect') {

    } else /* if (context === 'Mana') */ {

    }
}

// TODO
function untapCards(forPlayer) {
    if (forPlayer) {
        $('.playerCard.tapped').each(() => { /* TODO */});
    } else {
        $('.enemyCard.tapped').each(() => { /* TODO */});
    }
}
