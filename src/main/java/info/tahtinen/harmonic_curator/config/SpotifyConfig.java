package info.tahtinen.harmonic_curator.config;

import info.tahtinen.harmonic_curator.models.spotify.SpotifyTokenResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Configuration
@Data
@RequiredArgsConstructor
@Slf4j
public class SpotifyConfig {

    @Value("${spotify.api.url}")
    private String apiUrl;

    @Value("${spotify.client.id}")
    private String clientId;

    @Value("${spotify.client.secret}")
    private String clientSecret;

    @Value("${spotify.market}")
    private String market;

    @Value("${spotify.redirect.uri}")
    private String redirectUri;

    @Value("${spotify.user.id}")
    private String userId;

    @Value("${spotify.accounts.token.uri}")
    private String accountsTokenUri;

    public Mono<WebClient> getWebClient() {
        return getAuthorizationHeader()
                .map(authHeader -> WebClient.builder()
                        .baseUrl(apiUrl)
                        .defaultHeader("Authorization", authHeader)
                        .build()
                );
    }

    private String accessToken;

    public Mono<String> getAuthorizationHeader() {
        if (accessToken != null) {
            return Mono.just("Bearer " + accessToken);
        }
        return fetchNewAccessToken()
                .map(token -> {
                    this.accessToken = token;
                    return "Bearer " + token;
                });
    }

    private Mono<String> fetchNewAccessToken() {
        return WebClient.create()
                .post()
                .uri(accountsTokenUri)
                .headers(headers -> {
                    headers.setBasicAuth(clientId, clientSecret);
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                })
                .body(BodyInserters.fromFormData("grant_type", "client_credentials")
                        // This parameter is used for validation only (there is no actual redirection).
                        .with("redirect_uri", redirectUri))
                .retrieve()
                .onStatus(HttpStatusCode::isError,
                        response -> response.bodyToMono(String.class).flatMap(body -> {
                            log.error("Error fetching Spotify access token: {}", body);
                            return Mono.error(new RuntimeException("Failed to fetch Spotify access token: " + body));
                        }))
                .bodyToMono(SpotifyTokenResponse.class)
                .map(SpotifyTokenResponse::access_token)
                .doOnNext(token -> log.info("Fetched new Spotify access token"));
    }

}
