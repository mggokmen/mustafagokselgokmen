package com.mustafagokselgokmen.notification.support;

import com.mustafagokselgokmen.notification.common.events.EventHeaders;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;

/** Publishes records exactly as the API does: the aggregate's id as key, plus the event headers. */
public class EventPublisher {

  private final KafkaTemplate<String, String> kafka;
  private final String topic;

  public EventPublisher(KafkaTemplate<String, String> kafka, String topic) {
    this.kafka = kafka;
    this.topic = topic;
  }

  public void publish(UUID eventId, String eventType, UUID aggregateId, String payload) {
    ProducerRecord<String, String> record =
        new ProducerRecord<>(topic, aggregateId.toString(), payload);
    if (eventId != null) {
      header(record, EventHeaders.EVENT_ID, eventId.toString());
    }
    header(record, EventHeaders.EVENT_TYPE, eventType);
    header(record, EventHeaders.AGGREGATE_TYPE, "ContactMessage");
    kafka.send(record).join();
  }

  private static void header(ProducerRecord<String, String> record, String name, String value) {
    record.headers().add(name, value.getBytes(StandardCharsets.UTF_8));
  }
}
