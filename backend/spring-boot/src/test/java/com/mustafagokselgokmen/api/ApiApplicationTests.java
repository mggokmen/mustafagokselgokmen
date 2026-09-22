package com.mustafagokselgokmen.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestClient;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
    String body =
        RestClient.create("http://localhost:" + port)
            .get()
            .uri("/actuator/health")
            .retrieve()
            .body(String.class);

    assertThat(body).contains("\"status\":\"UP\"");
  }
}
