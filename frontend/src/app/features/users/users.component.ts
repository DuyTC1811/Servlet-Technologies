import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Quản lý người dùng</h2>
          <p class="page-subtitle">Danh sách tài khoản trong hệ thống</p>
        </div>
        <button *appHasPermission="'USER_CREATE'"
                class="btn btn-primary"
                (click)="showCreateModal = true">
          + Tạo người dùng
        </button>
      </div>

      <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="card">
        <div class="table-responsive" *ngIf="!loading; else loadingTpl">
          <table class="table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Chi nhánh</th>
                <th>Bộ phận</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td><strong>{{ user.username }}</strong></td>
                <td>{{ user.fullName }}</td>
                <td>{{ user.branchCode }}</td>
                <td>{{ user.department || '—' }}</td>
                <td>
                  <span class="role-tag" *ngFor="let role of user.roles">{{ role }}</span>
                </td>
                <td>
                  <span class="badge" [class]="user.status === 'ACTIVE' ? 'badge-approved' : 'badge-rejected'">
                    {{ user.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động' }}
                  </span>
                </td>
                <td>{{ user.createdAt | date:'dd/MM/yyyy' }}</td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="7" class="empty">Chưa có người dùng nào</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #loadingTpl>
          <div class="loading-state">Đang tải...</div>
        </ng-template>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Tạo người dùng mới</h3>
          <button class="modal-close" (click)="showCreateModal = false">✕</button>
        </div>
        <form [formGroup]="createForm" (ngSubmit)="onCreate()">
          <div class="form-row">
            <div class="form-group">
              <label>Tên đăng nhập *</label>
              <input type="text" formControlName="username"
                     [class.is-invalid]="isInvalid('username')" />
              <span class="error" *ngIf="isInvalid('username')">Bắt buộc, tối thiểu 3 ký tự</span>
            </div>
            <div class="form-group">
              <label>Mật khẩu *</label>
              <input type="password" formControlName="password"
                     [class.is-invalid]="isInvalid('password')" />
              <span class="error" *ngIf="isInvalid('password')">Bắt buộc, tối thiểu 8 ký tự</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Họ tên *</label>
              <input type="text" formControlName="fullName"
                     [class.is-invalid]="isInvalid('fullName')" />
              <span class="error" *ngIf="isInvalid('fullName')">Bắt buộc</span>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Chi nhánh *</label>
              <input type="text" formControlName="branchCode"
                     placeholder="VD: HN001"
                     [class.is-invalid]="isInvalid('branchCode')" />
              <span class="error" *ngIf="isInvalid('branchCode')">Bắt buộc</span>
            </div>
            <div class="form-group">
              <label>Bộ phận</label>
              <input type="text" formControlName="department" placeholder="VD: LOAN" />
            </div>
          </div>
          <div class="form-group">
            <label>Hạn mức duyệt</label>
            <input type="number" formControlName="approvalLimit" placeholder="VD: 500000000" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showCreateModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary" [disabled]="creating">
              {{ creating ? 'Đang tạo...' : 'Tạo người dùng' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a237e; margin: 0 0 4px; }
    .page-subtitle { color: #666; margin: 0; font-size: 0.9rem; }
    .card { background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .table-responsive { overflow-x: auto; }
    .table { width: 100%; border-collapse: collapse; }
    .table th { background: #f8f9ff; padding: 12px 16px; text-align: left; font-weight: 600; color: #555; font-size: 0.85rem; border-bottom: 1.5px solid #e8eaf6; }
    .table td { padding: 13px 16px; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }
    .table tr:hover td { background: #fafafa; }
    .empty { text-align: center; color: #999; padding: 40px !important; }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .role-tag { display: inline-block; background: #e8eaf6; color: #3949ab; padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; margin-right: 4px; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .badge-approved { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #ffebee; color: #c62828; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: #e8f5e9; color: #2e7d32; }
    .alert-error { background: #ffebee; color: #c62828; }
    .btn { padding: 9px 18px; border-radius: 7px; font-size: 0.9rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #1a237e; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #283593; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1.5px solid #1a237e; color: #1a237e; }
    .btn-outline:hover { background: #f0f2ff; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; width: 560px; max-width: 95vw; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #eee; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #1a237e; }
    .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }
    .modal form { padding: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; color: #333; }
    .form-group input { width: 100%; padding: 10px 12px; border: 1.5px solid #ddd; border-radius: 7px; font-size: 0.9rem; box-sizing: border-box; }
    .form-group input:focus { outline: none; border-color: #1a237e; }
    .form-group input.is-invalid { border-color: #e53935; }
    .error { color: #e53935; font-size: 0.8rem; margin-top: 4px; display: block; }
  `],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  creating = false;
  showCreateModal = false;
  successMessage = '';
  errorMessage = '';
  createForm: FormGroup;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      fullName: ['', Validators.required],
      email: ['', Validators.email],
      branchCode: ['', Validators.required],
      department: [''],
      approvalLimit: [null],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.userService.list().subscribe({
      next: (res) => {
        this.users = res.data.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Không thể tải danh sách người dùng';
      },
    });
  }

  onCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.creating = true;
    this.userService.create(this.createForm.value).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.createForm.reset();
        this.successMessage = 'Tạo người dùng thành công';
        this.load();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.creating = false;
        this.errorMessage = err.error?.message || 'Tạo người dùng thất bại';
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
