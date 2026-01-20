package info.tahtinen.harmonic_curator.models.spotify;

public record SpotifyArtist(
        String id,
        String name,
        Followers followers,
        Integer popularity,
        String[] genres
) {
    public record Followers(Integer total) {
    }
}
