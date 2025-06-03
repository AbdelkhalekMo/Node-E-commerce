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
  isLoadingActivities = false;
  error = '';
  adminName = '';
  
  stats: DashboardStats = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0
  };
  
  recentActivities: RecentActivity[] = [];
  activitiesPage = 0;
  activitiesLimit = 10;
  hasMoreActivities = true;
  
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
    
    this.loadActivities();
    
    // Ensure loading state ends after a reasonable timeout
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  loadActivities(append: boolean = false): void {
    if (!append) {
      this.activitiesPage = 0;
      this.recentActivities = [];
    }
    
    this.isLoadingActivities = true;
    const skip = this.activitiesPage * this.activitiesLimit;
    
    this.dashboardService.getRecentActivities(this.activitiesLimit, skip).pipe(
      catchError(error => {
        console.error('Error fetching recent activities:', error);
        return of(this.dashboardService.getRecentActivitiesFallback());
      }),
      finalize(() => {
        this.isLoadingActivities = false;
      })
    ).subscribe({
      next: (activities) => {
        if (append) {
          this.recentActivities = [...this.recentActivities, ...activities];
        } else {
          this.recentActivities = activities;
        }
        
        // Check if we've reached the end of the activities
        this.hasMoreActivities = activities.length === this.activitiesLimit;
      }
    });
  }
  
  loadMoreActivities(): void {
    if (this.isLoadingActivities || !this.hasMoreActivities) return;
    
    this.activitiesPage++;
    this.loadActivities(true);
  }
  
  refreshActivities(): void {
    this.activitiesPage = 0;
    this.loadActivities();
  }
  
  // Add retry method
  retryLoadData(): void {
    this.isLoading = true;
    this.error = '';
    this.loadDashboardData();
  }
  
  // Helper method to format date as a readable string
  formatActivityDate(date: Date): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return activityDate.toLocaleDateString();
  }
  
  // Navigate to entity details based on activity type
  navigateToEntity(activity: RecentActivity): string | null {
    if (!activity.entityId || !activity.entityType) return null;
    
    switch (activity.entityType) {
      case 'product':
        return `/admin/products/${activity.entityId}`;
      case 'order':
        return `/admin/orders/${activity.entityId}`;
      case 'user':
        return `/admin/users/${activity.entityId}`;
      default:
        return null;
    }
  }
}
