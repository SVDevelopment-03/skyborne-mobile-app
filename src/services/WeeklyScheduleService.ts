import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';
import {
  fetchLoggedInUserCountryRegion,
  fetchLoggedInUserRegion,
} from '../utils/timezoneUtils';

const API_BASE_URL = APP_API_BASE_URL;

export interface IRegionEntry {
  region: string;
  localTime: string;
  timezone: string;
  mode: 'live' | 'replay';
}

export interface Meeting {
  _id: string;
  title: string;
  localTime: string;
  regions: IRegionEntry[];
  service: {
    _id: string;
    title: string;
    name: string;
  };
  trainer: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  duration: number;
  status: 'pending' | 'completed' | 'failed';
  [key: string]: any;
}

export interface MeetingsResponse {
  success: boolean;
  count: number;
  meetings: Meeting[];
  userPlan: string;
}

class WeeklyScheduleService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem(this.authTokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );
  }

  private async getRegionParam(): Promise<string | undefined> {
    try {
      const { regionName, regionCode } = await fetchLoggedInUserCountryRegion();
      if (regionName?.trim()) return regionName.trim();
      if (regionCode?.trim()) return regionCode.trim();
    } catch (error) {
      console.warn('Failed to get region from country mapping:', error);
    }

    try {
      const { region, code } = await fetchLoggedInUserRegion();
      if (region?.trim()) return region.trim();
      if (code?.trim()) return code.trim();
    } catch (error) {
      console.warn('Failed to get fallback region from user profile:', error);
    }

    return undefined;
  }

  /**
   * Fetch weekly meetings for all 7 days
   * Backend filters by user plan and region
   */
  async getWeeklyMeetings(regionOverride?: string): Promise<MeetingsResponse> {
    try {
      const regionParam =
        typeof regionOverride === 'string' && regionOverride.trim().length > 0
          ? regionOverride.trim()
          : await this.getRegionParam();
      const params: Record<string, string> = {};
      if (regionParam) params.region = regionParam;
      console.log(
        '📅 Weekly meetings region param:',
        regionParam || '(missing)',
      );
      const response = await this.api.get<MeetingsResponse>(
        '/meetings/weekly',
        { params },
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch weekly meetings');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch weekly meetings';
      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch meetings for a specific day
   */
  async getMeetingsByDay(dayIndex: number): Promise<MeetingsResponse> {
    try {
      const regionParam = await this.getRegionParam();
      const params: Record<string, string> = {};
      if (regionParam) params.region = regionParam;
      console.log(
        `📅 By-day meetings region param (day ${dayIndex}):`,
        regionParam || '(missing)',
      );
      const response = await this.api.get<MeetingsResponse>(
        `/meetings/by-day/${dayIndex}`,
        { params },
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch day meetings');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch day meetings';
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const weeklyScheduleService = new WeeklyScheduleService();

// Export functions for Redux thunks
export const getWeeklyMeetings = (regionOverride?: string) =>
  weeklyScheduleService.getWeeklyMeetings(regionOverride);

export const getMeetingsByDay = (dayIndex: number) =>
  weeklyScheduleService.getMeetingsByDay(dayIndex);
