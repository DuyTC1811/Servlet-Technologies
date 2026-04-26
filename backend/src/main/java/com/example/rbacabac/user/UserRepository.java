package com.example.rbacabac.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM UserEntity u JOIN FETCH u.roles r JOIN FETCH r.permissions WHERE u.username = :username")
    Optional<UserEntity> findByUsernameWithRolesAndPermissions(String username);
}
