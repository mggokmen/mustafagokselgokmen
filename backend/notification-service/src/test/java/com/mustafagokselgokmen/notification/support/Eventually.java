package com.mustafagokselgokmen.notification.support;

import java.time.Duration;
import java.time.Instant;

/**
 * Retries an assertion about something that happens on the consumer's thread, until it holds or the
 * time is up. Failing takes the whole timeout; passing takes as long as the work does.
 */
public final class Eventually {

  private Eventually() {}

  public static void until(Duration timeout, Runnable assertion) {
    Instant deadline = Instant.now().plus(timeout);
    AssertionError last;
    do {
      try {
        assertion.run();
        return;
      } catch (AssertionError e) {
        last = e;
        sleep();
      }
    } while (Instant.now().isBefore(deadline));
    throw last;
  }

  private static void sleep() {
    try {
      Thread.sleep(50);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(e);
    }
  }
}
