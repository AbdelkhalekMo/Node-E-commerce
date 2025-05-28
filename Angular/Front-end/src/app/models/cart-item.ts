import { Product } from './product';

export interface CartItem {
  _id?: string;
  productId: string;
  product: Product;
  quantity: number;
}
