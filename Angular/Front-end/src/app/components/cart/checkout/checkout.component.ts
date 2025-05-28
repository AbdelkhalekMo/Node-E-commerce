import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { CartItem } from '../../../models/cart-item';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  isProcessing: boolean = false;
  paymentMethod: string = 'credit_card';
  isLoading: boolean = false;
  error: string | undefined;
  
  // Countries list for dropdown
  countries: string[] = [
    'USA', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Italy', 'Spain', 
    'Japan', 'China', 'Brazil', 'Mexico', 'India', 'Russia', 'South Africa', 'Egypt'
  ];
  
  // Define the shipping data object with all required fields
  shippingData = {
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: ''
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
    });
  }

  calculateTotal(): void {
    this.cartTotal = this.cartItems.reduce(
      (total, item) => total + (item.product.price * item.quantity),
      0
    );
  }

  placeOrder(): void {
    if (this.validateForm()) {
      this.isProcessing = true;
      this.error = undefined;
      
      const currentUser = this.authService.currentUser;
      if (!currentUser?._id) {
        // Handle unauthenticated user
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
        return;
      }

      // Check if we actually have items in the cart
      if (this.cartItems.length === 0) {
        this.error = 'Your cart is empty. Please add items before checking out.';
        this.isProcessing = false;
        return;
      }

      // Log cart items to check if they are properly formatted
      console.log('Cart items before order creation:', this.cartItems);
      
      // Ensure each item has valid product ID
      const validItems = this.cartItems.filter(item => item.product && item.product._id);
      
      if (validItems.length === 0) {
        this.error = 'Your cart contains invalid items. Please try again or contact support.';
        this.isProcessing = false;
        return;
      }

      const orderData = {
        user: currentUser._id,
        items: validItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        totalAmount: this.cartTotal,
        shippingAddress: {
          fullName: this.shippingData.fullName,
          address: this.shippingData.address,
          city: this.shippingData.city,
          state: this.shippingData.state,
          postalCode: this.shippingData.zipCode,
          country: this.shippingData.country
        },
        paymentMethod: 'credit_card',
        status: 'processing'
      };

      console.log('Sending order data to server:', orderData);

      this.orderService.createOrder(orderData).subscribe({
        next: (response) => {
          console.log('Order created successfully:', response);
          this.isProcessing = false;
          
          // Store order ID in case navigation fails
          const orderId = response._id;
          localStorage.setItem('lastOrderId', orderId);
          
          this.cartService.clearCart().subscribe({
            next: () => {
              console.log('Cart cleared successfully');
              this.router.navigate(['/checkout/success'], { queryParams: { orderId } });
            },
            error: (clearError) => {
              console.error('Error clearing cart:', clearError);
              // Navigate anyway, as the order was created successfully
              this.router.navigate(['/checkout/success'], { queryParams: { orderId } });
            }
          });
        },
        error: (error) => {
          console.error('Error creating order:', error);
          console.error('Error details:', error.error);
          this.isProcessing = false;
          this.error = 'An error occurred while processing your order: ' + 
                       (error.error?.message || error.message || 'Unknown error');
        }
      });
    } else {
      this.error = 'Please fill in all required fields.';
    }
  }

  validateForm(): boolean {
    // Check if required fields are filled
    if (!this.shippingData.fullName || 
        !this.shippingData.address || 
        !this.shippingData.city || 
        !this.shippingData.state || 
        !this.shippingData.zipCode || 
        !this.shippingData.country || 
        !this.shippingData.phone) {
      return false;
    }
    return true;
  }

  // Navigation method for the "Return to Cart" button
  returnToCart(): void {
    this.router.navigate(['/cart']);
  }
}
