package com.mustafagokselgokmen.api.common.error;

import com.mustafagokselgokmen.api.generated.model.FieldError;
import com.mustafagokselgokmen.api.generated.model.Problem;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/** Builds error responses in the contract's {@code Problem} schema (docs/api.md#errors). */
final class Problems {

  private Problems() {}

  static Problem of(HttpStatus status, String title, String detail, ErrorCode code) {
    // The generated model starts with an empty list; errors appear only on validation failures.
    return new Problem("about:blank", title, status.value(), code.name())
        .detail(detail)
        .errors(null);
  }

  static Problem ofStatus(int status, @Nullable String title, @Nullable String detail) {
    HttpStatus resolved = HttpStatus.resolve(status);
    String reason = resolved == null ? "Error" : resolved.getReasonPhrase();
    return new Problem(
            "about:blank",
            title == null ? reason : title,
            status,
            ErrorCode.forStatus(status).name())
        .detail(detail)
        .errors(null);
  }

  static Problem validation(List<FieldError> errors) {
    return of(
            HttpStatus.BAD_REQUEST,
            "Validation failed",
            "The request has %d invalid field(s).".formatted(errors.size()),
            ErrorCode.VALIDATION_FAILED)
        .errors(errors);
  }

  static ResponseEntity<Object> respond(
      HttpStatusCode status, HttpHeaders headers, Problem problem) {
    return ResponseEntity.status(status)
        .headers(headers)
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(problem);
  }
}
