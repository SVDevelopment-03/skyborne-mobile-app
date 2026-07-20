import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { profileService } from '../services/profileService';

interface ProfileState {
  user: any | null;
  dashboardStats: any | null;
  paymentHistory: any[];
  paymentStats: any | null;
  status: 'idle' | 'loading' | 'failed';
  error: any | null;
  cancelSubscriptionStatus: 'idle' | 'loading' | 'error';
  requestCancellationStatus: 'idle' | 'loading' | 'error';
}

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await profileService.getProfile();
      return res.data.user;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'profile/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await profileService.getDashboardStats();
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'profile/fetchPaymentHistory',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await profileService.getPaymentHistory(userId);
      return res.payments || [];
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchPaymentStats = createAsyncThunk(
  'profile/fetchPaymentStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await profileService.getPaymentStats(userId);
      return res.stats;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await profileService.updateProfile(payload);
      return res.data?.data ?? res.data?.user;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'profile/cancelSubscription',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await profileService.cancelSubscription(userId);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  }
);

export const requestCancellation = createAsyncThunk(
  'profile/requestCancellation',
  async (
    payload: { userId: string; description: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await profileService.requestCancellation(
        payload.userId,
        payload.description,
      );
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  },
);

const initialState: ProfileState = {
  user: null,
  dashboardStats: null,
  paymentHistory: [],
  paymentStats: null,
  status: 'idle',
  error: null,
  cancelSubscriptionStatus: 'idle',
  requestCancellationStatus: 'idle',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchProfile.pending, s => { s.status = 'loading'; })
      .addCase(fetchProfile.fulfilled, (s: any, a) => {
        s.status = 'idle';
        s.user = a.payload;
      })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => {
        s.dashboardStats = a.payload;
      })
      .addCase(fetchPaymentHistory.fulfilled, (s: any, a) => {
        s.paymentHistory = a.payload;
      })
      .addCase(fetchPaymentStats.fulfilled, (s: any, a) => {
        s.paymentStats = a.payload;
      })
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.user = a.payload;
      })
      .addCase(cancelSubscription.pending, (s) => {
        s.cancelSubscriptionStatus = 'loading';
      })
      .addCase(cancelSubscription.fulfilled, (s, a) => {
        s.cancelSubscriptionStatus = 'idle';
        const sub = a.payload?.subscription ?? {};
        s.user = {
          ...(s.user ?? {}),
          plan: sub.plan ?? (s.user as any)?.plan,
          subscription: {
            ...((s.user as any)?.subscription ?? {}),
            status: sub.status ?? (s.user as any)?.subscription?.status,
            cancelledAt:
              sub.cancelledAt ?? (s.user as any)?.subscription?.cancelledAt,
          },
        };
      })
      .addCase(cancelSubscription.rejected, (s, a) => {
        s.cancelSubscriptionStatus = 'error';
        s.error = a.payload as any;
      })
      .addCase(requestCancellation.pending, (s) => {
        s.requestCancellationStatus = 'loading';
      })
      .addCase(requestCancellation.fulfilled, (s) => {
        s.requestCancellationStatus = 'idle';
      })
      .addCase(requestCancellation.rejected, (s, a) => {
        s.requestCancellationStatus = 'error';
        s.error = a.payload as any;
      });
  },
});

export default profileSlice.reducer;
