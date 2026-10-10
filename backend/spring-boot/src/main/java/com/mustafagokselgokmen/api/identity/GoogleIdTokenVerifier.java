package com.mustafagokselgokmen.api.identity;

import java.util.Collection;
import java.util.List;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

/**
 * Verifies Google ID tokens: signature against Google's published keys, issuer, audience, expiry
 * and a verified email (docs/security.md#identity-sign-in-with-google). It is not the decoder for
 * the API's own access tokens.
 */
@Component
class GoogleIdTokenVerifier {

  private final JwtDecoder decoder;

  GoogleIdTokenVerifier(IdentityProperties properties) {
    IdentityProperties.Google google = properties.google();
    List<String> issuers = google.issuers();
    List<String> clientIds = google.clientIds();

    NimbusJwtDecoder nimbus =
        NimbusJwtDecoder.withJwkSetUri(google.jwksUri().toString())
            .jwsAlgorithm(SignatureAlgorithm.RS256)
            .build();
    nimbus.setJwtValidator(
        new DelegatingOAuth2TokenValidator<>(
            new JwtTimestampValidator(),
            new JwtClaimValidator<Object>(
                JwtClaimNames.ISS, iss -> iss != null && issuers.contains(iss.toString())),
            new JwtClaimValidator<Collection<String>>(
                JwtClaimNames.AUD,
                aud -> aud != null && aud.stream().anyMatch(clientIds::contains)),
            new JwtClaimValidator<Object>(
                "email_verified", verified -> "true".equals(String.valueOf(verified)))));
    this.decoder = nimbus;
  }

  GoogleIdentity verify(String idToken) {
    Jwt jwt;
    try {
      jwt = decoder.decode(idToken);
    } catch (BadJwtException e) {
      throw new InvalidTokenException("Google ID token was rejected", e);
    }
    // Other JwtExceptions, such as an unreachable key set, are server errors, not bad tokens.
    String subject = jwt.getSubject();
    String email = jwt.getClaimAsString("email");
    if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
      throw new InvalidTokenException("Google ID token has no subject or email");
    }
    return new GoogleIdentity(
        subject, email, jwt.getClaimAsString("name"), jwt.getClaimAsString("picture"));
  }
}
