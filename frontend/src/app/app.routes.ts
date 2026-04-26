import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/components/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'transactions',
        canActivate: [permissionGuard],
        data: { permission: 'TRANSACTION_VIEW' },
        loadComponent: () =>
          import('./features/transactions/list/transaction-list.component').then(
            (m) => m.TransactionListComponent
          ),
      },
      {
        path: 'transactions/:id',
        canActivate: [permissionGuard],
        data: { permission: 'TRANSACTION_VIEW' },
        loadComponent: () =>
          import('./features/transactions/detail/transaction-detail.component').then(
            (m) => m.TransactionDetailComponent
          ),
      },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permission: 'USER_VIEW' },
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: 'ROLE_VIEW' },
        loadComponent: () =>
          import('./features/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: '',
        redirectTo: 'transactions',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'transactions',
  },
];
