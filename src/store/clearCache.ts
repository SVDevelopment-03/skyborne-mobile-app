import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor } from '../store'; // Your Redux store and persistor
import { resetAuthState, clearError } from '../store/authSlice';
import { clearNotifications } from './notificationsSlice';
import { notificationHistoryService } from '../services/notificationHistoryService';

/**
 * Immediately clear all auth-related caches and Redux state
 * Call this when stuck on "Logging in..." screen
 */
export const clearAuthCache = async () => {
  try {
    console.log('🔄 Clearing auth cache...');

    // 1. Clear Redux auth state
    store.dispatch(resetAuthState());
    console.log('✅ Redux auth state cleared');

    // 2. Clear AsyncStorage auth tokens
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@refresh_token');
    console.log('✅ AsyncStorage tokens cleared');

    // 3. Clear any OTP-related data
    await AsyncStorage.removeItem('@otp_email');
    await AsyncStorage.removeItem('@otp_phone');
    await AsyncStorage.removeItem('@temp_user_id');
    console.log('✅ OTP data cleared');

    // 4. Optional: Clear form data if stored
    await AsyncStorage.removeItem('@form_data');
    console.log('✅ Form data cleared');

    console.log('✨ All auth cache cleared successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

/**
 * Soft reset - Only clears Redux error state, keeps user logged in
 */
export const clearAuthError = () => {
  try {
    store.dispatch(clearError());
    console.log('✅ Auth error cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth error:', error);
    return false;
  }
};

/**
 * Full device cache clear - Nuclear option
 */
export const clearAllAppCache = async () => {
  try {
    console.log('🔄 Clearing ALL app cache...');

    // Clear all AsyncStorage
    await notificationHistoryService.clear();
    console.log('✅ Notification history cleared');

    await AsyncStorage.clear();
    console.log('✅ All AsyncStorage cleared');

    store.dispatch(clearNotifications());
    console.log('✅ Notifications state cleared');

    store.dispatch(resetAuthState());
    console.log('✅ Redux state reset');

    await persistor.purge();
    console.log('✅ Persisted store purged');

    console.log('✨ All app cache cleared!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing all cache:', error);
    return false;
  }
};

/**
 * Check current auth state (for debugging)
 */
export const debugAuthState = async () => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    const refreshToken = await AsyncStorage.getItem('@refresh_token');
    const reduxState = store.getState().auth;

    console.log('🔍 Auth Debug Info:');
    console.log('Token:', token ? '✅ Present' : '❌ Missing');
    console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
    console.log('Redux Status:', reduxState.status);
    console.log('Redux Error:', reduxState.error);
    console.log('Redux LoggedIn:', reduxState.loggedIn);
    console.log('Full Redux State:', reduxState);

    return {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      reduxState,
    };
  } catch (error) {
    console.error('❌ Error getting auth state:', error);
  }
};