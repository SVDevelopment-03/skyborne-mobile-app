import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const API_BASE_URL = APP_API_BASE_URL;

type LoggedInUserRegion = {
  region: string | null;
  code: string | null;
};

type CountryRegion = {
  _id?: string;
  name?: string;
  code?: string;
  timezone?: string;
  [key: string]: any;
};

type CountryItem = {
  _id?: string;
  name?: string;
  code?: string;
  region?: CountryRegion | string | null;
  [key: string]: any;
};

type LoggedInUserCountryRegion = {
  countryCode: string | null;
  country: string | null;
  regionName: string | null;
  regionCode: string | null;
  countryDetails: CountryItem | null;
};

const normalizeKey = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const safeUpper = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const readPersistedAuthUser = async (): Promise<any | null> => {
  try {
    const raw = await AsyncStorage.getItem('persist:root');
    if (!raw) return null;
    const root = JSON.parse(raw);
    const authRaw = typeof root?.auth === 'string' ? root.auth : null;
    if (!authRaw) return null;
    const auth = JSON.parse(authRaw);
    return auth?.user || null;
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is valid (basic check)
 * Note: This is a client-side check only - server validation is still needed
 */
const isTokenValid = (token: string): boolean => {
  if (!token || token.length < 10) return false;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      if (currentTime > expirationTime) {
        console.warn('⚠️ Token has expired at', new Date(expirationTime).toISOString());
        return false;
      }
    }
    
    console.log('✅ Token is valid, expires at', new Date((payload.exp || 0) * 1000).toISOString());
    return true;
  } catch (error) {
    console.warn('⚠️ Could not validate token format:', error);
    return false;
  }
};

/**
 * Normalize timezone names to standard IANA format
 * @param tz - Timezone string
 * @returns Normalized timezone string
 */
const normalizeTimezone = (tz: string): string => {
  const map: Record<string, string> = {
    'Asia/Calcutta': 'Asia/Kolkata',
  };
  return map[tz] || tz;
};

/**
 * Map timezone to user's region
 * @param tz - Timezone string
 * @returns Region name (Gulf, UK / Europe, Canada / USA, APAC)
 */
const mapTimezoneToRegion = (tz: string): string => {
  const timezone = normalizeTimezone(tz);
  const offset = dayjs().tz(timezone).utcOffset();

  // Gulf regions: UAE (UTC+4), Kuwait (UTC+3)
  if (offset === 180 || offset === 240) {
    return 'Gulf';
  }

  // European timezones
  if (timezone.startsWith('Europe/')) {
    return 'UK / Europe';
  }

  // American timezones
  if (timezone.startsWith('America/')) {
    return 'Canada / USA';
  }

  // Asia-Pacific regions
  if (
    timezone.startsWith('Asia/') ||
    timezone.startsWith('Australia/') ||
    timezone.startsWith('Pacific/')
  ) {
    return 'APAC';
  }

  // Default to APAC
  return 'APAC';
};

/**
 * Fetch logged-in user's region info from backend API.
 * Expected user shape can contain:
 * - user.region: { name, code } OR
 * - user.regionName + user.regionCode OR
 * - user.region + user.code
 */
