import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { 
  passwordResetRequestService,
  verifyPasswordResetOTPService,
  resetPasswordService 
} from '../services/forgotPasswordService';
import { normalizeErrorMessage } from '../utils/errorUtils';

export type ForgotPasswordState = { 
  status: 'idle' | 'loading' | 'failed' | 'success';
  error?: string;
  email?: string;
  otpVerified?: boolean;
};

const initialState: ForgotPasswordState = { 
  status: 'idle',
  error: undefined,
  email: undefined,
  otpVerified: false,
};

/**
 * Send password reset request - sends OTP to email
 */
export const passwordResetRequest = createAsyncThunk(
  'forgotPassword/request',
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const res = await passwordResetRequestService(payload);

      if (!res.success) {
        return rejectWithValue(
          normalizeErrorMessage(res.message, 'Failed to send OTP')
        );
      }

      return {
        success: true,
        message: res.message,
        data: res.data,
      };
    } catch (error: any) {
      console.error('Password reset request error:', error);
      return rejectWithValue(
        normalizeErrorMessage(error?.message, 'Failed to send OTP')
      );
    }
  }
);

/**
 * Verify password reset OTP
 */
export const verifyPasswordResetOTP = createAsyncThunk(
  'forgotPassword/verifyOTP',
  async (
    payload: { email: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await verifyPasswordResetOTPService(payload);

      if (!res.success) {
        return rejectWithValue(
          normalizeErrorMessage(res.message, 'OTP verification failed')
        );
      }

      return {
        success: true,
        message: res.message,
        data: res.data,
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return rejectWithValue(
        normalizeErrorMessage(error?.message, 'OTP verification failed')
      );
    }
  }
);

/**
 * Reset password with new password
 */
export const resetPassword = createAsyncThunk(
  'forgotPassword/resetPassword',
  async (
    payload: { email: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await resetPasswordService(payload);

      if (!res.success) {
        return rejectWithValue(
          normalizeErrorMessage(res.message, 'Password reset failed')
        );
      }

      return {
        success: true,
        message: res.message,
        data: res.data,
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return rejectWithValue(
        normalizeErrorMessage(error?.message, 'Password reset failed')
      );
    }
  }
);

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState,
  reducers: {
    resetForgotPasswordState(state) {
      state.status = 'idle';
      state.error = undefined;
      state.email = undefined;
      state.otpVerified = false;
    },
    clearError(state) {
      state.error = undefined;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // ============ PASSWORD RESET REQUEST CASES ============
      .addCase(passwordResetRequest.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(passwordResetRequest.fulfilled, (state, action: any) => {
        state.status = 'success';
        state.email = action.meta.arg.email;
        state.error = undefined;
      })
      .addCase(passwordResetRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // ============ VERIFY OTP CASES ============
      .addCase(verifyPasswordResetOTP.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(verifyPasswordResetOTP.fulfilled, (state, action) => {
        state.status = 'success';
        state.otpVerified = true;
        state.error = undefined;
      })
      .addCase(verifyPasswordResetOTP.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.otpVerified = false;
      })

      // ============ RESET PASSWORD CASES ============
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'success';
        state.error = undefined;
        // Reset state after successful password reset
        state.email = undefined;
        state.otpVerified = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { resetForgotPasswordState, clearError } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;
