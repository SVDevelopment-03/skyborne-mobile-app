import React from 'react';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import LogoutModal from './../../components/LogoutModal';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircleMore } from 'lucide-react-native';
import { SvgUri } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { AllItems, ProfileImages } from '../../assets/images/profile';
import BottomNav from '../../components/BottomNav';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import { useState, useEffect } from 'react';
import { removeAuthToken } from '../../services/authService';
import { notificationHistoryService } from '../../services/notificationHistoryService';
import { clearAllAppCache } from '../../store/clearCache';
import { profileService } from '../../services/profileService';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../store/authSlice';

interface StatCard {
  id: number;
  value: string;
  label: string;
  backgroundColor: string;
  icon: ImageSourcePropType;
  iconSvgUri?: string;
}

interface ProgressItem {
  id: number;
  title: string;
  percentage: number;
  progress: number;
  current: number;
  total: number;
}

interface SettingItem {
  id: number;
  title: string;
  subtitle: string;
  icon?: ImageSourcePropType;
  iconSvgUri?: string;
  iconBgColor: string;
  screen?: keyof RootStackParamList;
}

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  type ProfileScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Profile'
  >;
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const dispatch = useDispatch();
  const COMMON_URL = 'https://skyborne-images.s3.ap-south-1.amazonaws.com';
  const usePngIcons = Platform.OS === 'ios';

  const { user, dashboardStats, loadProfile }: any = useProfileViewModel();
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const nameRef = React.useRef<View>(null);


  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await profileService.getPlans();
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (isMounted) setPlans(data);
      } catch {
        if (isMounted) setPlans([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate progress items dynamically from classCredits
  // Calculate progress items dynamically from classCredits based on plan
  // Calculate progress items dynamically from classCredits based on plan
  const getProgressItems = (): ProgressItem[] => {
    if (!user?.classCredits || !user?.plan) return [];

    const plan = user.plan.toLowerCase();
    const classNames = Object.keys(user.classCredits).filter(
      key => key !== '_id',
    );
    const items: ProgressItem[] = [];

    // Define which credit types to show based on plan
    let allowedCredits: string[] = [];

    if (plan === 'gold-yoga' || plan === 'gold-zumba' || plan === 'gold-mixed') {
      allowedCredits = ['yoga'];
    } else if (plan === 'diamond') {
      allowedCredits = ['yoga'];
    } else if (plan === 'platinum') {
      allowedCredits = ['yoga', 'specialty'];
    }

    // Filter and create progress items only for allowed credits
    classNames.forEach((className, index) => {
      // Only show if this credit type is allowed for the user's plan
      if (!allowedCredits.includes(className)) {
        return;
      }

      const remainingCredits = user.classCredits[className] ?? 0;
      const totalCredits = user.overAllclassCredits?.[className] ?? 0;

      // Calculate used credits (total - remaining)
      const usedCredits = totalCredits - remainingCredits;

      // Calculate percentage: (used / total) * 100
      const percentage =
        totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

      // Display name mapping
      let displayTitle = className.charAt(0).toUpperCase() + className.slice(1);
      // if (className === 'specialty') {
      //   displayTitle = 'Speciality'; // Map specialty to proper display name
      // }

      items.push({
        id: index + 1,
        title: displayTitle,
        percentage,
        progress: totalCredits > 0 ? usedCredits / totalCredits : 0,
        current: usedCredits,
        total: totalCredits,
      });
    });

    return items;
  };

  const progressItems = getProgressItems();

  const isNonEmptyString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

  const isNumericOnly = (value: string) => /^\d+$/.test(value.trim());
  const isLikelyId = (value: string) =>
    /^[a-f0-9]{24}$/i.test(value.trim()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    );
  const isLikelyBadName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (isNumericOnly(trimmed) || isLikelyId(trimmed)) return true;
    const digits = (trimmed.match(/\d/g) || []).length;
    if (trimmed.length >= 12 && digits / trimmed.length > 0.5) return true;
    if (/^[a-f0-9-]+$/i.test(trimmed) && trimmed.length >= 16) return true;
    return false;
  };

  const getDisplayName = (profile: any) => {
    const first = isNonEmptyString(profile?.firstName) ? profile.firstName.trim() : '';
    const last = isNonEmptyString(profile?.lastName) ? profile.lastName.trim() : '';
    const fullName = [first, last].filter(Boolean).join(' ');
    if (fullName && !isLikelyBadName(fullName)) {
      return fullName;
    }

    const name = isNonEmptyString(profile?.name) ? profile.name.trim() : '';
    if (name && !isLikelyBadName(name)) {
      return name;
    }

    const fullNameAlt = isNonEmptyString(profile?.fullName)
      ? profile.fullName.trim()
      : '';
    if (fullNameAlt && !isLikelyBadName(fullNameAlt)) {
      return fullNameAlt;
    }

    const fallbackFirst = first && !isLikelyBadName(first) ? first : '';
    const fallbackLast = last && !isLikelyBadName(last) ? last : '';
    const safeName = [fallbackFirst, fallbackLast].filter(Boolean).join(' ');
    if (safeName) {
      return safeName;
    }

    const username = isNonEmptyString(profile?.username) ? profile.username.trim() : '';
    if (username && !isLikelyBadName(username)) {
      return username;
    }

    const email = isNonEmptyString(profile?.email) ? profile.email.trim() : '';
    if (email) {
      return email.split('@')[0] || 'User';
    }

    return 'User';
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
    return `${first}${last}`.toUpperCase();
  };

  const displayName = getDisplayName(user);

  const getDisplayPlan = () => {
    const subStatus = String(user?.subscription?.status || '').toLowerCase();
    if (
      subStatus === 'cancelled' ||
      subStatus === 'inactive' ||
      subStatus === 'expired' ||
      subStatus === 'suspended'
    ) {
      return 'No Plan';
    }

    const dashboardPlan = dashboardStats?.data?.currentPlan;
    const fromDashboard =
      typeof dashboardPlan?.displayName === 'string' && dashboardPlan.displayName.trim().length > 0
        ? dashboardPlan.displayName.trim()
        : typeof dashboardPlan?.plan === 'string' && dashboardPlan.plan.trim().length > 0
          ? dashboardPlan.plan.trim()
          : '';

    if (fromDashboard && !isLikelyBadName(fromDashboard) && fromDashboard.toLowerCase() !== 'no plan') {
      return fromDashboard;
    }

    const rawPlan = typeof user?.plan === 'string' ? user.plan.trim() : '';
    if (rawPlan) {
      const normalizedRaw = rawPlan.toLowerCase();
      const fixedPlanMap: Record<string, string> = {
        'gold-yoga': 'Gold Yoga',
        'gold-zumba': 'Gold Yoga',
        'gold-mixed': 'Gold Yoga',
        diamond: 'Diamond',
        platinum: 'Platinum',
      };
      if (fixedPlanMap[normalizedRaw]) {
        return fixedPlanMap[normalizedRaw];
      }

      const match = plans.find((plan: any) => {
        const keys = [
          String(plan?.uuid || '').toLowerCase(),
          String(plan?.planId || '').toLowerCase(),
          String(plan?._id || '').toLowerCase(),
          String(plan?.name || '').toLowerCase().trim(),
        ].filter(Boolean);
        return keys.includes(normalizedRaw);
      });

      if (match?.name) {
        return String(match.name);
      }

      if (!isLikelyBadName(rawPlan)) {
        return rawPlan;
      }
    }

    return 'No Plan';
  };

  const displayPlan = getDisplayPlan();

  const statCards: StatCard[] = [
    {
      id: 1,
      value: String(dashboardStats?.data?.upcomingSessions ?? 0),
      label: 'Upcoming Session',
      backgroundColor: '#FFF7DD',
      icon: { uri: `${COMMON_URL}/laptop.png` },
      iconSvgUri: AllItems.laptopSvg,
    },

    {
      id: 2,
      value: String(dashboardStats?.data?.totalCredits ?? 0),
      label: 'Credits',
      backgroundColor: '#FFE8E8',
      icon: { uri: `${COMMON_URL}/sand.png` },
      iconSvgUri: AllItems.sandSvg,
    },
    {
      id: 3,
      value: String(dashboardStats?.data?.classesAttended ?? 0),
      label: 'Class Attended',
      backgroundColor: '#FFE8E8',
      icon: { uri: `${COMMON_URL}/fire.png` },
      iconSvgUri: AllItems.fireSvg,
    },
    {
      id: 4,
      value: displayPlan,
      label: 'Current Plan',
      backgroundColor: '#FFF7DD',
      icon: { uri: `${COMMON_URL}/badge.png` },
      iconSvgUri: AllItems.badgeSvg,
    },
  ];

  const settingItems: SettingItem[] = [
    {
      id: 1,
      title: 'Subscription',
      subtitle: displayPlan,
      icon: { uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/profile/SubscriptionIcon.png' },
      iconSvgUri: ProfileImages.subscriptionIconSvg,
      iconBgColor: '#FFE8E8',
      screen: 'ManageSubscription',
    },
    {
      id: 2,
      title: 'History',
      subtitle: 'View past Sessions',
      icon: { uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/profile/HistoryIcon.png' },
      iconSvgUri: ProfileImages.historyIconSvg,
      iconBgColor: '#FFE8E8',
      screen: 'SessionHistory',
    },
    {
      id: 3,
      title: 'Feedback',
      subtitle: 'Give us your feedback',
      iconBgColor: '#FFE8E8',
      screen: 'Feedback',
    },
    {
      id: 4,
      title: 'Support',
      subtitle: 'Get help',
      icon: { uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/profile/Support.png' },
      iconSvgUri: ProfileImages.supportIconSvg,
      iconBgColor: '#FFE8E8',
      screen: 'Support',
    },
    {
      id: 5,
      title: 'My Orders',
      subtitle: 'Track your orders',
      icon: { uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/profile/HistoryIcon.png' },
      iconSvgUri: ProfileImages.historyIconSvg,
      iconBgColor: '#FFE8E8',
      screen: 'MyOrders',
    },
  ];

  const handleLogout = () => {
    setShowLogout(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const openSupportLink = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }

      Alert.alert('Unable to open link', url);
    } catch (error) {
      console.error('Failed to open support link:', error);
      Alert.alert('Unable to open link', url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 160 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                style={styles.backIcon}
                source={ProfileImages.ArrowIcon1}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(displayName)}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Pressable
              ref={nameRef}
              onPress={() => {
                if (displayName.length > 20) {
                  nameRef.current?.measureInWindow((x, y, width, height) => {
                    setTooltipAnchor({ x, y, width, height });
                    setShowNameTooltip(true);
                  });
                }
              }}
              onLongPress={() => {
                if (displayName.length > 20) {
                  nameRef.current?.measureInWindow((x, y, width, height) => {
                    setTooltipAnchor({ x, y, width, height });
                    setShowNameTooltip(true);
                  });
                }
              }}
            >
              <Text
                style={styles.profileName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displayName}
              </Text>
            </Pressable>
            <View style={styles.profileMetaRow}>
              <View style={styles.premiumBadgeInline}>
                <Text style={styles.premiumText}>{displayPlan}</Text>
              </View>
              <Text style={styles.profileSince}>
                since{' '}
                {user?.createdAt ? new Date(user.createdAt).getFullYear() : '--'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Image style={styles.editIcon} source={ProfileImages.pencilIcon} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View
              key={stat.id}
              style={[
                styles.statCard,
                { backgroundColor: stat.backgroundColor },
                index % 2 === 0 ? styles.statCardLeft : styles.statCardRight,
              ]}
            >
              {!usePngIcons && stat.iconSvgUri ? (
                <SvgUri width={30} height={30} uri={stat.iconSvgUri} />
              ) : (
                <Image source={stat?.icon} style={styles.statIcon} />
              )}
              <Text
                style={[
                  styles.statValue,
                  stat.label === 'Current Plan' && styles.planStatValue,
                ]}
              >
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Current Progress Section */}
       {/* Current Progress Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Progress</Text>
        </View>

        {progressItems.length > 0 ? (
          <View style={styles.progressList}>
            {progressItems.map(item => (
              <View key={item.id} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>{item.title}</Text>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressCredits}>
                      {item.current}/{item.total}
                    </Text>
                    <Text style={styles.progressPercentage}>
                      {item.percentage}%
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <LinearGradient
                    colors={['#B95E82', '#F39F9F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBar, { width: `${item.percentage}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyProgressContainer}>
            <Text style={styles.emptyProgressText}>
              No progress data available for your current plan
            </Text>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          {settingItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen as any);
                  }
                }}
              >
                <View
                  style={[
                    styles.settingIconContainer,
                    { backgroundColor: item.iconBgColor },
                  ]}
                >
                  {item.id === 3 ? (
                    <MessageCircleMore size={22} color="#B95E82" />
                  ) : !usePngIcons && item.iconSvgUri ? (
                    <SvgUri width={24} height={24} uri={item.iconSvgUri} />
                  ) : (
                    <Image source={item.icon} style={styles.settingIcon} />
                  )}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                </View>
                <Image source={ProfileImages.ArrowIcon2} style={styles.rightArrow} />
              </TouchableOpacity>
              {index < settingItems.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>


      </ScrollView>
      {showLogout && (
        <LogoutModal
          visible={showLogout}
          onClose={() => setShowLogout(false)}
          onConfirm={async () => {
            await clearAllAppCache();
            await removeAuthToken();
            dispatch(logoutAction());
            setShowLogout(false);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            );
          }}
        />
      )}
      <Modal
        visible={showDeleteAccount}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteAccount(false)}
      >
        <View style={styles.deleteAccountOverlay}>
          <View style={styles.deleteAccountCard}>
            <Text style={styles.deleteAccountTitle}>Delete Account</Text>
            <Text style={styles.deleteAccountMessage}>
              Deleting your account will send a deletion request to the admin for review and approval. Once approved, your profile and all associated data will be permanently removed from our services. This action cannot be undone.

              If you would like to proceed, tap "Delete" below. You may also use the website link to complete the deletion process if preferred.
            </Text>
            <Text
              style={styles.deleteAccountLink}
              onPress={() => openSupportLink('https://skybornedrop.com')}
            >
              https://skybornedrop.com
            </Text>

            <View style={styles.deleteAccountActions}>
              <TouchableOpacity
                style={styles.deleteAccountPrimaryButton}
                onPress={async () => {
                  try {
                    const res = await profileService.deleteAccount();
                    setShowDeleteAccount(false);
                    if (res && res.data && res.data.success) {
                      const requestStatus = res.data?.data?.status;
                      if (requestStatus === 'requested') {
                        Alert.alert(
                          'Deletion requested',
                          'Your account deletion request has been submitted successfully. The admin team will review and process your request shortly.',
                        );
                        return;
                      }

                      await clearAllAppCache();
                      await removeAuthToken();
                      dispatch(logoutAction());
                      navigation.dispatch(
                        CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
                      );
                      Alert.alert('Account deleted', 'Your account has been deleted.');
                      return;
                    }
                    // If backend does not return structured success, assume success on 2xx
                    if (res && res.status && res.status >= 200 && res.status < 300) {
                      Alert.alert(
                        'Deletion requested',
                        'Your account deletion request is pending admin review.',
                      );
                      return;
                    }
                    Alert.alert('Unable to delete', 'Could not delete account. Please try the website link.');
                  } catch (error) {
                    console.error('Delete account failed', error);
                    Alert.alert('Unable to delete', 'Could not delete account. Please try the website link.');
                  }
                }}
              >
                <Text style={styles.deleteAccountPrimaryButtonText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteAccountCancelButton}
              onPress={() => setShowDeleteAccount(false)}
            >
              <Text style={styles.deleteAccountCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showNameTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameTooltip(false)}
      >
        <Pressable
          style={styles.tooltipBackdrop}
          onPress={() => setShowNameTooltip(false)}
        >
          {tooltipAnchor && (
            <View
              style={[
                styles.tooltipCard,
                {
                  position: 'absolute',
                  left: Math.max(
                    12,
                    Math.min(
                      tooltipAnchor.x + tooltipAnchor.width / 2 - tooltipSize.width / 2,
                      Dimensions.get('window').width - tooltipSize.width - 12,
                    ),
                  ),
                  top: Math.max(12, tooltipAnchor.y - tooltipSize.height - 8),
                },
              ]}
              onLayout={event => {
                const { width, height } = event.nativeEvent.layout;
                if (
                  width !== tooltipSize.width ||
                  height !== tooltipSize.height
                ) {
                  setTooltipSize({ width, height });
                }
              }}
            >
              <Text style={styles.tooltipText}>{displayName}</Text>
            </View>
          )}
        </Pressable>
      </Modal>
      <BottomNav active="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 39,
  },
  avatar: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 28,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    marginLeft: 15,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 30,
    height: 92,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    lineHeight: 21,
    color: '#494949',
    marginBottom: 3,
  },
  tooltipBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  tooltipText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 18,
    color: '#494949',
    textAlign: 'center',
  },
  profileSince: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#050505',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  premiumBadgeInline: {
    height: 24.45,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(185, 94, 130, 0.3)',
    borderRadius: 39.12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#B95E82',
    textAlign: 'center',
  },
  editButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 35,
  },
  editIcon: {
    width: 18,
    height: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  statCard: {
    width: '48%',
    height: 133,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 19,
    marginBottom: 15,
  },
  statCardLeft: {
    marginRight: '4%',
  },
  statCardRight: {
    marginLeft: 0,
  },
  statIcon: {
    width: 28,
    height: 28,
    marginBottom: 15,
  },
  statValue: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 25,
    lineHeight: 28,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 5,
  },
  planStatValue: {
    fontSize: 16,
    lineHeight: 20,
  },
  statLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 19,
    color: '#000000',
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
  },
  progressList: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  progressCard: {
    height: 92,
    backgroundColor: '#FFE8E8',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 18,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  progressTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 18,
    lineHeight: 28,
    color: '#000000',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressCredits: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
  },
  progressPercentage: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 9,
    backgroundColor: '#C9C9C9',
    borderRadius: 39.12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 39.12,
  },
  emptyProgressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 30,
    marginBottom: 40,
    alignItems: 'center',
  },
  emptyProgressText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(5, 5, 5, 0.5)',
    textAlign: 'center',
  },
  sessionList: {
    paddingHorizontal: 16,
    marginBottom: 46,
  },
  settingsContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 17.52,
    paddingHorizontal: 22,
    paddingVertical: 23,
    marginBottom: 44,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
  },
  settingIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIcon: {
    width: 24,
    height: 24,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.01,
    color: '#494949',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(5, 5, 5, 0.5)',
  },
  rightArrow: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    opacity: 0.6,
  },
  settingArrow: {
    width: 17.52,
    height: 17.52,
  },
  divider: {
    height: 1,
    backgroundColor: '#494949',
    opacity: 0.1,
    marginTop: 15,
    marginBottom: 20,
  },
  logoutButton: {
    marginHorizontal: 22,
    height: 54.3,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  deleteAccountButton: {
    marginHorizontal: 22,
    height: 54.3,
    backgroundColor: '#FFF5F5',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F2C1C1',
  },
  deleteAccountText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#C23B3B',
    textAlign: 'center',
  },
  deleteAccountOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  deleteAccountTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
    marginBottom: 12,
  },
  deleteAccountMessage: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  deleteAccountLink: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: '#B95E82',
    marginBottom: 6,
  },
  deleteAccountActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionGap: {
    marginRight: 10,
  },
  deleteAccountSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
  },
  deleteAccountSecondaryButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#494949',
  },
  deleteAccountPrimaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#B95E82',
  },
  deleteAccountPrimaryButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  deleteAccountEmailButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F2C1C1',
  },
  deleteAccountEmailButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 15,
    color: '#C23B3B',
  },
  deleteAccountCancelButton: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteAccountCancelText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    color: '#6B6B6B',
  },
});

export default ProfileScreen;
