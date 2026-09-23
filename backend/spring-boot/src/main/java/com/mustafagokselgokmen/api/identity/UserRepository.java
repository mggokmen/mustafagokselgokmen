package com.mustafagokselgokmen.api.identity;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByGoogleSubject(String googleSubject);

  /**
   * Serializes concurrent first sign-ins of the same person. Without it, two requests both find no
   * user and both insert one, and the second fails on the unique index. The lock is released when
   * the transaction ends. Native because it is a PostgreSQL function.
   */
  @Query(value = "select pg_advisory_xact_lock(:key)", nativeQuery = true)
  void lockSignIn(@Param("key") long key);
}
