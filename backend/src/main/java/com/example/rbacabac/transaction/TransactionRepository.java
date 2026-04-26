package com.example.rbacabac.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity, UUID> {

    boolean existsByTransactionNo(String transactionNo);

    @Query("SELECT t FROM TransactionEntity t JOIN FETCH t.createdBy WHERE t.id = :id")
    Optional<TransactionEntity> findByIdWithCreatedBy(UUID id);

    @Query("SELECT t FROM TransactionEntity t WHERE t.branchCode = :branchCode OR t.createdBy.id = :userId")
    Page<TransactionEntity> findByBranchCodeOrCreatedBy(String branchCode, UUID userId, Pageable pageable);

    Page<TransactionEntity> findAll(Pageable pageable);
}
