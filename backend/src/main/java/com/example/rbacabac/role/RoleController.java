package com.example.rbacabac.role;

import com.example.rbacabac.common.response.ApiResponse;
import com.example.rbacabac.role.dto.RoleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Tag(name = "Role", description = "Role management APIs")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @Operation(summary = "List all roles")
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_VIEW')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(roleService.findAll()));
    }

    @Operation(summary = "Assign permissions to role")
    @PostMapping("/{id}/permissions")
    @PreAuthorize("hasAuthority('ROLE_UPDATE')")
    public ResponseEntity<ApiResponse<RoleResponse>> assignPermissions(
            @PathVariable UUID id,
            @RequestBody Set<UUID> permissionIds) {
        return ResponseEntity.ok(ApiResponse.success("Permissions assigned successfully",
                roleService.assignPermissions(id, permissionIds)));
    }
}
