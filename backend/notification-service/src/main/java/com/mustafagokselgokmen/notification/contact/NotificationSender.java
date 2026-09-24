package com.mustafagokselgokmen.notification.contact;

/**
 * Where a notification goes. An implementation throws when it fails, so the record is retried and
 * eventually dead-lettered instead of being silently dropped.
 */
public interface NotificationSender {

  void send(ContactMessageCreated event);
}
