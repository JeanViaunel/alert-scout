export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AlertType = 'property' | 'product';

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  name: string;
  criteria: PropertyCriteria | ProductCriteria | EcommerceCriteria;
  sources: string[];
  isActive: boolean;
  checkFrequency: '5min' | '15min' | '30min' | '1hour' | 'daily';
  lastChecked?: Date;
  lastMatchCount: number;
  createdAt: Date;
  notifyMethods: ('app' | 'email' | 'whatsapp')[];
}

export interface PropertyCriteria {
  city?: string;
  districts?: string[];
  minPrice?: number;
  maxPrice?: number;
  minPing?: number;
  maxPing?: number;
  propertyType?: string[];
  rooms?: number;
  keywords?: string[];
}

export interface ProductCriteria {
  source?: string;
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  specs?: Record<string, string>;
  keywords?: string[];
}

export type Platform = '591' | 'momo' | 'pchome' | 'amazon' | 'shopee' | 'custom';

export interface EcommerceCriteria {
  url?: string;
  platform: Platform;
  searchQuery?: string;
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  // Amazon-specific
  asin?: string;
  condition?: 'new' | 'used' | 'any';
  minRating?: number;
  primeOnly?: boolean;
  // Shopee / Momo / PChome
  inStockOnly?: boolean;
  shopName?: string;
  // Custom / fallback
  keywords?: string[];
  cssSelector?: string;
}

export interface Match {
  id: string;
  alertId: string;
  title: string;
  price: number;
  currency: string;
  location?: string;
  area?: number;
  imageUrl?: string;
  sourceUrl: string;
  source: string;
  metadata: Record<string, any>;
  isFavorite: boolean;
  createdAt: Date;
  latitude?: number;
  longitude?: number;
}

export interface Notification {
  id: string;
  userId: string;
  alertId: string;
  type: 'new_match' | 'price_drop' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
