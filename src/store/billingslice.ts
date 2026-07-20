// ============ billingSlice.ts ============
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getPaymentHistory as getPaymentHistoryService,
  getSubscriptionStatus as getSubscriptionStatusService,
  PaymentHistoryItem,
  SubscriptionStatus,
} from '../services/billingService';
import { cancelSubscription as cancelSubscriptionAction } from './profileSlice';

export interface BillingState {
  history: PaymentHistoryItem[];
  subscription: SubscriptionStatus | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: BillingState = {
  history: [],
  subscription: null,
  status: 'idle',
  error: null,
};

export const fetchPaymentHistory = createAsyncThunk(
  'billing/fetchPaymentHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPaymentHistoryService();
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchSubscriptionStatus = createAsyncThunk(
  'billing/fetchSubscriptionStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getSubscriptionStatusService();
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearBillingError(state) {
      state.error = null;
    },
    resetBilling(state) {
      state.history = [];
      state.subscription = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPaymentHistory.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.status = 'idle';
        state.history = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      .addCase(fetchSubscriptionStatus.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.status = 'idle';
        state.subscription = action.payload;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
    builder.addCase(cancelSubscriptionAction.fulfilled, (state, action) => {
      const sub = action.payload?.subscription;
      if (sub) {
        state.subscription = {
          ...(state.subscription ?? {}),
          status: sub.status ?? (state.subscription as any)?.status,
          cancelledAt: sub.cancelledAt ?? (state.subscription as any)?.cancelledAt,
          plan: sub.plan ?? (state.subscription as any)?.plan,
        } as SubscriptionStatus;
      }
    });
  },
});

export const { clearBillingError, resetBilling } = billingSlice.actions;
export default billingSlice.reducer;
