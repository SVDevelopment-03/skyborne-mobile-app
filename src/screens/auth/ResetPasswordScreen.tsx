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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useForgotPasswordViewModel } from '../../viewmodels/useForgotPasswordViewModel';
import Toast from 'react-native-toast-message';
import { Images } from '../../assets/images';
import { normalizeErrorMessage } from '../../utils/errorUtils';

const ResetPasswordScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { resetPassword, isLoading } = useForgotPasswordViewModel();

  const handleResetPassword = async () => {
    // Validations
    if (!newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Password Required',
        text2: 'Please enter new password',
      });
      return;
    }

    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Password Too Short',
        text2: 'Password must be at least 8 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords Do Not Match',
        text2: 'Please make sure passwords match',
      });
      return;
    }

    try {
      const result = await resetPassword(email, newPassword);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Password Reset',
          text2: 'Your password has been reset successfully',
        });
        
        // Navigate to login screen
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Reset Failed',
          text2: normalizeErrorMessage(
            result.message,
            'Failed to reset password'
          ),
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: normalizeErrorMessage(
          error?.message,
          'Failed to reset password'
        ),
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
              <Text style={styles.headerTitle}>Reset Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Logo or Image */}
            <Image
              source={{ uri: Images.emailIcon }}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Title */}
            <Text style={styles.title}>Create New Password</Text>

            {/* Description */}
            <Text style={styles.description}>
              Your new password must be different from previously used passwords
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password *</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#999999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#B1B1B1" />
                  ) : (
                    <Eye size={20} color="#B1B1B1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#999999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#B1B1B1" />
                  ) : (
                    <Eye size={20} color="#B1B1B1" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
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
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#494949',
    marginBottom: 10,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    color: '#494949',
    minHeight: 54,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 17,
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});

export default ResetPasswordScreen;
