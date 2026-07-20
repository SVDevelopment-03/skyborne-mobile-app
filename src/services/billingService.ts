// ============ billingService.ts ============
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;
    
/**
 * Interfaces
 */
export interface PaymentHistoryItem {
  _id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  gateway?: string;
  invoiceId?: string;
  createdAt: string;
  [key: string]: any;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentHistoryItem[];
}

export interface SubscriptionStatus {
  plan: string;
  status: string;
  startDate: string;
  endDate?: string;
  autoRenew?: boolean;
  [key: string]: any;
}

export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionStatus;
}

class BillingService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem(this.authTokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Fetch payment history (Billing info)
   */
  async getPaymentHistory(): Promise<PaymentHistoryResponse> {
    try {
      const response = await this.api.get<PaymentHistoryResponse>(
        '/payment/history'
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch payment history');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch payment history'
      );
    }
  }

  /**
   * Fetch current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionResponse> {
    try {
      const response = await this.api.get<SubscriptionResponse>(
        '/subscription/status'
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch subscription status');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch subscription status'
      );
    }
  }
}

export const billingService = new BillingService();

export const getPaymentHistory = () =>
  billingService.getPaymentHistory();

export const getSubscriptionStatus = () =>
  billingService.getSubscriptionStatus();
