package com.example.rbacabac.policy;

import com.example.rbacabac.common.audit.AuditService;
import com.example.rbacabac.common.exception.NotFoundException;
import com.example.rbacabac.security.UserPrincipal;
import com.example.rbacabac.transaction.TransactionEntity;
import com.example.rbacabac.transaction.TransactionRepository;
import com.example.rbacabac.transaction.TransactionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service("transactionPolicyService")
@RequiredArgsConstructor
public class TransactionPolicyService {

    private final TransactionRepository transactionRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public boolean canView(Authentication authentication, UUID transactionId) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findByIdWithCreatedBy(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + transactionId));

        if (user.hasPermission("TRANSACTION_VIEW_ALL")) {
            return true;
        }

        boolean allowed = user.getBranchCode() != null && user.getBranchCode().equals(tx.getBranchCode())
                || user.getId().equals(tx.getCreatedBy().getId());

        if (!allowed) {
            auditService.logDenied(user.getId(), "TRANSACTION_VIEW", "TRANSACTION",
                    transactionId.toString(), "Different branch and not owner");
        }

        return allowed;
    }

    @Transactional(readOnly = true)
    public boolean canApprove(Authentication authentication, UUID transactionId) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findByIdWithCreatedBy(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found: " + transactionId));

        String denyReason = evaluateApprovalPolicy(user, tx);

        if (denyReason != null) {
            auditService.logDenied(user.getId(), "TRANSACTION_APPROVE", "TRANSACTION",
                    transactionId.toString(), denyReason);
            log.warn("ABAC DENIED: user=[{}] action=[APPROVE] tx=[{}] reason=[{}]",
                    user.getUsername(), transactionId, denyReason);
            return false;
        }

        return true;
    }

    private String evaluateApprovalPolicy(UserPrincipal user, TransactionEntity tx) {
        if (tx.getStatus() != TransactionStatus.PENDING_APPROVAL) {
            return "Transaction status is not PENDING_APPROVAL";
        }
        if (user.getBranchCode() == null || !user.getBranchCode().equals(tx.getBranchCode())) {
            return "User branch does not match transaction branch";
        }
        if (user.getId().equals(tx.getCreatedBy().getId())) {
            return "User cannot approve their own transaction";
        }
        if (user.getApprovalLimit() == null || tx.getAmount().compareTo(user.getApprovalLimit()) > 0) {
            return "Transaction amount exceeds user approval limit";
        }
        return null;
    }
}
