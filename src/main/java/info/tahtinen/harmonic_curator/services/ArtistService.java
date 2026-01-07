package info.tahtinen.harmonic_curator.services;

import info.tahtinen.harmonic_curator.domain.Artist;
import info.tahtinen.harmonic_curator.dto.ArtistDto;
import info.tahtinen.harmonic_curator.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@RequiredArgsConstructor
@Service
public class ArtistService {

    private final ArtistRepository artistRepository;

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
}
