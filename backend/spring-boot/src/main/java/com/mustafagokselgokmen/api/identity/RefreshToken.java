package com.mustafagokselgokmen.api.identity;

import com.mustafagokselgokmen.api.common.persistence.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * One refresh token of a token family. Tokens are single use: refreshing revokes the presented
 * token and issues a new one in the same family (docs/security.md#api-tokens).
 */
@Entity
@Table(name = "refresh_tokens")
class RefreshToken extends AuditedEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, updatable = false)
  private User user;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "token_hash", length = 64, nullable = false, updatable = false)
  private String tokenHash;

  @Column(name = "family_id", nullable = false, updatable = false)
  private UUID familyId;

  @Column(name = "expires_at", nullable = false, updatable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  protected RefreshToken() {}

  RefreshToken(User user, String tokenHash, UUID familyId, Instant expiresAt) {
    this.user = user;
    this.tokenHash = tokenHash;
    this.familyId = familyId;
    this.expiresAt = expiresAt;
  }

  boolean isRevoked() {
    return revokedAt != null;
  }

  boolean isExpired(Instant now) {
    return !now.isBefore(expiresAt);
  }

  void revoke(Instant now) {
    if (revokedAt == null) {
      revokedAt = now;
    }
  }

  User getUser() {
    return user;
  }

  UUID getFamilyId() {
    return familyId;
  }
}
