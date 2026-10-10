package com.mustafagokselgokmen.api.contact;

/** Makes text from a request safe to store, without narrowing what the contract accepts. */
final class ContactMessageText {

  private ContactMessageText() {}

  /**
   * Removes NUL characters and trims the text. PostgreSQL cannot store a NUL in a text column, and
   * the contract allows any string, so the character is dropped rather than the request rejected.
   */
  static String storable(String value) {
    return value.replace("\0", "").strip();
  }
}
