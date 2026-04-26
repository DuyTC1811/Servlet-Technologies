package com.example.rbacabac.policy;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "policy_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 150)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String resource;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private PolicyDecision effect;

    @Column(name = "condition_expression", nullable = false)
    private String conditionExpression;

    @Column(nullable = false)
    private int priority;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (priority == 0) priority = 100;
        enabled = true;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
