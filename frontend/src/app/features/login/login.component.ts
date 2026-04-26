import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>RBAC + ABAC System</h1>
          <p>Đăng nhập vào hệ thống</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="Nhập tên đăng nhập"
              [class.is-invalid]="isInvalid('username')"
            />
            <span class="error" *ngIf="isInvalid('username')">Vui lòng nhập tên đăng nhập</span>
          </div>

          <div class="form-group">
            <label for="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Nhập mật khẩu"
              [class.is-invalid]="isInvalid('password')"
            />
            <span class="error" *ngIf="isInvalid('password')">Vui lòng nhập mật khẩu</span>
          </div>

          <div class="alert alert-error" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading">
            <span *ngIf="loading" class="spinner"></span>
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </button>
        </form>

        <div class="login-hint">
          <small>Tài khoản mẫu: checker01 / Password&#64;123</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    }
    .login-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .login-header h1 {
      font-size: 1.6rem;
      color: #1a237e;
      margin: 0 0 8px;
    }
    .login-header p { color: #666; margin: 0; }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #ddd;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    input:focus { outline: none; border-color: #1a237e; }
    input.is-invalid { border-color: #e53935; }
    .error { color: #e53935; font-size: 0.8rem; margin-top: 4px; display: block; }
    .alert-error {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .btn-primary {
      width: 100%;
      padding: 13px;
      background: #1a237e;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #283593; }
    .btn-primary:disabled { background: #9fa8da; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .login-hint {
      text-align: center;
      margin-top: 16px;
      color: #999;
    }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/transactions']),
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.status === 401
            ? 'Tên đăng nhập hoặc mật khẩu không đúng'
            : 'Có lỗi xảy ra, vui lòng thử lại';
      },
    });
  }
}
