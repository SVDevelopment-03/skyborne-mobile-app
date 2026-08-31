/**
 * Apple In-App Purchase UI Component
 * Displays available IAP products and handles purchases
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { appleIAPService } from '../../services/appleIAPService';
import { paymentService } from '../../services/paymentService';

interface AppleProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
  plan: string;
  billingType: 'monthly' | 'yearly';
}

interface AppleIAPSectionProps {
  userId?: string;
  onPurchaseSuccess?: () => void;
}

export const AppleIAPSection: React.FC<AppleIAPSectionProps> = ({
  userId,
  onPurchaseSuccess,
}) => {
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  useEffect(() => {
    loadAppleProducts();
  }, []);

  const loadAppleProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await paymentService.getAppleProducts();

      if (response.success && response.data) {
        setProducts(response.data);
        console.log(`✅ Loaded ${response.data.length} Apple IAP products`);
      }
    } catch (error: any) {
      console.error('❌ Error loading Apple products:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading products',
        text2: error.message || 'Unable to load Apple IAP products',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handlePurchaseProduct = async (product: AppleProduct) => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Not authenticated',
        text2: 'Please login to make a purchase.',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setSelectedProductId(product.productId);

      console.log(`🛒 Requesting purchase for: ${product.productId}`);

      // Initialize IAP
      await appleIAPService.initializeIAP();

      // Request subscription
      const purchase = await appleIAPService.requestSubscription(product.productId);

      if (!purchase) {
        console.log('⚠️  Purchase cancelled by user');
        setIsProcessing(false);
        setSelectedProductId(null);
        return;
      }

      console.log(`✅ Purchase successful, validating receipt...`);

      // Validate receipt with backend
      const validationResponse = await paymentService.validateAppleReceipt(
        purchase.transactionReceipt,
        userId,
      );

      if (validationResponse.success) {
        Toast.show({
          type: 'success',
          text1: 'Purchase successful!',
          text2: `You now have access to ${product.title}`,
        });

        console.log('✅ Apple IAP subscription activated');

        // Notify parent component
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      } else {
        throw new Error(validationResponse.message || 'Receipt validation failed');
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      Toast.show({
        type: 'error',
        text1: 'Purchase failed',
        text2: error.message || 'Unable to complete purchase',
      });
    } finally {
      setIsProcessing(false);
      setSelectedProductId(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (!userId) {
      Toast.show({
        type: 'error',
        text1: 'Not authenticated',
        text2: 'Please login to restore purchases.',
      });
      return;
    }

    try {
      setIsProcessing(true);

      console.log('🔄 Restoring previous purchases...');

      // Initialize IAP
      await appleIAPService.initializeIAP();

      // Get available purchases
      const purchases = await appleIAPService.restorePurchases();

      if (purchases.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No purchases to restore',
          text2: 'You have no previous purchases to restore.',
        });
        setIsProcessing(false);
        return;
      }

      // Get latest purchase receipt
      const latestPurchase = purchases[0];

      // Validate with backend
      const restoreResponse = await paymentService.restoreApplePurchases(
        latestPurchase.transactionReceipt,
        userId,
      );

      if (restoreResponse.success) {
        Toast.show({
          type: 'success',
          text1: 'Purchases restored!',
          text2: `Restored ${restoreResponse.data?.count || purchases.length} purchases`,
        });

        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
      }
    } catch (error: any) {
      console.error('❌ Restore error:', error);
      Toast.show({
        type: 'error',
        text1: 'Restore failed',
        text2: error.message || 'Unable to restore purchases',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingProducts) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Apple In-App Purchases</Text>
        <ActivityIndicator size="large" color="#B95E82" />
      </View>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Apple In-App Purchases</Text>
      <Text style={styles.sectionSubtitle}>
        Subscribe directly through Apple to manage your subscription
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.productsScroll}
        contentContainerStyle={styles.productsContainer}
      >
        {products.map((product) => (
          <LinearGradient
            key={product.productId}
            colors={['#B95E82', '#D17D9E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.productCard}
          >
            <View style={styles.productHeader}>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productBillingType}>
                {product.billingType === 'yearly' ? 'Annual' : 'Monthly'}
              </Text>
            </View>

            <Text style={styles.productPrice}>{product.localizedPrice}</Text>

            <Text style={styles.productPlan}>{product.plan.toUpperCase()}</Text>

            <TouchableOpacity
              style={[
                styles.purchaseButton,
                isProcessing && selectedProductId === product.productId
                  ? styles.purchaseButtonDisabled
                  : {},
              ]}
              onPress={() => handlePurchaseProduct(product)}
              disabled={isProcessing}
            >
              {isProcessing && selectedProductId === product.productId ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestorePurchases}
        disabled={isProcessing}
      >
        <Text style={styles.restoreButtonText}>Restore Previous Purchases</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  productsScroll: {
    marginBottom: 16,
  },
  productsContainer: {
    paddingRight: 16,
  },
  productCard: {
    borderRadius: 16,
    padding: 16,
    width: 240,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  productBillingType: {
    fontSize: 12,
    color: '#F0F0F0',
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  productPlan: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F0F0F0',
    marginBottom: 12,
  },
  purchaseButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#B95E82',
    fontSize: 14,
    fontWeight: '600',
  },
  restoreButton: {
    borderWidth: 2,
    borderColor: '#B95E82',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    color: '#B95E82',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppleIAPSection;
