import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, Dumbbell, ArrowLeft, Video } from 'lucide-react-native';
import { Images } from '../../assets/images';
import { usePastSessionsViewModel } from '../../viewmodels/usePastSessionsViewModel';
import { useJoinMeeting } from '../../viewmodels/useJoinMeeting';
import VideoPlayer from '../common/VideoPlayer';

const ITEMS_PER_PAGE = 10;
const SessionHistoryScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  // Use usePastSessionsViewModel
  const { isLoading: isInitialLoading, fetchSessions } =
    usePastSessionsViewModel();
  const { joinMeeting, isJoining } = useJoinMeeting();

  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const [nextSkip, setNextSkip] = useState(0);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loadingRecordingId, setLoadingRecordingId] = useState<string | null>(
    null,
  );

  // Fetch first page on mount (server already returns attended sessions only)
  useEffect(() => {
    let isMounted = true;

    const loadInitialSessions = async () => {
      setIsLoadingInitial(true);
      const result = await fetchSessions(0, ITEMS_PER_PAGE);
      if (isMounted) {
        if (result?.success && result?.data) {
          const meetings = result.data.meetings || [];
          setDisplayedItems(meetings);
          setNextSkip(meetings.length);
          setHasMoreItems(!!result.data.hasMore && meetings.length >= ITEMS_PER_PAGE);
        } else {
          setDisplayedItems([]);
          setHasMoreItems(false);
        }
        setIsLoadingInitial(false);
      }
    };

    loadInitialSessions();

    return () => {
      isMounted = false;
    };
  }, [fetchSessions]);

  // Load more items on scroll
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMoreItems) return;

    setIsLoadingMore(true);

    const result = await fetchSessions(nextSkip, ITEMS_PER_PAGE);
    if (!result?.success || !result?.data) {
      setIsLoadingMore(false);
      return;
    }

    const meetings = result.data.meetings || [];
    if (meetings.length === 0) {
      setHasMoreItems(false);
      setIsLoadingMore(false);
      return;
    }

    setDisplayedItems(prev => [...prev, ...meetings]);

    setNextSkip(prev => prev + meetings.length);
    setHasMoreItems(!!result.data.hasMore && meetings.length >= ITEMS_PER_PAGE);
    setIsLoadingMore(false);
  }, [fetchSessions, hasMoreItems, isLoadingMore, nextSkip]);

  const handleSessionPress = (classId: string) => {
    navigation.navigate('ClassDetails', { classId });
  };

  const handleWatchRecording = async (session: any) => {
    if (!session?._id) {
      Alert.alert('Error', 'Session ID is missing');
      return;
    }

    setLoadingRecordingId(session._id);
    let playbackUrl: string | null = null;

    const candidates: string[] = [];
    const recordingUrl = session?.recordingUrl;
    const hasAccessToken =
      typeof recordingUrl === 'string' && recordingUrl.includes('access_token=');
    if (hasAccessToken) candidates.push(recordingUrl);

    // Match web app behavior: call joinMeeting and use recordUrl
    const result: any = await joinMeeting(session._id);
    if (result?.recordUrl) candidates.push(result.recordUrl);

    const isPlayable = async (url: string) => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-1' },
        });
        return res.status === 206 || res.status === 200;
      } catch {
        return false;
      }
    };

    for (const url of candidates) {
      if (!url) continue;
      // eslint-disable-next-line no-await-in-loop
      const ok = await isPlayable(url);
      if (ok) {
        playbackUrl = url;
        break;
      }
    }

    if (!playbackUrl) {
      Alert.alert(
        'Recording Unavailable',
        'Recording not found for this session.',
      );
      setLoadingRecordingId(null);
      return;
    }

    setVideoUrl(playbackUrl);
    setShowVideoPlayer(true);
    setLoadingRecordingId(null);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconWrapper}>
        <Dumbbell size={80} color="#B95E82" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyStateTitle}>No completed sessions yet</Text>
      <Text style={styles.emptyStateDescription}>
        Your completed classes will appear here
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Explore')}
      >
        <Text style={styles.exploreButtonText}>Explore Classes</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSessionItem = ({ item: session }: { item: any }) => (
    <TouchableOpacity
      key={session._id}
      style={styles.sessionCard}
      onPress={() => handleSessionPress(session._id)}
    >
      {/* Session Image */}
      <View style={styles.sessionImageContainer}>
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/session-image.png',
          }}
          style={styles.sessionImage}
          resizeMode="cover"
        />
      </View>

      {/* Session Content */}
      <View style={styles.sessionContent}>
        {/* Title and Instructor */}
        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionInstructor}>
          {session.trainer?.name || 'Unknown Trainer'}
        </Text>

        {/* Session Details */}
        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Image source={{ uri: Images.sandWatch }} />
            <Text style={styles.detailText}>{session.duration} min</Text>
          </View>

          <View style={styles.detailItem}>
            <Image source={{ uri: Images.flower }} />
            <Text style={styles.detailText}>{session.service?.title}</Text>
          </View>

          <View style={styles.detailItem}>
            <Image source={{ uri: Images.calendarIcon }} />
            <Text style={styles.detailText}>
              {new Date(session.localTime).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.recordingButton}
          onPress={() => handleWatchRecording(session)}
          disabled={isJoining && loadingRecordingId === session._id}
        >
          <Video size={16} color="#B95E82" />
          <Text style={styles.recordingButtonText}>
            {isJoining && loadingRecordingId === session._id
              ? 'Loading...'
              : 'Watch Recording'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#494949" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session History</Text>
          <View style={styles.headerSpacer} />
        </View>

        {((isInitialLoading || isLoadingInitial) && displayedItems.length === 0) ? (
          <View style={styles.initialLoadingContainer}>
            <ActivityIndicator size="large" color="#B95E82" />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
        ) : displayedItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.sessionListContainer,
              { paddingBottom: 120 + insets.bottom },
            ]}
            data={displayedItems}
            keyExtractor={item => item._id}
            renderItem={renderSessionItem}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#B95E82" />
                  <Text style={styles.loadingMoreText}>
                    Loading more sessions...
                  </Text>
                </View>
              ) : !hasMoreItems && displayedItems.length > 0 ? (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>
                    No more sessions to load
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {videoUrl ? (
          <VideoPlayer
            url={videoUrl}
            isVisible={showVideoPlayer}
            onClose={() => setShowVideoPlayer(false)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 37,
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
    color: '#494949',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  emptyStateIconWrapper: {
    width: 150,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyStateTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptyStateDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#050505',
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    width: '100%',
    maxWidth: 346.08,
    height: 54.3,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  exploreButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Session List
  sessionListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    height: 149,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sessionImageContainer: {
    width: 81,
    height: 134,
    backgroundColor: '#FED4D4',
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 9,
    marginTop: 8,
    marginBottom: 7,
  },
  sessionImage: {
    width: '100%',
    height: '100%',
  },
  sessionContent: {
    flex: 1,
    paddingLeft: 23,
    paddingRight: 11,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sessionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginBottom: 6,
  },
  sessionInstructor: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#050505',
    marginBottom: 11,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 21,
    marginBottom: 14.5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(73, 73, 73, 0.6)',
  },
  sessionDivider: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginBottom: 9.5,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feelingText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(5, 5, 5, 0.5)',
  },
  feelingValue: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(5, 5, 5, 0.5)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 19,
    color: '#494949',
  },
  recordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0D6DE',
    backgroundColor: '#FFF5F8',
  },
  recordingButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#B95E82',
  },
  initialLoadingContainer: {
    flex: 1,
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
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#494949',
    fontFamily: 'Satoshi-Regular',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 14,
    color: '#959595',
    fontFamily: 'Satoshi-Regular',
  },
});

export default SessionHistoryScreen;
