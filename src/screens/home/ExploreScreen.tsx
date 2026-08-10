import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreImages } from '../../assets/images/explore';
import BottomNav from '../../components/BottomNav';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';
import { getUserRegion } from '../../utils/timezoneUtils';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import Video, { type VideoRef } from 'react-native-video';

interface UserRegion {
  timezone: string;
  region: string;
}

const ExploreScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const TRAINING_VIDEO_URL =
    'https://skyborne-images.s3.ap-south-1.amazonaws.com/skyborne+drop.mp4';

  const [userRegion, setUserRegion] = useState<UserRegion | null>(null);
  const [isRegionLoading, setIsRegionLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isVideoInView, setIsVideoInView] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const categories = [
    {
      id: 1,
      title: 'Yoga',
      source: ExploreImages.trending1,
      page: 'YogaDetails',
    },
    // Temporarily removing Fitness category as we currently don't have region-specific classes for it. Will re-add once we have the content ready.
    // {
    //   id: 2,
    //   title: 'Fitness Classes',
    //   source: ExploreImages.fitness,
    //   page: 'FitnessDetails',
    // },
    {
      id: 4,
      title: 'Diet & Nutrition',
      source: ExploreImages.diet,
      comingSoon: true,
    },
  ];

  const categoryScrollRef = useRef<ScrollView>(null);
  const SCROLL_OFFSET = 300;
  const scrollX = useRef(0);
  const CARD_WIDTH = 299;
  const isVideoInViewRef = useRef(false);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const videoLayoutRef = useRef({ y: 0, height: 0 });
  const videoRef = useRef<VideoRef>(null);

  const { isLoading, error, fetchSearch } = useHomeViewModel();

  const handleClassPress = (classId: string) => {
    navigation.navigate('ClassDetails', { classId });
  };

  // Initialize user region on mount - critical for timezone handling
  useEffect(() => {
    try {
      const region = getUserRegion();
      setUserRegion(region);
    } catch (err) {
      console.error('❌ Failed to get user region:', err);
      // Fallback to UTC if region detection fails
      setUserRegion({ timezone: 'UTC', region: 'APAC' });
    } finally {
      setIsRegionLoading(false);
    }
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchInput.trim().length > 0) {
        handleSearch(searchInput);
      } else {
        // Clear search if input is empty
        setHasSearched(false);
        setSearchResults([]);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Perform the search
  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    setHasSearched(true);

    try {
      const result = await fetchSearch(query);

      if (result.success && result.data) {
        const meetings = result.data.upcomingMeetings || result.data.upcoming?.meetings || [];
        setSearchResults(meetings);
      } else {
        setSearchResults([]);
        console.warn('⚠️ Search returned no results');
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setHasSearched(false);
    setSearchResults([]);
  };

  const handleNavigation = (screenName: string) => {
    navigation.navigate(screenName);
  };

  // Determine which classes to display (search results only)
  const displayedClasses = hasSearched ? searchResults : [];
  const upcomingClasses = displayedClasses.slice(0, 5);

  const updateVideoVisibility = (scrollY: number, viewportHeight: number) => {
    const { y, height } = videoLayoutRef.current;
    if (height === 0 || viewportHeight === 0) return;

    const threshold = 40;
    const isVisible =
      y + height > scrollY + threshold &&
      y < scrollY + viewportHeight - threshold;

    if (isVisible !== isVideoInViewRef.current) {
      isVideoInViewRef.current = isVisible;
      setIsVideoInView(isVisible);
    }
  };

  // ✅ Helper function to format date with timezone awareness
  // If region is not 'live' and region time has passed, shows next day date for recording
  const formatDateWithTimezone = (
    isoString: string,
    timezone?: string,
    regionTimeStr?: string,
    mode?: string,
  ) => {
    console.log('🎯 formatDateWithTimezone called:', {
      isoString,
      timezone,
      regionTimeStr,
      mode,
    });

    if (!isoString) return 'N/A';

    try {
      let date = new Date(isoString);

      // Validate date
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // ✅ NEW LOGIC: If region is not live and region time has passed,
      // show next day's date for recording class
      if (mode !== 'live' && regionTimeStr) {
        const classDatetime = new Date(isoString);
        const currentTime = Date.now();

        console.log('📅 Recording Mode Detected:');
        console.log('  ISO Time:', isoString);
        console.log('  Region Time String:', regionTimeStr);
        console.log('  Class DateTime:', classDatetime.toISOString());
        console.log('  Current Time:', new Date(currentTime).toISOString());

        // Parse region time string (e.g., "10:00 AM")
        const [timeStr, period] = regionTimeStr.split(' ');
        const [hours, minutes] = timeStr.split(':');

        let hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        // Convert to 24-hour format
        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }

        // Create a new date with the region's time for comparison
        const regionDateTime = new Date(classDatetime);
        regionDateTime.setHours(hour, minute, 0, 0);

        console.log('  Region DateTime (for comparison):', regionDateTime.toISOString());
        console.log('  Time Difference (ms):', currentTime - regionDateTime.getTime());

        // If region time is in the past and mode is 'replay', add 1 day to the date
        if (currentTime > regionDateTime.getTime()) {
          console.log(
            '📅 Recording class time has passed, showing next day date',
          );
          date = new Date(date.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        }
      }

      // Use timezone if available, otherwise user's local timezone
      const options = {
        day: 'numeric' as const,
        month: 'short' as const,
        year: 'numeric' as const,
        timeZone: timezone || undefined,
      };

      const formattedDate = date
        .toLocaleDateString('en-GB', options)
        .replace(',', '');
      console.log('✅ Final Formatted Date:', formattedDate);

      return formattedDate;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };


  // Dynamic upcoming class card
  const DynamicSessionCard = ({ meeting }: any) => {
    // Find region-specific info from meeting regions array
    const regionInfo = meeting?.regions?.find(
      (r: any) => r.region === userRegion?.region,
    );

    // Fallback to first region if user region not found
    const displayRegionInfo = regionInfo || meeting?.regions?.[0];

    // Extract the pre-formatted localTime from the API response
    const formattedTime = displayRegionInfo?.localTime || 'N/A';
    const timezone = displayRegionInfo?.timezone || userRegion?.timezone;
    const mode = displayRegionInfo?.mode || 'live';

    // ✅ Use the updated formatDateWithTimezone function
    const formattedDate = formatDateWithTimezone(
      meeting.localTime,
      timezone,
      regionInfo?.localTime,
      mode,
    );

    return (
      <Pressable
        style={styles.sessionCard}
        onPress={() => handleClassPress(meeting._id)}
      >
        <View style={styles.sessionImageContainer}>
          <ImageBackground
            source={{ uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/session-image.png' }}
            style={styles.sessionImage}
            resizeMode="cover"
          />
          <View style={styles.sessionImagePlaceholder} />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>
            {meeting.title
              ?.toLowerCase()
              .replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </Text>
          <Text style={styles.sessionDuration}>
            {formattedDate} • {formattedTime} ({meeting.service?.title})
          </Text>
          <Pressable
            style={styles.sessionPlayButton}
            onPress={() => handleClassPress(meeting._id)}
          >
            <View style={styles.playButtonCircle}>
              <View style={styles.playIcon}>
                <View style={styles.playLineMiddle} />
                <View style={styles.playLineTop} />
                <View style={styles.playLineBottom} />
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement } = e.nativeEvent;
          scrollYRef.current = contentOffset.y;
          viewportHeightRef.current = layoutMeasurement.height;
          updateVideoVisibility(contentOffset.y, layoutMeasurement.height);
        }}
        onLayout={(e) => {
          viewportHeightRef.current = e.nativeEvent.layout.height;
          updateVideoVisibility(scrollYRef.current, viewportHeightRef.current);
        }}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Sessions</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrapper}>
            <View style={styles.searchIcon} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Classes name"
            placeholderTextColor="#959595"
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Start Banner - Hidden when searching */}
        {!hasSearched && (
          <View style={styles.quickStartBanner}>
            <View style={styles.bannerImageContainer}>
              <ImageBackground
                source={ExploreImages.meditation}
                style={styles.bannerImage}
                resizeMode="cover"
              >
                <View style={styles.bannerGradient}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTitle}>Quick Start</Text>
                    <Text style={styles.bannerDescription}>
                      Start a Skyborne workout instantly just press play and move.
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>
        )}

        {/* Trending Categories Section - Hidden when searching */}
        {!hasSearched && (
          <>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={styles.sectionTitle}>Explore Our Services</Text>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                {/* LEFT ARROW */}
                <Pressable
                  onPress={() => {
                    categoryScrollRef.current?.scrollTo({
                      x: Math.max(0, scrollX.current - CARD_WIDTH),
                      animated: true,
                    });
                  }}
                  style={styles.navArrowLeft}
                >
                  <ImageBackground
                    // source={ExploreImages.ArrowLeftBg} // create or reuse a circular bg image or gradient if needed
                    style={styles.navArrowIconContainer}
                  >
                    <ArrowLeft size={18} color="#000000" strokeWidth={2} />
                  </ImageBackground>
                </Pressable>

                {/* RIGHT ARROW */}
                <Pressable
                  onPress={() => {
                    categoryScrollRef.current?.scrollTo({
                      x: scrollX.current + CARD_WIDTH,
                      animated: true,
                    });
                  }}
                  style={styles.navArrowRight}
                >
                  <ImageBackground
                    // source={ExploreImages.ArrowRightBg} // same here for right bg
                    style={styles.navArrowIconContainer}
                  >
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />
                  </ImageBackground>
                </Pressable>
              </View>
            </View>

            {/* Horizontal Scroll for Categories */}
            <ScrollView
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesContent}
              onScroll={(e) => {
                scrollX.current = e.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
            >
              {categories.map((category, index) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    index === 0 && styles.categoryCardFirst,
                    index === categories.length - 1 && { marginRight: 0 },
                    category.comingSoon && styles.categoryCardDisabled,
                  ]}
                  onPress={() => handleNavigation(category.page as string)}
                  disabled={category.comingSoon}
                >
                  <View style={styles.categoryImageContainer}>
                    <ImageBackground
                      source={category?.source}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    >
                      {/* Add dark overlay for coming soon */}
                      {category.comingSoon && (
                        <View style={styles.comingSoonOverlay} />
                      )}

                      {/* Add Coming Soon Badge */}
                      {category.comingSoon && (
                        <View style={styles.comingSoonBadge}>
                          <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                      )}

                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                      </View>
                    </ImageBackground>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {hasSearched ? (
          <>
            {/* Search Results Header */}
            <View style={styles.sectionHeaderWithAction}>
              <Text style={styles.sectionTitle}>
                {`Search Results for "${searchInput}"`}
              </Text>
            </View>

            {/* Loading State (Search) */}
            {(isSearchLoading || isRegionLoading || isLoading) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B95E82" />
                <Text style={styles.loadingText}>
                  {isRegionLoading ? 'Detecting your location...' : 'Searching...'}
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && !isSearchLoading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Search Results - Max 5 */}
            {!isSearchLoading && !isRegionLoading && upcomingClasses.length > 0 && (
              <View style={styles.sessionsList}>
                {upcomingClasses.map((meeting) => (
                  <DynamicSessionCard key={meeting._id} meeting={meeting} />
                ))}
              </View>
            )}

            {/* No results for search */}
            {!isSearchLoading && upcomingClasses.length === 0 && (
              <View style={styles.noRecordsContainer}>
                <Text style={styles.noRecordsText}>
                  No classes found for "{searchInput}"
                </Text>
                <Pressable
                  style={styles.tryAgainButton}
                  onPress={handleClearSearch}
                >
                  <Text style={styles.tryAgainButtonText}>Clear Search</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Training Section */}
            <View
              style={styles.trainingCard}
              onLayout={(e) => {
                videoLayoutRef.current = {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                };
                updateVideoVisibility(
                  scrollYRef.current,
                  viewportHeightRef.current,
                );
              }}
            >
              <Video
                ref={videoRef}
                source={{ uri: TRAINING_VIDEO_URL }}
                style={styles.trainingVideo}
                controls={false}
                paused={!isVideoInView}
                resizeMode="cover"
                onLoadStart={() => setIsVideoLoading(true)}
                onLoad={() => setIsVideoLoading(false)}
              />
              <Pressable
                style={styles.fullscreenButton}
                onPress={() => videoRef.current?.presentFullscreenPlayer()}
              >
                <Text style={styles.fullscreenButtonText}>Full Screen</Text>
              </Pressable>
              {isVideoLoading && (
                <View style={styles.videoLoading}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav active="Explore" />
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
  categoryCardDisabled: {
    opacity: 0.9,
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B95E82',
  },
  comingSoonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#B95E82',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 35,
    marginBottom: 25,
    paddingTop: 25,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 30,
    lineHeight: 33,
    color: '#494949',
  },
  noRecordsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRecordsText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#959595',
    marginBottom: 16,
  },
  tryAgainButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#B95E82',
    borderRadius: 6,
  },
  tryAgainButtonText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF',
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
  searchIconWrapper: {
    width: 19,
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchIcon: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#959595',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Outfit',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: -0.1,
    color: '#494949',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#959595',
    fontWeight: '600',
  },

  quickStartBanner: {
    marginHorizontal: 16,
    // marginBottom: 48,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 19,
    paddingVertical: 19,
    justifyContent: 'flex-end',
  },
  bannerContent: {
    marginBottom: 10,
  },
  bannerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20.1125,
    lineHeight: 22,
    width: 105,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bannerDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
    width: 200,
    height: 32,
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 25,
  },
  sectionHeaderWithAction: {
    paddingHorizontal: 16,
    marginBottom: 34,
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 24,
    color: '#494949',
    paddingBottom: 2,
  },
  navArrowLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F3F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  navArrowRight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#676767',
    justifyContent: 'center',
    alignItems: 'center',
  },

  navArrowIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#B95E82',
  },

  trainingCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    height: 210,
  },
  trainingVideo: {
    width: '100%',
    height: '100%',
  },
  videoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  fullscreenButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 2,
  },
  fullscreenButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },

  categoriesScroll: {
    marginBottom: 0,
  },
  categoriesContent: {
    paddingLeft: 16,
    paddingRight: 32,
  },
  categoryCard: {
    width: 284,
    height: 354,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginRight: 15,
    overflow: 'hidden',
  },
  categoryCardFirst: {
    marginLeft: 0,
  },
  categoryImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryInfo: {
    position: 'absolute',
    bottom: 21,
    left: 21,
  },
  categoryTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    paddingBottom: 2,
    marginBottom: 7,
  },

  sessionsList: {
    paddingHorizontal: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 31,
  },
  sessionImageContainer: {
    width: 111,
    height: 99,
    borderRadius: 6,
    marginRight: 25,
    overflow: 'hidden',
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  sessionImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9D2D2',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginBottom: 6,
  },
  sessionDuration: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#050505',
  },
  sessionPlayButton: {
    marginTop: 18,
  },
  playButtonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  playIcon: {
    width: 12,
    height: 12,
    justifyContent: 'center',
  },
  playLineMiddle: {
    width: 10,
    height: 1.5,
    backgroundColor: '#FFFFFF',
  },
  playLineTop: {
    width: 5,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 3,
    left: 5.5,
  },
  playLineBottom: {
    width: 5,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    bottom: 3,
    left: 5.5,
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  },
});

export default ExploreScreen;
