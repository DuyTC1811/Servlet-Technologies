package com.example.rbacabac.common.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(UUID actorId, String action, String resource, String resourceId,
                    String decision, String reason) {
        AuditLogEntity entry = AuditLogEntity.builder()
                .actorId(actorId)
                .action(action)
                .resource(resource)
                .resourceId(resourceId)
                .decision(decision)
                .reason(reason)
                .build();
        auditLogRepository.save(entry);
        log.info("AUDIT: actor=[{}] action=[{}] resource=[{}] id=[{}] decision=[{}] reason=[{}]",
                actorId, action, resource, resourceId, decision, reason);
    }

    @Async
    public void logDenied(UUID actorId, String action, String resource, String resourceId, String reason) {
        log(actorId, action, resource, resourceId, "DENY", reason);
        log.warn("ACCESS DENIED: actor=[{}] action=[{}] resource=[{}] id=[{}] reason=[{}]",
                actorId, action, resource, resourceId, reason);
    }
}
