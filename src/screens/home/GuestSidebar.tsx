import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface GuestSidebarProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp;
  activeScreen: 'Home' | 'Shop' | 'Login' | 'Signup';
}

type GuestSidebarScreen = 'GuestHome' | 'GuestShop' | 'Login' | 'Signup';

interface MenuItem {
  id: 'Home' | 'Shop' | 'Login' | 'Signup';
  label: string;
  screen: GuestSidebarScreen;
}

const menuItems: MenuItem[] = [
  { id: 'Home', label: 'Home', screen: 'GuestHome' },
  // Temporarily removing Shop from the guest sidebar to focus on driving signups through the Home, Login, and Signup screens. Will re-add once we have more guest-facing content in the shop.
  // { id: 'Shop', label: 'Shop', screen: 'GuestShop' },
  { id: 'Login', label: 'Login', screen: 'Login' },
  { id: 'Signup', label: 'Signup', screen: 'Signup' },
];

const GuestSidebar: React.FC<GuestSidebarProps> = ({
  visible,
  onClose,
  navigation,
  activeScreen,
}) => {
  const handleNavigation = (screen: GuestSidebarScreen) => {
    onClose();
    navigation.navigate(screen);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Sidebar Content */}
        <View style={styles.sidebar}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>

              {/* Guest Profile Section */}
              <View style={styles.profileSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
                <Text style={styles.userName}>Guest Explorer</Text>
                <Text style={styles.guestSubtext}>
                  Join us to unlock all features
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      activeScreen === item.id && styles.menuItemActive,
                    ]}
                    onPress={() => handleNavigation(item.screen)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.menuText,
                        activeScreen === item.id && styles.menuTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {activeScreen === item.id && (
                      <View style={styles.activeIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Call to Action */}
              <View style={styles.ctaContainer}>
                <View style={styles.ctaCard}>
                  <Text style={styles.ctaTitle}>Ready to Start?</Text>
                  <Text style={styles.ctaDescription}>
                    Sign up now and unlock your wellness journey
                  </Text>
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => {
                      onClose();
                      navigation.navigate('AuthOptions');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ctaButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
        {/* Backdrop - closes sidebar when tapped */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 16,
    marginTop: 20,
    marginRight: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#494949',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#B95E82',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  guestSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#707070',
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 24,
    marginVertical: 8,
  },
  menuContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: '#FFF7F9',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#494949',
    fontFamily: 'Satoshi-Medium',
  },
  menuTextActive: {
    color: '#B95E82',
    fontWeight: '700',
    fontFamily: 'Satoshi-Bold',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B95E82',
  },
  ctaContainer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  ctaCard: {
    backgroundColor: '#FFF7F9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE5ED',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
    marginBottom: 4,
  },
  ctaDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#707070',
    fontFamily: 'Satoshi-Regular',
    marginBottom: 12,
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: '#B95E82',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Satoshi-Bold',
  },
});

export default GuestSidebar;