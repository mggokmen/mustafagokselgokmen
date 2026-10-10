package com.mustafagokselgokmen.notification;

import com.mustafagokselgokmen.notification.support.KafkaTestConfiguration;
import com.mustafagokselgokmen.notification.support.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import({TestcontainersConfiguration.class, KafkaTestConfiguration.class})
class NotificationApplicationTests {

  /** The application starts: migrations run, the listener container starts and the beans wire. */
  @Test
  void contextLoads() {}
}
