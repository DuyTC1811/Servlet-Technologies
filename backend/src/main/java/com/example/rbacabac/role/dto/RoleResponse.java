package com.example.rbacabac.role.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class RoleResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private Set<String> permissions;
}
