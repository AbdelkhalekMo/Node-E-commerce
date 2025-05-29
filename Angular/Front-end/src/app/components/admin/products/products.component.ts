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
    this.productService.getAllProducts().subscribe({
      next: (response) => {
        console.log('Raw product response:', response);
        
        // Handle paginated response
        if (isPaginatedResponse<Product>(response)) {
          console.log(`Received paginated response with ${response.docs.length} products out of ${response.totalDocs} total`);
          this.allProducts = response.docs;
        } 
        // If response is already an array
        else if (Array.isArray(response)) {
          console.log(`Received array response with ${response.length} products`);
          this.allProducts = response;
        } 
        // Fallback to empty array if not recognized format
        else {
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
          
          // Ensure stock field is set
          if (normalizedProduct.quantity !== undefined && normalizedProduct.stock === undefined) {
            normalizedProduct.stock = normalizedProduct.quantity;
          } else if (normalizedProduct.stock !== undefined && normalizedProduct.quantity === undefined) {
            normalizedProduct.quantity = normalizedProduct.stock;
          } else if (normalizedProduct.stock === undefined && normalizedProduct.quantity === undefined) {
            normalizedProduct.stock = 0;
            normalizedProduct.quantity = 0;
          }
          
          // Ensure isFeatured is boolean
          if (normalizedProduct.isFeatured === undefined) {
            normalizedProduct.isFeatured = false;
          }
          
          // Ensure category is lowercase for consistent filtering
          if (normalizedProduct.category) {
            normalizedProduct.category = normalizedProduct.category.toLowerCase();
          } else {
            normalizedProduct.category = 'other';
          }
          
          return normalizedProduct;
        });
        
        console.log('Products after normalization:', this.allProducts.length);
        
        this.products = [...this.allProducts];
        this.filteredProducts = [...this.allProducts];
        this.applyFilters(); // Apply any existing filters
        this.isLoading = false;
        
        // Check for specific missing products
        setTimeout(() => this.checkForMissingProducts(), 500);
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
        } else if (err.status === 0) {
          this.error = 'Network error. Please check your internet connection and try again.';
        } else {
          this.error = `Failed to load products: ${err.message || 'Unknown error'}`;
        }
      }
    });
  }
  
  // Apply search and filters
  applyFilters(): void {
    console.log('Applying filters with:', {
      searchQuery: this.searchQuery,
      categoryFilter: this.categoryFilter,
      priceFilter: this.priceFilter,
      stockFilter: this.stockFilter,
      featuredFilter: this.featuredFilter
    });
    
    console.log('Starting with', this.allProducts.length, 'products');
    
    // Check if allProducts is empty
    if (this.allProducts.length === 0) {
      console.warn('No products to filter');
      this.filteredProducts = [];
      return;
    }
    
    let result = [...this.allProducts];
    
    // Apply category filter
    if (this.categoryFilter !== 'all') {
      result = result.filter(product => {
        // Handle case insensitivity and missing category
        const productCategory = (product.category || '').toLowerCase();
        return productCategory === this.categoryFilter.toLowerCase();
      });
      console.log(`After category filter (${this.categoryFilter}):`, result.length, 'products');
    }
    
    // Apply price filter
    if (this.priceFilter !== 'all') {
      result = result.filter(product => {
        // Handle missing price
        const price = product.price || 0;
        let matches = false;
        switch (this.priceFilter) {
          case 'under25':
            matches = price < 25;
            break;
          case '25to50':
            matches = price >= 25 && price <= 50;
            break;
          case '50to100':
            matches = price > 50 && price <= 100;
            break;
          case 'over100':
            matches = price > 100;
            break;
          default:
            matches = true;
        }
        return matches;
      });
      console.log(`After price filter (${this.priceFilter}):`, result.length, 'products');
    }
    
    // Apply stock filter
    if (this.stockFilter !== 'all') {
      result = result.filter(product => {
        // Use stock or quantity or default to 0
        const stock = product.stock ?? product.quantity ?? 0;
        let matches = false;
        switch (this.stockFilter) {
          case 'instock':
            matches = stock > 0;
            break;
          case 'lowstock':
            matches = stock > 0 && stock <= 10;
            break;
          case 'outofstock':
            matches = stock <= 0;
            break;
          default:
            matches = true;
        }
        return matches;
      });
      console.log(`After stock filter (${this.stockFilter}):`, result.length, 'products');
    }
    
    // Apply featured filter
    if (this.featuredFilter !== 'all') {
      result = result.filter(product => {
        // Handle undefined isFeatured (treat as false)
        const isFeatured = product.isFeatured ?? false;
        let matches = false;
        switch (this.featuredFilter) {
          case 'featured':
            matches = isFeatured === true;
            break;
          case 'nonfeatured':
            matches = isFeatured === false;
            break;
          default:
            matches = true;
        }
        return matches;
      });
      console.log(`After featured filter (${this.featuredFilter}):`, result.length, 'products');
    }
    
    // Apply search filter if there's a query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter(product => {
        // Handle potentially undefined fields
        const name = (product.name || '').toLowerCase();
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        const matches = name.includes(query) || 
               title.includes(query) || 
               description.includes(query) || 
               category.includes(query);
               
        return matches;
      });
      console.log(`After search query (${this.searchQuery}):`, result.length, 'products');
    }
    
    this.filteredProducts = result;
    console.log('Final filtered products:', this.filteredProducts.length);
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
