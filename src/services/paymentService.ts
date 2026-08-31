// services/paymentService.ts

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as APP_API_BASE_URL } from '../constants/api';

const API_BASE_URL = APP_API_BASE_URL;

export interface PaymentOrderPayload {
  amount: number;
  currency: string;
  userId: string;
  plan: string;
  email?: string;
  phone?: string;
  billingType?: 'monthly' | 'yearly';
  source?: 'app' | 'web';
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentOrderResponse {
  success: boolean;
  message: string;
  orderId?: string;
  orderRef?: string;
  paymentLink?: string;
  checkoutUrl?: string;
  sessionId?: string;        // ✅ Stripe only
  paymentIntentId?: string;  // ✅ Stripe native / payment intent
  clientSecret?: string;     // ✅ Stripe native / payment intent
  reference?: string;        // ✅ nGenius only
  amount?: number;
  currency?: string;
  status?: string;
  gateway?: string;          // 'stripe' or 'ngenius'
}

export interface UpgradePlanOrderResponse {
  success: boolean;
  message: string;
  gateway?: string;
  orderRef?: string;
  paymentLink?: string;
  checkoutUrl?: string;
  sessionId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  reference?: string;
  data?: {
    subscriptionId?: string;
    plan?: string;
    amount?: number;
    currency?: string;
    localAmount?: number;
    localCurrency?: string;
    billingType?: 'monthly' | 'yearly';
    subscriptionEndDate?: string | Date | null;
  };
}

export interface PaymentVerificationPayload {
  sessionId?: string;        // Stripe
  orderRef?: string;         // nGenius
  reference?: string;        // nGenius
  paymentIntentId?: string;  // Stripe alternative
  gateway?: string;          // Payment gateway type
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  orderRef: string;
  amount: number;
  currency: string;
  plan: string;
  gateway?: string;
}

export interface CardPortalSessionResponse {
  success: boolean;
  message?: string;
  data?: {
    customerId?: string;
    url?: string;
  };
}

class PaymentService {
  private api: AxiosInstance;
  private authTokenKey = '@auth_token';

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-client-source': 'app',
      },
    });

    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(this.authTokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Create payment order - works with both Stripe and nGenius
   * 
   * nGenius Response:
   * {
   *   success: true,
   *   gateway: "ngenius",
   *   orderRef: "NG-1768724655173-92DV3",
   *   paymentLink: "https://paypage.sandbox.ngenius-payments.com/?code=...",
   *   reference: "185686fa-5937-4780-9397-431369f46e90",  // ✅ nGenius only
   *   message: "Payment order created successfully"
   * }
   * 
   * Stripe Response:
   * {
   *   success: true,
   *   gateway: "stripe",
   *   orderRef: "STR-1768724655173",
   *   paymentLink: "https://checkout.stripe.com/...",
   *   sessionId: "cs_test_...",  // ✅ Stripe only
   *   message: "Checkout session created"
   * }
   */
  async createPaymentOrder(payload: PaymentOrderPayload): Promise<PaymentOrderResponse> {
    try {
      const appSuccessUrl =
        'skybornedrop://payment-processing?status=success&sessionId={CHECKOUT_SESSION_ID}';
      const appCancelUrl = 'skybornedrop://payment-processing?status=cancelled';

      const requestPayload: PaymentOrderPayload = {
        ...payload,
        source: 'app',
        successUrl: appSuccessUrl,
        cancelUrl: appCancelUrl,
      };
      console.log('🔄 Creating payment order:', requestPayload);

      const response = await this.api.post('/payment/create-order', requestPayload);

      console.log('✅ Payment order response:', {
        gateway: response.data?.gateway,
        orderRef: response.data?.orderRef,
        hasSessionId: !!response.data?.sessionId,
        hasReference: !!response.data?.reference,
      });

      if (response.data?.success && response.data?.orderRef) {
        // Store payment details for verification later
        await AsyncStorage.setItem('paymentOrderRef', response.data.orderRef);
        await AsyncStorage.setItem('paymentGateway', response.data.gateway || 'unknown');

        // Store gateway-specific identifiers
        if (response.data.gateway === 'ngenius') {
          // nGenius uses 'reference' as primary identifier
          if (response.data.reference) {
            await AsyncStorage.setItem('paymentReference', response.data.reference);
            console.log('📦 Stored nGenius reference:', response.data.reference);
          }
        } else if (response.data.gateway === 'stripe') {
          // Stripe uses 'sessionId' as primary identifier
          if (response.data.sessionId) {
            await AsyncStorage.setItem('paymentSessionId', response.data.sessionId);
            console.log('📦 Stored Stripe sessionId:', response.data.sessionId);
          }
        }

        console.log('✅ Payment order created:', {
          orderRef: response.data.orderRef,
          gateway: response.data.gateway,
        });
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Payment order creation failed';
      console.error('❌ Payment order creation error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async createNativePaymentOrder(
    payload: PaymentOrderPayload,
  ): Promise<PaymentOrderResponse> {
    try {
      const requestPayload: PaymentOrderPayload = {
        ...payload,
        source: 'app',
      };

      console.log('🔄 Creating native payment order:', requestPayload);

      const response = await this.api.post(
        '/payment/create-native-order',
        requestPayload,
      );

      const normalizedResponse = {
        ...response.data,
        paymentIntentId:
          response.data?.paymentIntentId || response.data?.reference || undefined,
      };

      if (normalizedResponse?.success && normalizedResponse?.orderRef) {
        await AsyncStorage.setItem('paymentOrderRef', normalizedResponse.orderRef);
        await AsyncStorage.setItem(
          'paymentGateway',
          normalizedResponse.gateway || 'stripe',
        );

        if (normalizedResponse.paymentIntentId) {
          await AsyncStorage.setItem(
            'paymentIntentId',
            normalizedResponse.paymentIntentId,
          );
          console.log(
            '📦 Stored Stripe paymentIntentId:',
            normalizedResponse.paymentIntentId,
          );
        }
      }

      return normalizedResponse;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Native payment order creation failed';
      console.error('❌ Native payment order creation error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async createNativeUpgradeOrder(
    payload: PaymentOrderPayload,
  ): Promise<UpgradePlanOrderResponse> {
    try {
      const requestPayload: PaymentOrderPayload = {
        ...payload,
        source: 'app',
      };

      console.log('🔄 Creating native upgrade order:', requestPayload);

      const response = await this.api.post(
        '/payment/create-native-upgrade-order',
        requestPayload,
      );

      const normalizedResponse = {
        ...response.data,
        paymentIntentId:
          response.data?.paymentIntentId || response.data?.reference || undefined,
      };

      if (normalizedResponse?.success && normalizedResponse?.orderRef) {
        await AsyncStorage.setItem('paymentOrderRef', normalizedResponse.orderRef);
        await AsyncStorage.setItem(
          'paymentGateway',
          normalizedResponse.gateway || 'stripe',
        );

        if (normalizedResponse.paymentIntentId) {
          await AsyncStorage.setItem(
            'paymentIntentId',
            normalizedResponse.paymentIntentId,
          );
          console.log(
            '📦 Stored Stripe paymentIntentId:',
            normalizedResponse.paymentIntentId,
          );
        }
      }

      return normalizedResponse;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Native upgrade order creation failed';
      console.error('❌ Native upgrade order creation error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upgrade an existing plan (Stripe) or fallback to create-order if needed
   */
  async upgradePlanOrder(
    payload: PaymentOrderPayload,
  ): Promise<UpgradePlanOrderResponse> {
    try {
      const appSuccessUrl =
        'skybornedrop://payment-processing?status=success&sessionId={CHECKOUT_SESSION_ID}';
      const appCancelUrl = 'skybornedrop://payment-processing?status=cancelled';

      const requestPayload: PaymentOrderPayload = {
        ...payload,
        source: 'app',
        successUrl: appSuccessUrl,
        cancelUrl: appCancelUrl,
      };

      console.log('🔄 Creating upgrade order:', requestPayload);

      const response = await this.api.post(
        '/payment/upgrade-order',
        requestPayload,
      );

      if (response.data?.success && response.data?.orderRef) {
        await AsyncStorage.setItem('paymentOrderRef', response.data.orderRef);
        await AsyncStorage.setItem(
          'paymentGateway',
          response.data.gateway || 'unknown',
        );

        if (response.data.gateway === 'ngenius') {
          if (response.data.reference) {
            await AsyncStorage.setItem(
              'paymentReference',
              response.data.reference,
            );
            console.log('📦 Stored nGenius reference:', response.data.reference);
          }
        } else if (response.data.gateway === 'stripe') {
          if (response.data.sessionId) {
            await AsyncStorage.setItem(
              'paymentSessionId',
              response.data.sessionId,
            );
            console.log('📦 Stored Stripe sessionId:', response.data.sessionId);
          }
        }
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Upgrade plan request failed';
      console.error('❌ Upgrade plan error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a Stripe billing portal session for updating card details
   */
  async createCardPortalSession(
    returnUrl?: string,
  ): Promise<CardPortalSessionResponse> {
    try {
      const payload = returnUrl ? { returnUrl } : {};
      const response = await this.api.post(
        '/payment/card-portal-session',
        payload,
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to open card update page';
      console.error('❌ Card portal session error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async createCardSetupIntent(): Promise<{
    success: boolean;
    message?: string;
    data?: {
      customerId?: string;
      clientSecret?: string;
      setupIntentId?: string;
    };
  }> {
    try {
      const response = await this.api.post('/payment/create-card-setup-intent');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create card setup intent';
      console.error('❌ Card setup intent error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  async confirmCardSetupIntent(
    setupIntentId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.api.post('/payment/confirm-card-setup-intent', {
        setupIntentId,
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to confirm card setup intent';
      console.error('❌ Confirm card setup intent error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify payment for mobile - works with both gateways
   * Automatically detects which gateway was used based on stored data
   * 
   * Payload logic:
   * - If nGenius: sends reference + orderRef
   * - If Stripe: sends sessionId + orderRef
   */
  async verifyMobilePayment(payload?: PaymentVerificationPayload): Promise<PaymentVerificationResponse> {
    try {
      // If no payload provided, construct it from AsyncStorage
      if (!payload) {
        const [orderRef, gateway, reference, sessionId, paymentIntentId] = await Promise.all([
          AsyncStorage.getItem('paymentOrderRef'),
          AsyncStorage.getItem('paymentGateway'),
          AsyncStorage.getItem('paymentReference'),
          AsyncStorage.getItem('paymentSessionId'),
          AsyncStorage.getItem('paymentIntentId'),
        ]);

        // Determine which fields to include based on gateway
        if (gateway === 'ngenius') {
          payload = {
            orderRef: orderRef || undefined,
            reference: reference || undefined,
            gateway: 'ngenius',
          };
          console.log('📋 Verifying nGenius payment:', { orderRef, reference });
        } else if (gateway === 'stripe') {
          payload = {
            orderRef: orderRef || undefined,
            sessionId: sessionId || undefined,
            paymentIntentId: paymentIntentId || undefined,
            gateway: 'stripe',
          };
          console.log('📋 Verifying Stripe payment:', {
            orderRef,
            sessionId,
            paymentIntentId,
          });
        } else {
          // Fallback: try both
          payload = {
            orderRef: orderRef || undefined,
            reference: reference || undefined,
            sessionId: sessionId || undefined,
            paymentIntentId: paymentIntentId || undefined,
          };
          console.log('📋 Verifying payment (auto-detect):', payload);
        }
      } else if (payload.gateway === 'stripe' && !payload.orderRef) {
        const orderRef = await AsyncStorage.getItem('paymentOrderRef');
        if (orderRef) {
          payload.orderRef = orderRef;
        }
      }

      console.log('🔄 Verifying mobile payment:', payload);

      const response = await this.api.post('/payment/verify-mobile', payload);

      console.log('✅ Payment verification response:', {
        success: response.data?.success,
        status: response.data?.status,
        gateway: response.data?.gateway,
      });

      return response.data;
    } catch (error: any) {
      const errorDetails = error.response?.data?.details;
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Payment verification failed';
      console.error('❌ Payment verification error:', {
        message: errorMessage,
        details: errorDetails,
      });
      const detailMessage = errorDetails?.message
        ? ` (${errorDetails.message})`
        : '';
      throw new Error(`${errorMessage}${detailMessage}`);
    }
  }

  /**
   * Verify payment by order reference (legacy method)
   */
  async verifyPayment(orderRef: string): Promise<any> {
    try {
      console.log('🔄 Verifying payment by orderRef:', orderRef);

      const response = await this.api.get(`/payment/status/${orderRef}`);

      console.log('✅ Payment status response:', response.data);

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Payment verification failed';
      console.error('❌ Payment verification error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get payment status by order ID
   */
  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      console.log('🔄 Fetching payment status:', orderId);

      const response = await this.api.get(`/payment/status/${orderId}`);

      console.log('✅ Payment status:', response.data);

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Failed to fetch payment status';
      console.error('❌ Payment status error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Clear payment cache after verification
   */
  async clearPaymentCache(): Promise<void> {
    try {
      console.log('🧹 Clearing payment cache...');

      await AsyncStorage.removeItem('paymentOrderRef');
      await AsyncStorage.removeItem('paymentSessionId');  // Stripe
      await AsyncStorage.removeItem('paymentIntentId'); // Stripe native
      await AsyncStorage.removeItem('paymentReference');  // nGenius
      await AsyncStorage.removeItem('paymentGateway');

      console.log('✅ Payment cache cleared');
    } catch (error) {
      console.error('❌ Error clearing payment cache:', error);
    }
  }

  /**
   * Get all stored payment details
   */
  async getStoredPaymentDetails(): Promise<{
    orderRef?: string;
    sessionId?: string;    // Stripe
    paymentIntentId?: string; // Stripe native
    reference?: string;    // nGenius
    gateway?: string;
  }> {
    try {
      const [orderRef, sessionId, paymentIntentId, reference, gateway] = await Promise.all([
        AsyncStorage.getItem('paymentOrderRef'),
        AsyncStorage.getItem('paymentSessionId'),
        AsyncStorage.getItem('paymentIntentId'),
        AsyncStorage.getItem('paymentReference'),
        AsyncStorage.getItem('paymentGateway'),
      ]);

      return {
        ...(orderRef && { orderRef }),
        ...(sessionId && { sessionId }),
        ...(paymentIntentId && { paymentIntentId }),
        ...(reference && { reference }),
        ...(gateway && { gateway }),
      };
    } catch (error) {
      console.error('❌ Error getting stored payment details:', error);
      return {};
    }
  }

  /**
   * Get payment gateway type
   */
  async getPaymentGateway(): Promise<'stripe' | 'ngenius' | 'unknown'> {
    try {
      const gateway = await AsyncStorage.getItem('paymentGateway');
      return (gateway as 'stripe' | 'ngenius') || 'unknown';
    } catch (error) {
      console.error('❌ Error getting payment gateway:', error);
      return 'unknown';
    }
  }

  /**
   * Get primary payment identifier based on gateway
   * Returns either reference (nGenius) or sessionId (Stripe)
   */
  async getPrimaryPaymentIdentifier(): Promise<string | null> {
    try {
      const [gateway, reference, sessionId] = await Promise.all([
        AsyncStorage.getItem('paymentGateway'),
        AsyncStorage.getItem('paymentReference'),
        AsyncStorage.getItem('paymentSessionId'),
      ]);

      if (gateway === 'ngenius' && reference) {
        return reference;
      } else if (gateway === 'stripe' && sessionId) {
        return sessionId;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting primary payment identifier:', error);
      return null;
    }
  }

  /**
   * ✅ APPLE IN-APP PURCHASE METHODS
   */

  /**
   * Validate Apple IAP receipt with backend
   */
  async validateAppleReceipt(receipt: string, userId: string): Promise<any> {
    try {
      console.log('🍎 Validating Apple receipt with backend...');

      const response = await this.api.post('/payment/apple-iap/validate-receipt', {
        receipt,
        userId,
      });

      if (response.data?.success) {
        console.log('✅ Apple receipt validated successfully');
        await AsyncStorage.setItem('applePaymentOrderRef', response.data.data?.orderRef || '');
        return response.data;
      }

      throw new Error(response.data?.message || 'Receipt validation failed');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Apple receipt validation failed';
      console.error('❌ Apple receipt validation error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Restore Apple IAP purchases
   */
  async restoreApplePurchases(receipt: string, userId: string): Promise<any> {
    try {
      console.log('🍎 Restoring Apple purchases...');

      const response = await this.api.post('/payment/apple-iap/restore-purchases', {
        receipt,
        userId,
      });

      if (response.data?.success) {
        console.log(`✅ Restored ${response.data.data?.count || 0} purchases`);
        return response.data;
      }

      throw new Error(response.data?.message || 'Purchase restoration failed');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Purchase restoration failed';
      console.error('❌ Purchase restoration error:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get available Apple IAP products
   */
  async getAppleProducts(): Promise<any> {
    try {
      console.log('🍎 Fetching Apple IAP products...');

      const response = await this.api.get('/payment/apple-iap/products');

      if (response.data?.success) {
        console.log(`✅ Retrieved ${response.data.data?.length || 0} Apple products`);
        return response.data;
      }

      throw new Error(response.data?.message || 'Failed to fetch products');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch Apple products';
      console.error('❌ Error fetching Apple products:', errorMessage);
      throw new Error(errorMessage);
    }
  }
}

export const paymentService = new PaymentService();

// Export individual functions for convenience
export const createPaymentOrder = (payload: PaymentOrderPayload) =>
  paymentService.createPaymentOrder(payload);

export const createNativePaymentOrder = (payload: PaymentOrderPayload) =>
  paymentService.createNativePaymentOrder(payload);

export const upgradePlanOrder = (payload: PaymentOrderPayload) =>
  paymentService.upgradePlanOrder(payload);

export const createNativeUpgradeOrder = (payload: PaymentOrderPayload) =>
  paymentService.createNativeUpgradeOrder(payload);

export const createCardPortalSession = (returnUrl?: string) =>
  paymentService.createCardPortalSession(returnUrl);

export const createCardSetupIntent = () =>
  paymentService.createCardSetupIntent();

export const confirmCardSetupIntent = (setupIntentId: string) =>
  paymentService.confirmCardSetupIntent(setupIntentId);

export const verifyMobilePayment = (payload?: PaymentVerificationPayload) =>
  paymentService.verifyMobilePayment(payload);

export const verifyPayment = (orderRef: string) =>
  paymentService.verifyPayment(orderRef);

export const getPaymentStatus = (orderId: string) =>
  paymentService.getPaymentStatus(orderId);

export const clearPaymentCache = () =>
  paymentService.clearPaymentCache();

export const getStoredPaymentDetails = () =>
  paymentService.getStoredPaymentDetails();

export const getPaymentGateway = () =>
  paymentService.getPaymentGateway();

export const getPrimaryPaymentIdentifier = () =>
  paymentService.getPrimaryPaymentIdentifier();
