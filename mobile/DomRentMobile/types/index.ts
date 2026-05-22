/**
 * Интерфейс для объекта недвижимости
 */
export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  city: string;
  type: string;
  images: string[];
  ownerId: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Интерфейс для владельца объекта
 */
export interface PropertyOwner {
  id: number;
  name?: string;
  email: string;
  phone?: string;
}

/**
 * Интерфейс для объекта с информацией владельца
 */
export interface PropertyWithOwner extends Property {
  owner?: PropertyOwner;
}

/**
 * Интерфейс для пользователя
 */
export interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  role: 'USER' | 'LANDLORD';
  telegramId?: string;
}

/**
 * Интерфейс для ответа аутентификации
 */
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Интерфейс для брони
 */
export interface Booking {
  id: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  userId: number;
  propertyId: number;
  createdAt: string;
  property?: PropertyWithOwner;
}

/**
 * Интерфейс для избранных объектов
 */
export interface Favorite {
  id: number;
  userId: number;
  propertyId: number;
  property?: Property;
}

/**
 * Интерфейс для API ответа со списком объектов
 */
export interface ListResponse<T> {
  total?: number;
  count?: number;
  data?: T[];
}
