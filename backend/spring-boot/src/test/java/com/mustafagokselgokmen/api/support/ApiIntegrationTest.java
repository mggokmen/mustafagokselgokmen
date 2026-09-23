package com.mustafagokselgokmen.api.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Starts the whole application on a random port against PostgreSQL in Testcontainers and the {@link
 * TestIdentityProvider}.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({
  TestcontainersConfiguration.class,
  IdentityTestConfiguration.class,
  RelaxedRateLimitsConfiguration.class
})
public @interface ApiIntegrationTest {}
