import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="forbidden">
      <div class="forbidden-icon">🚫</div>
      <h2>Bạn không có quyền truy cập</h2>
      <p>Trang này yêu cầu quyền bạn chưa được cấp.</p>
      <a routerLink="/transactions" class="btn-back">Quay lại trang chủ</a>
    </div>
  `,
  styles: [`
    .forbidden {
      text-align: center;
      padding: 80px 20px;
    }
    .forbidden-icon { font-size: 4rem; margin-bottom: 16px; }
    h2 { color: #333; margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; }
    .btn-back {
      padding: 10px 24px;
      background: #1a237e;
      color: #fff;
      border-radius: 6px;
      text-decoration: none;
    }
  `],
})
export class ForbiddenComponent {}
