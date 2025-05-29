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
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  ngOnInit(): void {
    this.loadFeaturedProducts();
  }
  
  loadFeaturedProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    this.productService.getFeaturedProducts().subscribe({
      next: (response) => {
        // Handle possible paginated response
        if (isPaginatedResponse<Product>(response)) {
          this.featuredProducts = response.docs;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          this.featuredProducts = response;
        } 
        // Fallback to empty array if not recognized format
        else {
          this.featuredProducts = [];
          console.error('Unexpected response format:', response);
          this.error = 'Received invalid data format from server';
        }
        
        // Normalize products to ensure consistent data
        this.normalizeProducts();
        
        // Handle empty results case
        if (this.featuredProducts.length === 0) {
          console.log('No featured products found');
          // Don't set an error, just log it
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
          this.error = 'No featured products found.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to the server. Please check if the backend is running.';
        } else {
          this.error = 'Failed to load featured products. Please try again later.';
        }
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
