import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform  } from 'react-native';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import GradientBackground from '../../components/GradientBackground';
import { FontFamilies } from '../../constants/fonts';
import { useSignup } from '../../store/SignupContext';
import Svg, { Path } from 'react-native-svg';
import { EyeIcon, EyeOffIcon } from '../../icons/FormIcons';
import PolicyModal from '../../components/PolicyModal';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackArrowIcon from '../../components/BackArrowIcon';
const TERMS_URL = 'https://skybornedrop.com/terms';
const COOKIE_POLICY_URL = 'https://skybornedrop.com/cookie-policy';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
};

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string()
    .notRequired()
    .min(2, 'Last name must have at least 2 characters'),
  email: Yup.string()
    .trim()
    .required('Email is required')
    .email('Invalid email format')
    .matches(
      /^[^\s@]+@[^\s@]+\.(com|net|org|in|co|io|ai|edu|gov|ae)$/i,
      'Enter a valid email',
    ),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain uppercase letter')
    .matches(/[a-z]/, 'Password must contain lowercase letter')
    .matches(/\d/, 'Password must contain number')
    .matches(
      /[@$!%*?&]/,
      'Password must contain special character (@, $, !, %, *, ?, &)',
    ),
  agreeTerms: Yup.boolean().oneOf(
    [true],
    'You must agree to the Terms & Data Policy to continue',
  ),
});



export default function SignupScreen({ navigation }: Props) {
  // Keeps the bottom of the form clear of the Android navigation bar.
  const insets = useSafeAreaInsets();
  const { formData, updateStepData, setCurrentStep } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [policyType, setPolicyType] = useState<'terms' | 'cookies' | null>(null);

  const closePolicyModal = () => setPolicyType(null);
  const policyTitle = policyType === 'terms' ? 'Terms & Conditions' : 'Cookie Policy';
  const policySubtitle =
    policyType === 'terms'
      ? 'Live SkyborneDrop terms page shown in-app.'
      : 'Live SkyborneDrop cookie policy page shown in-app.';
  const policyUrl = policyType === 'terms' ? TERMS_URL : COOKIE_POLICY_URL;

  const initialValues: FormData = {
    firstName: formData.step2?.firstName || '',
    lastName: formData.step2?.lastName || '',
    email: formData.step2?.email || '',
    password: formData.step2?.password || '',
    agreeTerms: formData.step2?.agreeTerms || false,
  };

  const onSubmit = async (
    data: FormData,
    { setSubmitting }: FormikHelpers<FormData>,
  ) => {
    try {
      updateStepData('step2', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        agreeTerms: data.agreeTerms,
        authProvider: 'email',
      });

      setCurrentStep(3);
      navigation.navigate('OTP', { email: data.email });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* APP BAR */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackArrowIcon style={{ marginHorizontal: 16 }} />
          </TouchableOpacity>

          <View style={styles.appBarCenter}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
            />
            <Text style={styles.appName}>Skyborne Drop</Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        <PolicyModal
          visible={policyType !== null}
          title={policyTitle}
          subtitle={policySubtitle}
          url={policyUrl}
          onClose={closePolicyModal}
        />

        {/* SCROLLABLE CONTENT */}
        <ScrollView 
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: 16 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              Create Your Skyborne Account
            </Text>

            <Formik<FormData>
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                setFieldValue,
                handleSubmit,
                isSubmitting,
              }) => (
                <View>
                  {/* First Name */}
                  <Text style={styles.label}>First Name*</Text>
                  <TextInput
                    value={values.firstName}
                    onChangeText={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    placeholder="Enter first name"
                  />
                  {touched.firstName && errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}

                  {/* Last Name */}
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    placeholder="Enter last name"
                  />
                  {touched.lastName && errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}

                  {/* Email */}
                  <Text style={styles.label}>Email Address*</Text>
                  <TextInput
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    placeholder="Enter email"
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  {/* Password */}
                  <Text style={styles.label}>Password*</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      secureTextEntry={!showPassword}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      placeholder="Enter password"
                      style={{ color: '#000000' }} 
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeIcon color="#494949" size={18} />
                      ) : (
                        <EyeOffIcon color="#494949" size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}

                  {/* Terms */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() =>
                      setFieldValue('agreeTerms', !values.agreeTerms)
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        values.agreeTerms && styles.checkboxChecked,
                      ]}
                    >
                      {values.agreeTerms && (
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      )}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to Skyborne's{' '}
                      <Text
                        style={styles.link}
                        onPress={() => setPolicyType('terms')}
                      >
                        Terms
                      </Text>{' '}
                      and{' '}
                      <Text
                        style={styles.link}
                        onPress={() => setPolicyType('cookies')}
                      >
                        Cookie Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>
                  {touched.agreeTerms && errors.agreeTerms && (
                    <Text style={styles.termsErrorText}>{errors.agreeTerms}</Text>
                  )}

                  {/* CTA */}
                  <Button
                    title={isSubmitting ? 'Loading...' : 'Signup'}
                    onPress={() => handleSubmit()}
                  />

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>
                      Already have an account?{' '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Login')}
                    >
                      <Text style={styles.loginLink}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
  },
  backBtn: {
    width: 32,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#3A3A3A',
  },
  appBarCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 52,
    resizeMode: 'contain',
    marginRight: 6,
  },
  appName: {
    fontSize: 15,
    color: '#3A3A3A',
    fontFamily: FontFamilies.SatoshiMedium,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: '#494949',
    marginBottom: 8,
    fontFamily: FontFamilies.SatoshiBold,
  },
  label: {
    fontSize: 14,
    color: '#494949',
    marginBottom: 6,
    marginTop: 8,
    fontFamily: FontFamilies.SatoshiMedium,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -11 }],
    zIndex: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'solid',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#B5647E',
    borderColor: '#B5647E',
  },
  termsText: {
    fontSize: 13,
    color: '#0A0A0A',
    fontFamily: FontFamilies.SatoshiMedium,
  },
  link: {
    color: '#B95E82',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6,
  },
  termsErrorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#0A0A0A',
    fontFamily: FontFamilies.SatoshiRegular,
  },
  loginLink: {
    fontSize: 14,
    color: '#B95E82',
    fontFamily: FontFamilies.SatoshiMedium,
  },
});
