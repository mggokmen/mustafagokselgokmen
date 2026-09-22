package com.mustafagokselgokmen.api.identity;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/** The user of the current request, taken from the verified access token. */
public final class AuthenticatedUser {

  private AuthenticatedUser() {}

  public static UUID id() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication instanceof JwtAuthenticationToken token) {
      return UUID.fromString(token.getToken().getSubject());
    }
    throw new InvalidTokenException("Request is not authenticated with an access token");
  }
}
