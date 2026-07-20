import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageSourcePropType,
  Platform,
  Alert,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { ThemedText } from '../../components/ThemedText';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import GradientBackground from '../../components/GradientBackground';
import { FontFamilies } from '../../constants/fonts';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
import { useSignup } from '../../store/SignupContext';
import { IconImages } from '../../assets/icons';
import { normalizeErrorMessage } from '../../utils/errorUtils';
import { GOOGLE_KEY } from '@env';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthOptions'>;
type AuthProviderProps = 'email' | 'google' | 'apple';

type AuthButtonProps = {
  icon?: string | ImageSourcePropType;
  iconSvgUri?: string;
  text: string;
  onPress?: () => void;
};

const AuthButton = ({ icon, iconSvgUri, text, onPress }: AuthButtonProps) => (
  <TouchableOpacity style={styles.authButton} onPress={onPress}>
    {iconSvgUri ? (
      <SvgUri width={20} height={20} uri={iconSvgUri} style={styles.authButtonImage} />
    ) : typeof icon === 'string' ? (
      <ThemedText style={styles.authButtonIcon}>{icon}</ThemedText>
    ) : icon ? (
      <Image source={icon} style={styles.authButtonImage} />
    ) : null}
    <ThemedText style={styles.authButtonText}>
      {text}
    </ThemedText>
  </TouchableOpacity>
);

const CONTINUE_AS_GUEST_ICON_SVG =
  'https://skyborne-images.s3.ap-south-1.amazonaws.com/svgicons/Continue+as+guest.svg';

