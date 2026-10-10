package com.mustafagokselgokmen.api.identity;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

  /**
   * Locks the row, so two concurrent refreshes with the same token are serialized: the second one
   * sees a revoked token and is treated as reuse.
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from RefreshToken t where t.tokenHash = :tokenHash")
  Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

  @Modifying(flushAutomatically = true)
  @Query(
      """
      update RefreshToken t set t.revokedAt = :now, t.updatedAt = :now
      where t.familyId = :familyId and t.revokedAt is null
      """)
  int revokeFamily(@Param("familyId") UUID familyId, @Param("now") Instant now);
}
