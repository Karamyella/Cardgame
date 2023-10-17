package cardgame.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
public class DeckCardLink {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID link_id;

    @ManyToOne(optional = false)
    private Carddeck carddeck;

    @JsonIgnore // Verhindert entstehen von Zirkelbezügen.
    @ManyToOne(optional = false)
    private Card card;

    public DeckCardLink() {
    }

    public DeckCardLink(Carddeck carddeck, Card card) {
        this.carddeck = carddeck;
        this.card = card;
    }
}
