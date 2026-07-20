import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useForgotPasswordViewModel } from '../../viewmodels/useForgotPasswordViewModel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Images } from '../../assets/images';
import { normalizeErrorMessage } from '../../utils/errorUtils';

const ForgotPasswordOTPScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { email } = route.params;
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const lastAutoSubmittedCodeRef = useRef<string | null>(null);
  
  const { verifyPasswordResetOTP, sendPasswordResetOTP, isLoading } = useForgotPasswordViewModel();
  
  // Refs for OTP inputs
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Timer effect
  useEffect(() => {
    if (!canResend && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
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

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus on last filled input or next empty
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Single character input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please enter 6-digit OTP',
      });
      return;
    }

    try {
      const result = await verifyPasswordResetOTP(email, otpCode);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Verified',
          text2: 'OTP verified successfully',
        });
        
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', { email });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: normalizeErrorMessage(result.message, 'Invalid OTP'),
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: normalizeErrorMessage(error?.message, 'Verification failed'),
      });
    }
  };

  const handleResendOTP = async () => {
    try {
      setCanResend(false);
      setTimer(30);
      
      const result = await sendPasswordResetOTP(email);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Resent',
          text2: 'Please check your email',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: normalizeErrorMessage(
            result.message,
            'Failed to resend OTP'
          ),
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: normalizeErrorMessage(
          error?.message,
          'Failed to resend OTP'
        ),
      });
    }
  };

  // Auto-verify when OTP input is complete.
  useEffect(() => {
    const code = otp.join('');

    if (code.length < 6) {
      lastAutoSubmittedCodeRef.current = null;
      return;
    }

    if (isLoading) return;
    if (lastAutoSubmittedCodeRef.current === code) return;

    lastAutoSubmittedCodeRef.current = code;
    handleVerifyOTP();
  }, [otp, isLoading]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color="#494949" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Verify OTP</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Image
                source={{ uri: Images.emailIcon }}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Keep Your Account Secure</Text>

            {/* Description */}
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                OTP sent to {email}
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.changeEmail}>Change email</Text>
              </TouchableOpacity>
            </View>

            {/* OTP Input */}
            <Text style={styles.otpLabel}>Enter OTP *</Text>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              {!canResend ? (
                <Text style={styles.timerText}>
                  Resend in 00:{timer < 10 ? '0' : ''}{timer}s
                </Text>
              ) : (
                <Text style={styles.resendText}>
                  Didn't receive it?{' '}
                  <Text style={styles.resendLink} onPress={handleResendOTP}>
                    Resend code
                  </Text>
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View style={[styles.buttonContainer, { paddingBottom: 28 + insets.bottom }]}>
              <TouchableOpacity
                style={[styles.button, isLoading && { opacity: 0.7 }]}
                onPress={handleVerifyOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#494949',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 80,
    height: 80,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 20,
  },
  alertBox: {
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#B95E82',
    borderRadius: 10,
    padding: 16,
    marginBottom: 30,
  },
  alertText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#494949',
    marginBottom: 4,
  },
  changeEmail: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#B95E82',
  },
  otpLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    color: '#494949',
    marginBottom: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 52,
    height: 56,
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
    textAlign: 'center',
  },
  resendContainer: {
    marginBottom: 40,
  },
  timerText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6A7282',
  },
  resendText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#6A7282',
  },
  resendLink: {
    fontFamily: 'Satoshi-Bold',
    color: '#B95E82',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});

export default ForgotPasswordOTPScreen;
