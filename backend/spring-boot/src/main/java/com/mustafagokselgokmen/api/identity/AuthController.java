package com.mustafagokselgokmen.api.identity;

import com.mustafagokselgokmen.api.generated.AuthApi;
import com.mustafagokselgokmen.api.generated.model.GoogleLoginRequest;
import com.mustafagokselgokmen.api.generated.model.RefreshTokenRequest;
import com.mustafagokselgokmen.api.generated.model.TokenResponse;
import com.mustafagokselgokmen.api.generated.model.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthController implements AuthApi {

  private final AuthService auth;

  AuthController(AuthService auth) {
    this.auth = auth;
  }

  @Override
  public ResponseEntity<TokenResponse> loginWithGoogle(GoogleLoginRequest googleLoginRequest) {
    return ResponseEntity.ok(auth.signInWithGoogle(googleLoginRequest.getIdToken()));
  }

  @Override
  public ResponseEntity<TokenResponse> refreshToken(RefreshTokenRequest refreshTokenRequest) {
    return ResponseEntity.ok(auth.refresh(refreshTokenRequest.getRefreshToken()));
  }

  @Override
  public ResponseEntity<Void> logout(RefreshTokenRequest refreshTokenRequest) {
    auth.logout(refreshTokenRequest.getRefreshToken());
    return ResponseEntity.noContent().build();
  }

  @Override
  public ResponseEntity<UserResponse> getCurrentUser() {
    return ResponseEntity.ok(auth.currentUser(AuthenticatedUser.id()));
  }
}
