import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, of, retry, delay } from 'rxjs';
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
        console.error('Network error: Please check your internet connection and make sure the backend server is running');
      }
    } else {
      errorMessage = 'Unexpected error occurred';
    }
    
    console.error('API error:', error);
    console.error('Error message:', errorMessage);
    
    return throwError(() => error);
  }

  getAllProducts(page?: number, limit?: number): Observable<PaginatedResponse<Product> | Product[]> {
    console.log('Fetching all products from:', this.baseUrl);
    // Add pagination parameters if provided
    let url = this.baseUrl;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    } else {
      url += '?limit=8'; // Default to 8 items if no pagination specified
    }
    
    console.log('Request URL:', url);
    
    return this.http.get<PaginatedResponse<Product> | Product[]>(url, this.getHttpOptions())
      .pipe(
        retry(3), // Retry 3 times
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

  getProductsByCategory(category: string, page?: number, limit?: number): Observable<PaginatedResponse<Product> | Product[]> {
    // Add pagination parameters if provided
    let url = `${this.baseUrl}/category/${category}`;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    } else {
      url += '?limit=8'; // Default to 8 items if no pagination specified
    }
    
    console.log(`Fetching products for category ${category} from: ${url}`);
    
    return this.http.get<PaginatedResponse<Product> | Product[]>(url, this.getHttpOptions())
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
    // Use the correct featured products endpoint
    const url = `${this.baseUrl}/featured?limit=8`;
    console.log(`Fetching featured products from: ${url}`);
    
    return this.http.get<PaginatedResponse<Product> | Product[]>(url, this.getHttpOptions())
      .pipe(
        retry({ count: 3, delay: 1000 }), // Retry 3 times with 1 second delay between retries
        tap({
          next: (response) => {
            console.log('Featured products API response:', response);
            if (isPaginatedResponse<Product>(response)) {
              console.log(`Received ${response.docs.length} featured products in paginated format`);
            } else if (Array.isArray(response)) {
              console.log(`Received ${response.length} featured products as array`);
            } else {
              console.log('Unexpected response format for featured products:', response);
            }
          },
          error: (error) => {
            console.error('Error in tap for featured products:', error);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error fetching featured products from ${url}:`, error);
          console.error('Status:', error.status, 'StatusText:', error.statusText);
          console.error('Error message:', error.message);
          
          if (error.status === 0) {
            console.error('Connection error: Please check if the backend server is running at http://localhost:5001');
          }
          
          // Return mock data when server is unavailable
          return of(this.getMockProducts());
        })
      );
  }
  
  // Mock data for when the server is not available
  private getMockProducts(): Product[] {
    return [
      {
        _id: '1',
        name: 'Smartphone XYZ',
        title: 'Smartphone XYZ',
        description: 'Latest smartphone with advanced features',
        price: 699.99,
        category: 'electronics',
        image: 'https://via.placeholder.com/300',
        stock: 15,
        averageRating: 4.5,
        isFeatured: true
      },
      {
        _id: '2',
        name: 'Laptop Pro',
        title: 'Laptop Pro',
        description: 'High-performance laptop for professionals',
        price: 1299.99,
        category: 'electronics',
        image: 'https://via.placeholder.com/300',
        stock: 8,
        averageRating: 4.8,
        isFeatured: true
      },
      {
        _id: '3',
        name: 'Casual T-shirt',
        title: 'Casual T-shirt',
        description: 'Comfortable cotton t-shirt for everyday wear',
        price: 24.99,
        category: 'clothing',
        image: 'https://via.placeholder.com/300',
        stock: 50,
        averageRating: 4.2,
        isFeatured: true
      },
      {
        _id: '4',
        name: 'Coffee Maker',
        title: 'Coffee Maker',
        description: 'Automatic coffee maker with timer',
        price: 89.99,
        category: 'home',
        image: 'https://via.placeholder.com/300',
        stock: 12,
        averageRating: 4.6,
        isFeatured: true
      }
    ];
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
