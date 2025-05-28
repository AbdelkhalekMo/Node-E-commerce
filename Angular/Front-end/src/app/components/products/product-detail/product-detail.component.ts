import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, isPaginatedResponse } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { Product } from '../../../models/product';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  product: Product | null = null;
  isLoading = true;
  error = '';
  quantity = 1;
  addingToCart = false;
  
  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      } else {
        this.error = 'Product ID not provided';
        this.isLoading = false;
      }
    });
  }
  
  loadProduct(id: string): void {
    this.isLoading = true;
    this.error = '';
    
    // First try to use getProductById if it's implemented
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: (err) => {
        // Fallback to searching in all products if getProductById fails
        this.loadProductFromAllProducts(id);
      }
    });
  }
  
  private loadProductFromAllProducts(id: string): void {
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        let productsArray: Product[] = [];
        
        // Extract products array based on response type
        if (isPaginatedResponse<Product>(response)) {
          productsArray = response.docs;
        } else if (Array.isArray(response)) {
          productsArray = response;
        }
        
        // Find the product by ID
        const product = productsArray.find((p: Product) => p._id === id);
        
        if (product) {
          this.product = product;
        } else {
          this.error = 'Product not found';
        }
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Failed to load product';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  addToCart(): void {
    // Prevent admin users from adding to cart
    if (this.isAdmin) {
      this.error = 'Admin users cannot add products to cart';
      return;
    }
    
    if (!this.isLoggedIn) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    
    if (this.product) {
      this.addingToCart = true;
      this.cartService.addToCart(this.product._id!, this.quantity).subscribe({
        next: () => {
          this.addingToCart = false;
          // Show success message
          this.showSuccessMessage(`Added ${this.product?.name || 'product'} to cart`);
        },
        error: (err) => {
          this.addingToCart = false;
          this.error = 'Failed to add product to cart';
          console.error(err);
        }
      });
    }
  }
  
  private showSuccessMessage(message: string): void {
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
  
  incrementQuantity(): void {
    this.quantity++;
  }
  
  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }
}
