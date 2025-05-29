import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, of, retry } from 'rxjs';
import { Product } from '../models/product';
import { environment } from '../../environments/environment';

// Interface for paginated response
export interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

// Type guard to check if a response is a paginated response
export function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && 
         typeof response === 'object' && 
         'docs' in response && 
         Array.isArray(response.docs);
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/products`;

  // Helper method to get HTTP options with credentials
  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: false
    };
  }

  // Error handling method
  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error instanceof HttpErrorResponse) {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      
      if (error.status === 401) {
        console.error('Authentication error: You may need to log in again');
      } else if (error.status === 403) {
        console.error('Authorization error: You do not have permission to access this resource');
      } else if (error.status === 404) {
        console.error('Resource not found: The requested endpoint does not exist');
      } else if (error.status === 0) {
        console.error('Network error: Please check your internet connection');
      }
    } else {
      errorMessage = 'Unexpected error occurred';
    }
    
    console.error('API error:', error);
    console.error('Error message:', errorMessage);
    
    return throwError(() => error);
  }

  getAllProducts(): Observable<PaginatedResponse<Product> | Product[]> {
    console.log('Fetching all products from:', this.baseUrl);
    // Add limit=0 to get all products without pagination
    return this.http.get<PaginatedResponse<Product> | Product[]>(`${this.baseUrl}?limit=0`, this.getHttpOptions())
      .pipe(
        retry(3), // Increase retry attempts
        tap(response => {
          console.log('Products API response:', response);
          if (isPaginatedResponse<Product>(response)) {
            console.log(`Received ${response.docs.length} products in paginated format`);
          } else if (Array.isArray(response)) {
            console.log(`Received ${response.length} products as array`);
          } else {
            console.log('Unexpected response format:', response);
          }
        }),
        catchError(error => {
          console.error('Error fetching all products:', error);
          // Return empty array on error rather than propagating the error
          return of([]);
        })
      );
  }

  getProductById(id: string): Observable<Product> {
    console.log(`Fetching product with ID ${id} from: ${this.baseUrl}/${id}`);
    return this.http.get<Product>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(
        retry(1),
        tap(product => console.log('Product details received:', product)),
        catchError(this.handleError)
      );
  }

  getProductsByCategory(category: string): Observable<PaginatedResponse<Product> | Product[]> {
    console.log(`Fetching products for category ${category} from: ${this.baseUrl}/category/${category}`);
    // Add limit=0 to get all products without pagination
    return this.http.get<PaginatedResponse<Product> | Product[]>(`${this.baseUrl}/category/${category}?limit=0`, this.getHttpOptions())
      .pipe(
        retry(1),
        tap(response => {
          console.log('Category products API response:', response);
          if (isPaginatedResponse<Product>(response)) {
            console.log(`Received ${response.docs.length} products in paginated format for category ${category}`);
          } else if (Array.isArray(response)) {
            console.log(`Received ${response.length} products as array for category ${category}`);
          } else {
            console.log('Unexpected response format for category products:', response);
          }
        }),
        catchError(this.handleError)
      );
  }

  getFeaturedProducts(): Observable<PaginatedResponse<Product> | Product[]> {
    console.log(`Fetching featured products from: ${this.baseUrl}/featured`);
    // Add limit=0 to get all products without pagination
    return this.http.get<PaginatedResponse<Product> | Product[]>(`${this.baseUrl}/featured?limit=0`, this.getHttpOptions())
      .pipe(
        retry(3), // Increase retry attempts to 3
        tap(response => {
          console.log('Featured products API response:', response);
          if (isPaginatedResponse<Product>(response)) {
            console.log(`Received ${response.docs.length} featured products in paginated format`);
          } else if (Array.isArray(response)) {
            console.log(`Received ${response.length} featured products as array`);
          } else {
            console.log('Unexpected response format for featured products:', response);
          }
        }),
        catchError(error => {
          console.error('Error fetching featured products:', error);
          // Return empty array on error rather than propagating the error
          return of([]);
        })
      );
  }

  createProduct(product: Product): Observable<Product> {
    // Make sure we have the required fields
    if (!product.name) {
      product.name = product.title || '';
    }
    
    // Ensure stock is set if quantity is provided
    if (product.quantity && !product.stock) {
      product.stock = product.quantity;
    }
    
    console.log('Creating product:', product);
    return this.http.post<Product>(this.baseUrl, product, this.getHttpOptions())
      .pipe(
        tap(newProduct => console.log('Product created successfully:', newProduct)),
        catchError(this.handleError)
      );
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    // Make sure we have the required fields
    if (!product.name) {
      product.name = product.title || '';
    }
    
    // Ensure stock is set if quantity is provided
    if (product.quantity && !product.stock) {
      product.stock = product.quantity;
    }
    
    console.log('Updating product:', product);
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product, this.getHttpOptions())
      .pipe(
        tap(updatedProduct => console.log('Product updated successfully:', updatedProduct)),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: string): Observable<any> {
    console.log(`Deleting product with ID ${id}`);
    return this.http.delete<any>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(
        tap(() => console.log(`Product with ID ${id} deleted successfully`)),
        catchError(this.handleError)
      );
  }
}
