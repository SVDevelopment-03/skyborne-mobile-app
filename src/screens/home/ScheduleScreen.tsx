

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScheduleImages } from '../../assets/images/schedule';
import BottomNav from '../../components/BottomNav';
import {
  weeklyScheduleService,
  Meeting,
  MeetingsResponse,
} from '../../services/WeeklyScheduleService';
import { profileService } from '../../services/profileService';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import {
  fetchLoggedInUserCountryRegion,
  fetchLoggedInUserRegion,
} from '../../utils/timezoneUtils';

type WeeklyScheduleNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Schedule'
>;

interface WeeklyScheduleScreenProps {
  navigation: WeeklyScheduleNavigationProp;
}

interface WeekDay {
  day: string;
  date: number;
  dayIndex: number;
  dateKey: string;
}

const normalizeRegionLabel = (value: string = ''): string => {
  const raw = value.trim().toLowerCase();
  if (!raw) return '';

  if (raw.includes('gulf')) return 'gulf';
  if (raw.includes('uk') || raw.includes('europe')) return 'uk / europe';
  if (raw.includes('canada') || raw.includes('usa') || raw.includes('us'))
    return 'canada / usa';
  if (raw.includes('apac') || raw.includes('asia') || raw.includes('pacific'))
    return 'apac';

  return raw.replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();
};

