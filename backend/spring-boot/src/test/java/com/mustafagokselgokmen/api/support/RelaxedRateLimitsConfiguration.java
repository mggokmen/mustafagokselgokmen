package com.mustafagokselgokmen.api.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

/**
 * Every test shares one client IP, so rate limits would count all of their requests together. The
 * limits themselves are verified by {@code RateLimitTests}, which sets its own.
 */
@TestConfiguration(proxyBeanMethods = false)
public class RelaxedRateLimitsConfiguration {

  @Bean
  DynamicPropertyRegistrar relaxedRateLimits() {
    return registry -> {
      registry.add("app.rate-limit.sign-in.requests", () -> 100_000);
      registry.add("app.rate-limit.refresh.requests", () -> 100_000);
    };
  }
}
