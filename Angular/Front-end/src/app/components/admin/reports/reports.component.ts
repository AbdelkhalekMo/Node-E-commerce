import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html'
})
export class AdminReportsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  
  isLoading = true;
  error = '';
  adminName = '';
  
  stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0
  };
  
  ngOnInit(): void {
    this.loadReportsData();
  }
  
  loadReportsData(): void {
    this.isLoading = true;
    this.error = '';
    
    // Get admin name
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.adminName = user.name || 'Admin';
      },
      error: (err) => {
        console.error('Failed to load admin profile:', err);
        this.adminName = 'Admin';
      }
    });
    
    // Load dashboard stats which contain revenue info
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.error = 'Failed to load revenue data. Please try again.';
        this.isLoading = false;
      }
    });
  }
} 