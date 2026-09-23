package com.mustafagokselgokmen.api.common.ratelimit;

import java.time.Duration;

/** A client sent more requests than its limit allows. Answered with 429 and {@code Retry-After}. */
public class RateLimitedException extends RuntimeException {

  private final transient Duration retryAfter;

  RateLimitedException(Duration retryAfter) {
    super("Rate limit exceeded");
    this.retryAfter = retryAfter;
  }

  public Duration getRetryAfter() {
    return retryAfter;
  }
}
