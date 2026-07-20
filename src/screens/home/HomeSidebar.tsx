import React, { useState } from 'react';
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
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { LogOut as LogOutIcon } from 'lucide-react-native';
import LogoutModal from '../../components/LogoutModal';
import { removeAuthToken } from '../../services/authService';
import { notificationHistoryService } from '../../services/notificationHistoryService';
import { clearAllAppCache } from '../../store/clearCache';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../store/authSlice';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface HomeSidebarProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp;
  activeScreen: 'Home' | 'Schedule' | 'Explore' | 'Shop' | 'Profile';
  user?: {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
}

interface MenuItem {
  id: 'Home' | 'Schedule' | 'Explore' | 'Shop' | 'Profile';
  label: string;
  screen: 'Home' | 'Schedule' | 'Explore' | 'Products' | 'Profile';
}

const menuItems: MenuItem[] = [
  { id: 'Home', label: 'Home', screen: 'Home' },
  { id: 'Schedule', label: 'Schedule', screen: 'Schedule' },
  { id: 'Explore', label: 'Explore', screen: 'Explore' },
  { id: 'Shop', label: 'Shop', screen: 'Products' },
  { id: 'Profile', label: 'Profile', screen: 'Profile' },
];

const HomeSidebar: React.FC<HomeSidebarProps> = ({
  visible,
  onClose,
  navigation,
  activeScreen,
  user,
}) => {
  const dispatch = useDispatch();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0).toUpperCase() ?? '';
    const last = lastName?.charAt(0).toUpperCase() ?? '';
    return `${first}${last}`;
  };

  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogoutConfirm = async () => {
    await clearAllAppCache();
    await removeAuthToken();
    dispatch(logoutAction());
    setLogoutVisible(false);
    onClose();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };

  const handleNavigation = (
    screen: 'Home' | 'Schedule' | 'Explore' | 'Products' | 'Profile'
  ) => {
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
        {/* Sidebar Content - LEFT SIDE */}
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

              {/* User Profile Section */}
              <View style={styles.profileSection}>
                {user?.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(user?.firstName, user?.lastName)}
                    </Text>
                  </View>
                )}
                <Text style={styles.userName}>
                  {user?.firstName || 'Guest'} {user?.lastName || ''}
                </Text>
              </View>

              <View style={styles.divider} />

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
              <View style={styles.logoutContainer}>
                <TouchableOpacity
                  style={styles.logoutItem}
                  activeOpacity={0.7}
                  onPress={() => setLogoutVisible(true)}
                >
                  <Text style={styles.logoutText}>Logout</Text>
                  <LogOutIcon size={18} color="#B95E82" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>

        {/* Backdrop - RIGHT SIDE */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
      <LogoutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B95E82',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Satoshi-Bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#494949',
    fontFamily: 'Satoshi-Bold',
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
  logoutContainer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  logoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFF7F9',
  },

  logoutText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    color: '#B95E82',
  },
});

export default HomeSidebar;
