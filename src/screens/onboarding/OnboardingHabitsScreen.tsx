import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { useOnboardingStore } from '../../store/onboardingSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OnboardingHabitsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [waterIntakeIndex, setWaterIntakeIndex] = useState<number | null>(null);
  const [sleepQualityIndex, setSleepQualityIndex] = useState<number | null>(
    null,
  );
  const [exerciseFrequencyIndex, setExerciseFrequencyIndex] = useState<
    number | null
  >(null);
  const { setHabits } = useOnboardingStore();

  const waterOptions = ['Yes', 'No'];
  const sleepOptions = ['Poor', 'Okay', 'Good'];
  const exerciseOptions = ['Rarely', 'Weekly', 'Regular'];

  // Check if all fields are selected
  const isAllSelected =
    waterIntakeIndex !== null &&
    sleepQualityIndex !== null &&
    exerciseFrequencyIndex !== null;

  const handleContinue = () => {
    if (isAllSelected) {
      // Convert indices to 1-based numbers and store
      const habitsValue = {
        waterIntake: waterIntakeIndex + 1, // 1-2
        sleepQuality: sleepQualityIndex + 1, // 1-3
        exerciseFrequency: exerciseFrequencyIndex + 1, // 1-3
      };
      setHabits(habitsValue);
      navigation.navigate('OnboardingLocation');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={{
                  uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/back-arrow.png',
                }}
                style={{ width: 16, height: 16, marginHorizontal: 16 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <View style={{ width: 24 }} />
          </View>
          <View style={styles.container}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Your current habits</Text>
              <Text style={styles.subtitle}>
                Help us understand your starting point
              </Text>
            </View>

            {/* Question Block 1 — Water Intake */}
            <View style={styles.questionBlock}>
              <Text style={styles.questionLabel}>
                Do you drink enough water?
              </Text>
              <View style={styles.binarySelectionContainer}>
                {waterOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.binaryButton,
                      waterIntakeIndex === index && styles.selectedBinaryButton,
                    ]}
                    onPress={() => setWaterIntakeIndex(index)}
                  >
                    <Text style={styles.binaryButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Question Block 2 — Sleep Quality */}
            <View style={styles.questionBlock}>
              <Text style={styles.questionLabel}>How is your sleep?</Text>
              <View style={styles.gridContainer}>
                {sleepOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.gridCard,
                      sleepQualityIndex === index && styles.selectedCard,
                    ]}
                    onPress={() => setSleepQualityIndex(index)}
                  >
                    <Text style={styles.gridCardText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Question Block 3 — Exercise Frequency */}
            <View style={styles.questionBlock}>
              <Text style={styles.questionLabel}>
                How often do you exercise?
              </Text>
              <View style={styles.verticalStackContainer}>
                {exerciseOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.verticalCard,
                      exerciseFrequencyIndex === index && styles.selectedCard,
                    ]}
                    onPress={() => setExerciseFrequencyIndex(index)}
                  >
                    <Text style={styles.verticalCardText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.ctaButtonContainer,
                { paddingBottom: 16 + insets.bottom },
              ]}
            >
              <Button
                title="Continue"
                onPress={handleContinue}
                disabled={!isAllSelected}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    // paddingTop: 16,
    paddingBottom: 24,
  },

  header: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 12,
  },
  backIcon: {
    fontSize: 28,
    color: '#3A3A3A',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E6E6E6',
    borderRadius: 3,
    marginHorizontal: 72,
  },
  progressFill: {
    width: '85%', // later step than inspiration screen
    height: '100%',
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
  },
  headerSection: {
    marginTop: 24, // Title positioned 28dp below progress indicator (adjusting for nav and progress)
  },
  title: {
    fontSize: 30,
    fontFamily: 'Satoshi-Bold',
    color: '#3D4C5E', // dark gray
    textAlign: 'center',
    lineHeight: 26 * 1.25,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#494949', // medium gray
    textAlign: 'center',
  },
  questionBlock: {
    marginTop: 45,
  },
  questionLabel: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    color: '#494949', // dark gray
    textAlign: 'left',
  },
  // Water Intake Styles
  binarySelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 19,
    gap: 10,
  },
  binaryButton: {
    height: 59,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC', // light gray
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  selectedBinaryButton: {
    backgroundColor: '#FFE8E8', // soft blush pink
    borderColor: '#B95E82', // muted pink
    borderWidth: 1,
  },
  binaryButtonText: {
    paddingLeft: 12,
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#000000', // dark gray
  },
  // Sleep Quality Styles
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 19,
    gap: 12,
  },
  gridCard: {
    height: 59,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  gridCardText: {
    paddingLeft: 12,
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
  // Exercise Frequency Styles
  verticalStackContainer: {
    marginTop: 19,
    gap: 10,
  },
  verticalCard: {
    width: '100%',
    height: 59,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  verticalCardText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
  selectedCard: {
    borderColor: '#B95E82',
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
  },
  // CTA Button
  ctaButtonContainer: {
    marginTop: 52,
    paddingBottom: 46, // Matches root bottom padding
  },
});

export default OnboardingHabitsScreen;
