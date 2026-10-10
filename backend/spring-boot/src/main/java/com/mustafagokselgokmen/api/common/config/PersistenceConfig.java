package com.mustafagokselgokmen.api.common.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
class PersistenceConfig {

  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
