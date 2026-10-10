package com.mustafagokselgokmen.api.contact;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ContactMessageRepository
    extends JpaRepository<ContactMessage, UUID>, JpaSpecificationExecutor<ContactMessage> {

  /** The author is part of every response, so it is loaded with the page instead of one by one. */
  @Override
  @EntityGraph(attributePaths = "author")
  Page<ContactMessage> findAll(Specification<ContactMessage> specification, Pageable pageable);
}
