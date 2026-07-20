import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ChevronLeft, ArrowLeft } from 'lucide-react-native';
import TextInput from '../../components/TextInput';
import Button from '../../components/Button';
import { Country, State } from 'country-state-city';
import { FontFamilies } from '../../constants/fonts';
import GradientBackground from '../../components/GradientBackground';
import { Images } from '../../assets/images';
import { IconImages } from '../../assets/icons';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';


type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const ALL_COUNTRIES = Country.getAllCountries();
const COUNTRY_OPTIONS = ALL_COUNTRIES.map((country) => ({
  name: country.name,
  code: country.isoCode,
}));
const COUNTRY_NAME_BY_CODE = new Map(
  ALL_COUNTRIES.map((country) => [country.isoCode, country.name]),
);
const COUNTRY_CODE_BY_NAME = new Map(
  ALL_COUNTRIES.map((country) => [country.name.toLowerCase(), country.isoCode]),
);

const resolveCountryCode = (value: string, fallback = '') => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return COUNTRY_CODE_BY_NAME.get(trimmed.toLowerCase()) || fallback || '';
};

const resolveCountryName = (value: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[a-z]{2}$/i.test(trimmed)) {
    return COUNTRY_NAME_BY_CODE.get(trimmed.toUpperCase()) || trimmed;
  }
  return trimmed;
};

const EditProfileScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  // Initialize with user data - replace with actual user data from your store/context
  // const [firstName, setFirstName] = useState(user?.firstName ?? '');
  // const [lastName, setLastName] = useState(user?.lastName ?? '');
  // const [email] = useState(user?.email ?? '');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);


  const { user, loadProfile, updateProfile } :any= useProfileViewModel();

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    city: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCountryCode = /^[a-z]{2}$/i.test(country.trim())
    ? country.trim().toUpperCase()
    : '';
  const stateOptions = normalizedCountryCode
    ? State.getStatesOfCountry(normalizedCountryCode)
    : [];

  const validateForm = () => {
    let isValid = true;
    const newErrors = { firstName: '', lastName: '', city: '' };

    // Validate First Name
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    // Validate Last Name (optional but if provided, should be valid)
    if (lastName.trim() && lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    // Validate City
    if (!city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.trim(),
      state: stateName.trim(),
      city: city.trim(),
    };

    setIsSubmitting(true);
    try {
      const res = await updateProfile(payload);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      const resolvedCountryCode = resolveCountryCode(
        user.country ?? '',
        user.countryCode ?? '',
      );

      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setCountry(resolvedCountryCode || user.country || '');
      setStateName(user.state ?? '');
      setCity(user.city ?? '');
    }
  }, [user]);


  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#494949" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 120 + insets.bottom },
            ]}
          >
            {/* Profile Image Section */}
            {/* <View style={styles.profileImageSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={user?.profileImage ? { uri: user.profileImage } : Images.emailIcon }
                  style={styles.avatar}
                />
                <TouchableOpacity style={styles.cameraButton}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </View> */}

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name*</Text>
                <TextInput
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) {
                      setErrors({ ...errors, firstName: '' });
                    }
                  }}
                  placeholder="Enter first name"
                  editable={!isSubmitting}
                />
                {errors.firstName ? (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                ) : null}
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) {
                      setErrors({ ...errors, lastName: '' });
                    }
                  }}
                  placeholder="Enter last name"
                  editable={!isSubmitting}
                />
                {errors.lastName ? (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                ) : null}
              </View>

              {/* Country */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country</Text>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.dropdownInput}
                    onPress={() =>
                      setShowCountryDropdown(!showCountryDropdown)
                    }
                    disabled={isSubmitting}
                  >
                    <Text
                      style={
                        country ? styles.dropdownText : styles.dropdownPlaceholder
                      }
                    >
                      {country ? resolveCountryName(country) : 'Select an option'}
                    </Text>
                    <Image
                      source={IconImages?.downArrow}
                      style={styles.dropdownIcon}
                    />
                  </TouchableOpacity>

                  {showCountryDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                      >
                        {COUNTRY_OPTIONS.map(item => (
                          <TouchableOpacity
                            key={item.code}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setCountry(item.code);
                              setStateName('');
                              setShowStateDropdown(false);
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
              </View>

              {/* State */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>State</Text>
                <View style={{ position: 'relative' }}>
                  {country ? (
                    stateOptions.length > 0 ? (
                      <>
                        <TouchableOpacity
                          style={styles.dropdownInput}
                          onPress={() =>
                            setShowStateDropdown(!showStateDropdown)
                          }
                          disabled={isSubmitting}
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
                          <View style={styles.dropdownList}>
                            <ScrollView
                              showsVerticalScrollIndicator={false}
                              nestedScrollEnabled
                            >
                              {stateOptions.map(state => (
                                <TouchableOpacity
                                  key={`${state.isoCode}-${state.name}`}
                                  style={styles.dropdownItem}
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
                        value={stateName}
                        onChangeText={setStateName}
                        placeholder="Enter state"
                        editable={!isSubmitting}
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
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City*</Text>
                <TextInput
                  value={city}
                  onChangeText={(text) => {
                    setCity(text);
                    if (errors.city) {
                      setErrors({ ...errors, city: '' });
                    }
                  }}
                  placeholder="Enter city"
                  editable={!isSubmitting}
                />
                {errors.city ? (
                  <Text style={styles.errorText}>{errors.city}</Text>
                ) : null}
              </View>

              {/* Email (Not Editable) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.disabledInputContainer}>
                  <TextInput
                    value={user?.email ?? ''} 
                    editable={false}
                    style={styles.disabledInput}
                  />
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockIcon}>🔒</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  Email cannot be changed for security reasons
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <View style={[styles.buttonContainer, { marginBottom: 24 + insets.bottom }]}>
              <Button
                title={isSubmitting ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                disabled={isSubmitting}
              />
            </View>
          </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamilies.SatoshiBold,
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#B95E82',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIcon: {
    fontSize: 16,
  },
  changePhotoText: {
    fontFamily: FontFamilies.SatoshiMedium,
    fontSize: 14,
    color: '#B95E82',
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#494949',
    marginBottom: 8,
    fontFamily: FontFamilies.SatoshiMedium,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#FFFFFF',
  },
  dropdownInputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  dropdownText: {
    fontSize: 14,
    color: '#494949',
    fontFamily: FontFamilies.SatoshiMedium,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: FontFamilies.SatoshiMedium,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#8A95A5',
  },
  dropdownList: {
    position: 'absolute',
    top: 50,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  disabledInputContainer: {
    position: 'relative',
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  lockBadge: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: FontFamilies.SatoshiRegular,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontFamily: FontFamilies.SatoshiRegular,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default EditProfileScreen;
