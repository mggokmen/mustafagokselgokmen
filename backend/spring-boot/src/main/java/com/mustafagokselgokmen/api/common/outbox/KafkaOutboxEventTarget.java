package com.mustafagokselgokmen.api.common.outbox;

import java.nio.charset.StandardCharsets;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes events to Kafka (ADR-009). The key is the aggregate's id, so everything about one
 * aggregate stays in order on one partition.
 */
@Component
@ConditionalOnProperty(name = "app.outbox.target", havingValue = "kafka")
class KafkaOutboxEventTarget implements OutboxEventTarget {

  static final String EVENT_ID_HEADER = "event-id";
  static final String EVENT_TYPE_HEADER = "event-type";
  static final String AGGREGATE_TYPE_HEADER = "aggregate-type";

  private final KafkaTemplate<String, String> kafka;
  private final String topicPrefix;

  KafkaOutboxEventTarget(KafkaTemplate<String, String> kafka, OutboxProperties properties) {
    this.kafka = kafka;
    this.topicPrefix = properties.topicPrefix();
  }

  @Override
  public void publish(OutboxEvent event) {
    ProducerRecord<String, String> record =
        new ProducerRecord<>(
            OutboxTopics.forAggregate(topicPrefix, event.getAggregateType()),
            event.getAggregateId().toString(),
            event.getPayload());
    record.headers().add(EVENT_ID_HEADER, bytes(event.getId().toString()));
    record.headers().add(EVENT_TYPE_HEADER, bytes(event.getEventType()));
    record.headers().add(AGGREGATE_TYPE_HEADER, bytes(event.getAggregateType()));
    // Waiting for the broker's acknowledgement keeps the event unpublished if the send fails.
    kafka.send(record).join();
  }

  private static byte[] bytes(String value) {
    return value.getBytes(StandardCharsets.UTF_8);
  }
}
