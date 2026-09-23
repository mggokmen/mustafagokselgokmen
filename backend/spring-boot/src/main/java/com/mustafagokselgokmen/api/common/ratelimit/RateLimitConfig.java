package com.mustafagokselgokmen.api.common.ratelimit;

import com.mustafagokselgokmen.api.common.ratelimit.RateLimiter.LimitName;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
class RateLimitConfig implements WebMvcConfigurer {

  private final RateLimiter rateLimiter;

  RateLimitConfig(RateLimiter rateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(new RateLimitInterceptor(rateLimiter, LimitName.SIGN_IN))
        .addPathPatterns("/api/v1/auth/google");
    registry
        .addInterceptor(new RateLimitInterceptor(rateLimiter, LimitName.REFRESH))
        .addPathPatterns("/api/v1/auth/refresh");
  }
}
