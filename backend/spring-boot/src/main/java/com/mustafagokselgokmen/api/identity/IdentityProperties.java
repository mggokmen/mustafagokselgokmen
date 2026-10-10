package com.mustafagokselgokmen.api.identity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Identity configuration, bound from environment variables in application.yml. Startup fails when a
 * required value is missing (docs/backend/spring-boot.md#configuration).
 */
@Validated
@ConfigurationProperties("app.identity")
public record IdentityProperties(
    @NotNull
        @Size(min = 32, message = "JWT_SECRET must be set and at least 32 characters long")
        @Pattern(regexp = "^[^$].*", message = "JWT_SECRET is not set")
        String jwtSecret,
    @NotNull Duration accessTokenTtl,
    @NotNull Duration refreshTokenTtl,
    List<String> adminEmails,
    @Valid @NotNull Google google) {

  public IdentityProperties {
    adminEmails =
        adminEmails == null
            ? List.of()
            : adminEmails.stream()
                .map(String::strip)
                .filter(email -> !email.isEmpty())
                .map(email -> email.toLowerCase(Locale.ROOT))
                .toList();
  }

  /**
   * Where Google ID tokens are accepted from. Tests point issuers and the key set at a local
   * identity provider (docs/security.md#test-identity-provider).
   */
  public record Google(
      @NotEmpty(message = "GOOGLE_CLIENT_IDS is not set")
          List<@Pattern(regexp = "^[^$]+$", message = "GOOGLE_CLIENT_IDS is not set") String>
              clientIds,
      @NotEmpty List<String> issuers,
      @NotNull URI jwksUri) {}
}
