package com.mustafagokselgokmen.notification.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration(proxyBeanMethods = false)
public class NotificationTestConfiguration {

  /** Replaces the logging sender, so tests can see what was notified and make a send fail. */
  @Bean
  @Primary
  RecordingNotificationSender recordingNotificationSender() {
    return new RecordingNotificationSender();
  }
}
