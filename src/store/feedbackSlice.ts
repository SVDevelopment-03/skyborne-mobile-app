import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { feedbackService } from '../services/feedbackService';

export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async (payload: { rating: number; comment: string; feeling?: string }, { rejectWithValue }) => {
    try {
      const res = await feedbackService.submitFeedback(payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data || e.message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState: {
    status: 'idle',
    error: null,
    successMessage: null,
  },
  reducers: {
    clearFeedbackState: (state) => {
      state.status = 'idle';
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(submitFeedback.pending, s => { 
        s.status = 'loading'; 
        s.error = null;
      })
      .addCase(submitFeedback.fulfilled, (s: any, a) => {
        s.status = 'succeeded';
        s.successMessage = a.payload.message;
      })
      .addCase(submitFeedback.rejected, (s: any, a) => {
        s.status = 'failed';
        s.error = a.payload;
      });
  },
});

export const { clearFeedbackState } = feedbackSlice.actions;
export default feedbackSlice.reducer;