function botTurn() {

    //start turn
    untapCards(false);
    drawCard(false);

    //try to play cards
    for (let index = 0; index < botHand.length; ++index) {
        botHand[index].playCard();
    }

    //attack
    for (let index = 0; index < BotHand.length; ++index) {
        botField[index].tapCard("attack");
    }

    //end turn
    while (botHand.length > 7) {
        discardCard(false,0);
    }
}