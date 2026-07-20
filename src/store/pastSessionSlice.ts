// ============ pastSessionsSlice.ts ============
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getPastSessions as getPastSessionsService,
  Meeting,
} from '../services/pastSessionService';

export interface PastSessionsState {
  pastSessions: Meeting[];
  totalCount: number;
  hasMore: boolean;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  lastFetch: number | null;
}

const initialState: PastSessionsState = {
  pastSessions: [],
  totalCount: 0,
  hasMore: true,
  status: 'idle',
  error: null,
  lastFetch: null,
};

/**
 * Fetch past sessions with pagination
 */
export const fetchPastSessions = createAsyncThunk(
  'pastSessions/fetchPastSessions',
  async (
    { skip = 0, limit = 10 }: { skip?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await getPastSessionsService(skip, limit);
      return response;
    } catch (error: any) {
      console.error('Fetch past sessions error:', error);
      return rejectWithValue(
        error.message || 'Failed to fetch past sessions',
      );
    }
  },
);

const pastSessionsSlice = createSlice({
  name: 'pastSessions',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError(state) {
      state.error = null;
    },

    /**
     * Reset past sessions state
     */
    resetPastSessions(state) {
      state.pastSessions = [];
      state.totalCount = 0;
      state.hasMore = true;
      state.error = null;
      state.status = 'idle';
    },

    /**
     * Append more sessions (for infinite scroll)
     */
    appendPastSessions(state, action) {
      state.pastSessions = [...state.pastSessions, ...action.payload.sessions];
      state.totalCount = action.payload.totalCount;
      state.hasMore = action.payload.hasMore;
    },
  },
  extraReducers: builder => {
    builder
      // ============ FETCH PAST SESSIONS ============
      .addCase(fetchPastSessions.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPastSessions.fulfilled, (state, action) => {
        state.status = 'idle';
        state.pastSessions = action.payload.meetings;
        state.totalCount = action.payload.totalCount;
        state.hasMore = action.payload.hasMore;
        state.lastFetch = Date.now();
      })
      .addCase(fetchPastSessions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetPastSessions, appendPastSessions } =
  pastSessionsSlice.actions;
export default pastSessionsSlice.reducer;