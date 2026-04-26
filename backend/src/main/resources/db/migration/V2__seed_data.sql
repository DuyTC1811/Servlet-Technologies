-- V2: Seed data for roles, permissions, and sample users

-- Roles
INSERT INTO roles(id, code, name, description, created_at) VALUES
(gen_random_uuid(), 'ADMIN', 'Administrator', 'Full system access', now()),
(gen_random_uuid(), 'MAKER', 'Maker', 'Create and submit transactions', now()),
(gen_random_uuid(), 'CHECKER', 'Checker', 'Approve or reject transactions', now()),
(gen_random_uuid(), 'VIEWER', 'Viewer', 'View-only access', now());

-- Permissions
INSERT INTO permissions(id, code, name, resource, action, created_at) VALUES
(gen_random_uuid(), 'TRANSACTION_CREATE', 'Create transaction', 'TRANSACTION', 'CREATE', now()),
(gen_random_uuid(), 'TRANSACTION_VIEW', 'View transaction', 'TRANSACTION', 'VIEW', now()),
(gen_random_uuid(), 'TRANSACTION_VIEW_ALL', 'View all transactions', 'TRANSACTION', 'VIEW_ALL', now()),
(gen_random_uuid(), 'TRANSACTION_APPROVE', 'Approve transaction', 'TRANSACTION', 'APPROVE', now()),
(gen_random_uuid(), 'TRANSACTION_REJECT', 'Reject transaction', 'TRANSACTION', 'REJECT', now()),
(gen_random_uuid(), 'USER_CREATE', 'Create user', 'USER', 'CREATE', now()),
(gen_random_uuid(), 'USER_UPDATE', 'Update user', 'USER', 'UPDATE', now()),
(gen_random_uuid(), 'USER_VIEW', 'View users', 'USER', 'VIEW', now()),
(gen_random_uuid(), 'USER_DELETE', 'Delete user', 'USER', 'DELETE', now()),
(gen_random_uuid(), 'ROLE_VIEW', 'View roles', 'ROLE', 'VIEW', now()),
(gen_random_uuid(), 'ROLE_UPDATE', 'Update role permissions', 'ROLE', 'UPDATE', now());

-- Role-Permission mappings: ADMIN gets all
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.code = 'ADMIN';

-- MAKER permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'MAKER'
  AND p.code IN ('TRANSACTION_CREATE', 'TRANSACTION_VIEW', 'USER_VIEW', 'ROLE_VIEW');

-- CHECKER permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'CHECKER'
  AND p.code IN ('TRANSACTION_VIEW', 'TRANSACTION_APPROVE', 'TRANSACTION_REJECT', 'USER_VIEW', 'ROLE_VIEW');

-- VIEWER permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'VIEWER'
  AND p.code IN ('TRANSACTION_VIEW', 'USER_VIEW', 'ROLE_VIEW');

-- Sample users (passwords are BCrypt of "Password@123")
INSERT INTO users(id, username, password, full_name, email, department, branch_code, approval_limit, status, created_at) VALUES
(gen_random_uuid(), 'admin', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Admin User', 'admin@example.com', 'IT', 'HN001', 999999999.00, 'ACTIVE', now()),
(gen_random_uuid(), 'maker01', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Maker HN', 'maker01@example.com', 'LOAN', 'HN001', NULL, 'ACTIVE', now()),
(gen_random_uuid(), 'checker01', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Checker HN', 'checker01@example.com', 'LOAN', 'HN001', 500000000.00, 'ACTIVE', now()),
(gen_random_uuid(), 'maker02', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Maker HCM', 'maker02@example.com', 'LOAN', 'HCM001', NULL, 'ACTIVE', now()),
(gen_random_uuid(), 'checker02', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Checker HCM', 'checker02@example.com', 'LOAN', 'HCM001', 200000000.00, 'ACTIVE', now()),
(gen_random_uuid(), 'viewer01', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'Viewer User', 'viewer01@example.com', 'AUDIT', 'HN001', NULL, 'ACTIVE', now());

-- Assign roles to users
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.code = 'ADMIN';

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'maker01' AND r.code = 'MAKER';

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'checker01' AND r.code = 'CHECKER';

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'maker02' AND r.code = 'MAKER';

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'checker02' AND r.code = 'CHECKER';

INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'viewer01' AND r.code = 'VIEWER';

-- ABAC Policy rules
INSERT INTO policy_rules(id, code, name, resource, action, effect, condition_expression, priority, enabled, created_at)
VALUES (
    gen_random_uuid(),
    'TX_APPROVE_SAME_BRANCH_LIMIT',
    'Checker can approve transaction in same branch and within limit',
    'TRANSACTION',
    'APPROVE',
    'ALLOW',
    'user.branchCode == resource.branchCode && user.id != resource.createdBy && resource.amount <= user.approvalLimit && resource.status == "PENDING_APPROVAL"',
    10,
    TRUE,
    now()
);

INSERT INTO policy_rules(id, code, name, resource, action, effect, condition_expression, priority, enabled, created_at)
VALUES (
    gen_random_uuid(),
    'TX_VIEW_SAME_BRANCH_OR_OWNER',
    'User can view transaction in same branch or own transactions',
    'TRANSACTION',
    'VIEW',
    'ALLOW',
    'user.branchCode == resource.branchCode || user.id == resource.createdBy',
    10,
    TRUE,
    now()
);
