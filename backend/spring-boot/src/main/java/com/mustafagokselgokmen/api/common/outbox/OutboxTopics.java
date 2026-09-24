package com.mustafagokselgokmen.api.common.outbox;

import java.util.Locale;

/** One topic per aggregate type: {@code ContactMessage} becomes {@code events.contact-message}. */
final class OutboxTopics {

  private OutboxTopics() {}

  static String forAggregate(String topicPrefix, String aggregateType) {
    String kebab = aggregateType.replaceAll("([a-z0-9])([A-Z])", "$1-$2").toLowerCase(Locale.ROOT);
    return topicPrefix + "." + kebab;
  }
}
