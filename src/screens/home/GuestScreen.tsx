import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../components/GradientBackground';
import { HomeImages } from '../../assets/images/home';
import { getUserRegion, getRegionDateFromISO } from '../../utils/timezoneUtils';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ExploreImages } from '../../assets/images/explore';
import GuestSidebar from './GuestSidebar';
import { ShopProduct, shopService } from '../../services/shopService';
import Toast from 'react-native-toast-message';
import { ShoppingCart } from 'lucide-react-native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface UserRegion {
  timezone: string;
  region: string;
}

const categories = [
  {
    id: 1,
    title: 'Yoga',
    source: ExploreImages.trending1,
    page: 'YogaDetails',
  },
  // Temporarily removing Fitness category as we currently don't have region-specific classes for it. Will re-add once we have the content ready.
  // {
  //   id: 2,
  //   title: 'Fitness Classes',
  //   source: ExploreImages.fitness,
  //   page: 'FitnessDetails',
  // },
  {
    id: 3,
    title: 'Diet & Nutrition',
    source: ExploreImages.diet,
    comingSoon: true,
  },
];

const GuestScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userRegion, setUserRegion] = useState<UserRegion | null>(null);
  const [isRegionLoading, setIsRegionLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<any[]>(categories);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [guestProducts, setGuestProducts] = useState<ShopProduct[]>([]);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const handleNavigate = () => {
    navigation.navigate('Login');
  };

  const syncCartState = (items?: Array<{ product: string; quantity: number }>) => {
    const nextItems = items ?? [];
    setCartCount(nextItems.length);
    const qtyMap = nextItems.reduce((acc, item) => {
      acc[item.product] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
    setCartQuantities(qtyMap);
  };

  const loadGuestCartCount = async () => {
    try {
      const cart = await shopService.getMyCart();
      syncCartState(cart?.items as any);
    } catch {
      setCartCount(0);
      setCartQuantities({});
    }
  };

  // Initialize user region on mount - critical for timezone handling
  useEffect(() => {
    try {
      const region = getUserRegion();
      setUserRegion(region);
    } catch (err) {
      console.error('❌ Failed to get user region:', err);
      // Fallback to UTC if region detection fails
      setUserRegion({ timezone: 'UTC', region: 'APAC' });
    } finally {
      setIsRegionLoading(false);
    }
  }, []);

  const handleClassPress = (classId: string) => {
    navigation.navigate(classId as any);
  };

  const handleTrendingCardPress = () => {
    setUnlockModalVisible(true);
  };

  const handleViewPackages = () => {
    setUnlockModalVisible(false);
    // Navigate to packages screen or show packages
    navigation.navigate('Login');
  };

  useEffect(() => {
    const loadGuestProducts = async () => {
      try {
        const response = await shopService.getPublishedProducts({
          page: 1,
          limit: 3,
          sortBy: 'newest',
        });
        setGuestProducts(response.products ?? []);
      } catch {
        setGuestProducts([]);
      }
    };

    loadGuestProducts();
    loadGuestCartCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadGuestCartCount();
    }, []),
  );

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

  const handleAddGuestProductToCart = async (productId: string) => {
    try {
      setAddingProductId(productId);
      const cart = await shopService.addToCart({ productId, quantity: 1 });
      syncCartState(cart?.items as any);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Unable to add product',
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
      syncCartState(cart?.items as any);
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
        syncCartState(cart?.items as any);
      } else {
        updateQuantityLocal(productId, nextQty);
        const cart = await shopService.updateCartItem(productId, nextQty);
        syncCartState(cart?.items as any);
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

  const DynamicSessionCard = ({ meeting }: any) => {
    const isComingSoon = meeting?.comingSoon;

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isComingSoon]}
        key={meeting.id}
        onPress={() => !isComingSoon && handleClassPress(meeting.page)}
        activeOpacity={0.7}
        disabled={isComingSoon}>
        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle}>{meeting.title}</Text>
          <Text style={styles.sessionSubtitle}>{meeting.subTitle}</Text>
        </View>

        <View>
          <Image
            source={meeting?.source}
            style={styles.sessionImage}
            resizeMode="cover"
          />

          {/* Overlay */}
          {isComingSoon && <View style={styles.comingSoonOverlay} />}

          {/* Badge */}
          {isComingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const DynamicClassCard = () => {
    return (
      <TouchableOpacity
        style={styles.classCard}
        activeOpacity={0.7}
        onPress={handleTrendingCardPress}>
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/shimmer.jpg',
          }}
          style={styles.classImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  };

  const UnlockModal = () => {
    return (
      <Modal
        visible={unlockModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnlockModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Yoga Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={HomeImages.getStartedImage}
                style={styles.modalIllustration}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>
              Unlock all classes &{'\n'}nutrition support
            </Text>

            {/* Subtitle */}
            <Text style={styles.modalSubtitle}>Start your journey today</Text>

            {/* View Packages Button */}
            <TouchableOpacity
              style={styles.viewPackagesButton}
              activeOpacity={0.8}
              onPress={handleViewPackages}>
              <Text style={styles.viewPackagesButtonText}>View Packages</Text>
            </TouchableOpacity>

            {/* Close Button (X) - Optional */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUnlockModalVisible(false)}
              activeOpacity={0.7}>
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>
          {/* Top Header with Menu and Search */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.hamburgerContainer}
              onPress={() => setSidebarVisible(true)}
              activeOpacity={0.7}>
              <Image
                source={HomeImages.hamburgerMenu}
                style={styles.hamburgerIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}></Text>
            <TouchableOpacity
              style={styles.searchContainer}
              onPress={handleNavigate}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* User Profile Section */}
          {
            <View style={styles.profileContainer}>
              <View style={styles.profileTextContainer}>
                <Text style={styles.greetingText}>Hello Explorer!</Text>
                <Text style={styles.subGreetingText}>
                  Discover your wellness journey{' '}
                </Text>
              </View>
            </View>
          }

          {/* Wellness Score Card */}
          {
            <View style={styles.wellnessCard}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreLeft}>
                  <Text style={styles.scoreText}>
                    You're exploring as a guest
                  </Text>

                  <Text style={styles.scoreSubText}>
                    Some features are locked. Upgrade to access everything!
                  </Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={HomeImages.getStartedImage}
                    style={styles.getStartedImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          }
          // popular products section for guest users - to drive engagement and conversions
          {/* <View style={styles.guestProductsSection}>
            <View style={styles.guestProductsHeader}>
              <Text style={styles.guestProductsTitle}>Popular Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate('GuestShop')}>
                <Text style={styles.guestProductsSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.guestProductsScroll}>
              {guestProducts.map(product => {
                const qty = cartQuantities[product._id] ?? 0;
                const busy = addingProductId === product._id;
                return (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.guestProductCard}
                    activeOpacity={0.85}
                    disabled={busy}
                    onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.guestProductImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.guestProductName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <View style={styles.guestProductBottomRow}>
                      <Text style={styles.guestProductPrice}>${product.price}</Text>

                      {qty > 0 ? (
                        <View style={styles.guestQtyWrap}>
                          <TouchableOpacity
                            style={[styles.guestQtyBtn, busy && styles.guestQtyBtnDisabled]}
                            disabled={busy}
                            onPress={event => {
                              event.stopPropagation();
                              handleDecrement(product._id, qty);
                            }}>
                            <Text style={styles.guestQtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.guestQtyValue}>{qty}</Text>
                          <TouchableOpacity
                            style={[styles.guestQtyBtn, busy && styles.guestQtyBtnDisabled]}
                            disabled={busy}
                            onPress={event => {
                              event.stopPropagation();
                              handleIncrement(product._id, qty);
                            }}>
                            <Text style={styles.guestQtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.guestAddBtn, busy && styles.guestAddBtnDisabled]}
                          disabled={busy}
                          onPress={event => {
                            event.stopPropagation();
                            handleAddGuestProductToCart(product._id);
                          }}>
                          {busy ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.guestAddBtnText}>+ Cart</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View> */}

          {/* Upcoming Sessions Results */}
          {upcomingMeetings.length > 0 && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { marginTop: 20, marginBottom: 10 },
                ]}>
                Upcoming Classes
              </Text>
              {upcomingMeetings.map((meeting, idx) => (
                <DynamicClassCard
                  key={meeting?._id ?? meeting?.id ?? meeting?.title ?? idx}
                />
              ))}
            </>
          )}

          {/* Normal View - Today's Sessions */}
          {todayMeetings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Find Your Flow, Every Day
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sessionsScroll}
                style={styles.sessionsContainer}>
                {todayMeetings.map((meeting, idx) => (
                  <DynamicSessionCard
                    key={meeting?._id ?? meeting?.id ?? meeting?.title ?? idx}
                    meeting={meeting}
                  />
                ))}
              </ScrollView>
            </>
          )}

          {/* Upcoming Classes Section */}
          {
            <View style={styles.upcomingSection}>
              <Text style={styles.upcomingTitle}>Trending for you</Text>
              {[1, 2, 3].map(item => (
                <DynamicClassCard key={item} />
              ))}
            </View>
          }
        </ScrollView>
      </SafeAreaView>

      {/* Guest Sidebar Menu */}
      <GuestSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeScreen="Home"
      />

      {cartCount > 0 && (
        <TouchableOpacity
          style={[
            styles.cartFab,
            {
              bottom:
                Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 12) +
                20,
            },
          ]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart color="#FFFFFF" size={20} strokeWidth={2} />
          <View style={styles.cartFabBadge}>
            <Text style={styles.cartFabBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Unlock Modal */}
      <UnlockModal />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  searchBarIcon: {
    width: 18,
    height: 18,
    tintColor: '#B95E82',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#494949',
    fontFamily: 'Satoshi-Regular',
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B95E82',
  },
  comingSoonText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#B95E82',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 18,
    color: '#B95E82',
    fontWeight: '600',
    paddingLeft: 8,
  },
  searchResultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#494949',
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#494949',
    fontFamily: 'Satoshi-Regular',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    marginBottom: 8,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 28,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
    fontSize: 15,
    color: '#494949',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  hamburgerContainer: {
    width: 36,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    width: 18,
    height: 12,
  },
  searchContainer: {
    width: 69,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#B95E82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileTextContainer: {
    marginLeft: 16,
  },
  greetingText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    color: '#494949',
  },
  subGreetingText: {
    marginTop: 4,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#050505',
  },
  wellnessCard: {
    width: '100%',
    height: 250,
    backgroundColor: '#B95E82',
    borderRadius: 12,
    paddingLeft: 22,
    paddingTop: 30,
    paddingRight: 12,
    marginBottom: 24,
    alignSelf: 'center',
  },
  wellnessTitle: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 14,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    flex: 1,
  },
  scoreLeft: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  scoreText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 26,
    width: 154,
    color: '#FFFFFF',
    marginTop: 6,
  },
  getStartedImage: {
    width: 215,
    height: 330,
  },
  scoreSubText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
    width: 187,
    marginTop: 14,
  },
  primaryButton: {
    marginTop: 14,
    width: 99,
    height: 28.78,
    backgroundColor: '#FFFFFF',
    borderRadius: 17.27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    lineHeight: 15,
    color: '#B95E82',
    textAlign: 'center',
  },
  imageContainer: {
    width: '45%',
    height: 189,
    marginTop: 0,
    marginRight: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 22,
    color: '#494949',
    maxWidth: 158,
  },
  viewAllText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 16,
    lineHeight: 16,
    color: '#B95E82',
    textAlign: 'center',
  },
  sessionsContainer: {
    marginHorizontal: -16,
  },
  sessionsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sessionCard: {
    width: 265,
    borderRadius: 12,
    borderColor: '#ECECEC',
    borderWidth: 1,
    borderStyle: 'solid',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    minHeight: 320,
    paddingBlock: 26,
    paddingInline: 15,
  },
  sessionImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    objectFit: 'cover',
  },
  sessionContent: {
    marginBottom: 19,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
  },
  sessionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#050505',
    marginTop: 3,
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#B95E82',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 19,
    marginBottom: 19,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrow: {
    fontSize: 24,
    marginBottom: 0,
    height: 10,
    width: 20,
    color: '#000000',
    fontWeight: '600',
  },
  upcomingSection: {
    marginTop: 40,
  },
  guestProductsSection: {
    marginTop: 16,
  },
  guestProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  guestProductsTitle: {
    fontSize: 18,
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
  },
  guestProductsSeeAll: {
    fontSize: 13,
    color: '#B95E82',
    fontFamily: 'Satoshi-Bold',
  },
  guestProductsScroll: {
    paddingRight: 6,
  },
  guestProductCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E6EB',
    padding: 10,
    marginRight: 10,
  },
  guestProductImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: '#F5F1EE',
  },
  guestProductName: {
    marginTop: 8,
    fontSize: 13,
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
  },
  guestProductPrice: {
    marginTop: 4,
    fontSize: 14,
    color: '#B95E82',
    fontFamily: 'Satoshi-Bold',
  },
  guestProductBottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestAddBtn: {
    minWidth: 64,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#B95E82',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  guestAddBtnDisabled: {
    opacity: 0.75,
  },
  guestAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
  guestQtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EED6E1',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  guestQtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B95E82',
  },
  guestQtyBtnDisabled: {
    opacity: 0.75,
  },
  guestQtyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    lineHeight: 16,
  },
  guestQtyValue: {
    minWidth: 26,
    textAlign: 'center',
    color: '#494949',
    fontSize: 13,
    fontFamily: 'Satoshi-Bold',
  },
  cartFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B95E82',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 7,
  },
  cartFabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EED6E1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartFabBadgeText: {
    color: '#B95E82',
    fontSize: 10,
    fontFamily: 'Satoshi-Bold',
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
    marginBottom: 16,
  },
  classCard: {
    width: '100%',
    height: 88,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  classImage: {
    width: '100%',
    height: 88,
  },
  classOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    bottom: 12,
    width: '93%',
    marginHorizontal: 12,
    height: 82,
    top: 'auto',
    left: 0,
    right: 0,
    borderRadius: 12,
  },
  classContent: {
    flex: 1,
  },
  className: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
  },
  classTime: {
    fontSize: 14,
    fontWeight: '400',
    color: '#050505',
    marginTop: 4,
  },
  classPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  weekActivitySection: {
    marginBottom: 28,
    marginTop: 47,
  },
  weekActivityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
    marginBottom: 16,
  },
  weekActivityCard: {
    backgroundColor: '#494949',
    borderRadius: 10,
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#FFF7DD',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B95E82',
    borderRadius: 8,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    display: 'flex',
  },
  dayButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#B95E82',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#707070',
  },
  dayButtonTextActive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 337,
    minHeight: 360,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    position: 'absolute',
    top: 32,
    width: 123,
    height: 123,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIllustration: {
    width: 123,
    height: 123,
  },
  modalTitle: {
    position: 'absolute',
    top: 188,
    width: 235,
    fontFamily: 'Satoshi-Bold',
    fontSize: 25,
    lineHeight: 30,
    textAlign: 'center',
    color: '#494949',
  },
  modalSubtitle: {
    position: 'absolute',
    top: 261,
    width: 146,
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  viewPackagesButton: {
    position: 'absolute',
    bottom: 41,
    width: '86%',
    maxWidth: 292,
    height: 53,
    backgroundColor: '#B95E82',
    borderRadius: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPackagesButtonText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 24,
    color: '#494949',
    fontWeight: '300',
  },
});

export default GuestScreen;