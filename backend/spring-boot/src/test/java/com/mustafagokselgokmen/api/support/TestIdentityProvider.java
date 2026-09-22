package com.mustafagokselgokmen.api.support;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.function.UnaryOperator;

/**
 * A local stand-in for Google's identity provider. It signs ID tokens with its own RSA key and
 * serves the public key set, so tests exercise the real verification code without calling Google
 * (docs/testing.md#test-identity-provider).
 */
public final class TestIdentityProvider {

  public static final String ISSUER = "https://test-identity-provider.example";
  public static final String CLIENT_ID = "test-client";

  private static final TestIdentityProvider INSTANCE = new TestIdentityProvider();

  private final RSAKey signingKey = newKey();
  private final RSAKey unknownKey = newKey();
  private final HttpServer server;

  private TestIdentityProvider() {
    byte[] jwks = new JWKSet(signingKey.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
    try {
      server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
    server.createContext(
        "/jwks",
        exchange -> {
          exchange.getResponseHeaders().add("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, jwks.length);
          try (OutputStream body = exchange.getResponseBody()) {
            body.write(jwks);
          }
        });
    server.setExecutor(
        Executors.newCachedThreadPool(
            task -> {
              Thread thread = new Thread(task, "test-identity-provider");
              thread.setDaemon(true);
              return thread;
            }));
    server.start();
  }

  public static TestIdentityProvider get() {
    return INSTANCE;
  }

  public String jwksUri() {
    return "http://localhost:" + server.getAddress().getPort() + "/jwks";
  }

  /** A valid ID token for a user with a verified email. */
  public String idToken(String subject, String email, String name) {
    return idToken(
        claims ->
            claims
                .subject(subject)
                .claim("email", email)
                .claim("email_verified", true)
                .claim("name", name));
  }

  /** A valid ID token for a new random user, customized by {@code claims}. */
  public String idToken(UnaryOperator<JWTClaimsSet.Builder> claims) {
    return sign(signingKey, claims.apply(defaults()).build());
  }

  /** A token that looks valid but is signed with a key the provider never published. */
  public String idTokenSignedWithUnknownKey(String subject, String email) {
    return sign(
        unknownKey,
        defaults().subject(subject).claim("email", email).claim("email_verified", true).build());
  }

  private static JWTClaimsSet.Builder defaults() {
    Instant now = Instant.now();
    String subject = UUID.randomUUID().toString();
    return new JWTClaimsSet.Builder()
        .issuer(ISSUER)
        .audience(CLIENT_ID)
        .subject(subject)
        .claim("email", subject + "@example.com")
        .claim("email_verified", true)
        .issueTime(Date.from(now))
        .expirationTime(Date.from(now.plusSeconds(300)));
  }

  private static String sign(RSAKey key, JWTClaimsSet claims) {
    try {
      SignedJWT jwt =
          new SignedJWT(
              new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
      jwt.sign(new RSASSASigner(key));
      return jwt.serialize();
    } catch (JOSEException e) {
      throw new IllegalStateException(e);
    }
  }

  private static RSAKey newKey() {
    try {
      return new RSAKeyGenerator(2048).keyID(UUID.randomUUID().toString()).generate();
    } catch (JOSEException e) {
      throw new IllegalStateException(e);
    }
  }
}
