# Dự án RBAC kết hợp ABAC với Spring Boot, Angular và Claude Code

## 1. Mục tiêu dự án

Dự án xây dựng hệ thống phân quyền kết hợp:

- **RBAC - Role-Based Access Control**: phân quyền theo vai trò, ví dụ `ADMIN`, `MANAGER`, `STAFF`, `CHECKER`, `MAKER`.
- **ABAC - Attribute-Based Access Control**: phân quyền theo thuộc tính, ví dụ `department`, `branchCode`, `ownerId`, `approvalLimit`, `resource.status`, `resource.createdBy`, `request.time`.

Mục tiêu cuối cùng:

```text
User -> Role -> Permission -> Policy Rule -> Resource Decision
```

Ví dụ nghiệp vụ:

```text
User có permission TRANSACTION_APPROVE
Nhưng chỉ được approve transaction nếu:
- cùng branchCode với transaction
- không phải người tạo transaction
- amount <= approvalLimit của user
- transaction.status = PENDING_APPROVAL
```

---

## 2. Công nghệ sử dụng

### Backend

- Java 17 hoặc 21
- Spring Boot 3.x
- Spring Security 6.x
- Spring Data JPA
- PostgreSQL hoặc MySQL
- Flyway hoặc Liquibase
- JWT Authentication
- MapStruct
- Lombok
- OpenAPI / Swagger
- Testcontainers
- JUnit 5
- Mockito

### Frontend

- Angular 17+
- Angular Router
- Angular HTTP Interceptor
- Reactive Forms
- Role/Permission directive
- Route Guard
- TailwindCSS hoặc Angular Material

### DevOps

- Docker
- Docker Compose
- GitHub Actions hoặc GitLab CI
- Claude Code CLI

---

## 3. Kiến trúc tổng quan

```text
Frontend Angular
    |
    | Authorization: Bearer JWT
    v
Backend Spring Boot
    |
    | Authentication Filter
    v
SecurityContext
    |
    | RBAC check: role/permission
    v
Policy Service
    |
    | ABAC check: user attributes + resource attributes + action
    v
Database
```

Luồng xử lý:

```text
1. User đăng nhập
2. Backend trả về access token JWT
3. JWT chứa userId, username, roles, permissions, branchCode, department
4. FE lưu token an toàn
5. FE gọi API kèm Bearer token
6. BE xác thực JWT
7. BE kiểm tra RBAC bằng permission
8. BE kiểm tra ABAC bằng policy service
9. Nếu hợp lệ thì cho phép xử lý nghiệp vụ
```

---

## 4. Phân biệt RBAC và ABAC trong dự án

### RBAC

RBAC trả lời câu hỏi:

```text
User có quyền thực hiện action này không?
```

Ví dụ:

```text
TRANSACTION_CREATE
TRANSACTION_APPROVE
TRANSACTION_VIEW
USER_CREATE
USER_UPDATE
ROLE_ASSIGN
```

### ABAC

ABAC trả lời câu hỏi:

```text
Trong ngữ cảnh cụ thể này, user có được phép thao tác với resource này không?
```

Ví dụ:

```text
User có quyền TRANSACTION_APPROVE
Nhưng chỉ được approve nếu:
- transaction.branchCode = user.branchCode
- transaction.createdBy != user.id
- transaction.amount <= user.approvalLimit
- transaction.status = PENDING_APPROVAL
```

---

## 5. Thiết kế database

### 5.1. Bảng users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    department VARCHAR(100),
    branch_code VARCHAR(50),
    approval_limit NUMERIC(19, 2),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

### 5.2. Bảng roles

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

Ví dụ dữ liệu:

```sql
INSERT INTO roles(id, code, name, created_at)
VALUES
(gen_random_uuid(), 'ADMIN', 'Administrator', now()),
(gen_random_uuid(), 'MAKER', 'Maker', now()),
(gen_random_uuid(), 'CHECKER', 'Checker', now()),
(gen_random_uuid(), 'VIEWER', 'Viewer', now());
```

### 5.3. Bảng permissions

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

Ví dụ:

```sql
INSERT INTO permissions(id, code, name, resource, action, created_at)
VALUES
(gen_random_uuid(), 'TRANSACTION_CREATE', 'Create transaction', 'TRANSACTION', 'CREATE', now()),
(gen_random_uuid(), 'TRANSACTION_VIEW', 'View transaction', 'TRANSACTION', 'VIEW', now()),
(gen_random_uuid(), 'TRANSACTION_APPROVE', 'Approve transaction', 'TRANSACTION', 'APPROVE', now()),
(gen_random_uuid(), 'USER_CREATE', 'Create user', 'USER', 'CREATE', now()),
(gen_random_uuid(), 'USER_UPDATE', 'Update user', 'USER', 'UPDATE', now());
```

