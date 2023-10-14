package cardgame.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Set;

@Entity
@Getter
@Setter
public class Carddeck {

    @Id
    private String deckName;

    private Enum<Color> color;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "carddeck", orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<DeckCardLink> cards;

    public Carddeck() {
    }

    public Carddeck(String deckName, Enum<Color> color) {
        this.deckName = deckName;
        this.color = color;
    }
}
