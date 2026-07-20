import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import BottomNav from '../../components/BottomNav';
import { Package, ChevronLeft, ChevronRight, Search, CreditCard, Truck, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { ShopOrder, shopService } from '../../services/shopService';
import Toast from 'react-native-toast-message';

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
  successBg: '#EEF8F3',
  warning: '#C47D00',
  warningBg: '#FEF6E6',
  info: '#2563EB',
  infoBg: '#EEF3FE',
  cancelled: '#7A7A7A',
  cancelledBg: '#F4F4F4',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  pending:    { color: C.warning,   bg: C.warningBg,   icon: Clock },
  confirmed:  { color: C.info,      bg: C.infoBg,      icon: CheckCircle },
  processing: { color: C.warning,   bg: C.warningBg,   icon: Clock },
  shipped:    { color: C.info,      bg: C.infoBg,      icon: Truck },
  delivered:  { color: C.success,   bg: C.successBg,   icon: CheckCircle },
  refunded:   { color: C.cancelled, bg: C.cancelledBg, icon: XCircle },
  failed:     { color: C.cancelled, bg: C.cancelledBg, icon: XCircle },
  cancelled:  { color: C.cancelled, bg: C.cancelledBg, icon: XCircle },
  canceled:   { color: C.cancelled, bg: C.cancelledBg, icon: XCircle },
};

const normalizeStatusKey = (value?: string) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

const formatStatusLabel = (value?: string) =>
  normalizeStatusKey(value)
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getStatusCfg = (status?: string) =>
  STATUS_CONFIG[normalizeStatusKey(status)] ?? { color: C.muted, bg: '#F4F4F4', icon: Package };

