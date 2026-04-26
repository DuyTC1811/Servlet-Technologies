package com.example.rbacabac.policy;

import com.example.rbacabac.common.audit.AuditService;
import com.example.rbacabac.common.exception.NotFoundException;
import com.example.rbacabac.permission.PermissionEntity;
import com.example.rbacabac.role.RoleEntity;
import com.example.rbacabac.security.UserPrincipal;
import com.example.rbacabac.transaction.TransactionEntity;
import com.example.rbacabac.transaction.TransactionRepository;
import com.example.rbacabac.transaction.TransactionStatus;
import com.example.rbacabac.user.UserEntity;
import com.example.rbacabac.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionPolicyService ABAC Tests")
class TransactionPolicyServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TransactionPolicyService policyService;

    private UUID checkerId;
    private UUID makerId;
    private UUID transactionId;
    private UserPrincipal checkerPrincipal;
    private TransactionEntity transaction;

    @BeforeEach
    void setUp() {
        checkerId = UUID.randomUUID();
        makerId = UUID.randomUUID();
        transactionId = UUID.randomUUID();

        checkerPrincipal = buildPrincipal(checkerId, "checker01", "HN001",
                new BigDecimal("500000000"), "TRANSACTION_APPROVE", "TRANSACTION_VIEW");

        UserEntity maker = buildUserEntity(makerId, "maker01", "HN001", null);

        transaction = TransactionEntity.builder()
                .id(transactionId)
                .transactionNo("TX001")
                .amount(new BigDecimal("100000000"))
                .branchCode("HN001")
                .status(TransactionStatus.PENDING_APPROVAL)
                .createdBy(maker)
                .build();
    }

    @Nested
    @DisplayName("canApprove ABAC checks")
    class CanApproveTests {

        @Test
        @DisplayName("ALLOW: same branch, not creator, amount within limit, PENDING_APPROVAL")
        void shouldAllowApproval_whenAllConditionsMet() {
            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canApprove(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isTrue();
            verify(auditService, never()).logDenied(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("DENY: different branch")
        void shouldDenyApproval_whenDifferentBranch() {
            transaction = transactionBuilder(makerId, "TX001", "HCM001",
                    new BigDecimal("100000000"), TransactionStatus.PENDING_APPROVAL);

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canApprove(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isFalse();
            verify(auditService).logDenied(eq(checkerId), eq("TRANSACTION_APPROVE"),
                    eq("TRANSACTION"), any(), contains("branch"));
        }

        @Test
        @DisplayName("DENY: checker is the creator")
        void shouldDenyApproval_whenCheckerIsCreator() {
            transaction = transactionBuilder(checkerId, "TX001", "HN001",
                    new BigDecimal("100000000"), TransactionStatus.PENDING_APPROVAL);

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canApprove(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isFalse();
            verify(auditService).logDenied(eq(checkerId), eq("TRANSACTION_APPROVE"),
                    eq("TRANSACTION"), any(), contains("own"));
        }

        @Test
        @DisplayName("DENY: amount exceeds approval limit")
        void shouldDenyApproval_whenAmountExceedsLimit() {
            transaction = transactionBuilder(makerId, "TX001", "HN001",
                    new BigDecimal("600000000"), TransactionStatus.PENDING_APPROVAL);

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canApprove(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isFalse();
            verify(auditService).logDenied(eq(checkerId), eq("TRANSACTION_APPROVE"),
                    eq("TRANSACTION"), any(), contains("limit"));
        }

        @Test
        @DisplayName("DENY: transaction not in PENDING_APPROVAL status")
        void shouldDenyApproval_whenTransactionAlreadyApproved() {
            transaction.setStatus(TransactionStatus.APPROVED);

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canApprove(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isFalse();
            verify(auditService).logDenied(eq(checkerId), eq("TRANSACTION_APPROVE"),
                    eq("TRANSACTION"), any(), contains("PENDING_APPROVAL"));
        }

        @Test
        @DisplayName("throws NotFoundException when transaction does not exist")
        void shouldThrowNotFound_whenTransactionDoesNotExist() {
            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> policyService.canApprove(buildAuth(checkerPrincipal), transactionId))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("canView ABAC checks")
    class CanViewTests {

        @Test
        @DisplayName("ALLOW: user in same branch")
        void shouldAllowView_whenSameBranch() {
            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canView(buildAuth(checkerPrincipal), transactionId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("ALLOW: user is the creator even if different branch")
        void shouldAllowView_whenUserIsCreator() {
            UserPrincipal makerPrincipal = buildPrincipal(makerId, "maker01", "OTHER_BRANCH",
                    null, "TRANSACTION_VIEW");

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canView(buildAuth(makerPrincipal), transactionId);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("DENY: different branch and not creator")
        void shouldDenyView_whenDifferentBranchAndNotCreator() {
            UUID otherId = UUID.randomUUID();
            UserPrincipal otherPrincipal = buildPrincipal(otherId, "other", "HCM001",
                    null, "TRANSACTION_VIEW");

            when(transactionRepository.findByIdWithCreatedBy(transactionId))
                    .thenReturn(Optional.of(transaction));

            boolean result = policyService.canView(buildAuth(otherPrincipal), transactionId);

            assertThat(result).isFalse();
        }
    }

    // Helpers

    private UserPrincipal buildPrincipal(UUID id, String username, String branchCode,
                                          BigDecimal approvalLimit, String... permCodes) {
        PermissionEntity[] permissions = java.util.Arrays.stream(permCodes)
                .map(code -> PermissionEntity.builder()
                        .id(UUID.randomUUID())
                        .code(code)
                        .name(code)
                        .resource("TRANSACTION")
                        .action(code)
                        .build())
                .toArray(PermissionEntity[]::new);

        RoleEntity role = RoleEntity.builder()
                .id(UUID.randomUUID())
                .code("TEST_ROLE")
                .name("Test Role")
                .permissions(Set.of(permissions))
                .build();

        UserEntity user = buildUserEntity(id, username, branchCode, approvalLimit);
        user.getRoles().add(role);

        return UserPrincipal.from(user);
    }

    private UserEntity buildUserEntity(UUID id, String username, String branchCode,
                                        BigDecimal approvalLimit) {
        return UserEntity.builder()
                .id(id)
                .username(username)
                .password("encoded")
                .branchCode(branchCode)
                .approvalLimit(approvalLimit)
                .status(UserStatus.ACTIVE)
                .build();
    }

    private TransactionEntity transactionBuilder(UUID creatorId, String txNo, String branchCode,
                                                   BigDecimal amount, TransactionStatus status) {
        return TransactionEntity.builder()
                .id(transactionId)
                .transactionNo(txNo)
                .amount(amount)
                .branchCode(branchCode)
                .status(status)
                .createdBy(buildUserEntity(creatorId, "user", branchCode, null))
                .build();
    }

    private Authentication buildAuth(UserPrincipal principal) {
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }
}
