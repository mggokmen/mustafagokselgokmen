package com.mustafagokselgokmen.api.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Adds a clock the test controls and makes it the one injected everywhere. It is a separate bean
 * rather than a replacement for the application's {@code clock}, which Spring Boot doesn't allow
 * tests to override by default.
 */
@TestConfiguration(proxyBeanMethods = false)
public class MutableClockConfiguration {

  @Bean
  @Primary
  MutableClock mutableClock() {
    return new MutableClock();
  }
}
