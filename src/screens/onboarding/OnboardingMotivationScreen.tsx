import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const motivationOptions = [
  {
    id: 'reminders',
    icon: '🔔',
    title: 'Reminders',
    subtitle: 'Gentle nudges to stay on track',
  },
  {
    id: 'streaks',
    icon: '🔥',
    title: 'Streaks',
    subtitle: 'Build momentum day by day',
  },
  {
    id: 'gentle_tips',
    icon: '💡',
    title: 'Gentle tips',
    subtitle: 'Learn and grow gradually',
  },
  {
    id: 'challenges',
    icon: '🏆',
    title: 'Challenges',
    subtitle: 'Push yourself with goals',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const OnboardingMotivationScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [selectedMotivation, setSelectedMotivation] = useState<any>(null);

  const MotivationCard = ({ option, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
    >
      <View style={styles.iconHolder}>
        <Text style={styles.icon}>{option.icon}</Text>
      </View>
      <View style={styles.textContent}>
        <Text style={styles.primaryText}>{option.title}</Text>
        <Text style={styles.secondaryText}>{option.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.title}>What motivates you most?</Text>
          </View>

          <View style={styles.optionsGroup}>
            {motivationOptions.map(option => (
              <MotivationCard
                key={option.id}
                option={option}
                isSelected={selectedMotivation === option.id}
                onPress={() => setSelectedMotivation(option.id)}
              />
            ))}
          </View>

          <View
            style={[
              styles.ctaButtonContainer,
              { paddingBottom: 16 + insets.bottom },
            ]}
          >
            <Button
              title="Complete Profile"
              onPress={() => navigation.navigate('OnboardingLocation')}
            />
          </View>
        </View>
      </SafeAreaView>
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
    paddingTop: 16,
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
    marginTop: 7,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#494949',
    borderRadius: 3,
  },
  headerSection: {
    marginTop: 0,
  },
  title: {
    width: 263,
    height: 66,
    fontFamily: 'Satoshi-Bold',
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#494949',
    opacity: 1,
    alignSelf: 'center',
  },
  optionsGroup: {
    marginTop: 38,
    gap: 16,
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    width: '100%',
    height: 85,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  selectedCard: {
    borderColor: '#B95E82',
    borderWidth: 1.5,
  },
  iconHolder: {
    width: 52,
    height: 52,
    borderRadius: 5,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  icon: {
    fontSize: 26,
  },
  textContent: {
    marginLeft: 14,
    flex: 1,
  },
  primaryText: {
    width: 68,
    height: 15,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 15,
    letterSpacing: 0,
    color: '#000000',
    opacity: 1,
  },
  secondaryText: {
    height: 18,
    marginTop: 7,
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 13,
    letterSpacing: 0,
    color: '#494949',
    opacity: 1,
  },
  ctaButtonContainer: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
});

export default OnboardingMotivationScreen;
