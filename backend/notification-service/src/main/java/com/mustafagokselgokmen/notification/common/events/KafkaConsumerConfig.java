package com.mustafagokselgokmen.notification.common.events;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

/** Retry and dead-letter handling for every listener in this service (ADR-010). */
@Configuration(proxyBeanMethods = false)
class KafkaConsumerConfig {

  private final ConsumerProperties properties;

  KafkaConsumerConfig(ConsumerProperties properties) {
    this.properties = properties;
  }

  /**
   * Boot hands this to the listener containers. A failing record is retried with a growing pause
   * and then published to the dead-letter topic, so one bad record never blocks its partition.
   */
  @Bean
  DefaultErrorHandler errorHandler(KafkaTemplate<String, String> kafka) {
    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer(kafka), backOff());
    // Nothing about a retry can make these records succeed, so they go to the dead-letter topic on
    // the first attempt.
    handler.addNotRetryableExceptions(UnprocessableEventException.class);
    return handler;
  }

  /** This service owns its dead-letter topic; the topics it reads belong to their publisher. */
  @Bean
  NewTopic contactMessageDeadLetterTopic(
      @Value("${app.events.contact-message-topic}") String topic) {
    return TopicBuilder.name(deadLetterTopic(topic)).partitions(3).replicas(1).build();
  }

  private DeadLetterPublishingRecoverer recoverer(KafkaTemplate<String, String> kafka) {
    // A negative partition lets the broker place the record by its key, because the dead-letter
    // topic doesn't have to have the same partitions as the topic it mirrors.
    return new DeadLetterPublishingRecoverer(
        kafka, (record, exception) -> new TopicPartition(deadLetterTopic(record.topic()), -1));
  }

  private ExponentialBackOff backOff() {
    ConsumerProperties.Retry retry = properties.retry();
    ExponentialBackOff backOff = new ExponentialBackOff();
    // The back-off counts the pauses between attempts, so it stops one short of the attempts.
    backOff.setMaxAttempts(retry.maxAttempts() - 1L);
    backOff.setInitialInterval(retry.initialBackoff().toMillis());
    backOff.setMultiplier(retry.multiplier());
    backOff.setMaxInterval(retry.maxBackoff().toMillis());
    return backOff;
  }

  private String deadLetterTopic(String topic) {
    return topic + properties.deadLetterSuffix();
  }
}
