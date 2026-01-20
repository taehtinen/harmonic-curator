package info.tahtinen.harmonic_curator.services;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

@SpringBootTest
class ArtistServiceTest {

    @Autowired
    ArtistService artistService;

    @Test
    void updateArtistsFromSpotify() {
        StepVerifier.create(artistService.updateArtistsFromSpotify())
                .verifyComplete();
    }

}