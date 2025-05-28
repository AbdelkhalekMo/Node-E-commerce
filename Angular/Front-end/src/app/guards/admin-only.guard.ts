import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// This guard prevents admin users from accessing regular user pages
// It redirects them to the admin dashboard
export const adminOnlyGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // If user is an admin, redirect to admin dashboard
  if (authService.isAdmin) {
    router.navigate(['/admin']);
    return false;
  }
  
  // Allow non-admin users to access the page
  return true;
}; 