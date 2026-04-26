package com.example.rbacabac.auth;

import com.example.rbacabac.auth.dto.LoginRequest;
import com.example.rbacabac.auth.dto.LoginResponse;
import com.example.rbacabac.common.audit.AuditService;
import com.example.rbacabac.security.JwtTokenProvider;
import com.example.rbacabac.security.UserPrincipal;
import com.example.rbacabac.user.UserEntity;
import com.example.rbacabac.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(principal);

        UserEntity user = userRepository.findByUsernameWithRolesAndPermissions(principal.getUsername())
                .orElseThrow();

        auditService.log(principal.getId(), "LOGIN_SUCCESS", "AUTH", null, "ALLOW", null);

        return LoginResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(expirationMs / 1000)
                .user(LoginResponse.UserInfo.builder()
                        .id(principal.getId())
                        .username(principal.getUsername())
                        .roles(user.getRoles().stream().map(r -> r.getCode()).collect(Collectors.toSet()))
                        .permissions(principal.getPermissionCodes())
                        .branchCode(principal.getBranchCode())
                        .department(principal.getDepartment())
                        .build())
                .build();
    }
}
