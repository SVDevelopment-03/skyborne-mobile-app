import React from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ProductsScreen from './ProductsScreen';
import { shopService } from '../../services/shopService';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type GuestShopNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GuestShop'
>;

const GuestShopScreen: React.FC = () => {
  const navigation = useNavigation<GuestShopNavigationProp>();

  React.useEffect(() => {
    shopService.setForceGuestMode(true);

    return () => {
      shopService.setForceGuestMode(false);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const backSubscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('GuestHome');
          }
          return true;
        },
      );

      return () => {
        backSubscription.remove();
      };
    }, [navigation]),
  );

  return <ProductsScreen showBottomNav={false} showBackButton />;
};

export default GuestShopScreen;
