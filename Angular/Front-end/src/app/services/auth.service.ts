import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { Router } from '@angular/router';

// Token storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'current_user';
const AUTH_STATE_KEY = 'auth_state';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Flag to track if initial auth check has completed
  private authCheckComplete = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('AuthService initialized');
    this.restoreAuthState();
  }

  /**
   * Restore authentication state from localStorage and validate with server
   */
  private restoreAuthState(): void {
    console.log('Restoring auth state');
    
    // Try to get stored auth state
    const storedUser = localStorage.getItem(USER_DATA_KEY);
    const storedAuth = localStorage.getItem(AUTH_STATE_KEY);
    
    if (storedUser && storedAuth === 'true') {
      // Set initial state from storage
      try {
        const user = JSON.parse(storedUser);
        console.log('Found stored user:', user.email);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        this.clearAuthState();
      }
    } else {
      console.log('No stored auth state found');
    }
    
    // Always verify with server
    this.checkAuthStatus();
  }

  /**
   * Check authentication status with the server
   */
  private checkAuthStatus(): void {
    console.log('Checking auth status with server');
    
    this.getProfile().pipe(
      catchError(error => {
        console.error('Auth check failed:', error);
        // Clear auth state on error
        this.clearAuthState();
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        if (user) {
          console.log('Auth check successful, user:', user.email);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          this.saveAuthState(user);
        } else {
          console.log('Auth check returned no user');
          this.clearAuthState();
        }
        this.authCheckComplete = true;
      }
    });
  }

  /**
   * Save authentication state to localStorage
   */
  private saveAuthState(user: User): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STATE_KEY, 'true');
    
    // Store a timestamp for token expiry estimation
    localStorage.setItem('auth_timestamp', Date.now().toString());
  }

  /**
   * Clear all authentication state
   */
  private clearAuthState(): void {
    console.log('Clearing auth state');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_STATE_KEY);
    localStorage.removeItem('auth_timestamp');
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    console.log('Login attempt:', email);
    return this.http.post<User>(`${this.baseUrl}/login`, { email, password, rememberMe }, { withCredentials: true }).pipe(
      tap(user => {
        console.log('Login successful:', user.email);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.saveAuthState(user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  signup(userData: any): Observable<any> {
    return this.http.post<User>(`${this.baseUrl}/signup`, userData, { withCredentials: true }).pipe(
      tap(user => {
        // Automatically log in after signup
        console.log('Signup successful:', user.email);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.saveAuthState(user);
      }),
      catchError(error => {
        console.error('Signup error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    console.log('Logout attempt');
    return this.http.post<any>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          console.log('Logout successful');
          this.clearAuthState();
          this.router.navigate(['/auth/login']);
        }),
        catchError(error => {
          // Even if server logout fails, clear local state
          console.error('Logout error:', error);
          this.clearAuthState();
          this.router.navigate(['/auth/login']);
          return of({ message: 'Logged out locally' });
        })
      );
  }

  getProfile(): Observable<User> {
    console.log('Getting user profile');
    return this.http.get<User>(`${this.baseUrl}/profile`, { withCredentials: true })
      .pipe(
        tap(user => {
          console.log('Profile retrieved:', user.email);
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          this.saveAuthState(user);
        }),
        catchError(error => {
          console.error('Get profile error:', error);
          if (error.status === 401) {
            this.clearAuthState();
          }
          return throwError(() => error);
        })
      );
  }

  updateProfile(userData: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, userData, { withCredentials: true })
      .pipe(
        tap(updatedUser => {
          console.log('Profile updated:', updatedUser.email);
          this.currentUserSubject.next(updatedUser);
          this.saveAuthState(updatedUser);
        }),
        catchError(error => {
          console.error('Update profile error:', error);
          return throwError(() => error);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/change-password`, 
      { currentPassword, newPassword }, 
      { withCredentials: true }
    ).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<any> {
    console.log('Refreshing token');
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
      tap(() => {
        console.log('Token refresh successful');
        // If refresh is successful, update the authenticated state
        if (!this.isAuthenticatedSubject.value) {
          this.isAuthenticatedSubject.next(true);
          localStorage.setItem(AUTH_STATE_KEY, 'true');
        }
        
        // Update the timestamp
        localStorage.setItem('auth_timestamp', Date.now().toString());
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        if (error.status === 401) {
          this.clearAuthState();
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if authentication validation is complete
   */
  get isAuthCheckComplete(): boolean {
    return this.authCheckComplete;
  }

  get isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
