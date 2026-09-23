package com.mustafagokselgokmen.api.identity;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

  private final UserRepository users;
  private final Set<String> adminEmails;

  UserService(UserRepository users, IdentityProperties properties) {
    this.users = users;
    this.adminEmails = Set.copyOf(properties.adminEmails());
  }

  /**
   * Creates the user on first sign-in, otherwise refreshes the profile. The role is re-evaluated on
   * every sign-in, so removing an email from ADMIN_EMAILS takes effect at the next sign-in.
   */
  @Transactional
  User signIn(GoogleIdentity identity) {
    users.lockSignIn(identity.subject().hashCode());
    User user =
        users
            .findByGoogleSubject(identity.subject())
            .map(
                existing -> {
                  existing.updateProfile(identity);
                  return existing;
                })
            .orElseGet(() -> new User(identity));
    boolean admin = adminEmails.contains(identity.email().toLowerCase(Locale.ROOT));
    user.assignRole(admin ? Role.ADMIN : Role.USER);
    return users.save(user);
  }

  /** Used by other bounded contexts that need the user of the current request. */
  public User get(UUID id) {
    return users.findById(id).orElseThrow(() -> new InvalidTokenException("User doesn't exist"));
  }
}
