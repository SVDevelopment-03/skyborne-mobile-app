import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { useOnboardingStore } from '../../store/onboardingSlice';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted } from '../../store/authSlice';
import GradientBackground from '../../components/GradientBackground';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingGoal'>;

const GOALS = [
  'Attend my first session',
  'Build a 7-day streak',
  'Try something new each week',
  'Join a group challenge',
  "I'll decide later",
];

export default function OnboardingGoalScreen({ navigation }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>(3); // Default to 'Join a group challenge' (index 3)
  const insets = useSafeAreaInsets();
  const { setFirstGoal } = useOnboardingStore();
  const dispatch = useDispatch();

  const next = () => {
    // Convert selected index to 1-based number (1-5) and store
    const goalValue = selectedIndex + 1;
    setFirstGoal(goalValue);
    dispatch(setOnboardingCompleted(true));
    navigation.replace('OnboardingFitnessLevel');
  };

  return (
    <GradientBackground>
      <View style={styles.screen}>
        {/* HEADER */}
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

        {/* CONTENT */}
        <View style={styles.container}>
          <Text style={styles.title}>Set Your First Goal!</Text>

          <View style={styles.options}>
            {GOALS.map((goal, index) => {
              const isSelected = selectedIndex === index;
              return (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedIndex(index)}
                >
                  <Text style={styles.optionText}>{goal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA */}
          <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
            <Button title="Continue" onPress={next} />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    backgroundColor: '#DADADA',
    borderRadius: 30,
    marginHorizontal: 72,
  },
  progressFill: {
    width: '35%', // later step than inspiration screen
    height: '100%',
    backgroundColor: '#494949',
    borderRadius: 30,
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 20,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Satoshi-Bold',
    color: '#494949',
    marginBottom: 38,
    lineHeight: 34,
    textAlign: 'center',
  },
  options: {
    flex: 1,
  },
  optionCard: {
    width: '100%',
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 59,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    borderStyle: 'solid',
    borderColor: '#ECECEC',
    borderWidth: 1,
    color: '#000000',
  },
  optionSelected: {
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#B95E82',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 6,
    paddingBottom: 24,
    // marginTop: 'auto',
  },
});
