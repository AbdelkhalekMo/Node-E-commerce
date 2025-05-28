import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order';
import { User } from '../../../models/user';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders.component.html'
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  
  orders: Order[] = [];
  isLoading = true;
  error = '';
  
  ngOnInit(): void {
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.isLoading = true;
    this.error = '';
    
    this.orderService.getAllOrders().pipe(
      catchError(error => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load orders. Please try again.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (orders) => {
        this.orders = orders;
      },
      error: (err) => {
        // Should be handled by catchError above, but just in case
        console.error('Unhandled error loading orders:', err);
        this.error = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  updateOrderStatus(orderId: string, status: string): void {
    this.isLoading = true;
    
    this.orderService.updateOrderStatus(orderId, status).pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        this.error = 'Failed to update order status. Please try again.';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          // Refresh orders list
          this.loadOrders();
        }
      }
    });
  }

  getUserEmail(user: User | string): string {
    if (!user) return 'Guest';
    if (typeof user === 'string') return 'User: ' + user;
    return user.email || 'Guest';
  }
  
  // Helper methods for handling order model changes
  
  getOrderItemsCount(order: Order): number {
    if (!order) return 0;
    
    // Check if order has items or products array
    // @ts-ignore - handle both structures
    const itemsArray = order.products || order.items;
    return itemsArray?.length || 0;
  }
  
  getOrderTotal(order: Order): string {
    if (!order || !order.totalAmount) return '0.00';
    return order.totalAmount.toFixed(2);
  }
  
  getOrderStatus(order: Order): string {
    if (!order) return 'processing';
    
    // @ts-ignore - handle both structures
    return order.status || order.orderStatus || 'processing';
  }
} 