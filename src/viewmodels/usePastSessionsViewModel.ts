// ============ usePastSessionsViewModel.ts ============
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPastSessions,
  clearError,
} from '../store/pastSessionSlice';
import { RootState } from '../store';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function usePastSessionsViewModel() {
  const dispatch = useDispatch<any>();
  const pastSessionsState = useSelector((state: RootState) => state.pastSessions);

  /**
   * Fetch past sessions with pagination
   */
  const fetchSessions = useCallback(
    async (skip: number = 0, limit: number = 10): Promise<ApiResponse> => {
      try {
        const result = await dispatch(fetchPastSessions({ skip, limit }));

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'Past sessions fetched successfully',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: result.payload || 'Failed to fetch past sessions',
          };
        }
      } catch (error: any) {
        console.error('Fetch past sessions error:', error);
        return {
          success: false,
          message: error?.message || 'An error occurred',
        };
      }
    },
    [dispatch],
  );

  /**
   * Clear errors
   */
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    pastSessions: pastSessionsState.pastSessions,
    isLoading: pastSessionsState.status === 'loading',
    isError: pastSessionsState.status === 'failed',
    error: pastSessionsState.error,
    totalCount: pastSessionsState.totalCount,
    hasMore: pastSessionsState.hasMore,

    // Actions
    fetchSessions,
    clearError: handleClearError,
  };
}