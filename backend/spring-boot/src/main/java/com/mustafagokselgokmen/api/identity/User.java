package com.mustafagokselgokmen.api.identity;

import com.mustafagokselgokmen.api.common.persistence.AuditedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/** A person who signed in with Google. Identified by the Google subject, never by email. */
@Entity
@Table(name = "users")
public class User extends AuditedEntity {

  private static final int MAX_NAME_LENGTH = 200;
  private static final int MAX_AVATAR_URL_LENGTH = 2048;

  @Column(name = "google_subject", nullable = false, updatable = false)
  private String googleSubject;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false)
  private String name;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  protected User() {}

  User(GoogleIdentity identity) {
    this.googleSubject = identity.subject();
    this.role = Role.USER;
    updateProfile(identity);
  }

  /** Profile data comes from Google on every sign-in; a missing name falls back to the email. */
  void updateProfile(GoogleIdentity identity) {
    this.email = identity.email();
    String displayName = identity.name() == null ? "" : identity.name().strip();
    this.name =
        displayName.isEmpty()
            ? identity.email()
            : displayName.substring(0, Math.min(displayName.length(), MAX_NAME_LENGTH));
    String picture = identity.pictureUrl();
    this.avatarUrl =
        picture != null && picture.length() <= MAX_AVATAR_URL_LENGTH && !picture.isBlank()
            ? picture
            : null;
  }

  void assignRole(Role role) {
    this.role = role;
  }

  public String getGoogleSubject() {
    return googleSubject;
  }

  public String getEmail() {
    return email;
  }

  public String getName() {
    return name;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public Role getRole() {
    return role;
  }
}
