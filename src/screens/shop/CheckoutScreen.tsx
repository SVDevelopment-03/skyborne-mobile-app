import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { ChevronLeft, Lock, ArrowRight, MapPin, User, ShoppingBag } from 'lucide-react-native';
import { CartData, shopService } from '../../services/shopService';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;
type FormState = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
};

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF8F6',
  surface: '#FFFFFF',
  border: '#F0EDE9',
  accent: '#B95E82',
  accentLight: '#FDF0F5',
  text: '#2C2C2C',
  sub: '#7A7A7A',
  muted: '#ADADAD',
  success: '#3A9E6A',
  error: '#D94F4F',
  errorBg: '#FEF0F0',
};

const APP_CHECKOUT_CALLBACK = 'skybornedrop://payment-processing';

const InputField = ({
  value,
  onChangeText,
  placeholder,
  keyboard,
  flex,
  hasError,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboard?: 'email-address' | 'phone-pad' | 'default';
  flex?: number;
  hasError: boolean;
}) => (
  <TextInput
    style={[styles.input, hasError && styles.inputError, flex !== undefined && { flex }]}
    placeholder={placeholder}
    placeholderTextColor={C.muted}
    keyboardType={keyboard ?? 'default'}
    autoCapitalize={keyboard ? 'none' : 'words'}
    value={value}
    onChangeText={onChangeText}
  />
);

