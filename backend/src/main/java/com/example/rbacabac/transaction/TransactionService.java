package com.example.rbacabac.transaction;

import com.example.rbacabac.common.audit.AuditService;
import com.example.rbacabac.common.exception.BusinessException;
import com.example.rbacabac.common.exception.NotFoundException;
import com.example.rbacabac.security.UserPrincipal;
import com.example.rbacabac.transaction.dto.CreateTransactionRequest;
import com.example.rbacabac.transaction.dto.TransactionResponse;
import com.example.rbacabac.user.UserEntity;
import com.example.rbacabac.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TransactionResponse> findAll(Authentication authentication, Pageable pageable) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();

        if (user.hasPermission("TRANSACTION_VIEW_ALL")) {
            return transactionRepository.findAll(pageable).map(this::toResponse);
        }

        return transactionRepository.findByBranchCodeOrCreatedBy(
                user.getBranchCode(), user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public TransactionResponse findById(UUID id) {
        return transactionRepository.findByIdWithCreatedBy(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + id));
    }

    @Transactional
    public TransactionResponse create(Authentication authentication, CreateTransactionRequest request) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        UserEntity creator = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        String txNo = generateTransactionNo();
        TransactionEntity tx = TransactionEntity.builder()
                .transactionNo(txNo)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .branchCode(creator.getBranchCode())
                .department(request.getDepartment() != null ? request.getDepartment() : creator.getDepartment())
                .status(TransactionStatus.PENDING_APPROVAL)
                .createdBy(creator)
                .build();

        TransactionEntity saved = transactionRepository.save(tx);
        auditService.log(principal.getId(), "CREATE_TRANSACTION", "TRANSACTION",
                saved.getId().toString(), "ALLOW", null);

        return toResponse(saved);
    }

    @Transactional
    public TransactionResponse approve(Authentication authentication, UUID id) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + id));

        if (tx.getStatus() != TransactionStatus.PENDING_APPROVAL) {
            throw new BusinessException("Transaction is not in PENDING_APPROVAL status");
        }

        UserEntity approver = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        tx.setStatus(TransactionStatus.APPROVED);
        tx.setApprovedBy(approver);
        tx.setApprovedAt(LocalDateTime.now());

        TransactionEntity saved = transactionRepository.save(tx);
        auditService.log(principal.getId(), "APPROVE_TRANSACTION", "TRANSACTION",
                id.toString(), "ALLOW", null);

        return toResponse(saved);
    }

    @Transactional
    public TransactionResponse reject(Authentication authentication, UUID id) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findByIdWithCreatedBy(id)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + id));

        if (tx.getStatus() != TransactionStatus.PENDING_APPROVAL) {
            throw new BusinessException("Transaction is not in PENDING_APPROVAL status");
        }

        UserEntity rejector = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        tx.setStatus(TransactionStatus.REJECTED);
        tx.setApprovedBy(rejector);
        tx.setApprovedAt(LocalDateTime.now());

        TransactionEntity saved = transactionRepository.save(tx);
        auditService.log(principal.getId(), "REJECT_TRANSACTION", "TRANSACTION",
                id.toString(), "ALLOW", null);

        return toResponse(saved);
    }

    private String generateTransactionNo() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "TX" + timestamp + String.format("%04d", (int) (Math.random() * 10000));
    }

    private TransactionResponse toResponse(TransactionEntity tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .transactionNo(tx.getTransactionNo())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .branchCode(tx.getBranchCode())
                .department(tx.getDepartment())
                .status(tx.getStatus().name())
                .createdById(tx.getCreatedBy().getId())
                .createdByUsername(tx.getCreatedBy().getUsername())
                .approvedById(tx.getApprovedBy() != null ? tx.getApprovedBy().getId() : null)
                .approvedByUsername(tx.getApprovedBy() != null ? tx.getApprovedBy().getUsername() : null)
                .createdAt(tx.getCreatedAt())
                .approvedAt(tx.getApprovedAt())
                .build();
    }
}
