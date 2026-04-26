package com.example.rbacabac.transaction;

import com.example.rbacabac.common.response.ApiResponse;
import com.example.rbacabac.transaction.dto.CreateTransactionRequest;
import com.example.rbacabac.transaction.dto.TransactionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Transaction", description = "Transaction management APIs")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @Operation(summary = "List transactions (filtered by branch/ownership)")
    @GetMapping
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW')")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> list(
            Authentication authentication, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.findAll(authentication, pageable)));
    }

    @Operation(summary = "Get transaction by ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('TRANSACTION_VIEW') && @transactionPolicyService.canView(authentication, #id)")
    public ResponseEntity<ApiResponse<TransactionResponse>> getById(
            Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(transactionService.findById(id)));
    }

    @Operation(summary = "Create new transaction")
    @PostMapping
    @PreAuthorize("hasAuthority('TRANSACTION_CREATE')")
    public ResponseEntity<ApiResponse<TransactionResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction created successfully",
                        transactionService.create(authentication, request)));
    }

    @Operation(summary = "Approve transaction")
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('TRANSACTION_APPROVE') && @transactionPolicyService.canApprove(authentication, #id)")
    public ResponseEntity<ApiResponse<TransactionResponse>> approve(
            Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Transaction approved successfully",
                transactionService.approve(authentication, id)));
    }

    @Operation(summary = "Reject transaction")
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('TRANSACTION_REJECT') && @transactionPolicyService.canApprove(authentication, #id)")
    public ResponseEntity<ApiResponse<TransactionResponse>> reject(
            Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Transaction rejected successfully",
                transactionService.reject(authentication, id)));
    }
}
