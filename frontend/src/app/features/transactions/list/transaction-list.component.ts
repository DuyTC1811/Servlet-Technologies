import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/auth/auth.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Transaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HasPermissionDirective, CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Danh sách giao dịch</h2>
          <p class="page-subtitle">Quản lý và theo dõi các giao dịch</p>
        </div>
        <button *appHasPermission="'TRANSACTION_CREATE'"
                class="btn btn-primary"
                (click)="showCreateModal = true">
          + Tạo giao dịch
        </button>
      </div>

      <!-- Alert -->
      <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

      <!-- Table -->
      <div class="card">
        <div class="table-responsive" *ngIf="!loading; else loadingTpl">
          <table class="table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Số tiền</th>
                <th>Chi nhánh</th>
                <th>Trạng thái</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions">
                <td><code>{{ tx.transactionNo }}</code></td>
                <td class="amount">{{ tx.amount | currency:tx.currency:'symbol':'1.0-0' }}</td>
                <td>{{ tx.branchCode }}</td>
                <td>
                  <span class="badge" [class]="'badge-' + tx.status.toLowerCase()">
                    {{ statusLabel(tx.status) }}
                  </span>
                </td>
                <td>{{ tx.createdByUsername }}</td>
                <td>{{ tx.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="actions">
                  <a [routerLink]="['/transactions', tx.id]" class="btn btn-sm btn-outline">
                    Chi tiết
                  </a>
                </td>
              </tr>
              <tr *ngIf="transactions.length === 0">
                <td colspan="7" class="empty">Chưa có giao dịch nào</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #loadingTpl>
          <div class="loading-state">Đang tải...</div>
        </ng-template>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn btn-sm btn-outline"
                  [disabled]="currentPage === 0"
                  (click)="loadPage(currentPage - 1)">← Trước</button>
          <span>Trang {{ currentPage + 1 }} / {{ totalPages }}</span>
          <button class="btn btn-sm btn-outline"
                  [disabled]="currentPage === totalPages - 1"
                  (click)="loadPage(currentPage + 1)">Sau →</button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Tạo giao dịch mới</h3>
          <button class="modal-close" (click)="showCreateModal = false">✕</button>
        </div>

        <form [formGroup]="createForm" (ngSubmit)="onCreate()">
          <div class="form-group">
            <label>Số tiền</label>
            <input type="number" formControlName="amount" placeholder="VD: 100000000"
                   [class.is-invalid]="isInvalid('amount')" />
            <span class="error" *ngIf="isInvalid('amount')">Số tiền phải lớn hơn 0</span>
          </div>
          <div class="form-group">
            <label>Loại tiền</label>
            <select formControlName="currency">
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bộ phận</label>
            <input type="text" formControlName="department" placeholder="VD: LOAN" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showCreateModal = false">Hủy</button>
            <button type="submit" class="btn btn-primary" [disabled]="creating">
              {{ creating ? 'Đang tạo...' : 'Tạo giao dịch' }}
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
    .table td { padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; color: #333; }
    .table tr:hover td { background: #fafafa; }
    .amount { font-weight: 600; color: #1a237e; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .empty { text-align: center; color: #999; padding: 40px !important; }
    .loading-state { text-align: center; padding: 40px; color: #666; }
    .actions { display: flex; gap: 8px; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .badge-draft { background: #f5f5f5; color: #666; }
    .badge-pending_approval { background: #fff3e0; color: #e65100; }
    .badge-approved { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #ffebee; color: #c62828; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
    .btn { padding: 9px 18px; border-radius: 7px; font-size: 0.9rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #1a237e; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #283593; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1.5px solid #1a237e; color: #1a237e; }
    .btn-outline:hover:not(:disabled) { background: #f0f2ff; }
    .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-sm { padding: 5px 12px; font-size: 0.82rem; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: #e8f5e9; color: #2e7d32; }
    .alert-error { background: #ffebee; color: #c62828; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; width: 460px; max-width: 95vw; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #eee; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #1a237e; }
    .modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }
    .modal form { padding: 24px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem; color: #333; }
    .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1.5px solid #ddd; border-radius: 7px; font-size: 0.9rem; box-sizing: border-box; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #1a237e; }
    .form-group input.is-invalid { border-color: #e53935; }
    .error { color: #e53935; font-size: 0.8rem; margin-top: 4px; display: block; }
  `],
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = false;
  creating = false;
  showCreateModal = false;
  successMessage = '';
  errorMessage = '';
  currentPage = 0;
  totalPages = 0;
  createForm: FormGroup;

  constructor(
    private txService: TransactionService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['VND'],
      department: [''],
    });
  }

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.txService.list(page, 10).subscribe({
      next: (res) => {
        this.transactions = res.data.content;
        this.currentPage = res.data.number;
        this.totalPages = res.data.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Không thể tải danh sách giao dịch';
      },
    });
  }

  onCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating = true;
    this.txService.create(this.createForm.value).subscribe({
      next: () => {
        this.creating = false;
        this.showCreateModal = false;
        this.createForm.reset({ currency: 'VND' });
        this.successMessage = 'Tạo giao dịch thành công';
        this.loadPage(0);
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.creating = false;
        this.errorMessage = err.error?.message || 'Tạo giao dịch thất bại';
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Nháp',
      PENDING_APPROVAL: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
    };
    return map[status] ?? status;
  }
}
