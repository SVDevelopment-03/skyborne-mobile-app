// ============ useJoinMeeting.ts ============
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { getUserRegion } from '../utils/timezoneUtils';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;


export interface JoinMeetingPayload {
  meetingId: string;
  userId: string;
  region: string;
}

export interface JoinMeetingResponse {
  success: boolean;
  data: {
    accessUrl: string;
    joinUrl: string;
    meetingId: string;
    message?: string;
  };
  message?: string;
}

export function useJoinMeeting() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.home.user);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create axios instance with auth interceptor
  const createAxiosInstance = useCallback(() => {
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    api.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    return api;
  }, []);

  /**
   * Join a meeting and get access URL
   */
  const joinMeeting = useCallback(
    async (meetingId: string) => {
      // Validate inputs
      if (!meetingId) {
        const errorMsg = 'Meeting ID is required';
        setError(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
        });
        return null;
      }

      if (!user?._id) {
        const errorMsg = 'User information not found. Please log in again.';
        setError(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: errorMsg,
        });
        return null;
      }

      // Get user region
      let userRegion = 'APAC'; // Default fallback
      try {
        const region = getUserRegion();
        if (region?.region) {
          console.log("region detected:", region.region);
          userRegion = region.region;
        }
      } catch (err) {
        console.warn('Failed to detect user region, using default:', err);
      }

      setIsJoining(true);
      setError(null);

      try {
        // Create axios instance with auth token
        const api = createAxiosInstance();

        // Call API to join meeting
        const response :any= await api.post<JoinMeetingResponse>(
          '/meetings/join',
          {
            meetingId,
            userId: user._id,
            region: userRegion,
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || 'Failed to join meeting'
          );
        }

        console.log("join url response:", response.data.data);

        const {accessUrl,recordUrl,mode} = response.data.data;
        console.log("this is the joinurl data:- ", accessUrl);
        if (!accessUrl) {
          throw new Error('Join URL not found in response');
        }

        setIsJoining(false);
        setError(null);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Joining meeting...',
        });

        return {accessUrl,recordUrl,mode};
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to join meeting';
        
        setError(errorMsg);
        setIsJoining(false);
        Toast.show({
          type: 'error',
          text1: 'Join Failed',
          text2: errorMsg,
        });
        
        console.error('Join meeting error:', err);
        return null;
      }
    },
    [user?._id, createAxiosInstance]
  );

  /**
   * Get a short-lived playback link for a past class's recording. This is the
   * same endpoint the website uses. /meetings/join refuses completed classes,
   * so it cannot be used for recordings. The server uses one credit the first
   * time a member replays a class; later replays are free.
   */
  const getRecordingLink = useCallback(
    async (meetingId: string): Promise<string | null> => {
      if (!meetingId) return null;
      setIsJoining(true);
      setError(null);
      try {
        const api = createAxiosInstance();
        const response: any = await api.get(
          `/meetings/${meetingId}/recording-link`,
        );
        const url = response?.data?.data?.url;
        if (!response?.data?.success || !url) {
          throw new Error(
            response?.data?.message || 'Recording not found for this session.',
          );
        }
        return String(url);
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Recording is not available right now.';
        setError(errorMsg);
        Toast.show({
          type: 'error',
          text1: 'Recording Unavailable',
          text2: errorMsg,
        });
        return null;
      } finally {
        setIsJoining(false);
      }
    },
    [createAxiosInstance],
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    joinMeeting,
    getRecordingLink,
    isJoining,
    error,
    clearError,
  };
}