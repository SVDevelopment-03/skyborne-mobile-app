  // ============ homeSlice.ts ============
  import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
  import {
    getUserProfile as getUserProfileService,
    getTodaysMeetings as getTodaysMeetingsService,
    getUpcomingMeetings as getUpcomingMeetingsService,
    getHomeData as getHomeDataService,
    getWeeklyActivity as getWeeklyActivityService,
    Meeting,
    UserProfile,
    WeeklyActivityResponse,
  } from '../services/homeService';
  import { updateProfile } from './profileSlice';

  export interface HomeState {
    user: UserProfile | null;
    todayMeetings: Meeting[];
    upcomingMeetings: Meeting[];
    weeklyActivity: WeeklyActivityResponse | null;
    userPlan: string | null;
    status: 'idle' | 'loading' | 'failed';
    error: string | null;
    searchQuery: string;
    lastFetch: number | null;
  }

  const initialState: HomeState = {
    user: null,
    todayMeetings: [],
    upcomingMeetings: [],
    weeklyActivity: null,
    userPlan: null,
    status: 'idle',
    error: null,
    searchQuery: '',
    lastFetch: null,
  };

  /**
   * Fetch user profile thunk
   */
  export const fetchUserProfile = createAsyncThunk(
    'home/fetchUserProfile',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getUserProfileService();
        console.log('user response', response);

        return response.user;
      } catch (error: any) {
        console.error('Fetch user profile error:', error);
        return rejectWithValue(error.message || 'Failed to fetch user profile');
      }
    },
  );

  /**
   * Fetch weekly activity thunk
   */
  export const fetchWeeklyActivity = createAsyncThunk(
    'home/fetchWeeklyActivity',
    async (_, { rejectWithValue }) => {
      try {
        return await getWeeklyActivityService();
      } catch (error: any) {
        console.error('Fetch weekly activity error:', error);
        return rejectWithValue(error.message || 'Failed to fetch weekly activity');
      }
    },
  );

  /**
   * Fetch today's meetings thunk
   * NO search parameter - frontend filtering only
   */
  export const fetchTodaysMeetings = createAsyncThunk(
    'home/fetchTodaysMeetings',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getTodaysMeetingsService();
        return response;
      } catch (error: any) {
        console.error('Fetch today meetings error:', error);
        return rejectWithValue(
          error.message || "Failed to fetch today's meetings",
        );
      }
    },
  );

  /**
   * Fetch upcoming meetings thunk
   * NO search parameter - frontend filtering only
   */
  export const fetchUpcomingMeetings = createAsyncThunk(
    'home/fetchUpcomingMeetings',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getUpcomingMeetingsService();
        return response;
      } catch (error: any) {
        console.error('Fetch upcoming meetings error:', error);
        return rejectWithValue(
          error.message || 'Failed to fetch upcoming meetings',
        );
      }
    },
  );

  /**
   * Fetch home data (user + all meetings)
   * NO search parameter - frontend filtering only
   */
  export const fetchHomeData = createAsyncThunk(
    'home/fetchHomeData',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getHomeDataService();
        return response;
      } catch (error: any) {
        console.error('Fetch home data error:', error);
        return rejectWithValue(error.message || 'Failed to fetch home data');
      }
    },
  );

  /**
   * Fetch all meetings concurrently
   * NO search parameter - frontend filtering only
   */
  export const fetchAllMeetings = createAsyncThunk(
    'home/fetchAllMeetings',
    async (_, { rejectWithValue }) => {
      try {
        const response = await getHomeDataService();
        return response;
      } catch (error: any) {
        console.error('Fetch all meetings error:', error);
        return rejectWithValue(error.message || 'Failed to fetch meetings');
      }
    },
  );

  /**
   * Search meetings with query sent to backend
   */
  export const fetchSearchMeetings = createAsyncThunk(
    'home/fetchSearchMeetings',
    async (search: string, { rejectWithValue }) => {
      try {
        const response = await getHomeDataService(search);
        return response;
      } catch (error: any) {
        console.error('Search meetings error:', error);
        return rejectWithValue(error.message || 'Failed to search meetings');
      }
    },
  );

  const homeSlice = createSlice({
    name: 'home',
    initialState,
    reducers: {
      /**
       * Set search query (for state management only)
       */
      setSearchQuery(state, action) {
        state.searchQuery = action.payload;
      },

      /**
       * Clear error message
       */
      clearError(state) {
        state.error = null;
      },

      /**
       * Reset home state
       */
      resetHome(state) {
        state.user = null;
        state.todayMeetings = [];
        state.upcomingMeetings = [];
        state.userPlan = null;
        state.searchQuery = '';
        state.error = null;
        state.status = 'idle';
      },
    },
    extraReducers: builder => {
      builder
        // ============ FETCH USER PROFILE ============
        .addCase(fetchUserProfile.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchUserProfile.fulfilled, (state, action) => {
          state.status = 'idle';
          console.log('slice payload', action.payload);
          state.user = action.payload;
        })
        .addCase(fetchUserProfile.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ FETCH WEEKLY ACTIVITY ============
        .addCase(fetchWeeklyActivity.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchWeeklyActivity.fulfilled, (state, action) => {
          state.status = 'idle';
          state.weeklyActivity = action.payload;
        })
        .addCase(fetchWeeklyActivity.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ SYNC PROFILE UPDATES ============
        .addCase(updateProfile.fulfilled, (state, action) => {
          state.user = {
            ...(state.user ?? {}),
            ...(action.payload ?? {}),
          };
        })

        // ============ FETCH TODAY'S MEETINGS ============
        .addCase(fetchTodaysMeetings.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchTodaysMeetings.fulfilled, (state, action) => {
          state.status = 'idle';
          state.todayMeetings = action.payload.meetings;
          state.userPlan = action.payload.userPlan;
          state.lastFetch = Date.now();
        })
        .addCase(fetchTodaysMeetings.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ FETCH UPCOMING MEETINGS ============
        .addCase(fetchUpcomingMeetings.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchUpcomingMeetings.fulfilled, (state, action) => {
          state.status = 'idle';
          state.upcomingMeetings = action.payload.meetings;
          state.userPlan = action.payload.userPlan;
          state.lastFetch = Date.now();
        })
        .addCase(fetchUpcomingMeetings.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ FETCH HOME DATA (USER + MEETINGS) ============
        .addCase(fetchHomeData.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchHomeData.fulfilled, (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user.user;
          state.todayMeetings = action.payload.today.meetings;
          state.upcomingMeetings = action.payload.upcoming.meetings;
          state.userPlan = action.payload.today.userPlan;
          state.lastFetch = Date.now();
        })
        .addCase(fetchHomeData.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ FETCH ALL MEETINGS ============
        .addCase(fetchAllMeetings.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchAllMeetings.fulfilled, (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user.user;
          state.todayMeetings = action.payload.today.meetings;
          state.upcomingMeetings = action.payload.upcoming.meetings;
          state.userPlan = action.payload.today.userPlan;
          state.lastFetch = Date.now();
        })
        .addCase(fetchAllMeetings.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        })

        // ============ SEARCH MEETINGS ============
        .addCase(fetchSearchMeetings.pending, state => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchSearchMeetings.fulfilled, (state, action) => {
          state.status = 'idle';
          state.user = action.payload.user.user;
          state.todayMeetings = action.payload.today.meetings;
          state.upcomingMeetings = action.payload.upcoming.meetings;
          state.userPlan = action.payload.today.userPlan;
          state.lastFetch = Date.now();
        })
        .addCase(fetchSearchMeetings.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload as string;
        });
    },
  });

  export const { setSearchQuery, clearError, resetHome } = homeSlice.actions;
  export default homeSlice.reducer;