### 5.4. Bảng user_roles

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### 5.5. Bảng role_permissions

```sql
CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id)
);
```

### 5.6. Bảng policy_rules

Bảng này dùng để lưu rule ABAC dạng metadata.

```sql
CREATE TABLE policy_rules (
    id UUID PRIMARY KEY,
    code VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    effect VARCHAR(30) NOT NULL,
    condition_expression TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

Ví dụ:

```sql
INSERT INTO policy_rules(
    id,
    code,
    name,
    resource,
    action,
    effect,
    condition_expression,
    priority,
    enabled,
    created_at
)
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
```

Giai đoạn đầu có thể hard-code policy trong Java service. Sau đó mới đưa dần rule vào database nếu cần dynamic policy.

### 5.7. Bảng transactions mẫu

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    transaction_no VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(19, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    branch_code VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    created_by UUID NOT NULL,
    approved_by UUID,
    created_at TIMESTAMP NOT NULL,
    approved_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_transactions_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_transactions_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

---

## 6. Backend package structure

```text
src/main/java/com/example/rbacabac
├── RbacAbacApplication.java
├── config
│   ├── SecurityConfig.java
│   ├── OpenApiConfig.java
│   └── CorsConfig.java
├── security
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   ├── UserPrincipal.java
│   ├── CustomUserDetailsService.java
│   └── PermissionEvaluatorService.java
├── auth
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── dto
│   │   ├── LoginRequest.java
│   │   └── LoginResponse.java
├── user
│   ├── UserEntity.java
│   ├── UserRepository.java
│   ├── UserService.java
│   ├── UserController.java
│   └── dto
├── role
│   ├── RoleEntity.java
│   ├── RoleRepository.java
│   ├── RoleService.java
│   └── RoleController.java
├── permission
│   ├── PermissionEntity.java
│   ├── PermissionRepository.java
│   └── PermissionService.java
├── policy
│   ├── PolicyDecision.java
│   ├── PolicyContext.java
│   ├── PolicyService.java
│   ├── TransactionPolicyService.java
│   └── PolicyRuleEntity.java
├── transaction
│   ├── TransactionEntity.java
│   ├── TransactionRepository.java
│   ├── TransactionService.java
│   ├── TransactionController.java
│   └── dto
└── common
    ├── exception
    ├── response
    └── audit
```

---

## 7. Spring Security design

### 7.1. JWT payload đề xuất

```json
{
  "sub": "user-id",
  "username": "duy",
  "roles": ["CHECKER"],
  "permissions": ["TRANSACTION_VIEW", "TRANSACTION_APPROVE"],
  "branchCode": "HN001",
  "department": "LOAN",
  "iat": 1710000000,
  "exp": 1710003600
}
```

### 7.2. UserPrincipal

```java
public class UserPrincipal implements UserDetails {

    private UUID id;
    private String username;
    private String password;
    private String branchCode;
    private String department;
    private BigDecimal approvalLimit;
    private Collection<? extends GrantedAuthority> authorities;

    public boolean hasPermission(String permission) {
        return authorities.stream()
                .anyMatch(authority -> authority.getAuthority().equals(permission));
    }
}
```

### 7.3. Method Security

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
}
```

Ví dụ RBAC:

```java
@PreAuthorize("hasAuthority('TRANSACTION_CREATE')")
public TransactionResponse create(CreateTransactionRequest request) {
    return transactionService.create(request);
}
```

Ví dụ RBAC + ABAC:

```java
@PreAuthorize("hasAuthority('TRANSACTION_APPROVE') && @transactionPolicyService.canApprove(authentication, #id)")
public TransactionResponse approve(UUID id) {
    return transactionService.approve(id);
}
```

---

## 8. ABAC Policy Service

### 8.1. PolicyDecision

```java
public enum PolicyDecision {
    ALLOW,
    DENY
}
```

### 8.2. TransactionPolicyService