export const fetchLoggedInUserRegion = async (
  path: string = '/me'
): Promise<LoggedInUserRegion> => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    
    if (!token) {
      console.warn('⚠️ No authentication token found in AsyncStorage');
      return { region: null, code: null };
    }

    // Validate token before making request
    if (!isTokenValid(token)) {
      console.error('❌ Token is invalid or expired - cannot fetch user region');
      return { region: null, code: null };
    }

    // Log token info (first 20 chars to avoid leaking full token)
    const tokenPreview = token.substring(0, 20) + '...';
    console.log('🔑 Making /me request with token:', tokenPreview, 'to', API_BASE_URL);

    const response = await axios.get(`${API_BASE_URL}${path}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });

    const user = response?.data?.user || response?.data?.data?.user || null;
    const regionObj =
      user?.region && typeof user.region === 'object' ? user.region : null;

    const result = {
      region:
        regionObj?.name ||
        user?.regionName ||
        (typeof user?.region === 'string' ? user.region : null) ||
        null,
      code: regionObj?.code || user?.regionCode || user?.code || null,
    };

    console.log('✅ Successfully fetched user region:', result);
    return result;
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const errorMsg = error?.response?.data?.message || error?.message || 'Unknown error';
    
    if (statusCode === 401) {
      console.error('❌ Authentication failed (401):', errorMsg, '- Token may be invalid or expired');
    } else if (statusCode === 404) {
      console.error('❌ User not found (404):', errorMsg, '- Ensure user exists in database');
    } else if (statusCode === 500) {
      console.error('❌ Server error (500):', errorMsg);
    } else {
      console.error('❌ Failed to fetch logged-in user region:', `Status ${statusCode}`, errorMsg);
    }
    
    return { region: null, code: null };
  }
};

/**
 * Fetch countries list + current logged-in user, then match by country code.
 * Returns matched country details and region name/code.
 */
export const fetchLoggedInUserCountryRegion = async (): Promise<LoggedInUserCountryRegion> => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (!token) {
      console.warn('⚠️ No authentication token found - using timezone-based fallback');
      const { region } = getUserRegion();
      return {
        countryCode: null,
        country: null,
        regionName: region,
        regionCode: null,
        countryDetails: null,
      };
    }

    console.log('🔄 Fetching user country/region from API_BASE_URL:', API_BASE_URL);

    const [userRes, countriesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/me`, { 
        headers,
        timeout: 5000,
      }).catch(err => {
        console.warn('⚠️ Failed to fetch /me endpoint:', err?.response?.status, err?.message);
        return null;
      }),
      axios.get(`${API_BASE_URL}/countries`, {
        headers,
        params: { page: 1, limit: 1000, search: '' },
        timeout: 5000,
      }).catch(err => {
        console.warn('⚠️ Failed to fetch countries list:', err?.message);
        return null;
      }),
    ]);

    // If /me failed but we got countries list, use fallback
    if (!userRes) {
      console.warn('⚠️ /me endpoint failed (404), attempting fallback to persisted user data');
      const persistedUser = await readPersistedAuthUser();
      
      // If we have persisted user data, try to match country to region
      if (persistedUser?.countryCode || persistedUser?.country) {
        const userCountryCodeRaw = persistedUser?.countryCode || '';
        const userCountryNameRaw = typeof persistedUser?.country === 'object' 
          ? persistedUser?.country?.name 
          : persistedUser?.country;
        
        if (countriesRes) {
          const countries: CountryItem[] = countriesRes?.data?.data?.countries || [];
          const matchedCountry = countries.find((item) => safeUpper(item?.code) === safeUpper(userCountryCodeRaw));
          const matchedRegion = matchedCountry?.region;
          const regionName =
            matchedRegion && typeof matchedRegion !== 'string'
              ? matchedRegion.name || null
              : null;
          const regionCode =
            matchedRegion && typeof matchedRegion !== 'string'
              ? matchedRegion.code || null
              : null;

          const result = {
            countryCode: userCountryCodeRaw || null,
            country: userCountryNameRaw,
            regionName,
            regionCode,
            countryDetails: matchedCountry || null,
          };
          console.log('✅ Using persisted user data for country/region:', result);
          return result;
        }
      }
      
      // If no persisted data or countries list failed, use timezone fallback
      console.log('⚠️ No persisted user data, falling back to timezone-based detection');
      const { region } = getUserRegion();
      return {
        countryCode: null,
        country: null,
        regionName: region,
        regionCode: null,
        countryDetails: null,
      };
    }

    const user = userRes?.data?.user || userRes?.data?.data?.user || null;
    const persistedUser = await readPersistedAuthUser();

    const userCountryCodeRaw =
      user?.countryCode ||
      persistedUser?.countryCode ||
      (typeof user?.country === 'object' ? user?.country?.code : '') ||
      (typeof persistedUser?.country === 'object' ? persistedUser?.country?.code : '') ||
      '';
    const userCountryNameRaw =
      (typeof user?.country === 'object' ? user?.country?.name : user?.country) ||
      (typeof persistedUser?.country === 'object'
        ? persistedUser?.country?.name
        : persistedUser?.country) ||
      '';
    const userCountryIdRaw =
      (typeof user?.country === 'object' ? user?.country?._id : '') ||
      user?.countryId ||
      (typeof persistedUser?.country === 'object' ? persistedUser?.country?._id : '') ||
      persistedUser?.countryId ||
      '';

    const countryCode = String(userCountryCodeRaw || '').trim().toUpperCase();
    const country = typeof userCountryNameRaw === 'string' ? userCountryNameRaw : null;
    const countryId = String(userCountryIdRaw || '').trim();

    // If countries list is not available, fall back to timezone
    if (!countriesRes) {
      console.warn('⚠️ Countries list unavailable, using timezone-based region');
      const { region } = getUserRegion();
      return {
        countryCode: countryCode || null,
        country,
        regionName: region,
        regionCode: null,
        countryDetails: null,
      };
    }

    const countries: CountryItem[] = countriesRes?.data?.data?.countries || [];
    let matchedCountry =
      countries.find((item) => safeUpper(item?.code) === countryCode) ||
      countries.find(
        (item) =>
          normalizeKey(item?.name) !== '' &&
          normalizeKey(item?.name) === normalizeKey(country)
      ) ||
      countries.find((item) => String(item?._id || '').trim() === countryId) ||
      null;

    if (!matchedCountry && (country || countryCode)) {
      const searchKey = (country || countryCode).trim();
      try {
        const searchRes = await axios.get(`${API_BASE_URL}/countries`, {
          headers,
          params: { page: 1, limit: 50, search: searchKey },
          timeout: 5000,
        });
        const searchedCountries: CountryItem[] = searchRes?.data?.data?.countries || [];
        matchedCountry =
          searchedCountries.find((item) => safeUpper(item?.code) === countryCode) ||
          searchedCountries.find(
            (item) =>
              normalizeKey(item?.name) !== '' &&
              normalizeKey(item?.name) === normalizeKey(country)
          ) ||
          searchedCountries.find((item) => String(item?._id || '').trim() === countryId) ||
          null;
      } catch (searchError) {
        console.warn('⚠️ Country search failed:', searchError);
        // Continue without search result
      }
    }

    const regionRaw = matchedCountry?.region;
    const regionObj =
      regionRaw && typeof regionRaw === 'object' ? (regionRaw as CountryRegion) : null;

    const result = {
      countryCode: countryCode || null,
      country,
      regionName: regionObj?.name || null,
      regionCode: regionObj?.code || null,
      countryDetails: matchedCountry,
    };
    
    console.log('✅ Successfully fetched country/region from API:', {
      userCountryCode: countryCode,
      userCountry: country,
      mappedRegion: regionObj?.name,
    });
    return result;
  } catch (error: any) {
    const errorMsg = error?.response?.status === 404 
      ? 'User not found (404)'
      : error?.message || 'Unknown error';
    const statusCode = error?.response?.status || error?.code || 'unknown';
    console.warn('⚠️ Error in fetchLoggedInUserCountryRegion:', errorMsg, `(${statusCode})`);
    
    // Final fallback to timezone-based detection
    try {
      const { region } = getUserRegion();
      console.log('📍 Using timezone-based fallback region:', region);
      return {
        countryCode: null,
        country: null,
        regionName: region,
        regionCode: null,
        countryDetails: null,
      };
    } catch (fallbackError) {
      console.error('❌ Even fallback region detection failed:', fallbackError);
      // Return a safe default (APAC)
      return {
        countryCode: null,
        country: null,
        regionName: 'APAC',
        regionCode: null,
        countryDetails: null,
      };
    }
  }
};

