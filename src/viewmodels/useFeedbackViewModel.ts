import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { submitFeedback, clearFeedbackState } from '../store/feedbackSlice';
import { useCallback } from 'react';

export function useFeedbackViewModel() {
  const dispatch = useDispatch<any>();
  const state = useSelector((s: RootState) => s.feedback);

  // const submitFeedbackAction = useCallback(
  //   (payload: { rating: number; comment: string }) => 
  //     dispatch(submitFeedback(payload)).unwrap(),
  //   [dispatch]
  // );

  const submitFeedbackAction = useCallback(
    (payload: { rating: number; comment: string; feeling?: string }) => 
      dispatch(submitFeedback(payload)).unwrap(),
    [dispatch]
  );

  const clearState = useCallback(() => {
    dispatch(clearFeedbackState());
  }, [dispatch]);

  return {
    isSubmitting: state.status === 'loading',
    isSuccess: state.status === 'succeeded',
    error: state.error,
    successMessage: state.successMessage,
    submitFeedback: submitFeedbackAction,
    clearFeedbackState: clearState,
  };
}