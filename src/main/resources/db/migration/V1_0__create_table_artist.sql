CREATE TABLE artist
(
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    genres             TEXT[],
    spotify_id         VARCHAR(255) NOT NULL UNIQUE,
    spotify_followers  INTEGER,
    spotify_popularity INTEGER,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);