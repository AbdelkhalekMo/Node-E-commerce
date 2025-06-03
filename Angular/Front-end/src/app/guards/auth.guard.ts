import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Constants for localStorage keys
const USER_DATA_KEY = 'current_user';
const AUTH_STATE_KEY = 'auth_state';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log(`Auth guard checking access to: ${state.url}`);
  
  // Check localStorage first for faster initial check
  const storedAuth = localStorage.getItem(AUTH_STATE_KEY);
  
  if (storedAuth === 'true') {
    console.log('Auth guard: User authenticated via localStorage');
    return true;
  }
  
  // If not authenticated according to localStorage, check with service
  if (authService.isLoggedIn) {
    console.log('Auth guard: User authenticated via service');
    return true;
  }
  
  console.log('Auth guard: User not authenticated, redirecting to login');
  // Redirect to login page with return url
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log(`Admin guard checking access to: ${state.url}`);
  
  // Check localStorage first for faster initial check
  const storedUser = localStorage.getItem(USER_DATA_KEY);
  const storedAuth = localStorage.getItem(AUTH_STATE_KEY);
  
  if (storedAuth === 'true' && storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.role === 'admin') {
        console.log('Admin guard: Admin access granted via localStorage');
        return true;
      } else {
        console.log('Admin guard: User authenticated but not admin via localStorage');
      }
    } catch (e) {
      console.error('Admin guard: Error parsing stored user:', e);
    }
  }
  
  // If not authenticated according to localStorage, check with service
  if (authService.isLoggedIn && authService.isAdmin) {
    console.log('Admin guard: Admin access granted via service');
    return true;
  }
  
  if (!authService.isLoggedIn) {
    console.log('Admin guard: User not authenticated, redirecting to login');
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  } else {
    // User is logged in but not an admin
    console.log('Admin guard: User authenticated but not admin, redirecting to home');
    router.navigate(['/']);
  }
  
  return false;
};
