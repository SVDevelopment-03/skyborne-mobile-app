import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  passwordResetRequest, 
  verifyPasswordResetOTP as verifyOTPThunk,
  resetPassword as resetPasswordThunk 
} from '../store/forgotPasswordSlice';
import { RootState } from '../store';
import { normalizeErrorMessage } from '../utils/errorUtils';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useForgotPasswordViewModel() {
  const dispatch = useDispatch<any>();
  const forgotPasswordState = useSelector((state: RootState) => state.forgotPassword);

  /**
   * Send password reset OTP to email
   */
  const sendPasswordResetOTP = useCallback(
    async (email: string): Promise<ApiResponse> => {
      try {
        if (!email) {
          return {
            success: false,
            message: 'Email is required',
          };
        }

        const result = await dispatch(passwordResetRequest({ email }));
        console.log('Send OTP result:', result);

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'OTP sent successfully',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: normalizeErrorMessage(
              result.payload,
              'Failed to send OTP'
            ),
          };
        }
      } catch (error: any) {
        console.error('Send password reset OTP error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(error?.message, 'Failed to send OTP'),
        };
      }
    },
    [dispatch]
  );

  /**
   * Verify password reset OTP
   */
  const verifyPasswordResetOTP = useCallback(
    async (email: string, otp: string): Promise<ApiResponse> => {
      try {
        if (!email || !otp) {
          return {
            success: false,
            message: 'Email and OTP are required',
          };
        }

        const result = await dispatch(verifyOTPThunk({ email, otp }));
        console.log('Verify OTP result:', result);

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'OTP verified successfully',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: normalizeErrorMessage(
              result.payload,
              'OTP verification failed'
            ),
          };
        }
      } catch (error: any) {
        console.error('Verify password reset OTP error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(
            error?.message,
            'OTP verification failed'
          ),
        };
      }
    },
    [dispatch]
  );

  /**
   * Reset password with new password
   */
  const resetPassword = useCallback(
    async (email: string, newPassword: string): Promise<ApiResponse> => {
      try {
        if (!email || !newPassword) {
          return {
            success: false,
            message: 'Email and new password are required',
          };
        }

        if (newPassword.length < 8) {
          return {
            success: false,
            message: 'Password must be at least 8 characters',
          };
        }

        const result = await dispatch(resetPasswordThunk({ email, newPassword }));
        console.log('Reset password result:', result);

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'Password reset successfully',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: normalizeErrorMessage(
              result.payload,
              'Password reset failed'
            ),
          };
        }
      } catch (error: any) {
        console.error('Reset password error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(
            error?.message,
            'Password reset failed'
          ),
        };
      }
    },
    [dispatch]
  );

  return {
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
    isLoading: forgotPasswordState.status === 'loading',
    isError: forgotPasswordState.status === 'failed',
    errorMessage: forgotPasswordState.error,
  };
}
