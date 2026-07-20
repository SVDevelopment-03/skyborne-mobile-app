import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { useOnboardingStore } from '../../store/onboardingSlice';

const fitnessLevels = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'Just starting my wellness journey',
    image: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/onboardingfitnesslevel.png',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'I exercise regularly',
    image:
      'https://skyborne-images.s3.ap-south-1.amazonaws.com/intermidiate.png',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Very active and experienced',
    image: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/onboadingfitnesslevel1.png',
  },
];

const OnboardingFitnessLevelScreen = ({ navigation }: any) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(1); // Default to 'Intermediate' (index 1)
  const insets = useSafeAreaInsets();
  const { setFitnessLevel } = useOnboardingStore();

  const FitnessCard = ({ level, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
    >
      <Image source={{uri:level.image}} style={styles.cardImagePlaceholder} />
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{level.title}</Text>
        <Text style={styles.cardSubtitle}>{level.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleContinue = () => {
    // Convert selected index to 1-based number (1-3) and store
    const fitnessValue = selectedIndex + 1;
    setFitnessLevel(fitnessValue);
    navigation.navigate('OnboardingHabits');
  };

  return (
    <GradientBackground>
      <View style={styles.safeArea}>
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
          <View style={styles.headerContainer}>
            <Text style={styles.title}>What's Your Fitness Level?</Text>
            <Text style={styles.subtitle}>
              We'll recommend the right classes for you
            </Text>
          </View>

          <View style={styles.cardsGroup}>
            {fitnessLevels.map((level, index) => (
              <FitnessCard
                key={level.id}
                level={level}
                isSelected={selectedIndex === index}
                onPress={() => setSelectedIndex(index)}
              />
            ))}
          </View>

          <View style={[styles.buttonContainer, { paddingBottom: 16 + insets.bottom }]}>
            <Button title="Continue" onPress={handleContinue} />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 2,
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
    width: '75%', // later step than inspiration screen
    height: '100%',
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
  },
  headerContainer: {
    marginTop: 24,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Satoshi-Bold',
    color: '#3D4C5E', 
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
  cardsGroup: {
    marginTop: 42,
  },
  card: {
    flexDirection: 'row',
    width: '100%',
    height: 90,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC', // very light gray
    marginBottom: 15,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: '#B95E82',
    borderWidth: 1.5,
  },
  cardImagePlaceholder: {
    width: '33%',
    height: '100%',
  },
  cardTextContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#000000', // dark gray
  },
  cardSubtitle: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#8A95A5', // medium gray
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

export default OnboardingFitnessLevelScreen;
