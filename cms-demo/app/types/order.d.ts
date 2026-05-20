export type Order = {
  id: string;
  orderNumber: string;
  orderName: string;
  status: OrderStatus;
  totalAmount?: number;
  finishedAt: string;
  deliveryMethod: string;
  city?: string;
  address?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItemType = {
  id: string;
  product: string;
  type: string;
  width?: number | string;
  height?: number | string;
  material?: string;
  color?: string;
  quantity: number;
  note?: string;
  price?: number;
  
  [key: string]: unknown;
};

export type OrderWithItems = Order & {
  userId?: string;
  userEmail?: string | null;
  items: OrderItemType[];
};
