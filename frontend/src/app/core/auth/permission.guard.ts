import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const required = route.data['permission'] as string;

  if (!required || authService.hasPermission(required)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
