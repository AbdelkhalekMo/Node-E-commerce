import { User } from './user';
import { Product } from './product';

export interface OrderItem {
  product: Product | string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  updateTime: string;
  emailAddress: string;
}

export interface Order {
  _id: string;
  user: User | string;
  items?: OrderItem[]; // For backward compatibility
  products?: OrderItem[]; // Matches backend model
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  totalAmount: number;
  status?: string; // New field that matches backend
  orderStatus?: 'processing' | 'shipped' | 'delivered' | 'cancelled'; // For backward compatibility
  paymentStatus?: string; // Matches backend
  shippingMethod?: string; // Matches backend
  discountAmount?: number; // Matches backend
  couponCode?: string; // Coupon code used
  couponDiscount?: number; // Discount percentage from coupon
  createdAt: Date;
  updatedAt: Date;
}
