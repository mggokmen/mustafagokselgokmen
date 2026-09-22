package com.mustafagokselgokmen.api.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByGoogleSubject(String googleSubject);
}
