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
  templateUrl: './orders.component.html',
  styles: [`
    .input-group-text {
      color: var(--gray-500);
      transition: all 0.3s ease;
    }
    
    .form-control:focus + .input-group-text {
      color: var(--primary-color);
    }
    
    .form-control, .form-select {
      transition: all 0.3s ease;
      border-color: var(--gray-300);
    }
    
    .form-control:focus, .form-select:focus {
      box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb, 63, 81, 181), 0.25);
      border-color: var(--primary-color);
    }
    
    .form-select {
      background-position: right 0.75rem center;
      cursor: pointer;
    }
    
    .btn-outline-secondary {
      transition: all 0.3s ease;
    }
    
    .btn-outline-secondary:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    
    .badge {
      transition: all 0.3s ease;
    }
    
    .table tbody tr {
      transition: all 0.2s ease;
    }
    
    .table tbody tr:hover {
      background-color: rgba(var(--primary-color-rgb, 63, 81, 181), 0.05);
    }
    
    .btn-sm {
      transition: all 0.3s ease;
    }
    
    .btn-sm:hover {
      transform: translateY(-2px);
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  allOrders: Order[] = []; // Store all orders for filtering
  isLoading = true;
  error = '';
  
  // Search and filter properties
  searchQuery = '';
  statusFilter = 'all';
  
  // Status options for the filter dropdown
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  
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
        // Sort orders by date (newest first)
        this.allOrders = this.sortOrdersByDate(orders);
        this.orders = [...this.allOrders];
        this.filteredOrders = [...this.allOrders];
        this.applyFilters(); // Apply any existing filters
      },
      error: (err) => {
        // Should be handled by catchError above, but just in case
        console.error('Unhandled error loading orders:', err);
        this.error = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  // Sort orders by date (newest first)
  sortOrdersByDate(orders: Order[]): Order[] {
    return orders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }
  
  // Apply search and filters
  applyFilters(): void {
    let result = [...this.allOrders];
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(order => this.getOrderStatus(order) === this.statusFilter);
    }
    
    // Apply search filter if there's a query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(order => {
        const userEmail = this.getUserEmail(order.user).toLowerCase();
        const orderId = order._id.toLowerCase();
        
        return userEmail.includes(query) || orderId.includes(query);
      });
    }
    
    this.filteredOrders = result;
  }
  
  // Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }
  
  updateOrderStatus(orderId: string, status: string): void {
    if (!orderId || !status) {
      console.error('Missing orderId or status for order update');
      this.error = 'Invalid order data. Please try again.';
      return;
    }
    
    console.log(`Updating order ${orderId} status to ${status}`);
    this.isLoading = true;
    this.error = '';
    
    // Use admin-specific cancellation method if cancelling
    const updateObservable = status === 'cancelled' 
      ? this.orderService.adminCancelOrder(orderId)
      : this.orderService.updateOrderStatus(orderId, status);
      
    updateObservable.pipe(
      catchError(error => {
        console.error('Error updating order status:', error);
        this.error = `Failed to update order status: ${error.message || 'Unknown error'}`;
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          console.log('Order status updated successfully:', response);
          // Update the order in the local array to avoid a full reload
          const index = this.allOrders.findIndex(o => o._id === orderId);
          if (index !== -1) {
            // Create a copy of the order with the updated status
            const updatedOrder = {...this.allOrders[index], status: status};
            this.allOrders[index] = updatedOrder;
            // Reapply filters to update the filtered list
            this.applyFilters();
          } else {
            // If we can't find the order, reload all orders
            this.loadOrders();
          }
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