import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import GradientBackground from '../../components/GradientBackground';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { authService } from '../../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { loggedIn, onboardingCompleted } = useSelector(
    (state: RootState) => state.auth,
  );
  const hasNavigated = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 1400));
      if (cancelled || hasNavigated.current) return;
      hasNavigated.current = true;

      const token = await authService.getAuthToken();
      if (token) {
        navigation.replace('Home');
        return;
      }

      navigation.replace('WelcomeScreen');
    })();

    return () => {
      cancelled = true;
    };
  }, [navigation, loggedIn, onboardingCompleted]);

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Skyborne Drop</Text>
        {/* <Text style={styles.subtitle}>Skyborne Drop</Text> */}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  logo: { width: 70, height: 75, borderRadius: 24, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '400', color: '#666' },
  subtitle: { marginTop: 8, color: '#666' },
});
