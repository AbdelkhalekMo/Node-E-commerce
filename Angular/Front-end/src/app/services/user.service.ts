import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/users`;
  
  constructor(private http: HttpClient) { }
  
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}`, { withCredentials: true });
  }
  
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${userId}`, { withCredentials: true });
  }
  
  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${userId}/role`, { role }, { withCredentials: true });
  }
  
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${userId}`, { withCredentials: true });
  }
} 