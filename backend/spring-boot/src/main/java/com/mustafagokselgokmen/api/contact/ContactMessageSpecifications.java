package com.mustafagokselgokmen.api.contact;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/** Filters applied in the query, never in memory (docs/backend/spring-boot.md#layer-rules). */
final class ContactMessageSpecifications {

  private ContactMessageSpecifications() {}

  /** Restricts the result to one author. A USER only ever sees their own messages. */
  static Specification<ContactMessage> authoredBy(UUID authorId) {
    return (root, query, builder) -> builder.equal(root.get("author").get("id"), authorId);
  }

  static Specification<ContactMessage> hasStatusIn(List<ContactMessageStatus> statuses) {
    return (root, query, builder) -> root.get("status").in(statuses);
  }

  /** Case-insensitive "contains" on the subject. */
  static Specification<ContactMessage> subjectContains(String text) {
    String pattern = "%" + text.toLowerCase(Locale.ROOT) + "%";
    return (root, query, builder) -> builder.like(builder.lower(root.get("subject")), pattern);
  }
}
