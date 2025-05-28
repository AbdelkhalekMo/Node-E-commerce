import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Only allow logged in users who are NOT admins
  if (authService.isLoggedIn && !authService.isAdmin) {
    return true;
  }
  
  if (!authService.isLoggedIn) {
    // If not logged in, redirect to login
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  } else {
    // If admin, redirect to admin dashboard
    router.navigate(['/admin']);
  }
  
  return false;
}; 