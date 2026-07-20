import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import paymentReducer from  './paymentSlice';
import faqReducer from  './faqSlice';
import homeReducer from  './homeSlice';
import profileReducer from './profileSlice';
import weeklyScheduleReducer from  './weeklyScheduleSlice';
import billingReducer from  './billingslice';
import pastSessionReducer from  './pastSessionSlice';
import feedbackReducer from './feedbackSlice';
import forgotPasswordReducer from './forgotPasswordSlice';
import notificationsReducer from './notificationsSlice';


import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define root reducer with proper typing
const rootReducer = combineReducers({ 
  auth: authReducer ,
  payment:paymentReducer,
  faq:faqReducer,
  home:homeReducer,
  profile: profileReducer,
  weeklySchedule:weeklyScheduleReducer,
  billing:billingReducer,
  pastSessions:pastSessionReducer,
  feedback: feedbackReducer,
  forgotPassword: forgotPasswordReducer,
  notifications: notificationsReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ 
      serializableCheck: { 
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] 
      } 
    }),
});

export const persistor = persistStore(store);

// Infer types from the root reducer directly
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
