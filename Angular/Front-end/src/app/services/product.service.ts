import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
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
      withCredentials: true
    };
  }

  // Error handling method
  private handleError(error: any) {
    console.error('API error:', error);
    return throwError(() => error);
  }

  getAllProducts(): Observable<PaginatedResponse<Product> | Product[]> {
    return this.http.get<PaginatedResponse<Product> | Product[]>(this.baseUrl, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getProductsByCategory(category: string): Observable<PaginatedResponse<Product> | Product[]> {
    return this.http.get<PaginatedResponse<Product> | Product[]>(`${this.baseUrl}/category/${category}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  getFeaturedProducts(): Observable<PaginatedResponse<Product> | Product[]> {
    return this.http.get<PaginatedResponse<Product> | Product[]>(`${this.baseUrl}/featured`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
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
      .pipe(catchError(this.handleError));
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
    
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }
}
