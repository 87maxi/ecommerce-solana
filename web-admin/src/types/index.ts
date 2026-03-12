// Tipos comunes para la aplicación

export type Company = {
  id: string;
  owner: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  price: string;
  imageHash: string;
  stock: number;
  isActive: boolean;
};

export type Customer = {
  id: string;
  address: string;
  name: string;
  email: string;
  registeredAt: string;
  isActive: boolean;
};

export type Order = {
  id: string;
  customerId: string;
  companyId: string;
  products: OrderProduct[];
  totalAmount: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
};

export type OrderProduct = {
  productId: string;
  quantity: number;
  price: string;
};

export type Transaction = {
  id: string;
  type: string;
  amount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
};

export type Stats = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
};
