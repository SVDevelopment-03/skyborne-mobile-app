import { useCallback, useState } from 'react';
import {  useSelector } from 'react-redux';
import { RootState } from '../store';
import { getClassDetails as getClassDetailsService } from '../services/homeService';
import { HomeImages } from '../assets/images/home';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export function useClassDetailsViewModel() {
  const homeState = useSelector((state: RootState) => state.home);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /**
   * Detect user's region based on timezone
   */
  const getUserRegion = useCallback(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Map timezones to regions
    const regionMap: { [key: string]: string } = {
      'Asia/Dubai': 'Gulf',
      'Asia/Singapore': 'APAC',
      'Europe/London': 'UK/ Europe',
      'America/Toronto': 'Canada/USA',
    };

    // Find matching region or default to first available
    for (const [tz, region] of Object.entries(regionMap)) {
      if (timezone.includes(tz.split('/')[0])) {
        return region;
      }
    }

    return null; // Will use liveRegion as fallback
  }, []);

  /**
   * Get regional time information
   */
  const getRegionalTime = useCallback((meeting: any) => {
    const userRegion = getUserRegion();
    
    // Find the region data for user's region
    const regionData = meeting.regions?.find(
      (r: any) => r.region === userRegion
    );

    // Fallback to live region if user's region not found
    const fallbackRegion = meeting.regions?.find(
      (r: any) => r.region === meeting.liveRegion
    );

    const selectedRegion = regionData || fallbackRegion || meeting.regions?.[0];

    return {
      localTime: selectedRegion?.localTime || meeting.liveTime,
      timezone: selectedRegion?.timezone,
      mode: selectedRegion?.mode || 'live',
      region: selectedRegion?.region,
    };
  }, [getUserRegion]);

  /**
   * Get class details from store or API
   */
  const getClassDetails = useCallback(
    async (classId: string) => {
      if (!classId) {
        setApiError('Invalid class ID');
        return null;
      }

      // First, search in Redux store
      const allMeetings = [...homeState.todayMeetings, ...homeState.upcomingMeetings];

      console.log('📌 classId received in VM:', classId);
      console.log(
        '📌 meetings list (_id):',
        allMeetings.map(m => m._id)
      );
      
      const meeting = allMeetings.find(
        m => m._id === classId || m.id === classId
      );
      console.log("meeting in store", meeting);

      if (meeting) {
        setApiError(null);
        return transformMeetingToClassDetails(meeting);
      }

      // Not found in store, fetch from API
      setIsApiLoading(true);
      setApiError(null);

      try {
        const response = await getClassDetailsService(classId);
        
        if (response && response.data) {
          setIsApiLoading(false);
          setApiError(null);
          return transformMeetingToClassDetails(response.data);
        } else {
          setIsApiLoading(false);
          setApiError('Class details not found');
          return null;
        }
      } catch (err: any) {
        setIsApiLoading(false);
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch class details';
        setApiError(errorMsg);
        console.error('Error fetching class details:', err);
        return null;
      }
    },
    [homeState?.todayMeetings, homeState?.upcomingMeetings]
  );

  /**
   * ✅ FIXED: Transform meeting data to ClassDetails format
   * NOW INCLUDES regionTime (ISO format) for correct button disable logic
   */
  const transformMeetingToClassDetails = (meeting: any) => {

    console.log('🧪 RAW meeting.isLive:', meeting.isLive);
    console.log('🧪 RAW meeting.regions:', meeting.regions);

    const regionalInfo = getRegionalTime(meeting);
    console.log("🔄 Transforming meeting:", meeting);
    
    console.log('🧪 FINAL regional mode:', regionalInfo.mode);

    return {
      _id: meeting._id,
      title: meeting.title,
      description: meeting.description || 'High-energy class to boost your mood and achieve your fitness goals.',
      imageUrl: meeting.imageUrl ?? HomeImages?.yogaFlow,
      trainer: {
        _id: meeting.trainer?._id || meeting.createdBy?._id,
        firstName: meeting.trainer?.firstName || meeting.createdBy?.firstName || 'Coach',
        lastName: meeting.trainer?.lastName || meeting.createdBy?.lastName || 'Name',
        name: meeting.trainer?.name || 
              `${meeting.trainer?.firstName || meeting.createdBy?.firstName || 'Coach'} ${meeting.trainer?.lastName || meeting.createdBy?.lastName || 'Name'}`,
        email: meeting.trainer?.email || meeting.createdBy?.email,
      },
      service: {
        _id: meeting.service?._id,
        title: meeting.service?.title || 'Fitness',
        name: meeting.service?.name,
      },
      
      // ✅ CRITICAL: Use these for button disable logic and time display
      // regionTime = ISO format from backend (used for button disable)
      // startTime = regionalInfo.localTime (formatted string from regions array)
      regionTime: meeting?.localTime, // ISO format - used for button disable logic
      startTime: regionalInfo.localTime, // Display format - pre-formatted from regions
      localTime: meeting.localTime, // Display format
      startDate: meeting.startDate, // Keep for backward compatibility
      timezone: regionalInfo.timezone,
      mode: regionalInfo.mode, // 'live' or 'replay'
      region: regionalInfo.region,
      regions: meeting.regions, // All region variants
      
      duration: meeting.duration || 60,
      level: meeting.level || 'All Levels',
      rating: meeting.rating || 4.0,
      reviews: meeting.reviews || 120,
      requirements: meeting.requirements || [
        'Stable Mind',
        'Good Internet Connection',
        'Water Bottle',
        'Sneakers',
      ],
      maxCapacity: meeting.maxCapacity,
      currentEnrollment: meeting.currentEnrollment,
      classType: meeting.classType,
      location: meeting.location,
      
      // Additional meeting info
      isLive: meeting.isLive,
      liveRegion: meeting.liveRegion,
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
      recordingUrl: meeting.recordingUrl,
      allRegions: meeting.regions, // Keep all regions for reference
    };
  };

  const clearError = useCallback(() => {
    setApiError(null);
  }, []);

  return {
    isLoading: homeState.status === 'loading' || isApiLoading,
    error: apiError || homeState.error,
    getClassDetails,
    clearError,
    getUserRegion,
  };
}