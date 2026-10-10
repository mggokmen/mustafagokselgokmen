package com.mustafagokselgokmen.api.contact;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ContactMessageTextTest {

  @Test
  void removesNulCharactersPostgresCannotStore() {
    assertThat(ContactMessageText.storable("Bad \0 byte")).isEqualTo("Bad  byte");
    assertThat(ContactMessageText.storable("\0\0")).isEmpty();
  }

  @Test
  void trimsSurroundingWhitespaceAndKeepsEverythingElse() {
    assertThat(ContactMessageText.storable("  Hello\tworld\nSecond line  "))
        .isEqualTo("Hello\tworld\nSecond line");
  }
}
