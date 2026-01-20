package info.tahtinen.harmonic_curator.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.test.StepVerifier;

@SpringBootTest
class SpotifyServiceTest {

    @Autowired
    SpotifyService spotifyService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void searchArtists() {
        StepVerifier.create(spotifyService.searchArtists("finnish"))
                .verifyComplete();
    }
}