const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const loggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const [cart, setCart] = React.useState<CartData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    email: '', phone: '', firstName: '', lastName: '', address: '', city: '', zip: '',
  });
  const [showErrors, setShowErrors] = React.useState(false);

  const loadCart = React.useCallback(async () => {
    try {
      const data = await shopService.getMyCart();
      setCart(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to load cart', text2: error?.response?.data?.message ?? error?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadCart(); }, [loadCart]);

  const cartItems = cart?.items ?? [];
  const total = cart?.total ?? 0;

  const set = (key: keyof FormState) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const hasError = (field: keyof FormState) =>
    showErrors && String(form[field] || '').trim().length === 0;

  const submit = async () => {

    if (!loggedIn) {
      Toast.show({ type: 'info', text1: 'Please login to complete purchase' });
      navigation.navigate('Login');
      return;
    }

    console.log('👉 PAY BUTTON PRESSED');

    const payload = {
      shippingAddress: {
        firstName: form.firstName,
        lastName: form.lastName,
        address: form.address,
        city: form.city,
        zip: form.zip,
        email: form.email,
        phone: form.phone,
      },
      source: 'app',
    };

    console.log('📦 PAYLOAD STRIPE KO JAA RAHA HAI:', payload);
    
    if (!cartItems.length) {
      Toast.show({ type: 'error', text1: 'Your cart is empty' });
      return;
    }
    const required = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'zip'] as const;
    const missing = required.some(f => !String(form[f] || '').trim());
    setShowErrors(missing);
    if (missing) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    try {
      setSubmitting(true);
      const result = await shopService.createCheckoutSession({
        shippingAddress: {
          firstName: form.firstName, lastName: form.lastName,
          address: form.address, city: form.city, zip: form.zip,
          email: form.email, phone: form.phone,
        },
        source: 'app',
        successUrl: `${APP_CHECKOUT_CALLBACK}?status=success&sessionId={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${APP_CHECKOUT_CALLBACK}?status=cancelled`,
      });
      await Linking.openURL(result.checkoutUrl);
      Toast.show({ type: 'success', text1: 'Redirecting to secure checkout…' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Checkout failed', text2: error?.response?.data?.message ?? error?.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={C.text} size={20} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.secureTag}>
          <Lock size={11} color={C.success} strokeWidth={2.5} />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!cartItems.length ? (
            /* Empty cart */
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <ShoppingBag size={40} color={C.muted} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Nothing to checkout</Text>
              <Text style={styles.emptySub}>Add products to your cart first.</Text>
              <TouchableOpacity style={styles.accentBtn} onPress={() => navigation.navigate('Products')}>
                <Text style={styles.accentBtnText}>Browse Products</Text>
                <ArrowRight size={16} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Contact Section ─────────────────────────────────── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <User size={14} color={C.accent} strokeWidth={2} />
                  </View>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                </View>
                <InputField
                  value={form.email}
                  onChangeText={set('email')}
                  placeholder="Email address"
                  keyboard="email-address"
                  hasError={hasError('email')}
                />
                <InputField
                  value={form.phone}
                  onChangeText={set('phone')}
                  placeholder="Phone number"
                  keyboard="phone-pad"
                  hasError={hasError('phone')}
                />
              </View>

              {/* ── Shipping Section ────────────────────────────────── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <MapPin size={14} color={C.accent} strokeWidth={2} />
                  </View>
                  <Text style={styles.sectionTitle}>Shipping Address</Text>
                </View>
                <View style={styles.row}>
                  <InputField
                    value={form.firstName}
                    onChangeText={set('firstName')}
                    placeholder="First name"
                    flex={1}
                    hasError={hasError('firstName')}
                  />
                  <InputField
                    value={form.lastName}
                    onChangeText={set('lastName')}
                    placeholder="Last name"
                    flex={1}
                    hasError={hasError('lastName')}
                  />
                </View>
                <InputField
                  value={form.address}
                  onChangeText={set('address')}
                  placeholder="Street address"
                  hasError={hasError('address')}
                />
                <View style={styles.row}>
                  <InputField
                    value={form.city}
                    onChangeText={set('city')}
                    placeholder="City"
                    flex={1}
                    hasError={hasError('city')}
                  />
                  <InputField
                    value={form.zip}
                    onChangeText={set('zip')}
                    placeholder="ZIP code"
                    flex={0.55}
                    hasError={hasError('zip')}
                  />
                </View>
              </View>

              {/* ── Order Summary ───────────────────────────────────── */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <ShoppingBag size={14} color={C.accent} strokeWidth={2} />
                  </View>
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                </View>

                {cartItems.map(item => (
                  <View key={item.product} style={styles.orderItem}>
                    <Image source={{ uri: item.image }} style={styles.orderImage} resizeMode="cover" />
                    <View style={styles.orderBody}>
                      <Text style={styles.orderName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.orderQty}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.orderAmount}>${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={styles.totalsValue}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Shipping</Text>
                  <Text style={styles.totalsFree}>Free</Text>
                </View>
                <View style={[styles.totalsRow, styles.totalsRowFinal]}>
                  <Text style={styles.totalsFinalLabel}>Total</Text>
                  <Text style={styles.totalsFinalValue}>${total.toFixed(2)}</Text>
                </View>
              </View>

              {/* ── Pay Button ──────────────────────────────────────── */}
              <TouchableOpacity
                style={[styles.payBtn, submitting && styles.payBtnDisabled]}
                onPress={submit}
                disabled={submitting}
                activeOpacity={0.88}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Lock size={15} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.payBtnText}>Pay ${total.toFixed(2)}</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.secureNote}>
                🔒 Your payment is encrypted and processed securely via Stripe.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  // ── Header ────────────────────────────────────────────────────────────────
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
  secureTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, backgroundColor: '#EEF8F3',
    borderWidth: 1, borderColor: '#C8EADA',
  },
  secureText: { color: C.success, fontSize: 11, fontFamily: 'Satoshi-Medium' },

  // ── Scroll content ────────────────────────────────────────────────────────
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { color: C.text, fontSize: 15, fontFamily: 'Satoshi-Bold', letterSpacing: -0.1 },

  // ── Inputs ────────────────────────────────────────────────────────────────
  row: { flexDirection: 'row', gap: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 11,
    color: C.text, fontSize: 14, fontFamily: 'Satoshi-Regular',
    backgroundColor: C.bg,
  },
  inputError: { borderColor: C.error, backgroundColor: C.errorBg },

  // ── Order items ───────────────────────────────────────────────────────────
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderImage: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F5F1EE' },
  orderBody: { flex: 1 },
  orderName: { color: C.text, fontSize: 13, fontFamily: 'Satoshi-Medium' },
  orderQty: { color: C.muted, fontSize: 12, fontFamily: 'Satoshi-Regular', marginTop: 2 },
  orderAmount: { color: C.text, fontSize: 14, fontFamily: 'Satoshi-Bold' },

  // ── Totals ────────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  totalsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalsRowFinal: { marginTop: 4 },
  totalsLabel: { color: C.sub, fontSize: 14, fontFamily: 'Satoshi-Regular' },
  totalsValue: { color: C.text, fontSize: 14, fontFamily: 'Satoshi-Medium' },
  totalsFree: { color: C.success, fontSize: 14, fontFamily: 'Satoshi-Medium' },
  totalsFinalLabel: { color: C.text, fontSize: 16, fontFamily: 'Satoshi-Bold' },
  totalsFinalValue: { color: C.accent, fontSize: 22, fontFamily: 'Satoshi-Bold', letterSpacing: -0.4 },

  // ── Pay button ────────────────────────────────────────────────────────────
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: 27, backgroundColor: C.accent, marginTop: 4,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Satoshi-Bold', letterSpacing: 0.1 },
  secureNote: { textAlign: 'center', color: C.muted, fontSize: 12, fontFamily: 'Satoshi-Regular', marginTop: 8, lineHeight: 18 },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { color: C.text, fontSize: 20, fontFamily: 'Satoshi-Bold', letterSpacing: -0.3 },
  emptySub: { color: C.sub, fontSize: 14, fontFamily: 'Satoshi-Regular', marginTop: 6, marginBottom: 24 },
  accentBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 24, borderRadius: 24, backgroundColor: C.accent },
  accentBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Satoshi-Bold' },
});

export default CheckoutScreen;
