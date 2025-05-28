import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  cartItems: CartItem[] = [];
  cartTotal = 0;
  isLoading = true;
  error = '';
  isUpdating = false;
  private cartSubscription!: Subscription;
  private totalSubscription!: Subscription;
  
  ngOnInit(): void {
    // Redirect admin users who somehow reach this page
    if (this.authService.isAdmin) {
      console.log('Admin user detected, redirecting from cart page');
      this.router.navigate(['/admin']);
      return;
    }
    
    if (!this.authService.isLoggedIn) {
      console.log('User not logged in, redirecting to login page');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart' }
      });
      return;
    }
    
    console.log('Cart component initialized, subscribing to cart items');
    
    // Subscribe to cart items observable
    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      console.log('Cart items updated in component:', items);
      this.cartItems = items || [];
      this.isLoading = false;
    });
    
    // Subscribe to cart total observable
    this.totalSubscription = this.cartService.cartTotal$.subscribe(total => {
      console.log('Cart total updated in component:', total);
      this.cartTotal = total || 0;
    });
    
    // Load cart data
    this.loadCart();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.totalSubscription) {
      this.totalSubscription.unsubscribe();
    }
  }
  
  loadCart(): void {
    this.isLoading = true;
    this.error = '';
    
    console.log('Loading cart data from service');
    this.cartService.getCartItems().subscribe({
      next: (items) => {
        console.log('Cart items loaded in component:', items);
        this.isLoading = false;
        // Force refresh the cart display by directly setting the items
        // This is in addition to the subscription
        if (items && items.length > 0) {
          this.cartItems = [...items];
        }
      },
      error: (err) => {
        this.error = 'Failed to load cart items';
        this.isLoading = false;
        console.error('Error loading cart:', err);
      }
    });
  }
  
  updateQuantity(itemId: string, quantity: number): void {
    if (!itemId) {
      console.error('Cannot update quantity: Invalid item ID');
      return;
    }
    
    console.log(`Updating quantity for item ${itemId} to ${quantity}`);
    this.isUpdating = true;
    this.cartService.updateQuantity(itemId, quantity).subscribe({
      next: () => {
        console.log('Quantity updated successfully');
        this.isUpdating = false;
      },
      error: (err) => {
        this.error = 'Failed to update quantity';
        this.isUpdating = false;
        console.error('Error updating quantity:', err);
      }
    });
  }
  
  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      console.log('Clearing cart');
      this.isUpdating = true;
      this.cartService.clearCart().subscribe({
        next: () => {
          console.log('Cart cleared successfully');
          this.isUpdating = false;
        },
        error: (err) => {
          this.error = 'Failed to clear cart';
          this.isUpdating = false;
          console.error('Error clearing cart:', err);
        }
      });
    }
  }
  
  // Helper method to safely get product price
  getProductPrice(item: CartItem): number {
    return item?.product?.price || 0;
  }
  
  // Helper method to safely get product name
  getProductName(item: CartItem): string {
    return item?.product?.name || item?.product?.title || 'Unknown Product';
  }
  
  // Debug method to log cart items
  logCartItems(): void {
    console.log('Current cart items in component:', this.cartItems);
  }
}
