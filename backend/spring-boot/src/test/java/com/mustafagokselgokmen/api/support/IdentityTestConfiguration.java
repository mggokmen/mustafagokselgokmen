package com.mustafagokselgokmen.api.support;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

/** Points the application at {@link TestIdentityProvider} and generates a JWT secret per run. */
@TestConfiguration(proxyBeanMethods = false)
public class IdentityTestConfiguration {

  public static final String ADMIN_EMAIL = "admin@example.com";

  @Bean
  DynamicPropertyRegistrar identityProperties() {
    TestIdentityProvider provider = TestIdentityProvider.get();
    return registry -> {
      registry.add("app.identity.jwt-secret", IdentityTestConfiguration::randomSecret);
      registry.add("app.identity.admin-emails", () -> ADMIN_EMAIL);
      registry.add("app.identity.google.client-ids", () -> TestIdentityProvider.CLIENT_ID);
      registry.add("app.identity.google.issuers", () -> TestIdentityProvider.ISSUER);
      registry.add("app.identity.google.jwks-uri", provider::jwksUri);
    };
  }

  private static String randomSecret() {
    byte[] bytes = new byte[48];
    new SecureRandom().nextBytes(bytes);
    return Base64.getEncoder().encodeToString(bytes);
  }
}
