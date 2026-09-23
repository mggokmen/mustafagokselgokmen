package com.mustafagokselgokmen.api.common.outbox;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Captures what the publisher hands over, instead of logging it. */
class RecordingOutboxEventTarget implements OutboxEventTarget {

  private final List<OutboxEvent> published = new CopyOnWriteArrayList<>();

  @Override
  public void publish(OutboxEvent event) {
    published.add(event);
  }

  List<OutboxEvent> published() {
    return List.copyOf(published);
  }

  void clear() {
    published.clear();
  }

  @TestConfiguration(proxyBeanMethods = false)
  static class Configuration {

    @Bean
    @Primary
    RecordingOutboxEventTarget recordingOutboxEventTarget() {
      return new RecordingOutboxEventTarget();
    }
  }
}
