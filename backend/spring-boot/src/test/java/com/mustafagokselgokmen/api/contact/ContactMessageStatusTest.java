package com.mustafagokselgokmen.api.contact;

import static com.mustafagokselgokmen.api.contact.ContactMessageStatus.IN_PROGRESS;
import static com.mustafagokselgokmen.api.contact.ContactMessageStatus.NEW;
import static com.mustafagokselgokmen.api.contact.ContactMessageStatus.RESOLVED;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class ContactMessageStatusTest {

  @ParameterizedTest
  @EnumSource(ContactMessageStatus.class)
  void keepingTheSameStatusIsAllowed(ContactMessageStatus status) {
    assertThat(status.canTransitionTo(status)).isTrue();
  }

  @Test
  void aNewMessageCanBePickedUpOrResolved() {
    assertThat(NEW.canTransitionTo(IN_PROGRESS)).isTrue();
    assertThat(NEW.canTransitionTo(RESOLVED)).isTrue();
  }

  @Test
  void aMessageInProgressCanOnlyBeResolved() {
    assertThat(IN_PROGRESS.canTransitionTo(RESOLVED)).isTrue();
    assertThat(IN_PROGRESS.canTransitionTo(NEW)).isFalse();
  }

  @Test
  void aResolvedMessageCanBeReopenedButNotMadeNew() {
    assertThat(RESOLVED.canTransitionTo(IN_PROGRESS)).isTrue();
    assertThat(RESOLVED.canTransitionTo(NEW)).isFalse();
  }
}
