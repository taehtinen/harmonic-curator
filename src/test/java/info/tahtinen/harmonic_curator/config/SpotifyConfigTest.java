package info.tahtinen.harmonic_curator.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class SpotifyConfigTest {

    @Autowired
    SpotifyConfig spotifyConfig;

    @Test
    void clientIdIsSet() {
        String clientId = spotifyConfig.getClientId();
        assertNotNull(clientId, "Spotify Client ID should not be null");
        assertNotEquals("your_spotify_client_id", clientId, "Spotify Client ID should be set to a real value");
    }

}