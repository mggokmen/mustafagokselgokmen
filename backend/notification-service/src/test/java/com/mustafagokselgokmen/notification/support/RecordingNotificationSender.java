package com.mustafagokselgokmen.notification.support;

import com.mustafagokselgokmen.notification.contact.ContactMessageCreated;
import com.mustafagokselgokmen.notification.contact.NotificationSender;
import java.time.Duration;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Records what was notified, and fails on demand. A subject starting with {@code fail} makes every
 * send throw, which is how the retry and dead-letter tests produce a failure that never recovers.
 */
public class RecordingNotificationSender implements NotificationSender {

  public static final String FAILING_SUBJECT_PREFIX = "fail";

  private final BlockingQueue<ContactMessageCreated> sent = new LinkedBlockingQueue<>();
  private final AtomicInteger attempts = new AtomicInteger();

  @Override
  public void send(ContactMessageCreated event) {
    attempts.incrementAndGet();
    if (event.subject().startsWith(FAILING_SUBJECT_PREFIX)) {
      throw new IllegalStateException("The notification provider is unavailable");
    }
    sent.add(event);
  }

  /** Waits for the next notification, or returns {@code null} if none arrives in time. */
  public ContactMessageCreated awaitNext(Duration timeout) throws InterruptedException {
    return sent.poll(timeout.toMillis(), TimeUnit.MILLISECONDS);
  }

  public int attempts() {
    return attempts.get();
  }

  public void reset() {
    sent.clear();
    attempts.set(0);
  }
}
