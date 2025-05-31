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
  styleUrls: ['./products.component.scss'],
  styles: [`
    .input-group-text {
      color: var(--gray-500);
      transition: all 0.3s ease;
    }
    
    .form-control:focus + .input-group-text {
      color: var(--primary-color);
    }
    
    .form-control, .form-select {
      transition: all 0.3s ease;
      border-color: var(--gray-300);
    }
    
    .form-control:focus, .form-select:focus {
      box-shadow: 0 0 0 0.25rem rgba(var(--primary-color-rgb, 63, 81, 181), 0.25);
      border-color: var(--primary-color);
    }
    
    .form-select {
      background-position: right 0.75rem center;
      cursor: pointer;
    }
    
    .btn-outline-secondary {
      transition: all 0.3s ease;
    }
    
    .btn-outline-secondary:hover:not(:disabled) {
      transform: translateY(-2px);
    }
    
    .badge {
      transition: all 0.3s ease;
    }
    
    .table tbody tr {
      transition: all 0.2s ease;
    }
    
    .table tbody tr:hover {
      background-color: rgba(var(--primary-color-rgb, 63, 81, 181), 0.05);
    }
    
    .btn-sm {
      transition: all 0.3s ease;
    }
    
    .btn-sm:hover {
      transform: translateY(-2px);
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  allProducts: Product[] = []; // Store all products for filtering
  selectedProduct: Product | null = null;
  isEditing = false;
  isLoading = false;
  error = '';
  successMessage = '';
  isAddingProduct = false;

  // Pagination properties
  currentPage = 1;
  pageSize = 20;
  totalProducts = 0;
  totalPages = 1;
  
  // Search and filter properties
  searchQuery = '';
  categoryFilter = 'all';
  priceFilter = 'all';
  stockFilter = 'all';
  featuredFilter = 'all';
  
  // Filter options
  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Kitchen' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'other', label: 'Other' }
  ];
  
  priceOptions = [
    { value: 'all', label: 'All Prices' },
    { value: 'under25', label: 'Under $25' },
    { value: '25to50', label: '$25 to $50' },
    { value: '50to100', label: '$50 to $100' },
    { value: 'over100', label: 'Over $100' }
  ];
  
  stockOptions = [
    { value: 'all', label: 'All Stock' },
    { value: 'instock', label: 'In Stock' },
    { value: 'lowstock', label: 'Low Stock (≤ 10)' },
    { value: 'outofstock', label: 'Out of Stock' }
  ];
  
  featuredOptions = [
    { value: 'all', label: 'All Products' },
    { value: 'featured', label: 'Featured Only' },
    { value: 'nonfeatured', label: 'Non-Featured Only' }
  ];

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

  checkForMissingProducts(): void {
    const searchName = "Men's Classic Fit Dress Shirt";
    console.log(`Checking if "${searchName}" exists in loaded products...`);
    
    const foundProduct = this.allProducts.find(p => 
      (p.name && p.name.includes(searchName)) || 
      (p.title && p.title.includes(searchName))
    );
    
    if (foundProduct) {
      console.log('Product found in allProducts:', foundProduct);
      
      // Check if it's in filtered products
      const inFiltered = this.filteredProducts.some(p => p._id === foundProduct._id);
      console.log('Product exists in filteredProducts:', inFiltered);
      
      if (!inFiltered) {
        console.log('Product exists in allProducts but not in filteredProducts!');
        console.log('Current filters:', {
          searchQuery: this.searchQuery,
          categoryFilter: this.categoryFilter,
          priceFilter: this.priceFilter,
          stockFilter: this.stockFilter,
          featuredFilter: this.featuredFilter
        });
      }
    } else {
      console.log(`Product "${searchName}" NOT FOUND in loaded products!`);
    }
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = '';
    
    console.log('Loading products for admin...');
    this.productService.getAllProducts(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        console.log('Raw product response:', response);
        
        // Handle paginated response
        if (isPaginatedResponse<Product>(response)) {
          console.log(`Received paginated response with ${response.docs.length} products out of ${response.totalDocs} total`);
          this.products = response.docs;
          this.allProducts = response.docs;
          this.totalProducts = response.totalDocs;
          this.totalPages = response.totalPages || Math.ceil(response.totalDocs / this.pageSize);
          this.currentPage = response.page || 1;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          console.log(`Received array response with ${response.length} products`);
          this.products = response;
          this.allProducts = response;
          this.totalProducts = response.length;
          this.totalPages = 1;
        } 
        // Fallback to empty array if not recognized format
        else {
          this.products = [];
          this.allProducts = [];
          console.error('Unexpected response format:', response);
          this.error = 'Received invalid data format from server';
        }
        
        console.log('Products before normalization:', this.allProducts.length);
        
        if (this.allProducts.length === 0) {
          console.warn('No products found in the response');
          // This might be an API or authentication issue
          this.error = 'No products found. Please check your connection or reload the page.';
        }
        
        // Normalize data to ensure consistent field usage
        this.normalizeProducts();
        
        // Apply any filters
        this.applyFilters();
        
        // Reset loading state
        this.isLoading = false;
        
        // Check for specific products for debugging
        setTimeout(() => this.checkForMissingProducts(), 500);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      }
    });
  }

  // Helper methods for pagination
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.loadProducts();
  }
  
  changePageSize(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.loadProducts();
  }
  
  // Normalize product data
  normalizeProducts(): void {
    this.allProducts = this.allProducts.map(product => {
      const normalizedProduct = { ...product };
      
      // Ensure name field is set
      if (!normalizedProduct.name && normalizedProduct.title) {
        normalizedProduct.name = normalizedProduct.title;
      } else if (!normalizedProduct.name) {
        normalizedProduct.name = 'Untitled Product';
      }
      
      // Ensure title field is set
      if (!normalizedProduct.title && normalizedProduct.name) {
        normalizedProduct.title = normalizedProduct.name;
      } else if (!normalizedProduct.title) {
        normalizedProduct.title = normalizedProduct.name || 'Untitled Product';
      }
      
      // Ensure image field is set
      if (!normalizedProduct.image && normalizedProduct.imageUrl) {
        normalizedProduct.image = normalizedProduct.imageUrl;
      } else if (!normalizedProduct.imageUrl && normalizedProduct.image) {
        normalizedProduct.imageUrl = normalizedProduct.image;
      } else if (!normalizedProduct.image && !normalizedProduct.imageUrl) {
        // Set default image if none exists
        normalizedProduct.image = 'https://via.placeholder.com/300';
        normalizedProduct.imageUrl = 'https://via.placeholder.com/300';
      }
      
      // Ensure stock field is set and is a number
      if (normalizedProduct.quantity !== undefined && normalizedProduct.stock === undefined) {
        normalizedProduct.stock = Number(normalizedProduct.quantity) || 0;
      } else if (normalizedProduct.stock !== undefined && normalizedProduct.quantity === undefined) {
        normalizedProduct.quantity = Number(normalizedProduct.stock) || 0;
      } else if (normalizedProduct.stock === undefined && normalizedProduct.quantity === undefined) {
        normalizedProduct.stock = 0;
        normalizedProduct.quantity = 0;
      } else {
        // Ensure stock is a number
        normalizedProduct.stock = Number(normalizedProduct.stock) || 0;
        normalizedProduct.quantity = Number(normalizedProduct.quantity) || 0;
      }
      
      // Ensure price is a number
      normalizedProduct.price = Number(normalizedProduct.price) || 0;
      
      // Ensure isFeatured is boolean
      if (normalizedProduct.isFeatured === undefined) {
        normalizedProduct.isFeatured = false;
      }
      
      return normalizedProduct;
    });
  }

  // Handle errors consistently
  handleError(err: HttpErrorResponse): void {
    this.isLoading = false;
    console.error('Error loading products:', err);
    
    if (err.status === 401) {
      this.error = 'Authentication required. Please log in again.';
      // Redirect to login
      this.router.navigate(['/auth/login']);
    } else if (err.status === 403) {
      this.error = 'You do not have permission to access product management.';
    } else if (err.status === 0) {
      this.error = 'Cannot connect to the server. Please check if the backend is running.';
    } else {
      this.error = `Failed to load products: ${err.status} ${err.statusText}`;
    }
  }

  // Apply search and filters
  applyFilters(): void {
    console.log('Applying filters with criteria:', {
      search: this.searchQuery,
      category: this.categoryFilter,
      price: this.priceFilter,
      stock: this.stockFilter,
      featured: this.featuredFilter
    });
    
    // Store the original count for debugging
    const originalCount = this.allProducts.length;
    
    // Start with all products
    this.filteredProducts = [...this.allProducts];
    console.log(`Starting with ${this.filteredProducts.length} products`);
    
    // Apply search query
    if (this.searchQuery.trim() !== '') {
      const search = this.searchQuery.toLowerCase().trim();
      const beforeCount = this.filteredProducts.length;
      
      this.filteredProducts = this.filteredProducts.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(search);
        const titleMatch = product.title?.toLowerCase().includes(search);
        const descMatch = product.description?.toLowerCase().includes(search);
        
        return nameMatch || titleMatch || descMatch;
      });
      
      console.log(`After search filter: ${this.filteredProducts.length} products (removed ${beforeCount - this.filteredProducts.length})`);
    }
    
    // Apply category filter
    if (this.categoryFilter !== 'all') {
      const beforeCount = this.filteredProducts.length;
      
      this.filteredProducts = this.filteredProducts.filter(product => {
        // Make sure to handle case insensitivity
        const productCategory = (product.category || '').toLowerCase();
        const filterCategory = this.categoryFilter.toLowerCase();
        
        // Debug any product that would be filtered out
        if (productCategory !== filterCategory) {
          console.log(`Product category mismatch - Product: "${product.name}", Category: "${productCategory}", Filter: "${filterCategory}"`);
        }
        
        return productCategory === filterCategory;
      });
      
      console.log(`After category filter: ${this.filteredProducts.length} products (removed ${beforeCount - this.filteredProducts.length})`);
    }
    
    // Apply price filter
    if (this.priceFilter !== 'all') {
      const beforeCount = this.filteredProducts.length;
      
      this.filteredProducts = this.filteredProducts.filter(product => {
        const price = product.price || 0;
        
        switch (this.priceFilter) {
          case 'under25':
            return price < 25;
          case '25to50':
            return price >= 25 && price <= 50;
          case '50to100':
            return price > 50 && price <= 100;
          case 'over100':
            return price > 100;
          default:
            return true;
        }
      });
      
      console.log(`After price filter: ${this.filteredProducts.length} products (removed ${beforeCount - this.filteredProducts.length})`);
    }
    
    // Apply stock filter
    if (this.stockFilter !== 'all') {
      const beforeCount = this.filteredProducts.length;
      
      this.filteredProducts = this.filteredProducts.filter(product => {
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        
        switch (this.stockFilter) {
          case 'instock':
            return stock > 0;
          case 'lowstock':
            return stock > 0 && stock <= 10;
          case 'outofstock':
            return stock <= 0;
          default:
            return true;
        }
      });
      
      console.log(`After stock filter: ${this.filteredProducts.length} products (removed ${beforeCount - this.filteredProducts.length})`);
    }
    
    // Apply featured filter
    if (this.featuredFilter !== 'all') {
      const beforeCount = this.filteredProducts.length;
      
      this.filteredProducts = this.filteredProducts.filter(product => {
        // Only check for isFeatured property, as 'featured' doesn't exist on Product type
        const isFeatured = product.isFeatured === true;
        
        if (this.featuredFilter === 'featured') {
          return isFeatured;
        } else if (this.featuredFilter === 'nonfeatured') {
          return !isFeatured;
        }
        
        return true;
      });
      
      console.log(`After featured filter: ${this.filteredProducts.length} products (removed ${beforeCount - this.filteredProducts.length})`);
    }
    
    // Update products list
    this.products = [...this.filteredProducts];
    
    // Log final filtering results
    console.log(`Filtering complete: ${originalCount} → ${this.filteredProducts.length} products`);
    
    // Warn if all products were filtered out
    if (this.filteredProducts.length === 0 && originalCount > 0) {
      console.warn('All products were filtered out! Current filters may be too restrictive.');
    }
  }
  
  // Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.priceFilter = 'all';
    this.stockFilter = 'all';
    this.featuredFilter = 'all';
    this.applyFilters();
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
      this.newProduct.name = this.newProduct.title || '';
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
