import { getFAQs,FAQItem } from './../services/faqService';
// store/slices/faqSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type FAQState = {
  items: FAQItem[];
  status: 'idle' | 'loading' | 'failed';
  error?: string;
};

const initialState: FAQState = {
  items: [],
  status: 'idle',
  error: undefined,
};

/**
 * Fetch all FAQs
 */
export const fetchFAQs = createAsyncThunk(
  'faq/fetchFAQs',
  async (_, { rejectWithValue }) => {
    try {
      const faqs = await getFAQs();
      return faqs;
    } catch (error: any) {
      console.error('Fetch FAQs error:', error);
      return rejectWithValue(error.message || 'Failed to fetch FAQs');
    }
  }
);

const faqSlice = createSlice({
  name: 'faq',
  initialState,
  reducers: {
    clearError(state) {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFAQs.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(fetchFAQs.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
        state.error = undefined;
      })
      .addCase(fetchFAQs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = faqSlice.actions;
export default faqSlice.reducer;
