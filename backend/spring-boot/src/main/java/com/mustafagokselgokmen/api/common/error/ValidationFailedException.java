package com.mustafagokselgokmen.api.common.error;

/**
 * A field is invalid for a reason the contract's schema can't express. Answered with 400 and the
 * field named in {@code errors} (docs/api.md#validation).
 */
public class ValidationFailedException extends RuntimeException {

  private final String field;

  public ValidationFailedException(String field, String message) {
    super(message);
    this.field = field;
  }

  public String getField() {
    return field;
  }
}
