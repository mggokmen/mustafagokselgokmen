package com.mustafagokselgokmen.api.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/** Creates access tokens (JWT) and refresh tokens (opaque, stored only as a hash). */
@Component
class TokenService {

  private static final SecureRandom RANDOM = new SecureRandom();
  private static final int REFRESH_TOKEN_BYTES = 32;

  private final JwtEncoder encoder;
  private final Duration accessTokenTtl;
  private final Clock clock;

  TokenService(JwtEncoder encoder, IdentityProperties properties, Clock clock) {
    this.encoder = encoder;
    this.accessTokenTtl = properties.accessTokenTtl();
    this.clock = clock;
  }

  String issueAccessToken(User user) {
    Instant now = clock.instant();
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .subject(user.getId().toString())
            .claim("role", user.getRole().name())
            .issuedAt(now)
            .expiresAt(now.plus(accessTokenTtl))
            .build();
    JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
    return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
  }

  int accessTokenTtlSeconds() {
    return Math.toIntExact(accessTokenTtl.toSeconds());
  }

  static String newRefreshToken() {
    byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
    RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  static String hash(String refreshToken) {
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256")
              .digest(refreshToken.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 is required by every Java runtime", e);
    }
  }
}
