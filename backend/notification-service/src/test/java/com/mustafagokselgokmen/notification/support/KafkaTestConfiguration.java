package com.mustafagokselgokmen.notification.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.utility.DockerImageName;

/** A real broker, the same image as docker-compose.yml. */
@TestConfiguration(proxyBeanMethods = false)
public class KafkaTestConfiguration {

  @Bean
  @ServiceConnection
  KafkaContainer kafkaContainer() {
    return new KafkaContainer(DockerImageName.parse("apache/kafka:4.3.1"));
  }
}
