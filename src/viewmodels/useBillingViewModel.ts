// ============ useBillingViewModel.ts ============
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPaymentHistory,
  fetchSubscriptionStatus,
  clearBillingError,
} from '../store/billingslice';
import { RootState } from '../store';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useBillingViewModel() {
  const dispatch = useDispatch<any>();
  const billingState = useSelector((state: RootState) => state.billing);

  const fetchHistory = useCallback(async (): Promise<ApiResponse> => {
    const result = await dispatch(fetchPaymentHistory());

    if (result.meta.requestStatus === 'fulfilled') {
      return { success: true, data: result.payload };
    }

    return { success: false, message: result.payload };
  }, [dispatch]);

  const fetchSubscription = useCallback(async (): Promise<ApiResponse> => {
    const result = await dispatch(fetchSubscriptionStatus());

    if (result.meta.requestStatus === 'fulfilled') {
      return { success: true, data: result.payload };
    }

    return { success: false, message: result.payload };
  }, [dispatch]);

  return {
    // State
    paymentHistory: billingState.history,
    subscription: billingState.subscription,
    isLoading: billingState.status === 'loading',
    isError: billingState.status === 'failed',
    error: billingState.error,

    // Actions
    fetchHistory,
    fetchSubscription,
    clearError: () => dispatch(clearBillingError()),
  };
}
