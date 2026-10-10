package com.mustafagokselgokmen.api.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.Test;

class GoogleIdTokenVerifierTest {

  private final TestIdentityProvider provider = TestIdentityProvider.get();

  private final GoogleIdTokenVerifier verifier =
      new GoogleIdTokenVerifier(
          new IdentityProperties(
              "0123456789abcdef0123456789abcdef",
              Duration.ofMinutes(15),
              Duration.ofDays(30),
              List.of(),
              new IdentityProperties.Google(
                  List.of(TestIdentityProvider.CLIENT_ID),
                  List.of(TestIdentityProvider.ISSUER),
                  URI.create(provider.jwksUri()))));

  @Test
  void acceptsValidTokenAndReturnsIdentity() {
    GoogleIdentity identity =
        verifier.verify(provider.idToken("subject-1", "ada@example.com", "Ada Lovelace"));

    assertThat(identity)
        .isEqualTo(new GoogleIdentity("subject-1", "ada@example.com", "Ada Lovelace", null));
  }

  @Test
  void acceptsEmailVerifiedSentAsString() {
    String token = provider.idToken(claims -> claims.claim("email_verified", "true"));

    assertThat(verifier.verify(token).email()).endsWith("@example.com");
  }

  @Test
  void rejectsTokenSignedWithUnpublishedKey() {
    String token = provider.idTokenSignedWithUnknownKey("subject-1", "ada@example.com");

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsTokenFromAnotherIssuer() {
    String token = provider.idToken(claims -> claims.issuer("https://accounts.example.org"));

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsTokenForAnotherClient() {
    String token = provider.idToken(claims -> claims.audience("another-client"));

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsExpiredToken() {
    Instant now = Instant.now();
    String token =
        provider.idToken(
            claims ->
                claims
                    .issueTime(Date.from(now.minusSeconds(900)))
                    .expirationTime(Date.from(now.minusSeconds(600))));

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsUnverifiedEmail() {
    String token = provider.idToken(claims -> claims.claim("email_verified", false));

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsTokenWithoutEmail() {
    String token = provider.idToken(claims -> claims.claim("email", null));

    assertThatThrownBy(() -> verifier.verify(token)).isInstanceOf(InvalidTokenException.class);
  }

  @Test
  void rejectsSomethingThatIsNotAToken() {
    assertThatThrownBy(() -> verifier.verify("not-a-jwt"))
        .isInstanceOf(InvalidTokenException.class);
  }
}
