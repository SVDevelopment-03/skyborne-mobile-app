import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWeeklyMeetings as fetchWeeklyMeetingsAction,
  clearError,
} from '../store/weeklyScheduleSlice';
import { RootState } from '../store';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useWeeklyScheduleViewModel() {
  const dispatch = useDispatch<any>();
  const weeklyScheduleState = useSelector(
    (state: RootState) => state.weeklySchedule,
  );

  /**
   * Fetch weekly meetings based on user plan
   */
  const fetchWeeklyMeetings = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchWeeklyMeetingsAction());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          message: 'Weekly meetings fetched successfully',
          data: result.payload,
        };
      } else {
        return {
          success: false,
          message: result.payload || 'Failed to fetch weekly meetings',
        };
      }
    } catch (error: any) {
      console.error('Fetch weekly meetings error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred',
      };
    }
  }, [dispatch]);

  /**
   * Clear errors
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    weeklyMeetings: weeklyScheduleState.weeklyMeetings,
    userPlan: weeklyScheduleState.userPlan,
    isLoading: weeklyScheduleState.status === 'loading',
    isError: weeklyScheduleState.status === 'failed',
    error: weeklyScheduleState.error,

    // Actions
    fetchWeeklyMeetings,
    clearError: handleClearError,
  };
}