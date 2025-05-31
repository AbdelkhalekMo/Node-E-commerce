import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService, isPaginatedResponse } from '../../services/product.service';
import { CartService } from '../../services/cart.service'; 
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  featuredProducts: Product[] = [];
  isLoading = true;
  error = '';
  successMessage = '';
  backendStatus = 'checking';
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  ngOnInit(): void {
    this.checkBackendStatus();
  }
  
  checkBackendStatus(): void {
    // Check if backend is running by making a simple health check request
    fetch('http://localhost:5001/health')
      .then(response => {
        if (response.ok) {
          console.log('Backend is running');
          this.backendStatus = 'running';
          this.loadFeaturedProducts();
        } else {
          console.error('Backend health check failed:', response.status);
          this.backendStatus = 'error';
          this.error = 'Backend server is not responding correctly. Please check if it is running properly.';
          this.isLoading = false;
        }
      })
      .catch(err => {
        console.error('Backend connection error:', err);
        this.backendStatus = 'offline';
        this.error = 'Cannot connect to the backend server. Please make sure it is running at http://localhost:5001.';
        this.isLoading = false;
      });
  }
  
  loadFeaturedProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    console.log('Loading featured products...');
    this.productService.getFeaturedProducts().subscribe({
      next: (response) => {
        console.log('Featured products raw response:', response);
        
        // Handle possible paginated response
        if (isPaginatedResponse<Product>(response)) {
          console.log(`Received ${response.docs.length} featured products in paginated format`);
          this.featuredProducts = response.docs;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          console.log(`Received ${response.length} featured products as array`);
          this.featuredProducts = response;
          
          // Check if this is mock data
          if (this.featuredProducts.length > 0 && this.featuredProducts[0]._id === '1' && 
              this.featuredProducts[0].name === 'Smartphone XYZ') {
            console.log('Using mock data - backend server appears to be unavailable');
            this.error = 'Using demo data. The backend server appears to be offline.';
          }
        } 
        // Fallback to empty array if not recognized format
        else {
          this.featuredProducts = [];
          console.error('Unexpected response format:', response);
          this.error = 'Received invalid data format from server';
        }
        
        // Log featured status for debugging
        if (this.featuredProducts.length > 0) {
          console.log('Featured status of products:');
          this.featuredProducts.forEach(p => {
            console.log(`${p.name}: isFeatured=${p.isFeatured}`);
          });
        }
        
        // Normalize products to ensure consistent data
        this.normalizeProducts();
        
        // Handle empty results case
        if (this.featuredProducts.length === 0) {
          console.log('No featured products found');
          // Set a user-friendly message instead of an error
          this.error = 'No featured products found. This could be because none are marked as featured in the database.';
          
          // As a fallback, try to load all products instead
          this.loadAllProductsAsFallback();
        }
        
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error loading featured products:', err);
        
        // Handle specific HTTP error codes
        if (err.status === 403) {
          this.error = 'You do not have permission to view featured products.';
        } else if (err.status === 401) {
          this.error = 'Authentication required to view featured products.';
        } else if (err.status === 404) {
          this.error = 'No featured products found. Loading regular products instead...';
          // Try to load regular products as fallback
          this.loadAllProductsAsFallback();
        } else if (err.status === 0) {
          this.error = 'Cannot connect to the server. Please check if the backend is running at http://localhost:5001.';
        } else {
          this.error = `Failed to load featured products (${err.status}: ${err.statusText}). Please try again later.`;
        }
      }
    });
  }
  
  // Fallback to load regular products if no featured products are found
  loadAllProductsAsFallback(): void {
    console.log('Loading regular products as fallback...');
    
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        if (isPaginatedResponse<Product>(response)) {
          this.featuredProducts = response.docs.slice(0, 8); // Take the first 8 products
        } else if (Array.isArray(response)) {
          this.featuredProducts = response.slice(0, 8); // Take the first 8 products
        }
        
        if (this.featuredProducts.length > 0) {
          this.error = 'No featured products found. Showing regular products instead.';
          this.normalizeProducts();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading fallback products:', error);
        // Keep the existing error message from the featured products attempt
        this.isLoading = false;
      }
    });
  }

  // Normalize products to ensure all required fields are present
  private normalizeProducts(): void {
    this.featuredProducts = this.featuredProducts.map(product => {
      const normalizedProduct = { ...product };
      
      // Ensure name field is set
      if (!normalizedProduct.name && normalizedProduct.title) {
        normalizedProduct.name = normalizedProduct.title;
      } else if (!normalizedProduct.name) {
        normalizedProduct.name = 'Untitled Product';
      }
      
      // Ensure title field is set
      if (!normalizedProduct.title && normalizedProduct.name) {
        normalizedProduct.title = normalizedProduct.name;
      } else if (!normalizedProduct.title) {
        normalizedProduct.title = normalizedProduct.name || 'Untitled Product';
      }
      
      // Ensure image field is set
      if (!normalizedProduct.image && normalizedProduct.imageUrl) {
        normalizedProduct.image = normalizedProduct.imageUrl;
      } else if (!normalizedProduct.imageUrl && normalizedProduct.image) {
        normalizedProduct.imageUrl = normalizedProduct.image;
      } else if (!normalizedProduct.image && !normalizedProduct.imageUrl) {
        // Set default image if none exists
        normalizedProduct.image = 'https://via.placeholder.com/300';
        normalizedProduct.imageUrl = 'https://via.placeholder.com/300';
      }
      
      return normalizedProduct;
    });
  }

  // Retry connection to backend
  retryConnection(): void {
    this.error = '';
    this.isLoading = true;
    this.checkBackendStatus();
  }

  addToCart(product: Product): void {
    // Clear previous messages
    this.error = '';
    this.successMessage = '';
    
    // Prevent admin users from adding to cart
    if (this.isAdmin) {
      this.error = 'Admin users cannot add products to cart';
      return;
    }
    
    // Check if user is logged in
    if (!this.authService.isLoggedIn) {
      // Redirect to login with return URL
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }
    
    if (!product._id) {
      this.error = 'Invalid product';
      return;
    }
    
    console.log(`Adding product ${product._id} to cart with quantity 1`);
    
    this.cartService.addToCart(product._id, 1).subscribe({
      next: (response) => {
        console.log('Product added to cart successfully', response);
        
        // Show success message
        this.showSuccessMessage(`Added ${product.name || 'product'} to cart`);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error adding to cart:', err);
        
        // Handle specific errors
        if (err.status === 401) {
          this.error = 'Please log in to add items to your cart';
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { 
              queryParams: { returnUrl: this.router.url } 
            });
          }, 2000);
        } else if (err.status === 404) {
          this.error = 'Product not found or no longer available';
        } else if (err.status === 400) {
          this.error = err.error?.message || 'Invalid request';
        } else {
          this.error = 'Failed to add product to cart. Please try again.';
        }
      }
    });
  }
  
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    
    // Create temporary success message element
    const successElement = document.createElement('div');
    successElement.classList.add('alert', 'alert-success', 'position-fixed', 'top-0', 'end-0', 'm-3');
    successElement.style.zIndex = '9999';
    successElement.innerHTML = `
      <strong>Success!</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(successElement);
    
    // Remove after 3 seconds
    setTimeout(() => {
      successElement.remove();
    }, 3000);
  }
}
