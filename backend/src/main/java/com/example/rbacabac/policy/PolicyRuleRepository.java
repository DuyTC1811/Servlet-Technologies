package com.example.rbacabac.policy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRuleEntity, UUID> {

    List<PolicyRuleEntity> findByResourceAndActionAndEnabledTrueOrderByPriorityAsc(String resource, String action);
}
