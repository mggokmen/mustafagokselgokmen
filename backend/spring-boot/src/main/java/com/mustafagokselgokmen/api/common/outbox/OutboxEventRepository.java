package com.mustafagokselgokmen.api.common.outbox;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

  /**
   * The next events to publish, locked for this transaction. {@code SKIP LOCKED} means a second
   * publisher takes the following rows instead of waiting, so more than one instance can publish
   * without sending an event twice. Native because the locking clause is PostgreSQL's.
   */
  @Query(
      value =
          """
          select * from outbox_events
          where published_at is null
          order by created_at
          limit :batchSize
          for update skip locked
          """,
      nativeQuery = true)
  List<OutboxEvent> lockUnpublishedBatch(@Param("batchSize") int batchSize);
}
