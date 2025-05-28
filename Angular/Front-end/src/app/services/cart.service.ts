import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CartItem } from '../models/cart-item';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/cart`;
  
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();
  
  private cartTotalSubject = new BehaviorSubject<number>(0);
  cartTotal$ = this.cartTotalSubject.asObservable();

  constructor() {
    // Subscribe to auth state changes
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated && !this.authService.isAdmin) {
        this.loadCart();
      } else {
        // Clear cart when logged out or when user is admin
        this.cartItemsSubject.next([]);
        this.cartTotalSubject.next(0);
      }
    });
  }

  private loadCart(): void {
    if (!this.authService.isLoggedIn) {
      console.warn('User is not logged in, cannot load cart');
      return;
    }
    
    if (this.authService.isAdmin) {
      console.warn('Admin users do not have a cart');
      return;
    }
    
    this.getCartItems().subscribe({
      next: (items) => {
        console.log('Cart loaded successfully', items);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        // If we get an authentication error, try to refresh the token
        if (error.status === 401) {
          this.authService.refreshToken().subscribe({
            next: () => this.loadCart(),
            error: (refreshError) => {
              console.error('Failed to refresh token:', refreshError);
            }
          });
        }
      }
    });
  }

  // Helper method to get the HttpOptions with auth headers
  private getHttpOptions() {
    // Make sure we're sending credentials with every request
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    };
  }

  getCartItems(): Observable<CartItem[]> {
    // Don't attempt to load cart for admin users
    if (this.authService.isAdmin) {
      console.log('Admin user detected, not loading cart');
      return of([]);
    }
    
    // Don't attempt to load cart if not logged in
    if (!this.authService.isLoggedIn) {
      console.log('User not logged in, not loading cart');
      return of([]);
    }
    
    console.log('Fetching cart items from server');
    return this.http.get<CartItem[]>(this.baseUrl, this.getHttpOptions()).pipe(
      tap(items => {
        console.log('Cart items received:', items);
        console.log('Number of items received:', items.length);
        if (items.length > 0) {
          console.log('First item in cart:', items[0]);
        }
        this.cartItemsSubject.next(items);
        this.calculateTotal(items);
      }),
      catchError(error => {
        console.error('Error fetching cart:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        // If authentication error, clear cart items
        if (error.status === 401) {
          this.cartItemsSubject.next([]);
          this.cartTotalSubject.next(0);
        }
        return of([]);
      })
    );
  }

  addToCart(productId: string, quantity: number): Observable<CartItem> {
    // Don't allow admin users to add to cart
    if (this.authService.isAdmin) {
      console.warn('Admin users cannot add items to cart');
      return throwError(() => new Error('Admin users cannot add items to cart'));
    }
    
    // Check if user is authenticated
    if (!this.authService.isLoggedIn) {
      console.warn('User must be logged in to add items to cart');
      return throwError(() => new Error('Authentication required'));
    }
    
    console.log(`Adding product ${productId} to cart with quantity ${quantity}`);
    console.log('User authenticated:', this.authService.isLoggedIn);
    console.log('Auth headers:', this.getHttpOptions());
    
    // Ensure the productId is a valid string
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      console.error('Invalid product ID:', productId);
      return throwError(() => new Error('Invalid product ID'));
    }
    
    // Ensure quantity is a valid number
    const parsedQuantity = parseInt(quantity.toString());
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      console.error('Invalid quantity:', quantity);
      return throwError(() => new Error('Invalid quantity'));
    }
    
    return this.http.post<any>(
      this.baseUrl, 
      { productId, quantity: parsedQuantity }, 
      this.getHttpOptions()
    ).pipe(
      tap(response => {
        console.log('Product added to cart successfully', response);
        // Refresh cart items after adding
        this.getCartItems().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding to cart:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        if (error.error) {
          console.error('Server error:', error.error);
        }
        
        // If authentication error, try to refresh token
        if (error.status === 401) {
          console.log('Authentication error, trying to refresh token');
          this.authService.refreshToken().subscribe({
            next: () => console.log('Token refreshed, please try again'),
            error: (refreshError) => console.error('Failed to refresh token:', refreshError)
          });
        }
        
        // For server errors, we should also refresh the token and retry
        if (error.status === 500) {
          console.log('Server error, may be an authentication issue. Refreshing token...');
          this.authService.refreshToken().subscribe({
            next: () => console.log('Token refreshed, please try again'),
            error: (refreshError) => console.error('Failed to refresh token:', refreshError)
          });
        }
        
        // Return the error to be handled by the component
        return throwError(() => error);
      })
    );
  }

  updateQuantity(itemId: string, quantity: number): Observable<CartItem> {
    if (!this.authService.isLoggedIn) {
      return throwError(() => new Error('Authentication required'));
    }
    
    return this.http.put<CartItem>(
      `${this.baseUrl}/${itemId}`, 
      { quantity }, 
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        this.getCartItems().subscribe();
      }),
      catchError(error => {
        console.error('Error updating quantity:', error);
        return throwError(() => error);
      })
    );
  }

  clearCart(): Observable<any> {
    if (!this.authService.isLoggedIn) {
      return throwError(() => new Error('Authentication required'));
    }
    
    return this.http.delete(
      this.baseUrl, 
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        this.cartItemsSubject.next([]);
        this.cartTotalSubject.next(0);
      }),
      catchError(error => {
        console.error('Error clearing cart:', error);
        // Even if the server call fails, still clear the local cart
        this.cartItemsSubject.next([]);
        this.cartTotalSubject.next(0);
        // Return empty observable to allow chain to continue
        return of({success: true});
      })
    );
  }

  private calculateTotal(items: CartItem[]): void {
    const total = items.reduce((sum, item) => {
      // Safely access the product price
      const price = item?.product?.price || 0;
      return sum + (item.quantity * price);
    }, 0);
    this.cartTotalSubject.next(total);
  }

  getTotalPrice(): number {
    return this.cartTotalSubject.value;
  }

  get cartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  get cartTotal(): number {
    return this.cartTotalSubject.value;
  }

  get cartItemsCount(): number {
    const count = this.cartItems.reduce((count, item) => count + (item?.quantity || 0), 0);
    console.log('Cart items count:', count);
    console.log('Current cart items:', this.cartItems);
    return count;
  }
}
