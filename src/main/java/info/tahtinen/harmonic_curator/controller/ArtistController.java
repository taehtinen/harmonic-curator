package info.tahtinen.harmonic_curator.controller;

import info.tahtinen.harmonic_curator.dto.ArtistDto;
import info.tahtinen.harmonic_curator.services.ArtistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/artists")
@RequiredArgsConstructor
public class ArtistController {

    private final ArtistService artistService;

    @GetMapping
    public Flux<ArtistDto> getAllArtists() {
        return artistService.getAllArtists();
    }

}
