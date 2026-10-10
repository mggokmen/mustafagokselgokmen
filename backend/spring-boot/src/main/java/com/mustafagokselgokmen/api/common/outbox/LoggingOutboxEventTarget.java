package com.mustafagokselgokmen.api.common.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Writes events to the log. Used where no broker is available, such as the contract tests. */
@Component
@ConditionalOnProperty(name = "app.outbox.target", havingValue = "log", matchIfMissing = true)
class LoggingOutboxEventTarget implements OutboxEventTarget {

  private static final Logger log = LoggerFactory.getLogger(LoggingOutboxEventTarget.class);

  @Override
  public void publish(OutboxEvent event) {
    log.info(
        "Published event {} for {} {}: {}",
        event.getEventType(),
        event.getAggregateType(),
        event.getAggregateId(),
        event.getPayload());
  }
}
