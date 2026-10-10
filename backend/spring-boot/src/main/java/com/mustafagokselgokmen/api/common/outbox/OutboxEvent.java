package com.mustafagokselgokmen.api.common.outbox;

import com.mustafagokselgokmen.api.common.persistence.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * One event waiting to be published, written in the same transaction as the change it describes
 * (ADR-008).
 */
@Entity
@Table(name = "outbox_events")
public class OutboxEvent extends AuditedEntity {

  @Column(name = "aggregate_type", nullable = false, updatable = false)
  private String aggregateType;

  @Column(name = "aggregate_id", nullable = false, updatable = false)
  private UUID aggregateId;

  @Column(name = "event_type", nullable = false, updatable = false)
  private String eventType;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, updatable = false)
  private String payload;

  @Column(name = "published_at")
  private Instant publishedAt;

  protected OutboxEvent() {}

  OutboxEvent(String aggregateType, UUID aggregateId, String eventType, String payload) {
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.payload = payload;
  }

  void markPublished(Instant now) {
    if (publishedAt == null) {
      publishedAt = now;
    }
  }

  public String getAggregateType() {
    return aggregateType;
  }

  public UUID getAggregateId() {
    return aggregateId;
  }

  public String getEventType() {
    return eventType;
  }

  public String getPayload() {
    return payload;
  }

  public Instant getPublishedAt() {
    return publishedAt;
  }
}
