import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  
  users: User[] = [];
  isLoading = true;
  error = '';
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.isLoading = true;
    this.error = '';
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Failed to load users. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  updateUserRole(user: User, makeAdmin: boolean = true): void {
    if (!user._id) {
      this.error = 'Cannot update user: Missing user ID';
      return;
    }
    
    this.isLoading = true;
    const role = makeAdmin ? 'admin' : 'customer';
    
    this.userService.updateUserRole(user._id, role).subscribe({
      next: () => {
        // Refresh users list
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error updating user role:', err);
        this.error = 'Failed to update user role. Please try again.';
        this.isLoading = false;
      }
    });
  }
} 