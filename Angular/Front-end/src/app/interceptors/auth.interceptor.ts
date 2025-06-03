import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, Observable, of, finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  
  console.log(`Intercepting request to: ${req.url}`);

  // Clone the request and add withCredentials option
  req = req.clone({
    withCredentials: true
  });

  // Handle the request
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log(`Error on ${req.url}:`, error.status);
      
      // Don't retry refresh token calls or non-401 errors
      if (error.status !== 401 || req.url.includes('refresh-token') || req.url.includes('login')) {
        return throwError(() => error);
      }

      // Handle 401 errors (unauthorized)
      return handleUnauthorizedError(req, next, authService);
    }),
    finalize(() => {
      console.log(`Request to ${req.url} completed`);
    })
  );
};

/**
 * Handle unauthorized errors by refreshing the token
 */
function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<any> {
  console.log('Handling 401 error, isRefreshing:', isRefreshing);
  
  // If we're already refreshing, wait for that to complete
  if (isRefreshing) {
    if (refreshPromise) {
      console.log('Token refresh in progress, waiting for completion');
      return new Observable(observer => {
        refreshPromise!.then(
          () => {
            console.log('Refresh completed, retrying original request');
            // Retry the request after token refresh
            next(req).subscribe(observer);
          },
          (error) => {
            console.error('Refresh failed while waiting:', error);
            observer.error(error);
          }
        );
      });
    }
  }

  // Start refreshing
  isRefreshing = true;
  console.log('Starting token refresh');

  // Create a promise that resolves when refresh completes
  refreshPromise = new Promise((resolve, reject) => {
    authService.refreshToken().subscribe({
      next: () => {
        console.log('Token refresh successful');
        isRefreshing = false;
        refreshPromise = null;
        resolve(true);
      },
      error: (refreshError) => {
        console.error('Token refresh failed:', refreshError);
        isRefreshing = false;
        refreshPromise = null;
        
        // If refresh fails, log out
        authService.logout().subscribe({
          next: () => console.log('Logged out after refresh failure'),
          error: (logoutError) => console.error('Error during logout:', logoutError)
        });
        reject(refreshError);
      }
    });
  });

  // Return an observable that retries the request after token refresh
  return new Observable(observer => {
    refreshPromise!.then(
      () => {
        console.log('Retrying original request after token refresh');
        // Retry the original request with credentials
        next(req).subscribe(observer);
      },
      (error) => {
        console.error('Error retrying request after refresh:', error);
        observer.error(error);
      }
    );
  });
}