export default function AuthOptionsScreen({ navigation }: Props) {
  const { updateStepData } = useSignup();

  const getAppleAuth = React.useCallback((): any | null => {
    if (Platform.OS !== 'ios') {
      return null;
    }
    try {
      // Loaded lazily so Android bundling doesn't require the dependency.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('@invertase/react-native-apple-authentication')?.appleAuth ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    try {
      const webClientId = GOOGLE_KEY || '';
      const iosClientId =
        '398904495705-5sfusc2amh3d00j4nmno4iqmth1o68kr.apps.googleusercontent.com';

      const configureOptions = {
        iosClientId,
        offlineAccess: false,
        ...(Platform.OS === 'android' && webClientId ? { webClientId } : {}),
      };

      GoogleSignin.configure(configureOptions);
    } catch (error) {
      console.error('Configuration error:', error);
    }
  };

  const handleGuestSignIn = () => {
    navigation.navigate('GuestHome');
  };

  const handleGoogleSignIn = async () => {
    try {
      try {
        await GoogleSignin.signOut();
      } catch (error: any) {
        // Silently fail if not signed in
        console.log('Not previously signed in');
      }

      // Check if device supports Google Play Services (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Sign in
      const userInfo: any = await GoogleSignin.signIn();
      const user = userInfo?.data?.user ?? userInfo?.user;

      // Some library versions return a non-throwing cancelled response.
      if (userInfo?.type === 'cancelled' || !user) {
        Toast.show({
          type: 'info',
          text1: 'Cancelled',
          text2: 'Sign-in was cancelled',
        });
        return;
      }

      if (!user?.email) {
        Toast.show({
          type: 'error',
          text1: 'No account selected',
          text2: 'Please select a Google account to continue.',
        });
        return;
      }

      // Extract user data
      const googleData = {
        firstName: user?.givenName || '',
        lastName: user?.familyName || '',
        email: user?.email,
        authProvider: 'google' as AuthProviderProps,
        googleId: user?.id,
      };

      console.log(
        '[AuthOptions] Google account used for email/profile prefill only:',
        googleData,
      );

      updateStepData('step2', googleData);

      console.log(
        '[AuthOptions] Navigating to OTP after Google prefill to generate tempUserId',
      );

      navigation.navigate('OTP', { email: googleData.email });

      // You can navigate to next screen or handle the data as needed
      // navigation.navigate('NextScreen', { userData: googleData });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Continue OTP verification for ${googleData.email}`,
      });
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Toast.show({
          type: 'info',
          text1: 'Cancelled',
          text2: 'Sign-in was cancelled',
        });
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Toast.show({
          type: 'info',
          text1: 'In Progress',
          text2: 'Sign-in is already in progress',
        });
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Google Play Services not available or outdated',
        });
      } else if (error.code === '12501') {
        // Common error code for configuration issues
        Toast.show({
          type: 'error',
          text1: 'Configuration Error',
          text2: 'Please check Web Client ID and SHA-1 fingerprint',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Sign-in Failed',
          text2: normalizeErrorMessage(error?.message, 'Unknown error occurred'),
        });
      }
    }
  };

  const handleAppleSignIn = async () => {
    const appleAuth = getAppleAuth();

    try {
      if (!appleAuth) {
        Toast.show({
          type: 'info',
          text1: 'Apple Sign-In Unavailable',
          text2: 'Apple Sign-In is not configured for this build.',
        });
        return;
      }

      if (!appleAuth.isSupported) {
        Toast.show({
          type: 'info',
          text1: 'Not Supported',
          text2: 'Apple Sign-In is not available on this device',
        });
        return;
      }

      const appleResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
      });

      let email = appleResponse.email;

      const extractEmailFromIdentityToken = (identityToken: string | undefined) => {
        try {
          if (!identityToken) return null;
          const parts = identityToken.split('.');
          if (parts.length < 2) return null;
          const payload = parts[1];
          const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
          return decoded?.email ?? null;
        } catch {
          return null;
        }
      };

      if (!email) {
        email = extractEmailFromIdentityToken(appleResponse.identityToken) ?? null;
      }

      if (!email) {
        Alert.alert(
          'Email Not Available',
          'Apple only shares email on the first authorization. You can remove this app from your Apple ID and try again, or enter your email manually to continue.',
          [
            {
              text: 'Enter Email',
              onPress: () =>
                navigation.navigate('Signup', {
                  prefill: { authProvider: 'apple', appleId: appleResponse.user },
                }),
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }

      const appleData = {
        firstName: '',
        lastName: '',
        email,
        authProvider: 'apple' as AuthProviderProps,
        appleId: appleResponse.user,
      };

      console.log(
        '[AuthOptions] Apple account used for email prefill only:',
        appleData,
      );

      updateStepData('step2', appleData);
      navigation.navigate('OTP', { email: appleData.email });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Continue OTP verification for ${appleData.email}`,
      });
    } catch (error: any) {
      if (appleAuth && error?.code === appleAuth.Error.CANCELED) {
        Toast.show({
          type: 'info',
          text1: 'Cancelled',
          text2: 'Apple Sign-In was cancelled',
        });
        return;
      }

      if (appleAuth && String(error?.code) === '1000') {
        Toast.show({
          type: 'error',
          text1: 'Apple Sign-In Configuration Error',
          text2:
            'Enable Sign In with Apple capability for this app ID and ensure your iPhone Apple ID is signed in.',
        });
        return;
      }

      console.error('Apple Sign-In Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign-in Failed',
        text2: normalizeErrorMessage(error?.message, 'Unknown error occurred'),
      });
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <ThemedText style={styles.appName}>
            Skyborne Drop
          </ThemedText>
        </View>

        <View style={styles.content}>
          <ThemedText style={styles.title}>
            Let's Get Started
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Let's dive into your account
          </ThemedText>

          <View style={styles.authButtonsContainer}>
            {Platform.OS === 'ios' && (
            <AuthButton
              icon={IconImages?.apple}
              text="Continue with Apple"
              onPress={handleAppleSignIn}
            />
            )}
            <AuthButton
              iconSvgUri={CONTINUE_AS_GUEST_ICON_SVG}
              text="Continue as Guest"
              onPress={handleGuestSignIn}
            />
            <AuthButton
              icon={IconImages?.google}
              text="Continue with Google"
              onPress={handleGoogleSignIn}
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <ThemedText style={styles.loginButtonText}>
              Login
            </ThemedText>
          </TouchableOpacity>

          {/* COMMENTED OUT - SIGNUP BUTTON HIDDEN */}
          {/* <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <ThemedText style={styles.signupText}>
              Signup
            </ThemedText>
          </TouchableOpacity> */}
        </View>

        <ThemedText style={styles.legalText}>
          By continuing, you agree to Skyborne drop Terms of Service and Privacy
          Policy
        </ThemedText>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 63,
    marginBottom: 50,
  },
  logo: {
    width: 55,
    height: 63,
    lineHeight: 19,
    resizeMode: 'contain',
    marginRight: 8,
  },
  appName: {
    fontFamily: FontFamilies.SatoshiMedium,
    fontSize: 15,
    color: '#494949',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamilies.SatoshiBold,
    fontSize: 30,
    color: '#494949',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamilies.SatoshiRegular,
    fontSize: 14,
    color: '#494949',
    marginBottom: 52,
  },
  authButtonsContainer: {
    width: '85%',
    marginBottom: 5,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    marginBottom: 20,
    paddingHorizontal: 70,
  },
  authButtonIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  authButtonImage: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  authButtonText: {
    fontFamily: FontFamilies.SatoshiMedium,
    fontSize: 16,
    color: '#494949',
  },
  loginButton: {
    width: '85%',
    height: 54,
    backgroundColor: '#b95d82',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 11,
  },
  loginButtonText: {
    fontFamily: FontFamilies.SatoshiMedium,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signupButton: {
    width: '85%',
    height: 54,
    backgroundColor: '#FFE8E8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    fontFamily: FontFamilies.SatoshiMedium,
    color: '#494949',
    fontSize: 16,
  },
  legalText: {
    position: 'absolute',
    bottom: 49,
    fontSize: 13,
    fontFamily: FontFamilies.SatoshiRegular,
    color: '#A3A4A6',
    textAlign: 'center',
    width: '80%',
  },
});
