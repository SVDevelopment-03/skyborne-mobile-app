import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from 'react-native';
import GradientBackground from '../../components/GradientBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const OnboardingTimeCommitmentScreen = ({ navigation }: Props)  => {
  const insets = useSafeAreaInsets();
  const [busyLevel, setBusyLevel] = useState('moderately_busy');
  const [timeCommitment, setTimeCommitment] = useState('30_minutes');

  const busyOptions = [
    { id: 'not_busy', label: 'Not very busy' },
    { id: 'moderately_busy', label: 'Moderately busy' },
    { id: 'relaxed', label: 'Relaxed' },
  ];

  const timeOptions = [
    { id: '15_minutes', label: '15 minutes' },
    { id: '30_minutes', label: '30 minutes' },
    { id: '45_minutes', label: '45 minutes' },
    { id: '60_plus_minutes', label: '60+ minutes' },
  ];

  

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>

            <View style={{ width: 24 }} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Tell Us About Your Day</Text>
            <Text style={styles.subtitle}>We’ll recommend the right classes for you</Text>
          </View>

          <View style={styles.selectionGroup1}>
            {busyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.card,
                  busyLevel === option.id && styles.selectedCard,
                ]}
                onPress={() => setBusyLevel(option.id)}
              >
                <Text style={styles.cardText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Time you can give daily?</Text>

          <View style={styles.selectionGroup2}>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.gridCard,
                  timeCommitment === option.id && styles.selectedGridCard,
                ]}
                onPress={() => setTimeCommitment(option.id)}
              >
                <Text style={styles.gridCardText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.buttonContainer, { paddingBottom: 16 + insets.bottom }]}>
            <Button title="Continue" 
            
            // TO DO: Implement next step navigation
            onPress={() => navigation.navigate('OnboardingFitnessLevel')}
            />
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 110,
    paddingHorizontal: 16,
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
    width: '45%', // later step than inspiration screen
    height: '100%',
    backgroundColor: '#3A3A3A',
    borderRadius: 3,
  },
  headerContainer: {
   paddingHorizontal: 22,
    paddingTop: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Satoshi-Bold',
    color: '#3D4C5E', // dark gray
    textAlign: 'center',
    lineHeight: 24 * 1.25,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Satoshi-Regular',
    color: '#8A95A5', // medium gray
    textAlign: 'center',
    maxWidth: '90%',
  },
  selectionGroup1: {
    marginTop: 28,
  },
  card: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    backgroundColor: '#FEF6F7', // light blush pink
    borderColor: '#EBC4C6', // muted pink
    borderWidth: 1.5,
  },
  cardText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#3D4C5E', // dark gray
  },
  sectionLabel: {
    marginTop: 24 - 12, // 24dp below last card, card has 12dp margin bottom
    fontSize: 16,
    fontFamily: 'Satoshi-SemiBold',
    color: '#3D4C5E', // dark gray
    textAlign: 'left',
  },
  selectionGroup2: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 18 * 2 - 14) / 2, // (screenWidth - padding*2 - gap) / 2
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedGridCard: {
    backgroundColor: '#FEF6F7', // light pink
    borderColor: '#EBC4C6', // pink
    borderWidth: 1.5,
  },
  gridCardText: {
    fontSize: 15,
    fontFamily: 'Satoshi-Medium',
    color: '#3D4C5E', // dark gray
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 0,
  },

});

export default OnboardingTimeCommitmentScreen;
