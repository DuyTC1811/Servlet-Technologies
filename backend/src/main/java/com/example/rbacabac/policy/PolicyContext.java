package com.example.rbacabac.policy;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
public class PolicyContext {

    private UUID userId;
    private String username;
    private String branchCode;
    private String department;
    private BigDecimal approvalLimit;

    private UUID resourceId;
    private String resourceBranchCode;
    private String resourceStatus;
    private UUID resourceCreatedBy;
    private BigDecimal resourceAmount;
}
