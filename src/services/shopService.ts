
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;

export type ProductSort = 'newest' | 'price-low' | 'price-high';

export interface ShopCategory {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

export interface ShopProduct {
  _id: string;
  name: string;
  description?: string;
  longDescription?: string;
  whatIsInTheBox?: string;
  price: number;
  image: string;
  images?: string[];
  category?: { _id: string; title?: string; name?: string } | string;
  status?: string;
  stock?: number;
  shippingInfo?: string;
  featureBullet1?: string;
  featureBullet2?: string;
  featureBullet3?: string;
  featureBullet4?: string;
  featureBullet5?: string;
  [key: string]: unknown;
  specifications?: Array<{ label?: string; value?: string }>;
  reviews?: Array<{
    name?: string;
    rating?: number;
    comment?: string;
    createdAt?: string;
  }>;
  createdAt?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CartItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartData {
  _id?: string;
  userId?: string;
  items: CartItem[];
  total: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  email?: string;
  phone?: string;
}

export interface ShopOrderItem {
  _id?: string;
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShopOrder {
  _id: string;
  orderNumber: string;
  items: ShopOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    zip?: string;
  };
  createdAt: string;
}

class ShopService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';
  private guestCartKey = '@guest_cart';
  private forceGuestMode = false;

  private isValidToken(token: string | null | undefined): token is string {
    if (!token) return false;
    const normalized = String(token).trim().toLowerCase();
    return normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined';
  }

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-client-source': 'app',
      },
    });

    this.api.interceptors.request.use(
      async config => {
        if (this.forceGuestMode) {
          if (config.headers?.Authorization) {
            delete config.headers.Authorization;
          }
          return config;
        }

        const token = await AsyncStorage.getItem(this.authTokenKey);
        if (this.isValidToken(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );
  }

  setForceGuestMode(enabled: boolean): void {
    this.forceGuestMode = enabled;
  }

  private async getAuthToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(this.authTokenKey);
    return this.isValidToken(token) ? token : null;
  }

  private computeCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private async getGuestCart(): Promise<CartData> {
    try {
      const raw = await AsyncStorage.getItem(this.guestCartKey);
      const parsed = raw ? JSON.parse(raw) : null;
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      return {
        _id: 'guest-cart',
        userId: 'guest',
        items,
        total: this.computeCartTotal(items),
      };
    } catch {
      return {
        _id: 'guest-cart',
        userId: 'guest',
        items: [],
        total: 0,
      };
    }
  }

  private async saveGuestCart(items: CartItem[]): Promise<CartData> {
    const cart: CartData = {
      _id: 'guest-cart',
      userId: 'guest',
      items,
      total: this.computeCartTotal(items),
    };
    await AsyncStorage.setItem(this.guestCartKey, JSON.stringify({ items: cart.items }));
    return cart;
  }

  private async clearGuestCart(): Promise<void> {
    await AsyncStorage.removeItem(this.guestCartKey);
  }

  private async syncGuestCartToServer(): Promise<void> {
    const guestCart = await this.getGuestCart();
    if (!guestCart.items.length) {
      return;
    }

    for (const item of guestCart.items) {
      await this.api.post('/cart', {
        productId: item.product,
        quantity: item.quantity,
      });
    }

    await this.clearGuestCart();
  }

  async getPublishedProducts(params?: {
    search?: string;
    categoryId?: string;
    category?: string;
    sortBy?: ProductSort;
    page?: number;
    limit?: number;
  }): Promise<{ products: ShopProduct[]; pagination?: PaginationMeta }> {
    const normalizedCategory = params?.categoryId ?? params?.category;
    const queryParams = {
      ...params,
      categoryId: normalizedCategory,
      category: normalizedCategory,
    };
    const response = await this.api.get('/products/published', { params: queryParams });
    const products = Array.isArray(response.data?.data) ? response.data.data : [];
    const pagination = response.data?.pagination;
    return { products, pagination };
  }

  async getProductById(productId: string): Promise<ShopProduct> {
    const response = await this.api.get(`/products/${productId}`);
    return response.data?.data ?? response.data;
  }

  async getActiveServices(): Promise<ShopCategory[]> {
    const response = await this.api.get('/services/active');
    return Array.isArray(response.data?.data) ? response.data.data : [];
  }

  async getActiveEcomCategories(): Promise<ShopCategory[]> {
    try {
      const response = await this.api.get('/ecom-categories/active');
      const categories = Array.isArray(response.data?.data) ? response.data.data : [];
      console.log('[shopService] categories API raw response:', response.data);
      console.log('[shopService] categories parsed list:', categories);
      return categories;
    } catch (error) {
      console.warn('Failed to fetch ecom categories:', error);
      return [];
    }
  }

  async getMyCart(): Promise<CartData> {
    if (this.forceGuestMode) {
      return this.getGuestCart();
    }

    const token = await this.getAuthToken();
    if (!token) {
      return this.getGuestCart();
    }

    try {
      await this.syncGuestCartToServer();
      const response = await this.api.get('/cart');
      return response.data?.data;
    } catch {
      // If server cart fails for any auth reason, preserve guest shopping experience.
      return this.getGuestCart();
    }
  }

  async addToCart(payload: { productId: string; quantity?: number }): Promise<CartData> {
    if (this.forceGuestMode) {
      const guestCart = await this.getGuestCart();
      const qtyToAdd = Math.max(1, Number(payload.quantity) || 1);
      const existingIndex = guestCart.items.findIndex(item => item.product === payload.productId);

      if (existingIndex >= 0) {
        const items = [...guestCart.items];
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + qtyToAdd,
        };
        return this.saveGuestCart(items);
      }

      const product = await this.getProductById(payload.productId);
      const newItem: CartItem = {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qtyToAdd,
        image: product.image,
      };
      return this.saveGuestCart([...guestCart.items, newItem]);
    }

    const token = await this.getAuthToken();
    if (!token) {
      const guestCart = await this.getGuestCart();
      const qtyToAdd = Math.max(1, Number(payload.quantity) || 1);
      const existingIndex = guestCart.items.findIndex(item => item.product === payload.productId);

      if (existingIndex >= 0) {
        const items = [...guestCart.items];
        items[existingIndex] = {
          ...items[existingIndex],
          quantity: items[existingIndex].quantity + qtyToAdd,
        };
        return this.saveGuestCart(items);
      }

      const product = await this.getProductById(payload.productId);
      const newItem: CartItem = {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qtyToAdd,
        image: product.image,
      };
      return this.saveGuestCart([...guestCart.items, newItem]);
    }

    await this.syncGuestCartToServer();
    const response = await this.api.post('/cart', payload);
    return response.data?.data;
  }

  async updateCartItem(productId: string, quantity: number): Promise<CartData> {
    if (this.forceGuestMode) {
      const guestCart = await this.getGuestCart();
      const qty = Math.max(1, Number(quantity) || 1);
      const items = guestCart.items.map(item =>
        item.product === productId ? { ...item, quantity: qty } : item,
      );
      return this.saveGuestCart(items);
    }

    const token = await this.getAuthToken();
    if (!token) {
      const guestCart = await this.getGuestCart();
      const qty = Math.max(1, Number(quantity) || 1);
      const items = guestCart.items.map(item =>
        item.product === productId ? { ...item, quantity: qty } : item,
      );
      return this.saveGuestCart(items);
    }

    await this.syncGuestCartToServer();
    const response = await this.api.patch(`/cart/${productId}`, { quantity });
    return response.data?.data;
  }

  async removeCartItem(productId: string): Promise<CartData> {
    if (this.forceGuestMode) {
      const guestCart = await this.getGuestCart();
      const items = guestCart.items.filter(item => item.product !== productId);
      return this.saveGuestCart(items);
    }

    const token = await this.getAuthToken();
    if (!token) {
      const guestCart = await this.getGuestCart();
      const items = guestCart.items.filter(item => item.product !== productId);
      return this.saveGuestCart(items);
    }

    await this.syncGuestCartToServer();
    const response = await this.api.delete(`/cart/${productId}`);
    return response.data?.data;
  }

  async clearCart(): Promise<void> {
    if (this.forceGuestMode) {
      await this.clearGuestCart();
      return;
    }

    const token = await this.getAuthToken();
    if (!token) {
      await this.clearGuestCart();
      return;
    }

    await this.syncGuestCartToServer();
    await this.api.delete('/cart/clear');
  }

  async createCheckoutSession(payload: {
    shippingAddress: ShippingAddress;
    source?: 'app' | 'web';
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ checkoutUrl: string; sessionId: string; orderRef: string }> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Please login to continue checkout');
    }

    await this.syncGuestCartToServer();
    const response = await this.api.post('/ecom-payments/create-checkout-session', payload);
    return response.data?.data;
  }

  async getMyOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ShopOrder[]> {
    const token = await this.getAuthToken();
    if (!token) {
      return [];
    }

    const response = await this.api.get('/orders/my', { params });
    return Array.isArray(response.data?.data) ? response.data.data : [];
  }

  async expressProductInterest(productId: string): Promise<{ message?: string }> {
    const response = await this.api.post(`/products/${productId}/interested`);
    return response.data ?? {};
  }

  async cancelOrder(orderId: string): Promise<ShopOrder> {
    const response = await this.api.delete(`/orders/${orderId}/cancel`);
    return response.data?.data ?? response.data;
  }

  async reorderCheckoutSession(payload: {
    orderId: string;
    source?: 'app' | 'web';
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ checkoutUrl: string; sessionId: string; orderRef: string }> {
    const { orderId, ...body } = payload;
    const response = await this.api.post(`/ecom-payments/reorder/${orderId}`, body);
    return response.data?.data ?? response.data;
  }

}

export const shopService = new ShopService();
