package com.mustafagokselgokmen.api.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.ApiClient.Response;
import com.mustafagokselgokmen.api.support.ApiIntegrationTest;
import com.mustafagokselgokmen.api.support.IdentityTestConfiguration;
import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;

@ApiIntegrationTest
class AuthApiTests {

  private static final String PROBLEM_JSON = "application/problem+json";

  @LocalServerPort int port;

  private final TestIdentityProvider provider = TestIdentityProvider.get();
  private ApiClient api;

  @BeforeEach
  void setUp() {
    api = new ApiClient(port);
  }

  @Test
  void signInCreatesTheUserAndReturnsATokenPair() {
    Response signIn = signIn(provider.idToken(newSubject(), "ada@example.com", "Ada Lovelace"));

    assertThat(signIn.status()).isEqualTo(200);
    assertThat(signIn.<String>json("$.tokenType")).isEqualTo("Bearer");
    assertThat(signIn.<Integer>json("$.expiresIn")).isEqualTo(900);
    assertThat(signIn.<String>json("$.refreshToken")).isNotBlank();

    Response me = api.get("/api/v1/auth/me", signIn.json("$.accessToken"));
    assertThat(me.status()).isEqualTo(200);
    assertThat(me.<String>json("$.email")).isEqualTo("ada@example.com");
    assertThat(me.<String>json("$.name")).isEqualTo("Ada Lovelace");
    assertThat(me.<String>json("$.role")).isEqualTo("USER");
  }

  @Test
  void signingInAgainUpdatesTheProfileOfTheSameUser() {
    String subject = newSubject();
    String firstId = currentUserId(signIn(provider.idToken(subject, "old@example.com", "Old")));

    Response again = signIn(provider.idToken(subject, "new@example.com", "New Name"));
    Response me = api.get("/api/v1/auth/me", again.json("$.accessToken"));

    assertThat(me.<String>json("$.id")).isEqualTo(firstId);
    assertThat(me.<String>json("$.email")).isEqualTo("new@example.com");
    assertThat(me.<String>json("$.name")).isEqualTo("New Name");
  }

  @Test
  void userWithoutANameIsNamedAfterTheirEmail() {
    Response signIn =
        signIn(provider.idToken(claims -> claims.claim("email", "noname@example.com")));

    Response me = api.get("/api/v1/auth/me", signIn.json("$.accessToken"));

    assertThat(me.<String>json("$.name")).isEqualTo("noname@example.com");
  }

  @Test
  void allowlistedEmailIsGrantedTheAdminRole() {
    // Locale.ROOT: under a Turkish default locale, "i".toUpperCase() is "İ", a different letter.
    String email = IdentityTestConfiguration.ADMIN_EMAIL.toUpperCase(Locale.ROOT);
    Response signIn = signIn(provider.idToken(newSubject(), email, "Admin"));

    Response me = api.get("/api/v1/auth/me", signIn.json("$.accessToken"));

    assertThat(me.<String>json("$.role")).isEqualTo("ADMIN");
  }

  @Test
  void rejectedIdTokenReturns401Problem() {
    Response signIn =
        signIn(provider.idTokenSignedWithUnknownKey(newSubject(), "mallory@example.com"));

    assertUnauthenticated(signIn);
  }

  @Test
  void blankIdTokenReturns400WithTheInvalidField() {
    Response signIn = api.post("/api/v1/auth/google", "{\"idToken\":\"\"}");

    assertThat(signIn.status()).isEqualTo(400);
    assertThat(signIn.contentType()).isEqualTo(PROBLEM_JSON);
    assertThat(signIn.<String>json("$.code")).isEqualTo("VALIDATION_FAILED");
    assertThat(signIn.<String>json("$.errors[0].field")).isEqualTo("idToken");
  }

  @Test
  void malformedBodyReturns400Problem() {
    Response signIn = api.post("/api/v1/auth/google", "{");

    assertThat(signIn.status()).isEqualTo(400);
    assertThat(signIn.<String>json("$.code")).isEqualTo("VALIDATION_FAILED");
  }

  @Test
  void valueOfTheWrongTypeReturns400InsteadOfBeingConverted() {
    Response logout = api.post("/api/v1/auth/logout", "{\"refreshToken\":false}");

    assertThat(logout.status()).isEqualTo(400);
    assertThat(logout.<String>json("$.code")).isEqualTo("VALIDATION_FAILED");
  }

  @Test
  void currentUserRequiresAnAccessToken() {
    assertUnauthenticated(api.get("/api/v1/auth/me", null));
  }

  @Test
  void currentUserRejectsATamperedAccessToken() {
    String accessToken = signIn(provider.idToken(claims -> claims)).json("$.accessToken");
    String[] parts = accessToken.split("\\.");
    String tampered = parts[0] + "." + parts[1].substring(1) + "." + parts[2];

    assertUnauthenticated(api.get("/api/v1/auth/me", tampered));
  }

  @Test
  void refreshRotatesTheTokenPair() {
    Response signIn = signIn(provider.idToken(claims -> claims));

    Response refreshed = refresh(signIn.json("$.refreshToken"));

    assertThat(refreshed.status()).isEqualTo(200);
    assertThat(refreshed.<String>json("$.refreshToken"))
        .isNotEqualTo(signIn.<String>json("$.refreshToken"));
    assertThat(api.get("/api/v1/auth/me", refreshed.json("$.accessToken")).status()).isEqualTo(200);
  }

  @Test
  void reusingARotatedRefreshTokenRevokesTheWholeFamily() {
    String first = signIn(provider.idToken(claims -> claims)).json("$.refreshToken");
    String second = refresh(first).json("$.refreshToken");

    assertUnauthenticated(refresh(first));
    assertUnauthenticated(refresh(second));
  }

  @Test
  void unknownRefreshTokenReturns401Problem() {
    assertUnauthenticated(refresh("not-a-refresh-token"));
  }

  @Test
  void logoutRevokesTheSessionAndIsIdempotent() {
    String refreshToken = signIn(provider.idToken(claims -> claims)).json("$.refreshToken");

    assertThat(logout(refreshToken).status()).isEqualTo(204);
    assertUnauthenticated(refresh(refreshToken));
    assertThat(logout(refreshToken).status()).isEqualTo(204);
    assertThat(logout("never-issued").status()).isEqualTo(204);
  }

  private Response signIn(String idToken) {
    return api.post("/api/v1/auth/google", "{\"idToken\":\"" + idToken + "\"}");
  }

  private Response refresh(String refreshToken) {
    return api.post("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}");
  }

  private Response logout(String refreshToken) {
    return api.post("/api/v1/auth/logout", "{\"refreshToken\":\"" + refreshToken + "\"}");
  }

  private String currentUserId(Response signIn) {
    return api.get("/api/v1/auth/me", signIn.json("$.accessToken")).json("$.id");
  }

  private static void assertUnauthenticated(Response response) {
    assertThat(response.status()).isEqualTo(401);
    assertThat(response.contentType()).isEqualTo(PROBLEM_JSON);
    assertThat(response.<String>json("$.code")).isEqualTo("UNAUTHENTICATED");
    assertThat(response.<Integer>json("$.status")).isEqualTo(401);
    assertThat(response.headers().getFirst(HttpHeaders.WWW_AUTHENTICATE)).isEqualTo("Bearer");
  }

  private static String newSubject() {
    return UUID.randomUUID().toString();
  }
}
