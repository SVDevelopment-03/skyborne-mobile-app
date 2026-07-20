import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import { useOnboardingStore } from '../../store/onboardingSlice';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import GradientBackground from '../../components/GradientBackground';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'OnboardingInspiration'
>;

const OPTIONS = [
  'Move more & improve flexibility',
  'Get fit & stronger',
  'Eat healthy & feel better',
  'Reduce stress',
  'Build a lasting habit',
  'Just exploring',
];

export default function OnboardingInspirationScreen({ navigation }: Props) {
  const { setInspiration } = useOnboardingStore();
  const insets = useSafeAreaInsets();
  const [selectedIndex, setSelectedIndex] = useState<number>(3); // Default to 'Reduce stress' (index 3)

  const next = () => {
    // Convert selected index to 1-based number (1-6) and store
    const inspirationValue = selectedIndex + 1;
    setInspiration(inspirationValue);
    navigation.navigate('OnboardingGoal');
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
          <Text style={styles.title}>
            What inspired you{'\n'}to join Skyborne?
          </Text>

          {OPTIONS.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setSelectedIndex(index)}
                style={[styles.optionCard, isSelected && styles.optionSelected]}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
          <Button title="Continue" onPress={next} />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  /* HEADER */
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
    width: '15%',
    height: '100%',
    backgroundColor: '#494949',
    borderRadius: 30,
  },

  /* CONTENT */
  container: {
    paddingHorizontal: 19,
    paddingTop: 12,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Satoshi-Bold',
    color: '#494949',
    marginBottom: 38,
    lineHeight: 34,
    textAlign: 'center',
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
    fontWeight: '500',
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

  /* FOOTER */
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: 'auto',
  },
});
