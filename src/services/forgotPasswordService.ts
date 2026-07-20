import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;
    
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

class ForgotPasswordService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(this.authTokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Request password reset - sends OTP to email
   */
  async passwordResetRequestService(payload: { email: string }): Promise<ApiResponse> {
    try {
      console.log('Password reset request payload:', payload);

      const response = await this.api.post('/request-password-reset', payload);
      
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to send OTP';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify password reset OTP
   */
  async verifyPasswordResetOTPService(payload: { 
    email: string; 
    otp: string 
  }): Promise<ApiResponse> {
    try {
      console.log('Verify OTP payload:', payload);

      const response = await this.api.post('/verify-otp', payload);
      
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'OTP verification failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reset password with new password
   */
  async resetPasswordService(payload: { 
    email: string; 
    newPassword: string 
  }): Promise<ApiResponse> {
    try {
      console.log('Reset password payload:', payload);

      const response = await this.api.post('/reset-password', payload);
      
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Password reset failed';
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const forgotPasswordService = new ForgotPasswordService();

// Export functions for backward compatibility with Redux thunks
export const passwordResetRequestService = (payload: { email: string }) =>
  forgotPasswordService.passwordResetRequestService(payload);

export const verifyPasswordResetOTPService = (payload: { email: string; otp: string }) =>
  forgotPasswordService.verifyPasswordResetOTPService(payload);

export const resetPasswordService = (payload: { email: string; newPassword: string }) =>
  forgotPasswordService.resetPasswordService(payload);