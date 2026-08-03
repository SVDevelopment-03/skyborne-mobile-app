// screens/onboarding/PricingScreen.tsx - Monthly/Yearly Pricing with Clean UI

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import { useDispatch, useSelector } from 'react-redux';
import { setOnboardingCompleted } from '../../store/authSlice';
import { Images } from '../../assets/images';
import { useOnboardingStore } from '../../store/onboardingSlice';
import {
  createPaymentOrder,
  clearPaymentCache,
} from '../../services/paymentService';
import SocketService from '../../services/socketService';
import { fetchUserProfile } from '../../store/homeSlice';
import { RootState } from '../../store';
import { SubscriptionImages } from '../../assets/images/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL as APP_API_BASE_URL } from '../../constants/api';

const API_BASE_URL = APP_API_BASE_URL;

// ✅ PLAN CONFIG WITH MONTHLY/YEARLY PRICING
const PLAN_CONFIG = {
  gold: {
    name: 'Gold',
    badge: 'Beginner',
    badgeType: 'value',
    hasSubOptions: true,
    monthly: {
      amount: 100,
      display: '$100',
      period: 'Month',
      sessions: '2 Classes',
    },
    yearly: {
      amount: 1140,
      display: '$1,140',
      period: 'Year',
      sessions: '24 Classes',
      savings: 'Save 5%',
    },
  },
  diamond: {
    name: 'Diamond',
    badge: 'Premium',
    badgeType: 'premium',
    hasSubOptions: false,
    monthly: {
      amount: 200,
      display: '$200',
      period: 'Month',
      sessions: '2 Yoga + 2 Zumba',
    },
    yearly: {
      amount: 2280,
      display: '$2,280',
      period: 'Year',
      sessions: '24 Yoga + 24 Zumba',
      savings: 'Save 5%',
    },
  },
  platinum: {
    name: 'Platinum',
    badge: 'Best Value',
    badgeType: 'value',
    hasSubOptions: false,
    monthly: {
      amount: 300,
      display: '$300',
      period: 'Month',
      sessions: '2 Yoga + 2 Zumba + 1 Special',
    },
    yearly: {
      amount: 3420,
      display: '$3,420',
      period: 'Year',
      sessions: '24 Yoga + 24 Zumba + 12 Special',
      savings: 'Save 5%',
    },
  },
};

const goldSubOptions = [
  {
    id: 'gold-yoga',
    label: '2 Yoga',
    monthlyDesc: '2 Yoga Classes',
    yearlyDesc: '24 Yoga Classes',
    value: 1,
  },
  {
    id: 'gold-mixed',
    label: '1 Yoga + 1 Zumba',
    monthlyDesc: '1 Yoga + 1 Zumba Classes',
    yearlyDesc: '12 Yoga + 12 Zumba Classes',
    value: 2,
  },
  {
    id: 'gold-zumba',
    label: '2 Zumba',
    monthlyDesc: '2 Zumba Classes',
    yearlyDesc: '24 Zumba Classes',
    value: 3,
  },
];

