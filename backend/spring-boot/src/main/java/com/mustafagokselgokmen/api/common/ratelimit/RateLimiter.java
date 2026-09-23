package com.mustafagokselgokmen.api.common.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.TimeMeter;
import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/**
 * Token buckets held in this instance's memory. Buckets are cached per limit and client, and a key
 * that stops being used expires, so the cache can't grow without bound.
 *
 * <p>The limits therefore count requests per application instance. Running several instances behind
 * a load balancer needs a shared store (docs/security.md#rate-limiting).
 */
@Component
public class RateLimiter {

  private final RateLimitProperties properties;
  private final TimeMeter timeMeter;
  private final Cache<String, Bucket> buckets;

  RateLimiter(RateLimitProperties properties, Clock clock) {
    this.properties = properties;
    // Bucket4j reads time through the application clock, so tests can move the window.
    this.timeMeter =
        new TimeMeter() {
          @Override
          public long currentTimeNanos() {
            return TimeUnit.MILLISECONDS.toNanos(clock.millis());
          }

          @Override
          public boolean isWallClockBased() {
            return true;
          }
        };
    Duration longestWindow =
        properties.signIn().per().compareTo(properties.refresh().per()) >= 0
            ? properties.signIn().per()
            : properties.refresh().per();
    this.buckets =
        Caffeine.newBuilder()
            .expireAfterAccess(longestWindow.multipliedBy(2))
            .maximumSize(100_000)
            .build();
  }

  /**
   * Consumes one request for {@code client} against {@code limit}.
   *
   * @throws RateLimitedException when the client has no requests left
   */
  void consume(LimitName limit, String client) {
    Bucket bucket = buckets.get(limit.name() + ':' + client, key -> newBucket(limitFor(limit)));
    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
    if (!probe.isConsumed()) {
      throw new RateLimitedException(Duration.ofNanos(probe.getNanosToWaitForRefill()));
    }
  }

  private RateLimitProperties.Limit limitFor(LimitName limit) {
    return switch (limit) {
      case SIGN_IN -> properties.signIn();
      case REFRESH -> properties.refresh();
    };
  }

  private Bucket newBucket(RateLimitProperties.Limit limit) {
    return Bucket.builder()
        .addLimit(
            bandwidth ->
                bandwidth
                    .capacity(limit.requests())
                    .refillIntervally(limit.requests(), limit.per()))
        .withCustomTimePrecision(timeMeter)
        .build();
  }

  /** The limits that exist today. */
  enum LimitName {
    SIGN_IN,
    REFRESH
  }
}
