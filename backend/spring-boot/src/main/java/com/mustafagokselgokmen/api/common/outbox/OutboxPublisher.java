package com.mustafagokselgokmen.api.common.outbox;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Drains the outbox: it locks a batch of unpublished events, hands them to the target and marks
 * them published, all in one transaction. A failure leaves the batch unpublished, so the next run
 * tries again.
 */
@Component
@ConditionalOnProperty(name = "app.outbox.enabled", havingValue = "true", matchIfMissing = true)
class OutboxPublisher {

  private final OutboxEventRepository events;
  private final OutboxEventTarget target;
  private final OutboxProperties properties;
  private final Clock clock;

  OutboxPublisher(
      OutboxEventRepository events,
      OutboxEventTarget target,
      OutboxProperties properties,
      Clock clock) {
    this.events = events;
    this.target = target;
    this.properties = properties;
    this.clock = clock;
  }

  /**
   * @return how many events were published
   */
  @Scheduled(fixedDelayString = "${app.outbox.poll-interval:1s}")
  @Transactional
  public int publishPending() {
    List<OutboxEvent> batch = events.lockUnpublishedBatch(properties.batchSize());
    Instant now = clock.instant();
    for (OutboxEvent event : batch) {
      target.publish(event);
      event.markPublished(now);
    }
    return batch.size();
  }
}
