import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  fetchProfile,
  fetchDashboardStats,
  fetchPaymentHistory,
  fetchPaymentStats,
  updateProfile,
  cancelSubscription,
  requestCancellation,
} from '../store/profileSlice';
import { useCallback } from 'react';

export function useProfileViewModel() {
  const dispatch = useDispatch<any>();
  const state = useSelector((s: RootState) => s.profile);

  const loadProfile = useCallback(() => {
    dispatch(fetchProfile()).then((action: any) => {
      const userId = action.payload?._id;
      if (userId) {
        dispatch(fetchDashboardStats());
        dispatch(fetchPaymentHistory(userId));
        dispatch(fetchPaymentStats(userId));
      }
    });
  }, [dispatch]);

  const updateProfileAction = useCallback(
    (payload: any) => dispatch(updateProfile(payload)).unwrap(),
    [dispatch],
  );

  const cancelSubscriptionAction = useCallback(
    (userId: string) => dispatch(cancelSubscription(userId)).unwrap(),
    [dispatch],
  );

  const requestCancellationAction = useCallback(
    (userId: string, description: string) =>
      dispatch(requestCancellation({ userId, description })).unwrap(),
    [dispatch],
  );

  return {
    user: state.user,
    dashboardStats: state.dashboardStats,
    paymentHistory: state.paymentHistory,
    paymentStats: state.paymentStats,
    isLoading: state.status === 'loading',
    error: state.error,
    isCancellingSubscription: state.cancelSubscriptionStatus === 'loading',
    isRequestingCancellation: state.requestCancellationStatus === 'loading',

    loadProfile,
    updateProfile: updateProfileAction,
    cancelSubscription: cancelSubscriptionAction,
    requestCancellation: requestCancellationAction,
  };
}