/**
 * Get user's timezone and region
 * @returns Object containing timezone and region
 */
export const getUserRegion = (): {
  timezone: string;
  region: string;
} => {
  const tzGuess = dayjs.tz.guess();
  const timezone = normalizeTimezone(tzGuess);
  const region = mapTimezoneToRegion(timezone);

  console.log('🌍 Detected User Region:', { timezone, region });

  return { timezone, region };
};

/**
 * Format date according to user's timezone
 * CRITICAL: Parses ISO string as UTC, then converts to user's timezone
 * @param isoString - ISO 8601 date string (in UTC)
 * @param timezone - User's timezone (optional, uses detected timezone if not provided)
 * @returns Formatted date string (e.g., "Jan 21, 2024")
 */
export const formatDateWithTimezone = (
  isoString: string,
  timezone?: string
): string => {
  if (!isoString) return 'N/A';

  try {
    const tz = timezone || dayjs.tz.guess();
    const normalizedTz = normalizeTimezone(tz);

    // CRITICAL: Parse as UTC first, then convert to target timezone
    const date = dayjs.utc(isoString).tz(normalizedTz);

    if (!date.isValid()) {
      console.error('⚠️ Invalid date:', isoString);
      return 'Invalid Date';
    }

    return date.format('MMM DD, YYYY'); // e.g., "Jan 21, 2024"
  } catch (error) {
    console.error('❌ Date formatting error:', error);
    return 'N/A';
  }
};

