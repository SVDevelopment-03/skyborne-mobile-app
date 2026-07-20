import React, { useState } from 'react';
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
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useForgotPasswordViewModel } from '../../viewmodels/useForgotPasswordViewModel';
import Toast from 'react-native-toast-message';
import { Images } from '../../assets/images';
import { normalizeErrorMessage } from '../../utils/errorUtils';

const ForgotPasswordEmailScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const { sendPasswordResetOTP, isLoading } = useForgotPasswordViewModel();

  const handleSendOTP = async () => {
    // Validation
    if (!email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Email Required',
        text2: 'Please enter your email address',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    try {
      const result = await sendPasswordResetOTP(email);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'OTP Sent',
          text2: 'Please check your email',
        });

        // Navigate to OTP screen
        navigation.navigate('ForgotPasswordOTP', { email });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: normalizeErrorMessage(result.message, 'Failed to send OTP'),
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: normalizeErrorMessage(error?.message, 'Something went wrong'),
      });
    }
  };

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
              <Text style={styles.headerTitle}>Forgot Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Logo or Image */}
           
            <Mail
              size={36} // adjust based on your design
              color="#B95E82" // change to your theme color
              strokeWidth={2}
              style={styles.logo}
            />

            {/* Title */}
            <Text style={styles.title}>Reset Your Password</Text>

            {/* Description */}
            <Text style={styles.description}>
              Enter your email address and we'll send you a verification code to
              reset your password
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.7 }]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.backToLoginText}>
                Remember your password?{' '}
                <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
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
    marginBottom: 40,
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
  logo: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#494949',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(5, 5, 5, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#494949',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    color: '#494949',
    minHeight: 54,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  backToLogin: {
    paddingVertical: 12,
    alignSelf: 'center',
  },
  backToLoginText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: 'Satoshi-Medium',
    color: '#B95E82',
  },
});

export default ForgotPasswordEmailScreen;
