import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn) {
    return true;
  }
  
  // Redirect to login page with return url
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn && authService.isAdmin) {
    return true;
  }
  
  if (!authService.isLoggedIn) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  } else {
    // User is logged in but not an admin
    router.navigate(['/']);
  }
  
  return false;
};
