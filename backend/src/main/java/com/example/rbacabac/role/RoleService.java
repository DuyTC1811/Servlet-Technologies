package com.example.rbacabac.role;

import com.example.rbacabac.common.exception.NotFoundException;
import com.example.rbacabac.permission.PermissionRepository;
import com.example.rbacabac.role.dto.RoleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleResponse assignPermissions(UUID roleId, Set<UUID> permissionIds) {
        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleId));

        var permissions = permissionRepository.findAllById(permissionIds);
        role.getPermissions().addAll(permissions);

        return toResponse(roleRepository.save(role));
    }

    private RoleResponse toResponse(RoleEntity role) {
        Set<String> permCodes = role.getPermissions().stream()
                .map(p -> p.getCode())
                .collect(Collectors.toSet());

        return RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .permissions(permCodes)
                .build();
    }
}
