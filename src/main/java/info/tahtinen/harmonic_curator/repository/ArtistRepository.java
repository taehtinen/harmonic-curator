package info.tahtinen.harmonic_curator.repository;

import info.tahtinen.harmonic_curator.domain.Artist;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ArtistRepository extends R2dbcRepository<Artist, Long> {

    Mono<Artist> findBySpotifyId(String spotifyId);

}
