package com.mustafagokselgokmen.notification.common.events;

import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Turns at-least-once delivery into at-most-once handling (ADR-010). The caller claims an event
 * inside the transaction that does the work, so the claim and the work are committed together: if
 * the work fails, the claim is rolled back with it and the retry starts over.
 */
@Component
public class ProcessedEvents {

  private final ProcessedEventRepository events;
  private final Clock clock;

  ProcessedEvents(ProcessedEventRepository events, Clock clock) {
    this.events = events;
    this.clock = clock;
  }

  @Transactional(propagation = Propagation.MANDATORY)
  public boolean claim(EventHeaders headers, UUID aggregateId) {
    return events.insertIfAbsent(
            headers.eventId(), headers.eventType(), aggregateId, clock.instant())
        == 1;
  }
}
