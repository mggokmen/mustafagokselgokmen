package com.mustafagokselgokmen.api.common.error;

/**
 * Machine-readable error codes returned in the {@code code} field of every problem (docs/api.md).
 */
public enum ErrorCode {
  VALIDATION_FAILED,
  BAD_REQUEST,
  UNAUTHENTICATED,
  FORBIDDEN,
  NOT_FOUND,
  METHOD_NOT_ALLOWED,
  NOT_ACCEPTABLE,
  CONFLICT,
  UNSUPPORTED_MEDIA_TYPE,
  RATE_LIMITED,
  INTERNAL_ERROR;

  static ErrorCode forStatus(int status) {
    return switch (status) {
      case 400 -> VALIDATION_FAILED;
      case 401 -> UNAUTHENTICATED;
      case 403 -> FORBIDDEN;
      case 404 -> NOT_FOUND;
      case 405 -> METHOD_NOT_ALLOWED;
      case 406 -> NOT_ACCEPTABLE;
      case 409 -> CONFLICT;
      case 415 -> UNSUPPORTED_MEDIA_TYPE;
      case 429 -> RATE_LIMITED;
      default -> status < 500 ? BAD_REQUEST : INTERNAL_ERROR;
    };
  }
}
