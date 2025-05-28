import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  
  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  get cartItemsCount() {
    return this.cartService.cartItemsCount;
  }
  
  logout() {
    this.authService.logout().subscribe();
  }
}
