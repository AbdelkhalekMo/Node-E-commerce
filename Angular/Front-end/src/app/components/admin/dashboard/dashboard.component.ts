import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DashboardService, DashboardStats, RecentActivity } from '../../../services/dashboard.service';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  
  isLoading = true;
  error = '';
  adminName = '';
  
  stats: DashboardStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0
  };
  
  recentActivities: RecentActivity[] = [];
  
  ngOnInit(): void {
    // Load admin profile
    this.authService.getProfile().pipe(
      catchError(error => {
        console.error('Failed to load admin profile:', error);
        return of({ name: 'Admin' });
      })
    ).subscribe({
      next: (user) => {
        this.adminName = user.name || 'Admin';
        this.loadDashboardData();
      }
    });
  }
  
  private loadDashboardData(): void {
    // Use fallback data immediately to ensure something is displayed
    this.stats = this.dashboardService.getStatsFallback();
    this.recentActivities = this.dashboardService.getRecentActivitiesFallback();
    
    // Then try to load real data
    this.dashboardService.getStats().pipe(
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        return of(this.dashboardService.getStatsFallback());
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
      }
    });
    
    this.dashboardService.getRecentActivities().pipe(
      catchError(error => {
        console.error('Error fetching recent activities:', error);
        return of(this.dashboardService.getRecentActivitiesFallback());
      })
    ).subscribe({
      next: (activities) => {
        this.recentActivities = activities;
      }
    });
    
    // Ensure loading state ends after a reasonable timeout
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  // Add retry method
  retryLoadData(): void {
    this.isLoading = true;
    this.error = '';
    this.loadDashboardData();
  }
}
