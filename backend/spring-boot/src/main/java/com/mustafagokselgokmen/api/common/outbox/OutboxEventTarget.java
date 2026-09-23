package com.mustafagokselgokmen.api.common.outbox;

/**
 * Where published events go. Today a log line; when a broker is introduced, only this
 * implementation changes, not the outbox (ADR-008).
 */
public interface OutboxEventTarget {

  /**
   * Publishes one event. Throwing leaves the whole batch unpublished, so it is retried on the next
   * run. Delivery is therefore at least once, and consumers must be idempotent.
   */
  void publish(OutboxEvent event);
}
