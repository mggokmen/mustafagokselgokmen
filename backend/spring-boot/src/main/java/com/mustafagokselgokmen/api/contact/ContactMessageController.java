package com.mustafagokselgokmen.api.contact;

import com.mustafagokselgokmen.api.generated.ContactMessagesApi;
import com.mustafagokselgokmen.api.generated.model.ContactMessagePage;
import com.mustafagokselgokmen.api.generated.model.ContactMessageResponse;
import com.mustafagokselgokmen.api.generated.model.CreateContactMessageRequest;
import com.mustafagokselgokmen.api.generated.model.UpdateContactMessageStatusRequest;
import java.net.URI;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class ContactMessageController implements ContactMessagesApi {

  private final ContactMessageService contactMessages;

  ContactMessageController(ContactMessageService contactMessages) {
    this.contactMessages = contactMessages;
  }

  @Override
  public ResponseEntity<ContactMessageResponse> createContactMessage(
      CreateContactMessageRequest createContactMessageRequest) {
    ContactMessageResponse created = contactMessages.create(createContactMessageRequest);
    return ResponseEntity.created(URI.create("/api/v1/contact-messages/" + created.getId()))
        .body(created);
  }

  @Override
  public ResponseEntity<ContactMessagePage> listContactMessages(
      Integer page,
      Integer size,
      String sort,
      List<com.mustafagokselgokmen.api.generated.model.ContactMessageStatus> status,
      String q) {
    // An empty "?status=" carries no value: it means no filter, not a filter on nothing.
    List<ContactMessageStatus> statuses =
        status == null
            ? null
            : status.stream()
                .filter(Objects::nonNull)
                .map(value -> ContactMessageStatus.valueOf(value.getValue()))
                .toList();
    return ResponseEntity.ok(contactMessages.list(page, size, sort, statuses, q));
  }

  @Override
  public ResponseEntity<ContactMessageResponse> getContactMessage(UUID contactMessageId) {
    return ResponseEntity.ok(contactMessages.get(contactMessageId));
  }

  @Override
  public ResponseEntity<ContactMessageResponse> updateContactMessageStatus(
      UUID contactMessageId, UpdateContactMessageStatusRequest updateContactMessageStatusRequest) {
    return ResponseEntity.ok(
        contactMessages.updateStatus(contactMessageId, updateContactMessageStatusRequest));
  }
}
