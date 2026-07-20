// store/paymentSlice.ts

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createPaymentOrder, verifyPayment } from '../services/paymentService';

export interface PaymentState {
  // Identification
  orderId?: string;
  orderRef?: string;
  
  // Gateway-specific identifiers
  sessionId?: string;        // Stripe only
  reference?: string;        // nGenius only
  gateway?: 'stripe' | 'ngenius' | string;

  // Payment data
  amount?: number;
  currency?: string;
  plan?: string;
  paymentLink?: string;

  // Status
  status: 'idle' | 'loading' | 'success' | 'failed';
  error?: string;
}

const initialState: PaymentState = {
  status: 'idle',
};

/**
 * Initiate payment - works with both Stripe and nGenius
 * 
 * nGenius returns: reference (not sessionId)
 * Stripe returns: sessionId (not reference)
 */
export const initiatePayment = createAsyncThunk(
  'payment/initiatePayment',
  async (
    payload: {
      amount: number;
      currency: string;
      userId: string;
      plan: string;
      email?: string;
      phone?: string;
      source?: 'app' | 'web';
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await createPaymentOrder(payload);

      console.log('💳 Payment initiated:', {
        gateway: response.gateway,
        orderRef: response.orderRef,
        hasSessionId: !!response.sessionId,
        hasReference: !!response.reference,
      });

      if (!response.success) {
        return rejectWithValue(response.message || 'Payment initiation failed');
      }

      // Extract gateway-specific identifiers
      if (response.gateway === 'ngenius') {
        return {
          orderRef: response.orderRef,
          reference: response.reference,        // ✅ nGenius uses reference
          paymentLink: response.paymentLink,
          gateway: 'ngenius',
          amount: response.amount,
          currency: response.currency,
        };
      } else if (response.gateway === 'stripe') {
        return {
          orderRef: response.orderRef,
          sessionId: response.sessionId,        // ✅ Stripe uses sessionId
          paymentLink: response.paymentLink,
          gateway: 'stripe',
          amount: response.amount,
          currency: response.currency,
        };
      } else {
        // Unknown gateway - return both fields
        return {
          orderRef: response.orderRef,
          reference: response.reference,
          sessionId: response.sessionId,
          paymentLink: response.paymentLink,
          gateway: 'unknown',
          amount: response.amount,
          currency: response.currency,
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Payment initiation failed');
    }
  },
);

/**
 * Check payment status - works with both gateways
 * 
 * For nGenius: uses orderRef
 * For Stripe: uses orderRef or sessionId
 */
export const checkPaymentStatus = createAsyncThunk(
  'payment/checkStatus',
  async (
    payload: {
      orderRef?: string;
      gateway?: 'stripe' | 'ngenius';
    },
    { rejectWithValue }
  ) => {
    try {
      const { orderRef, gateway } = payload;

      if (!orderRef) {
        return rejectWithValue('No order reference provided');
      }

      console.log('🔍 Checking payment status:', { orderRef, gateway });

      const response = await verifyPayment(orderRef);

      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to verify payment');
      }

      console.log('✅ Payment status verified:', {
        status: response.status,
        gateway: response.gateway,
      });

      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Payment verification failed');
    }
  },
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState(state) {
      state.orderId = undefined;
      state.orderRef = undefined;
      state.reference = undefined;
      state.sessionId = undefined;
      state.paymentLink = undefined;
      state.gateway = undefined;
      state.status = 'idle';
      state.error = undefined;
    },

    /**
     * Update payment state with specific gateway data
     */
    updatePaymentState(state, action) {
      const { orderRef, reference, sessionId, gateway, paymentLink, amount, currency } = action.payload;
      
      if (orderRef) state.orderRef = orderRef;
      if (reference) state.reference = reference;
      if (sessionId) state.sessionId = sessionId;
      if (gateway) state.gateway = gateway;
      if (paymentLink) state.paymentLink = paymentLink;
      if (amount) state.amount = amount;
      if (currency) state.currency = currency;
    },

    /**
     * Set payment error
     */
    setPaymentError(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    },
  },

  extraReducers: builder => {
    // Initiate Payment
    builder
      .addCase(initiatePayment.pending, state => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.status = 'success';

        // Store response data
        state.orderRef = action.payload?.orderRef;
        state.paymentLink = action.payload?.paymentLink;
        state.gateway = action.payload?.gateway;
        state.amount = action.payload?.amount;
        state.currency = action.payload?.currency;

        // Store gateway-specific identifiers
        if (action.payload?.gateway === 'ngenius') {
          state.reference = action.payload?.reference;
          console.log('✅ nGenius payment stored:', {
            orderRef: state.orderRef,
            reference: state.reference,
          });
        } else if (action.payload?.gateway === 'stripe') {
          state.sessionId = action.payload?.sessionId;
          console.log('✅ Stripe payment stored:', {
            orderRef: state.orderRef,
            sessionId: state.sessionId,
          });
        }
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Check Payment Status
    builder
      .addCase(checkPaymentStatus.pending, state => {
        state.status = 'loading';
      })
      .addCase(checkPaymentStatus.fulfilled, state => {
        state.status = 'success';
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const {
  clearPaymentState,
  updatePaymentState,
  setPaymentError,
} = paymentSlice.actions;

export default paymentSlice.reducer;