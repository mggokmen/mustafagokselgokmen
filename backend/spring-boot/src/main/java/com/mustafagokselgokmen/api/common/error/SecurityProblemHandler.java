package com.mustafagokselgokmen.api.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

/**
 * Spring Security rejects requests before they reach a controller. This hands those rejections to
 * Spring MVC's exception resolution, so 401 and 403 use the same ProblemDetail format as every
 * other error ({@link GlobalExceptionHandler}).
 */
@Component
public class SecurityProblemHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

  private final HandlerExceptionResolver resolver;

  SecurityProblemHandler(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
    this.resolver = resolver;
  }

  @Override
  public void commence(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) {
    resolver.resolveException(request, response, null, exception);
  }

  @Override
  public void handle(
      HttpServletRequest request, HttpServletResponse response, AccessDeniedException exception) {
    resolver.resolveException(request, response, null, exception);
  }
}
