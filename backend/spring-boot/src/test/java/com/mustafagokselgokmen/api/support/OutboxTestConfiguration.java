package com.mustafagokselgokmen.api.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

/**
 * Keeps the outbox publisher from running in the background during tests. Tests that check
 * publishing call it themselves, so they see exactly what they caused.
 */
@TestConfiguration(proxyBeanMethods = false)
public class OutboxTestConfiguration {

  @Bean
  DynamicPropertyRegistrar quietOutboxPublisher() {
    return registry -> registry.add("app.outbox.poll-interval", () -> "1h");
  }
}
