

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {
  Minus,
  ShoppingCart,
  Plus,
  ChevronLeft,
  CircleCheck,
  Loader2,
  Star,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {ProductSort, ShopProduct, shopService} from '../../services/shopService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;
type ProductTab = 'description' | 'specs' | 'shipping' | 'reviews';

type ProductSpec = {
  label: string;
  value: string;
};

type RelatedProductsState = {
  loading: boolean;
  items: ShopProduct[];
};

const FEATURE_KEYS = [
  'featureBullet1',
  'featureBullet2',
  'featureBullet3',
  'featureBullet4',
  'featureBullet5',
] as const;

const MASTER_FIELD_LABELS: Record<string, string> = {
  productSubCategory: 'Product Subcategory',
  productSubtype: 'Product Subtype',
  productTitle: 'Product Title',
  barCode: 'Barcode',
  ingredientsAndMaterial: 'Ingredients & Material',
  size: 'Size',
  colour: 'Colour',
  productLength: 'Product Length',
  productHeight: 'Product Height',
  productWidthDepth: 'Product Width / Depth',
  productWeight: 'Product Weight',
  ingredientsAndNutritionalInformation: 'Ingredients & Nutritional Information',
  manufacturerName: 'Manufacturer Name',
  importerName: 'Importer Name',
  countryOfOrigin: 'Country of Origin',
  importerAddress: 'Importer Address',
  packagerNameAndAddress: 'Packager Name & Address',
  returnAndExchangeTerms: 'Return & Exchange Terms',
  manufactureDate: 'Manufacture Date',
  expiryDate: 'Expiry Date',
};

const UNIT_PAIRS: Record<string, string> = {
  size: 'sizeUnit',
  productLength: 'productLengthUnit',
  productHeight: 'productHeightUnit',
  productWidthDepth: 'productWidthDepthUnit',
  productWeight: 'productWeightUnit',
  shippingLength: 'shippingLengthUnit',
  shippingHeight: 'shippingHeightUnit',
  shippingWidthDepth: 'shippingWidthDepthUnit',
  shippingWeight: 'shippingWeightUnit',
  recommendedRetailPrice: 'recommendedRetailPriceAEUnit',
};

const EXCLUDED_MASTER_KEYS = new Set([
  'productCategory',
  'partnerSkuUniqueCode',
  'gtinUpc',
  'featureBullet1',
  'featureBullet2',
  'featureBullet3',
  'featureBullet4',
  'featureBullet5',
  'whatIsInTheBox',
  'longDescription',
  'shippingLength',
  'shippingHeight',
  'shippingWidthDepth',
  'shippingWeight',
  'sizeUnit',
  'productLengthUnit',
  'productHeightUnit',
  'productWidthDepthUnit',
  'productWeightUnit',
  'shippingLengthUnit',
  'shippingHeightUnit',
  'shippingWidthDepthUnit',
  'shippingWeightUnit',
  'recommendedRetailPrice',
  'recommendedRetailPriceAEUnit',
  'hsCode',
]);

const C = {
  bg: '#FAF8F6',
  surface: '#FFFFFF',
  border: '#F0EDE9',
  accent: '#B95E82',
  accent2: '#F39F9F',
  accentSoft: '#FFF3F8',
  text: '#2C2C2C',
  sub: '#5F5F5F',
  muted: '#7D7D7D',
  chip: '#FFE8F1',
};

const ProductDetailsScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [savingInterest, setSavingInterest] = useState(false);
  const [interestSaved, setInterestSaved] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ProductTab>('description');
  const [activeImage, setActiveImage] = useState('');
  const [related, setRelated] = useState<RelatedProductsState>({
    loading: true,
    items: [],
  });

  const {productId} = route.params;

  const readString = (value: unknown): string => {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value).trim();
  };

  const normalizeSpecKey = (label?: string) =>
    (label || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const formatSpecLabel = (label?: string) =>
    (label || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, letter => letter.toUpperCase());

  const buildMasterSpecs = useCallback(
    (item?: ShopProduct | null): ProductSpec[] => {
      if (!item) {
        return [];
      }

      const entries = Object.entries(item as Record<string, unknown>);

      return entries
        .filter(([key]) => MASTER_FIELD_LABELS[key] && !EXCLUDED_MASTER_KEYS.has(key))
        .map(([key, rawValue]) => {
          const value = readString(rawValue);
          if (!value) {
            return null;
          }
          const unitKey = UNIT_PAIRS[key];
          const unitValue = unitKey
            ? readString((item as Record<string, unknown>)[unitKey])
            : '';

          return {
            label: MASTER_FIELD_LABELS[key],
            value:
              unitValue && key === 'recommendedRetailPrice'
                ? `${unitValue} ${value}`
                : unitValue
                  ? `${value} ${unitValue}`
                  : value,
          };
        })
        .filter(Boolean) as ProductSpec[];
    },
    [],
  );

  const imageUrls = useMemo(() => {
    if (Array.isArray(product?.images) && product?.images.length > 0) {
      return (product.images as string[]).filter(Boolean);
    }
    if (product?.image) {
      return [product.image];
    }
    return [] as string[];
  }, [product]);

  useEffect(() => {
    if (!imageUrls.length) {
      setActiveImage('');
      return;
    }
    if (!activeImage || !imageUrls.includes(activeImage)) {
      setActiveImage(imageUrls[0]);
    }
  }, [imageUrls, activeImage]);

  const loadCart = useCallback(async () => {
    try {
      const cart = await shopService.getMyCart();
      setCartCount(cart?.items?.length ?? 0);
      const cartItem = cart?.items?.find(item => item.product === productId);
      setQuantity(cartItem?.quantity ?? 1);
    } catch {
      setCartCount(0);
      setQuantity(1);
    }
  }, [productId]);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopService.getProductById(productId);
      setProduct(data);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load product',
        text2: error?.response?.data?.message ?? error?.message,
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, productId]);

  const loadRelatedProducts = useCallback(async (item?: ShopProduct | null) => {
    if (!item) {
      setRelated({loading: false, items: []});
      return;
    }

    setRelated(prev => ({...prev, loading: true}));
    try {
      const categoryId =
        typeof item.category === 'object' && item.category
          ? (item.category as any)._id
          : typeof item.category === 'string'
            ? item.category
            : undefined;

      const categoryRes = await shopService.getPublishedProducts({
        categoryId,
        sortBy: 'newest' as ProductSort,
        limit: 20,
      });

      const categoryCandidates = Array.isArray(categoryRes.products)
        ? categoryRes.products
        : [];

      let source = categoryCandidates;

      if (categoryCandidates.length <= 1) {
        const fallbackRes = await shopService.getPublishedProducts({
          sortBy: 'newest' as ProductSort,
          limit: 20,
        });
        source = Array.isArray(fallbackRes.products) ? fallbackRes.products : [];
      }

      const relatedItems = source.filter(p => p._id !== item._id).slice(0, 6);
      setRelated({loading: false, items: relatedItems});
    } catch {
      setRelated({loading: false, items: []});
    }
  }, []);

  useEffect(() => {
    loadProduct();
    loadCart();
  }, [loadProduct, loadCart]);

  useEffect(() => {
    if (product) {
      loadRelatedProducts(product);
    }
  }, [product, loadRelatedProducts]);

  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [loadCart]),
  );

  const handleInterested = async (id: string = productId) => {
    try {
      setSavingInterest(true);
      const response = await shopService.expressProductInterest(id);
      if (id === productId) {
        setInterestSaved(true);
      }
      Toast.show({
        type: 'success',
        text1: response?.message || 'Interest recorded',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save interest',
        text2: error?.response?.data?.message ?? error?.message,
      });
    } finally {
      setSavingInterest(false);
    }
  };

  const handleAddToCart = async (targetProductId: string = productId, qty = quantity) => {
    try {
      setAdding(true);
      const safeQty = Math.max(1, qty);

      const currentCart = await shopService.getMyCart();
      const currentCartItem = currentCart.items.find(item => item.product === targetProductId);

      if (currentCartItem) {
        await shopService.updateCartItem(targetProductId, safeQty);
      } else {
        await shopService.addToCart({productId: targetProductId, quantity: safeQty});
      }

      await loadCart();
      Toast.show({type: 'success', text1: 'Product added to cart'});
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Add to cart failed',
        text2: error?.response?.data?.message ?? error?.message,
      });
    } finally {
      setAdding(false);
    }
  };

  const categoryLabel = useMemo(() => {
    if (!product?.category) {
      return '';
    }
    if (typeof product.category === 'object') {
      return (product.category as any)?.title || (product.category as any)?.name || '';
    }
    return '';
  }, [product?.category]);

  const descriptionText = readString(product?.description);

  const featureBullets = useMemo(() => {
    if (!product) {
      return [] as string[];
    }
    return FEATURE_KEYS.map(key => readString((product as Record<string, unknown>)[key])).filter(
      Boolean,
    );
  }, [product]);

  const whatIsInTheBox = readString((product as any)?.whatIsInTheBox);
  const longDescription = readString((product as any)?.longDescription);
  const showLongDescription =
    !!longDescription && longDescription.toLowerCase() !== descriptionText.toLowerCase();

  const rawSpecs = useMemo(
    () => (Array.isArray(product?.specifications) ? product.specifications : []),
    [product?.specifications],
  );

  const customSpecs = useMemo(
    () =>
      rawSpecs
        .map(spec => ({
          label: formatSpecLabel(spec?.label),
          value: readString(spec?.value),
        }))
        .filter(spec => spec.label && spec.value),
    [rawSpecs],
  );

  const masterSpecs = useMemo(() => buildMasterSpecs(product), [product, buildMasterSpecs]);

  const combinedSpecs = useMemo(() => {
    const seen = new Set<string>();
    const result: ProductSpec[] = [];

    const append = (spec: ProductSpec) => {
      const key = normalizeSpecKey(spec.label);
      if (!key || key === 'category' || seen.has(key)) {
        return;
      }
      seen.add(key);
      result.push(spec);
    };

    masterSpecs.forEach(append);
    customSpecs.forEach(append);

    return result;
  }, [masterSpecs, customSpecs]);

  const detailSpecs = combinedSpecs.slice(0, 6);

  const shippingInfo =
    typeof product?.shippingInfo === 'string' ? product.shippingInfo.trim() : '';

  const processingSpec = customSpecs.find(spec =>
    normalizeSpecKey(spec.label).includes('processing'),
  );
  const deliverySpec = customSpecs.find(spec =>
    normalizeSpecKey(spec.label).includes('delivery'),
  );

  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];

  const isOutOfStock =
    typeof product?.stock === 'number' ? Number(product.stock) <= 0 : false;

  const getInitials = (name?: string) => {
    const text = (name || 'Anonymous').trim();
    if (!text) {
      return 'A';
    }
    const parts = text.split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(part => part[0]).join('').toUpperCase() || 'A';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <Text style={styles.emptyText}>Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={C.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <ShoppingCart color={C.text} size={20} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, {paddingBottom: 190 + insets.bottom}]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainImageWrap}>
          <Image
            source={{uri: activeImage || product.image}}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        {imageUrls.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbRow}
          >
            {imageUrls.map((url, idx) => {
              const isActive = activeImage === url;
              return (
                <TouchableOpacity
                  key={`${url}-${idx}`}
                  style={[styles.thumbButton, isActive && styles.thumbButtonActive]}
                  onPress={() => setActiveImage(url)}
                >
                  <Image source={{uri: url}} style={styles.thumbImage} resizeMode="cover" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {!!categoryLabel && (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{categoryLabel}</Text>
          </View>
        )}

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price}</Text>

        <Text style={styles.desc}>
          {descriptionText || 'No description available for this product.'}
        </Text>

        {featureBullets.length > 0 && (
          <View style={styles.featuresWrap}>
            {featureBullets.map((feature, idx) => (
              <View key={`${feature}-${idx}`} style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {detailSpecs.length > 0 && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Product Details</Text>
            {detailSpecs.map((spec, idx) => (
              <View key={`${spec.label}-${idx}`} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{spec.label}</Text>
                <Text style={styles.detailValue}>{spec.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              <Minus color={C.text} size={18} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(prev => prev + 1)}
            >
              <Plus color={C.text} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <View style={styles.tabsRow}>
            {[
              {key: 'description', label: 'Description'},
              {key: 'specs', label: 'Specifications'},
              {key: 'shipping', label: 'Shipping'},
              {key: 'reviews', label: 'Reviews'},
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab.key as ProductTab)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabContentWrap}>
            {activeTab === 'description' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionTitle}>About this product</Text>
                <Text style={styles.desc}>
                  {descriptionText || 'No description available for this product.'}
                </Text>

                {featureBullets.length > 0 && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>Key Features</Text>
                    {featureBullets.map((feature, idx) => (
                      <View key={`${feature}-desc-${idx}`} style={styles.featureRow}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!!whatIsInTheBox && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>What's in the box</Text>
                    <Text style={styles.desc}>{whatIsInTheBox}</Text>
                  </View>
                )}

                {showLongDescription && (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoCardTitle}>More details</Text>
                    <Text style={styles.desc}>{longDescription}</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'specs' && (
              <View style={styles.tabSection}>
                {combinedSpecs.length > 0 ? (
                  combinedSpecs.map((spec, idx) => (
                    <View key={`${spec.label}-all-${idx}`} style={styles.specCard}>
                      <Text style={styles.specLabel}>{spec.label}</Text>
                      <Text style={styles.specValue}>{spec.value}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.desc}>No specifications available.</Text>
                )}
              </View>
            )}

            {activeTab === 'shipping' && (
              <View style={styles.tabSection}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Shipping details</Text>
                  <Text style={styles.desc}>
                    {shippingInfo || 'No shipping information available.'}
                  </Text>
                </View>

                {(processingSpec?.value || deliverySpec?.value) && (
                  <View style={styles.shippingMetaRow}>
                    {!!processingSpec?.value && (
                      <View style={styles.shippingMetaCard}>
                        <Text style={styles.shippingMetaLabel}>{processingSpec.label}</Text>
                        <Text style={styles.shippingMetaValue}>{processingSpec.value}</Text>
                      </View>
                    )}
                    {!!deliverySpec?.value && (
                      <View style={styles.shippingMetaCard}>
                        <Text style={styles.shippingMetaLabel}>{deliverySpec.label}</Text>
                        <Text style={styles.shippingMetaValue}>{deliverySpec.value}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.tabSection}>
                {reviews.length > 0 ? (
                  reviews.map((review, idx) => {
                    const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
                    return (
                      <View key={`${review?.name || 'review'}-${idx}`} style={styles.reviewCard}>
                        <View style={styles.reviewHead}>
                          <View style={styles.reviewIdentity}>
                            <View style={styles.reviewAvatar}>
                              <Text style={styles.reviewAvatarText}>{getInitials(review?.name)}</Text>
                            </View>
                            <View>
                              <Text style={styles.reviewName}>{review?.name || 'Anonymous'}</Text>
                              {!!review?.createdAt && (
                                <Text style={styles.reviewDate}>
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.reviewStarsWrap}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={13}
                                color={star <= rating ? '#F4B942' : '#E5E5E5'}
                                fill={star <= rating ? '#F4B942' : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                        {!!review?.comment && (
                          <Text style={styles.reviewComment}>{review.comment}</Text>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.infoCard}>
                    <Text style={styles.desc}>No reviews yet.</Text>
                    <Text style={styles.desc}>Be the first to share your experience.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Pairs Well With</Text>

          {related.loading ? (
            <View style={styles.relatedLoaderWrap}>
              <ActivityIndicator size="small" color={C.accent} />
            </View>
          ) : related.items.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.relatedRow}>
                {related.items.map(item => {
                  const outOfStock =
                    typeof item.stock === 'number' ? Number(item.stock) <= 0 : false;

                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.relatedCard}
                      activeOpacity={0.92}
                      onPress={() => navigation.replace('ProductDetails', {productId: item._id})}
                    >
                      <Image
                        source={{uri: item.image}}
                        style={styles.relatedImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.relatedName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.relatedPrice}>${item.price}</Text>

                      <TouchableOpacity
                        style={[styles.relatedActionBtn, outOfStock && styles.relatedInterestedBtn]}
                        onPress={() =>
                          outOfStock ? handleInterested(item._id) : handleAddToCart(item._id, 1)
                        }
                      >
                        <Text
                          style={[
                            styles.relatedActionText,
                            outOfStock && styles.relatedInterestedText,
                          ]}
                        >
                          {outOfStock ? 'Interested' : '+ Cart'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.desc}>No related products found.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomCta, {paddingBottom: 36 + insets.bottom}]}> 
        {isOutOfStock ? (
          <TouchableOpacity
            style={[styles.interestedBtn, savingInterest && styles.actionBtnDisabled]}
            onPress={() => handleInterested()}
            disabled={savingInterest || interestSaved}
          >
            {savingInterest ? (
              <Loader2 size={18} color={C.accent} />
            ) : interestSaved ? (
              <CircleCheck size={18} color={C.accent} />
            ) : (
              <ShoppingCart size={18} color={C.accent} />
            )}
            <Text style={styles.interestedBtnText}>
              {savingInterest ? 'Saving...' : interestSaved ? 'Saved!' : 'Interested'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, adding && styles.actionBtnDisabled]}
            onPress={() => handleAddToCart()}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addBtnText}>Add to Cart</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: C.sub,
    fontFamily: 'Satoshi-Medium',
  },
  header: {
    marginTop: Platform.OS === 'android' ? 42 : 36,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    color: C.text,
    fontFamily: 'Satoshi-Bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  mainImageWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 4,
    backgroundColor: '#EFEFEF',
  },
  mainImage: {
    width: '100%',
    height: 320,
  },
  thumbRow: {
    marginTop: 12,
    gap: 10,
    paddingBottom: 4,
  },
  thumbButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  thumbButtonActive: {
    borderColor: C.accent,
    borderWidth: 2,
  },
  thumbImage: {
    width: 62,
    height: 62,
  },
  categoryPill: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: C.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryPillText: {
    color: C.accent,
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
  },
  name: {
    marginTop: 10,
    fontSize: 30,
    color: C.text,
    fontFamily: 'Satoshi-Bold',
  },
  price: {
    marginTop: 4,
    fontSize: 27,
    color: C.accent,
    fontFamily: 'Satoshi-Bold',
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: C.sub,
    fontFamily: 'Satoshi-Regular',
  },
  featuresWrap: {
    marginTop: 12,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 8,
  },
  featureText: {
    flex: 1,
    color: C.sub,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Satoshi-Regular',
  },
  detailsCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  detailsTitle: {
    fontSize: 14,
    color: C.text,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingVertical: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Satoshi-Medium',
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: C.text,
    fontFamily: 'Satoshi-Bold',
  },
  qtyRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    color: C.text,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    minWidth: 42,
    textAlign: 'center',
    color: C.text,
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  tabsWrap: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#F6F6F6',
    backgroundColor: '#FBFBFB',
  },
  tabBtn: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: 'Satoshi-Medium',
  },
  tabTextActive: {
    color: C.accent,
    fontFamily: 'Satoshi-Bold',
  },
  tabContentWrap: {
    padding: 14,
  },
  tabSection: {
    gap: 10,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontFamily: 'Satoshi-Bold',
  },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  infoCardTitle: {
    color: C.text,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 8,
  },
  specCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
  },
  specLabel: {
    color: C.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'Satoshi-Medium',
  },
  specValue: {
    color: C.text,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  shippingMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shippingMetaCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4DBE7',
    backgroundColor: C.accentSoft,
    padding: 12,
  },
  shippingMetaLabel: {
    color: C.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: 'Satoshi-Medium',
  },
  shippingMetaValue: {
    color: C.text,
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reviewIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4E7EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: C.accent,
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
  reviewName: {
    color: C.text,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  reviewDate: {
    color: '#9B9B9B',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Satoshi-Regular',
  },
  reviewStarsWrap: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: '#FFF7FA',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  reviewComment: {
    marginTop: 8,
    color: C.sub,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Satoshi-Regular',
  },
  relatedSection: {
    marginTop: 20,
  },
  relatedTitle: {
    color: C.text,
    fontSize: 22,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 12,
  },
  relatedLoaderWrap: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  relatedRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  relatedCard: {
    width: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 10,
  },
  relatedImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  relatedName: {
    color: C.text,
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  relatedPrice: {
    color: C.accent,
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
  },
  relatedActionBtn: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  relatedInterestedBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.accent,
  },
  relatedActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
  relatedInterestedText: {
    color: C.accent,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: 'rgba(250, 248, 246, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
  },
  interestedBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.accent,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  interestedBtnText: {
    color: C.accent,
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
});

export default ProductDetailsScreen;
