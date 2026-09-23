-- Events written in the same transaction as the change that produced them (ADR-008).
CREATE TABLE outbox_events (
    id             uuid        NOT NULL,
    aggregate_type varchar(64) NOT NULL,
    aggregate_id   uuid        NOT NULL,
    event_type     varchar(64) NOT NULL,
    payload        jsonb       NOT NULL,
    published_at   timestamptz,
    created_at     timestamptz NOT NULL,
    updated_at     timestamptz NOT NULL,
    CONSTRAINT pk_outbox_events PRIMARY KEY (id)
);

-- The publisher reads unpublished events, oldest first. A partial index keeps it small: once an
-- event is published it leaves the index.
CREATE INDEX ix_outbox_events_unpublished
    ON outbox_events (created_at)
    WHERE published_at IS NULL;

-- Finding every event of one aggregate, for support questions and debugging.
CREATE INDEX ix_outbox_events_aggregate_id ON outbox_events (aggregate_id);
