package com.mustafagokselgokmen.api.identity;

import org.springframework.security.core.AuthenticationException;

/** A Google ID token, access token or refresh token was rejected. Answered with 401. */
public class InvalidTokenException extends AuthenticationException {

  public InvalidTokenException(String message) {
    super(message);
  }

  public InvalidTokenException(String message, Throwable cause) {
    super(message, cause);
  }
}
