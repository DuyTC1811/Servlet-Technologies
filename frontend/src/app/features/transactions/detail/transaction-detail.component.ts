import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/auth/auth.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Transaction } from '../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HasPermissionDirective, CurrencyPipe, DatePipe],
  template: `
    <div class="page" *ngIf="!loading; else loadingTpl">
      <div class="page-header">
        <div class="back-btn">
          <a routerLink="/transactions" class="link-back">← Quay lại</a>
          <h2 class="page-title">Chi tiết giao dịch</h2>
        </div>
      </div>

      <div class="alert alert-success" *ngIf="successMessage">{{ successMessage }}</div>
      <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

      <div class="detail-card" *ngIf="tx">
        <div class="detail-header">
          <div>
            <code class="tx-no">{{ tx.transactionNo }}</code>
            <span class="badge" [class]="'badge-' + tx.status.toLowerCase()">
              {{ statusLabel(tx.status) }}
            </span>
          </div>
          <div class="action-buttons">
            <button
              *appHasPermission="'TRANSACTION_APPROVE'"
              class="btn btn-success"
              [disabled]="tx.status !== 'PENDING_APPROVAL' || actionLoading"
              (click)="approve()">
              {{ actionLoading === 'approve' ? 'Đang xử lý...' : '✓ Duyệt' }}
            </button>
            <button
              *appHasPermission="'TRANSACTION_REJECT'"
              class="btn btn-danger"
              [disabled]="tx.status !== 'PENDING_APPROVAL' || actionLoading"
              (click)="reject()">
              {{ actionLoading === 'reject' ? 'Đang xử lý...' : '✕ Từ chối' }}
            </button>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Số tiền</span>
            <span class="value amount">{{ tx.amount | currency:tx.currency:'symbol':'1.0-0' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Loại tiền</span>
            <span class="value">{{ tx.currency }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Chi nhánh</span>
            <span class="value">{{ tx.branchCode }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Bộ phận</span>
            <span class="value">{{ tx.department || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Người tạo</span>
            <span class="value">{{ tx.createdByUsername }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Ngày tạo</span>
            <span class="value">{{ tx.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
          </div>
          <div class="detail-item" *ngIf="tx.approvedByUsername">
            <span class="label">Người {{ tx.status === 'APPROVED' ? 'duyệt' : 'từ chối' }}</span>
            <span class="value">{{ tx.approvedByUsername }}</span>
          </div>
          <div class="detail-item" *ngIf="tx.approvedAt">
            <span class="label">Ngày {{ tx.status === 'APPROVED' ? 'duyệt' : 'từ chối' }}</span>
            <span class="value">{{ tx.approvedAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
          </div>
        </div>

        <div class="abac-note" *ngIf="tx.status === 'PENDING_APPROVAL'">
          <strong>Điều kiện duyệt (ABAC):</strong>
          Phải cùng chi nhánh, không phải người tạo, số tiền trong hạn mức, trạng thái PENDING_APPROVAL
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">Đang tải...</div>
    </ng-template>
  `,
  styles: [`
    .page { max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .back-btn { display: flex; flex-direction: column; gap: 4px; }
    .link-back { color: #1a237e; text-decoration: none; font-size: 0.9rem; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #1a237e; margin: 4px 0 0; }
    .detail-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 28px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1.5px solid #eee; }
    .detail-header > div { display: flex; align-items: center; gap: 12px; }
    .tx-no { background: #f0f2ff; color: #1a237e; padding: 4px 10px; border-radius: 6px; font-size: 1rem; }
    .action-buttons { display: flex; gap: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 0.8rem; color: #999; font-weight: 500; }
    .value { font-size: 0.95rem; color: #333; font-weight: 500; }
    .amount { font-size: 1.2rem; color: #1a237e; font-weight: 700; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; }
    .badge-draft { background: #f5f5f5; color: #666; }
    .badge-pending_approval { background: #fff3e0; color: #e65100; }
    .badge-approved { background: #e8f5e9; color: #2e7d32; }
    .badge-rejected { background: #ffebee; color: #c62828; }
    .abac-note { margin-top: 24px; padding: 14px; background: #f8f9ff; border-left: 4px solid #1a237e; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: #555; }
    .loading-state { text-align: center; padding: 80px; color: #666; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
    .alert-success { background: #e8f5e9; color: #2e7d32; }
    .alert-error { background: #ffebee; color: #c62828; }
    .btn { padding: 9px 18px; border-radius: 7px; font-size: 0.9rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-success { background: #2e7d32; color: #fff; }
    .btn-success:hover:not(:disabled) { background: #1b5e20; }
    .btn-danger { background: #c62828; color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #b71c1c; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class TransactionDetailComponent implements OnInit {
  tx: Transaction | null = null;
  loading = false;
  actionLoading: 'approve' | 'reject' | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private txService: TransactionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.txService.getById(id).subscribe({
      next: (res) => {
        this.tx = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/transactions']);
      },
    });
  }

  approve(): void {
    if (!this.tx) return;
    this.actionLoading = 'approve';
    this.errorMessage = '';
    this.txService.approve(this.tx.id).subscribe({
      next: (res) => {
        this.tx = res.data;
        this.actionLoading = null;
        this.successMessage = 'Giao dịch đã được duyệt thành công';
      },
      error: (err) => {
        this.actionLoading = null;
        this.errorMessage =
          err.status === 403
            ? 'Bạn không có quyền thực hiện hành động này'
            : err.error?.message || 'Có lỗi xảy ra';
      },
    });
  }

  reject(): void {
    if (!this.tx) return;
    this.actionLoading = 'reject';
    this.errorMessage = '';
    this.txService.reject(this.tx.id).subscribe({
      next: (res) => {
        this.tx = res.data;
        this.actionLoading = null;
        this.successMessage = 'Giao dịch đã bị từ chối';
      },
      error: (err) => {
        this.actionLoading = null;
        this.errorMessage =
          err.status === 403
            ? 'Bạn không có quyền thực hiện hành động này'
            : err.error?.message || 'Có lỗi xảy ra';
      },
    });
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
