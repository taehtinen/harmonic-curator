package info.tahtinen.harmonic_curator.domain;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.Collection;

@Data
@Table
public class Artist {

    @Id
    private Long id;

    @Column("name")
    private String name;

    @Column("genres")
    private Collection<String> genres;

    @Column("spotify_id")
    private String spotifyId;

    @Column("spotify_followers")
    private Integer spotifyFollowers;

    @Column("spotify_popularity")
    private Integer spotifyPopularity;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

}
