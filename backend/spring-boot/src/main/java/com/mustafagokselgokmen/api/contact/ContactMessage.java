package com.mustafagokselgokmen.api.contact;

import com.mustafagokselgokmen.api.common.error.ConflictException;
import com.mustafagokselgokmen.api.common.persistence.AuditedEntity;
import com.mustafagokselgokmen.api.identity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.UUID;

/**
 * A message sent through the contact form. Its subject and body never change after it is sent; only
 * the status moves through the workflow, and the entity enforces which moves are allowed.
 */
@Entity
@Table(name = "contact_messages")
public class ContactMessage extends AuditedEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, updatable = false)
  private User author;

  @Column(nullable = false, updatable = false)
  private String subject;

  @Column(nullable = false, updatable = false)
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ContactMessageStatus status;

  @Version
  @Column(nullable = false)
  private long version;

  protected ContactMessage() {}

  ContactMessage(User author, String subject, String message) {
    this.author = author;
    this.subject = subject;
    this.message = message;
    this.status = ContactMessageStatus.NEW;
  }

  /**
   * @throws ConflictException if the workflow doesn't allow the move
   */
  void changeStatus(ContactMessageStatus target) {
    if (!status.canTransitionTo(target)) {
      throw new ConflictException("A %s message cannot become %s".formatted(status, target));
    }
    this.status = target;
  }

  /**
   * @throws ConflictException if the caller worked from an older version of this message
   */
  void checkVersion(long expected) {
    if (version != expected) {
      throw new ConflictException(
          "The message was changed by someone else; reload it and try again");
    }
  }

  public User getAuthor() {
    return author;
  }

  public UUID getAuthorId() {
    return author.getId();
  }

  public String getSubject() {
    return subject;
  }

  public String getMessage() {
    return message;
  }

  public ContactMessageStatus getStatus() {
    return status;
  }

  public long getVersion() {
    return version;
  }
}
