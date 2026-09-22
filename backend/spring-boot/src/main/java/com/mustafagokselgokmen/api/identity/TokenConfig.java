package com.mustafagokselgokmen.api.identity;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/** Signs and verifies the API's own access tokens with HS256 (ADR-003). */
@Configuration(proxyBeanMethods = false)
class TokenConfig {

  @Bean
  JwtEncoder accessTokenEncoder(IdentityProperties properties) {
    return new NimbusJwtEncoder(new ImmutableSecret<>(signingKey(properties)));
  }

  /** Registered as the resource server's decoder: every protected request is verified with it. */
  @Bean
  JwtDecoder accessTokenDecoder(IdentityProperties properties) {
    return NimbusJwtDecoder.withSecretKey(signingKey(properties))
        .macAlgorithm(MacAlgorithm.HS256)
        .build();
  }

  private static SecretKey signingKey(IdentityProperties properties) {
    return new SecretKeySpec(properties.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }
}
