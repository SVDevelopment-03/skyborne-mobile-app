import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;
    
export interface DashboardStats {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  totalClasses: number;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  timezone?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: any;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments: any[];
  total?: number;
}

export interface PaymentStatsResponse {
  success: boolean;
  stats: {
    totalSpent?: number;
    thisMonth?: number;
    lastPaymentAmount?: number;
    totalCount?: number;
    completedCount?: number;
    failedCount?: number;
    pendingCount?: number;
    successRate?: number;
    averageTransactionValue?: number;
    activeSubscriptions?: number;
  };
}

class ProfileService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem(this.authTokenKey);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  getProfile() {
    return this.api.get('/me');
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.api.put('/update-profile', payload);
  }

  getDashboardStats() {
    return this.api.get('/dashboardStats');
  }

  getPlans() {
    return this.api.get('/plans');
  }

  cancelSubscription(userId: string) {
    return this.api.post(`/subscription/${userId}/cancel`, {
      adminDescription: 'Cancelled by user (app)',
    });
  }

  /**
   * Request account deletion for the current authenticated user.
   * Backend should remove user record and associated data and revoke auth.
   */
  deleteAccount() {
    return this.api.delete('/delete-account');
  }

  requestCancellation(userId: string, description: string) {
    return this.api.post('/subscription/cancel-subscription', {
      userId,
      description,
    });
  }

  async getPaymentHistory(userId: string): Promise<PaymentHistoryResponse> {
    const res = await this.api.get<PaymentHistoryResponse>(`/payment/history/${userId}`);
    return res.data;
  }

  async getPaymentStats(userId: string): Promise<PaymentStatsResponse> {
    const res = await this.api.get<PaymentStatsResponse>(`/payment/stats/${userId}`);
    return res.data;
  }
}

export const profileService = new ProfileService();
