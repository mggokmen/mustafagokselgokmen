package com.mustafagokselgokmen.api.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A clock tests can move, so time-based behavior is verified without waiting. */
public final class MutableClock extends Clock {

  // Starts at the real time: access tokens this clock issues are verified against the system
  // clock, so their validity has to overlap with it.
  private volatile Instant instant = Instant.now();

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
