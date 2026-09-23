package com.mustafagokselgokmen.api.common.error;

/**
 * The resource doesn't exist, or the caller isn't allowed to see it. Answered with 404, so a
 * response never reveals that someone else's resource exists (docs/api.md#authorization).
 */
public class NotFoundException extends RuntimeException {

  public NotFoundException(String message) {
    super(message);
  }
}
