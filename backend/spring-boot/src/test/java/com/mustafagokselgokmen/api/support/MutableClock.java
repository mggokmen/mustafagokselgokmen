package com.mustafagokselgokmen.api.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A clock tests can move, so time-based behavior is verified without waiting. */
public final class MutableClock extends Clock {

  private volatile Instant instant = Instant.parse("2026-01-01T00:00:00Z");

  public void advance(Duration amount) {
    instant = instant.plus(amount);
  }

  @Override
  public Instant instant() {
    return instant;
  }

  @Override
  public ZoneId getZone() {
    return ZoneOffset.UTC;
  }

  @Override
  public Clock withZone(ZoneId zone) {
    return this;
  }
}
