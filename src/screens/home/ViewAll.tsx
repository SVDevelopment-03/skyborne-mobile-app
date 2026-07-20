import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  Dumbbell,
  ArrowLeft,
} from 'lucide-react-native';
import { Images } from '../../assets/images';
import { useHomeViewModel } from '../../viewmodels/useHomeViewModel';

const capitalizeWords = (text: string = '') =>
  text.replace(/\b\w/g, char => char.toUpperCase());

const ITEMS_PER_PAGE = 10;

const ViewAll = ({ navigation }: { navigation: any }) => {
  const { upcomingMeetings, isLoading: isInitialLoading } = useHomeViewModel();
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  // Initialize with first 10 items
  useEffect(() => {
    if (upcomingMeetings.length > 0) {
      const initialItems = upcomingMeetings.slice(0, ITEMS_PER_PAGE);
      setDisplayedItems(initialItems);
      setCurrentPage(1);
      setHasMoreItems(upcomingMeetings.length > ITEMS_PER_PAGE);
    }
  }, [upcomingMeetings]);

  // Load more items on scroll
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMoreItems) return;

    setIsLoadingMore(true);
    
    // Simulate API delay
    setTimeout(() => {
      const startIndex = currentPage * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newItems = upcomingMeetings.slice(startIndex, endIndex);

      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        setHasMoreItems(endIndex < upcomingMeetings.length);
      } else {
        setHasMoreItems(false);
      }

      setIsLoadingMore(false);
    }, 300);
  }, [currentPage, isLoadingMore, hasMoreItems, upcomingMeetings]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    // Trigger load more when user scrolls near bottom
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      loadMoreItems();
    }
  };

   const handleClassPress = (classId: string) => {
    navigation.navigate('ClassDetails', { classId });
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

  const renderSessionCard = (session: any) => (
    <TouchableOpacity key={session._id} style={styles.sessionCard}
                onPress={() => handleClassPress(session._id)}
 >
      {/* Session Image */}
      <View style={styles.sessionImageContainer}>
        <Image
          source={{uri:'https://skyborne-images.s3.ap-south-1.amazonaws.com/session-image.png'}}
          style={styles.sessionImage}
          resizeMode="cover"
        />
      </View>

      {/* Session Content */}
      <View style={styles.sessionContent}>
        {/* Title and Instructor */}
        <Text style={styles.sessionTitle}>
          {capitalizeWords(session.title)}
        </Text>

        <Text style={styles.sessionInstructor}>
          {capitalizeWords(session.trainer?.name || 'Unknown Trainer')}
        </Text>

        {/* Session Details */}
        <View style={styles.sessionDetails}>
          <View style={styles.detailItem}>
            <Image source={{uri:Images.sandWatch}} />
            <Text style={styles.detailText}>45 min</Text>
          </View>

          <View style={styles.detailItem}>
            <Image source={{uri:Images.flower}} />
            <Text style={styles.detailText}>{session.service?.title}</Text>
          </View>

          <View style={styles.detailItem}>
            <Image source={{uri:Images.calendarIcon}} />
            <Text style={styles.detailText}>
              {new Date(session.localTime).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Divider */}
        {/* <View style={styles.sessionDivider} /> */}

        {/* Footer */}
        {/* <View style={styles.sessionFooter}>
          <Text style={styles.feelingText}>
            You felt: <Text style={styles.feelingValue}>Strong</Text>
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={17} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
            <Text style={styles.ratingText}>4.0</Text>
          </View>
        </View> */}
      </View>
    </TouchableOpacity>
  );

  const renderSessionList = () => (
    <View style={styles.sessionListContainer}>
      {displayedItems.map(session => renderSessionCard(session))}

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#B95E82" />
          <Text style={styles.loadingMoreText}>Loading more classes...</Text>
        </View>
      )}

      {/* End of List Message */}
      {!hasMoreItems && displayedItems.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more classes to load</Text>
        </View>
      )}
    </View>
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
          <Text style={styles.headerTitle}>All Sessions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isInitialLoading && displayedItems.length === 0 ? (
            <View style={styles.initialLoadingContainer}>
              <ActivityIndicator size="large" color="#B95E82" />
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          ) : displayedItems.length === 0 ? (
            renderEmptyState()
          ) : (
            renderSessionList()
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
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
  // Loading States
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

export default ViewAll;
