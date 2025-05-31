import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { Order } from '../../../models/order';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order: Order | null = null;
  isLoading = true;
  error = '';
  isCancelling = false;

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  loadOrderDetails(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId) {
      this.error = 'Invalid order ID';
      this.isLoading = false;
      return;
    }

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading order details:', err);
        if (err.status === 403) {
          this.error = 'You do not have permission to view this order';
        } else if (err.status === 404) {
          this.error = 'Order not found';
        } else {
          this.error = 'Failed to load order details';
        }
        this.isLoading = false;
      }
    });
  }

  // Helper method to check if product is an object or just an ID string
  isProductObject(product: Product | string): product is Product {
    return typeof product !== 'string' && product !== null && product !== undefined;
  }

  getOrderStatus(order: Order): string {
    if (!order) return '';
    return order.status || '';
  }

  canCancelOrder(order: Order): boolean {
    if (!order) return false;
    const status = this.getOrderStatus(order);
    return status === 'pending' || status === 'processing';
  }

  confirmCancelOrder(): void {
    if (!this.order) return;
    
    if (confirm(`Are you sure you want to cancel this order? This action cannot be undone.`)) {
      this.cancelOrder();
    }
  }

  cancelOrder(): void {
    if (!this.order) return;
    
    this.isCancelling = true;
    const status = this.getOrderStatus(this.order);
    
    this.orderService.userCancelOrder(this.order._id, status).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.isCancelling = false;
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.error = err.message || 'Failed to cancel order';
        this.isCancelling = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
