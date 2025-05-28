import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    this.getProfile().subscribe({
      next: () => this.isAuthenticatedSubject.next(true),
      error: () => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }
    });
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, password, rememberMe }, { withCredentials: true }).pipe(
      tap(() => this.isAuthenticatedSubject.next(true)),
      tap(() => this.checkAuthStatus())
    );
  }

  signup(userData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/signup`, userData, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          this.router.navigate(['/auth/login']);
        })
      );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/profile`, { withCredentials: true })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        })
      );
  }

  updateProfile(userData: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/profile`, userData, { withCredentials: true })
      .pipe(
        tap(updatedUser => {
          this.currentUserSubject.next(updatedUser);
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/change-password`, 
      { currentPassword, newPassword }, 
      { withCredentials: true }
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true });
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
