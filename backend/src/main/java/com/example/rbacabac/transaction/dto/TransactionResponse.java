package com.example.rbacabac.transaction.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class TransactionResponse {
    private UUID id;
    private String transactionNo;
    private BigDecimal amount;
    private String currency;
    private String branchCode;
    private String department;
    private String status;
    private UUID createdById;
    private String createdByUsername;
    private UUID approvedById;
    private String approvedByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
}
