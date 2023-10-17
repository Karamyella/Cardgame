package cardgame.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Card {

    @Id
    private String cardName;

    private Enum<Color> color;
    private Integer manaCost;
    private Integer life;
    private Integer attack;
    private String effect;

    @ManyToOne(cascade = CascadeType.REMOVE)
    private DeckCardLink deck;

    public Card() {
    }

    public Card(String cardName, Enum<Color> color, Integer manaCost, Integer attack, String effect) {
        this.cardName = cardName;
        this.color = color;
        this.manaCost = manaCost;
        this.attack = attack;
        this.effect = effect;
    }
}
