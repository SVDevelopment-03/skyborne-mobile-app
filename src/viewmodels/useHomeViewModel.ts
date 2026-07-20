// ============ useHomeViewModel.ts ============
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  fetchTodaysMeetings,
  fetchUpcomingMeetings,
  fetchHomeData,
  fetchSearchMeetings,
  setSearchQuery,
  clearError,
  fetchWeeklyActivity,
} from '../store/homeSlice';
import { RootState } from '../store';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useHomeViewModel() {
  const dispatch = useDispatch<any>();
  const homeState = useSelector((state: RootState) => state.home);

  /**
   * Fetch user profile
   */
  const fetchUser = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchUserProfile());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          message: 'User profile fetched successfully',
          data: result.payload,
        };
      } else {
        return {
          success: false,
          message: result.payload || 'Failed to fetch user profile',
        };
      }
    } catch (error: any) {
      console.error('Fetch user error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred',
      };
    }
  }, [dispatch]);

  /**
   * Fetch today's meetings
   */
  const fetchTodays = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchTodaysMeetings());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          message: "Today's meetings fetched successfully",
          data: result.payload,
        };
      } else {
        return {
          success: false,
          message: result.payload || "Failed to fetch today's meetings",
        };
      }
    } catch (error: any) {
      console.error('Fetch today meetings error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred',
      };
    }
  }, [dispatch]);

  /**
   * Fetch upcoming meetings
   */
  const fetchUpcoming = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchUpcomingMeetings());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          message: 'Upcoming meetings fetched successfully',
          data: result.payload,
        };
      } else {
        return {
          success: false,
          message: result.payload || 'Failed to fetch upcoming meetings',
        };
      }
    } catch (error: any) {
      console.error('Fetch upcoming meetings error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred',
      };
    }
  }, [dispatch]);

  /**
   * Fetch all home data (user + meetings)
   */
  const fetchAll = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchHomeData());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          message: 'Home data fetched successfully',
          data: result.payload,
        };
      } else {
        return {
          success: false,
          message: result.payload || 'Failed to fetch home data',
        };
      }
    } catch (error: any) {
      console.error('Fetch all data error:', error);
      return {
        success: false,
        message: error?.message || 'An error occurred',
      };
    }
  }, [dispatch]);

  /**
   * Search meetings - sends request to backend with search query
   */
  const fetchSearch = useCallback(
    async (search: string): Promise<ApiResponse> => {
      try {
        const result = await dispatch(fetchSearchMeetings(search));

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'Search completed',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: result.payload || 'Search failed',
          };
        }
      } catch (error: any) {
        console.error('Search error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred during search',
        };
      }
    },
    [dispatch],
  );

  /**
   * Update search query in Redux state
   */
  const updateSearchQuery = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch],
  );

  /**
   * Fetch weekly activity data
   */
  const fetchWeekly = useCallback(async (): Promise<ApiResponse> => {
    try {
      const result = await dispatch(fetchWeeklyActivity());

      if (result.meta.requestStatus === 'fulfilled') {
        return {
          success: true,
          data: result.payload,
        };
      }

      return {
        success: false,
        message: result.payload || 'Failed to fetch weekly activity',
      };
    } catch (error: any) {
      console.error('Fetch weekly error:', error);
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
    user: homeState.user,
    todayMeetings: homeState.todayMeetings,
    upcomingMeetings: homeState.upcomingMeetings,
    userPlan: homeState.userPlan,
    searchQuery: homeState.searchQuery,
    isLoading: homeState.status === 'loading',
    isError: homeState.status === 'failed',
    error: homeState.error,
    lastFetch: homeState.lastFetch,
    weeklyActivity: homeState.weeklyActivity,

    // Actions
    fetchUser,
    fetchTodays,
    fetchUpcoming,
    fetchAll,
    fetchSearch,
    fetchWeekly,
    updateSearchQuery,
    clearError: handleClearError,
  };
}