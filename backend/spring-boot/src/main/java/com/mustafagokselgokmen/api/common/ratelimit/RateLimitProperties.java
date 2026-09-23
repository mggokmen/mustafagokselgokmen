package com.mustafagokselgokmen.api.common.ratelimit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Request limits per endpoint and client (docs/security.md#rate-limiting). */
@Validated
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(@Valid @NotNull Limit signIn, @Valid @NotNull Limit refresh) {

  public record Limit(@Min(1) int requests, @NotNull Duration per) {}
}
