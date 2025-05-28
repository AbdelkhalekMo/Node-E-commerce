import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order, OrderItem } from '../../../models/order';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-success.component.html',
  styleUrls: ['./checkout-success.component.scss']
})
export class CheckoutSuccessComponent implements OnInit {
  orderId: string = '';
  order: Order | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.queryParams['orderId'];
    
    // If no order ID in URL, check localStorage for last order ID
    if (!this.orderId) {
      this.orderId = localStorage.getItem('lastOrderId') || '';
      if (this.orderId) {
        console.log('Retrieved order ID from localStorage:', this.orderId);
      }
    }
    
    if (!this.orderId) {
      this.error = 'No order ID provided. Please check your order history.';
      this.isLoading = false;
      return;
    }

    this.loadOrder();
  }

  loadOrder(): void {
    this.isLoading = true;
    console.log('Loading order with ID:', this.orderId);
    
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        console.log('Order loaded successfully:', order);
        
        // Ensure compatibility with backend response
        this.order = order;
        this.isLoading = false;
        
        // Clear the stored order ID after successful load
        localStorage.removeItem('lastOrderId');
      },
      error: (err) => {
        console.error('Error loading order:', err);
        console.error('Error details:', err.error);
        
        if (err.status === 404) {
          this.error = 'Order not found. It may have been deleted or not created properly.';
        } else if (err.status === 403) {
          this.error = 'You are not authorized to view this order.';
        } else {
          this.error = 'Failed to load order details: ' + 
                      (err.error?.message || err.message || 'Unknown error');
        }
        
        this.isLoading = false;
      }
    });
  }

  // Helper method to get the correct order status regardless of model structure
  getOrderStatus(): string {
    if (!this.order) return '';
    
    // @ts-ignore - handle both old and new model formats
    return this.order.status || this.order.orderStatus || 'processing';
  }
  
  // Helper method to get order items regardless of model structure
  getOrderItems(): OrderItem[] {
    if (!this.order) return [];
    
    // @ts-ignore - handle both old and new model formats
    return this.order.products || this.order.items || [];
  }

  getProductImage(product: Product | any): string {
    if (!product) return 'assets/placeholder.jpg';
    return product.imageUrl || product.image || 'assets/placeholder.jpg';
  }

  getProductTitle(product: Product | any): string {
    if (!product) return 'Unknown Product';
    return product.title || product.name || 'Unknown Product';
  }

  getProductCategory(product: Product | any): string {
    if (!product) return 'N/A';
    return product.category || 'N/A';
  }

  getProductPrice(product: Product | any): number {
    if (!product) return 0;
    return product.price || 0;
  }

  // Helper method to safely get price
  getSafePrice(price: number | undefined): number {
    return price !== undefined ? price : 0;
  }

  // Helper method to check if address field exists
  hasAddressField(field: string | undefined): boolean {
    return field !== undefined && field.trim().length > 0;
  }
  
  getTotalPrice(item: any): number {
    const unitPrice = item.product?.price ?? item.price ?? 0;
    return unitPrice * item.quantity;
  }
  
  // Helper method to get the discount amount from the coupon
  getDiscountAmount(): number {
    if (!this.order || !this.order.couponDiscount || !this.order.totalAmount) {
      return 0;
    }
    
    return (this.order.totalAmount * this.order.couponDiscount) / 100;
  }
  
  // Helper method to get the final amount after discount
  getFinalAmount(): number {
    if (!this.order || !this.order.totalAmount) {
      return 0;
    }
    
    const discountAmount = this.getDiscountAmount();
    return this.order.totalAmount - discountAmount;
  }
  
  // Navigation methods
  continueShopping(): void {
    this.router.navigate(['/']);
  }
  
  viewOrders(): void {
    this.router.navigate(['/orders']);
  }
}
