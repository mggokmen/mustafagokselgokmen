package com.mustafagokselgokmen.notification.common.events;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** How a failing record is retried, and where it goes when retrying doesn't help (ADR-010). */
@ConfigurationProperties("app.consumer")
public record ConsumerProperties(Retry retry, String deadLetterSuffix) {

  /**
   * @param maxAttempts total attempts, including the first one
   */
  public record Retry(
      int maxAttempts, Duration initialBackoff, double multiplier, Duration maxBackoff) {}
}
