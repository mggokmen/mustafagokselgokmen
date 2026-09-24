package com.mustafagokselgokmen.notification.common.events;

import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.header.Header;

/**
 * The headers every published event carries (ADR-009). They are enough to de-duplicate and route a
 * record without parsing its body.
 */
public record EventHeaders(UUID eventId, String eventType, String aggregateType) {

  public static final String EVENT_ID = "event-id";
  public static final String EVENT_TYPE = "event-type";
  public static final String AGGREGATE_TYPE = "aggregate-type";

  public static EventHeaders of(ConsumerRecord<String, String> record) {
    return new EventHeaders(
        eventId(record), required(record, EVENT_TYPE), required(record, AGGREGATE_TYPE));
  }

  private static UUID eventId(ConsumerRecord<String, String> record) {
    String value = required(record, EVENT_ID);
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      throw new UnprocessableEventException("Header " + EVENT_ID + " is not a UUID: " + value, e);
    }
  }

  private static String required(ConsumerRecord<String, String> record, String name) {
    Header header = record.headers().lastHeader(name);
    if (header == null || header.value() == null) {
      throw new UnprocessableEventException("Header " + name + " is missing");
    }
    return new String(header.value(), StandardCharsets.UTF_8);
  }
}
