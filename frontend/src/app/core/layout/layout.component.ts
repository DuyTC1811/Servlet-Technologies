import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">🔐</span>
          <span class="brand-name">RBAC+ABAC</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span> Giao dịch
          </a>
          <a routerLink="/users" routerLinkActive="active" class="nav-item"
             *ngIf="can('USER_VIEW')">
            <span class="nav-icon">👥</span> Người dùng
          </a>
          <a routerLink="/roles" routerLinkActive="active" class="nav-item"
             *ngIf="can('ROLE_VIEW')">
            <span class="nav-icon">🎭</span> Vai trò
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ initial }}</div>
            <div>
              <div class="user-name">{{ user?.username }}</div>
              <div class="user-branch">{{ user?.branchCode }}</div>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">Đăng xuất</button>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 240px;
      background: #1a237e;
      color: #fff;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
    }
    .sidebar-brand {
      padding: 24px 20px;
      font-size: 1.1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .nav-item.active { background: rgba(255,255,255,0.15); color: #fff; font-weight: 600; }
    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .user-avatar {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .user-name { font-weight: 600; font-size: 0.9rem; }
    .user-branch { font-size: 0.75rem; opacity: 0.7; }
    .btn-logout {
      width: 100%;
      padding: 8px;
      background: rgba(255,255,255,0.1);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.2s;
    }
    .btn-logout:hover { background: rgba(255,255,255,0.2); }
    .main-content {
      margin-left: 240px;
      flex: 1;
      background: #f5f6fa;
      min-height: 100vh;
      padding: 28px;
    }
  `],
})
export class LayoutComponent {
  constructor(private authService: AuthService) {}

  get user() {
    return this.authService.currentUser;
  }

  get initial(): string {
    return (this.user?.username?.[0] ?? 'U').toUpperCase();
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  logout(): void {
    this.authService.logout();
  }
}
