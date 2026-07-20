import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShoppingBag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomNav = ({
  active,
}: {
  active: 'Home' | 'Explore' | 'Products' | 'Schedule' | 'Profile';
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isCompact = width <= 360;
  const iconSize = isCompact ? 20 : 24;
  const labelStyle = isCompact ? styles.labelCompact : styles.label;
  const baseVerticalPadding = isCompact ? 8 : 12;
  const bottomInsetPadding =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, 0)
      : Math.max(insets.bottom, 20);

  return (
    <View
      style={[
        styles.bottomNavBar,
        {
          paddingTop: baseVerticalPadding,
          paddingBottom: baseVerticalPadding + bottomInsetPadding,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (active === 'Home') return;
          navigation.navigate('Home');
        }}
      >
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/home.png',
          }}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
        />
        <Text style={[active === 'Home' ? styles.active : styles.inactive, labelStyle]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (active === 'Explore') return;
          navigation.navigate('Explore');
        }}
      >
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/search.png',
          }}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
        />
        <Text style={[active === 'Explore' ? styles.active : styles.inactive, labelStyle]}>
          Explore
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (active === 'Schedule') return;
          navigation.navigate('Schedule');
        }}
      >
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/calender.png',
          }}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
        />
        
        <Text style={[active === 'Schedule' ? styles.active : styles.inactive, labelStyle]}>
          Schedule
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (active === 'Products') return;
          navigation.navigate('Products');
        }}
      >
        <ShoppingBag
          size={isCompact ? 20 : 22}
          color={active === 'Products' ? '#B95E82' : '#707070'}
          style={active === 'Products' ? undefined : styles.iconFaded}
        />
        <Text style={[active === 'Products' ? styles.active : styles.inactive, labelStyle]}>
          Shop
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          if (active === 'Profile') return;
          navigation.navigate('Profile');
        }}
      >
        <Image
          source={{
            uri: 'https://skyborne-images.s3.ap-south-1.amazonaws.com/user.png',
          }}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
        />
        <Text style={[active === 'Profile' ? styles.active : styles.inactive, labelStyle]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
    elevation: 14,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
  labelCompact: {
    fontSize: 11,
    marginTop: 2,
  },
  active: {
    color: '#B95E82',
    fontWeight: '500',
  },
  inactive: {
    color: '#707070',
    opacity: 0.4,
  },
  iconFaded: {
    opacity: 0.8,
  },
});

export default BottomNav;