const statusList = ['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const MyOrdersScreen = () => {
  const [orders, setOrders] = React.useState<ShopOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [status, setStatus] = React.useState('all');
  const [searchInput, setSearchInput] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedOrder, setSelectedOrder] = React.useState<ShopOrder | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadOrders = React.useCallback(async () => {
    try {
      const data = await shopService.getMyOrders({
        page: 1, limit: 20,
        search: debouncedSearch || undefined,
        status: status !== 'all' ? status : undefined,
      });
      setOrders(data);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to load orders', text2: error?.response?.data?.message ?? error?.message });
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, status]);

  React.useEffect(() => { setLoading(true); loadOrders(); }, [loadOrders]);

  const onRefresh = async () => { setRefreshing(true); await loadOrders(); };

  // ─── Order Card ────────────────────────────────────────────────────────────
  const renderOrder = ({ item }: { item: ShopOrder }) => {
    const cfg = getStatusCfg(item.orderStatus);
    const StatusIcon = cfg.icon;
    const paymentStatusKey = normalizeStatusKey(item.paymentStatus);
    const isPaid = paymentStatusKey === 'paid' || paymentStatusKey === 'completed' || paymentStatusKey === 'success';

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.orderCard}
        onPress={() => setSelectedOrder(item)}
      >
        {/* Left icon */}
        <View style={[styles.orderIconWrap, { backgroundColor: cfg.bg }]}>
          <Package color={cfg.color} size={20} strokeWidth={1.8} />
        </View>

        {/* Body */}
        <View style={styles.orderBody}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId} numberOfLines={1} ellipsizeMode="tail">{item.orderNumber}</Text>
            <Text style={styles.orderAmount}>${item.totalAmount?.toFixed(2)}</Text>
          </View>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <View style={styles.pillRow}>
            {/* Status pill */}
            <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
              <StatusIcon size={10} color={cfg.color} strokeWidth={2.5} />
              <Text style={[styles.pillText, { color: cfg.color }]} numberOfLines={1}>
                {formatStatusLabel(item.orderStatus)}
              </Text>
            </View>
            {/* Payment pill */}
            <View style={[styles.pill, { backgroundColor: isPaid ? C.successBg : C.warningBg }]}>
              <CreditCard size={10} color={isPaid ? C.success : C.warning} strokeWidth={2.5} />
              <Text style={[styles.pillText, { color: isPaid ? C.success : C.warning }]} numberOfLines={1}>
                {formatStatusLabel(item.paymentStatus)}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <ChevronRight size={16} color={C.muted} strokeWidth={2} style={styles.arrowIcon} />
      </TouchableOpacity>
    );
  };

  // ─── Order Detail View ─────────────────────────────────────────────────────
  if (selectedOrder) {
    const cfg = getStatusCfg(selectedOrder.orderStatus);
    const StatusIcon = cfg.icon;
    const paymentStatusKey = normalizeStatusKey(selectedOrder.paymentStatus);
    const isPaid = paymentStatusKey === 'paid' || paymentStatusKey === 'completed' || paymentStatusKey === 'success';

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedOrder(null)}>
            <ChevronLeft color={C.text} size={20} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
            <StatusIcon size={22} color={cfg.color} strokeWidth={1.8} />
            <View style={styles.statusBannerText}>
              <Text style={[styles.statusBannerTitle, { color: cfg.color }]}>
                {formatStatusLabel(selectedOrder.orderStatus)}
              </Text>
              <Text style={styles.statusBannerSub}>{selectedOrder.orderNumber}</Text>
            </View>
          </View>

          {/* Meta card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Order Info</Text>
            <View style={styles.detailDivider} />
            <MetaRow label="Order Date" value={new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <MetaRow label="Payment Method" value={selectedOrder.paymentMethod} />
            <MetaRow
              label="Payment Status"
              valueEl={
                <View style={[styles.pill, { backgroundColor: isPaid ? C.successBg : C.warningBg }]}>
                  <Text style={[styles.pillText, { color: isPaid ? C.success : C.warning }]}>
                    {formatStatusLabel(selectedOrder.paymentStatus)}
                  </Text>
                </View>
              }
            />
            <MetaRow
              label="Total"
              valueEl={<Text style={styles.detailTotal}>${selectedOrder.totalAmount?.toFixed(2)}</Text>}
            />
          </View>

          {/* Items card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Items Ordered</Text>
            <View style={styles.detailDivider} />
            {selectedOrder.items?.map((item, idx) => (
              <View
                key={`${item.product}-${idx}`}
                style={[styles.detailItem, idx === (selectedOrder.items!.length - 1) && styles.detailItemLast]}
              >
                <Image source={{ uri: item.image }} style={styles.detailImage} resizeMode="cover" />
                <View style={styles.detailItemBody}>
                  <Text style={styles.detailItemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.detailItemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.detailItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <BottomNav active="Profile" />
      </SafeAreaView>
    );
  }

  // ─── Orders List ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heroTitle}>My Orders</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Search color={searchFocused ? C.accent : C.muted} size={16} strokeWidth={2} />
        <TextInput
          placeholder="Search by order number..."
          placeholderTextColor={C.muted}
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.searchInput}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsWrap}
      >
        {statusList.map(item => {
          const isActive = status === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setStatus(item)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {item === 'all' ? 'All' : item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Package color={C.muted} size={38} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySub}>Try a different filter or search term</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderOrder}
          style={styles.ordersList}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNav active="Profile" />
    </SafeAreaView>
  );
};

// ─── Helper component ──────────────────────────────────────────────────────
const MetaRow = ({
  label,
  value,
  valueEl,
}: {
  label: string;
  value?: string;
  valueEl?: React.ReactNode;
}) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    {valueEl ?? <Text style={styles.metaValue}>{value}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 34,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, marginTop:10, color: C.text, fontFamily: 'Satoshi-Bold', letterSpacing: -0.2 },
  heroEyebrow: { fontSize: 11, color: C.accent, fontFamily: 'Satoshi-Medium', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  heroTitle: { fontSize: 28, color: C.text, fontFamily: 'Satoshi-Bold', letterSpacing: -0.5 },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    marginHorizontal: 20, marginTop: 12,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface,
  },
  searchWrapFocused: { borderColor: C.accent },
  searchInput: { flex: 1, color: C.text, fontFamily: 'Satoshi-Regular', fontSize: 14, padding: 0 },
  searchClear: { color: C.muted, fontSize: 13, paddingHorizontal: 4 },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsScroll: { flexGrow: 0, maxHeight: 52, marginBottom: 10 },
  chipsWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0, gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, maxHeight:40,
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.sub, fontSize: 13, fontFamily: 'Satoshi-Medium' },
  chipTextActive: { color: '#FFFFFF' },

  // ── List ──────────────────────────────────────────────────────────────────
  ordersList: { flex: 1, marginTop: 0 },
  listContent: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 70, gap: 10 },

  // ── Order Card ────────────────────────────────────────────────────────────
  orderCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  orderIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  orderBody: { flex: 1 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { flex: 1, marginRight: 10, color: C.text, fontSize: 14, fontFamily: 'Satoshi-Bold', letterSpacing: -0.1 },
  orderAmount: { color: C.accent, fontSize: 15, fontFamily: 'Satoshi-Bold', flexShrink: 0 },
  orderDate: { color: C.muted, fontSize: 12, fontFamily: 'Satoshi-Regular', marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  pillText: { fontSize: 11, fontFamily: 'Satoshi-Bold', maxWidth: 140 },
  arrowIcon: { flexShrink: 0 },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { color: C.text, fontSize: 18, fontFamily: 'Satoshi-Bold' },
  emptySub: { color: C.muted, fontSize: 13, fontFamily: 'Satoshi-Regular', marginTop: 6, textAlign: 'center' },

  // ── Detail View ────────────────────────────────────────────────────────────
  detailScroll: { padding: 16, paddingBottom: 120, gap: 12 },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  statusBannerText: { flex: 1 },
  statusBannerTitle: { fontSize: 16, fontFamily: 'Satoshi-Bold', letterSpacing: -0.1 },
  statusBannerSub: { color: C.sub, fontSize: 12, fontFamily: 'Satoshi-Regular', marginTop: 2 },

  detailCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    gap: 10,
  },
  detailCardTitle: { color: C.text, fontSize: 15, fontFamily: 'Satoshi-Bold', letterSpacing: -0.1 },
  detailDivider: { height: 1, backgroundColor: C.border, marginBottom: 2 },

  metaRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  metaLabel: { color: C.sub, fontSize: 13, fontFamily: 'Satoshi-Regular' },
  metaValue: { color: C.text, fontSize: 13, fontFamily: 'Satoshi-Medium', flex: 1, textAlign: 'right' },
  detailTotal: { color: C.accent, fontSize: 20, fontFamily: 'Satoshi-Bold', letterSpacing: -0.3 },

  detailItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  detailItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  detailImage: { width: 54, height: 54, borderRadius: 12, backgroundColor: '#F5F1EE' },
  detailItemBody: { flex: 1 },
  detailItemName: { color: C.text, fontSize: 13, fontFamily: 'Satoshi-Medium', lineHeight: 18 },
  detailItemQty: { color: C.muted, fontSize: 12, fontFamily: 'Satoshi-Regular', marginTop: 3 },
  detailItemPrice: { color: C.text, fontSize: 14, fontFamily: 'Satoshi-Bold' },
});

export default MyOrdersScreen;
