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
  
  // Report action methods
  downloadRevenueReport(): void {
    const reportData = this.generateReportData();
    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  printRevenueReport(): void {
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      const reportContent = this.generateReportHtml();
      reportWindow.document.write(reportContent);
      reportWindow.document.close();
      
      // Wait for resources to load then print
      setTimeout(() => {
        reportWindow.print();
      }, 250);
    } else {
      this.error = 'Pop-up blocked. Please allow pop-ups for printing reports.';
    }
  }
  
  emailRevenueReport(): void {
    // In a real app, this would send a request to the backend to email the report
    // For now, we'll simulate success with a timeout
    this.isLoading = true;
    
    setTimeout(() => {
      this.isLoading = false;
      alert('Revenue report has been sent to the registered admin email address.');
    }, 1000);
  }
  
  // Helper methods for report generation
  private generateReportData(): string {
    const headers = 'Metric,Value\n';
    const rows = [
      `Total Revenue,$${this.stats.revenue.toFixed(2)}`,
      `Total Orders,${this.stats.totalOrders}`,
      `Average Order Value,$${this.stats.totalOrders > 0 ? (this.stats.revenue / this.stats.totalOrders).toFixed(2) : '0.00'}`,
      `Products in Catalog,${this.stats.totalProducts}`,
      `Registered Users,${this.stats.totalUsers}`,
      `Report Date,${new Date().toLocaleDateString()}`
    ].join('\n');
    
    return headers + rows;
  }
  
  private generateReportHtml(): string {
    const avgOrderValue = this.stats.totalOrders > 0 ? 
      (this.stats.revenue / this.stats.totalOrders).toFixed(2) : '0.00';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revenue Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #3f51b5; }
          .report-container { max-width: 800px; margin: 0 auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
          .total { font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="report-container">
          <h1>Revenue Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Total Revenue</td>
              <td class="total">$${this.stats.revenue.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Orders</td>
              <td>${this.stats.totalOrders}</td>
            </tr>
            <tr>
              <td>Average Order Value</td>
              <td>$${avgOrderValue}</td>
            </tr>
            <tr>
              <td>Products in Catalog</td>
              <td>${this.stats.totalProducts}</td>
            </tr>
            <tr>
              <td>Registered Users</td>
              <td>${this.stats.totalUsers}</td>
            </tr>
          </table>
          
          <div class="footer">
            <p>This report is confidential and intended for authorized personnel only.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}