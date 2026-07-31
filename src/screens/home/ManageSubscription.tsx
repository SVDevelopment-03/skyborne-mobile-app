import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SubscriptionImages } from '../../assets/images/subscriptions';
import { useProfileViewModel } from '../../viewmodels/useProfileViewModel';
import { useState, useEffect } from 'react';
import { useBillingViewModel } from '../../viewmodels/useBillingViewModel';
import {
  createCardPortalSession,
  getStoredPaymentDetails,
  verifyPayment,
} from '../../services/paymentService';
import Toast from 'react-native-toast-message';

interface BillingInfo {
  label: string;
  value: string;
}

interface SettingOption {
  id: number;
  title: string;
  icon: ImageSourcePropType;
  iconSvgUri?: string;
  page?: string;
  onPress?: () => void;
}

const ManageSubscriptionsScreen = ({ navigation }: { navigation: any }) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isOpeningCardPortal, setIsOpeningCardPortal] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const {
    user,
    loadProfile,
    requestCancellation,
    isRequestingCancellation,
  }: any = useProfileViewModel();
  const { subscription, paymentHistory, fetchSubscription, fetchHistory } =
    useBillingViewModel();

  const [billingInfo, setBillingInfo] = useState<BillingInfo[]>([]);

  useEffect(() => {
    const loadBilling = async () => {
      await fetchSubscription();
      await fetchHistory();
    };

    loadBilling();
  }, []);

  useEffect(() => {
    if (!subscription && paymentHistory.length === 0) return;

    const lastPayment = paymentHistory[0];

    const startDate = subscription?.startDate
      ? new Date(subscription.startDate)
      : lastPayment?.createdAt
      ? new Date(lastPayment.createdAt)
      : null;

    const nextBillingDate = subscription?.endDate
      ? new Date(subscription.endDate)
      : startDate
      ? new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 1),
        )
      : null;

    const info: BillingInfo[] = [];

    if (startDate) {
      info.push({
        label: 'Subscription start date',
        value: startDate.toDateString(),
      });
    }

    if (nextBillingDate) {
      info.push({
        label: 'Next billing date',
        value: nextBillingDate.toDateString(),
      });
    }

    if (lastPayment?.gateway) {
      info.push({
        label: 'Payment method',
        value: lastPayment.gateway.toUpperCase(),
      });
    }

    if (lastPayment?.amount) {
      info.push({
        label: 'Amount paid',
        value: `$${lastPayment.amount}`,
      });
    }

    if (lastPayment?.invoiceId || lastPayment?._id) {
      info.push({
        label: 'Invoice reference',
        value: lastPayment.invoiceId || lastPayment._id,
      });
    }

    setBillingInfo(info);
  }, [subscription, paymentHistory]);

  // total used credits logic
  const total = user?.totalClassCredits ?? 0;
  const used =
    total -
    ((user?.classCredits?.yoga ?? 0) +
      (user?.classCredits?.zumba ?? 0) +
      (user?.classCredits?.specialty ?? 0));
  const progressPercent = total > 0 ? (used / total) * 100 : 0;

  // const billingInfo: BillingInfo[] = [
  //   { label: 'Next billing date', value: 'Aug 15, 2026' },
  //   { label: 'Payment method', value: '*** **** **** 4319' },
  //   { label: 'Next billing date', value: 'Aug 15, 2026' },
  // ];

  // simple plan price mapping
  const planPrices: Record<string, number> = {
    'gold-yoga': 100,
    'gold-zumba': 100,
    'gold-mixed': 100,
    diamond: 200,
    platinum: 300,
  };

  const subscriptionStatus = String(user?.subscription?.status || '').toLowerCase();
  const isPlanActive =
    subscriptionStatus !== 'cancelled' &&
    subscriptionStatus !== 'inactive' &&
    subscriptionStatus !== 'expired' &&
    subscriptionStatus !== 'suspended';
  const canEditCard = subscriptionStatus === 'active';
  const displayPlan = isPlanActive
    ? user?.plan?.toUpperCase() ?? '--'
    : 'NO PLAN';

  const handleCancelSubscription = async () => {
    setIsCancelModalVisible(true);
  };

  const canSubmitCancelReason =
    cancelReason.trim().length >= 10 && cancelReason.trim().length <= 500;

  const handleSubmitCancellationRequest = async () => {
    if (!user?._id) {
      Toast.show({
        type: 'error',
        text1: 'Not authenticated',
        text2: 'Please login again.',
      });
      return;
    }

    if (!canSubmitCancelReason) {
      Toast.show({
        type: 'error',
        text1: 'Reason required',
        text2: 'Please enter at least 10 characters.',
      });
      return;
    }

    try {
      setIsCancelling(true);
      await requestCancellation(user._id, cancelReason.trim());
      Toast.show({
        type: 'success',
        text1: 'Request sent',
        text2: 'Cancellation request submitted successfully',
      });
      setIsCancelModalVisible(false);
      setCancelReason('');
      await Promise.all([loadProfile(), fetchSubscription(), fetchHistory()]);
    } catch (error: any) {
      console.error('Cancellation request error:', error);
      const errorMessage =
        error?.message ||
        error?.data?.message ||
        error?.response?.data?.message ||
        'Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Unable to request cancellation',
        text2: errorMessage,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateCard = async () => {
    if (isOpeningCardPortal) return;

    if (!canEditCard) {
      Toast.show({
        type: 'info',
        text1: 'No active subscription',
        text2: 'Update Card is available for active plans.',
      });
      return;
    }

    try {
      setIsOpeningCardPortal(true);
      const response = await createCardPortalSession();
      const portalUrl = response?.data?.url;

      if (!portalUrl) {
        Toast.show({
          type: 'error',
          text1: 'Unable to open Update Card',
          text2: 'No update link available.',
        });
        return;
      }

      await Linking.openURL(portalUrl);
    } catch (error: any) {
      console.error('Update card error:', error);
      Toast.show({
        type: 'error',
        text1: 'Unable to open Update Card',
        text2:
          error?.response?.data?.message ||
          error?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setIsOpeningCardPortal(false);
    }
  };

  const settingOptions: SettingOption[] = [
    {
      id: 1,
      title: 'Upgrade Plan',
      icon: SubscriptionImages.upgradeIcon,
      page: 'UpgradePlan',
    },
    ...(canEditCard
      ? [
          {
            id: 2,
            title: 'Update Card',
            icon: SubscriptionImages.paymentIcon,
            onPress: handleUpdateCard,
          },
        ]
      : []),
    {
      id: 3,
      title: 'Payment History',
      icon: SubscriptionImages.paymentIcon,
      page: 'PaymentHistory',
    },
    // {
    //   id: 2,
    //   title: 'Update payment method',
    //   icon: SubscriptionImages.paymentIcon,
    // },
    // {
    //   id: 4,
    //   title: 'View invoices',
    //   icon: SubscriptionImages.invoicesIcon,
    //   iconSvgUri: SubscriptionImages.invoicesIconSvg,
    // },
  ];

  // const [billingInfo, setBillingInfo] = useState<BillingInfo[]>([]);

  useEffect(() => {
    const loadBillingInfo = async () => {
      try {
        // 1. Get last orderRef
        const stored = await getStoredPaymentDetails();
        if (!stored?.orderRef) return;

        // 2. Verify payment
        const res = await verifyPayment(stored.orderRef);
        if (!res?.success || !res?.data) return;

        const payment = res.data;

        // 3. Dates calculate
        const startDate = new Date(payment.createdAt);
        const nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + 1);

        setBillingInfo([
          {
            label: 'Start date',
            value: startDate.toDateString(),
          },
          {
            label: 'Payment method',
            value: payment.gateway ? payment.gateway.toUpperCase() : 'Card',
          },
          {
            label: 'Next billing date',
            value: nextDate.toDateString(),
          },
        ]);
      } catch (e) {
        console.log('Billing info error');
      }
    };

    loadBillingInfo();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              style={styles.backIcon}
              source={SubscriptionImages.backwardIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Subscriptions</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current Plan Card */}
        <LinearGradient
          colors={['#B95E82', '#D17D9E']}
          style={styles.planCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Current plan</Text>
            <View style={styles.diamondBadge}>
              <Text style={styles.diamondText} numberOfLines={1} ellipsizeMode="tail">
                {displayPlan}
              </Text>
            </View>
          </View>

          <Text style={styles.planPrice}>
            {isPlanActive
              ? `$${planPrices[user?.plan?.toLowerCase() ?? '']}/month`
              : '—'}
          </Text>

          <View style={styles.planFeatures}>
            <View style={styles.featureItem}>
              <Image
                source={SubscriptionImages.videoIcon}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                {isPlanActive ? `${user?.totalClassCredits ?? 0} live sessions` : 'No active plan'}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Image
                source={SubscriptionImages.playIcon}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Unlimited replays</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Session Progress Card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>Session this month</Text>
            <Text style={styles.sessionRemaining}>
              {used} of {total} used
            </Text>
          </View>
          <View style={styles.sessionProgressContainer}>
            <LinearGradient
              colors={['#B95E82', '#F39F9F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.sessionProgressBar,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Billing Information */}
        {/* <View style={styles.billingContainer}>
          <Text style={styles.billingTitle}>Billing Information</Text>
          
          {billingInfo.map((item, index) => (
            <View key={index}>
              <View style={styles.billingRow}>
                <Text style={styles.billingLabel}>{item.label}</Text>
                <Text style={styles.billingValue}>{item.value}</Text>
              </View>
              {index < billingInfo.length && <View style={styles.divider} />}
            </View>
          ))}
        </View> */}

        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          {settingOptions.map((option, index) => (
            <View key={option.id}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  if (option.onPress) {
                    option.onPress();
                    return;
                  }
                  if (option.page) {
                    navigation.navigate(option.page);
                  }
                }}
              >
                <View style={styles.settingIconContainer}>
                  <Image source={option.icon} style={styles.settingIcon} />
                </View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Image source={SubscriptionImages.rightIcon}  style={styles.rightArrow}/>
              </TouchableOpacity>
              {index < settingOptions.length && (
                <View style={styles.settingsdivider} />
              )}
            </View>
          ))}
        </View>

        {/* Cancel Subscription Button */}
        { user?.subscription?.status== 'active' && <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelSubscription}
          disabled={isCancelling || isRequestingCancellation}
        >
          <Text style={styles.cancelButtonText}>
            {isCancelling || isRequestingCancellation
              ? 'Requesting...'
              : 'Request Cancellation'}
          </Text>
        </TouchableOpacity>}

        <Modal
          transparent
          visible={isCancelModalVisible}
          animationType="fade"
          onRequestClose={() => {
            if (isCancelling || isRequestingCancellation) return;
            setIsCancelModalVisible(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Request to Cancel Subscription</Text>
              <Text style={styles.modalSubtitle}>
                You will lose access to premium features after{' '}
                <Text style={styles.modalSubtitleBold}>
                  {subscription?.endDate
                    ? new Date(subscription.endDate).toDateString()
                    : user?.subscription?.endDate
                    ? new Date(user.subscription.endDate).toDateString()
                    : 'N/A'}
                </Text>
                .
              </Text>

              <Text style={styles.modalLabel}>
                Reason for Cancelling <Text style={styles.modalRequired}>*</Text>
              </Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Please tell us why you are cancelling your subscription..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                style={[
                  styles.modalTextArea,
                  cancelReason.length > 0 && cancelReason.trim().length < 10
                    ? styles.modalTextAreaError
                    : null,
                ]}
              />
              <View style={styles.modalHintRow}>
                <Text style={styles.modalHintText}>
                  {cancelReason.length > 0 && cancelReason.trim().length < 10
                    ? 'Minimum 10 characters required'
                    : ' '}
                </Text>
                <Text style={styles.modalHintText}>{cancelReason.length}/500</Text>
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  disabled={isCancelling || isRequestingCancellation}
                  onPress={() => {
                    setIsCancelModalVisible(false);
                    setCancelReason('');
                  }}
                >
                  <Text style={styles.modalSecondaryButtonText}>
                    Keep Subscription
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalPrimaryButton,
                    !canSubmitCancelReason ||
                    isCancelling ||
                    isRequestingCancellation
                      ? styles.modalPrimaryButtonDisabled
                      : null,
                  ]}
                  disabled={
                    !canSubmitCancelReason ||
                    isCancelling ||
                    isRequestingCancellation
                  }
                  onPress={handleSubmitCancellationRequest}
                >
                  <Text style={styles.modalPrimaryButtonText}>
                    {isCancelling || isRequestingCancellation
                      ? 'Processing...'
                      : 'Yes, Request Cancellation'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 41,
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
    rightArrow: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
    opacity: 0.6,
  },
  headerTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 24,
    color: '#494949',
    textAlign: 'center',
    paddingBottom: 2,
  },
  headerSpacer: {
    width: 24,
  },
  // Current Plan Card
  planCard: {
    minHeight: 230,
    borderRadius: 12,
    paddingLeft: 18,
    paddingRight: 18,
    paddingVertical: 20,
    marginBottom: 27,
    marginHorizontal: 21,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 9,
    
  },
  planLabel: {
    flexShrink: 1,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: '#FFFFFF',
    
  },
  diamondBadge: {
    minHeight: 28,
    maxWidth: '61%',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 158.478,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 34,
  },
  diamondText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  planPrice: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 30,
    lineHeight: 33,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  planFeatures: {
    gap: 9,
    // marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  featureText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 14,
    lineHeight: 19,
    color: '#FFFFFF',
  },
  // Session Progress Card
  sessionCard: {
    marginHorizontal: 16,
    height: 84,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 18,
    marginBottom: 27,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sessionTitle: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 18,
    lineHeight: 28,
    color: '#000000',
  },
  sessionRemaining: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'right',
  },
  sessionProgressContainer: {
    height: 9,
    backgroundColor: '#C9C9C9',
    borderRadius: 39.12,
    overflow: 'hidden',
  },
  sessionProgressBar: {
    height: '100%',
    borderRadius: 39.12,
  },
  // Billing Information
  billingContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 17.52,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 6,
    marginBottom: 27,
  },
  billingTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.01,
    color: '#494949',
    marginBottom: 22,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 31,
  },
  billingLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  billingValue: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#494949',
    opacity: 0.1,
    marginTop: 10,
    marginBottom: 16,
  },
  // Settings Options
  settingsContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 17.52,
    paddingHorizontal: 22,
    marginBottom: 40,
    paddingTop: 28,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
  },
  settingIconContainer: {
    width: 38,
    height: 38,
    backgroundColor: '#FFE8E8',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  settingTitle: {
    flex: 1,
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.01,
    color: '#494949',
  },
  settingsdivider: {
    height: 1,
    backgroundColor: '#494949',
    opacity: 0.1,
    marginTop: 20,
    marginBottom: 20,
  },
  // Cancel Subscription Button
  cancelButton: {
    marginHorizontal: 22,
    height: 54.3,
    backgroundColor: '#B95E82',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
  cancelButtonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  modalTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#111827',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
    marginBottom: 14,
  },
  modalSubtitleBold: {
    fontFamily: 'Satoshi-Bold',
    color: '#374151',
  },
  modalLabel: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  modalRequired: {
    color: '#EF4444',
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 110,
    textAlignVertical: 'top',
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#111827',
  },
  modalTextAreaError: {
    borderColor: '#EF4444',
  },
  modalHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  modalHintText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalSecondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    flex: 1,
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#374151',
  },
  modalPrimaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#B95E82',
    flex: 1,
    alignItems: 'center',
  },
  modalPrimaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalPrimaryButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ManageSubscriptionsScreen;
