// ============ ClassDetailsScreen.tsx (FIXED - Date Region Issue) ============
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Video, VideoOff } from 'lucide-react-native';
import GradientBackground from '../../components/GradientBackground';
import { useClassDetailsViewModel } from '../../viewmodels/useClassDetailsViewModel';
import { useJoinMeeting } from '../../viewmodels/useJoinMeeting';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import VideoPlayer from '../common/VideoPlayer';

type ClassDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ClassDetails'
>;
type ClassDetailsRouteProp = RouteProp<RootStackParamList, 'ClassDetails'>;

type JoinMeetingResponse = {
  accessUrl: string;
  mode: 'live' | 'recorded';
};

interface ClassDetailsScreenProps {
  navigation: ClassDetailsNavigationProp;
  route: ClassDetailsRouteProp;
}

const ClassDetailsScreen: React.FC<ClassDetailsScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const classId = route?.params?.classId;

  const [classDetails, setClassDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isJoinButtonDisabled, setIsJoinButtonDisabled] = useState(true);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const { getClassDetails } = useClassDetailsViewModel();
  const {
    joinMeeting,
    isJoining,
    error: joinError,
    clearError: clearJoinError,
  } = useJoinMeeting();

  // ✅ FIXED: Use regionTime (ISO string) for button disable logic
  useEffect(() => {
    if (!classDetails?.regionTime) {
      setIsJoinButtonDisabled(true);
      return;
    }

    const checkJoinButtonStatus = () => {
      try {
        const meetingStartDate = new Date(classDetails.regionTime);
        if (isNaN(meetingStartDate.getTime())) {
          setIsJoinButtonDisabled(true);
          return;
        }
        const meetingStartTime = meetingStartDate.getTime();
        const currentTime = Date.now();
        const timeUntilStart = meetingStartTime - currentTime;
        const fiveMinutesInMs = 5 * 60 * 1000;

        console.log('🔔 Join Button Check:');
        console.log('  Meeting Time:', meetingStartDate.toISOString());
        console.log('  Current Time:', new Date(currentTime).toISOString());
        console.log('  Minutes until start:', timeUntilStart / 1000 / 60);

        if (timeUntilStart <= fiveMinutesInMs) {
          setIsJoinButtonDisabled(false);
          console.log('  ✅ Button ENABLED - Within 5 minutes or started');
        } else {
          setIsJoinButtonDisabled(true);
          console.log('  ❌ Button DISABLED - More than 5 minutes away');
        }
      } catch (err) {
        console.error('Error checking join button status:', err);
        setIsJoinButtonDisabled(true);
      }
    };

    checkJoinButtonStatus();
    const interval = setInterval(checkJoinButtonStatus, 60000);
    return () => clearInterval(interval);
  }, [classDetails?.regionTime]);

  // Fetch class details
  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!classId) {
        setError('Invalid class ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const details = await getClassDetails(classId);

        if (isMounted) {
          if (details) {
            console.log('✅ Class Details Loaded:', details);
            setClassDetails(details);
            setError(null);
          } else {
            setError('Class details not found');
            setClassDetails(null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load class details',
          );
          setClassDetails(null);
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [classId, getClassDetails]);

/**
   * Handle join class button press
   */
  const handleJoinClass = async () => {
    if (!classId) {
      Alert.alert('Error', 'Class ID is missing');
      return;
    }

    try {
      clearJoinError();
      const { accessUrl: joinUrl, recordUrl }: any = await joinMeeting(classId);

      console.log('Join URL:', joinUrl);
      console.log('Record URL:', recordUrl);

      if (showRecordingCta) {
        const playbackUrl = recordUrl || classDetails?.recordingUrl;
        if (!playbackUrl) {
          Alert.alert(
            'Recording Unavailable',
            'Recording not found for this session.',
          );
          return;
        }
        setVideoUrl(playbackUrl);
        setShowVideoPlayer(true);
        return;
      }

      if (joinUrl) {
        try {
          const canOpen = await Linking.canOpenURL(joinUrl);
          if (canOpen) {
            await Linking.openURL(joinUrl);
          } else {
            Alert.alert(
              'Open Zoom Meeting',
              'Would you like to open this meeting link?',
              [
                { text: 'Cancel', onPress: () => {}, style: 'cancel' },
                {
                  text: 'Open',
                  onPress: () => {
                    Linking.openURL(joinUrl).catch(err => {
                      console.error('Error opening URL:', err);
                      Alert.alert('Error', 'Unable to open meeting link');
                    });
                  },
                },
              ],
            );
          }
        } catch (err) {
          console.error('Error opening Zoom link:', err);
          Alert.alert(
            'Error',
            'Unable to open meeting link. Please try again.',
          );
        }
      }
    } catch (err) {
      console.error('Error joining class:', err);
      Alert.alert(
        'Join Failed',
        joinError || 'Failed to join the meeting. Please try again.',
      );
    }
  };


  const getFormattedDateTime = () => {
    if (!classDetails) {
      return { date: '--', time: '--:--' };
    }

    const isoString = classDetails?.regionTime || classDetails?.localTime;
    if (!isoString) {
      return { date: '--', time: '--:--' };
    }

    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return { date: 'Invalid Date', time: '--:--' };
    }

    const formattedDate = date
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');

    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      date: formattedDate,
      time: formattedTime,
    };
  };

  const meetingStartSource = classDetails?.regionTime || classDetails?.localTime;
  const meetingStart =
    meetingStartSource && !isNaN(new Date(meetingStartSource).getTime())
      ? new Date(meetingStartSource).getTime()
      : null;
  const meetingDurationMs = (classDetails?.duration || 0) * 60000;
  const meetingEnd =
    meetingStart !== null ? meetingStart + meetingDurationMs : null;
  const isPastMeeting = meetingEnd !== null ? Date.now() > meetingEnd : false;
  // Only show "RECORDING" for past sessions. Upcoming should never show recording.
  const isLive = !isPastMeeting;
  const showRecordingCta = isPastMeeting;

  const { date, time } = getFormattedDateTime();

  const getDisplayedDescription = () => {
    const description =
      classDetails.description ||
      'High-energy dance workout to boost your mood and turn calories...';

    const MAX_LINES = 3;
    const CHARS_PER_LINE = 50;
    const MAX_CHARS = MAX_LINES * CHARS_PER_LINE;

    if (isDescriptionExpanded || description.length <= MAX_CHARS) {
      return description;
    }

    return description.substring(0, MAX_CHARS) + '...';
  };

  const shouldShowReadMore = () => {
    const description =
      classDetails.description ||
      'High-energy dance workout to boost your mood and turn calories...';
    const MAX_CHARS = 150;
    return description.length > MAX_CHARS;
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B95E82" />
            <Text style={styles.loadingText}>Loading class details...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                if (classId) {
                  setIsLoading(true);
                  getClassDetails(classId).then(details => {
                    if (details) setClassDetails(details);
                    setIsLoading(false);
                  });
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!classDetails) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No class details found</Text>
            <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backToHomeButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#494949" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Class Image */}
          <View style={styles.imageContainer}>
            {classDetails.imageUrl ? (
              <Image
                source={classDetails?.imageUrl}
                style={styles.classImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.classImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Class Title, Trainer, and Rating */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleLeft}>
                <View style={styles.titleInline}>
                  <Text style={styles.className} numberOfLines={1}>
                    {classDetails.title
                      ?.toLowerCase()
                      .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Text>
                </View>
                <View
                  style={[
                    styles.sessionBadgeInline,
                    isLive ? styles.liveBadge : styles.recordBadge,
                  ]}
                >
                  {isLive ? (
                    <Video size={14} color={isLive ? '#FFFFFF' : '#000000'} style={{ marginRight: 6 }} />
                  ) : (
                    <VideoOff size={14} color={isLive ? '#FFFFFF' : '#000000'} style={{ marginRight: 6 }} />
                  )}
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isLive ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    {isLive ? 'LIVE SESSION' : 'RECORDING'}
                  </Text>
                </View>
                <Text style={styles.trainerText}>
                  Trainer: {classDetails.trainer?.name}{' '}
                </Text>
                <View style={{ marginTop: 3 }}>
                  <Text style={styles.trainerText}>({date})</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Details Cards - Time, Duration, Level */}
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Image
                  source={{
                    uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
                  }}
                  style={styles.detailIcon}
                />
              </View>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Image
                  source={{
                    uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
                  }}
                  style={styles.detailIcon}
                />
              </View>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {classDetails.duration || 60}min
              </Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Image
                  source={{
                    uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
                  }}
                  style={styles.detailIcon}
                />
              </View>
              <Text style={styles.detailLabel}>Level</Text>
              <Text style={styles.detailValue}>
                {classDetails.level || 'Intermediate'}
              </Text>
            </View>
          </View>

          {/* About Class Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Class</Text>
            <Text style={styles.aboutText}>{getDisplayedDescription()}</Text>
            {shouldShowReadMore() && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <Text style={styles.readMoreText}>
                  {isDescriptionExpanded ? 'Read less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* What You'll Need Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You'll Need</Text>
            <View style={styles.needsCard}>
              {classDetails.requirements &&
              classDetails.requirements.length > 0 ? (
                classDetails.requirements.map(
                  (requirement: any, index: number) => (
                    <Text key={index} style={styles.needItem}>
                      • {requirement}
                    </Text>
                  ),
                )
              ) : (
                <>
                  <Text style={styles.needItem}>• Stable Mind</Text>
                  <Text style={styles.needItem}>
                    • Good Internet Connection
                  </Text>
                  <Text style={styles.needItem}>• Water Bottle</Text>
                  <Text style={styles.needItem}>• Sneakers</Text>
                </>
              )}
            </View>
          </View>

          {/* Spacer for button */}
          <View
            style={{
              height: (showRecordingCta ? 132 : 120) + insets.bottom,
            }}
          />
        </ScrollView>

        {/* Join Class Button - Fixed at Bottom */}
        <View
          style={[
            styles.buttonContainer,
            {
              paddingBottom:
                (showRecordingCta ? 28 : 20) + insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.joinButton,
              (isJoining || (!showRecordingCta && isJoinButtonDisabled)) &&
                styles.joinButtonDisabled,
            ]}
            onPress={handleJoinClass}
            disabled={isJoining || (!showRecordingCta && isJoinButtonDisabled)}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.joinButtonText}>
                {showRecordingCta
                  ? 'Watch Recording'
                  : isJoinButtonDisabled
                    ? 'Join soon'
                    : 'Join class'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
       { videoUrl && <VideoPlayer
          url={videoUrl}
          isVisible={showVideoPlayer}
          onClose={() => setShowVideoPlayer(false)}
        />}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },

  /* LOADING & ERROR STATES */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#494949',
    fontFamily: 'Satoshi-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  detailIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 8,
    fontFamily: 'Satoshi-Bold',
  },
  errorText: {
    fontSize: 14,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Satoshi-Regular',
  },
  retryButton: {
    backgroundColor: '#B95E82',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 40,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Satoshi-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#494949',
    marginBottom: 16,
    fontFamily: 'Satoshi-Regular',
  },
  backToHomeButton: {
    backgroundColor: '#B95E82',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 40,
  },
  backToHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Satoshi-Medium',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 25,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    textAlign: 'center',
    color: '#494949',
  },
  headerSpacer: {
    width: 24,
  },

  /* IMAGE */
  imageContainer: {
    height: 257,
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFEBEB',
  },
  classImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#B95E82',
    fontFamily: 'Satoshi-Regular',
  },

  sessionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  liveBadge: {
    backgroundColor: '#354FE5',
  },

  recordBadge: {
    backgroundColor: '#F3E37C', 
  },

  badgeIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    marginRight: 6,
    tintColor: '#FFFFFF',
  },

  badgeText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  /* TITLE SECTION */
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
    marginRight: 12,
    alignItems: 'flex-start',
  },

  titleInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sessionBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 6,
    marginLeft: 0,
  },

  className: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginBottom: 8,
  },
  trainerText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(0, 0, 0, 0.6)',
  },

  /* DETAILS CARD */
  detailsCard: {
    flexDirection: 'row',
    height: 121,
    marginHorizontal: 16,
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 36,
    paddingVertical: 17,
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIconBox: {
    width: 41,
    height: 38,
    backgroundColor: '#FFE8E8',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIconEmoji: {
    fontSize: 20,
  },
  detailLabel: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: 'rgba(5, 5, 5, 0.5)',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.16,
    color: '#494949',
  },

  /* SECTIONS */
  section: {
    paddingHorizontal: 16,
    marginBottom: 44,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#494949',
    marginBottom: 13,
  },

  /* ABOUT TEXT */
  aboutText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
    color: 'rgba(26, 28, 32, 0.8)',
    marginBottom: 4,
  },
  readMoreText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    color: '#B95E82',
  },

  /* NEEDS CARD */
  needsCard: {
    backgroundColor: '#FFE8E8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 17,
  },
  needItem: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 15.6,
    color: '#494949',
    marginBottom: 7.59,
  },

  /* BUTTON */
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
  },
  joinButton: {
    width: '100%',
    maxWidth: 346.08,
    height: 54.3,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default ClassDetailsScreen;
