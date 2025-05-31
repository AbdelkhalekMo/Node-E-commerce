export interface Product {
  _id: string;
  name: string;
  title?: string; // Make title optional since backend uses name primarily
  description: string;
  price: number;
  imageUrl?: string;
  image?: string; // Some components use image, others use imageUrl
  category: string;
  quantity?: number; // Make quantity optional
  stock: number; // Required field to fix TypeScript errors
  isFeatured?: boolean; // Added for product-detail component
  averageRating?: number; // Add field from backend model
  ratings?: ProductRating[]; // Add field from backend model
  createdAt?: Date;
  updatedAt?: Date;
}

// Add rating interface to match backend model
export interface ProductRating {
  user?: string;
  rating: number;
  review?: string;
}
