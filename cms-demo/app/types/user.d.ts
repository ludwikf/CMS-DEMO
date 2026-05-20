export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersProps {
  users: User[];
}
