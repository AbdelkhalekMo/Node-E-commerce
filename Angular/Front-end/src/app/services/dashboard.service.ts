import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
}

export interface RecentActivity {
  date: Date;
  activity: string;
  user: string;
  status: 'Completed' | 'Updated' | 'New' | 'Refund' | 'Added' | 'Cancelled';
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/analytics`;

  // Helper method to get HTTP options with credentials
  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    };
  }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard-stats`, this.getHttpOptions())
      .pipe(
        catchError(error => {
          console.error('Error fetching dashboard stats:', error);
          return of(this.getStatsFallback());
        })
      );
  }

  // Fallback method if API endpoints don't exist yet
  getStatsFallback(): DashboardStats {
    return {
      totalProducts: 48,
      totalOrders: 156,
      totalUsers: 327,
      revenue: 15840.75
    };
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/recent-activities`, this.getHttpOptions())
      .pipe(
        catchError(error => {
          console.error('Error fetching recent activities:', error);
          return of(this.getRecentActivitiesFallback());
        })
      );
  }

  // Fallback method for recent activities
  getRecentActivitiesFallback(): RecentActivity[] {
    const now = new Date();
    return [
      {
        date: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        activity: 'New order placed',
        user: 'customer123@example.com',
        status: 'Completed'
      },
      {
        date: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
        activity: 'Product stock updated',
        user: 'admin@example.com',
        status: 'Updated'
      },
      {
        date: new Date(now.getTime() - 240 * 60 * 1000), // 4 hours ago
        activity: 'New user registered',
        user: 'newuser@example.com',
        status: 'New'
      },
      {
        date: new Date(now.getTime() - 300 * 60 * 1000), // 5 hours ago
        activity: 'Order refunded',
        user: 'customer456@example.com',
        status: 'Refund'
      },
      {
        date: new Date(now.getTime() - 360 * 60 * 1000), // 6 hours ago
        activity: 'Product added',
        user: 'admin@example.com',
        status: 'Added'
      }
    ];
  }
} 