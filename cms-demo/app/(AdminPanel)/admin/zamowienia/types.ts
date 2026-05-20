export interface Order {
  id: string;
  orderNumber: string;
  orderName?: string;
  status:
    | "UNCONFIRMED"
    | "PENDING"
    | "IN_PROGRESS"
    | "CONFIRMED"
    | "DELIVERED"
    | "CANCELLED"
    | "FINISHED";
  shipping?: { method?: string } | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    email: string;
    name?: string | null;
  };
  totalAmount: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OrdersTableProps {
  initialOrders: Order[];
  initialPagination: PaginationData;
  currentPage: number;
  currentLimit: number;
}
