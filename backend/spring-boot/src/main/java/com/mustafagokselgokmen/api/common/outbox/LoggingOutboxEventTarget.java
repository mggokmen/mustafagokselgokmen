package com.mustafagokselgokmen.api.common.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** The default target: events are written to the log until a broker takes over. */
@Component
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