/**
 * Format time according to user's timezone
 * CRITICAL: Parses ISO string as UTC, then converts to user's timezone
 * @param isoString - ISO 8601 date string (in UTC)
 * @param timezone - User's timezone (optional, uses detected timezone if not provided)
 * @returns Formatted time string (e.g., "11:00 AM")
 */
export const formatTimeWithTimezone = (
  isoString: string,
  timezone?: string
): string => {
  if (!isoString) return 'N/A';

  try {
    const tz = timezone || dayjs.tz.guess();
    const normalizedTz = normalizeTimezone(tz);

    // CRITICAL: Parse as UTC first, then convert to target timezone
    const time = dayjs.utc(isoString).tz(normalizedTz);

    if (!time.isValid()) {
      console.error('⚠️ Invalid time:', isoString);
      return 'Invalid Time';
    }

    return time.format('h:mm A'); // e.g., "11:00 AM"
  } catch (error) {
    console.error('❌ Time formatting error:', error);
    return 'N/A';
  }
};

/**
 * Format both date and time together
 * CRITICAL: Parses ISO string as UTC, then converts to user's timezone
 * @param isoString - ISO 8601 date string (in UTC)
 * @param timezone - User's timezone (optional, uses detected timezone if not provided)
 * @returns Formatted date-time string (e.g., "Jan 21, 11:00 AM")
 */
export const formatDateTimeWithTimezone = (
  isoString: string,
  timezone?: string
): string => {
  if (!isoString) return 'N/A';

  try {
    const tz = timezone || dayjs.tz.guess();
    const normalizedTz = normalizeTimezone(tz);

    // CRITICAL: Parse as UTC first, then convert to target timezone
    const dateTime = dayjs.utc(isoString).tz(normalizedTz);

    if (!dateTime.isValid()) {
      console.error('⚠️ Invalid date-time:', isoString);
      return 'Invalid Date';
    }

    return dateTime.format('MMM DD, h:mm A'); // e.g., "Jan 21, 11:00 AM"
  } catch (error) {
    console.error('❌ DateTime formatting error:', error);
    return 'N/A';
  }
};

/**
 * Get day of week from ISO string in user's timezone
 * @param isoString - ISO 8601 date string (in UTC)
 * @param timezone - User's timezone (optional)
 * @returns Day name (e.g., "Monday")
 */
export const formatDayWithTimezone = (
  isoString: string,
  timezone?: string
): string => {
  if (!isoString) return 'N/A';

  try {
    const tz = timezone || dayjs.tz.guess();
    const normalizedTz = normalizeTimezone(tz);

    const day = dayjs.utc(isoString).tz(normalizedTz);

    if (!day.isValid()) {
      return 'Invalid Date';
    }

    return day.format('dddd'); // e.g., "Monday"
  } catch (error) {
    console.error('❌ Day formatting error:', error);
    return 'N/A';
  }
};

/**
 * IMPORTANT: This function extracts the date by assuming the pre-formatted
 * API localTime string is correct and reconstructs the date from ISO + timezone
 * 
 * The backend sends:
 * - meeting.localTime: ISO string (UTC) e.g., "2026-01-20T23:00:00.000Z"
 * - regions[].localTime: Pre-formatted time e.g., "10:00 AM"
 * - regions[].timezone: Timezone e.g., "Asia/Singapore"
 * 
 * We parse the ISO as UTC, convert to the region timezone to get the correct date
 * Format matches web: "21 Jan 2026" (day month year, no comma)
 * 
 * @param isoString - ISO 8601 date string (in UTC)
 * @param timezone - Region-specific timezone
 * @returns Formatted date matching the region's local time
 */
export const getRegionDateFromISO = (
  isoString: string,
  timezone: string
): string => {
  if (!isoString || !timezone) return 'N/A';

  try {
    const normalizedTz = normalizeTimezone(timezone);
    
    // Parse UTC ISO and convert to region timezone
    // This gives us the ACTUAL local date for that region
    const localDate = dayjs.utc(isoString).tz(normalizedTz);

    if (!localDate.isValid()) {
      console.error('⚠️ Invalid date for region:', isoString, timezone);
      return 'Invalid Date';
    }

    // Format to match web: "21 Jan 2026" (day month year)
    // Using en-GB locale format
    const date = new Date(localDate.format());
    const options = {
      day: 'numeric' as const,
      month: 'short' as const,
      year: 'numeric' as const,
      timeZone: normalizedTz,
    };

    return date.toLocaleDateString('en-GB', options).replace(',', '');
  } catch (error) {
    console.error('❌ Region date formatting error:', error, { isoString, timezone });
    return 'N/A';
  }
};
