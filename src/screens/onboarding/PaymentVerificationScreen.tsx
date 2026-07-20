import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { setOnboardingCompleted } from '../../store/authSlice';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import {
  verifyMobilePayment,
  clearPaymentCache,
  getStoredPaymentDetails,
} from '../../services/paymentService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaymentData {
  orderRef: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  success: boolean;
  plan: string;
  gateway?: string;
  message: string;
}

const PaymentVerification = ({ navigation }: { navigation: any }) => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);
  const dispatch = useDispatch();

  const insets = useSafeAreaInsets();
  const hasVerified = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000; // 2 seconds

  const verifyPaymentHandler = async () => {
    try {
      // Get stored payment details
      const paymentDetails = await getStoredPaymentDetails();

      if (!paymentDetails.orderRef && !paymentDetails.sessionId && !paymentDetails.reference) {
        setError('Payment information not found. Please try again.');
        setLoading(false);
        return;
      }

      // Build verification payload
      const verificationPayload: any = {};

      if (paymentDetails.sessionId) {
        verificationPayload.sessionId = paymentDetails.sessionId;
      }
      if (paymentDetails.orderRef) {
        verificationPayload.orderRef = paymentDetails.orderRef;
      }
      if (paymentDetails.reference) {
        verificationPayload.reference = paymentDetails.reference;
      }

      // Call verification endpoint
      const response = await verifyMobilePayment(verificationPayload);

      // Handle successful payment
      if (response.success && response.status === 'SUCCESS') {
        setPaymentData(response);
        setLoading(false);
        setAutoRetrying(false);

        // Clean up stored data
        await clearPaymentCache();

        Toast.show({
          type: 'success',
          text1: 'Payment Successful! 🎉',
          text2: 'Your subscription has been activated.',
        });

        // Auto-navigate after 2 seconds
        setTimeout(() => {
          dispatch(setOnboardingCompleted(true));
          navigation.navigate('Home');
        }, 2000);
      }
      // Payment still processing - retry
      else if (response.status === 'PENDING' && retryCount < MAX_RETRIES) {
        // console.log(
        //   `⏳ Payment still processing... Retry ${retryCount + 1}/${MAX_RETRIES}`
        // );
        setAutoRetrying(true);
        setPaymentData(response);

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          verifyPaymentHandler();
        }, RETRY_DELAY);
      }
      // Max retries reached, still pending
      else if (response.status === 'PENDING') {
        setPaymentData(response);
        setError(
          'Payment verification timeout. Please check back shortly or contact support.'
        );
        setLoading(false);
        setAutoRetrying(false);
      }
      // Payment failed
      else {
        setPaymentData(response);
        setLoading(false);
        setAutoRetrying(false);

        Toast.show({
          type: 'error',
          text1: 'Payment Failed',
          text2: `Status: ${response.status}`,
        });
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);

      // Retry on error
      if (retryCount < MAX_RETRIES) {
        // console.log(
        //   `⏳ Retrying due to error... Attempt ${retryCount + 1}/${MAX_RETRIES}`
        // );
        setAutoRetrying(true);

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          verifyPaymentHandler();
        }, RETRY_DELAY);
      } else {
        setError(err.message || 'Failed to verify payment');
        setLoading(false);
        setAutoRetrying(false);

        Toast.show({
          type: 'error',
          text1: 'Verification Error',
          text2: err.message,
        });
      }
    }
  };

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    // Start verification after a short delay
    const startVerification = setTimeout(() => {
      verifyPaymentHandler();
    }, 1000);

    return () => {
      clearTimeout(startVerification);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading || autoRetrying) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { paddingBottom: 16 + insets.bottom }] }>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#B95E82" />
            <Text style={styles.loadingText}>
              {loading
                ? 'Verifying your payment...'
                : `Processing payment`}
            </Text>
            {autoRetrying && (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(retryCount / MAX_RETRIES) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.retryText}>
                  {`Attempt ${retryCount} of ${MAX_RETRIES}`}
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
        <Toast />
      </GradientBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { paddingBottom: 16 + insets.bottom }] }>
          <View style={styles.centerContent}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Verification Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>

            {paymentData && (
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {paymentData.orderRef}
                  </Text>
                </View>
                {paymentData.gateway && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gateway:</Text>
                    <Text style={styles.detailValue}>
                      {paymentData.gateway.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title="Retry Verification"
                onPress={() => {
                  setLoading(true);
                  setError('');
                  setRetryCount(0);
                  verifyPaymentHandler();
                }}
              />
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <Toast />
      </GradientBackground>
    );
  }

  // Payment failed state
  if (paymentData && !paymentData.success) {
    return (
      <GradientBackground>
        <SafeAreaView style={[styles.container, { paddingBottom: 16 + insets.bottom }] }>
          <View style={styles.centerContent}>
            <Text style={styles.failedIcon}>❌</Text>
            <Text style={styles.failedTitle}>Payment {paymentData.status}</Text>
            <Text style={styles.failedMessage}>
              Your payment could not be completed. Please try again or contact support.
            </Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Ref:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {paymentData.orderRef}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {paymentData.currency} {paymentData.amount}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{paymentData.status}</Text>
              </View>
              {paymentData.gateway && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gateway:</Text>
                  <Text style={styles.detailValue}>
                    {paymentData.gateway.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Try Again"
                onPress={() => {
                  clearPaymentCache();
                  navigation.navigate('Pricing');
                }}
              />
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <Toast />
      </GradientBackground>
    );
  }

  // Payment success state
  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { paddingBottom: 16 + insets.bottom }] }>
        <View style={styles.centerContent}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            You're all set to start your wellness journey
          </Text>

          {paymentData && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Ref:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {paymentData.orderRef}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plan:</Text>
                <Text style={styles.detailValue}>
                  {paymentData.plan?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {paymentData.currency} {paymentData.amount}
                </Text>
              </View>
              {paymentData.gateway && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gateway:</Text>
                  <Text style={styles.detailValue}>
                    {paymentData.gateway.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Go to Dashboard"
              onPress={() => {
                dispatch(setOnboardingCompleted(true));
                navigation.navigate('Home');
              }}
            />
          </View>

          <Text style={styles.welcomeText}>
            Check your email for confirmation and next steps
          </Text>
        </View>
      </SafeAreaView>
      <Toast />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#494949',
    fontFamily: 'Satoshi-Medium',
  },
  retryText: {
    marginTop: 12,
    fontSize: 13,
    color: '#999',
    fontFamily: 'Satoshi-Regular',
  },
  progressBar: {
    marginTop: 16,
    width: '80%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B95E82',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    color: '#D32F2F',
    marginBottom: 8,
    fontFamily: 'Satoshi-Bold',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Satoshi-Regular',
    paddingHorizontal: 8,
  },
  failedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  failedTitle: {
    fontSize: 24,
    color: '#D32F2F',
    marginBottom: 8,
    fontFamily: 'Satoshi-Bold',
  },
  failedMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Satoshi-Regular',
    paddingHorizontal: 8,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    color: '#4CAF50',
    marginBottom: 8,
    fontFamily: 'Satoshi-Bold',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Satoshi-Regular',
    paddingHorizontal: 8,
  },
  welcomeText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'Satoshi-Regular',
  },
  detailsBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#B95E82',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Satoshi-Medium',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Satoshi-Medium',
    flex: 0.6,
    textAlign: 'right',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B95E82',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#B95E82',
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
  },
});

export default PaymentVerification;