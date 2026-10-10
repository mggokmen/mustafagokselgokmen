package com.mustafagokselgokmen.api.contact;

import static org.assertj.core.api.Assertions.assertThat;

import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.ApiClient.Response;
import com.mustafagokselgokmen.api.support.ApiIntegrationTest;
import com.mustafagokselgokmen.api.support.IdentityTestConfiguration;
import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;

@ApiIntegrationTest
class ContactApiTests {

  private static final String MESSAGES = "/api/v1/contact-messages";

  @LocalServerPort int port;

  private final TestIdentityProvider provider = TestIdentityProvider.get();
  private ApiClient api;

  @BeforeEach
  void setUp() {
    api = new ApiClient(port);
  }

  @Test
  void aUserSendsAMessageAndFindsItAgain() {
    String token = signInAsUser();

    Response created = send(token, "Question about the Android app", "Where can I download it?");

    assertThat(created.status()).isEqualTo(201);
    assertThat(created.headers().getFirst("Location"))
        .isEqualTo(MESSAGES + "/" + created.<String>json("$.id"));
    assertThat(created.<String>json("$.status")).isEqualTo("NEW");
    assertThat(created.<Integer>json("$.version")).isZero();
    assertThat(created.<String>json("$.subject")).isEqualTo("Question about the Android app");

    Response byId = api.get(MESSAGES + "/" + created.json("$.id"), token);
    assertThat(byId.status()).isEqualTo(200);
    assertThat(byId.<String>json("$.author.email")).isEqualTo(created.json("$.author.email"));

    Response list = api.get(MESSAGES, token);
    assertThat(list.<List<String>>json("$.items[*].id"))
        .containsExactly(created.<String>json("$.id"));
    assertThat(list.<Integer>json("$.totalItems")).isEqualTo(1);
  }

  @Test
  void usersSeeOnlyTheirOwnMessages() {
    String author = signInAsUser();
    String messageId = send(author, "Private", "Only mine").json("$.id");
    String otherUser = signInAsUser();

    Response list = api.get(MESSAGES, otherUser);
    Response byId = api.get(MESSAGES + "/" + messageId, otherUser);

    assertThat(list.<Integer>json("$.totalItems")).isZero();
    // Someone else's message is 404, not 403: the response mustn't reveal that it exists.
    assertThat(byId.status()).isEqualTo(404);
    assertThat(byId.<String>json("$.code")).isEqualTo("NOT_FOUND");
  }

  @Test
  void adminSeesEveryMessage() {
    String author = signInAsUser();
    String messageId = send(author, "Visible to admin", "Hello").json("$.id");
    String admin = signInAsAdmin();

    assertThat(api.get(MESSAGES + "/" + messageId, admin).status()).isEqualTo(200);
    assertThat(api.get(MESSAGES + "?size=100", admin).<List<String>>json("$.items[*].id"))
        .contains(messageId);
  }

  @Test
  void onlyAdminsChangeTheStatus() {
    String author = signInAsUser();
    String messageId = send(author, "Who can move this", "Not me").json("$.id");

    Response forbidden = setStatus(author, messageId, "IN_PROGRESS", 0);

    assertThat(forbidden.status()).isEqualTo(403);
    assertThat(forbidden.<String>json("$.code")).isEqualTo("FORBIDDEN");
  }

  @Test
  void adminMovesAMessageThroughTheWorkflow() {
    String messageId = send(signInAsUser(), "Workflow", "Move me").json("$.id");
    String admin = signInAsAdmin();

    Response inProgress = setStatus(admin, messageId, "IN_PROGRESS", 0);
    assertThat(inProgress.status()).isEqualTo(200);
    assertThat(inProgress.<String>json("$.status")).isEqualTo("IN_PROGRESS");
    assertThat(inProgress.<Integer>json("$.version")).isEqualTo(1);

    Response unchanged = setStatus(admin, messageId, "IN_PROGRESS", 1);
    assertThat(unchanged.status()).isEqualTo(200);
    assertThat(unchanged.<Integer>json("$.version")).isEqualTo(1);

    assertThat(setStatus(admin, messageId, "RESOLVED", 1).<String>json("$.status"))
        .isEqualTo("RESOLVED");
    assertThat(setStatus(admin, messageId, "IN_PROGRESS", 2).<String>json("$.status"))
        .isEqualTo("IN_PROGRESS");
  }

  @Test
  void aStaleVersionIsRejectedWith409() {
    String messageId = send(signInAsUser(), "Concurrent edits", "Two admins").json("$.id");
    String admin = signInAsAdmin();
    setStatus(admin, messageId, "IN_PROGRESS", 0);

    Response stale = setStatus(admin, messageId, "RESOLVED", 0);

    assertThat(stale.status()).isEqualTo(409);
    assertThat(stale.<String>json("$.code")).isEqualTo("CONFLICT");
  }

