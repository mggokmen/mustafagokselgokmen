# ADR-009: Kafka as the event broker

- Status: Accepted
- Date: 2026-09-24

## Context

[ADR-008](008-transactional-outbox.md) made events durable: they are written with the change that
produced them and published afterwards. The target so far writes a log line, which proves the
mechanism but delivers nothing.

The work that follows a contact message, notifying someone, should run outside the request, in its
own process, and it should survive the API restarting. More consumers may want the same events
later, and a consumer that fails needs somewhere for the message to wait.

## Decision

Apache Kafka is the broker, and `KafkaOutboxEventTarget` is the only place that knows it.

- **Topics:** one per aggregate type, `events.<aggregate-type>`, for example
  `events.contact-message`. The application declares its topics, so they exist with settings we
  chose rather than the broker's defaults.
- **Key:** the aggregate's id, so everything about one message stays ordered on one partition.
- **Headers:** `event-id`, `event-type` and `aggregate-type`, so a consumer can route and
  de-duplicate without parsing the body.
- **Producer:** `acks=all` with the idempotent producer, and the publisher waits for the
  acknowledgement, so a failed send leaves the event unpublished and the next run retries it.
- **Where it runs:** a single-node broker in the development stack and in tests (Testcontainers).
  The contract tests keep the log target, because they check the API, not the broker.

### Is Kafka necessary at this size?

Honestly, no. One application instance and one consumer could be served by the outbox plus an
in-process worker, which is why that is exactly what [ADR-008](008-transactional-outbox.md) built
first. Kafka is introduced for what it adds beyond that:

- the consumer becomes a **separate deployable**, which can fail, restart and scale on its own
- **more than one consumer** can read the same events independently
- events can be **replayed** from the log
- retry, dead-letter handling and idempotency have a real setting instead of a demonstration

The cost is one more container in every environment and more moving parts to operate. That
trade-off is accepted deliberately, and ADR-007's rule still holds: the next piece of
infrastructure needs its own reason.

## Alternatives considered

- **Outbox plus an in-process worker:** simplest, and enough today, but the notification work stays
  inside the API process and there is no replay.
- **RabbitMQ:** good at queueing and routing, but a consumed message is gone; there is no log to
  replay and no second consumer group reading the same history.
- **PostgreSQL `LISTEN`/`NOTIFY` or a job table:** ties every consumer to the database and spreads
  the schema across services.

## Consequences

- The development stack and the tests need a broker; the contract tests do not.
- Delivery stays **at least once** end to end, so the consumer must be idempotent. That is the next
  piece of work, together with retry and a dead-letter topic.
- A single broker in development means one replica per partition. A real deployment needs three.
- Events are JSON with no registry. If more consumers appear, a schema registry becomes a question
  of its own.
