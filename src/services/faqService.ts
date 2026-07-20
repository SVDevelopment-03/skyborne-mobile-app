// services/faqService.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQResponse {
  success: boolean;
  message: string;
  data: FAQItem[];
}

class FAQService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(this.authTokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Fetch all FAQ items
   */
  async getFAQs(): Promise<FAQItem[]> {
    try {
      console.log('🔄 Fetching FAQs...');
      
      const response = await this.api.get<FAQResponse>('/faq');
      
      if (response.data?.success) {
        console.log('✅ FAQs fetched successfully:', response.data.data.length);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to fetch FAQs');
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch FAQs';
      console.error('❌ Error fetching FAQs:', errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export const faqService = new FAQService();

export const getFAQs = () => faqService.getFAQs();