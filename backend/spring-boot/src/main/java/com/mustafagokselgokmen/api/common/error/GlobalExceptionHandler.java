package com.mustafagokselgokmen.api.common.error;

import com.mustafagokselgokmen.api.generated.model.FieldError;
import com.mustafagokselgokmen.api.generated.model.Problem;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns every error into the contract's {@code Problem} schema, with a {@code code} and, for
 * validation failures, {@code errors} (docs/api.md#errors). Spring MVC's own exceptions arrive as
 * {@link ProblemDetail} and are converted in {@link #createResponseEntity}. Security errors reach
 * this class through {@link SecurityProblemHandler}; errors raised by the servlet container are
 * handled by {@link ProblemErrorController}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<Object> handleAuthentication(
      AuthenticationException ex, HttpServletRequest request) {
    // The detail stays generic, so responses don't reveal which check failed.
    HttpHeaders headers = new HttpHeaders();
    headers.set(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
    Problem problem =
        Problems.of(
                HttpStatus.UNAUTHORIZED,
                "Authentication required",
                "Missing, invalid or expired credentials.",
                ErrorCode.UNAUTHENTICATED)
            .instance(request.getRequestURI());
    return Problems.respond(HttpStatus.UNAUTHORIZED, headers, problem);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<Object> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest request) {
    Problem problem =
        Problems.of(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                "You don't have permission to perform this action.",
                ErrorCode.FORBIDDEN)
            .instance(request.getRequestURI());
    return Problems.respond(HttpStatus.FORBIDDEN, new HttpHeaders(), problem);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Object> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest request) {
    List<FieldError> errors =
        ex.getConstraintViolations().stream()
            .map(v -> new FieldError(v.getPropertyPath().toString(), v.getMessage()))
            .toList();
    return Problems.respond(
        HttpStatus.BAD_REQUEST,
        new HttpHeaders(),
        Problems.validation(errors).instance(request.getRequestURI()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Object> handleUnexpected(Exception ex, HttpServletRequest request) {
    log.error("Unexpected error", ex);
    Problem problem =
        Problems.of(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal error",
                "An unexpected error occurred.",
                ErrorCode.INTERNAL_ERROR)
            .instance(request.getRequestURI());
    return Problems.respond(HttpStatus.INTERNAL_SERVER_ERROR, new HttpHeaders(), problem);
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    List<FieldError> errors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new FieldError(e.getField(), message(e.getDefaultMessage())))
            .toList();
    return handleExceptionInternal(ex, Problems.validation(errors), headers, status, request);
  }

  @Override
  protected ResponseEntity<Object> handleHandlerMethodValidationException(
      HandlerMethodValidationException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    List<FieldError> errors =
        ex.getParameterValidationResults().stream()
            .flatMap(
                result ->
                    result.getResolvableErrors().stream()
                        .map(
                            error ->
                                new FieldError(
                                    result.getMethodParameter().getParameterName(),
                                    message(error.getDefaultMessage()))))
            .toList();
    return handleExceptionInternal(
        ex, Problems.validation(errors), headers, HttpStatus.BAD_REQUEST, request);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    Problem problem =
        Problems.of(
            HttpStatus.BAD_REQUEST,
            "Malformed request",
            "The request body is missing or is not valid JSON for this operation.",
            ErrorCode.VALIDATION_FAILED);
    return handleExceptionInternal(ex, problem, headers, status, request);
  }

  /** Every response built by the base class passes through here: convert it to the contract. */
  @Override
  protected ResponseEntity<Object> createResponseEntity(
      @Nullable Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
    Problem problem;
    if (body instanceof Problem contractProblem) {
      problem = contractProblem;
    } else if (body instanceof ProblemDetail detail) {
      problem = Problems.ofStatus(statusCode.value(), detail.getTitle(), detail.getDetail());
    } else {
      problem = Problems.ofStatus(statusCode.value(), null, null);
    }
    if (problem.getInstance() == null && request instanceof ServletWebRequest servletRequest) {
      problem.setInstance(servletRequest.getRequest().getRequestURI());
    }
    return Problems.respond(statusCode, headers, problem);
  }

  private static String message(@Nullable String message) {
    return message == null ? "is invalid" : message;
  }
}
