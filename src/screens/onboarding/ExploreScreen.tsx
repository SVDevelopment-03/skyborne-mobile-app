import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExploreImages } from '../../assets/images/explore';

const ExploreScreen = () => {
  const insets = useSafeAreaInsets();
  const categories = [
    {
      id: 1,
      title: 'Yoga',
      sessions: '100+ Sessions',
      // image: YogaImg,
    },
    // Temporarily removing Fitness category as we currently don't have region-specific classes for it. Will re-add once we have the content ready.
    // {
    //   id: 2,
    //   title: 'Fitness Classes',
    //   sessions: '100+ Sessions',
    //   // image: FitnessImg,
    // },
    {
      id: 3,
      title: 'Diet & Nutrition',
      sessions: '100+ Sessions',
      // image: DietImg,
    },
  ];

  const trendingSessions = [
    {
      id: 1,
      title: 'Morning Yoga Flow',
      duration: '12 min - Beginner',
      image: ExploreImages.yoga1,
    },
    {
      id: 2,
      title: 'Zumba Cardio Blast',
      duration: '25 min - Intermediate',
      image: ExploreImages.yoga2,
    },
    {
      id: 3,
      title: 'Gentle Back Stretch',
      duration: '8 min - All Levels',
      image: ExploreImages.yoga3,
    },
    {
      id: 4,
      title: 'Strength Core Builder',
      duration: '18 min - Beginner',
      image: ExploreImages.yoga4,
    },
    {
      id: 5,
      title: 'Restorative Yin Yoga',
      duration: '15 min - Beginner',
      image: ExploreImages.yoga5,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header - top: 87px from Figma */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Sessions</Text>
        </View>

        {/* Search Bar - top: 145px, 16px horizontal margins */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrapper}>
            <View style={styles.searchIcon} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Classes name"
            placeholderTextColor="#959595"
          />
        </View>

        {/* Quick Start Banner - top: 219px */}
        <View style={styles.quickStartBanner}>
          <View style={styles.bannerImageContainer}>

            <ImageBackground
              source={ExploreImages.meditation}
              style={styles.bannerImage}
              resizeMode="cover"
            >
              {/* OVERLAY / GRADIENT */}
              <View style={styles.bannerGradient}>
                
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>Quick Start</Text>
                  <Text style={styles.bannerDescription}>
                    Start a Skyborne workout instantly just press play and move.
                  </Text>
                </View>

                <TouchableOpacity style={styles.bannerButton}>
                  <View style={styles.arrowCircle}>
                    <ImageBackground
                      source={ExploreImages.arrow}
                      style={styles.arrowImage}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>

              </View>
            </ImageBackground>

          </View>
        </View>

        {/* Trending Categories Section - top: 439px */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending for You</Text>
        </View>

        {/* Horizontal Scroll for Categories - top: 486px */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                index === 0 && styles.categoryCardFirst,
              ]}
            >
              <View style={styles.categoryImageContainer}>
                <ImageBackground
                  source={ExploreImages.trending1}
                  style={styles.categoryImage}
                  resizeMode="cover"
                >
                {/* <View style={styles.categoryGradient} /> */}
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySessions}>
                    {category.sessions}
                  </Text>
                </View>
                </ImageBackground>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Trending Sessions Section - top: 888px */}
        <View style={styles.sectionHeaderWithAction}>
          <Text style={styles.sectionTitle}>Trending for You</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Session List - starts at top: 944px */}
        <View style={styles.sessionsList}>
          {trendingSessions.map((session) => (
            <TouchableOpacity key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionImageContainer}>
                <ImageBackground
                  source={session.image}
                  style={styles.sessionImage}
                  resizeMode="cover"
                />
                <View style={styles.sessionImagePlaceholder} />
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionDuration}>{session.duration}</Text>
                  <TouchableOpacity style={styles.sessionPlayButton}>
                  <View style={styles.playButtonCircle}>
                    <View style={styles.playIcon}>
                      <View style={styles.playLineMiddle} />
                      <View style={styles.playLineTop} />
                      <View style={styles.playLineBottom} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={[styles.bottomSpacer, { paddingBottom: 16 + insets.bottom }]} />
      </ScrollView>
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
  
  // Header - exact Figma position top: 87px
  header: {
    paddingHorizontal: 16,
    marginTop: 87,
    marginBottom: 25,
  },
  headerTitle: {
    fontFamily: 'Satoshi',
    fontWeight: '700',
    fontSize: 30,
    lineHeight: 33,
    color: '#494949',
  },

  // Search Bar - top: 145px in Figma
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 31, // Space to banner (219 - 145 - 43)
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
    color: '#959595',
    paddingVertical: 0,
  },

  // Quick Start Banner - top: 219px, width: 358px, height: 172px
  quickStartBanner: {
    marginHorizontal: 16,
    marginBottom: 48, // Space to "Trending for You" (439 - 219 - 172)
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
    fontFamily: 'Satoshi',
    fontWeight: '700',
    fontSize: 20.1125,
    lineHeight: 22,
    width: 105,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bannerDescription: {
    fontFamily: 'Satoshi',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
    width: 200,
    height: 32,
  },
  bannerButton: {
    position: 'absolute',
    right: 18,
    bottom: 25,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowImage: {
    width: 25,
    height: 25,
  },

  // Section Headers
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 25, // Space to categories (486 - 439 - 22)
  },
  sectionHeaderWithAction: {
    paddingHorizontal: 16,
    marginBottom: 34, // Space to sessions list (944 - 888 - 31)
    marginTop: 48, // Space from categories end (888 - 486 - 354)
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Satoshi',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
  },
  viewAllText: {
    fontFamily: 'Satoshi',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#B95E82',
  },

  // Categories Horizontal Scroll - top: 486px, width: 374px, height: 354px
  categoriesScroll: {
    marginBottom: 0,
  },
  categoriesContent: {
    paddingLeft: 16,
    paddingRight: 1,
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
  categoryGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 137,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  categoryInfo: {
    position: 'absolute',
    bottom: 21,
    left: 21,
  },
  categoryTitle: {
    fontFamily: 'Satoshi',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 22,
    color: '#FFFFFF',
    marginBottom: 7,
  },
  categorySessions: {
    fontFamily: 'Satoshi',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 19,
    color: '#FFFFFF',
  },

  // Trending Sessions List - starts at top: 944px
  sessionsList: {
    paddingHorizontal: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 31, // Calculated from spacing between items
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
    fontFamily: 'Satoshi',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginBottom: 6,
  },
  sessionDuration: {
    fontFamily: 'Satoshi',
    fontWeight: '400',
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
    display:'flex'
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
  // Bottom Spacer
  bottomSpacer: {
    height: 80, // Extra space before bottom nav
  },
});

export default ExploreScreen;