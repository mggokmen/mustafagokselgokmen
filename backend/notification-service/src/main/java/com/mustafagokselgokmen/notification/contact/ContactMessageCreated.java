package com.mustafagokselgokmen.notification.contact;

import java.time.Instant;
import java.util.UUID;

/**
 * The published form of the event, as the API writes it. Unknown fields are ignored, so the API can
 * add one without this service being redeployed first.
 */
public record ContactMessageCreated(
    UUID messageId, UUID authorId, String authorEmail, String subject, Instant createdAt) {}
