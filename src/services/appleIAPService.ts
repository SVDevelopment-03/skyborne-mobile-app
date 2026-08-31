/**
 * Apple In-App Purchase Service (Mobile)
 * Handles iOS IAP using react-native-iap
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestSubscription,
  requestPurchase,
  getAvailablePurchases,
  getPurchaseHistory,
  purchaseUpdatedListener,
  purchaseErrorListener,
  PurchaseError,
} from 'react-native-iap';
import { Platform, Alert } from 'react-native';

export interface AppleProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
  plan: string;
  billingType: 'monthly' | 'yearly';
}

export interface ApplePurchase {
  productId: string;
  transactionId: string;
  transactionReceipt: string;
  originalTransactionId?: string;
  purchaseTime: number;
  originalPurchaseTime?: number;
}

// Apple Product IDs - must match App Store Connect configuration
const APPLE_PRODUCT_IDS = [
  'com.skyborne.gold.monthly',
  'com.skyborne.gold.yearly',
  'com.skyborne.diamond.monthly',
  'com.skyborne.diamond.yearly',
  'com.skyborne.platinum.monthly',
  'com.skyborne.platinum.yearly',
];

class AppleIAPService {
  private static isInitialized = false;
  private static connectionPromise: Promise<void> | null = null;

  /**
   * Initialize IAP connection
   */
  static async initializeIAP(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Only iOS supports IAP
    if (Platform.OS !== 'ios') {
      console.log('⚠️  Apple IAP is only available on iOS');
      return;
    }

    try {
      if (!this.connectionPromise) {
        this.connectionPromise = this.attemptConnection();
      }
      await this.connectionPromise;
      this.isInitialized = true;
      console.log('✅ Apple IAP initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Apple IAP:', error);
      throw error;
    }
  }

  /**
   * Attempt to establish connection with retry
   */
  private static async attemptConnection(retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await initConnection();
        console.log('✅ Connected to App Store');
        return;
      } catch (error) {
        console.warn(`⚠️  Connection attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
    throw new Error('Failed to connect to App Store after multiple attempts');
  }

  /**
   * Get available products
   */
  static async getProducts(): Promise<AppleProduct[]> {
    try {
      await this.initializeIAP();

      const products = await getProducts(APPLE_PRODUCT_IDS);

      console.log(`✅ Retrieved ${products.length} products from App Store`);

      return products.map((product) => ({
        productId: product.productId,
        title: product.title,
        description: product.description || '',
        price: product.price,
        currency: product.currency,
        localizedPrice: product.localizedPrice || product.price,
        plan: this.getPlanFromProductId(product.productId),
        billingType: this.getBillingTypeFromProductId(product.productId),
      }));
    } catch (error) {
      console.error('❌ Error getting products:', error);
      throw error;
    }
  }

  /**
   * Request subscription purchase
   */
  static async requestSubscription(productId: string): Promise<ApplePurchase | null> {
    try {
      await this.initializeIAP();

      console.log(`🛒 Requesting subscription for product: ${productId}`);

      const purchase = await requestSubscription(productId);

      if (!purchase) {
        console.log('⚠️  Purchase was cancelled by user');
        return null;
      }

      console.log(`✅ Purchase request successful for: ${productId}`);

      return {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        originalPurchaseTime: purchase.originalPurchaseTime,
      };
    } catch (error: any) {
      if (error.code === PurchaseError.E_USER_CANCELLED) {
        console.log('⚠️  User cancelled the purchase');
        return null;
      }
      console.error('❌ Purchase error:', error);
      throw error;
    }
  }

  /**
   * Get available purchases (subscriptions)
   */
  static async getAvailablePurchases(): Promise<ApplePurchase[]> {
    try {
      await this.initializeIAP();

      const purchases = await getAvailablePurchases();

      console.log(`✅ Retrieved ${purchases.length} available purchases`);

      return purchases.map((purchase) => ({
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        originalPurchaseTime: purchase.originalPurchaseTime,
      }));
    } catch (error) {
      console.error('❌ Error getting available purchases:', error);
      return [];
    }
  }

  /**
   * Get purchase history
   */
  static async getPurchaseHistory(): Promise<ApplePurchase[]> {
    try {
      await this.initializeIAP();

      const history = await getPurchaseHistory();

      console.log(`✅ Retrieved ${history.length} purchases from history`);

      return history.map((purchase) => ({
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        originalPurchaseTime: purchase.originalPurchaseTime,
      }));
    } catch (error) {
      console.error('❌ Error getting purchase history:', error);
      return [];
    }
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<ApplePurchase[]> {
    try {
      await this.initializeIAP();

      console.log('🔄 Restoring purchases...');

      const purchases = await getAvailablePurchases();

      console.log(`✅ Restored ${purchases.length} purchases`);

      return purchases.map((purchase) => ({
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        originalPurchaseTime: purchase.originalPurchaseTime,
      }));
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Listen for purchase updates
   */
  static setupPurchaseUpdateListener(
    onPurchaseUpdate: (purchase: ApplePurchase) => void,
  ): void {
    if (Platform.OS !== 'ios') {
      return;
    }

    purchaseUpdatedListener((purchase) => {
      console.log('📱 Purchase updated:', purchase.productId);
      onPurchaseUpdate({
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        originalPurchaseTime: purchase.originalPurchaseTime,
      });
    });
  }

  /**
   * Listen for purchase errors
   */
  static setupPurchaseErrorListener(
    onPurchaseError: (error: Error) => void,
  ): void {
    if (Platform.OS !== 'ios') {
      return;
    }

    purchaseErrorListener((error) => {
      console.error('❌ Purchase error:', error);
      onPurchaseError(new Error(error.message));
    });
  }

  /**
   * Terminate IAP connection
   */
  static async terminateConnection(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await endConnection();
      this.isInitialized = false;
      this.connectionPromise = null;
      console.log('✅ IAP connection terminated');
    } catch (error) {
      console.error('❌ Error terminating IAP connection:', error);
    }
  }

  /**
   * Extract plan from product ID
   */
  private static getPlanFromProductId(productId: string): string {
    const productIdLower = productId.toLowerCase();
    if (productIdLower.includes('gold')) return 'gold-yoga';
    if (productIdLower.includes('diamond')) return 'diamond';
    if (productIdLower.includes('platinum')) return 'platinum';
    return 'unknown';
  }

  /**
   * Extract billing type from product ID
   */
  private static getBillingTypeFromProductId(
    productId: string,
  ): 'monthly' | 'yearly' {
    const productIdLower = productId.toLowerCase();
    if (
      productIdLower.includes('yearly') ||
      productIdLower.includes('annual') ||
      productIdLower.includes('year')
    ) {
      return 'yearly';
    }
    return 'monthly';
  }

  /**
   * Check if product is subscription
   */
  static isSubscriptionProduct(productId: string): boolean {
    return APPLE_PRODUCT_IDS.includes(productId);
  }
}

export const appleIAPService = AppleIAPService;
