import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { Country, State } from 'country-state-city';
import * as ct from 'countries-and-timezones';
import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { useAuthViewModel } from '../../viewmodels/useAuthViewModel';
import { useOnboardingStore } from '../../store/onboardingSlice';
import { RootState } from '../../store';
import Toast from 'react-native-toast-message';
import { useSignup } from '../../store/SignupContext';
import { IconImages } from '../../assets/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getDialingCodeByIso = (isoCode?: string | null): string | null => {
  if (!isoCode) {
    return null;
  }

  try {
    return `+${getCountryCallingCode(isoCode.toUpperCase() as CountryCode)}`;
  } catch {
    return null;
  }
};

const normalizePhoneByCountry = (
  isoCode: string,
  phoneInput: string,
): { phoneNumber: string; phoneCountryCode: string; nationalNumber: string } | null => {
  const normalizedIso = isoCode.toUpperCase() as CountryCode;
  const raw = phoneInput.trim();
  const parsed = parsePhoneNumberFromString(raw, normalizedIso);

  if (!parsed || !parsed.isValid()) {
    return null;
  }

  return {
    phoneNumber: parsed.number,
    phoneCountryCode: `+${parsed.countryCallingCode}`,
    nationalNumber: parsed.nationalNumber,
  };
};

type CountryOption = {
  name: string;
  code: string;
};

const COUNTRY_OPTIONS: CountryOption[] = Country.getAllCountries().map(
  (country) => ({
    name: country.name,
    code: country.isoCode,
  }),
);

type DropdownInputProps = {
  label: string;
  value: string | null;
  placeholder: string;
};

const DropdownInput = ({ label, value, placeholder }: DropdownInputProps) => (
  <View>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity style={styles.dropdownInput}>
      <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
        {value || placeholder}
      </Text>
      <Image
        source={IconImages?.downArrow}
        style={styles.dropdownIcon}
      />
    </TouchableOpacity>
  </View>
);

