package com.mustafagokselgokmen.api.common.error;

import com.mustafagokselgokmen.api.generated.model.Problem;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Answers errors raised by the servlet container itself, before Spring MVC handles the request (for
 * example a rejected TRACE method), in the same {@code Problem} format as every other error.
 * Replaces Spring Boot's default error response.
 */
@RestController
class ProblemErrorController implements ErrorController {

  @RequestMapping("${server.error.path:/error}")
  ResponseEntity<Object> error(HttpServletRequest request) {
    Object code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
    int status = code instanceof Integer value ? value : HttpStatus.INTERNAL_SERVER_ERROR.value();
    Object path = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
    Problem problem = Problems.ofStatus(status, null, null);
    problem.setInstance(path instanceof String uri ? uri : request.getRequestURI());
    return Problems.respond(HttpStatus.valueOf(status), new HttpHeaders(), problem);
  }
}
