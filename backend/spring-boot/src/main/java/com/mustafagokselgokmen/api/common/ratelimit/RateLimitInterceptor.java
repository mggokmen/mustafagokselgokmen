package com.mustafagokselgokmen.api.common.ratelimit;

import com.mustafagokselgokmen.api.common.ratelimit.RateLimiter.LimitName;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Counts one request against a limit before the controller runs. The client is its IP address; a
 * deployment behind a proxy must therefore pass the real address through.
 */
class RateLimitInterceptor implements HandlerInterceptor {

  private final RateLimiter rateLimiter;
  private final LimitName limit;

  RateLimitInterceptor(RateLimiter rateLimiter, LimitName limit) {
    this.rateLimiter = rateLimiter;
    this.limit = limit;
  }

  @Override
  public boolean preHandle(
      HttpServletRequest request, HttpServletResponse response, Object handler) {
    rateLimiter.consume(limit, request.getRemoteAddr());
    return true;
  }
}