  @Test
  void aTransitionTheWorkflowForbidsIsRejectedWith409() {
    String messageId = send(signInAsUser(), "Back to new", "Not allowed").json("$.id");
    String admin = signInAsAdmin();
    setStatus(admin, messageId, "RESOLVED", 0);

    Response backToNew = setStatus(admin, messageId, "NEW", 1);

    assertThat(backToNew.status()).isEqualTo(409);
    assertThat(backToNew.<String>json("$.code")).isEqualTo("CONFLICT");
  }

  @Test
  void theListCanBeFilteredSearchedAndPaged() {
    String token = signInAsUser();
    String first = send(token, "Android crash", "It closes").json("$.id");
    send(token, "iOS question", "How do I sign in?");
    send(token, "Web feedback", "Looks good");
    String admin = signInAsAdmin();
    setStatus(admin, first, "RESOLVED", 0);

    assertThat(api.get(MESSAGES + "?q=android", token).<List<String>>json("$.items[*].id"))
        .containsExactly(first);
    assertThat(api.get(MESSAGES + "?status=NEW", token).<Integer>json("$.totalItems")).isEqualTo(2);
    assertThat(
            api.get(MESSAGES + "?status=NEW&status=RESOLVED", token).<Integer>json("$.totalItems"))
        .isEqualTo(3);

    Response firstPage = api.get(MESSAGES + "?size=2&sort=createdAt,asc", token);
    assertThat(firstPage.<List<String>>json("$.items[*].id")).hasSize(2);
    assertThat(firstPage.<Integer>json("$.totalItems")).isEqualTo(3);
    assertThat(firstPage.<Integer>json("$.totalPages")).isEqualTo(2);
    assertThat(firstPage.<List<String>>json("$.items[*].id").get(0)).isEqualTo(first);
  }

  @Test
  void emptyFilterParametersAreIgnored() {
    // A client that sends "?sort=&status=" means "no preference", not an error.
    Response response = api.get(MESSAGES + "?sort=&status=&status=", signInAsUser());

    assertThat(response.status()).isEqualTo(200);
  }

  @Test
  void anUnsupportedSortFieldIsRejectedWith400() {
    Response response = api.get(MESSAGES + "?sort=message,asc", signInAsUser());

    assertThat(response.status()).isEqualTo(400);
    assertThat(response.<String>json("$.code")).isEqualTo("VALIDATION_FAILED");
    assertThat(response.<String>json("$.errors[0].field")).isEqualTo("sort");
  }

  @Test
  void aBlankSubjectIsRejectedWith400() {
    Response response =
        api.post(MESSAGES, "{\"subject\":\"   \",\"message\":\"Body\"}", signInAsUser());

    assertThat(response.status()).isEqualTo(400);
    assertThat(response.<String>json("$.code")).isEqualTo("VALIDATION_FAILED");
    assertThat(response.<String>json("$.errors[0].field")).isEqualTo("subject");
  }

  @Test
  void nulCharactersAreRemovedInsteadOfFailing() {
    // The contract allows any string, but PostgreSQL cannot store a NUL character in text.
    Response response =
        api.post(
            MESSAGES, "{\"subject\":\"Valid\",\"message\":\"Bad \\u0000 byte\"}", signInAsUser());

    assertThat(response.status()).isEqualTo(201);
    assertThat(response.<String>json("$.message")).isEqualTo("Bad  byte").doesNotContain("\0");
  }

  @Test
  void aPageBeyondTheLastOneIsEmptyButKeepsTheTotals() {
    String token = signInAsUser();
    send(token, "Only message", "Body");

    Response response = api.get(MESSAGES + "?page=2147483646&size=20", token);

    assertThat(response.status()).isEqualTo(200);
    assertThat(response.<List<String>>json("$.items[*].id")).isEmpty();
    assertThat(response.<Integer>json("$.totalItems")).isEqualTo(1);
  }

  @Test
  void sendingRequiresAuthentication() {
    Response response = api.post(MESSAGES, "{\"subject\":\"Hi\",\"message\":\"There\"}");

    assertThat(response.status()).isEqualTo(401);
    assertThat(response.<String>json("$.code")).isEqualTo("UNAUTHENTICATED");
  }

  private Response send(String token, String subject, String message) {
    return api.post(
        MESSAGES, "{\"subject\":\"%s\",\"message\":\"%s\"}".formatted(subject, message), token);
  }

  private Response setStatus(String token, String messageId, String status, int version) {
    return api.put(
        MESSAGES + "/" + messageId + "/status",
        "{\"status\":\"%s\",\"version\":%d}".formatted(status, version),
        token);
  }

  private String signInAsUser() {
    return signIn(UUID.randomUUID() + "@example.com");
  }

  private String signInAsAdmin() {
    return signIn(IdentityTestConfiguration.ADMIN_EMAIL);
  }

  private String signIn(String email) {
    String idToken = provider.idToken(UUID.randomUUID().toString(), email, "Test User");
    return api.post("/api/v1/auth/google", "{\"idToken\":\"" + idToken + "\"}")
        .json("$.accessToken");
  }
}
