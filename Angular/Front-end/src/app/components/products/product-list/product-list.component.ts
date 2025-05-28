import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, isPaginatedResponse } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models/product';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  products: Product[] = [];
  displayedProducts: Product[] = [];
  isLoading = true;
  error = '';
  category: string | null = null;
  
  // Filter properties
  searchTerm = '';
  sortOption = 'default';
  categories = [
    'electronics',
    'clothing',
    'books',
    'home',
    'beauty',
    'sports'
  ];
  priceRange = {
    min: 0,
    max: 1000
  };
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.category = params.get('category');
      this.loadProducts();
    });
  }
  
  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    this.searchTerm = ''; // Reset search term when loading products
    
    const loadMethod = this.category
      ? this.productService.getProductsByCategory(this.category)
      : this.productService.getAllProducts();
      
    loadMethod.subscribe({
      next: (response) => {
        // Handle paginated response - extract docs array
        if (isPaginatedResponse<Product>(response)) {
          // If response is a paginated object with docs property
          this.products = response.docs;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          this.products = response;
        } 
        // Fallback to empty array if not recognized format
        else {
          this.products = [];
          console.error('Unexpected response format:', response);
          this.error = 'Received invalid data format from server';
        }
        
        // Normalize product data to ensure required fields exist
        this.normalizeProducts();
        
        // Create a copy for display
        this.displayedProducts = [...this.products];
        this.isLoading = false;
        if (this.products.length > 0) {
          this.applyFilters();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error loading products:', err);
        
        // Handle specific HTTP error codes
        if (err.status === 403) {
          this.error = 'You do not have permission to view these products. Please log in with appropriate credentials.';
        } else if (err.status === 401) {
          this.error = 'Authentication required. Please log in to view products.';
          // Optionally redirect to login
          // this.router.navigate(['/login']);
        } else if (err.status === 404) {
          this.error = 'No products found for this category.';
        } else if (err.status === 400) {
          this.error = 'Invalid request. This category may not exist.';
        } else {
          this.error = 'Failed to load products. Please try again later.';
        }
      }
    });
  }
  
  // Ensure all products have the required fields
  normalizeProducts(): void {
    this.products = this.products.map(product => {
      // Make sure imageUrl is set (some products might use image instead)
      if (!product.imageUrl && product.image) {
        product.imageUrl = product.image;
      }
      
      // Ensure title is available (some products might only have name)
      if (!product.title && product.name) {
        product.title = product.name;
      } else if (!product.title) {
        product.title = 'Untitled Product';
      }
      
      // Ensure description exists
      if (!product.description) {
        product.description = 'No description available';
      }
      
      return product;
    });
  }
  
  applyFilters(): void {
    let filtered = [...this.products];
    
    // Apply search term filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product => {
        const title = product.title || product.name || '';
        const description = product.description || '';
        
        return title.toLowerCase().includes(search) || 
               description.toLowerCase().includes(search);
      });
    }
    
    // Apply price filter
    filtered = filtered.filter(product => 
      product.price >= this.priceRange.min && 
      product.price <= this.priceRange.max
    );
    
    this.displayedProducts = filtered;
    this.sortProducts();
  }
  
  // Reset search and filters to show all products
  resetFilters(): void {
    this.searchTerm = '';
    this.priceRange = {
      min: 0,
      max: 1000
    };
    this.sortOption = 'default';
    this.displayedProducts = [...this.products];
  }
  
  // Handle search input changes to automatically update results
  onSearchChange(event: Event): void {
    // If search is cleared (empty), reset to show all products
    if (!this.searchTerm.trim()) {
      this.displayedProducts = [...this.products];
    }
    // Otherwise apply the current search filter
    else {
      this.applyFilters();
    }
  }
  
  sortProducts(): void {
    switch (this.sortOption) {
      case 'price-asc':
        this.displayedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.displayedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        this.displayedProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'name-desc':
        this.displayedProducts.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        // For featured sorting, we'll just use the default order from API
        break;
    }
  }
  
  addToCart(product: Product): void {
    // Clear previous messages
    this.error = '';
    
    // Prevent admin users from adding to cart
    if (this.isAdmin) {
      this.error = 'Admin users cannot add products to cart';
      return;
    }
    
    // Check if user is logged in
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/auth/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }
    
    if (!product._id) {
      console.error('Product ID is missing');
      this.error = 'Invalid product';
      return;
    }
    
    console.log('Adding product to cart:', product._id);
    console.log('Product details:', product);
    console.log('User is logged in:', this.authService.isLoggedIn);
    
    this.cartService.addToCart(product._id, 1).subscribe({
      next: (response) => {
        console.log('Add to cart response:', response);
        // Create temporary success message
        this.error = ''; // Clear any existing errors
        const successMessage = document.createElement('div');
        successMessage.classList.add('alert', 'alert-success', 'position-fixed', 'top-0', 'end-0', 'm-3');
        successMessage.style.zIndex = '9999';
        successMessage.innerHTML = `
          <strong>Success!</strong> Added ${product.title || product.name} to cart.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(successMessage);
        
        // Remove after 3 seconds
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        if (err.error) {
          console.error('Server error:', err.error);
        }
        
        // Display error message without affecting the product list
        const errorAlert = document.createElement('div');
        errorAlert.classList.add('alert', 'alert-danger', 'position-fixed', 'top-0', 'end-0', 'm-3');
        errorAlert.style.zIndex = '9999';
        
        let errorMessage = 'Failed to add product to cart. Please try again.';
        
        // Handle specific errors
        if (err.status === 401) {
          errorMessage = 'Please log in to add items to your cart';
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { 
              queryParams: { returnUrl: this.router.url } 
            });
          }, 2000);
        } else if (err.status === 404) {
          errorMessage = 'Product not found or no longer available';
        } else if (err.status === 400 && err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.error = errorMessage; // Set the error message in the component
        
        errorAlert.innerHTML = `
          <strong>Error!</strong> ${errorMessage}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(errorAlert);
        
        // Remove after 5 seconds
        setTimeout(() => {
          errorAlert.remove();
        }, 5000);
      }
    });
  }
}
