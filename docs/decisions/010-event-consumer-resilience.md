# ADR-010: Consumer resilience and idempotency

- Status: Accepted
- Date: 2026-09-24

## Context

[ADR-009](009-kafka-for-events.md) put events on Kafka and left the consumer side open. Delivery is
at least once: the API can publish the same event twice, and a consumer that fails mid-way reads
its records again after a restart or a rebalance. Notifying someone twice is a visible defect, so
the consumer has to decide what it has already done.

Failures also differ. A notification provider that times out will probably work in a minute. A
record with a missing header will never be readable, however often it is tried. Treating both the
same way either loses the first or blocks the partition with the second.

## Decision

### A separate service, with a database of its own

The consumer is a separate deployable, `backend/notification-service`, not a module inside the API.
It has its own database in the same PostgreSQL instance, with its own role, so it can't read the
API's tables even by accident. Contact messages reach it only as events.

### Idempotency by claiming the event id

Every event carries an `event-id` header. Before notifying, the consumer inserts that id into its
`processed_events` table:

```sql
INSERT INTO processed_events (id, ...) VALUES (:eventId, ...) ON CONFLICT (id) DO NOTHING
```

- A row inserted means this delivery claimed the event, and the notification is sent.
- No row inserted means the event was already handled, and the record is skipped.
- The claim and the notification share one transaction. If the notification fails, the claim is
  rolled back with it, so the retry starts from the beginning rather than skipping the work.

One statement rather than a check followed by an insert, so two deliveries can't both decide the
event is new.

### Retry, then a dead-letter topic

`DefaultErrorHandler` retries the record in place, with an exponential back-off, and hands it to a
`DeadLetterPublishingRecoverer` when the attempts run out. The dead-letter topic is the original
topic plus `.dlt`, for example `events.contact-message.dlt`, and the record keeps its key, its
headers and the details of the failure.

Failures that a retry cannot fix — a missing or malformed header, a body that is not the event it
claims to be — are `UnprocessableEventException` and are dead-lettered on the first attempt.

An event of a type this service doesn't react to is not a failure. It is skipped, and its offset is
committed.

## Alternatives considered

- **A consumer inside the API:** nothing new to deploy, but the notification work shares the API's
  process, its scaling and its restarts. That is precisely what [ADR-009](009-kafka-for-events.md)
  set out to separate.
- **Sharing the API's database:** convenient for a single developer, and exactly the coupling that
  makes services stop being services. A consumer that reads the publisher's tables is a second
  writer waiting to happen.
- **Idempotency by natural key** (for example "one notification per message id"): works for the
  first event about an aggregate and breaks as soon as a second event type arrives. The event id is
  the only value that identifies a delivery.
- **Infinite retries in place:** no record is ever lost, and one poisonous record stops its
  partition forever.
- **Discarding what fails:** the partition keeps moving, and the failure is invisible.

## Consequences

- The consumer has to be redeployed with its own migrations, and there is a second database to
  operate.
- `processed_events` grows. It can be pruned by age once the topic's retention has passed; nothing
  prunes it yet.
- What ends up on the dead-letter topic needs someone to look at it. There is no alert and no
  replay tool yet; the records wait on the topic.
- The notification itself is a log line today. Everything around it — consuming, claiming, retrying
  and dead-lettering — is real, so adding a provider is a change behind `NotificationSender`.
- Because the claim commits with the notification rather than after it, a provider that is called
  successfully but whose transaction then fails would be called again. With a log line that is
  harmless; a real provider needs its own idempotency key.
