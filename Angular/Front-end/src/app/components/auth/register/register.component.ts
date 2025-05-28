import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false
  };
  
  isSubmitting = false;
  error = '';
  showPassword = false;
  passwordMismatch = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';
  passwordStrengthTextClass = '';
  passwordStrengthIconClass = '';
  
  ngOnInit(): void {
    // Check if there's a registration success message in the query params
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  checkPasswordStrength(password: string): void {
    // Calculate password strength
    let strength = 0;
    
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      this.passwordStrengthTextClass = '';
      this.passwordStrengthIconClass = '';
      return;
    }
    
    // Award points for length
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (password.length >= 10) strength += 10;
    
    // Award points for complexity
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase letters
    if (/[a-z]/.test(password)) strength += 15; // Lowercase letters
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Special characters
    
    this.passwordStrength = Math.min(100, strength);
    
    // Set text and classes based on strength
    if (this.passwordStrength < 30) {
      this.passwordStrengthText = 'Very Weak';
      this.passwordStrengthClass = 'bg-danger';
      this.passwordStrengthTextClass = 'text-danger';
      this.passwordStrengthIconClass = 'fa-exclamation-circle';
    } else if (this.passwordStrength < 60) {
      this.passwordStrengthText = 'Weak';
      this.passwordStrengthClass = 'bg-warning';
      this.passwordStrengthTextClass = 'text-warning';
      this.passwordStrengthIconClass = 'fa-exclamation-triangle';
    } else if (this.passwordStrength < 80) {
      this.passwordStrengthText = 'Good';
      this.passwordStrengthClass = 'bg-info';
      this.passwordStrengthTextClass = 'text-info';
      this.passwordStrengthIconClass = 'fa-info-circle';
    } else {
      this.passwordStrengthText = 'Strong';
      this.passwordStrengthClass = 'bg-success';
      this.passwordStrengthTextClass = 'text-success';
      this.passwordStrengthIconClass = 'fa-check-circle';
    }
  }
  
  checkPasswordMatch(): void {
    this.passwordMismatch = this.formData.password !== this.formData.confirmPassword && this.formData.confirmPassword !== '';
  }
  
  register(form: NgForm): void {
    if (form.invalid) return;
    
    if (this.formData.password !== this.formData.confirmPassword) {
      this.passwordMismatch = true;
      this.error = 'Passwords do not match';
      return;
    }
    
    if (!this.formData.termsAgreed) {
      this.error = 'You must agree to the terms and conditions';
      return;
    }
    
    this.isSubmitting = true;
    this.error = '';
    
    const userData = {
      name: this.formData.name,
      email: this.formData.email,
      password: this.formData.password
    };
    
    this.authService.signup(userData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/auth/login'], { queryParams: { registered: 'true' } });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
        console.error(err);
      }
    });
  }
}
