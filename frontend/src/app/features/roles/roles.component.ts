import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Permission, Role } from '../../core/models/role.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Quản lý vai trò & quyền</h2>
          <p class="page-subtitle">Cấu hình phân quyền RBAC</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="roles-grid" *ngIf="!loading; else loadingTpl">
        <div class="role-card" *ngFor="let role of roles">
          <div class="role-header">
            <div>
              <span class="role-code">{{ role.code }}</span>
              <h3 class="role-name">{{ role.name }}</h3>
              <p class="role-desc" *ngIf="role.description">{{ role.description }}</p>
            </div>
            <span class="perm-count">{{ role.permissions.length }} quyền</span>
          </div>
          <div class="perm-list">
            <span class="perm-tag" *ngFor="let p of role.permissions">{{ p }}</span>
            <span *ngIf="role.permissions.length === 0" class="no-perm">Chưa có quyền</span>
          </div>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">Đang tải...</div>
      </ng-template>

      <div class="perm-section" *ngIf="permissions.length > 0">
        <h3 class="section-title">Tất cả permissions trong hệ thống</h3>
        <div class="perm-table-card">
          <table class="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Tên</th>
                <th>Resource</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of permissions">
                <td><code>{{ p.code }}</code></td>
                <td>{{ p.name }}</td>
                <td><span class="resource-tag">{{ p.resource }}</span></td>
                <td>{{ p.action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a237e; margin: 0 0 4px; }
    .page-subtitle { color: #666; margin: 0; font-size: 0.9rem; }
    .roles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .role-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; }
    .role-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .role-code { background: #e8eaf6; color: #3949ab; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; display: inline-block; margin-bottom: 4px; }
    .role-name { margin: 4px 0 2px; font-size: 1rem; font-weight: 600; color: #1a237e; }
    .role-desc { margin: 0; font-size: 0.8rem; color: #888; }
    .perm-count { background: #f0f2ff; color: #1a237e; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .perm-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .perm-tag { background: #f3f4f6; color: #555; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-family: monospace; }
    .no-perm { color: #bbb; font-size: 0.85rem; font-style: italic; }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #1a237e; margin: 0 0 16px; }
    .perm-table-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { background: #f8f9ff; padding: 12px 16px; text-align: left; font-weight: 600; color: #555; font-size: 0.85rem; border-bottom: 1.5px solid #e8eaf6; }
    .table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
    code { background: #f0f2ff; color: #1a237e; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .resource-tag { background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
    .loading-state { text-align: center; padding: 60px; color: #666; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
    .alert-error { background: #ffebee; color: #c62828; }
  `],
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  permissions: Permission[] = [];
  loading = false;
  errorMessage = '';

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loading = true;
    this.roleService.list().subscribe({
      next: (res) => {
        this.roles = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Không thể tải danh sách vai trò';
      },
    });

    this.roleService.listPermissions().subscribe({
      next: (res) => (this.permissions = res.data),
    });
  }
}