const WeeklyScheduleScreen: React.FC<WeeklyScheduleScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<number>(
    new Date().getDate(),
  );
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(
    'upcoming',
  );
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyMeetings, setWeeklyMeetings] = useState<Meeting[]>([]);
  const [userPlan, setUserPlan] = useState<string>('');
  const [userRegionParam, setUserRegionParam] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocalDateKey = useCallback((value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    try {
      return new Intl.DateTimeFormat('en-CA', formatOptions).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
    }
  }, []);

  // Initialize week data
  useEffect(() => {
    initializeWeek();
  }, []);

  // Fetch weekly meetings
  useEffect(() => {
    fetchWeeklyMeetings();
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await profileService.getPlans();
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (isMounted) setPlans(data);
      } catch {
        if (isMounted) setPlans([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const initializeWeek = () => {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const firstDayOfWeek = new Date(currentDate);
    firstDayOfWeek.setDate(currentDate.getDate() - currentDay);

    const days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const newWeekData: WeekDay[] = days.map((day, index) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + index);
      const dateKey = getLocalDateKey(date) || '';

      return {
        day,
        date: date.getDate(),
        dayIndex: index,
        dateKey,
      };
    });

    setWeekDays(newWeekData);
    setSelectedDate(currentDate.getDate());
  };

  const getRegionParam = async (): Promise<string | undefined> => {
    try {
      const { regionName, regionCode } = await fetchLoggedInUserCountryRegion();
      if (regionName?.trim()) return regionName.trim();
      if (regionCode?.trim()) return regionCode.trim();
    } catch (error) {
      console.warn('Failed to get region from country mapping:', error);
    }

    try {
      const { region, code } = await fetchLoggedInUserRegion();
      if (region?.trim()) return region.trim();
      if (code?.trim()) return code.trim();
    } catch (error) {
      console.warn('Failed to get fallback region from user profile:', error);
    }

    return undefined;
  };

  const fetchWeeklyMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const regionParam = await getRegionParam();
      setUserRegionParam(regionParam || '');
      const response: MeetingsResponse =
        await weeklyScheduleService.getWeeklyMeetings(regionParam);

      if (response.success) {
        setWeeklyMeetings(response.meetings || []);
        setUserPlan(response.userPlan || '');
      } else {
        setError('Failed to load meetings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMeetingEffectiveLocalTime = useCallback(
    (meeting: Meeting): string | undefined => {
      if (!meeting) return undefined;
      const candidate = String(userRegionParam || '').trim();
      if (candidate && Array.isArray(meeting?.regions) && meeting.regions.length > 0) {
        const normalizedCandidate = normalizeRegionLabel(candidate);
        const matched = meeting.regions.find(r => {
          const regionValue = normalizeRegionLabel(String(r?.region || ''));
          return regionValue && regionValue === normalizedCandidate;
        });
        if (matched?.localTime) return String(matched.localTime);
      }

      if (Array.isArray(meeting?.regions) && meeting.regions.length > 0) {
        const firstWithTime = meeting.regions.find(r => !!r?.localTime);
        if (firstWithTime?.localTime) return String(firstWithTime.localTime);
      }

      return meeting?.localTime ? String(meeting.localTime) : undefined;
    },
    [userRegionParam],
  );

  const handleClassPress = useCallback(
    (classId: string) => {
      navigation.navigate('ClassDetails', { classId });
    },
    [navigation],
  );

  const handleRetry = () => {
    fetchWeeklyMeetings();
  };

  const getFormattedTime = (
    meeting: Meeting,
  ): { time: string; period: string } => {
    const effectiveLocalTime = getMeetingEffectiveLocalTime(meeting);
    if (!effectiveLocalTime) {
      return { time: 'N/A', period: '' };
    }

    const date = new Date(effectiveLocalTime);
    if (isNaN(date.getTime())) {
      return { time: 'Invalid', period: '' };
    }

    const formatted = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const [time, period] = formatted.split(' ');
    return { time: time || 'N/A', period: period || '' };
  };

  const getSessionColor = (
    index: number,
  ): { backgroundColor: string; color: string } => {
    return index % 2 === 0
      ? { backgroundColor: '#030416', color: '#D4D4D4' }
      : { backgroundColor: '#B95E82', color: '#FFFFFF' };
  };

  const isCompletedMeeting = useCallback(
    (meeting: Meeting): boolean => {
      const status = String(meeting?.status || '').toLowerCase();
      if (status === 'completed' || status === 'failed') return true;
      if (status === 'pending') return false;

      const effectiveLocalTime = getMeetingEffectiveLocalTime(meeting);
      if (!effectiveLocalTime) return false;
      const meetingTime = new Date(effectiveLocalTime);
      if (isNaN(meetingTime.getTime())) return false;
      return meetingTime.getTime() < Date.now();
    },
    [getMeetingEffectiveLocalTime],
  );

  const tabMeetings = useMemo(() => {
    return weeklyMeetings.filter(m => {
      if (!m) return false;
      const completed = isCompletedMeeting(m);
      return activeTab === 'completed' ? completed : !completed;
    });
  }, [weeklyMeetings, activeTab, isCompletedMeeting]);

  const displayWeekDays = useMemo(() => {
    return weekDays.filter(d => {
      if (!d?.dateKey) return false;
      return tabMeetings.some(
        m => {
          const effectiveLocalTime = m ? getMeetingEffectiveLocalTime(m) : undefined;
          return !!effectiveLocalTime && getLocalDateKey(effectiveLocalTime) === d.dateKey;
        },
      );
    });
  }, [weekDays, tabMeetings, getLocalDateKey, getMeetingEffectiveLocalTime]);

  useEffect(() => {
    if (displayWeekDays.length === 0) return;
    const exists = displayWeekDays.some(d => d.date === selectedDate);
    if (!exists) setSelectedDate(displayWeekDays[0].date);
  }, [displayWeekDays, selectedDate]);

  // Filter meetings for selected date (after displayWeekDays/tabMeetings are computed)
  const selectedDay =
    displayWeekDays.find(d => d.date === selectedDate) ||
    displayWeekDays[0] ||
    weekDays.find(d => d.date === selectedDate);
  const selectedDateKey = selectedDay?.dateKey;

  const selectedDayMeetings = tabMeetings.filter(meeting => {
    if (!selectedDateKey) return false;
    const effectiveLocalTime = getMeetingEffectiveLocalTime(meeting);
    if (!effectiveLocalTime) return false;
    return getLocalDateKey(effectiveLocalTime) === selectedDateKey;
  });

  // Filter by search query
  const filteredMeetings = selectedDayMeetings.filter(meeting => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();

    return (
      meeting.title.toLowerCase().includes(searchLower) ||
      meeting.service?.title.toLowerCase().includes(searchLower) ||
      meeting.trainer?.name.toLowerCase().includes(searchLower)
    );
  });

  const isLikelyId = (value: string) =>
    /^[a-f0-9]{24}$/i.test(value.trim()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    );

  const getDisplayPlan = () => {
    const rawPlan = String(userPlan || '').trim();
    if (!rawPlan) return 'Plan';

    const normalizedRaw = rawPlan.toLowerCase();
    const fixedPlanMap: Record<string, string> = {
      'gold-yoga': 'Gold Yoga',
      'gold-zumba': 'Gold Yoga',
      'gold-mixed': 'Gold Yoga',
      diamond: 'Diamond',
      platinum: 'Platinum',
    };
    if (fixedPlanMap[normalizedRaw]) return fixedPlanMap[normalizedRaw];

    if (!isLikelyId(rawPlan)) return rawPlan;

    const match = plans.find((plan: any) => {
      const keys = [
        String(plan?.uuid || '').toLowerCase(),
        String(plan?.planId || '').toLowerCase(),
        String(plan?._id || '').toLowerCase(),
        String(plan?.name || '').toLowerCase().trim(),
      ].filter(Boolean);
      return keys.includes(normalizedRaw);
    });

    if (match?.name) return String(match.name);
    return 'Plan';
  };

  const displayPlan = getDisplayPlan();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Schedule</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image source={ScheduleImages.searchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Sessions name"
            placeholderTextColor="#959595"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Today's Plan Banner */}
        {!isLoading && !error && (
          <View style={styles.todaysPlanBanner}>
            <View style={styles.bannerImageContainer}>
              <ImageBackground
                source={ScheduleImages.PlanImage}
                style={styles.bannerImage}
                resizeMode="cover"
              >
                <ImageBackground
                  source={ScheduleImages.BlackGradient}
                  style={styles.bannerGradient}
                  resizeMode="cover"
                >
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>
                      Your {displayPlan} Package
                    </Text>
                    <Text style={styles.bannerDescription}>
                      See your Yoga, Fitness, Zumba, and Nutrition sessions in
                      one timeline.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bannerButton}
                    onPress={() => navigation.navigate('Profile')}
                  >
                    <ImageBackground
                      style={styles.arrowCircle}
                      source={ScheduleImages.ArrowImage}
                    />
                  </TouchableOpacity>
                </ImageBackground>
              </ImageBackground>
            </View>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'upcoming' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'upcoming' && styles.tabTextActive,
                ]}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'completed' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('completed')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'completed' && styles.tabTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.calendarTitle}>
            {new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          {/* Week Days and Dates */}
          {displayWeekDays.length > 0 ? (
            <View style={styles.weekContainer}>
              {displayWeekDays.map(item => (
                <View key={item.dateKey} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{item.day}</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateContainer,
                      selectedDate === item.date && styles.dateContainerSelected,
                    ]}
                    onPress={() => setSelectedDate(item.date)}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        selectedDate === item.date && styles.dateTextSelected,
                      ]}
                    >
                      {item.date}
                    </Text>
                    <View
                      style={[
                        styles.dotIndicator,
                        selectedDate === item.date && styles.dotIndicatorSelected,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDatesContainer}>
              <Text style={styles.noDatesText}>
                No {activeTab} sessions this week
              </Text>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B95E82" />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sessions Schedule Card */}
        {!isLoading && !error && (
          <View style={styles.scheduleCard}>
            {/* Card Header */}
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleHeaderLeft}>
                <Text style={styles.scheduleDate}>
                  {selectedDay?.day}, {selectedDate}
                </Text>
              </View>
              <View style={styles.scheduleHeaderRight}>
                <View style={styles.sessionsCountPill}>
                  <Text style={styles.sessionsCountPillText}>
                    {filteredMeetings.length} Sessions
                  </Text>
                </View>
              </View>
            </View>

            {/* Sessions List */}
            {filteredMeetings.length > 0 ? (
              <View style={styles.sessionsList}>
                {filteredMeetings.map((meeting, index) => {
                  const { time, period } = getFormattedTime(meeting);
                  const colors = getSessionColor(index);

                  return (
                    <View key={meeting._id}>
                      {/* Time Label */}
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>
                          {time}
                          {'\n'}
                          {period}
                        </Text>
                        <View style={styles.timeDivider} />
                      </View>

                      {/* Session Card */}
                      <TouchableOpacity
                        style={[
                          styles.sessionCard,
                          { backgroundColor: colors.backgroundColor },
                        ]}
                        onPress={() => handleClassPress(meeting._id)}
                        activeOpacity={0.7}
                      >
                        {/* Left: Image and Trainer */}
                        <View style={styles.sessionLeft}>
                          <View style={styles.sessionImageContainer}>
                            <ImageBackground
                              source={ScheduleImages.SessionImage}
                              style={styles.sessionImage}
                              resizeMode="cover"
                            />
                          </View>
                          <Text
                            style={[
                              styles.sessionTrainer,
                              { color: colors.color },
                            ]}
                          >
                            Trainer: {meeting?.trainer?.name || 'N/A'}
                          </Text>
                        </View>

                        {/* Middle: Title and Duration */}
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTitle}>
                            {meeting.title
                              ?.toLowerCase()
                              .replace(/\b\w/g, char => char.toUpperCase())}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            {meeting.duration} min - {meeting.service?.title}
                          </Text>
                        </View>

                        {/* Right: Play Button */}
                        <TouchableOpacity
                          style={styles.sessionPlayButton}
                          onPress={() => handleClassPress(meeting._id)}
                        >
                          <View
                            style={[
                              styles.playButtonCircle,
                              colors.backgroundColor === '#B95E82' &&
                                styles.playButtonCircleDark,
                            ]}
                          >
                            <View style={styles.arrowBgCircle}>
                              <Image source={ScheduleImages.ArrowImage4}
                                style={styles.navArrowIcon4}
                              />
                            </View>
                          </View>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyMessage}>
                  No sessions scheduled for this day
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <BottomNav active="Schedule" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 35,
    marginBottom: 25,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 30,
    lineHeight: 33,
    color: '#494949',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 31,
    height: 43,
    backgroundColor: 'rgba(173, 173, 173, 0.21)',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },
  searchIcon: {
    width: 19,
    height: 19,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Outfit',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.1,
    color: '#959595',
    paddingTop: 13,
    paddingBottom: 15,
  },
  todaysPlanBanner: {
    marginHorizontal: 16,
    marginBottom: 42,
    height: 172,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7BCBC',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    flex: 1,
    paddingHorizontal: 19,
    paddingVertical: 19,
    justifyContent: 'flex-end',
  },
  bannerContent: {
    marginBottom: 3,
  },
  bannerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bannerDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
    width: 204,
  },
  bannerButton: {
    position: 'absolute',
    right: 18,
    bottom: 25,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#B95E82',
  },
  tabText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: '#494949',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  calendarSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  calendarTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    lineHeight: 24,
    color: '#494949',
    marginBottom: 24,
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noDatesContainer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  noDatesText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#959595',
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: '#494949',
    marginBottom: 5,
  },
  dateContainer: {
    width: 48,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEF0C5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainerSelected: {
    backgroundColor: '#FEF0C5',
    borderWidth: 1,
    borderColor: '#494949',
  },
  dateText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#494949',
  },
  dateTextSelected: {
    color: '#494949',
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#B95E82',
  },
  dotIndicatorSelected: {
    backgroundColor: '#B95E82',
  },
  loadingContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#494949',
    fontFamily: 'Satoshi-Regular',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 39,
  },
  scheduleHeaderLeft: {
    flex: 1,
  },
  sessionsCount: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(73, 73, 73, 0.8)',
    marginBottom: 5,
  },
  scheduleDate: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#000000',
  },
  scheduleHeaderRight: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionsCountPill: {
    minWidth: 88,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F1F3F0',
    justifyContent: 'center',
    alignItems: 'center',
    top: 8,
  },
  sessionsCountPillText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(73, 73, 73, 0.9)',
  },
  navArrowLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F3F0',
    justifyContent: 'center',
    alignItems: 'center',
    top: 8,
  },
  navArrowRight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#676767',
    justifyContent: 'center',
    alignItems: 'center',
    top: 8,
  },
  navArrowIcon: {
    width: 28,
    height: 28,
  },
  arrowBgCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowIcon4: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  sessionsList: {
    paddingBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  timeLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    color: '#000000',
    width: 43,
    marginLeft: -6,
  },
  timeDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
    marginLeft: 20,
    marginTop: 11,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 43,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionLeft: {
    marginRight: 23,
  },
  sessionImageContainer: {
    width: 81,
    height: 81,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 17,
  },
  sessionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  sessionDuration: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#FFFFFF',
  },
  sessionTrainer: {
    fontFamily: 'Satoshi-Medium',
    position: 'absolute',
    top: 95,
    minWidth: 131,
    fontSize: 14,
    lineHeight: 19,
  },
  sessionPlayButton: {
    marginTop: 85,
    marginRight: 4,
  },
  playButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircleDark: {
    backgroundColor: '#000000',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Satoshi-Medium',
  },
});

export default WeeklyScheduleScreen;
