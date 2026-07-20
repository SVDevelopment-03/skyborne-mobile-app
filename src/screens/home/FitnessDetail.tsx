import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import GradientBackground from '../../components/GradientBackground';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { SubscriptionImages } from '../../assets/images/subscriptions';

type FitnessDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FitnessDetails'
>;

interface FitnessDetailsScreenProps {
  navigation: FitnessDetailsNavigationProp;
}

interface KeyFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const fitnessKeyFeatures: KeyFeature[] = [
  {
    id: '1',
    title: 'Strength Training',
    description: 'Build muscle tone and increase physical power with guided resistance exercises',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
  {
    id: '2',
    title: 'Cardio Workouts',
    description: 'Boost heart health and stamina with dynamic cardiovascular sessions',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
  {
    id: '3',
    title: 'HIIT Sessions',
    description: 'Maximize calorie burn with high-intensity interval training',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
  {
    id: '4',
    title: 'Mobility Training',
    description: 'Improve flexibility, balance, and range of motion for better movement',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
  {
    id: '5',
    title: 'Expert Trainers',
    description: 'Get personalized guidance on form, intensity, and recovery',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
  {
    id: '6',
    title: 'Progress Tracking',
    description: 'Monitor your fitness journey with measurable improvements',
    icon: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/time.png',
  },
];

const FitnessDetailsScreen: React.FC<FitnessDetailsScreenProps> = ({
  navigation,
}) => {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  // Get login status from Redux
  const loggedIn = useSelector((state: any) => state.auth.loggedIn);

  const handleSignupForClass = () => {
    navigation.navigate('Login');
  };

  const handleBookClass = () => {
    if (loggedIn) {
      navigation.navigate('Explore');
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* HEADER WITH BACK BUTTON */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              style={styles.backIcon}
              source={SubscriptionImages.backwardIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fitness</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* BANNER SECTION */}
          <View style={styles.bannerContainer}>
            <Image
              source={{
                uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-1.jpg',
              }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.badgeText}>Fitness Classes</Text>
              <Text style={styles.bannerTitle}>Fitness: Strength. Energy. Empowerment.</Text>
            </View>
          </View>

          {/* ABOUT SECTION */}
          <View style={styles.section}>
            <View style={styles.aboutContainer}>
              <View style={styles.aboutContent}>
                <Text style={styles.aboutBadge}>Fitness Classes at Skyborne Drop</Text>
                <Text style={styles.aboutTitle}>What is Fitness, Really?</Text>
                <Text style={styles.aboutDescription}>
                  Fitness isn't just about lifting weights or running. It's about building 
                  the energy and capability to enjoy everyday life, handle challenges, and 
                  feel confident in your body. Our classes blend cardio, strength, HIIT, 
                  and mobility techniques for a well-balanced, effective routine
                </Text>
                {!loggedIn && (
                  <TouchableOpacity
                    style={styles.signupButton}
                    onPress={handleSignupForClass}
                  >
                    <Text style={styles.signupButtonText}>
                      Sign up for a class
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.aboutImageContainer}>
                <Image
                  source={{
                    uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-2.jpg',
                  }}
                  style={styles.aboutImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* TWO IMAGE ROW */}
            <View style={styles.imageRow}>
              <Image
                source={{
                  uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-3.jpg',
                }}
                style={styles.rowImage}
                resizeMode="cover"
              />
              <Image
                source={{
                  uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-4.jpg',
                }}
                style={styles.rowImage}
                resizeMode="cover"
              />
            </View>

            {/* POWER SECTION */}
            <View style={styles.powerSection}>
              <Text style={styles.powerTitle}>The Power of Fitness</Text>
              <Text style={styles.powerDescription}>
                Transform with guided fitness sessions. Boost muscle tone, burn calories, 
                and enhance energy with expert trainers. Enjoy structured workouts that 
                blend strength, cardio, and mobility for safe, effective training.{'\n\n'}
                Consistent fitness improves heart health, builds stamina, and reduces 
                stress, making you feel stronger and more confident.
              </Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookClass}
              >
                <Text style={styles.bookButtonText}>Book classes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* WHAT'S INCLUDED SECTION */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>
              What's Included With Skyborne Fitness
            </Text>

            {/* MAIN FEATURE WITH STATS */}
            <View style={styles.mainFeatureContainer}>
              <View style={styles.statsCard}>
                <Image
                  source={{
                    uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-5.jpg',
                  }}
                  style={styles.featureImage}
                  resizeMode="cover"
                />
                <View style={styles.statsOverlay}>
                  <View style={styles.percentageBox}>
                    <Text style={styles.percentageText}>83%</Text>
                  </View>
                  <Text style={styles.statsLabel}>
                    Personal Progress Achieved
                  </Text>
                </View>
              </View>

              <View style={styles.featureInfo}>
                <Text style={styles.featureBadge}>Main feature</Text>
                <Text style={styles.featureTitle}>
                  Live and On-Demand Fitness Classes
                </Text>
                <Text style={styles.featureDescription}>
                  Access guided strength, cardio, and mobility workouts in real time or 
                  replay sessions whenever it suits your schedule
                </Text>
              </View>
            </View>

            {/* SECOND FEATURE */}
            <View style={styles.secondFeatureContainer}>
              <View style={styles.featureInfoAlt}>
                <Text style={styles.featureBadge}>Bespoke Coaching</Text>
                <Text style={styles.featureTitle}>
                  Personalized Training Support
                </Text>
                <Text style={styles.featureDescription}>
                  Get tailored guidance on form, intensity, and recovery so every workout 
                  fits your goals whether you are building strength, improving stamina, 
                  or getting back into routine
                </Text>
              </View>

              <Image
                source={{
                  uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-5.jpg',
                }}
                style={styles.featureImageAlt}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* JOURNEY SECTION */}
          <View style={styles.journeySection}>
            <View style={styles.journeyContent}>
              <Text style={styles.journeyTitle}>
                What to Expect From Your Fitness Journey
              </Text>
              <Text style={styles.journeyDescription}>
                See how Skyborne Fitness fits into your daily routine. Every workout is 
                designed to be clear, achievable, and motivating so you can build strength 
                and stamina step by step
              </Text>
              {!loggedIn && (
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={handleSignupForClass}
                >
                  <Text style={styles.claimButtonText}>Sign up & Claim</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.journeyImageContainer}>
              <Image
                source={{
                  uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/fitness/fitness-detail-6.jpg',
                }}
                style={styles.journeyImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* KEY FEATURES GRID */}
          <View style={styles.keyFeaturesSection}>
            <Text style={styles.keyFeaturesTitle}>
              Why Choose Skyborne Fitness
            </Text>

            <View style={styles.featuresGrid}>
              {fitnessKeyFeatures.map(feature => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureCard,
                    expandedFeature === feature.id &&
                      styles.featureCardExpanded,
                  ]}
                  onPress={() =>
                    setExpandedFeature(
                      expandedFeature === feature.id ? null : feature.id,
                    )
                  }
                >
                  <View style={styles.featureCardHeader}>
                    <Image
                      source={{ uri: feature.icon }}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureCardTitle}>{feature.title}</Text>
                    <ChevronRight
                      size={20}
                      color="#B95E82"
                      style={styles.chevron}
                    />
                  </View>
                  {expandedFeature === feature.id && (
                    <Text style={styles.featureCardDescription}>
                      {feature.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* BOTTOM SPACING */}
          <View style={{ height: 40 }} />
        </ScrollView>
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

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 35,
    paddingBottom: 41,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
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

  /* BANNER */
  bannerContainer: {
    height: 320,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  badgeText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 34,
  },

  /* SECTIONS */
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },

  /* ABOUT SECTION */
  aboutContainer: {
    backgroundColor: '#FFE8E8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  aboutContent: {
    marginBottom: 16,
  },
  aboutBadge: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#B95E82',
    marginBottom: 8,
  },
  aboutTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    color: '#494949',
    marginBottom: 12,
    lineHeight: 30,
  },
  aboutDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(26, 28, 32, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  signupButton: {
    backgroundColor: '#B95E82',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  signupButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },

  aboutImageContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#B95E82',
  },
  aboutImage: {
    width: '100%',
    height: '100%',
  },

  /* IMAGE ROW */
  imageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  rowImage: {
    flex: 1,
    height: 200,
    borderRadius: 12,
  },

  /* POWER SECTION */
  powerSection: {
    backgroundColor: '#B95E82',
    borderRadius: 12,
    padding: 20,
  },
  powerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 28,
  },
  powerDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: '#fbefd8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  bookButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#494949',
  },

  /* FEATURES SECTION */
  featuresSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  featuresTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },

  mainFeatureContainer: {
    marginBottom: 16,
  },
  statsCard: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#B95E82',
    marginBottom: 12,
    position: 'relative',
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 44,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  percentageBox: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  percentageText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  statsLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },

  featureInfo: {
    backgroundColor: '#FBEFD8',
    borderRadius: 12,
    padding: 16,
  },
  featureInfoAlt: {
    backgroundColor: '#FBEFD8',
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  featureBadge: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    color: '#ffffff',
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    overflow: 'hidden',
  },
  featureTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#494949',
    marginBottom: 8,
    lineHeight: 22,
  },
  featureDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: 'rgba(26, 28, 32, 0.8)',
    lineHeight: 18,
  },

  secondFeatureContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  featureImageAlt: {
    width: 120,
    height: 200,
    borderRadius: 12,
  },

  /* KEY FEATURES */
  keyFeaturesSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  keyFeaturesTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
    marginBottom: 16,
    lineHeight: 26,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    padding: 16,
  },
  featureCardExpanded: {
    backgroundColor: '#FBEFD8',
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  featureCardTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#494949',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  featureCardDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    color: '#494949',
    marginTop: 12,
    lineHeight: 16,
  },

  /* JOURNEY SECTION */
  journeySection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  journeyContent: {
    marginBottom: 16,
  },
  journeyTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    color: '#494949',
    marginBottom: 12,
    lineHeight: 30,
  },
  journeyDescription: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(26, 28, 32, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  claimButton: {
    backgroundColor: '#B95E82',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },

  journeyImageContainer: {
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
  journeyImage: {
    width: '100%',
    height: '100%',
  },
});

export default FitnessDetailsScreen;