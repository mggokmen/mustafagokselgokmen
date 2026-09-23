package com.mustafagokselgokmen.api.support;

import com.jayway.jsonpath.JsonPath;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

/** A small HTTP client for integration tests that returns every response, including errors. */
public final class ApiClient {

  private final RestClient client;

  public ApiClient(int port) {
    this.client =
        RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(status -> true, (request, response) -> {})
            .build();
  }

  public Response get(String path, String accessToken) {
    RestClient.RequestHeadersSpec<?> request = client.get().uri(path);
    if (accessToken != null) {
      request = request.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }
    return Response.of(request.retrieve().toEntity(String.class));
  }

  public Response send(String method, String path) {
    return Response.of(
        client.method(HttpMethod.valueOf(method)).uri(path).retrieve().toEntity(String.class));
  }

  public Response post(String path, String json) {
    return post(path, json, null);
  }

  public Response post(String path, String json, String accessToken) {
    return body(client.post().uri(path), json, accessToken);
  }

  public Response put(String path, String json, String accessToken) {
    return body(client.put().uri(path), json, accessToken);
  }

  private Response body(RestClient.RequestBodySpec request, String json, String accessToken) {
    request.contentType(MediaType.APPLICATION_JSON);
    if (accessToken != null) {
      request.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
    }
    return Response.of(request.body(json).retrieve().toEntity(String.class));
  }

  public record Response(int status, HttpHeaders headers, String body) {

    static Response of(ResponseEntity<String> entity) {
      return new Response(entity.getStatusCode().value(), entity.getHeaders(), entity.getBody());
    }

    public <T> T json(String path) {
      return JsonPath.read(body, path);
    }

    public String contentType() {
      MediaType type = headers.getContentType();
      return type == null ? null : type.toString();
    }
  }
}
