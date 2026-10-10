package com.mustafagokselgokmen.api.contact;

import com.mustafagokselgokmen.api.common.error.NotFoundException;
import com.mustafagokselgokmen.api.common.outbox.OutboxWriter;
import com.mustafagokselgokmen.api.common.ratelimit.RateLimiter;
import com.mustafagokselgokmen.api.common.ratelimit.RateLimiter.LimitName;
import com.mustafagokselgokmen.api.generated.model.ContactMessagePage;
import com.mustafagokselgokmen.api.generated.model.ContactMessageResponse;
import com.mustafagokselgokmen.api.generated.model.CreateContactMessageRequest;
import com.mustafagokselgokmen.api.generated.model.UpdateContactMessageStatusRequest;
import com.mustafagokselgokmen.api.identity.AuthenticatedUser;
import com.mustafagokselgokmen.api.identity.User;
import com.mustafagokselgokmen.api.identity.UserService;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
class ContactMessageService {

  private static final String AGGREGATE_TYPE = "ContactMessage";

  private final ContactMessageRepository messages;
  private final UserService users;
  private final RateLimiter rateLimiter;
  private final OutboxWriter outbox;

  ContactMessageService(
      ContactMessageRepository messages,
      UserService users,
      RateLimiter rateLimiter,
      OutboxWriter outbox) {
    this.messages = messages;
    this.users = users;
    this.rateLimiter = rateLimiter;
    this.outbox = outbox;
  }

  @Transactional
  ContactMessageResponse create(CreateContactMessageRequest request) {
    UUID authorId = AuthenticatedUser.id();
    rateLimiter.consume(LimitName.CONTACT_MESSAGE, authorId.toString());
    User author = users.get(authorId);
    ContactMessage message =
        messages.save(
            new ContactMessage(
                author,
                ContactMessageText.storable(request.getSubject()),
                ContactMessageText.storable(request.getMessage())));
    // Same transaction as the message: either both are stored, or neither is (ADR-008).
    outbox.record(
        AGGREGATE_TYPE,
        message.getId(),
        "ContactMessageCreated",
        new ContactMessageCreated(
            message.getId(),
            author.getId(),
            author.getEmail(),
            message.getSubject(),
            message.getCreatedAt()));
    return ContactMessageMapper.toResponse(message);
  }

  /** ADMIN sees every message; everyone else sees only their own. */
  ContactMessagePage list(
      int page, int size, String sort, List<ContactMessageStatus> statuses, String query) {
    Specification<ContactMessage> specification = Specification.unrestricted();
    if (!AuthenticatedUser.isAdmin()) {
      specification =
          specification.and(ContactMessageSpecifications.authoredBy(AuthenticatedUser.id()));
    }
    if (statuses != null && !statuses.isEmpty()) {
      specification = specification.and(ContactMessageSpecifications.hasStatusIn(statuses));
    }
    // The search text reaches the database too, so it gets the same treatment as stored text.
    String searchText = query == null ? "" : ContactMessageText.storable(query);
    if (!searchText.isEmpty()) {
      specification = specification.and(ContactMessageSpecifications.subjectContains(searchText));
    }
    if ((long) page * size > Integer.MAX_VALUE) {
      // Beyond what the database can address there are no rows; the totals still hold.
      return ContactMessageMapper.emptyPage(page, size, messages.count(specification));
    }
    return ContactMessageMapper.toPage(messages.findAll(specification, pageable(page, size, sort)));
  }

  ContactMessageResponse get(UUID messageId) {
    return ContactMessageMapper.toResponse(visible(messageId));
  }

  @Transactional
  @PreAuthorize("hasRole('ADMIN')")
  ContactMessageResponse updateStatus(UUID messageId, UpdateContactMessageStatusRequest request) {
    ContactMessage message = messages.findById(messageId).orElseThrow(() -> notFound(messageId));
    message.checkVersion(request.getVersion());
    message.changeStatus(ContactMessageStatus.valueOf(request.getStatus().getValue()));
    // Flush before mapping, so the response carries the version the client must send next.
    messages.flush();
    return ContactMessageMapper.toResponse(message);
  }

  /** A message of another user is answered with 404, not 403 (docs/api.md#authorization). */
  private ContactMessage visible(UUID messageId) {
    ContactMessage message = messages.findById(messageId).orElseThrow(() -> notFound(messageId));
    if (!AuthenticatedUser.isAdmin() && !message.getAuthorId().equals(AuthenticatedUser.id())) {
      throw notFound(messageId);
    }
    return message;
  }

  private static NotFoundException notFound(UUID messageId) {
    return new NotFoundException("No contact message with id " + messageId);
  }

  /** The sort parameter is validated by the contract; `id` keeps paging deterministic. */
  private static Pageable pageable(int page, int size, String sort) {
    String[] parts = sort.split(",", 2);
    Sort order =
        Sort.by(Sort.Direction.fromString(parts[1]), parts[0])
            .and(Sort.by(Sort.Direction.DESC, "id"));
    return PageRequest.of(page, size, order);
  }
}
