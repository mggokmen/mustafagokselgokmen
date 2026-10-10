package com.mustafagokselgokmen.api.contact;

import java.util.Set;

/** The workflow of a contact message (docs/architecture.md#message-status). */
public enum ContactMessageStatus {
  NEW,
  IN_PROGRESS,
  RESOLVED;

  private static final Set<ContactMessageStatus> FROM_NEW = Set.of(IN_PROGRESS, RESOLVED);
  private static final Set<ContactMessageStatus> FROM_IN_PROGRESS = Set.of(RESOLVED);
  private static final Set<ContactMessageStatus> FROM_RESOLVED = Set.of(IN_PROGRESS);

  /** Setting the status a message already has is allowed and changes nothing. */
  public boolean canTransitionTo(ContactMessageStatus target) {
    if (this == target) {
      return true;
    }
    return switch (this) {
      case NEW -> FROM_NEW.contains(target);
      case IN_PROGRESS -> FROM_IN_PROGRESS.contains(target);
      case RESOLVED -> FROM_RESOLVED.contains(target);
    };
  }
}