```java
@Service
@RequiredArgsConstructor
public class TransactionPolicyService {

    private final TransactionRepository transactionRepository;

    public boolean canView(Authentication authentication, UUID transactionId) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        if (user.hasPermission("TRANSACTION_VIEW_ALL")) {
            return true;
        }

        return user.getBranchCode().equals(tx.getBranchCode())
                || user.getId().equals(tx.getCreatedBy().getId());
    }

    public boolean canApprove(Authentication authentication, UUID transactionId) {
        UserPrincipal user = (UserPrincipal) authentication.getPrincipal();
        TransactionEntity tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));

        return user.getBranchCode().equals(tx.getBranchCode())
                && !user.getId().equals(tx.getCreatedBy().getId())
                && tx.getAmount().compareTo(user.getApprovalLimit()) <= 0
                && tx.getStatus() == TransactionStatus.PENDING_APPROVAL;
    }
}
```

### 8.3. Lưu ý quan trọng

Không nên chỉ kiểm tra ABAC ở frontend.

Frontend chỉ dùng quyền để ẩn/hiện button. Backend mới là nơi quyết định cuối cùng.

---

## 9. API design

### 9.1. Auth API

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "username": "checker01",
  "password": "123456"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "username": "checker01",
    "roles": ["CHECKER"],
    "permissions": ["TRANSACTION_VIEW", "TRANSACTION_APPROVE"],
    "branchCode": "HN001",
    "department": "LOAN"
  }
}
```

### 9.2. User API

```http
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

### 9.3. Role API

```http
GET  /api/v1/roles
POST /api/v1/roles
PUT  /api/v1/roles/{id}
POST /api/v1/roles/{id}/permissions
```

### 9.4. Permission API

```http
GET /api/v1/permissions
```

### 9.5. Transaction API

```http
POST /api/v1/transactions
GET  /api/v1/transactions
GET  /api/v1/transactions/{id}
POST /api/v1/transactions/{id}/approve
POST /api/v1/transactions/{id}/reject
```

Approve API kiểm tra:

```text
RBAC: TRANSACTION_APPROVE
ABAC:
- same branch
- not creator
- within approval limit
- status pending
```

---

## 10. OpenAPI example

```yaml
paths:
  /api/v1/transactions/{id}/approve:
    post:
      summary: Approve transaction
      operationId: approveTransaction
      tags:
        - Transaction
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Transaction approved successfully
        '403':
          description: Access denied by RBAC or ABAC policy
        '404':
          description: Transaction not found
```

---

## 11. Angular structure

```text
src/app
├── core
│   ├── auth
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   ├── permission.guard.ts
│   │   └── token.interceptor.ts
│   ├── models
│   └── layout
├── shared
│   ├── directives
│   │   └── has-permission.directive.ts
│   └── components
├── features
│   ├── login
│   ├── users
│   ├── roles
│   ├── permissions
│   └── transactions
└── app.routes.ts
```

---

## 12. Angular permission handling

### 12.1. AuthService

```typescript
export interface CurrentUser {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  branchCode: string;
  department: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  hasPermission(permission: string): boolean {
    return this.currentUserSubject.value?.permissions.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.roles.includes(role) ?? false;
  }
}
```

### 12.2. HasPermissionDirective

```typescript
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  @Input() set appHasPermission(permission: string) {
    this.viewContainer.clear();

    if (this.authService.hasPermission(permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
```

Dùng trong HTML:

```html
<button *appHasPermission="'TRANSACTION_APPROVE'">
  Approve
</button>
```

### 12.3. Route Guard

```typescript
export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredPermission = route.data['permission'];

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
```

Route:

```typescript
{
  path: 'transactions',
  component: TransactionListComponent,
  canActivate: [permissionGuard],
  data: { permission: 'TRANSACTION_VIEW' }
}
```

---

## 13. Backend authorization checklist

Mỗi API cần xác định rõ:

```text
Resource: TRANSACTION / USER / ROLE / PERMISSION
Action: CREATE / VIEW / UPDATE / DELETE / APPROVE / REJECT
Required permission: TRANSACTION_APPROVE
ABAC policy: có/không
```

Ví dụ checklist:

| API | Permission | ABAC |
|---|---|---|
| POST /transactions | TRANSACTION_CREATE | Không hoặc theo branch |
| GET /transactions/{id} | TRANSACTION_VIEW | Same branch hoặc owner |
| POST /transactions/{id}/approve | TRANSACTION_APPROVE | Same branch, not creator, amount limit, pending |
| POST /users | USER_CREATE | Admin only |
| PUT /users/{id} | USER_UPDATE | Admin hoặc self-update một số field |
| POST /roles/{id}/permissions | ROLE_UPDATE | Admin only |

---

## 14. Logging và audit

