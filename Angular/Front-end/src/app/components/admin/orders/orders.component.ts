import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order, OrderItem } from '../../../models/order';
import { User } from '../../../models/user';
import { catchError, finalize, of } from 'rxjs';
import { Product } from '../../../models/product';

// Import Bootstrap modal functionality
declare var bootstrap: any;

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

    /* Modal styles */
    .modal-body h6 {
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .modal-body hr {
      margin: 1rem 0;
    }
    
    /* Clickable order rows */
    .order-row {
      cursor: pointer;
      position: relative;
    }
    
    .order-row:hover {
      background-color: rgba(var(--primary-color-rgb, 63, 81, 181), 0.1) !important;
    }
    
    .order-row:active {
      background-color: rgba(var(--primary-color-rgb, 63, 81, 181), 0.15) !important;
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
  
  // Selected order for the modal
  selectedOrder: Order | null = null;
  orderDetailsModal: any; // Reference to the Bootstrap modal
  isUpdatingStatus = false; // Loading state for status updates
  
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
            
            // If this is the currently selected order, update it too
            if (this.selectedOrder && this.selectedOrder._id === orderId) {
              this.selectedOrder = updatedOrder;
            }
            
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
  
  // View order details in modal
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order; // Set initially to show loading state
    
    // Initialize the modal if it doesn't exist
    if (!this.orderDetailsModal) {
      const modalElement = document.getElementById('orderDetailsModal');
      if (modalElement) {
        this.orderDetailsModal = new bootstrap.Modal(modalElement);
      }
    }
    
    // Show the modal
    if (this.orderDetailsModal) {
      this.orderDetailsModal.show();
    }
    
    // Fetch detailed order information
    this.orderService.getOrderDetails(order._id).pipe(
      catchError(error => {
        console.error('Error fetching order details:', error);
        // Keep the basic order data if detailed fetch fails
        return of(order);
      })
    ).subscribe({
      next: (detailedOrder) => {
        this.selectedOrder = detailedOrder;
      }
    });
  }
  
  // Update the status of the currently selected order
  updateSelectedOrderStatus(status: string): void {
    if (this.selectedOrder) {
      this.isUpdatingStatus = true;
      
      // Use admin-specific cancellation method if cancelling
      const updateObservable = status === 'cancelled' 
        ? this.orderService.adminCancelOrder(this.selectedOrder._id)
        : this.orderService.updateOrderStatus(this.selectedOrder._id, status);
        
      updateObservable.pipe(
        catchError(error => {
          console.error('Error updating order status:', error);
          this.error = `Failed to update order status: ${error.message || 'Unknown error'}`;
          return of(null);
        }),
        finalize(() => {
          this.isUpdatingStatus = false;
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            console.log('Order status updated successfully:', response);
            
            // Update the order in the local arrays
            const allOrdersIndex = this.allOrders.findIndex(o => o._id === this.selectedOrder?._id);
            if (allOrdersIndex !== -1) {
              // Create a copy of the order with the updated status
              const updatedOrder = {...this.allOrders[allOrdersIndex], status: status};
              this.allOrders[allOrdersIndex] = updatedOrder;
              
              // Update the selected order
              this.selectedOrder = updatedOrder;
              
              // Reapply filters to update the filtered list
              this.applyFilters();
            }
          }
        }
      });
    }
  }
  
  // Get order items (handle both 'items' and 'products' properties)
  getOrderItems(order: Order): OrderItem[] {
    if (!order) return [];
    
    // @ts-ignore - handle both structures
    return order.products || order.items || [];
  }
  
  // Get product name from product object or ID
  getProductName(product: Product | string): string {
    if (!product) return 'Unknown Product';
    
    if (typeof product === 'string') {
      return `Product ID: ${product}`;
    }
    
    return product.name || 'Unknown Product';
  }
  
  // Calculate subtotal for an order
  calculateSubtotal(order: Order): number {
    if (!order) return 0;
    
    const items = this.getOrderItems(order);
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
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