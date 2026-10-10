package com.mustafagokselgokmen.notification.contact;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.notification.common.events.EventHeaders;
import com.mustafagokselgokmen.notification.common.events.ProcessedEventRepository;
import com.mustafagokselgokmen.notification.common.events.UnprocessableEventException;
import com.mustafagokselgokmen.notification.support.DeadLetterTopic;
import com.mustafagokselgokmen.notification.support.EventPublisher;
import com.mustafagokselgokmen.notification.support.Eventually;
import com.mustafagokselgokmen.notification.support.KafkaTestConfiguration;
import com.mustafagokselgokmen.notification.support.NotificationTestConfiguration;
import com.mustafagokselgokmen.notification.support.RecordingNotificationSender;
import com.mustafagokselgokmen.notification.support.TestcontainersConfiguration;
import java.time.Duration;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.kafka.KafkaContainer;

/** The consumer notifies once per event, retries what may recover and dead-letters what may not. */
@SpringBootTest
@Import({
  TestcontainersConfiguration.class,
  KafkaTestConfiguration.class,
  NotificationTestConfiguration.class
})
// Short pauses: these tests wait for the retries to run out.
@TestPropertySource(
    properties = {
      "app.consumer.retry.max-attempts=3",
      "app.consumer.retry.initial-backoff=50ms",
      "app.consumer.retry.max-backoff=200ms"
    })
class ContactMessageNotificationTests {

  private static final String CONTACT_MESSAGE_CREATED = "ContactMessageCreated";
  private static final Duration TIMEOUT = Duration.ofSeconds(30);

  @Autowired KafkaTemplate<String, String> kafka;

  // @ServiceConnection gives the application the address; the test's own consumer asks the
  // container for it.
  @Autowired KafkaContainer broker;

  @Autowired RecordingNotificationSender sender;
  @Autowired ProcessedEventRepository processedEvents;

  @Value("${app.events.contact-message-topic}")
  String topic;

  @Value("${app.consumer.dead-letter-suffix}")
  String deadLetterSuffix;

  private EventPublisher publisher;

  @BeforeEach
  void setUp() {
    sender.reset();
    publisher = new EventPublisher(kafka, topic);
  }

  @Test
  void aSentMessageIsNotified() throws InterruptedException {
    UUID eventId = UUID.randomUUID();
    UUID messageId = UUID.randomUUID();

    publisher.publish(eventId, CONTACT_MESSAGE_CREATED, messageId, payload(messageId, "Hello"));

    ContactMessageCreated notified = sender.awaitNext(TIMEOUT);
    assertThat(notified).isNotNull();
    assertThat(notified.messageId()).isEqualTo(messageId);
    assertThat(notified.subject()).isEqualTo("Hello");
    assertThat(notified.authorEmail()).isEqualTo("author@example.com");
    Eventually.until(TIMEOUT, () -> assertThat(processedEvents.findById(eventId)).isPresent());
  }

  @Test
  void anEventDeliveredTwiceIsNotifiedOnce() throws InterruptedException {
    UUID eventId = UUID.randomUUID();
    UUID messageId = UUID.randomUUID();
    String payload = payload(messageId, "Only once");

    publisher.publish(eventId, CONTACT_MESSAGE_CREATED, messageId, payload);
    publisher.publish(eventId, CONTACT_MESSAGE_CREATED, messageId, payload);
    // Records with the same key are handled in order, so this one arriving proves the redelivery
    // above has already been dealt with.
    publisher.publish(
        UUID.randomUUID(), CONTACT_MESSAGE_CREATED, messageId, payload(messageId, "Later"));

    assertThat(sender.awaitNext(TIMEOUT)).returns("Only once", ContactMessageCreated::subject);
    assertThat(sender.awaitNext(TIMEOUT)).returns("Later", ContactMessageCreated::subject);
    assertThat(sender.attempts()).isEqualTo(2);
  }