const OnboardingLocationScreen = ({ navigation }: { navigation: any }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { signup } = useAuthViewModel();
  const authState = useSelector((state: RootState) => state.auth);

  // Zustand store for onboarding data
  const { inspiration, firstGoal, fitnessLevel, habits } = useOnboardingStore();

  // Get signup form data from Redux or context
  const tempUserId = authState.tempUserId;
  const phone = authState.phone;
  const { formData } = useSignup();
  const authProvider = formData?.step2?.authProvider || 'email';
  const isPrefillProviderFlow = authProvider === 'google' || authProvider === 'apple';
  const countries = COUNTRY_OPTIONS;
  const [selectedCountry, setSelectedCountry] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState(
    phone || formData?.step3?.phoneNumber || '',
  );
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string | null>(null);
  const [showPhoneCountryCodeDropdown, setShowPhoneCountryCodeDropdown] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timezones = selectedCountry
    ? ct.getTimezonesForCountry(selectedCountry.code)
    : [];

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.code)
    : [];

  const selectedCountryDialingCode = getDialingCodeByIso(selectedCountry?.code);

  const phoneCountryCodeOption = selectedCountry
    ? `${selectedCountry.name} (${selectedCountryDialingCode || selectedCountry.code})`
    : null;

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    Toast.show({
      type,
      text1:
        type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  };

  useEffect(() => {
    console.log('[OnboardingLocation] Screen loaded with signup context:', {
      authProvider,
      tempUserIdFromAuth: tempUserId,
      tempUserIdFromContext: formData?.step4?.tempUserId,
      phoneFromAuth: phone,
      phoneFromContext: formData?.step3?.phoneNumber,
      email: formData?.step2?.email,
      googleId: formData?.step2?.googleId,
      hasCountrySelected: !!selectedCountry,
      hasTimezoneSelected: !!timezone,
      phoneCountryCode,
      phoneNumberInput,
    });
  }, [
    authProvider,
    formData?.step2?.email,
    formData?.step2?.googleId,
    formData?.step3?.phoneNumber,
    formData?.step4?.tempUserId,
    phone,
    phoneCountryCode,
    phoneNumberInput,
    selectedCountry,
    tempUserId,
    timezone,
  ]);

  useEffect(() => {
    if (!selectedCountry) {
      setPhoneCountryCode(null);
      setShowPhoneCountryCodeDropdown(false);
      return;
    }

    setPhoneCountryCode(getDialingCodeByIso(selectedCountry.code));
  }, [selectedCountry]);

  const handleCompleteProfile = async () => {
    const resolvedAuthProvider = authProvider;
    const resolvedPassword = (formData?.step2?.password || '').trim();

    console.log('[OnboardingLocation] Complete Profile tapped:', {
      authProvider,
      resolvedAuthProvider,
      hasPassword: !!resolvedPassword,
      passwordLength: resolvedPassword.length,
      tempUserIdFromAuth: tempUserId,
      tempUserIdFromContext: formData?.step4?.tempUserId,
      selectedCountry,
      timezone,
      phoneCountryCode,
      phoneNumberInput,
    });

    // Validation
    if (!selectedCountry) {
      showToast('Please select a country', 'error');
      return;
    }
    if (!stateName.trim()) {
      const stateMessage =
        stateOptions.length > 0 ? 'Please select a state' : 'Please enter state';
      showToast(stateMessage, 'error');
      return;
    }
    if (!city.trim()) {
      showToast('Please enter city', 'error');
      return;
    }
    if (!timezone) {
      showToast('Please select a timezone', 'error');
      return;
    }
    if (!phoneCountryCode) {
      showToast('Please select phone country code', 'error');
      return;
    }
    if (!phoneNumberInput.trim()) {
      showToast('Please enter phone number', 'error');
      return;
    }
    const normalizedPhone = normalizePhoneByCountry(
      selectedCountry.code,
      phoneNumberInput,
    );
    if (!normalizedPhone) {
      showToast('Please enter a valid phone number for selected country', 'error');
      return;
    }
    if (!isPrefillProviderFlow && !resolvedPassword) {
      showToast('Password is required. Please set it in signup step.', 'error');
      return;
    }
    if (!isPrefillProviderFlow && resolvedPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    const resolvedTempUserId = tempUserId || formData?.step4?.tempUserId;
    if (!resolvedTempUserId) {
      showToast('Invalid session. Please restart signup.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare the complete signup payload
      const signupPayload = {
        tempUserId: resolvedTempUserId,
        phoneNumber: normalizedPhone.phoneNumber,
        phone: normalizedPhone.phoneNumber,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        state: stateName.trim(),
        city: city.trim(),
        phoneCountryCode: normalizedPhone.phoneCountryCode,
        timezone,
        firstName: (formData?.step2?.firstName || '').trim(),
        lastName: (formData?.step2?.lastName || '').trim(),
        email: (formData?.step2?.email || '').trim(),
        ...(isPrefillProviderFlow ? {} : { password: resolvedPassword }),
        authProvider: resolvedAuthProvider,
        googleId:
          resolvedAuthProvider === 'google' ? formData?.step2?.googleId : '',
        appleId:
          resolvedAuthProvider === 'apple' ? formData?.step2?.appleId : '',
        // Onboarding data from Zustand store
        motivation: inspiration,
        goal: firstGoal,
        fitnessLevel: fitnessLevel ? Number(fitnessLevel) : null,
        habits: habits
          ? {
              waterIntake: habits.waterIntake
                ? Number(habits.waterIntake)
                : null,
              sleepQuality: habits.sleepQuality
                ? Number(habits.sleepQuality)
                : null,
              exerciseFrequency: habits.exerciseFrequency
                ? Number(habits.exerciseFrequency)
                : null,
            }
          : {
              waterIntake: null,
              sleepQuality: null,
              exerciseFrequency: null,
            },
      };

      console.log('[OnboardingLocation] Final signup payload:', signupPayload);

      // Call signup API
      const response = await signup(signupPayload);

      if (response?.success || response?.data) {
        // API was successful
        const { user, accessToken, refreshToken } = response?.data || response;

        // Store tokens and user data
        // This depends on your AsyncStorage setup
        // You can also dispatch Redux actions here if needed

        showToast('Profile completed successfully!', 'success');

        // Navigate to next screen or dashboard
        setTimeout(() => {
          navigation.navigate('Pricing'); // or your home screen
        }, 500);
      } else {
        showToast(response?.message || 'Failed to complete profile', 'error');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast(error?.message || 'An error occurred during signup', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Where are you located?</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <View style={{ position: 'relative' }}>
                <Text style={[styles.fieldLabel, styles.selectCountryLabel]}>
                  Select Country
                </Text>

                <TouchableOpacity
                  style={styles.dropdownInput}
                  onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <Text
                    style={
                      selectedCountry
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {selectedCountry
                      ? `${selectedCountry.name} (${selectedCountry.code})`
                      : 'Select an option'}
                  </Text>

                  <Image
                    source={IconImages?.downArrow}
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>

                {showCountryDropdown && (
                  <View style={styles.countryDropdown}>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      {countries.map(item => (
                        <TouchableOpacity
                          key={item.code}
                          style={styles.countryItem}
                          onPress={() => {
                            setSelectedCountry(item);
                            setTimezone(null);
                            setStateName('');
                            setShowStateDropdown(false);
                            setShowTimezoneDropdown(false);
                            setShowCountryDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownText}>
                            {item.name} ({item.code})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={{ height: 18 }} />

              <View style={{ marginTop: 14, position: 'relative' }}>
                <Text style={styles.fieldLabel}>State</Text>

                {selectedCountry ? (
                  stateOptions.length > 0 ? (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownInput}
                        onPress={() =>
                          setShowStateDropdown(!showStateDropdown)
                        }
                      >
                        <Text
                          style={
                            stateName
                              ? styles.dropdownText
                              : styles.dropdownPlaceholder
                          }
                        >
                          {stateName || 'Select an option'}
                        </Text>
                        <Image
                          source={IconImages?.downArrow}
                          style={styles.dropdownIcon}
                        />
                      </TouchableOpacity>

                      {showStateDropdown && (
                        <View style={styles.stateDropdown}>
                          <ScrollView
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                          >
                            {stateOptions.map(state => (
                              <TouchableOpacity
                                key={`${state.isoCode}-${state.name}`}
                                style={styles.countryItem}
                                onPress={() => {
                                  setStateName(state.name);
                                  setShowStateDropdown(false);
                                }}
                              >
                                <Text style={styles.dropdownText}>
                                  {state.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  ) : (
                    <TextInput
                      style={styles.textFieldInput}
                      value={stateName}
                      onChangeText={setStateName}
                      placeholder="Enter state"
                      placeholderTextColor="#000000B2"
                    />
                  )
                ) : (
                  <TouchableOpacity
                    style={[styles.dropdownInput, styles.dropdownInputDisabled]}
                    disabled
                  >
                    <Text style={styles.dropdownPlaceholder}>
                      Select a country first
                    </Text>
                    <Image
                      source={IconImages?.downArrow}
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ marginTop: 20 }}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textFieldInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor="#000000B2"
                />
              </View>

              <View style={{ marginTop: 20, position: 'relative' }}>
                <Text
                  style={[styles.fieldLabel, styles.phoneFieldLabel]}
                  numberOfLines={1}
                >
                  Phone Number
                </Text>

                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={[
                      styles.phoneCodeInput,
                      !selectedCountry && styles.dropdownInputDisabled,
                    ]}
                    onPress={() =>
                      setShowPhoneCountryCodeDropdown(!showPhoneCountryCodeDropdown)
                    }
                    disabled={!selectedCountry}
                  >
                    <Text
                      style={
                        phoneCountryCode
                          ? styles.dropdownText
                          : styles.dropdownPlaceholder
                      }
                    >
                      {phoneCountryCode || '+Code'}
                    </Text>

                    <Image
                      source={IconImages?.downArrow}
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.phoneNumberInput}
                    value={phoneNumberInput}
                    onChangeText={setPhoneNumberInput}
                    placeholder="Enter phone number"
                    placeholderTextColor="#000000B2"
                    keyboardType="phone-pad"
                    maxLength={16}
                  />
                </View>

                {showPhoneCountryCodeDropdown && phoneCountryCodeOption && (
                  <View style={styles.phoneCodeDropdown}>
                    <TouchableOpacity
                      style={styles.countryItem}
                      onPress={() => {
                        setPhoneCountryCode(getDialingCodeByIso(selectedCountry?.code));
                        setShowPhoneCountryCodeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{phoneCountryCodeOption}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View
                style={{
                  marginTop: 20,
                  position: 'relative',
                  zIndex: showTimezoneDropdown ? 50 : 1,
                }}
              >
                <Text style={styles.fieldLabel}>Timezone</Text>

                <TouchableOpacity
                  style={[
                    styles.dropdownInput,
                    !selectedCountry && styles.dropdownInputDisabled,
                  ]}
                  onPress={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  disabled={!selectedCountry}
                >
                  <Text
                    style={
                      timezone
                        ? styles.dropdownText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {timezone || 'Select an option'}
                  </Text>

                  <Image
                    source={IconImages?.downArrow}
                    style={styles.dropdownIcon}
                  />
                </TouchableOpacity>

                {showTimezoneDropdown && timezones!.length > 0 && (
                  <View style={styles.timezoneDropdown}>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {timezones!.map(tz => (
                        <TouchableOpacity
                          key={tz.name}
                          style={styles.countryItem}
                          onPress={() => {
                            setTimezone(`${tz.name} (${tz.utcOffsetStr})`);
                            setShowTimezoneDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownText}>
                            {tz.name} ({tz.utcOffsetStr})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.ctaButtonContainer,
              { paddingBottom: 16 + insets.bottom },
            ]}
          >
            <Button
              title={isLoading ? 'Completing...' : 'Complete Profile'}
              onPress={handleCompleteProfile}
              disabled={isLoading}
            />
            {isLoading && (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
      <Toast />
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
    // paddingTop: 16,
    // paddingBottom: 24,
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
    maxWidth: 263,
  },
  titleContainer: {
    position: 'absolute',
    left: 70,
    top: 70,
    height: 66,
    width: 263,
    alignItems: 'center',
  },
  formSection: {
    marginTop: 68,
    overflow: 'visible',
  },
  formScrollContent: {
    paddingBottom: 140,
  },
  fieldLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 18,
    color: '#494949',
    textAlign: 'left',
    width: 111,
  },
  selectCountryLabel: {
    width: 'auto',
  },
  phoneFieldLabel: {
    width: 'auto',
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  textFieldInput: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    marginTop: 12,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 15.4,
    color: '#000000B2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  phoneCodeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 120,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  phoneNumberInput: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    paddingHorizontal: 16,
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 15.4,
    color: '#000000B2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  dropdownInputDisabled: {
    // opacity: 0.5,
  },
  dropdownText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 15.4,
    color: '#000000B2',
  },
  dropdownPlaceholder: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 15.4,
    color: '#000000B2',
  },
  dropdownIcon: {
    width: 18,
    height: 18,
    tintColor: '#8A95A5',
  },
  ctaButtonContainer: {
    marginTop: 40,
    paddingBottom: 24,
  },
  countryDropdown: {
    position: 'absolute',
    top: 78,
    maxHeight: 180,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  stateDropdown: {
    position: 'absolute',
    top: 78,
    maxHeight: 180,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  timezoneDropdown: {
    position: 'absolute',
    top: 78,
    width: '100%',
    left: 0,
    maxHeight: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    zIndex: 200,
  },
  phoneCodeDropdown: {
    position: 'absolute',
    top: 78,
    width: 120,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3,
  },
  countryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
});

export default OnboardingLocationScreen;
