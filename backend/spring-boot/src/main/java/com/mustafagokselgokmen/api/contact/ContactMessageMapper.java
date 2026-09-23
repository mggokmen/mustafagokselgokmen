package com.mustafagokselgokmen.api.contact;

import com.mustafagokselgokmen.api.generated.model.ContactMessagePage;
import com.mustafagokselgokmen.api.generated.model.ContactMessageResponse;
import com.mustafagokselgokmen.api.generated.model.UserSummary;
import com.mustafagokselgokmen.api.identity.User;
import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.data.domain.Page;

final class ContactMessageMapper {

  private ContactMessageMapper() {}

  static ContactMessageResponse toResponse(ContactMessage message) {
    return new ContactMessageResponse(
        message.getId(),
        message.getSubject(),
        message.getMessage(),
        com.mustafagokselgokmen.api.generated.model.ContactMessageStatus.valueOf(
            message.getStatus().name()),
        toSummary(message.getAuthor()),
        message.getVersion(),
        atUtc(message.getCreatedAt()),
        atUtc(message.getUpdatedAt()));
  }

  static ContactMessagePage toPage(Page<ContactMessage> page) {
    List<ContactMessageResponse> items =
        page.getContent().stream().map(ContactMessageMapper::toResponse).toList();
    return new ContactMessagePage(
        items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  static ContactMessagePage emptyPage(int page, int size, long totalItems) {
    int totalPages = (int) Math.ceil((double) totalItems / size);
    return new ContactMessagePage(List.of(), page, size, totalItems, totalPages);
  }

  private static UserSummary toSummary(User author) {
    return new UserSummary(author.getId(), author.getEmail(), author.getName())
        .avatarUrl(author.getAvatarUrl() == null ? null : URI.create(author.getAvatarUrl()));
  }

  private static OffsetDateTime atUtc(Instant instant) {
    return instant.atOffset(ZoneOffset.UTC);
  }
}
