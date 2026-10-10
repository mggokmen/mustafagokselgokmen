# ADR-008: Transactional outbox for domain events

- Status: Accepted
- Date: 2026-09-23

## Context

Sending a contact message will trigger work outside the request: a notification today, possibly
more later. That work must happen exactly when the message is really stored, and not happen when
the transaction rolls back.

Writing to the database and publishing to a broker are two systems. Doing both in one request
without care produces the classic dual-write problem: the message is stored but the event is lost,
or the event is published for a message that was never stored.

## Decision

Events are written to an `outbox_events` table in the **same transaction** as the change that
produced them, and published afterwards.

- `OutboxWriter.record(...)` requires an existing transaction (`Propagation.MANDATORY`), so an
  event can't be recorded outside the change it belongs to.
- `OutboxPublisher` polls for unpublished events, hands them to an `OutboxEventTarget` and marks
  them published, all in one transaction. A failure leaves the batch unpublished and the next run
  retries it.
- The batch is locked with `FOR UPDATE SKIP LOCKED`, so several instances can publish without
  sending the same event twice.
- `OutboxEventTarget` is the only place that knows where events go. Today it writes a log line;
  a broker replaces that implementation without touching the outbox.

## Alternatives considered

- **Publishing after commit** (`@TransactionalEventListener(AFTER_COMMIT)`): the event is lost if
  the process stops between the commit and the publish.
- **Writing to the broker inside the transaction:** the broker is not part of the database
  transaction, so a rollback can't take the event back, and a broker outage fails a request that
  should have succeeded.
- **Change data capture (Debezium):** it removes the poller, but adds a connector, its own
  deployment and its own failure modes. The outbox table is enough at this size.

## Consequences

- **Delivery is at least once.** A crash between publishing and marking an event published causes
  a repeat, so consumers must be idempotent. That is a requirement for the notification consumer.
- **Order is per aggregate, not global.** Events are published oldest first, but two instances may
  publish concurrently.
- **Latency** is the poll interval, one second by default.
- **The table grows.** Published rows are kept for now, which makes debugging easy; a retention
  job becomes necessary before production.
- The business code depends on an interface, not on a broker, so introducing one is a change in a
  single class plus its own ADR.
