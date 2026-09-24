package com.mustafagokselgokmen.notification.contact;

import com.mustafagokselgokmen.notification.common.events.EventHeaders;
import com.mustafagokselgokmen.notification.common.events.UnprocessableEventException;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Turns records on {@code events.contact-message} into calls on the notifier. Like a controller, it
 * maps the protocol onto one service call and holds no rules of its own.
 */
@Component
class ContactMessageEventListener {

  private static final Logger log = LoggerFactory.getLogger(ContactMessageEventListener.class);
  private static final String CONTACT_MESSAGE_CREATED = "ContactMessageCreated";

  private final ContactMessageNotifier notifier;
  private final JsonMapper json;

  ContactMessageEventListener(ContactMessageNotifier notifier, JsonMapper json) {
    this.notifier = notifier;
    this.json = json;
  }

  @KafkaListener(topics = "${app.events.contact-message-topic}")
  void onEvent(ConsumerRecord<String, String> record) {
    EventHeaders headers = EventHeaders.of(record);
    if (!CONTACT_MESSAGE_CREATED.equals(headers.eventType())) {
      // Another event about the same aggregate. Nothing here reacts to it, and that isn't a
      // failure: it must not be retried or dead-lettered.
      log.debug("Ignoring event {} of type {}", headers.eventId(), headers.eventType());
      return;
    }
    notifier.notifyOnce(headers, aggregateId(record), parse(record.value()));
  }

  private ContactMessageCreated parse(String payload) {
    try {
      return json.readValue(payload, ContactMessageCreated.class);
    } catch (JacksonException e) {
      throw new UnprocessableEventException("Payload is not a " + CONTACT_MESSAGE_CREATED, e);
    }
  }

  /** The record's key is the aggregate's id (ADR-009). */
  private static UUID aggregateId(ConsumerRecord<String, String> record) {
    try {
      return UUID.fromString(record.key());
    } catch (IllegalArgumentException | NullPointerException e) {
      throw new UnprocessableEventException("Record key is not a UUID: " + record.key(), e);
    }
  }
}
