

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
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

// Completed and Upcoming show every session, with no date limit. Classes run
// on alternate Saturdays, so a single calendar week is often empty.
const SCHEDULE_PAST_DAYS = 'all';
const SCHEDULE_FUTURE_DAYS = 'all';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getScheduleRegionParam = async (): Promise<string | undefined> => {
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
  // Selected day is tracked by its full date key (YYYY-MM-DD), not the day of
  // the month, so dates in different months never collide.
  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>(
    'upcoming',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [weeklyMeetings, setWeeklyMeetings] = useState<Meeting[]>([]);
  const [userPlan, setUserPlan] = useState<string>('');
  const [userRegionParam, setUserRegionParam] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Re-read on every fetch so the upcoming/completed split uses a fresh "now".
  const [nowTick, setNowTick] = useState(() => Date.now());
  const hasLoadedOnce = useRef(false);

  const getLocalDateKey = useCallback((value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  const fetchWeeklyMeetings = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      try {
        if (mode === 'initial') setIsLoading(true);
        if (mode === 'refresh') setIsRefreshing(true);
        if (mode !== 'silent') setError(null);

        const regionParam = await getScheduleRegionParam();
        setUserRegionParam(regionParam || '');
        const response: MeetingsResponse =
          await weeklyScheduleService.getWeeklyMeetings(regionParam, {
            pastDays: SCHEDULE_PAST_DAYS,
            futureDays: SCHEDULE_FUTURE_DAYS,
          });

        if (response.success) {
          setWeeklyMeetings(response.meetings || []);
          setUserPlan(response.userPlan || '');
          setError(null);
        } else if (mode !== 'silent') {
          setError('Failed to load meetings');
        }
      } catch (err) {
        console.error('Error fetching meetings:', err);
        // A failed background refresh keeps the schedule already on screen.
        if (mode !== 'silent') {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setNowTick(Date.now());
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  // Load on first open, then refresh quietly each time the screen is focused
  // so the schedule does not go stale while the app stays in memory.
  useFocusEffect(
    useCallback(() => {
      fetchWeeklyMeetings(hasLoadedOnce.current ? 'silent' : 'initial');
      hasLoadedOnce.current = true;
    }, [fetchWeeklyMeetings]),
  );

  // The session's start as a full timestamp. meeting.localTime is an ISO date;
  // regions[].localTime is display text such as "02:15 PM" with no date, so it
  // is used only when it parses as a full date (otherwise every session would
  // be dropped from the list).
  const getMeetingEffectiveLocalTime = useCallback(
    (meeting: Meeting): string | undefined => {
      if (!meeting) return undefined;
      const isFullDate = (v: unknown) =>
        !!v && !isNaN(new Date(String(v)).getTime());

      if (isFullDate(meeting?.localTime)) return String(meeting.localTime);

      const candidate = String(userRegionParam || '').trim();
      if (candidate && Array.isArray(meeting?.regions) && meeting.regions.length > 0) {
        const normalizedCandidate = normalizeRegionLabel(candidate);
        const matched = meeting.regions.find(r => {
          const regionValue = normalizeRegionLabel(String(r?.region || ''));
          return regionValue && regionValue === normalizedCandidate;
        });
        if (isFullDate(matched?.localTime)) return String(matched!.localTime);
      }

      if (Array.isArray(meeting?.regions)) {
        const firstWithDate = meeting.regions.find(r => isFullDate(r?.localTime));
        if (firstWithDate?.localTime) return String(firstWithDate.localTime);
      }

      return undefined;
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
    fetchWeeklyMeetings('initial');
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

    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return { time: `${hours12}:${minutes}`, period: hours24 < 12 ? 'AM' : 'PM' };
  };

  const getSessionColor = (
    index: number,
  ): { backgroundColor: string; color: string } => {
    return index % 2 === 0
      ? { backgroundColor: '#030416', color: '#D4D4D4' }
      : { backgroundColor: '#B95E82', color: '#FFFFFF' };
  };

  // A class counts as completed once it has ended (start + duration), or when
  // the backend marks it completed/failed. "pending" alone is not trusted:
  // some past classes never get their end webhook and would otherwise stay in
  // Upcoming forever.
  const isCompletedMeeting = useCallback(
    (meeting: Meeting): boolean => {
      const status = String(meeting?.status || '').toLowerCase();
      if (status === 'completed' || status === 'failed') return true;

      const effectiveLocalTime = getMeetingEffectiveLocalTime(meeting);
      if (!effectiveLocalTime) return false;
      const start = new Date(effectiveLocalTime).getTime();
      if (isNaN(start)) return false;
      const durationMin =
        Number(meeting?.duration) > 0 ? Number(meeting.duration) : 60;
      return start + durationMin * 60 * 1000 < nowTick;
    },
    [getMeetingEffectiveLocalTime, nowTick],
  );

  const matchesSearch = useCallback(
    (meeting: Meeting) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return [meeting?.title, meeting?.service?.title, meeting?.trainer?.name]
        .map(v => String(v || '').toLowerCase())
        .some(v => v.includes(q));
    },
    [searchQuery],
  );

  // Meetings in the active tab with their local date. Upcoming is soonest
  // first; Completed is most recent first.
  const tabMeetings = useMemo(() => {
    const rows = weeklyMeetings
      .filter(m => !!m && matchesSearch(m))
      .filter(m =>
        activeTab === 'completed'
          ? isCompletedMeeting(m)
          : !isCompletedMeeting(m),
      )
      .map(m => {
        const t = getMeetingEffectiveLocalTime(m);
        const time = t ? new Date(t).getTime() : NaN;
        return { meeting: m, time, dateKey: t ? getLocalDateKey(t) : null };
      })
      .filter(r => !!r.dateKey && !isNaN(r.time));
    rows.sort((a, b) =>
      activeTab === 'completed' ? b.time - a.time : a.time - b.time,
    );
    return rows;
  }, [
    weeklyMeetings,
    activeTab,
    isCompletedMeeting,
    matchesSearch,
    getMeetingEffectiveLocalTime,
    getLocalDateKey,
  ]);

  // One date chip per day that has sessions in the active tab.
  const displayDays = useMemo(() => {
    const seen = new Set<string>();
    const days: { dateKey: string; date: Date }[] = [];
    tabMeetings.forEach(r => {
      if (!r.dateKey || seen.has(r.dateKey)) return;
      seen.add(r.dateKey);
      days.push({ dateKey: r.dateKey, date: new Date(r.time) });
    });
    return days;
  }, [tabMeetings]);

  // Keep the selection on a date that exists in the active tab.
  useEffect(() => {
    if (displayDays.length === 0) return;
    if (!displayDays.some(d => d.dateKey === selectedDateKey)) {
      setSelectedDateKey(displayDays[0].dateKey);
    }
  }, [displayDays, selectedDateKey]);

  const selectedDay =
    displayDays.find(d => d.dateKey === selectedDateKey) || displayDays[0];

  const filteredMeetings = useMemo(() => {
    if (!selectedDay) return [];
    return tabMeetings
      .filter(r => r.dateKey === selectedDay.dateKey)
      .sort((a, b) => a.time - b.time)
      .map(r => r.meeting);
  }, [tabMeetings, selectedDay]);

  const headerMonthLabel = (() => {
    const d = selectedDay?.date || new Date();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  })();

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
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchWeeklyMeetings('refresh')}
            colors={['#B95E82']}
            tintColor="#B95E82"
          />
        }
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
            {headerMonthLabel}
          </Text>

          {/* Dates that have sessions in the active tab */}
          {isLoading ? null : displayDays.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekContainer}
            >
              {displayDays.map(item => {
                const isSelected = selectedDay?.dateKey === item.dateKey;
                return (
                  <View key={item.dateKey} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>
                      {DAY_LABELS[item.date.getDay()]}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.dateContainer,
                        isSelected && styles.dateContainerSelected,
                      ]}
                      onPress={() => setSelectedDateKey(item.dateKey)}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        {item.date.getDate()}
                      </Text>
                      <View
                        style={[
                          styles.dotIndicator,
                          isSelected && styles.dotIndicatorSelected,
                        ]}
                      />
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>
                      {MONTH_LABELS[item.date.getMonth()]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : !error ? (
            <View style={styles.noDatesContainer}>
              <Text style={styles.noDatesText}>
                {searchQuery.trim()
                  ? `No ${activeTab} sessions match your search`
                  : activeTab === 'upcoming'
                  ? 'No upcoming sessions yet'
                  : 'No completed sessions yet'}
              </Text>
            </View>
          ) : null}
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
        {!isLoading && !error && selectedDay && (
          <View style={styles.scheduleCard}>
            {/* Card Header */}
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleHeaderLeft}>
                <Text style={styles.scheduleDate}>
                  {DAY_LABELS[selectedDay.date.getDay()]},{' '}
                  {selectedDay.date.getDate()}{' '}
                  {MONTH_LABELS[selectedDay.date.getMonth()]}
                </Text>
              </View>
              <View style={styles.scheduleHeaderRight}>
                <View style={styles.sessionsCountPill}>
                  <Text style={styles.sessionsCountPillText}>
                    {filteredMeetings.length}{' '}
                    {filteredMeetings.length === 1 ? 'Session' : 'Sessions'}
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
                        <Text style={styles.timeLabel} numberOfLines={1}>
                          {time} {period}
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
                        {/* Left: Image */}
                        <View style={styles.sessionImageContainer}>
                          <ImageBackground
                            source={ScheduleImages.SessionImage}
                            style={styles.sessionImage}
                            resizeMode="cover"
                          />
                        </View>

                        {/* Middle: Title, Duration and Trainer */}
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTitle} numberOfLines={2}>
                            {meeting.title
                              ?.toLowerCase()
                              .replace(/\b\w/g, char => char.toUpperCase())}
                          </Text>
                          <Text style={styles.sessionDuration} numberOfLines={1}>
                            {meeting.duration ? `${meeting.duration} min` : ''}
                            {meeting.duration && meeting.service?.title ? ' · ' : ''}
                            {meeting.service?.title || ''}
                          </Text>
                          <Text
                            style={[
                              styles.sessionTrainer,
                              { color: colors.color },
                            ]}
                            numberOfLines={1}
                          >
                            Trainer: {meeting?.trainer?.name || 'N/A'}
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
    marginTop: 12,
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
    gap: 12,
    paddingRight: 4,
  },
  monthLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: '#959595',
    marginTop: 4,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
  },
  timeDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
    marginLeft: 12,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginRight: 14,
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 21,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionDuration: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sessionTrainer: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  sessionPlayButton: {
    marginLeft: 10,
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
