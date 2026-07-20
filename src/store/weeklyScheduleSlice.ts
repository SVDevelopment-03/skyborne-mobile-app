import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getWeeklyMeetings as getWeeklyMeetingsService,
  Meeting,
}  from '../services/WeeklyScheduleService'
 
export interface WeeklyScheduleState {
  weeklyMeetings: Meeting[];
  userPlan: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: WeeklyScheduleState = {
  weeklyMeetings: [],
  userPlan: null,
  status: 'idle',
  error: null,
};

/**
 * Fetch weekly meetings thunk
 */
export const fetchWeeklyMeetings = createAsyncThunk(
  'weeklySchedule/fetchWeeklyMeetings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getWeeklyMeetingsService();
      return response;
    } catch (error: any) {
      console.error('Fetch weekly meetings error:', error);
      return rejectWithValue(
        error.message || 'Failed to fetch weekly meetings',
      );
    }
  },
);

const weeklyScheduleSlice = createSlice({
  name: 'weeklySchedule',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError(state) {
      state.error = null;
    },

    /**
     * Reset weekly schedule state
     */
    resetWeeklySchedule(state) {
      state.weeklyMeetings = [];
      state.userPlan = null;
      state.error = null;
      state.status = 'idle';
    },
  },
  extraReducers: builder => {
    builder
      // ============ FETCH WEEKLY MEETINGS ============
      .addCase(fetchWeeklyMeetings.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWeeklyMeetings.fulfilled, (state, action) => {
        state.status = 'idle';
        state.weeklyMeetings = action.payload.meetings;
        state.userPlan = action.payload.userPlan;
      })
      .addCase(fetchWeeklyMeetings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetWeeklySchedule } = weeklyScheduleSlice.actions;
export default weeklyScheduleSlice.reducer;