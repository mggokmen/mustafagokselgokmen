-- Events this service has already handled. The consumer reads at least once, so the same event can
-- arrive again; this table is what makes handling it a second time a no-op (ADR-010).
CREATE TABLE processed_events (
    -- The publisher's event id, taken from the record's event-id header rather than generated here.
    id           uuid        NOT NULL,
    event_type   varchar(64) NOT NULL,
    aggregate_id uuid        NOT NULL,
    created_at   timestamptz NOT NULL,
    updated_at   timestamptz NOT NULL,
    CONSTRAINT pk_processed_events PRIMARY KEY (id)
);

-- Rows are pruned by age, once the topic's retention has passed.
CREATE INDEX ix_processed_events_created_at ON processed_events (created_at);
