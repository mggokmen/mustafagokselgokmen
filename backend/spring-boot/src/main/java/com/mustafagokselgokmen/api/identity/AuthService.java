package com.mustafagokselgokmen.api.identity;

import com.mustafagokselgokmen.api.generated.model.TokenResponse;
import com.mustafagokselgokmen.api.generated.model.UserResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Sign-in with Google, refresh token rotation and logout (ADR-003, ADR-006). */
@Service
@Transactional(readOnly = true)
class AuthService {

  private static final String TOKEN_TYPE = "Bearer";

  private final GoogleIdTokenVerifier googleIdTokens;
  private final UserService users;
  private final TokenService tokens;
  private final RefreshTokenRepository refreshTokens;
  private final Duration refreshTokenTtl;
  private final Clock clock;

  AuthService(
      GoogleIdTokenVerifier googleIdTokens,
      UserService users,
      TokenService tokens,
      RefreshTokenRepository refreshTokens,
      IdentityProperties properties,
      Clock clock) {
    this.googleIdTokens = googleIdTokens;
    this.users = users;
    this.tokens = tokens;
    this.refreshTokens = refreshTokens;
    this.refreshTokenTtl = properties.refreshTokenTtl();
    this.clock = clock;
  }

  @Transactional
  TokenResponse signInWithGoogle(String idToken) {
    User user = users.signIn(googleIdTokens.verify(idToken));
    return issueTokens(user, UUID.randomUUID());
  }

  /**
   * Rotates a refresh token. Presenting a token that was already rotated revokes its whole family,
   * because it means the token was copied. The revocation must be committed even though the request
   * fails, hence {@code noRollbackFor}.
   */
  @Transactional(noRollbackFor = InvalidTokenException.class)
  TokenResponse refresh(String refreshToken) {
    Instant now = clock.instant();
    RefreshToken current =
        refreshTokens
            .findByTokenHashForUpdate(TokenService.hash(refreshToken))
            .orElseThrow(() -> new InvalidTokenException("Unknown refresh token"));
    if (current.isRevoked()) {
      refreshTokens.revokeFamily(current.getFamilyId(), now);
      throw new InvalidTokenException("Refresh token was already used");
    }
    if (current.isExpired(now)) {
      throw new InvalidTokenException("Refresh token has expired");
    }
    current.revoke(now);
    return issueTokens(current.getUser(), current.getFamilyId());
  }

  /** Idempotent: an unknown or already revoked token is not an error. */
  @Transactional
  void logout(String refreshToken) {
    refreshTokens
        .findByTokenHashForUpdate(TokenService.hash(refreshToken))
        .ifPresent(token -> refreshTokens.revokeFamily(token.getFamilyId(), clock.instant()));
  }

  UserResponse currentUser(UUID userId) {
    return UserMapper.toResponse(users.get(userId));
  }

  private TokenResponse issueTokens(User user, UUID familyId) {
    String refreshToken = TokenService.newRefreshToken();
    refreshTokens.save(
        new RefreshToken(
            user,
            TokenService.hash(refreshToken),
            familyId,
            clock.instant().plus(refreshTokenTtl)));
    return new TokenResponse(
        tokens.issueAccessToken(user), refreshToken, TOKEN_TYPE, tokens.accessTokenTtlSeconds());
  }
}
