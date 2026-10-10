package com.mustafagokselgokmen.api.common.outbox;

import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Records an event for later publication. Callers use it inside the transaction that makes the
 * change, so the event and the change are stored together or not at all (ADR-008).
 */
@Component
public class OutboxWriter {

  private final OutboxEventRepository events;
  private final JsonMapper json;

  OutboxWriter(OutboxEventRepository events, JsonMapper json) {
    this.events = events;
    this.json = json;
  }

  @Transactional(propagation = Propagation.MANDATORY)
  public void record(String aggregateType, UUID aggregateId, String eventType, Object payload) {
    events.save(
        new OutboxEvent(aggregateType, aggregateId, eventType, json.writeValueAsString(payload)));
  }
}
