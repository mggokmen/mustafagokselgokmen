package com.mustafagokselgokmen.notification.common.events;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** An event this service has already handled. Written once, never updated. */
@Entity
@Table(name = "processed_events")
public class ProcessedEvent {

  /** The publisher's event id. */
  @Id
  @Column(name = "id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "event_type", nullable = false, updatable = false)
  private String eventType;

  @Column(name = "aggregate_id", nullable = false, updatable = false)
  private UUID aggregateId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ProcessedEvent() {}

  public UUID getId() {
    return id;
  }

  public String getEventType() {
    return eventType;
  }

  public UUID getAggregateId() {
    return aggregateId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
