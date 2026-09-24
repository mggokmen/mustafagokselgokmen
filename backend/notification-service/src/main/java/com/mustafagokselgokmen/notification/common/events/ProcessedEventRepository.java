package com.mustafagokselgokmen.notification.common.events;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, UUID> {

  /**
   * Claims an event in a single statement, so a second delivery can't slip between a check and an
   * insert.
   *
   * @return 1 when this call claimed the event, 0 when it was already claimed
   */
  @Modifying
  @Query(
      value =
          """
          INSERT INTO processed_events (id, event_type, aggregate_id, created_at, updated_at)
          VALUES (:eventId, :eventType, :aggregateId, :now, :now)
          ON CONFLICT (id) DO NOTHING
          """,
      nativeQuery = true)
  int insertIfAbsent(
      @Param("eventId") UUID eventId,
      @Param("eventType") String eventType,
      @Param("aggregateId") UUID aggregateId,
      @Param("now") Instant now);
}
