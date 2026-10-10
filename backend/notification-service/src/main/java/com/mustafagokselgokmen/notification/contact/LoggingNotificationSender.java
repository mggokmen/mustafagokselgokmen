package com.mustafagokselgokmen.notification.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Writes the notification to the log. Email or push delivery is a later decision; everything around
 * it — consuming, retrying, dead-lettering and de-duplicating — is already real.
 */
@Component
class LoggingNotificationSender implements NotificationSender {

  private static final Logger log = LoggerFactory.getLogger(LoggingNotificationSender.class);

  @Override
  public void send(ContactMessageCreated event) {
    log.info(
        "Notification: contact message {} from {} — \"{}\" (sent at {})",
        event.messageId(),
        event.authorEmail(),
        event.subject(),
        event.createdAt());
  }
}
