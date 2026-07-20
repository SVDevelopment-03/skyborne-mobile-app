// 3. Payment ViewModel Hook (viewmodels/usePaymentViewModel.ts)
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initiatePayment, checkPaymentStatus } from '../store/paymentSlice';
import { RootState } from '../store';

export function usePaymentViewModel() {
  const dispatch = useDispatch<any>();
  const paymentState = useSelector((state: RootState) => state.payment);

  const createPaymentOrder = useCallback(
    async (payload: {
      amount: number;
      currency: string;
      userId: string;
      plan: string;
      email?: string;
      phone?: string;
    }) => {
      try {
        const result = await dispatch(initiatePayment(payload));
        
        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: result.payload || 'Payment order creation failed',
          };
        }
      } catch (error: any) {
        return {
          success: false,
          message: error?.message || 'Payment order creation failed',
        };
      }
    },
    [dispatch]
  );

  const verifyPaymentStatus = useCallback(
    async (orderRef: string) => {
      try {
        const result = await dispatch(checkPaymentStatus(orderRef));
        
        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: result.payload || 'Payment verification failed',
          };
        }
      } catch (error: any) {
        return {
          success: false,
          message: error?.message || 'Payment verification failed',
        };
      }
    },
    [dispatch]
  );

  return {
    createPaymentOrder,
    verifyPaymentStatus,
    paymentState,
    isLoading: paymentState.status === 'loading',
    isError: paymentState.status === 'failed',
    isSuccess: paymentState.status === 'success',
    errorMessage: paymentState.error,
  };
}