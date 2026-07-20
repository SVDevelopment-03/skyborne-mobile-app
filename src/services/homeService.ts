// ============ homeService.ts ============
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';
import {
  fetchLoggedInUserCountryRegion,
  fetchLoggedInUserRegion,
  getUserRegion,
} from '../utils/timezoneUtils';

const API_BASE_URL = APP_API_BASE_URL;

export interface Meeting {
  _id: string;
  title: string;
  localTime: string;
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
  [key: string]: any;
}

export interface MeetingsResponse {
  success: boolean;
  count: number;
  meetings: Meeting[];
  userPlan: string;
}

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  timezone?: string;
  plan?: string;
  classCredits?: {
    yoga?: number;
    zumba?: number;
    specialty?: number;
  };
  totalClassCredits?: number;
  profileImage?: string;
  [key: string]: any;
}

export interface UserResponse {
  success: boolean;
  message: string;
  user: UserProfile;
}

export interface WeeklyActivityDay {
  day: string;
  completed: boolean;
}

export interface WeeklyActivityResponse {
  totalDays: number;
  completedDays: number;
  progressPercent: number;
  days: WeeklyActivityDay[];
}

export interface ClassDetailsResponse {
  success: boolean;
  data: Meeting;
}

class HomeService {
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
    const normalizeRegion = (value: string): string => {
      const v = value.trim().toLowerCase();
      if (v.includes('gulf')) return 'Gulf';
      if (v.includes('uk') || v.includes('europe')) return 'UK / Europe';
      if (v.includes('canada') || v.includes('usa') || v.includes('us'))
        return 'Canada / USA';
      if (v.includes('apac') || v.includes('asia') || v.includes('pacific'))
        return 'APAC';
      return value.trim();
    };

    try {
      const { regionName, regionCode } = await fetchLoggedInUserCountryRegion();
      if (regionName?.trim()) return normalizeRegion(regionName);
      if (regionCode?.trim()) return normalizeRegion(regionCode);
    } catch (error) {
      console.warn('Failed to map region via countries:', error);
    }

    try {
      const { region, code } = await fetchLoggedInUserRegion();
      if (region?.trim()) return normalizeRegion(region);
      if (code?.trim()) return normalizeRegion(code);
    } catch (error) {
      console.warn('Failed to load fallback region from /me:', error);
    }

    try {
      const fallback = getUserRegion();
      if (fallback?.region) return normalizeRegion(fallback.region);
    } catch {
      // ignore
    }

    return undefined;
  }

  /**
   * Fetch current user profile
   */
  async getUserProfile(): Promise<UserResponse> {
    try {
      const response = await this.api.get<UserResponse>('/me');
      console.log('api response', response);

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Failed to fetch user profile',
        );
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user profile';
      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch weekly activity
   */
  async getWeeklyActivity(): Promise<WeeklyActivityResponse> {
    try {
      const response = await this.api.get<WeeklyActivityResponse>(
        '/meetings/weekly-activity',
      );

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch weekly activity';
      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch today's meetings
   * @param search - Optional search query to filter meetings by title, service, or trainer
   */
  async getTodaysMeetings(search?: string): Promise<MeetingsResponse> {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const regionParam = await this.getRegionParam();
      if (regionParam) params.region = regionParam;
      const response = await this.api.get<MeetingsResponse>('/meetings/today', {
        params,
      });

      if (!response.data.success) {
        throw new Error("Failed to fetch today's meetings");
      }
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch today's meetings";
      throw new Error(errorMessage);
    }
  }


/**
 * Fetch upcoming meetings with pagination
 * @param search - Optional search query to filter meetings by title, service, or trainer
 * @param skip - Number of items to skip (default: 0)
 * @param limit - Number of items to fetch (default: 10)
 */
async getUpcomingMeetings(search?: string, skip: number = 0, limit: number = 10): Promise<MeetingsResponse & { totalCount: number; hasMore: boolean }> {
  try {
    const params: any = { skip, limit };
    if (search) params.search = search;
    const regionParam = await this.getRegionParam();
    if (regionParam) params.region = regionParam;

    const response = await this.api.get<MeetingsResponse & { totalCount: number; hasMore: boolean }>(
      '/meetings/upcoming',
      { params },
    );

    if (!response.data.success) {
      throw new Error('Failed to fetch upcoming meetings');
    }

    console.log(
      '[HomeService] /meetings/upcoming response:',
      JSON.stringify(
        {
          success: response.data.success,
          count: response.data.count,
          totalCount: response.data.totalCount,
          hasMore: response.data.hasMore,
          meetingsLength: Array.isArray(response.data.meetings)
            ? response.data.meetings.length
            : 0,
          meetings: response.data.meetings,
        },
        null,
        2,
      ),
    );

    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch upcoming meetings';
    throw new Error(errorMessage);
  }
}



  /**
   * Fetch class/meeting details by ID
   * @param classId - The ID of the class to fetch
   */
  async getClassDetails(classId: string): Promise<ClassDetailsResponse> {
    try {
      if (!classId) {
        throw new Error('Class ID is required');
      }

      const response = await this.api.get<ClassDetailsResponse>(
        `/meetings/${classId}`,
      );

      if (!response.data.success) {
        throw new Error('Failed to fetch class details');
      }
      console.log('class detail', classId);

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch class details';
      throw new Error(errorMessage);
    }
  }

  /**
   * Fetch user profile and all meetings
   * @param search - Optional search query to filter meetings
   */
  async getHomeData(search?: string): Promise<{
    user: UserResponse;
    today: MeetingsResponse;
    upcoming: MeetingsResponse;
  }> {
    try {
      const [userRes, todayRes, upcomingRes] = await Promise.all([
        this.getUserProfile(),
        this.getTodaysMeetings(search),
        this.getUpcomingMeetings(search),
      ]);

      return {
        user: userRes,
        today: todayRes,
        upcoming: upcomingRes,
      };
    } catch (error: any) {
      console.error('Error fetching home data:', error);
      throw error;
    }
  }

  /**
   * Fetch both today and upcoming meetings
   * @param search - Optional search query to filter meetings
   */
  async getAllMeetings(search?: string): Promise<{
    today: MeetingsResponse;
    upcoming: MeetingsResponse;
  }> {
    try {
      const [todayRes, upcomingRes] = await Promise.all([
        this.getTodaysMeetings(search),
        this.getUpcomingMeetings(search),
      ]);

      return {
        today: todayRes,
        upcoming: upcomingRes,
      };
    } catch (error: any) {
      console.error('Error fetching all meetings:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const homeService = new HomeService();

// Export functions for Redux thunks
export const getUserProfile = () => homeService.getUserProfile();

export const getTodaysMeetings = (search?: string) =>
  homeService.getTodaysMeetings(search);

export const getUpcomingMeetings = (search?: string) =>
  homeService.getUpcomingMeetings(search);

export const getClassDetails = (classId: string) =>
  homeService.getClassDetails(classId);

export const getAllMeetings = (search?: string) =>
  homeService.getAllMeetings(search);

export const getHomeData = (search?: string) =>
  homeService.getHomeData(search);

export const getWeeklyActivity = () =>
  homeService.getWeeklyActivity();
