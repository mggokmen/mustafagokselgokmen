# Notification Service Standard (`backend/notification-service/`)

This service consumes the events the API publishes and notifies on them. It has no HTTP API of its
own; the only endpoint is the actuator health check. The reasoning behind its shape is in
[ADR-010](../decisions/010-event-consumer-resilience.md).

## Stack

- Java 21, built with the Maven wrapper (`./mvnw`). Maven coordinates:
  `com.mustafagokselgokmen:notification`.
- Spring Boot 4.x, the same version as the API
- Spring for Apache Kafka
- Spring Data JPA (Hibernate), PostgreSQL, Flyway
- Spring Boot Actuator, used for the health check
- No Lombok, no Spring Security: nothing here is exposed to the internet.

## Package layout

```
src/main/java/com/mustafagokselgokmen/notification/
├── contact/                             contact message events
│   ├── ContactMessageEventListener.java @KafkaListener on events.contact-message
│   ├── ContactMessageNotifier.java      claims the event and notifies, in one transaction
│   ├── ContactMessageCreated.java       the published form of the event
│   ├── NotificationSender.java          where a notification goes
│   └── LoggingNotificationSender.java   the implementation for now
└── common/
    ├── events/                          EventHeaders, ProcessedEvents, KafkaConsumerConfig,
    │                                    ConsumerProperties, UnprocessableEventException
    └── config/                          ClockConfiguration
```

The listener is the adapter: it maps a record onto one service call, the way a controller maps a
request. Rules and the transaction boundary live in the service.

## Consuming

- **One listener per aggregate type,** on `events.<aggregate-type>`, in the consumer group
  `notification`.
- **Offsets** are committed by the container after the listener returns. A listener that throws
  doesn't commit; the error handler decides what happens next.
- **`auto-offset-reset: earliest`,** so a first deployment reads the events already on the topic
  rather than only what comes after it.
- **The headers are the contract as much as the body is.** `event-id`, `event-type` and
  `aggregate-type` are read before the payload, and a record without them is unprocessable.
- **Unknown fields in the payload are ignored,** so the API can add one without this service being
  redeployed first.
- **An event of a type this service doesn't handle is skipped,** not failed.

## Idempotency

Delivery is at least once, so every event is claimed before it is handled:

| Step | Effect |
|---|---|
| `INSERT ... ON CONFLICT (id) DO NOTHING`, where `id` is the event's id | 1 row: this delivery claimed the event. 0 rows: it was handled before. |
| Notification | Sent only by the delivery that claimed the event |
| Transaction | Claim and notification commit together, or neither does |

Never check-then-insert: the claim has to be one statement.

The notification happens inside that transaction because it is local work. A sender that calls an
external provider has to move outside it and bring its own idempotency key
([database.md](../database.md#transactions)).

## Failures

| Failure | Handling |
|---|---|
| Something that may recover, such as a provider being down | Retried in place with an exponential back-off, `app.consumer.retry.*` |
| `UnprocessableEventException`: a missing header, a body that isn't the event | Dead-lettered on the first attempt |
| Attempts exhausted | Published to `<topic>.dlt` with the key, the headers and the failure |

A `NotificationSender` reports failure by throwing. Swallowing an error would commit the claim and
lose the notification for good.

## Configuration

| Variable | Meaning |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | This service's own database. It never points at the API's. |
| `KAFKA_BOOTSTRAP_SERVERS` | The broker |
| `KAFKA_CONSUMER_GROUP` | Consumer group, `notification` by default |
| `CONSUMER_MAX_ATTEMPTS` | Attempts before a record is dead-lettered, including the first |
| `SERVER_PORT` | Health endpoint port, 8081 by default |

## Database

Its own database, created next to the API's by
[`docker/postgres/init/create-databases.sh`](../../docker/postgres/init/create-databases.sh) when
the data volume is empty. An existing local stack picks it up after `docker compose down -v`.

Migrations are Flyway, with the same rules as the API ([database.md](../database.md)):

| Migration | Table |
|---|---|
| `V1__create_processed_events.sql` | `processed_events`: the events already handled |

## Build and run

| Task | Command |
|---|---|
| Build and test | `cd backend/notification-service && ./mvnw verify` |
| Format | `cd backend/notification-service && ./mvnw spotless:apply` |
| Run from source | `docker compose up -d postgres kafka`, then `./mvnw spring-boot:run` |
| Run in the stack | `docker compose up --build` |

Health: `http://localhost:8081/actuator/health`.

## Tests

The tests run against PostgreSQL and a Kafka broker in Testcontainers, and publish records exactly
as the API does. They cover:

- an event is notified, and recorded as handled
- the same event delivered twice is notified once
- an event of another type is ignored
- a record without an `event-id` header, and one whose body can't be read, are dead-lettered
  without a retry
- a notification that keeps failing is retried the configured number of times, is then
  dead-lettered, and leaves nothing recorded as handled, so it can be replayed

`NotificationSender` is the seam: the tests inject one that records what it was asked to send and
fails on demand.
