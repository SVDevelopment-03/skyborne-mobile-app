// @ts-ignore

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import GradientBackground from '../../components/GradientBackground';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import Toast from 'react-native-toast-message';
import RNOtpVerify from 'react-native-otp-auto-fill';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeErrorMessage } from '../../utils/errorUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { sendOtp, verifyOtp } = useAuthViewModel();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const inputs = useRef<TextInput[]>([]);
  const otpSentRef = useRef(false);
  const lastAutoSubmittedCodeRef = useRef<string | null>(null);

  const userEmail = route.params?.email;

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    Toast.show({
      type,
      position: 'top',
      text1:
        type === 'success'
          ? '✓ Success'
          : type === 'error'
          ? '✗ Error'
          : 'ℹ Info',
      text2: message,
      topOffset: 60,
    });
  };

  // Auto-send OTP on mount
  useEffect(() => {
    if (userEmail && !otpSentRef.current) {
      otpSentRef.current = true;
      handleSendOtp();
    }
  }, [userEmail]);

  // FIX: Properly handle the OTP listener subscription
  useEffect(() => {
    if (Platform.OS === 'android') {
      let subscription: any = null;
      
      try {
        subscription = RNOtpVerify.addListener((message: string) => {
          const otpFromSms = message.match(/\d{6}/)?.[0]; // 6 digit OTP
          if (otpFromSms) {
            setOtp(otpFromSms.split(''));
            inputs.current[5]?.focus();
            // Remove listener after OTP is received
            if (subscription) {
              subscription.remove();
            }
          }
        });
      } catch (err) {
        console.log('OTP Listener Error:', err);
      }

      return () => {
        // Cleanup on unmount
        if (subscription) {
          try {
            subscription.remove();
          } catch (err) {
            console.log('Error removing OTP listener:', err);
          }
        }
      };
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!canResend && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, canResend]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const payload: { email?: string; phone?: string } = {};
      if (userEmail) payload.email = userEmail;

      const res = await sendOtp(payload);

      if (res?.success) {
        showToast('OTP sent successfully!', 'success');
        setCanResend(false);
        setTimer(30);
      } else {
        showToast(
          normalizeErrorMessage(res?.message, 'Failed to send OTP'),
          'error'
        );
      }
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      showToast(
        normalizeErrorMessage(err?.message, 'Failed to send OTP'),
        'error'
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setCanResend(false);
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
    await handleSendOtp();
  };

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onVerify = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      showToast('Please enter all 6 digits', 'error');
      return;
    }

    setIsVerifying(true);

    try {
      const payload: { phone?: string; email?: string; otp: string } = {
        otp: code,
      };
      if (userEmail) payload.email = userEmail;

      const res = await verifyOtp(payload);

      if (res?.success) {
        showToast('OTP verified successfully!', 'success');
        setTimeout(() => {
          navigation.replace('OnboardingInspiration');
        }, 1000);
      } else {
        showToast(normalizeErrorMessage(res?.message, 'Invalid OTP'), 'error');
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'OTP verification failed';
      console.error('OTP Verification Error:', {
        message: errorMsg,
        payloadEmail: userEmail,
        otpLength: code.length,
        fullError: err,
      });
      showToast(
        normalizeErrorMessage(errorMsg, 'OTP verification failed'),
        'error'
      );
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify as soon as 6 digits are available.
  useEffect(() => {
    const code = otp.join('');

    if (code.length < 6) {
      lastAutoSubmittedCodeRef.current = null;
      return;
    }

    if (isVerifying || isSendingOtp) return;
    if (lastAutoSubmittedCodeRef.current === code) return;

    lastAutoSubmittedCodeRef.current = code;
    onVerify();
  }, [otp, isVerifying, isSendingOtp]);

  return (
    <GradientBackground>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={{
              uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/back-arrow.png',
            }}
            style={{ width: 16, height: 16, marginHorizontal: 16 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.appBarCenter}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.appBarLogo}
          />
          <Text style={styles.appBarTitle}>Skyborne Drop</Text>
        </View>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Enter OTP</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                if (ref) inputs.current[index] = ref;
              }}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              editable={!isVerifying && !isSendingOtp}
            />
          ))}
        </View>

        <Text style={styles.infoText}>OTP Sent to {userEmail}</Text>

        <Text style={styles.resendText}>
          {!canResend ? (
            <>
              Resend in 00:{timer < 10 ? '0' : ''}
              {timer}s
            </>
          ) : (
            <>
              Didn't receive it?{' '}
              <Text
                style={styles.resendLink}
                onPress={handleResendOtp}
                disabled={isSendingOtp}
              >
                Resend code
              </Text>
            </>
          )}
        </Text>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (isVerifying || isSendingOtp) && { opacity: 0.6 },
            { marginBottom: 28 + insets.bottom },
          ]}
          onPress={onVerify}
          disabled={isVerifying || isSendingOtp}
        >
          {isVerifying ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 70,
  },
  backIcon: {
    fontSize: 35,
    color: '#3A3A3A',
  },
  appBarCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBarLogo: {
    width: 50,
    height: 55,
    resizeMode: 'contain',
    marginRight: 6,
  },
  appBarTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3A3A3A',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#494949',
    marginBottom: 30,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 54,
  },
  otpBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    backgroundColor: 'rgba(255,255,255,0)',
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 15,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 14,
    color: '#6A7282',
    marginBottom: 40,
    fontWeight: '500',
  },
  resendLink: {
    color: '#B5647E',
    fontWeight: '500',
  },
  continueButton: {
    height: 54,
    borderRadius: 28,
    backgroundColor: '#B5647E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