Nên audit các hành động quan trọng:

```text
LOGIN_SUCCESS
LOGIN_FAILED
CREATE_TRANSACTION
APPROVE_TRANSACTION
REJECT_TRANSACTION
CREATE_USER
ASSIGN_ROLE
UPDATE_PERMISSION
ACCESS_DENIED
```

Bảng audit_logs:

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    decision VARCHAR(30),
    reason TEXT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL
);
```

Khi ABAC deny:

```java
log.warn("ABAC DENIED action [{}], resource [{}], user [{}], reason [{}]",
        action, resourceId, user.getUsername(), reason);
```

---

## 15. Test cases quan trọng

### RBAC tests

```text
User không có TRANSACTION_APPROVE -> 403
User có TRANSACTION_APPROVE -> qua bước RBAC
Admin có USER_CREATE -> tạo user thành công
Viewer không có USER_CREATE -> 403
```

### ABAC tests

```text
Checker cùng branch, không phải creator, amount <= limit, status pending -> allow
Checker khác branch -> deny
Checker là creator -> deny
Checker amount > approvalLimit -> deny
Checker transaction status APPROVED -> deny
```

### Integration tests

- Login lấy JWT
- Gọi approve API với JWT hợp lệ
- Gọi approve API với user sai branch
- Gọi approve API với user không có permission
- Gọi API không có token
- Gọi API token hết hạn

---

## 16. Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: rbac-abac-postgres
    environment:
      POSTGRES_DB: rbac_abac
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
    container_name: rbac-abac-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/rbac_abac
      SPRING_DATASOURCE_USERNAME: app
      SPRING_DATASOURCE_PASSWORD: app
      JWT_SECRET: change-me
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
    container_name: rbac-abac-frontend
    ports:
      - "4200:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 17. Prompt dùng với Claude Code

### 17.1. Prompt khởi tạo dự án

```text
Bạn là senior full-stack engineer.
Hãy tạo dự án full-stack RBAC kết hợp ABAC gồm:

Backend:
- Spring Boot 3
- Java 17
- Spring Security 6
- JWT authentication
- Spring Data JPA
- PostgreSQL
- Flyway migration
- OpenAPI Swagger
- Unit test và integration test

Frontend:
- Angular 17+
- Login page
- User management
- Role management
- Permission management
- Transaction management
- Route guard
- Permission directive
- HTTP interceptor gắn Bearer token

Yêu cầu phân quyền:
- RBAC kiểm tra role/permission
- ABAC kiểm tra attribute theo resource
- Transaction approve rule:
  - user phải có permission TRANSACTION_APPROVE
  - user.branchCode == transaction.branchCode
  - user.id != transaction.createdBy
  - transaction.amount <= user.approvalLimit
  - transaction.status == PENDING_APPROVAL

Hãy lập kế hoạch trước, sau đó tạo source code theo từng bước.
Không bỏ qua test.
```

### 17.2. Prompt tạo database migration

```text
Tạo Flyway migration cho hệ thống RBAC + ABAC gồm các bảng:
- users
- roles
- permissions
- user_roles
- role_permissions
- policy_rules
- transactions
- audit_logs

Yêu cầu:
- Dùng UUID primary key
- Có created_at, updated_at
- Có foreign key đầy đủ
- Có unique constraint cho username, role code, permission code
- Có sample data cho ADMIN, MAKER, CHECKER, VIEWER
- Có sample permissions cho TRANSACTION_CREATE, TRANSACTION_VIEW, TRANSACTION_APPROVE, USER_CREATE, USER_UPDATE, ROLE_UPDATE
```

### 17.3. Prompt tạo backend security

```text
Implement Spring Security cho dự án RBAC + ABAC.

Yêu cầu:
- Login API trả JWT
- JWT chứa userId, username, roles, permissions, branchCode, department
- JwtAuthenticationFilter đọc Bearer token
- CustomUserDetailsService load user, roles, permissions
- Enable @PreAuthorize
- Controller method dùng hasAuthority để check RBAC
- Policy service dùng @transactionPolicyService.canApprove(authentication, id) để check ABAC
- Trả lỗi 401 cho unauthenticated
- Trả lỗi 403 cho access denied
```

### 17.4. Prompt tạo transaction module

```text
Tạo transaction module cho dự án.

Entity fields:
- id UUID
- transactionNo String
- amount BigDecimal
- currency String
- branchCode String
- department String
- status enum: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
- createdBy UserEntity
- approvedBy UserEntity
- createdAt
- approvedAt
- updatedAt

