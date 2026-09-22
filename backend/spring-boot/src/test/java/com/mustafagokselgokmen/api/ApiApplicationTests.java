package com.mustafagokselgokmen.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.ApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

@ApiIntegrationTest
class ApiApplicationTests {

  @LocalServerPort int port;

  @Autowired JdbcTemplate jdbcTemplate;

  @Test
  void appliesAllMigrations() {
    Integer tables =
        jdbcTemplate.queryForObject(
            """
            SELECT count(*) FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('users', 'contact_messages', 'refresh_tokens')
            """,
            Integer.class);

    assertThat(tables).isEqualTo(3);
  }

  @Test
  void healthEndpointIsPublicAndUp() {
    ApiClient.Response response = new ApiClient(port).get("/actuator/health", null);

    assertThat(response.status()).isEqualTo(200);
    assertThat(response.<String>json("$.status")).isEqualTo("UP");
  }

  @Test
  void unsupportedMethodReturns405ProblemWithAllowHeader() {
    ApiClient.Response response = new ApiClient(port).get("/api/v1/auth/google", null);

    assertThat(response.status()).isEqualTo(405);
    assertThat(response.contentType()).isEqualTo("application/problem+json");
    assertThat(response.<String>json("$.code")).isEqualTo("METHOD_NOT_ALLOWED");
    assertThat(response.headers().getFirst("Allow")).contains("POST");
    assertThat(response.body()).doesNotContain("\"errors\"");
  }

  @Test
  void queryMethodIsAnsweredLikeAnyUnsupportedMethod() {
    ApiClient.Response response = new ApiClient(port).send("QUERY", "/api/v1/auth/google");

    assertThat(response.status()).isEqualTo(405);
    assertThat(response.<String>json("$.code")).isEqualTo("METHOD_NOT_ALLOWED");
  }

  @Test
  void unknownPathRequiresAuthenticationFirst() {
    ApiClient.Response response = new ApiClient(port).get("/api/v1/unknown", null);

    assertThat(response.status()).isEqualTo(401);
    assertThat(response.<String>json("$.code")).isEqualTo("UNAUTHENTICATED");
  }
}
