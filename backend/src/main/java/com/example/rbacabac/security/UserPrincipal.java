package com.example.rbacabac.security;

import com.example.rbacabac.user.UserEntity;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;
    private final String branchCode;
    private final String department;
    private final BigDecimal approvalLimit;
    private final Collection<? extends GrantedAuthority> authorities;

    private UserPrincipal(UUID id, String username, String password, String branchCode,
                          String department, BigDecimal approvalLimit,
                          Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.branchCode = branchCode;
        this.department = department;
        this.approvalLimit = approvalLimit;
        this.authorities = authorities;
    }

    public static UserPrincipal from(UserEntity user) {
        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(permission -> new SimpleGrantedAuthority(permission.getCode()))
                .collect(Collectors.toSet());

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getPassword(),
                user.getBranchCode(),
                user.getDepartment(),
                user.getApprovalLimit(),
                authorities
        );
    }

    public boolean hasPermission(String permission) {
        return authorities.stream()
                .anyMatch(authority -> authority.getAuthority().equals(permission));
    }

    public Set<String> getPermissionCodes() {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
