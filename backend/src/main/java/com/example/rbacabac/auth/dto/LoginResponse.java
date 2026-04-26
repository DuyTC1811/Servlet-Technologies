package com.example.rbacabac.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class LoginResponse {

    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private UserInfo user;

    @Getter
    @Builder
    public static class UserInfo {
        private UUID id;
        private String username;
        private Set<String> roles;
        private Set<String> permissions;
        private String branchCode;
        private String department;
    }
}
