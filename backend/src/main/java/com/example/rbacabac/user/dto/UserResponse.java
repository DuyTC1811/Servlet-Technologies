package com.example.rbacabac.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String department;
    private String branchCode;
    private BigDecimal approvalLimit;
    private String status;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
