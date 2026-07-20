import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { CartData, CartItem, shopService } from '../../services/shopService';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const C = {
  bg: '#FAF8F6',
  surface: '#FFFFFF',
  border: '#F0EDE9',
  accent: '#B95E82',
  accentLight: '#FDF0F5',
  text: '#2C2C2C',
  sub: '#5F5F5F',
  muted: '#808080',
  success: '#3A9E6A',
};

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const loggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const [cart, setCart] = React.useState<CartData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      shopService.setForceGuestMode(!loggedIn);
      return () => {
        shopService.setForceGuestMode(false);
      };
    }, [loggedIn]),
  );

  const loadCart = React.useCallback(async () => {
    try {
      const data = await shopService.getMyCart();
      setCart(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to load cart', text2: error?.response?.data?.message ?? error?.message });
      setCart(null);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCart();
    }, [loadCart]),
  );

  React.useEffect(() => { loadCart(); }, [loadCart]);

  const updateQty = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setFetching(true);
      const updated = await shopService.updateCartItem(productId, quantity);
      setCart(updated);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to update quantity', text2: error?.response?.data?.message ?? error?.message });
    } finally {
      setFetching(false);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setFetching(true);
      const updated = await shopService.removeCartItem(productId);
      setCart(updated);
      Toast.show({ type: 'success', text1: '✓ Item removed' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to remove item', text2: error?.response?.data?.message ?? error?.message });
    } finally {
      setFetching(false);
    }
  };

  const clearAll = async () => {
    if (!cart?.items?.length) {
      setCart(prev => (prev ? { ...prev, items: [], total: 0 } : null));
      Toast.show({ type: 'success', text1: 'Cart cleared' });
      return;
    }

    try {
      setClearing(true);
      // Try backend clear endpoint first
      try {
        await shopService.clearCart();
      } catch {
        // ignore and verify via refresh below
      }

      // Verify if cart is empty
      try {
        const refreshed = await shopService.getMyCart();
        if (!refreshed?.items?.length) {
          setCart(refreshed);
          Toast.show({ type: 'success', text1: 'Cart cleared' });
          return;
        }
        // If still has items, continue with fallback removal using fresh list
        for (const item of refreshed.items) {
          try {
            await shopService.removeCartItem(item.product);
          } catch {
            // ignore and continue
          }
        }
        const afterFallback = await shopService.getMyCart();
        setCart(afterFallback);
        if (!afterFallback?.items?.length) {
          Toast.show({ type: 'success', text1: 'Cart cleared' });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Failed to clear cart',
            text2: 'Some items could not be removed',
          });
        }
        return;
      } catch {
        // fall back to item-by-item removal
      }

      // Fallback: remove items one-by-one (sequential to avoid rate limits)
      const fallbackItems = cart?.items ?? [];
      for (const item of fallbackItems) {
        try {
          await shopService.removeCartItem(item.product);
        } catch {
          // ignore and continue
        }
      }

      const refreshed = await shopService.getMyCart();
      setCart(refreshed);
      if (!refreshed?.items?.length) {
        Toast.show({ type: 'success', text1: 'Cart cleared' });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to clear cart',
          text2: 'Some items could not be removed',
        });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to clear cart', text2: error?.response?.data?.message ?? error?.message });
    } finally {
      setClearing(false);
    }
  };

  const items = cart?.items ?? [];
  const subtotal = cart?.total ?? 0;

  const proceedToCheckout = () => {
    if (!loggedIn) {
      Toast.show({ type: 'info', text1: 'Please login to complete purchase' });
      navigation.navigate('Login');
      return;
    }

    navigation.navigate('Checkout');
  };

  const Header = ({ showClear = false }: { showClear?: boolean }) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={C.text} size={20} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        My Cart{items.length > 0 ? ` (${items.length})` : ''}
      </Text>
      {showClear ? (
        <TouchableOpacity disabled={clearing || fetching} style={styles.clearBtn} onPress={clearAll}>
          {clearing ? (
            <ActivityIndicator size="small" color={C.accent} />
          ) : (
            <Text style={styles.clearText}>Clear all</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.itemCard, fetching && styles.itemCardDisabled]}>
      <View style={styles.itemImageWrap}>
        <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.product)} disabled={fetching} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={15} color={C.muted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemUnitPrice}>${item.price.toFixed(2)} each</Text>
        <View style={styles.itemBottomRow}>
          <View style={styles.qtyControls}>
            <TouchableOpacity style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]} disabled={item.quantity <= 1 || fetching} onPress={() => updateQty(item.product, item.quantity - 1)}>
              <Minus size={12} color={item.quantity <= 1 ? C.muted : C.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} disabled={fetching} onPress={() => updateQty(item.product, item.quantity + 1)}>
              <Plus size={12} color={C.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Header />
        <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!items.length) {
    const emptyTitle = loggedIn ? 'Your cart is empty' : 'Your guest cart is empty';
    const emptySub = loggedIn
      ? "You haven't added anything yet.\nExplore our wellness essentials."
      : "Add products as guest and login only when you're ready to checkout.";
    const ctaLabel = loggedIn ? 'Browse Products' : 'Start Guest Shopping';
    const ctaAction = () => navigation.navigate(loggedIn ? 'Products' : 'GuestShop');

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <Header />
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <ShoppingBag color={C.muted} size={40} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySub}>{emptySub}</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={ctaAction}>
            <Text style={styles.shopBtnText}>{ctaLabel}</Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          {!loggedIn && (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Header showClear />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.product}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 340 + insets.bottom },
        ]}
        onRefresh={() => { setFetching(true); loadCart(); }}
        refreshing={fetching}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.summaryCard, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.summaryInner}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryFree}>Free</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>${subtotal.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={proceedToCheckout}>
          <Text style={styles.checkoutBtnText}>{loggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
    marginTop: 40,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, color: C.text, fontFamily: 'Satoshi-Bold', letterSpacing: -0.2 },
  headerSpacer: { width: 70 },
  clearBtn: {
    minWidth: 70, height: 32, paddingHorizontal: 12, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface,
  },
  clearText: { color: C.accent, fontSize: 13, fontFamily: 'Satoshi-Medium' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { color: C.text, fontSize: 22, fontFamily: 'Satoshi-Bold', letterSpacing: -0.3, textAlign: 'center' },
  emptySub: { marginTop: 8, color: C.sub, fontSize: 15, textAlign: 'center', fontFamily: 'Satoshi-Regular', lineHeight: 22, marginBottom: 28 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 24, backgroundColor: C.accent },
  shopBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' },
  loginBtn: {
    marginTop: 12,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: { color: C.accent, fontSize: 14, fontFamily: 'Satoshi-Bold' },

  listContent: { padding: 16, paddingBottom: 240, gap: 12 },

  itemCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  itemCardDisabled: { opacity: 0.55 },
  itemImageWrap: { width: 88, height: 88, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F5F1EE', flexShrink: 0 },
  itemImage: { width: '100%', height: '100%' },
  itemBody: { flex: 1 },
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, color: C.text, fontSize: 16, fontFamily: 'Satoshi-Bold', lineHeight: 22, letterSpacing: -0.1 },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemUnitPrice: { marginTop: 5, color: C.sub, fontSize: 13.5, fontFamily: 'Satoshi-Regular' },
  itemBottomRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 999, overflow: 'hidden' },
  qtyBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyText: { minWidth: 34, textAlign: 'center', color: C.text, fontSize: 14.5, fontFamily: 'Satoshi-Bold' },
  itemTotal: { color: C.accent, fontSize: 18, fontFamily: 'Satoshi-Bold', letterSpacing: -0.2 },

  summaryCard: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
  summaryInner: { gap: 8, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: C.sub, fontSize: 15, fontFamily: 'Satoshi-Regular' },
  summaryValue: { color: C.text, fontSize: 15, fontFamily: 'Satoshi-Medium' },
  summaryFree: { color: C.success, fontSize: 15, fontFamily: 'Satoshi-Medium' },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  summaryTotalLabel: { color: C.text, fontSize: 16, fontFamily: 'Satoshi-Bold' },
  summaryTotalValue: { color: C.accent, fontSize: 22, fontFamily: 'Satoshi-Bold', letterSpacing: -0.4 },

  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 26, backgroundColor: C.accent,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Satoshi-Bold', letterSpacing: 0.1 },
});

export default CartScreen;
