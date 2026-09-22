package com.mustafagokselgokmen.api.identity;

import com.mustafagokselgokmen.api.generated.model.UserResponse;
import java.net.URI;

final class UserMapper {

  private UserMapper() {}

  static UserResponse toResponse(User user) {
    return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            com.mustafagokselgokmen.api.generated.model.Role.valueOf(user.getRole().name()))
        .avatarUrl(user.getAvatarUrl() == null ? null : URI.create(user.getAvatarUrl()));
  }
}
