package info.tahtinen.harmonic_curator.dto;

import java.util.Collection;

public record ArtistDto(
        Long id,
        String name,
        Collection<String> genres,
        String spotifyId,
        Integer spotifyFollowers,
        Integer spotifyPopularity
) {
}
