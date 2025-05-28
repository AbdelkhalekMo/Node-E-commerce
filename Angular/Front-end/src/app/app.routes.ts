import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { customerGuard } from './guards/customer.guard';
import { adminOnlyGuard } from './guards/admin-only.guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'products', 
    children: [
      { 
        path: '', 
        loadComponent: () => import('././components/products/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      { 
        path: 'category/:category', 
        loadComponent: () => import('././components/products/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      { 
        path: ':id', 
        loadComponent: () => import('./components/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      }
    ]
  },
  { 
    path: 'cart', 
    loadComponent: () => import('././components/cart/cart.component').then(m => m.CartComponent),
    canActivate: [customerGuard]
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./components/cart/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [customerGuard]
  },
  { 
    path: 'checkout/success', 
    loadComponent: () => import('././components/cart/checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent),
    canActivate: [customerGuard]
  },
  { 
    path: 'auth', 
    children: [
      { 
        path: 'login', 
        loadComponent: () => import('././components/auth/login/login.component').then(m => m.LoginComponent) 
      },
      { 
        path: 'register', 
        loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) 
      }
    ]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('././components/user/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'orders', 
    loadComponent: () => import('././components/user/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [customerGuard],
    data: { activeTab: 'orders' }
  },
  { 
    path: 'admin', 
    children: [
      { 
        path: '', 
        loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'products', 
        loadComponent: () => import('./components/admin/products/products.component').then(m => m.AdminProductsComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'orders', 
        loadComponent: () => import('./components/admin/orders/orders.component').then(m => m.AdminOrdersComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'users', 
        loadComponent: () => import('./components/admin/users/users.component').then(m => m.AdminUsersComponent),
        canActivate: [adminGuard]
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./components/admin/reports/reports.component').then(m => m.AdminReportsComponent),
        canActivate: [adminGuard]
      }
    ]
  },
  { 
    path: '**', 
    loadComponent: () => import('././components/shared/not-found/not-found.component').then(m => m.NotFoundComponent) 
  }
];
