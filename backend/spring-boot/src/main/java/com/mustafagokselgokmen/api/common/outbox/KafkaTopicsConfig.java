package com.mustafagokselgokmen.api.common.outbox;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares the topics this application publishes to, so they exist with the settings we chose
 * instead of being created on first use with the broker's defaults.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "app.outbox.target", havingValue = "kafka")
class KafkaTopicsConfig {

  @Bean
  NewTopic contactMessageEvents(OutboxProperties properties) {
    return TopicBuilder.name(OutboxTopics.forAggregate(properties.topicPrefix(), "ContactMessage"))
        // Several partitions keep ordering per message while allowing parallel consumers.
        // One replica is all a single-broker development stack can do.
        .partitions(3)
        .replicas(1)
        .build();
  }
}
