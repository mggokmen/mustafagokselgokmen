package com.mustafagokselgokmen.api.common.outbox;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.IdentityTestConfiguration;
import com.mustafagokselgokmen.api.support.KafkaTestConfiguration;
import com.mustafagokselgokmen.api.support.OutboxTestConfiguration;
import com.mustafagokselgokmen.api.support.RelaxedRateLimitsConfiguration;
import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import com.mustafagokselgokmen.api.support.TestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.kafka.KafkaContainer;

/** The outbox publishes to a real broker, with the key and headers a consumer needs. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import({
  TestcontainersConfiguration.class,
  IdentityTestConfiguration.class,
  RelaxedRateLimitsConfiguration.class,
  OutboxTestConfiguration.class,
  KafkaTestConfiguration.class
})
@TestPropertySource(properties = "app.outbox.target=kafka")
class KafkaOutboxTests {

  private static final String TOPIC = "events.contact-message";

  @LocalServerPort int port;

  @Autowired OutboxPublisher publisher;

  // @ServiceConnection gives the application the address; the test consumer asks the container.
  @Autowired KafkaContainer kafka;

  private final TestIdentityProvider provider = TestIdentityProvider.get();
  private ApiClient api;
  private Consumer<String, String> consumer;

  @BeforeEach
  void setUp() {
    api = new ApiClient(port);
    consumer = newConsumer();
    consumer.subscribe(List.of(TOPIC));
    consumer.poll(Duration.ofSeconds(5));
  }

  @AfterEach
  void tearDown() {
    consumer.close();
  }

  @Test
  void anEventReachesTheTopicKeyedByItsAggregate() {
    String messageId = sendMessage("Kafka subject");

    int published = publisher.publishPending();

    assertThat(published).isEqualTo(1);
    ConsumerRecord<String, String> record = nextRecord();
    assertThat(record.key()).isEqualTo(messageId);
    assertThat(header(record, "event-type")).isEqualTo("ContactMessageCreated");
    assertThat(header(record, "aggregate-type")).isEqualTo("ContactMessage");
    assertThat(header(record, "event-id")).isNotBlank();
    assertThat(JsonPath.<String>read(record.value(), "$.subject")).isEqualTo("Kafka subject");
    assertThat(JsonPath.<String>read(record.value(), "$.messageId")).isEqualTo(messageId);
  }

  @Test
  void anEventIsSentOnlyOnce() {
    sendMessage("Sent once");

    publisher.publishPending();
    publisher.publishPending();

    // Wait for a second record that must never arrive.
    assertThat(recordsWithin(Duration.ofSeconds(10), 2)).hasSize(1);
  }

  private ConsumerRecord<String, String> nextRecord() {
    List<ConsumerRecord<String, String>> records = recordsWithin(Duration.ofSeconds(20), 1);
    assertThat(records).hasSize(1);
    return records.get(0);
  }

  /** Polls until {@code expected} records have arrived, or the time is up. */
  private List<ConsumerRecord<String, String>> recordsWithin(Duration timeout, int expected) {
    List<ConsumerRecord<String, String>> records = new ArrayList<>();
    Instant deadline = Instant.now().plus(timeout);
    while (Instant.now().isBefore(deadline) && records.size() < expected) {
      ConsumerRecords<String, String> polled = consumer.poll(Duration.ofSeconds(1));
      polled.records(TOPIC).forEach(records::add);
    }
    return records;
  }

  private static String header(ConsumerRecord<String, String> record, String name) {
    Header header = record.headers().lastHeader(name);
    assertThat(header).as("header %s", name).isNotNull();
    return new String(header.value(), StandardCharsets.UTF_8);
  }

  private Consumer<String, String> newConsumer() {
    return new KafkaConsumer<>(
        Map.of(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
            kafka.getBootstrapServers(),
            ConsumerConfig.GROUP_ID_CONFIG,
            "test-" + UUID.randomUUID(),
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
            "earliest",
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
            StringDeserializer.class,
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
            StringDeserializer.class));
  }

  private String sendMessage(String subject) {
    String idToken =
        provider.idToken(
            UUID.randomUUID().toString(), UUID.randomUUID() + "@example.com", "Author");
    String token =
        api.post("/api/v1/auth/google", "{\"idToken\":\"" + idToken + "\"}").json("$.accessToken");
    return api.post(
            "/api/v1/contact-messages",
            "{\"subject\":\"%s\",\"message\":\"Body\"}".formatted(subject),
            token)
        .json("$.id");
  }
}
