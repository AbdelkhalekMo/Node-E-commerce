import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { User } from '../../../models/user';
import { Order } from '../../../models/order';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  user: User | null = null;
  orders: Order[] = [];
  activeTab = 'profile'; // options: profile, orders
  isLoading = true;
  error = '';
  successMessage = '';
  
  // For profile editing
  editMode = false;
  editableUser: User | null = null;
  
  // For password change
  showPasswordForm = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError = '';

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.editableUser = { ...user }; // Create a copy for editing
        this.isLoading = false;
        this.loadUserOrders();
      },
      error: (err) => {
        this.error = 'Failed to load user profile';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadUserOrders(): void {
    this.orderService.getUserOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
      }
    });
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

  changeTab(tab: string): void {
    this.activeTab = tab;
  }
  
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Reset editable user when cancelling
      this.editableUser = { ...this.user! };
    }
    this.clearMessages();
  }
  
  updateProfile(): void {
    if (!this.editableUser) return;
    
    this.isLoading = true;
    this.clearMessages();
    
    this.authService.updateProfile(this.editableUser).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.editableUser = { ...updatedUser };
        this.successMessage = 'Profile updated successfully!';
        this.editMode = false;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (this.showPasswordForm) {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
    this.clearMessages();
  }
  
  changePassword(): void {
    // Validate passwords
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'New passwords do not match';
      return;
    }
    
    if (this.passwordData.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters';
      return;
    }
    
    this.isLoading = true;
    this.clearMessages();
    
    this.authService.changePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully!';
        this.showPasswordForm = false;
        this.isLoading = false;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Navigation will be handled by the auth interceptor
      },
      error: (err) => {
        console.error('Error during logout:', err);
      }
    });
  }
  
  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
    this.passwordError = '';
  }
}
