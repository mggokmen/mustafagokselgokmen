package com.mustafagokselgokmen.api.common.error;

/**
 * The request conflicts with the current state of the resource: a stale {@code version} or a
 * transition the domain doesn't allow. Answered with 409.
 */
public class ConflictException extends RuntimeException {

  public ConflictException(String message) {
    super(message);
  }
}
