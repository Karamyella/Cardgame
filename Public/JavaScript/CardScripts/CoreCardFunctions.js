// TODO
function playCard(pOneTurn, cardData) {
    let cardCost = cardData.manaCost;

    if (pOneTurn) {
        if (pOneMana >= cardCost) {
            updatePlayerMana(pOneTurn, false, cardCost);
            // TODO Karte aufs Feld legen.
            // ...();
        } else {
            // TODO Meldung, dass nicht möglich ist.
        }
    } else {
        if (pTwoMana >= cardCost) {
            updatePlayerMana(pOneTurn, false, cardCost);
            // TODO Karte aufs Feld legen.
            // ...();
        } else {
            // TODO Meldung, dass nicht möglich ist.
        }
    }
}

function tapCard(context, effect) {
    if (context === 'Attack') {
        socket.emit('attack', effect);
    } else if (context === 'Effect') {
        socket.emit('effect', effect);
    } else /* if (context === 'Mana') */ {
        socket.emit('mana', effect);
        updatePlayerMana(pOneTurn,true,0);
    }
}

// TODO
function untapCards(forPOne) {
    if (forPOne) {
        $('.pOneCard.tapped').each((index, element) => {
            $(element).removeClass('tapped').addClass('untapped');
        });
    } else {
        $('.pTwoCard.tapped').each((index, element) => {
            $(element).removeClass('tapped').addClass('untapped');
        });
    }
}
