package com.mustafagokselgokmen.api.common.config;

import com.mustafagokselgokmen.api.common.error.SecurityProblemHandler;
import jakarta.servlet.DispatcherType;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.firewall.HttpFirewall;
import org.springframework.security.web.firewall.StrictHttpFirewall;

@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity // for @PreAuthorize on service methods (docs/security.md#authorization)
class SecurityConfig {

  /** Operations with {@code security: []} in the contract. */
  private static final String[] PUBLIC_PATHS = {
    "/actuator/health/**", "/api/v1/auth/google", "/api/v1/auth/refresh", "/api/v1/auth/logout"
  };

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityProblemHandler problems)
      throws Exception {
    // Stateless API: no cookies reach it, so CSRF protection does not apply (docs/security.md).
    return http.csrf(csrf -> csrf.disable())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth
                    // Error dispatches from the servlet container keep their own status (e.g. a
                    // rejected method stays 405) instead of turning into 401.
                    .dispatcherTypeMatchers(DispatcherType.ERROR)
                    .permitAll()
                    .requestMatchers(PUBLIC_PATHS)
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .oauth2ResourceServer(
            resourceServer ->
                resourceServer
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(roleAuthorities()))
                    .authenticationEntryPoint(problems))
        .exceptionHandling(
            exceptions ->
                exceptions.authenticationEntryPoint(problems).accessDeniedHandler(problems))
        .build();
  }

  /**
   * Spring Security's defaults plus QUERY, a standard method. Without it the firewall answers QUERY
   * with 400; with it, Spring MVC answers 405 with an Allow header, like any unsupported method.
   */
  @Bean
  HttpFirewall httpFirewall() {
    StrictHttpFirewall firewall = new StrictHttpFirewall();
    firewall.setAllowedHttpMethods(
        List.of("DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "QUERY"));
    return firewall;
  }

  /** Maps the access token's {@code role} claim to a {@code ROLE_*} authority. */
  private static JwtAuthenticationConverter roleAuthorities() {
    JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
    authorities.setAuthoritiesClaimName("role");
    authorities.setAuthorityPrefix("ROLE_");
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(authorities);
    return converter;
  }
}