  @Test
  void anEventOfAnotherTypeIsIgnored() throws InterruptedException {
    UUID messageId = UUID.randomUUID();

    publisher.publish(
        UUID.randomUUID(), "ContactMessageStatusChanged", messageId, payload(messageId, "Ignored"));
    publisher.publish(
        UUID.randomUUID(), CONTACT_MESSAGE_CREATED, messageId, payload(messageId, "Handled"));

    assertThat(sender.awaitNext(TIMEOUT)).returns("Handled", ContactMessageCreated::subject);
    assertThat(sender.attempts()).isEqualTo(1);
  }

  @Test
  void anEventWithoutAnIdIsDeadLetteredWithoutRetrying() {
    UUID messageId = UUID.randomUUID();

    try (DeadLetterTopic deadLetters = deadLetters()) {
      publisher.publish(null, CONTACT_MESSAGE_CREATED, messageId, payload(messageId, "No id"));

      ConsumerRecord<String, String> record = deadLetters.await(messageId, TIMEOUT);
      assertThat(record).isNotNull();
      assertThat(DeadLetterTopic.header(record, KafkaHeaders.DLT_ORIGINAL_TOPIC)).isEqualTo(topic);
      assertThat(DeadLetterTopic.header(record, KafkaHeaders.DLT_EXCEPTION_CAUSE_FQCN))
          .isEqualTo(UnprocessableEventException.class.getName());
      // The headers it does have are kept, so the record can be inspected and republished.
      assertThat(DeadLetterTopic.header(record, EventHeaders.EVENT_TYPE))
          .isEqualTo(CONTACT_MESSAGE_CREATED);
      assertThat(sender.attempts()).isZero();
    }
  }

  @Test
  void anEventWithAnUnreadablePayloadIsDeadLetteredWithoutRetrying() {
    UUID messageId = UUID.randomUUID();

    try (DeadLetterTopic deadLetters = deadLetters()) {
      publisher.publish(UUID.randomUUID(), CONTACT_MESSAGE_CREATED, messageId, "not a json object");

      ConsumerRecord<String, String> record = deadLetters.await(messageId, TIMEOUT);
      assertThat(record).isNotNull();
      assertThat(record.value()).isEqualTo("not a json object");
      assertThat(DeadLetterTopic.header(record, KafkaHeaders.DLT_EXCEPTION_CAUSE_FQCN))
          .isEqualTo(UnprocessableEventException.class.getName());
      assertThat(sender.attempts()).isZero();
    }
  }

  @Test
  void anEventThatKeepsFailingIsRetriedAndThenDeadLettered() {
    UUID eventId = UUID.randomUUID();
    UUID messageId = UUID.randomUUID();
    String subject = RecordingNotificationSender.FAILING_SUBJECT_PREFIX + ": provider is down";

    try (DeadLetterTopic deadLetters = deadLetters()) {
      publisher.publish(eventId, CONTACT_MESSAGE_CREATED, messageId, payload(messageId, subject));

      ConsumerRecord<String, String> record = deadLetters.await(messageId, TIMEOUT);
      assertThat(record).isNotNull();
      assertThat(DeadLetterTopic.header(record, KafkaHeaders.DLT_EXCEPTION_CAUSE_FQCN))
          .isEqualTo(IllegalStateException.class.getName());
      // The configured number of attempts, not one more and not one less.
      assertThat(sender.attempts()).isEqualTo(3);
      // Nothing was notified, so nothing is recorded as handled: the event can be replayed.
      assertThat(processedEvents.findById(eventId)).isEmpty();
    }
  }

  private DeadLetterTopic deadLetters() {
    return new DeadLetterTopic(broker.getBootstrapServers(), topic + deadLetterSuffix);
  }

  private static String payload(UUID messageId, String subject) {
    return """
        {"messageId":"%s","authorId":"%s","authorEmail":"author@example.com",\
        "subject":"%s","createdAt":"2026-09-24T10:15:30Z"}"""
        .formatted(messageId, UUID.randomUUID(), subject);
  }
}
