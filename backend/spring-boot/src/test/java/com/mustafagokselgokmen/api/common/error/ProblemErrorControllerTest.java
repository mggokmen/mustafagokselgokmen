package com.mustafagokselgokmen.api.common.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.generated.model.Problem;
import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class ProblemErrorControllerTest {

  private final ProblemErrorController controller = new ProblemErrorController();

  @Test
  void containerErrorKeepsItsStatusAndOriginalPath() {
    MockHttpServletRequest request = new MockHttpServletRequest("TRACE", "/error");
    request.setAttribute(RequestDispatcher.ERROR_STATUS_CODE, 405);
    request.setAttribute(RequestDispatcher.ERROR_REQUEST_URI, "/api/v1/auth/google");

    ResponseEntity<Object> response = controller.error(request);

    assertThat(response.getStatusCode().value()).isEqualTo(405);
    assertThat(response.getHeaders().getContentType())
        .isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
    Problem problem = (Problem) response.getBody();
    assertThat(problem).isNotNull();
    assertThat(problem.getCode()).isEqualTo("METHOD_NOT_ALLOWED");
    assertThat(problem.getInstance()).isEqualTo("/api/v1/auth/google");
    assertThat(problem.getErrors()).isNull();
  }
}
