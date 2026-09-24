package com.mustafagokselgokmen.notification.common.events;

/**
 * A record this service will never be able to handle, whatever it does: a missing header, or a body
 * that isn't the event it claims to be. Retrying would only repeat the failure, so the record goes
 * straight to the dead-letter topic.
 */
public class UnprocessableEventException extends RuntimeException {

  public UnprocessableEventException(String message) {
    super(message);
  }

  public UnprocessableEventException(String message, Throwable cause) {
    super(message, cause);
  }
}
