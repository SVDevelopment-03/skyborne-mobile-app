import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  signup as signupThunk, 
  sendOtp as sendOtpThunk,
  verifyOtp as verifyOtpThunk ,
  login as loginThunk
} from '../store/authSlice';

import { RootState } from '../store';
import { normalizeErrorMessage } from '../utils/errorUtils';

export interface SignupPayload {
  tempUserId: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  country: string;
  countryCode: string;
  phoneCountryCode?: string;
  timezone: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  authProvider?: string;
  googleId?: string;
  appleId?: string;
  motivation?: number;
  goal?: number;
  inspiration?: number;
  firstGoal?: number;
  fitnessLevel?: number | undefined | null;
  habits?: {
    waterIntake?: number | null;
    sleepQuality?: number | null;
    exerciseFrequency?: number | null;
  };
  pricingPlan?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useAuthViewModel() {
  const dispatch = useDispatch<any>();
  const authState = useSelector((state: RootState) => state.auth);

  

  /**
   * Complete signup with all onboarding data
   * Includes: location, timezone, onboarding preferences, pricing plan
   */
  const signup = useCallback(
    async (payload: SignupPayload): Promise<ApiResponse> => {
      try {
        const result = await dispatch(signupThunk(payload));
        
        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'Signup completed successfully',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: normalizeErrorMessage(result.payload, 'Signup failed'),
          };
        }
      } catch (error: any) {
        console.error('Signup error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(
            error?.message,
            'An error occurred during signup'
          ),
        };
      }
    },
    [dispatch]
  );

   /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string): Promise<ApiResponse> => {
      try {
        if (!email || !password) {
          return {
            success: false,
            message: 'Email and password are required',
          };
        }

        const result = await dispatch(loginThunk({ email, password }));
        console.log('login result:', result);

        if (result.meta.requestStatus === 'fulfilled') {
          return {
            success: true,
            message: 'Login successful',
            data: result.payload,
          };
        } else {
          return {
            success: false,
            message: normalizeErrorMessage(result.payload, 'Login failed'),
          };
        }
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(
            error?.message,
            'An error occurred during login'
          ),
        };
      }
    },
    [dispatch]
  );

  /**
   * Send OTP to email or phone
   */
  const sendOtp = useCallback(
    async (payload: { email?: string; phone?: string }): Promise<ApiResponse> => {
      try {
        if (!payload.email && !payload.phone) {
          return {
            success: false,
            message: 'Email or phone number is required',
          };
        }

        const result = await dispatch(sendOtpThunk(payload));
        console.log('sendOtp result:', result);

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
        console.error('SendOtp error:', error);
        return {
          success: false,
          message: normalizeErrorMessage(error?.message, 'Failed to send OTP'),
        };
      }
    },
    [dispatch]
  );

  /**
   * Verify OTP and get tempUserId
   * Returns tempUserId needed for final signup
   */
  const verifyOtp = useCallback(
    async (payload: {
      phone?: string;
      email?: string;
      otp?: string;
    }): Promise<ApiResponse> => {
      try {
        if (!payload.otp) {
          return {
            success: false,
            message: 'OTP code is required',
          };
        }

        if (!payload.email && !payload.phone) {
          return {
            success: false,
            message: 'Email or phone number is required',
          };
        }

        const result = await dispatch(verifyOtpThunk(payload));
        console.log('verifyOtp result:', result);

        if (result.meta.requestStatus === 'fulfilled') {
          const { data } = result.payload;
          return {
            success: true,
            message: 'OTP verified successfully',
            data: {
              tempUserId: data?.tempUserId,
              token: data?.token,
              refreshToken: data?.refreshToken,
              ...data,
            },
          };
        } else {
          return {
            success: false,
            message:
              normalizeErrorMessage(result.payload, 'OTP verification failed'),
          };
        }
      } catch (error: any) {
        console.error('VerifyOtp error:', error);
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

  return {
    signup,
    login,
    sendOtp,
    verifyOtp,
    authState,
    isLoading: authState.status === 'loading',
    isError: authState.status === 'failed',
    errorMessage: authState.error,
  };
}