API:
- POST /api/v1/transactions
- GET /api/v1/transactions
- GET /api/v1/transactions/{id}
- POST /api/v1/transactions/{id}/approve
- POST /api/v1/transactions/{id}/reject

Authorization:
- create: TRANSACTION_CREATE
- view: TRANSACTION_VIEW + ABAC same branch or owner
- approve: TRANSACTION_APPROVE + ABAC same branch, not creator, amount <= approvalLimit, status PENDING_APPROVAL
```

### 17.5. Prompt tạo Angular frontend

```text
Tạo Angular frontend cho hệ thống RBAC + ABAC.

Yêu cầu:
- Login page
- Lưu access token
- AuthService quản lý currentUser, roles, permissions
- HTTP interceptor tự gắn Authorization Bearer token
- Permission guard cho route
- HasPermissionDirective để ẩn/hiện button
- Transaction list page
- Transaction detail page
- Approve button chỉ hiển thị nếu user có TRANSACTION_APPROVE
- Khi gọi approve nếu backend trả 403 thì hiển thị thông báo: Bạn không có quyền thực hiện hành động này
```

### 17.6. Prompt review security

```text
Review toàn bộ code security của dự án RBAC + ABAC.

Kiểm tra:
- Có API nào thiếu @PreAuthorize không
- Có đang tin tưởng quyền từ frontend không
- JWT có validate signature và expiration không
- Password đã dùng BCrypt chưa
- Có log/audit access denied không
- Có phân biệt 401 và 403 không
- Có test cho RBAC và ABAC chưa
- Có tránh hard-code secret không
- Có CORS config an toàn không
```

---

## 18. Thứ tự triển khai đề xuất

```text
1. Tạo backend Spring Boot project
2. Tạo database schema bằng Flyway
3. Implement entity/repository
4. Implement auth + JWT
5. Implement RBAC role/permission
6. Implement transaction module
7. Implement ABAC policy service
8. Viết unit test cho policy
9. Viết integration test cho API security
10. Tạo Angular project
11. Implement login/token/interceptor
12. Implement permission guard/directive
13. Implement transaction UI
14. Dockerize backend/frontend/database
15. Thêm CI pipeline
16. Review security
```

---

## 19. Quy tắc thiết kế nên áp dụng

### Backend

- Không kiểm tra quyền bằng frontend-only.
- Không để controller chứa quá nhiều business logic.
- RBAC nên dùng `hasAuthority` thay vì chỉ dùng `hasRole` nếu hệ thống có permission chi tiết.
- ABAC nên tách thành policy service riêng.
- Access denied cần log/audit.
- JWT không nên chứa dữ liệu quá nhạy cảm.
- Permission trong JWT nên có thời gian sống ngắn hoặc refresh khi role thay đổi.

### Frontend

- Route guard chỉ để cải thiện UX, không thay thế backend authorization.
- Button approve có thể ẩn nếu thiếu permission, nhưng backend vẫn phải check lại.
- Khi backend trả 403, UI cần hiển thị thông báo rõ ràng.
- Không lưu token trong localStorage nếu yêu cầu bảo mật cao; cân nhắc HttpOnly cookie.

---

## 20. Mô hình phân quyền khuyến nghị

Với hệ thống enterprise/banking, nên dùng mô hình:

```text
Role -> Permission -> Policy
```

Ví dụ:

```text
Role CHECKER có permission TRANSACTION_APPROVE
Policy TRANSACTION_APPROVE kiểm tra:
- same branch
- not creator
- amount limit
- status pending
```

Không nên tạo quá nhiều role như:

```text
CHECKER_HN_LIMIT_100M
CHECKER_HN_LIMIT_500M
CHECKER_HCM_LIMIT_100M
CHECKER_HCM_LIMIT_500M
```

Vì như vậy sẽ bị role explosion.

Thay vào đó:

```text
Role: CHECKER
Attributes:
- branchCode
- approvalLimit
- department
```

---

## 21. Kết luận

RBAC phù hợp để quản lý quyền tổng quát:

```text
User có được approve transaction không?
```

ABAC phù hợp để quản lý điều kiện nghiệp vụ:

```text
User này có được approve transaction cụ thể này không?
```

Thiết kế tốt nhất:

```text
RBAC kiểm tra quyền trước
ABAC kiểm tra điều kiện nghiệp vụ sau
Backend là nguồn quyết định cuối cùng
Frontend chỉ hỗ trợ UX
```
