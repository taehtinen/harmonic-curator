package info.tahtinen.harmonic_curator.services;

import info.tahtinen.harmonic_curator.config.SpotifyConfig;
import info.tahtinen.harmonic_curator.models.spotify.SpotifyArtist;
import info.tahtinen.harmonic_curator.models.spotify.SpotifySearchResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@RequiredArgsConstructor
@Service
@Slf4j
public class SpotifyService {

    // Spotify API limits
    private static final int MAX_LIMIT = 50;
    private static final int MAX_OFFSET = 1000;

    private final SpotifyConfig spotifyConfig;

    public Flux<SpotifyArtist> searchArtists(@NonNull String query) {
        return fetchArtists(query, 0);
    }

    private Flux<SpotifyArtist> fetchArtists(String query, int offset) {
        if (offset >= MAX_OFFSET) {
            return Flux.empty();
        }
        log.info("Fetching artists with query: '{}' and offset: {}", query, offset);
        return spotifyConfig.getWebClient().flatMapMany(webClient -> webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/search")
                        .queryParam("q", query)
                        .queryParam("type", "artist")
                        .queryParam("limit", MAX_LIMIT)
                        .queryParam("offset", offset)
                        .build())
                .retrieve()
                .bodyToMono(SpotifySearchResponse.class)
                .flatMapMany(response -> {
                    List<SpotifyArtist> artists = response.artists().items();
                    log.info("Fetched {} artists", artists.size());
                    return Flux.fromIterable(artists)
                            .concatWith(fetchArtists(query, offset + MAX_LIMIT));
                }));
    }

}
