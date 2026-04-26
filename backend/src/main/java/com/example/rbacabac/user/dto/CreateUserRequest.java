package com.example.rbacabac.user.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateUserRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 100)
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String department;

    @NotBlank(message = "Branch code is required")
    private String branchCode;

    @DecimalMin(value = "0.0", message = "Approval limit must be non-negative")
    private BigDecimal approvalLimit;
}
