package info.tahtinen.harmonic_curator.services;

import info.tahtinen.harmonic_curator.domain.Artist;
import info.tahtinen.harmonic_curator.dto.ArtistDto;
import info.tahtinen.harmonic_curator.models.spotify.SpotifyArtist;
import info.tahtinen.harmonic_curator.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RequiredArgsConstructor
@Service
@Slf4j
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final SpotifyService spotifyService;

    private static final List<String> SPOTIFY_SEARCHES = List.of(
            "finnish",
            "finnish rock",
            "finnish pop",
            "finnish metal",
            "finnish hip hop",
            "iskelmä"
    );

    public Flux<ArtistDto> getAllArtists() {
        return artistRepository.findAll()
                .map(this::mapToDto);
    }

    private ArtistDto mapToDto(Artist artist) {
        return new ArtistDto(
                artist.getId(),
                artist.getName(),
                artist.getGenres(),
                artist.getSpotifyId(),
                artist.getSpotifyFollowers(),
                artist.getSpotifyPopularity()
        );
    }

    public Mono<Void> updateArtistsFromSpotify() {
        return Flux.fromIterable(SPOTIFY_SEARCHES)
                .flatMap(spotifyService::searchArtists)
                .flatMap(spotifyArtist -> {
                    Mono<Artist> existingArtistMono = artistRepository.findBySpotifyId(spotifyArtist.id());
                    return existingArtistMono
                            .flatMap(existingArtist -> {
                                log.debug("Updating existing artist: {} {}", spotifyArtist.id(), spotifyArtist.name());
                                return updateArtist(spotifyArtist, existingArtist);
                            })
                            .switchIfEmpty(Mono.defer(() -> {
                                log.debug("Creating new artist: {} {}", spotifyArtist.id(), spotifyArtist.name());
                                return createArtist(spotifyArtist);
                            }))
                            .onErrorResume(e -> {
                                // Duplicate arists cause key violations, log and continue
                                if (e.getMessage() != null && e.getMessage().contains("duplicate key")) {
                                    log.warn("Duplicate artist found: {} {}. Skipping.", spotifyArtist.id(), spotifyArtist.name());
                                    return Mono.empty();
                                } else {
                                    log.error("Error processing artist: {} {}: {}", spotifyArtist.id(), spotifyArtist.name(), e.getMessage());
                                    return Mono.empty();
                                }
                            });
                })
                .then();

    }

    private Mono<Artist> createArtist(SpotifyArtist spotifyArtist) {
        Artist newArtist = new Artist();
        newArtist.setSpotifyId(spotifyArtist.id());
        return updateArtist(spotifyArtist, newArtist);
    }

    private Mono<Artist> updateArtist(SpotifyArtist spotifyArtist, Artist artist) {
        artist.setName(spotifyArtist.name());
        artist.setGenres(List.of(spotifyArtist.genres()));
        artist.setSpotifyFollowers(spotifyArtist.followers().total());
        artist.setSpotifyPopularity(spotifyArtist.popularity());
        return artistRepository.save(artist);
    }
}
