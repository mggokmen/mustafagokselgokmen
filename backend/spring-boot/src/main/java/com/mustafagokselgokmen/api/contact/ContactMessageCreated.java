package com.mustafagokselgokmen.api.contact;

import java.time.Instant;
import java.util.UUID;

/**
 * The event recorded when a message is sent. It carries what a consumer needs to notify someone,
 * not the whole message: the body stays in the database.
 */
record ContactMessageCreated(
    UUID messageId, UUID authorId, String authorEmail, String subject, Instant createdAt) {}
