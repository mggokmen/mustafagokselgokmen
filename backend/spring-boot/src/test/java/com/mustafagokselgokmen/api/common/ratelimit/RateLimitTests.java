package com.mustafagokselgokmen.api.common.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.ApiClient.Response;
import com.mustafagokselgokmen.api.support.IdentityTestConfiguration;
import com.mustafagokselgokmen.api.support.MutableClock;
import com.mustafagokselgokmen.api.support.MutableClockConfiguration;
import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import com.mustafagokselgokmen.api.support.TestcontainersConfiguration;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

/** Limits low enough to exhaust, and a clock this test moves to reach the next window. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({
  TestcontainersConfiguration.class,
  IdentityTestConfiguration.class,
  MutableClockConfiguration.class
})
@TestPropertySource(
    properties = {
      "app.rate-limit.sign-in.requests=3",
      "app.rate-limit.sign-in.per=1m",
      "app.rate-limit.refresh.requests=2",
      "app.rate-limit.refresh.per=30s",
      "app.rate-limit.contact-message.requests=2",
      "app.rate-limit.contact-message.per=1h"
    })
class RateLimitTests {

  @LocalServerPort int port;

  @Autowired MutableClock clock;

  @Autowired RateLimitProperties properties;

  private final TestIdentityProvider provider = TestIdentityProvider.get();
  private ApiClient api;

  @BeforeEach
  void setUp() {
    api = new ApiClient(port);
    // Every test shares one client IP: move past the longest window so each starts with a full
    // allowance.
    clock.advance(Duration.ofHours(1));
  }

  @Test
  void signInIsAllowedUpToTheLimitThenReturns429() {
    for (int attempt = 1; attempt <= properties.signIn().requests(); attempt++) {
      assertThat(signIn().status()).as("sign-in %d", attempt).isEqualTo(200);
    }

    Response limited = signIn();

    assertThat(limited.status()).isEqualTo(429);
    assertThat(limited.contentType()).isEqualTo("application/problem+json");
    assertThat(limited.<String>json("$.code")).isEqualTo("RATE_LIMITED");
    assertThat(limited.<Integer>json("$.status")).isEqualTo(429);
    assertThat(retryAfterSeconds(limited)).isBetween(1L, properties.signIn().per().toSeconds());
  }

  @Test
  void refreshRecoversAfterTheWindowPasses() {
    Duration window = properties.refresh().per();
    for (int attempt = 1; attempt <= properties.refresh().requests(); attempt++) {
      // Invalid tokens are rejected, but they still count against the limit.
      assertThat(refresh().status()).as("refresh %d", attempt).isEqualTo(401);
    }
    assertThat(refresh().status()).isEqualTo(429);

    clock.advance(window.plusSeconds(1));

    assertThat(refresh().status()).isEqualTo(401);
  }

  @Test
  void limitsAreCountedPerEndpoint() {
    for (int attempt = 1; attempt <= properties.refresh().requests() + 1; attempt++) {
      refresh();
    }

    assertThat(refresh().status()).isEqualTo(429);
    assertThat(signIn().status()).isEqualTo(200);
  }

  @Test
  void contactMessagesAreCountedPerUserNotPerAddress() {
    String author = accessToken();
    for (int attempt = 1; attempt <= properties.contactMessage().requests(); attempt++) {
      assertThat(sendMessage(author).status()).as("message %d", attempt).isEqualTo(201);
    }

    Response limited = sendMessage(author);

    assertThat(limited.status()).isEqualTo(429);
    assertThat(limited.<String>json("$.code")).isEqualTo("RATE_LIMITED");
    // Another user from the same address still has their own allowance.
    assertThat(sendMessage(accessToken()).status()).isEqualTo(201);
  }

  private Response signIn() {
    String idToken = provider.idToken(claims -> claims);
    return api.post("/api/v1/auth/google", "{\"idToken\":\"" + idToken + "\"}");
  }

  private String accessToken() {
    return signIn().json("$.accessToken");
  }

  private Response sendMessage(String accessToken) {
    return api.post(
        "/api/v1/contact-messages",
        "{\"subject\":\"Rate limit\",\"message\":\"Counting messages\"}",
        accessToken);
  }

  private Response refresh() {
    return api.post("/api/v1/auth/refresh", "{\"refreshToken\":\"not-a-refresh-token\"}");
  }

  private static long retryAfterSeconds(Response response) {
    return Long.parseLong(response.headers().getFirst("Retry-After"));
  }
}
