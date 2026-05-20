export interface PersonalData {
  id: string;
  name: string;
  surname: string;
  phone: string;
}

export interface Company {
  id: string;
  companyName: string;
  nip: string;
  region: string;
  city: string;
  address: string;
  zipCode: string;
  phone: string;
}

export interface Shipping {
  id: string;
  city: string;
  address: string;
  zipCode: string;
  orderName?: string;
}

export interface UserData {
  id: string;
  email: string;
  token: string;
  isActive: string;
  role: string;
  personalData?: PersonalData;
  company?: Company;
  shipping?: Shipping;
}
