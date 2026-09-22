package com.mustafagokselgokmen.api.common.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.generated.model.Problem;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;

class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
  private final MockHttpServletRequest request =
      new MockHttpServletRequest("PUT", "/api/v1/contact-messages/1/status");

  @Test
  void accessDeniedBecomes403ProblemWithForbiddenCode() {
    ResponseEntity<Object> response =
        handler.handleAccessDenied(new AccessDeniedException("no"), request);

    assertThat(response.getStatusCode().value()).isEqualTo(403);
    assertThat(response.getHeaders().getContentType())
        .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
    Problem problem = (Problem) response.getBody();
    assertThat(problem).isNotNull();
    assertThat(problem.getType()).isEqualTo("about:blank");
    assertThat(problem.getStatus()).isEqualTo(403);
    assertThat(problem.getCode()).isEqualTo("FORBIDDEN");
    assertThat(problem.getInstance()).isEqualTo("/api/v1/contact-messages/1/status");
  }

  @Test
  void unexpectedErrorBecomes500ProblemWithoutInternals() {
    ResponseEntity<Object> response =
        handler.handleUnexpected(new IllegalStateException("database password is wrong"), request);

    Problem problem = (Problem) response.getBody();
    assertThat(response.getStatusCode().value()).isEqualTo(500);
    assertThat(problem).isNotNull();
    assertThat(problem.getCode()).isEqualTo("INTERNAL_ERROR");
    assertThat(problem.getDetail()).doesNotContain("password");
  }
}
