package com.example.rbacabac.user;

import com.example.rbacabac.common.exception.BusinessException;
import com.example.rbacabac.common.exception.NotFoundException;
import com.example.rbacabac.role.RoleRepository;
import com.example.rbacabac.user.dto.CreateUserRequest;
import com.example.rbacabac.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists: " + request.getUsername());
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .department(request.getDepartment())
                .branchCode(request.getBranchCode())
                .approvalLimit(request.getApprovalLimit())
                .status(UserStatus.ACTIVE)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignRole(UUID userId, UUID roleId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
        var role = roleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found: " + roleId));

        user.getRoles().add(role);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(UserEntity user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getCode())
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment())
                .branchCode(user.getBranchCode())
                .approvalLimit(user.getApprovalLimit())
                .status(user.getStatus().name())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
