package com.mustafagokselgokmen.notification.support;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.serialization.StringDeserializer;

/** Reads the dead-letter topic from its beginning, so a test can look for one record in it. */
public class DeadLetterTopic implements AutoCloseable {

  private final Consumer<String, String> consumer;

  public DeadLetterTopic(String bootstrapServers, String topic) {
    this.consumer =
        new KafkaConsumer<>(
            Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG,
                bootstrapServers,
                ConsumerConfig.GROUP_ID_CONFIG,
                "dead-letter-reader-" + UUID.randomUUID(),
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,
                "earliest",
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG,
                StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
                StringDeserializer.class));
    consumer.subscribe(List.of(topic));
  }

  /**
   * Polls until a record with this key turns up, or returns {@code null} if none does. Each test
   * uses an aggregate id of its own, so the key tells the tests' records apart.
   */
  public ConsumerRecord<String, String> await(UUID key, Duration timeout) {
    Instant deadline = Instant.now().plus(timeout);
    while (Instant.now().isBefore(deadline)) {
      for (ConsumerRecord<String, String> record : consumer.poll(Duration.ofMillis(500))) {
        if (key.toString().equals(record.key())) {
          return record;
        }
      }
    }
    return null;
  }

  public static String header(ConsumerRecord<String, String> record, String name) {
    Header header = record.headers().lastHeader(name);
    return header == null ? null : new String(header.value(), StandardCharsets.UTF_8);
  }

  @Override
  public void close() {
    consumer.close();
  }
}