const PricingScreen = ({ navigation }: { navigation: any }) => {
  const shouldRedirectToLogin = (message?: string) =>
    (message || '')
      .toLowerCase()
      .includes('active stripe subscription already exists');

  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState('diamond');
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [selectedGoldOption, setSelectedGoldOption] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isListeningForPayment, setIsListeningForPayment] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // ✅ BILLING TYPE STATE
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly');

  const { setPricingPlan, pricingPlan } = useOnboardingStore();
  const dispatch = useDispatch<any>();
  const user = useSelector((state: RootState) => state.auth.user);
  const email = useSelector((state: RootState) => state.auth.email);
  const phone = useSelector((state: RootState) => state.auth.phone);

  useEffect(() => {
    if (user?.id) {
      SocketService.connect(API_BASE_URL, user.id);
    }

    return () => {
      if (paymentTimeout) clearTimeout(paymentTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [user?.id]);

  /**
   * Poll /me API every 60 seconds for 10 minutes (fallback if Socket.io fails)
   */
  const startPollingUserProfile = () => {
    setPollingAttempts(0);

    const interval = setInterval(async () => {
      setPollingAttempts(prev => {
        const newAttempts = prev + 1;
        return newAttempts;
      });

      try {
        const meResult = await dispatch(fetchUserProfile());

        if (meResult.meta.requestStatus === 'fulfilled') {
          const userData = meResult.payload;

          if (userData?.onboardingCompleted) {
            if (interval) clearInterval(interval);
            setPollingInterval(null);
            if (paymentTimeout) clearTimeout(paymentTimeout);

            dispatch(setOnboardingCompleted(true));

            Toast.show({
              type: 'success',
              text1: 'Subscription Activated! 🎊',
              text2: `Welcome to ${userData?.plan} plan!`,
            });

            setTimeout(() => {
              setIsProcessingPayment(false);
              setIsListeningForPayment(false);
              navigation.replace('GetStarted');
            }, 800);

            return;
          }
        }

        if (pollingAttempts >= 10) {
          console.warn('⚠️ Polling timeout - 10 minutes elapsed');
          clearInterval(interval);
          setPollingInterval(null);

          Toast.show({
            type: 'info',
            text1: 'Payment Verification Timeout',
            text2: 'Please refresh the app to check your subscription status',
          });

          setIsProcessingPayment(false);
          setIsListeningForPayment(false);
          return;
        }
      } catch (error) {
        console.error(`❌ Polling attempt failed:`, error);
      }
    }, 60000);

    setPollingInterval(interval);
  };

  /**
   * Handle payment success via Socket.io
   */
  const handlePaymentSuccess = async (paymentData: any) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }

    Toast.show({
      type: 'success',
      text1: 'Payment Successful! 🎉',
      text2: 'Verifying your subscription...',
    });

    try {
      const meResult = await dispatch(fetchUserProfile());

      if (meResult.meta.requestStatus === 'fulfilled') {
        const userData = meResult.payload;

        if (userData?.onboardingCompleted) {
          dispatch(setOnboardingCompleted(true));

          Toast.show({
            type: 'success',
            text1: 'Subscription Activated! 🎊',
            text2: `Welcome to ${userData?.plan} plan!`,
          });

          await clearPaymentCache();

          setTimeout(() => {
            setIsProcessingPayment(false);
            setIsListeningForPayment(false);
            navigation.replace('GetStarted');
          }, 800);
        } else {
          throw new Error('Onboarding not marked as completed');
        }
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('❌ Error in payment success handler:', error);

      Toast.show({
        type: 'error',
        text1: 'Verification Error',
        text2: 'Subscription may be active. Please refresh the app.',
      });

      setIsProcessingPayment(false);
      setIsListeningForPayment(false);

      SocketService.socket?.off('payment-success', handlePaymentSuccess);
      SocketService.socket?.off('payment-error', handlePaymentError);
    }
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (errorData: any) => {
    console.error('❌ Payment error:', errorData);
    const errorMessage =
      errorData?.message || 'Your payment could not be processed';

    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }

    Toast.show({
      type: 'error',
      text1: 'Payment Failed',
      text2: errorMessage,
    });

    setIsProcessingPayment(false);
    setIsListeningForPayment(false);

    SocketService.socket?.off('payment-success', handlePaymentSuccess);
    SocketService.socket?.off('payment-error', handlePaymentError);

    if (shouldRedirectToLogin(errorMessage)) {
      Toast.show({
        type: 'info',
        text1: 'Session Update Required',
        text2: 'Please log in again to continue.',
      });

      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }, 500);
    }
  };

  /**
   * Get plan details based on billing type
   */
  const getPlanDetails = (planKey: string) => {
    let baseConfig: any;

    if (
      planKey === 'gold-yoga' ||
      planKey === 'gold-mixed' ||
      planKey === 'gold-zumba'
    ) {
      baseConfig = PLAN_CONFIG.gold;
    } else if (planKey === 'diamond') {
      baseConfig = PLAN_CONFIG.diamond;
    } else if (planKey === 'platinum') {
      baseConfig = PLAN_CONFIG.platinum;
    } else {
      baseConfig = PLAN_CONFIG.gold;
    }

    const pricing =
      billingType === 'monthly' ? baseConfig.monthly : baseConfig.yearly;

    return {
      id: planKey.includes('gold') ? 'gold' : planKey,
      name: baseConfig.name,
      badge: baseConfig.badge,
      amount: pricing.amount,
      price: pricing.display,
      period: pricing.period,
      sessions: pricing.sessions,
      savings: pricing.savings || null,
    };
  };

  /**
   * Handle Gold Plan selection from modal
   */
  const handleGoldSelect = () => {
    if (selectedGoldOption !== null) {
      const selectedOption = goldSubOptions[selectedGoldOption];
      setPricingPlan(selectedOption.id);
      setSelectedPlan('gold');
      setShowGoldModal(false);
    }
  };

  /**
   * Handle Plan selection
   */
  const handlePlanSelect = (planId: string) => {
    if (planId === 'gold') {
      setShowGoldModal(true);
    } else {
      setPricingPlan(planId);
      setSelectedPlan(planId);
    }
  };

  /**
   * Initiate payment transaction
   */
  const handlePaymentTransaction = async () => {
    try {
      if (!user?.id) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User information not found. Please log in again.',
        });
        return;
      }

      if (!selectedPlan) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a pricing plan',
        });
        return;
      }

      const planDetails = getPlanDetails(selectedPlan);
      if (!planDetails) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid plan selected',
        });
        return;
      }

      setIsProcessingPayment(true);

      // ✅ CREATE PAYMENT ORDER WITH BILLING TYPE
      const response = await createPaymentOrder({
        amount: planDetails.amount,
        currency: 'USD',
        userId: user.id,
        plan: pricingPlan || selectedPlan,
        email: email,
        phone: phone,
        source: 'app',
        billingType: billingType,
      });

      if (!response.success) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to create payment order',
        });
        setIsProcessingPayment(false);
        return;
      }

      const { paymentLink } = response;

      if (!paymentLink) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Payment link not received',
        });
        setIsProcessingPayment(false);
        return;
      }

      setIsListeningForPayment(true);

      SocketService.socket?.on('payment-success', handlePaymentSuccess);
      SocketService.socket?.on('payment-error', handlePaymentError);

      if (!SocketService.isConnected()) {
        console.warn('⚠️ Socket not connected, will rely on polling');
        Toast.show({
          type: 'info',
          text1: 'Connecting to payment service...',
          text2: 'Please wait...',
        });
      }

      Toast.show({
        type: 'info',
        text1: 'Opening Payment Gateway',
        text2: `${billingType === 'yearly' ? 'Yearly' : 'Monthly'} - ${
          response.gateway === 'ngenius' ? 'nGenius' : 'Stripe'
        }`,
      });

      await Linking.openURL(paymentLink);

      startPollingUserProfile();

      const timeout = setTimeout(() => {
        if (isListeningForPayment && !pollingInterval) {
          console.warn('⚠️ Socket timeout - Starting polling fallback');
          startPollingUserProfile();
        }
      }, 60000);

      setPaymentTimeout(timeout);
    } catch (error: any) {
      console.error('❌ Payment transaction error:', error);
      const errorMessage = error?.message || 'An error occurred';

      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: errorMessage,
      });
      setIsProcessingPayment(false);
      setIsListeningForPayment(false);

      SocketService.socket?.off('payment-success', handlePaymentSuccess);
      SocketService.socket?.off('payment-error', handlePaymentError);

      if (shouldRedirectToLogin(errorMessage)) {
        Toast.show({
          type: 'info',
          text1: 'Session Update Required',
          text2: 'Please log in again to continue.',
        });

        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }, 500);
      }
    }
  };

  /**
   * PlanCard Component
   */
  const PlanCard = ({ plan, planKey, isSelected, onPress }: any) => {
    const details = getPlanDetails(planKey);

    return (
      <TouchableOpacity
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={onPress}
        disabled={isProcessingPayment}
        activeOpacity={0.7}
      >
        <View style={styles.planLeft}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDesc}>{details.sessions}</Text>
        </View>

        <View style={styles.planRight}>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>{details.price}</Text>
            <Text style={styles.planPeriod}>/{details.period}</Text>
          </View>
          {details.savings && (
            <Text style={styles.savingsBadge}>✓ {details.savings}</Text>
          )}
        </View>

        {plan.badge && (
          <View
            style={[
              styles.badge,
              isSelected ? styles.premiumBadge : styles.valueBadge,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isSelected ? styles.premiumBadgeText : styles.valueBadgeText,
              ]}
            >
              {plan.badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * GoldOptionCard Component
   */
  const GoldOptionCard = ({ option, isSelected, onPress }: any) => {
    return (
      <TouchableOpacity
        style={[
          styles.goldOptionCard,
          isSelected && styles.goldOptionSelected,
        ]}
        onPress={onPress}
      >
        <View
          style={[
            styles.goldRadio,
            isSelected && styles.goldRadioSelected,
          ]}
        >
          {isSelected && <View style={styles.goldRadioInner} />}
        </View>
        <View style={styles.goldOptionTextContainer}>
          <Text style={styles.goldOptionLabel}>{option.label}</Text>
          <Text style={styles.goldOptionDesc}>
            {billingType === 'monthly'
              ? option.monthlyDesc
              : option.yearlyDesc}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.topNav}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                disabled={isProcessingPayment}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Choose Your Plan</Text>
              <Text style={styles.subtitle}>
                Select the perfect wellness package for you
              </Text>
            </View>

            {/* ✅ BILLING TYPE TOGGLE */}
            <View style={styles.billingToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.billingButton,
                  billingType === 'monthly' && styles.billingButtonActive,
                ]}
                onPress={() => setBillingType('monthly')}
                disabled={isProcessingPayment}
              >
                <Text
                  style={[
                    styles.billingButtonText,
                    billingType === 'monthly' && styles.billingButtonTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.billingButton,
                  billingType === 'yearly' && styles.billingButtonActive,
                ]}
                onPress={() => setBillingType('yearly')}
                disabled={isProcessingPayment}
              >
                <Text
                  style={[
                    styles.billingButtonText,
                    billingType === 'yearly' && styles.billingButtonTextActive,
                  ]}
                >
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>

            {/* Illustration Area */}
            <View style={styles.illustrationArea}>
              <Image
                source={{ uri: Images.pricingIllustration1 }}
                style={[styles.illustrationPlaceholder, { flex: 0.4 }]}
                resizeMode="cover"
              />
              <Image
                source={{ uri: Images.pricingIllustration2 }}
                style={[styles.illustrationPlaceholder, { flex: 0.6 }]}
                resizeMode="cover"
              />
            </View>

            {/* Plans List */}
            <View style={styles.planList}>
              {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                <PlanCard
                  key={key}
                  plan={plan}
                  planKey={key}
                  isSelected={
                    selectedPlan === key ||
                    (key === 'gold' && selectedPlan === 'gold')
                  }
                  onPress={() => handlePlanSelect(key)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* CTA Button - Fixed at Bottom */}
        <View
          style={[
            styles.ctaButtonContainer,
            { paddingBottom: 16 + insets.bottom },
          ]}
        >
          <Button
            title={
              isProcessingPayment ? 'Processing...' : 'Continue to Payment'
            }
            onPress={handlePaymentTransaction}
            disabled={isProcessingPayment || !selectedPlan}
          />
          {isProcessingPayment && (
            <ActivityIndicator
              size="large"
              color="#B95E82"
              style={{ marginTop: 12 }}
            />
          )}
        </View>

        {/* Gold Sub-Options Modal */}
        <Modal
          visible={showGoldModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGoldModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Your Gold Plan</Text>
                <TouchableOpacity
                  onPress={() => setShowGoldModal(false)}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalBillingInfo}>
                {billingType === 'monthly' ? 'Monthly Plan' : 'Yearly Plan (5% off)'}
              </Text>

              <View style={styles.goldOptionsContainer}>
                {goldSubOptions.map((option, index) => (
                  <GoldOptionCard
                    key={option.id}
                    option={option}
                    isSelected={selectedGoldOption === index}
                    onPress={() => setSelectedGoldOption(index)}
                  />
                ))}
              </View>

              <View style={styles.modalButtonContainer}>
                <Button
                  title="Confirm Selection"
                  onPress={handleGoldSelect}
                  disabled={selectedGoldOption === null || isProcessingPayment}
                />
              </View>

              <TouchableOpacity
                onPress={() => setShowGoldModal(false)}
                disabled={isProcessingPayment}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Toast />
      </SafeAreaView>
    </GradientBackground>
  );
};

// ✅ STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topNav: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  closeIcon: {
    fontSize: 24,
    color: '#3A3A3A',
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 30,
    color: '#494949',
    textAlign: 'center',
    lineHeight: 33,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  // ✅ BILLING TOGGLE STYLES
  billingToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 12,
  },
  billingButton: {
    flex: 0.45,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFE8E8',
    borderWidth: 1.5,
    borderColor: '#FFE8E8',
    alignItems: 'center',
  },
  billingButtonActive: {
    backgroundColor: '#B95E82',
    borderColor: '#B95E82',
  },
  billingButtonText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    fontWeight: '500',
    color: '#B95E82',
  },
  billingButtonTextActive: {
    color: '#FFFFFF',
  },
  illustrationArea: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
    marginBottom: 24,
  },
  illustrationPlaceholder: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  planList: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  selectedPlanCard: {
    backgroundColor: '#FFE8E8',
    borderColor: '#B95E82',
    borderWidth: 1.5,
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Satoshi-Regular',
  },
  planRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Satoshi-Regular',
    marginLeft: 2,
  },
  savingsBadge: {
    fontSize: 11,
    color: '#27AE60',
    fontFamily: 'Satoshi-Bold',
    fontWeight: '600',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#B95E824D',
  },
  valueBadge: {
    backgroundColor: '#B95E824D',
  },
  premiumBadge: {
    backgroundColor: '#B95E82',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Satoshi-Medium',
  },
  valueBadgeText: {
    color: '#B95E82',
  },
  premiumBadgeText: {
    color: '#FFFFFF',
  },
  ctaButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  // ✅ MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    color: '#494949',
    fontWeight: '600',
  },
  modalBillingInfo: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Satoshi-Regular',
    marginBottom: 16,
  },
  goldOptionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  goldOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  goldOptionSelected: {
    backgroundColor: '#FFE8E8',
    borderColor: '#B95E82',
    borderWidth: 2,
  },
  goldRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldRadioSelected: {
    borderColor: '#B95E82',
  },
  goldRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B95E82',
  },
  goldOptionTextContainer: {
    flex: 1,
  },
  goldOptionLabel: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Satoshi-Medium',
    fontWeight: '600',
    marginBottom: 2,
  },
  goldOptionDesc: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Satoshi-Regular',
  },
  modalButtonContainer: {
    marginBottom: 12,
  },
  modalCancel: {
    fontSize: 15,
    color: '#B95E82',
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
    fontWeight: '600',
    paddingVertical: 8,
  },
});

export default PricingScreen;