export interface Product {
  _id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  image?: string; // Some components use image, others use imageUrl
  category: string;
  quantity: number;
  stock?: number; // Added for backend compatibility
  isFeatured?: boolean; // Added for product-detail component
  createdAt?: Date;
  updatedAt?: Date;
}
