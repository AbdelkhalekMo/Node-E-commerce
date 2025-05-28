import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  formData = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  isSubmitting = false;
  error = '';
  showPassword = false;
  successMessage = '';
  
  ngOnInit(): void {
    // Check if user has just registered
    const registered = this.route.snapshot.queryParams['registered'];
    if (registered === 'true') {
      this.successMessage = 'Registration successful! Please log in with your new account.';
    }
    
    // Check if user was redirected due to authentication
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.error = 'Please log in to access that page.';
    }
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  login(form: NgForm): void {
    if (form.invalid) return;
    
    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';
    
    this.authService.login(this.formData.email, this.formData.password, this.formData.rememberMe).subscribe({
      next: () => {
        this.isSubmitting = false;
        
        // Navigate to the return URL or home page
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        console.error(err);
      }
    });
  }
}
