export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  city: string;
  images: string[];
  type: 'квартира' | 'дом' | 'комната';
  ownerId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyOwner {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
}

export interface PropertyWithOwner extends Property {
  owner: PropertyOwner;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'USER' | 'LANDLORD';
  telegramId: string | null;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  userId: number;
  propertyId: number;
  createdAt: string;
  property?: Property;
}

export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  property?: Property;
}
