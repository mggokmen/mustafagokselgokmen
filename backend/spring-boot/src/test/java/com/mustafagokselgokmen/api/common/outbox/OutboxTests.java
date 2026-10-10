package com.mustafagokselgokmen.api.common.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jayway.jsonpath.JsonPath;
import com.mustafagokselgokmen.api.support.ApiClient;
import com.mustafagokselgokmen.api.support.ApiIntegrationTest;
import com.mustafagokselgokmen.api.support.TestIdentityProvider;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

@ApiIntegrationTest
@Import(RecordingOutboxEventTarget.Configuration.class)
class OutboxTests {

  @LocalServerPort int port;

  @Autowired OutboxEventRepository events;
  @Autowired OutboxWriter outbox;
  @Autowired OutboxPublisher publisher;
  @Autowired RecordingOutboxEventTarget target;
  @Autowired TransactionTemplate transactions;

  private final TestIdentityProvider provider = TestIdentityProvider.get();
  private ApiClient api;

  @BeforeEach
  void setUp() {
    api = new ApiClient(port);
    publisher.publishPending();
    target.clear();
  }

  @Test
  void sendingAMessageRecordsOneEventWithTheSameTransaction() {
    String messageId = sendMessage("Outbox subject");

    List<OutboxEvent> recorded = eventsOf(messageId);

    assertThat(recorded).hasSize(1);
    OutboxEvent event = recorded.get(0);
    assertThat(event.getAggregateType()).isEqualTo("ContactMessage");
    assertThat(event.getEventType()).isEqualTo("ContactMessageCreated");
    assertThat(event.getPublishedAt()).isNull();
    assertThat(JsonPath.<String>read(event.getPayload(), "$.subject")).isEqualTo("Outbox subject");
    assertThat(JsonPath.<String>read(event.getPayload(), "$.messageId")).isEqualTo(messageId);
    assertThat(JsonPath.<String>read(event.getPayload(), "$.authorEmail")).contains("@");
  }

  @Test
  void anEventIsNotStoredWhenTheTransactionFails() {
    UUID aggregateId = UUID.randomUUID();

    assertThatThrownBy(
            () ->
                transactions.executeWithoutResult(
                    status -> {
                      outbox.record("ContactMessage", aggregateId, "ContactMessageCreated", "{}");
                      throw new IllegalStateException("the work after the event failed");
                    }))
        .isInstanceOf(IllegalStateException.class);

    assertThat(events.findAll().stream().filter(e -> e.getAggregateId().equals(aggregateId)))
        .isEmpty();
  }

  @Test
  void publishingMarksEventsAndNeverSendsThemTwice() {
    String messageId = sendMessage("Published once");

    int firstRun = publisher.publishPending();
    int secondRun = publisher.publishPending();

    assertThat(firstRun).isEqualTo(1);
    assertThat(secondRun).isZero();
    assertThat(target.published()).hasSize(1);
    assertThat(eventsOf(messageId).get(0).getPublishedAt()).isNotNull();
  }

  private List<OutboxEvent> eventsOf(String aggregateId) {
    UUID id = UUID.fromString(aggregateId);
    return events.findAll().stream().filter(event -> event.getAggregateId().equals(id)).toList();
  }

  private String sendMessage(String subject) {
    String idToken =
        provider.idToken(
            UUID.randomUUID().toString(), UUID.randomUUID() + "@example.com", "Author");
    String token =
        api.post("/api/v1/auth/google", "{\"idToken\":\"" + idToken + "\"}").json("$.accessToken");
    return api.post(
            "/api/v1/contact-messages",
            "{\"subject\":\"%s\",\"message\":\"Body\"}".formatted(subject),
            token)
        .json("$.id");
  }
}
