export interface User {
  _id?: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: 'admin' | 'customer';
  createdAt?: Date;
  updatedAt?: Date;
}
