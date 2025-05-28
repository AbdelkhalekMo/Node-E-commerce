import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/orders`;

  createOrder(orderData: Partial<Order>): Observable<Order> {
    console.log('Creating order with data:', orderData);
    
    // Define HTTP options with proper content type and credentials
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };
    
    return this.http.post<Order>(this.baseUrl, orderData, httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/user`, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${id}`, { status }, { withCredentials: true })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('Order service error:', error);
    
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('Network error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, body was:`, 
        error.error
      );
    }
    
    // Return an observable with a user-facing error message
    return throwError(() => error);
  }
}
