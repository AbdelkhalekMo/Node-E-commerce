import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../models/product';
import { ProductService, PaginatedResponse, isPaginatedResponse } from '../../../services/product.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  selectedProduct: Product | null = null;
  isEditing = false;
  isLoading = false;
  error = '';
  successMessage = '';
  isAddingProduct = false;

  newProduct: Product = {
    _id: '',
    name: '',
    title: '',
    description: '',
    price: 0,
    imageUrl: '',
    image: '',
    category: '',
    stock: 0,
    quantity: 0,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        // Handle paginated response
        if (isPaginatedResponse<Product>(response)) {
          this.products = response.docs;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          this.products = response;
        } 
        // Fallback to empty array if not recognized format
        else {
          this.products = [];
          console.error('Unexpected response format:', response);
          this.error = 'Received invalid data format from server';
        }
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error loading products:', err);
        
        // Handle specific HTTP error codes
        if (err.status === 403) {
          this.error = 'You do not have permission to view these products. Please log in as an administrator.';
          // Optionally redirect to login page
          // this.router.navigate(['/login']);
        } else if (err.status === 401) {
          this.error = 'Authentication required. Please log in to manage products.';
          // Optionally redirect to login
          // this.router.navigate(['/login']);
        } else {
          this.error = 'Failed to load products. Please try again.';
        }
      }
    });
  }

  toggleAddProductForm(): void {
    this.isAddingProduct = !this.isAddingProduct;
    if (!this.isAddingProduct) {
      this.resetForm();
    }
  }

  addProduct(): void {
    this.isLoading = true;
    this.error = '';
    this.clearMessages();
    
    // Ensure required fields are set
    if (!this.newProduct.name) {
      this.newProduct.name = this.newProduct.title;
    }
    
    if (!this.newProduct.image && this.newProduct.imageUrl) {
      this.newProduct.image = this.newProduct.imageUrl;
    }
    
    // Ensure stock is set (backend requires this)
    if (!this.newProduct.stock && this.newProduct.quantity) {
      this.newProduct.stock = this.newProduct.quantity;
    }
    
    console.log('Submitting product:', this.newProduct);
    
    this.productService.createProduct(this.newProduct).subscribe({
      next: (product) => {
        console.log('Product created successfully:', product);
        this.successMessage = 'Product added successfully!';
        this.loadProducts();
        this.resetForm();
        this.isAddingProduct = false;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error adding product:', err);
        
        if (err.status === 403) {
          this.error = 'You do not have permission to add products. Please log in as an administrator.';
        } else if (err.status === 401) {
          this.error = 'Authentication required. Please log in to manage products.';
        } else if (err.status === 400 && err.error?.errors) {
          this.error = `Validation error: ${err.error.errors.map((e: any) => e.msg).join(', ')}`;
        } else if (err.status === 404) {
          this.error = 'API endpoint not found. Please check server configuration.';
        } else {
          this.error = `Failed to add product: ${err.message || 'Unknown error'}`;
        }
      }
    });
  }

  editProduct(product: Product): void {
    this.selectedProduct = { ...product };
    this.isEditing = true;
  }

  updateProduct(): void {
    if (!this.selectedProduct) return;
    
    this.isLoading = true;
    this.error = '';
    this.clearMessages();
    
    // Ensure required fields are set
    if (!this.selectedProduct.name) {
      this.selectedProduct.name = this.selectedProduct.title || '';
    }
    
    if (!this.selectedProduct.image && this.selectedProduct.imageUrl) {
      this.selectedProduct.image = this.selectedProduct.imageUrl;
    }
    
    // Ensure stock is set (backend requires this)
    if (!this.selectedProduct.stock && this.selectedProduct.quantity) {
      this.selectedProduct.stock = this.selectedProduct.quantity;
    }
    
    console.log('Updating product:', this.selectedProduct);
    
    this.productService.updateProduct(this.selectedProduct._id!, this.selectedProduct).subscribe({
      next: (updatedProduct) => {
        console.log('Product updated successfully:', updatedProduct);
        this.successMessage = 'Product updated successfully!';
        this.loadProducts();
        this.cancelEdit();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        console.error('Error updating product:', err);
        
        if (err.status === 403) {
          this.error = 'You do not have permission to update products. Please log in as an administrator.';
        } else if (err.status === 401) {
          this.error = 'Authentication required. Please log in to manage products.';
        } else if (err.status === 404) {
          this.error = 'Product not found or API endpoint not available.';
        } else if (err.status === 400 && err.error?.errors) {
          this.error = `Validation error: ${err.error.errors.join(', ')}`;
        } else {
          this.error = `Failed to update product: ${err.message || 'Unknown error'}`;
        }
      }
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.isLoading = true;
      this.error = '';
      this.clearMessages();
      
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.successMessage = 'Product deleted successfully!';
          this.loadProducts();
          this.isLoading = false;
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Error deleting product:', err);
          
          if (err.status === 403) {
            this.error = 'You do not have permission to delete products. Please log in as an administrator.';
          } else if (err.status === 401) {
            this.error = 'Authentication required. Please log in to manage products.';
          } else if (err.status === 404) {
            this.error = 'Product not found or API endpoint not available.';
            // Remove from local array if server can't find it
            this.products = this.products.filter(p => p._id !== id);
          } else {
            this.error = `Failed to delete product: ${err.message || 'Unknown error'}`;
          }
        }
      });
    }
  }

  cancelEdit(): void {
    this.selectedProduct = null;
    this.isEditing = false;
  }

  resetForm(): void {
    this.newProduct = {
      _id: '',
      name: '',
      title: '',
      description: '',
      price: 0,
      imageUrl: '',
      image: '',
      category: '',
      stock: 0,
      quantity: 0,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }
}
