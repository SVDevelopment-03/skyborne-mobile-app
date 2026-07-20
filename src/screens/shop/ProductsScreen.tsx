import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import BottomNav from '../../components/BottomNav';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {
  ProductSort,
  CartData,
  ShopCategory,
  ShopProduct,
  shopService,
} from '../../services/shopService';
import {
  ChevronLeft,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react-native';

type ProductsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Products'
>;
type ProductListItem = ShopProduct | string;

type ProductsHeaderProps = {
  navigation: ProductsNavigationProp;
  showBackButton: boolean;
  onBackPress: () => void;
  cartCount: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchFocused: boolean;
  setSearchFocused: (value: boolean) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: ShopCategory[];
  sortOptions: Array<{ label: string; value: ProductSort }>;
  sortBy: ProductSort;
  setSortBy: (value: ProductSort) => void;
  loading: boolean;
  productsCount: number;
};

const ProductsHeader: React.FC<ProductsHeaderProps> = React.memo(
  ({
    navigation,
    showBackButton,
    onBackPress,
    cartCount,
    searchInput,
    setSearchInput,
    searchFocused,
    setSearchFocused,
    category,
    setCategory,
    categories,
    sortOptions,
    sortBy,
    setSortBy,
    loading,
    productsCount,
  }) => (
    <>
      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroLeftWrap}>
          {showBackButton ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <ChevronLeft color={C.text} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.heroTextWrap}>
            {/* <Text style={styles.heroEyebrow}>✦  Skyborne Shop</Text> */}
            <Text style={styles.heroTitle}>Curated Wellness</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.cartButton}
        >
          <ShoppingCart color={C.text} size={20} strokeWidth={1.8} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <Search color={searchFocused ? C.accent : C.muted} size={16} strokeWidth={2} />
        <TextInput
          placeholder="Search products..."
          placeholderTextColor={C.muted}
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.searchInput}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchInput.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchInput('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.chipsWrap}>
        <TouchableOpacity
          style={[styles.chip, !category && styles.chipActive]}
          onPress={() => setCategory('')}
        >
          <Text style={[styles.chipText, !category && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(item => {
          const categoryId = item._id || item.id;
          if (!categoryId) {
            return null;
          }
          const label = item.title || item.name || 'Category';
          const isActive = category === categoryId;
          return (
            <TouchableOpacity
              key={categoryId}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setCategory(categoryId)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <SlidersHorizontal color={C.sub} size={13} strokeWidth={2} />
        <Text style={styles.sortLabel}>Sort:</Text>
        {sortOptions.map(opt => {
          const isActive = sortBy === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, isActive && styles.sortChipActive]}
              onPress={() => setSortBy(opt.value)}
            >
              <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Count */}
      {!loading && (
        <Text style={styles.countText}>
          {productsCount} {productsCount === 1 ? 'product' : 'products'}
        </Text>
      )}
    </>
  ),
);

// ─── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg: '#FAF8F6',
  surface: '#FFFFFF',
  border: '#F0EDE9',
  accent: '#B95E82',
  accentLight: '#FDF0F5',
  accentMid: '#F5D6E4',
  text: '#2C2C2C',
  sub: '#5F5F5F',
  muted: '#818181',
  price: '#B95E82',
};

type ProductsScreenProps = {
  showBottomNav?: boolean;
  showBackButton?: boolean;
};

const ProductsScreen: React.FC<ProductsScreenProps> = ({
  showBottomNav = true,
  showBackButton = false,
}) => {
  const navigation = useNavigation<ProductsNavigationProp>();
  const { width } = useWindowDimensions();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<ProductSort>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(
    {},
  );
  const [searchFocused, setSearchFocused] = useState(false);

  const deriveCategoriesFromProducts = useCallback((items: ShopProduct[]): ShopCategory[] => {
    const map = new Map<string, ShopCategory>();

    items.forEach(product => {
      const value = product?.category;
      if (!value) {
        return;
      }

      if (typeof value === 'string') {
        const existing = map.get(value);
        map.set(value, {
          _id: existing?._id || value,
          title: existing?.title || existing?.name || (product as any)?.categoryTitle || (product as any)?.categoryName || 'Category',
          name: existing?.name,
        });
        return;
      }

      const categoryObj = value as any;
      const categoryId = categoryObj?._id || categoryObj?.id;
      if (!categoryId) {
        return;
      }

      map.set(categoryId, {
        _id: categoryObj?._id || categoryId,
        id: categoryObj?.id,
        title: categoryObj?.title || categoryObj?.name || categoryObj?.label || (product as any)?.categoryTitle || (product as any)?.categoryName || 'Category',
        name: categoryObj?.name,
      });
    });

    return Array.from(map.values());
  }, []);

  const numColumns = width >= 900 ? 3 : 2;
  const skeletonItems = useMemo(
    () => Array.from({ length: numColumns * 4 }, (_, index) => `skeleton-${index}`),
    [numColumns],
  );
  const isInitialLoading = loading && page === 1;
  const listData: ProductListItem[] = isInitialLoading ? skeletonItems : products;
  const pageLimit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const syncCartState = useCallback((cart?: CartData | null) => {
    if (!cart?.items?.length) {
      setCartCount(0);
      setCartQuantities({});
      return;
    }

    setCartCount(cart.items.length);
    const quantityMap = cart.items.reduce((acc, item) => {
      acc[item.product] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
    setCartQuantities(quantityMap);
  }, []);

  const loadCartCount = useCallback(async () => {
    try {
      const cart = await shopService.getMyCart();
      syncCartState(cart);
    } catch {
      setCartCount(0);
      setCartQuantities({});
    }
  }, [syncCartState]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await shopService.getActiveEcomCategories();
      console.log('[ProductsScreen] all categories from API:', data);
      console.log(
        '[ProductsScreen] category labels:',
        data.map(item => ({ id: item._id, title: item.title, name: item.name })),
      );
      setCategories(data);
    } catch (error) {
      console.log('[ProductsScreen] category load error:', error);
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(
    async ({ nextPage = 1, append = false }: { nextPage?: number; append?: boolean } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await shopService.getPublishedProducts({
          search: debouncedSearch || undefined,
          categoryId: category || undefined,
          category: category || undefined,
          sortBy,
          page: nextPage,
          limit: pageLimit,
        });
        const data = response.products;
        const pagination = response.pagination;
        setProducts(prev => (append ? [...prev, ...data] : data));
        if (!categories.length) {
          const derivedCategories = deriveCategoriesFromProducts(data);
          if (derivedCategories.length) {
            setCategories(derivedCategories);
          }
        }
        if (pagination) {
          setHasNextPage(Boolean(pagination.hasNextPage));
        } else {
          setHasNextPage(data.length === pageLimit);
        }
        setPage(nextPage);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load products',
          text2: error?.response?.data?.message ?? error?.message,
        });
        if (!append) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, category, sortBy, categories.length, deriveCategoriesFromProducts],
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setHasNextPage(true);
    setPage(1);
    loadProducts({ nextPage: 1, append: false });
  }, [loadProducts]);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [loadCartCount]),
  );

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('GuestHome');
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProducts({ nextPage: 1, append: false }), loadCartCount()]);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasNextPage) {
      return;
    }
    loadProducts({ nextPage: page + 1, append: true });
  };

  const updateQuantityLocal = (productId: string, quantity: number) => {
    setCartQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const removeQuantityLocal = (productId: string) => {
    setCartQuantities(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handleAddToCart = async (productId: string) => {
    const previousQty = cartQuantities[productId] ?? 0;
    try {
      setAddingProductId(productId);
      updateQuantityLocal(productId, 1);
      const cart = await shopService.addToCart({ productId, quantity: 1 });
      syncCartState(cart);
      Toast.show({ type: 'success', text1: '✓ Added to cart' });
    } catch (error: any) {
      if (previousQty > 0) {
        updateQuantityLocal(productId, previousQty);
      } else {
        removeQuantityLocal(productId);
      }
      Toast.show({
        type: 'error',
        text1: 'Oops! Try again',
        text2: error?.response?.data?.message ?? error?.message,
      });
    } finally {
      setAddingProductId(null);
    }
  };

  const handleIncrement = async (productId: string, currentQty: number) => {
    const nextQty = currentQty + 1;
    try {
      setAddingProductId(productId);
      updateQuantityLocal(productId, nextQty);
      const cart = await shopService.updateCartItem(productId, nextQty);
      syncCartState(cart);
    } catch (error: any) {
      updateQuantityLocal(productId, currentQty);
      Toast.show({
        type: 'error',
        text1: 'Oops! Try again',
        text2: error?.response?.data?.message ?? error?.message,
      });
    } finally {
      setAddingProductId(null);
    }
  };

  const handleDecrement = async (productId: string, currentQty: number) => {
    const nextQty = currentQty - 1;
    try {
      setAddingProductId(productId);
      if (nextQty <= 0) {
        removeQuantityLocal(productId);
        const cart = await shopService.removeCartItem(productId);
        syncCartState(cart);
      } else {
        updateQuantityLocal(productId, nextQty);
        const cart = await shopService.updateCartItem(productId, nextQty);
        syncCartState(cart);
      }
    } catch (error: any) {
      updateQuantityLocal(productId, currentQty);
      Toast.show({
        type: 'error',
        text1: 'Oops! Try again',
        text2: error?.response?.data?.message ?? error?.message,
      });
    } finally {
      setAddingProductId(null);
    }
  };

  const sortOptions: Array<{ label: string; value: ProductSort }> = useMemo(
    () => [
      { label: 'Newest', value: 'newest' },
      { label: 'Price ↓', value: 'price-low' },
      { label: 'Price ↑', value: 'price-high' },
    ],
    [],
  );

  const resolveCategoryLabel = useCallback(
    (categoryValue: ShopProduct['category']) => {
      if (!categoryValue) return '';

      if (typeof categoryValue === 'object') {
        const categoryObj = categoryValue as any;
        const directLabel =
          categoryObj?.title || categoryObj?.name || categoryObj?.label || '';

        if (directLabel) {
          return directLabel;
        }

        const objectId = categoryObj?._id || categoryObj?.id;
        if (objectId) {
          const byId = categories.find(
            item => item._id === objectId || item.id === objectId,
          );
          if (byId) {
            return byId.title || byId.name || '';
          }
        }

        return '';
      }

      if (typeof categoryValue === 'string') {
        const byId = categories.find(
          item => item._id === categoryValue || item.id === categoryValue,
        );
        if (byId) {
          return byId.title || byId.name || '';
        }
      }

      return '';
    },
    [categories],
  );

  // ─── Product Card ─────────────────────────────────────────────────────────
  const renderProduct = ({ item, index }: { item: ShopProduct; index: number }) => {
    const isAdding = addingProductId === item._id;
    const quantity = cartQuantities[item._id] ?? 0;
    const cardWidthStyle = numColumns === 3 ? styles.cardTriple : styles.cardDouble;
    const categoryLabel =
      resolveCategoryLabel(item.category) ||
      ((item as any)?.categoryTitle ?? (item as any)?.categoryName ?? 'Category');

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('ProductDetails', { productId: item._id })
        }
        style={[
          styles.card,
          cardWidthStyle,
        ]}
      >
        <View style={styles.cardImageWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || 'Wellness essential'}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>${item.price}</Text>
            {quantity === 0 ? (
              <TouchableOpacity
                style={[styles.addBtn, isAdding && styles.addBtnLoading]}
                disabled={isAdding}
                onPress={() => handleAddToCart(item._id)}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addBtnText}>+ Cart</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyWrap}>
                <TouchableOpacity
                  style={[styles.qtyBtn, isAdding && styles.qtyBtnDisabled]}
                  disabled={isAdding}
                  onPress={() => handleDecrement(item._id, quantity)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, isAdding && styles.qtyBtnDisabled]}
                  disabled={isAdding}
                  onPress={() => handleIncrement(item._id, quantity)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeletonCard = ({ index }: { index: number }) => {
    const cardWidthStyle = numColumns === 3 ? styles.cardTriple : styles.cardDouble;
    return (
      <View
        style={[
          styles.card,
          cardWidthStyle,
        ]}
      >
        <View style={[styles.cardImageWrap, styles.skeletonImage]} />
        <View style={styles.cardBody}>
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonDesc]} />
          <View style={[styles.skeletonLine, styles.skeletonDescShort]} />

          <View style={styles.cardFooter}>
            <View style={[styles.skeletonLine, styles.skeletonPrice]} />
            <View style={styles.skeletonAddBtn} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <FlatList
        data={listData}
        key={`cols-${numColumns}`}
        numColumns={numColumns}
        keyExtractor={(item, index) =>
          typeof item === 'string' ? item : `${item._id}-${index}`
        }
        renderItem={({ item, index }) =>
          typeof item === 'string'
            ? renderSkeletonCard({ index })
            : renderProduct({ item, index })
        }
        ListHeaderComponent={
          <ProductsHeader
            navigation={navigation}
            showBackButton={showBackButton}
            onBackPress={handleBackPress}
            cartCount={cartCount}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            category={category}
            setCategory={setCategory}
            categories={categories}
            sortOptions={sortOptions}
            sortBy={sortBy}
            setSortBy={setSortBy}
            loading={loading}
            productsCount={products.length}
          />
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListEmptyComponent={
          !loading && products.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🌿</Text>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyText}>
                Try a different filter or search term
              </Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={C.accent} />
            </View>
          ) : null
        }
      />

      {showBottomNav ? <BottomNav active="Products" /> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 55 : 38,
    paddingBottom: 16,
  },
  heroLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  heroTextWrap: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroEyebrow: {
    fontSize: 11,
    color: C.accent,
    fontFamily: 'Satoshi-Medium',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 30,
    color: C.text,
    fontFamily: 'Satoshi-Bold',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.bg,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Satoshi-Bold',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchWrapFocused: {
    borderColor: C.accent,
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontFamily: 'Satoshi-Regular',
    fontSize: 15,
    lineHeight: 21,
    padding: 0,
  },
  searchClear: {
    color: C.muted,
    fontSize: 13,
    paddingHorizontal: 4,
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipsWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    rowGap: 8,
    columnGap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipText: {
    color: C.sub,
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // ── Sort ─────────────────────────────────────────────────────────────────
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  sortLabel: {
    color: C.sub,
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
  },
  sortChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  sortChipActive: {
    backgroundColor: C.accentLight,
    borderColor: C.accentMid,
  },
  sortChipText: {
    color: C.sub,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
  },
  sortChipTextActive: {
    color: C.accent,
    fontFamily: 'Satoshi-Medium',
  },

  // ── Count ────────────────────────────────────────────────────────────────
  countText: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
  },

  // ── FlatList ──────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSingle: {
    width: '100%',
  },
  cardDouble: {
    width: '48.4%',
  },
  cardTriple: {
    width: '31.8%',
  },
  cardImageWrap: {
    width: '100%',
    height: 150,
    backgroundColor: '#F5F1EE',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(185, 94, 130, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    color: C.text,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: -0.1,
  },
  cardDesc: {
    marginTop: 5,
    color: C.sub,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    lineHeight: 19,
    minHeight: 38,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    color: C.price,
    fontSize: 20,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: -0.3,
  },
  addBtn: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 13,
    backgroundColor: C.accent,
    minWidth: 72,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnLoading: {
    opacity: 0.75,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'Satoshi-Bold',
    letterSpacing: 0.2,
  },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    backgroundColor: C.accentMid,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    lineHeight: 16,
  },
  qtyValue: {
    color: C.text,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    minWidth: 18,
    textAlign: 'center',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonImage: {
    backgroundColor: '#EFEAE6',
  },
  skeletonLine: {
    backgroundColor: '#EFEAE6',
    borderRadius: 8,
  },
  skeletonTitle: {
    width: '78%',
    height: 13,
  },
  skeletonDesc: {
    marginTop: 8,
    width: '92%',
    height: 10,
  },
  skeletonDescShort: {
    marginTop: 6,
    width: '65%',
    height: 10,
  },
  skeletonPrice: {
    width: 52,
    height: 16,
  },
  skeletonAddBtn: {
    width: 64,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#E7DDD8',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
  },
  emptyText: {
    color: C.muted,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default ProductsScreen;
