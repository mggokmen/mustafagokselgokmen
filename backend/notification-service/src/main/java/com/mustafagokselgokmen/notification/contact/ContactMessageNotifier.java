package com.mustafagokselgokmen.notification.contact;

import com.mustafagokselgokmen.notification.common.events.EventHeaders;
import com.mustafagokselgokmen.notification.common.events.ProcessedEvents;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Notifies once per event. The claim and the notification share a transaction, so a send that fails
 * leaves no claim behind and the retry starts from the beginning (ADR-010).
 */
@Service
public class ContactMessageNotifier {

  private static final Logger log = LoggerFactory.getLogger(ContactMessageNotifier.class);

  private final ProcessedEvents processedEvents;
  private final NotificationSender sender;

  ContactMessageNotifier(ProcessedEvents processedEvents, NotificationSender sender) {
    this.processedEvents = processedEvents;
    this.sender = sender;
  }

  @Transactional
  public void notifyOnce(EventHeaders headers, UUID aggregateId, ContactMessageCreated event) {
    if (!processedEvents.claim(headers, aggregateId)) {
      log.debug("Event {} was already handled", headers.eventId());
      return;
    }
    sender.send(event);
  }
}
