import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/orders`;

  // Standard HTTP options with credentials
  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    };
  }

  createOrder(orderData: Partial<Order>): Observable<Order> {
    console.log('Creating order with data:', orderData);
    return this.http.post<Order>(this.baseUrl, orderData, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get detailed order with populated product information
  getOrderDetails(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(
        map(order => {
          // Ensure dates are properly parsed
          if (order.createdAt) {
            order.createdAt = new Date(order.createdAt);
          }
          if (order.updatedAt) {
            order.updatedAt = new Date(order.updatedAt);
          }
          return order;
        }),
        catchError(error => {
          console.error(`Error fetching order details for ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/user`, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    console.log(`Updating order ${id} to status: ${status}`);
    return this.http.patch<Order>(
      `${this.baseUrl}/${id}`, 
      { status }, 
      this.getHttpOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }
  
  /**
   * Cancel an order - regular users can only cancel pending/processing orders
   * @param id The order ID to cancel
   * @param isAdmin Whether the current user is an admin
   * @param currentStatus The current status of the order (optional, used for validation)
   */
  cancelOrder(id: string, isAdmin: boolean = false, currentStatus?: string): Observable<Order> {
    // If user is not admin and order status is provided, check if it's cancellable
    if (!isAdmin && currentStatus) {
      // Regular users can only cancel orders with 'pending' or 'processing' status
      if (currentStatus !== 'pending' && currentStatus !== 'processing') {
        return throwError(() => new Error('You can only cancel orders with pending or processing status'));
      }
    }
    
    // Direct PATCH request to cancel the order
    console.log(`Cancelling order ${id}, user is admin: ${isAdmin}`);
    
    // For users, we'll use a specific endpoint
    if (!isAdmin) {
      return this.http.patch<Order>(
        `${this.baseUrl}/${id}/cancel`, 
        {}, 
        this.getHttpOptions()
      ).pipe(
        catchError(this.handleError)
      );
    } else {
      // Admins use the standard update status endpoint
      return this.updateOrderStatus(id, 'cancelled');
    }
  }
  
  /**
   * Admin-specific method to cancel orders in any status
   */
  adminCancelOrder(id: string): Observable<Order> {
    return this.cancelOrder(id, true);
  }
  
  /**
   * User-specific method to cancel only pending/processing orders
   */
  userCancelOrder(id: string, currentStatus: string): Observable<Order> {
    console.log(`User attempting to cancel order ${id} with status ${currentStatus}`);
    if (currentStatus !== 'pending' && currentStatus !== 'processing') {
      return throwError(() => new Error('You can only cancel orders with pending or processing status'));
    }
    return this.cancelOrder(id, false, currentStatus);
  }
  
  private handleError(error: HttpErrorResponse) {
    console.error('Order service error:', error);
    
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('Network error occurred:', error.error);
    } else if (error.status === 403) {
      console.error('Permission denied: You do not have permission to perform this action');
      return throwError(() => new Error('Permission denied: You do not have permission to cancel this order'));
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
