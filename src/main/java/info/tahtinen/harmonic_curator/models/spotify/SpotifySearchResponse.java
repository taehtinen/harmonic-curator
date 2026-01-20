package info.tahtinen.harmonic_curator.models.spotify;

import java.util.List;

public record SpotifySearchResponse(
        SpotifyArtists artists
) {
    public record SpotifyArtists(
            List<SpotifyArtist> items
    ) {
    }
}
